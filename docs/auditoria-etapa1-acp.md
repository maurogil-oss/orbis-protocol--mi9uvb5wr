# Auditoria Orbis Protocol — Etapa 1 (Piloto ACP, sem IoT)

Data: auditoria realizada por leitura de código e schema. **Nenhuma linha de código foi alterada nesta etapa.**
Escopo das próximas etapas (não implementadas aqui): Etapa 2 captura NF-e (XML/validação/logs) · Etapa 3 cálculo (fatores CSV, unidades, ESTIMATIVA) · Etapa 4 ACP (co-branding, perfis, painel agregado) · Etapa 5 LGPD/segurança · Etapa 6 performance/design · Etapa 7 testes/go-live.

## 1. Arquitetura

Existe:

- SPA React + Vite + TS + Tailwind/shadcn; backend PocketBase gerenciado (Skip Cloud) com migrações JS em `pocketbase/migrations/` e lógica server em `pb_hooks`. Cliente único `src/lib/pocketbase/client.ts`; espelho de schema `src/lib/pocketbase/schema.json`.
- ~60 rotas em `src/App.tsx` com `useSeo` (título único por rota); guarda de rota por papel em `src/components/ProtectedRoute.tsx`; redirecionamento pós-login por papel.
- Camada de serviços extensa e coberta por testes (`src/**/__tests__/`); CI no GitHub (lint → typecheck → testes → build).

Falta / risco:

- Sem documento de arquitetura único; a memória do projeto e comentários de header fazem esse papel.

## 2. Fluxo de captura de NF-e

Existe — 2 fluxos:

1. **XML determinístico (principal para o piloto):** `src/pages/PainelCliente.tsx` (upload múltiplo ≤ 5 MB, XML/JSON/txt) → `src/services/modelosFiscaisParser.ts` → `processarDocumentoFiscal()` com `DOMParser`. Suporta 10 modelos (NF-e 55, NFC-e 65, NFS-e, CT-e, MDF-e, NF3e, NFCom, BP-e, CT-e OS, fatura de água). Extrai chave (do atributo `Id`), número, série, emissão, emitente/destinatário (CNPJ/CPF/xNome), totais (ICMS/IPI/PIS/COFINS/IBS/CBS) e itens: `cProd`, `xProd`, **NCM, CFOP, uCom, qCom, vUnCom, vProd**. Grava na coleção `nfe_upload`.
2. **Leitura assistida PDF/imagem via agente:** `FormularioIngestaoLoteLeituraNfe.tsx` + `leitorNotaFiscalService.ts` → rota `/backend/v1/cdv/leitura-nota` (agente nativo `triador-ingestao-cdv`). Sugestões nunca gravam sem confirmação humana; procedência por campo registrada. O seletor aceita `.xml`, mas nesse fluxo o arquivo vai ao agente — **não há parse determinístico de XML aqui**.

Validação de chave: `src/services/validadorFiscalChave.ts` — 44 dígitos + DV módulo-11 SEFAZ + hash SHA-256. O parser NF-e rejeita o documento quando o DV não confere.

**Consulta por chave de acesso / status de autorização na SEFAZ: NÃO EXISTE.** Nenhuma consulta a SEFAZ; nada distingue nota autorizada/cancelada/denegada — o XML é aceito por conteúdo autodeclarado.

Tratamentos atuais (estado real):

- **Nota cancelada:** não tratado — nenhum parser lê `retEvento`/`procCancNFe`; nota cancelada enviada é contabilizada normalmente.
- **Devolução:** CFOP é capturado, mas não há lógica de CFOP de devolução (1.2xx/5.2xx/1.4xx/5.4xx) — somam como operação normal.
- **Duplicidade:** no fluxo `nfe_upload` **não há unique index em `chave_acesso`** nem check prévio ao `create` — mesma nota pode ser importada 2×. O bloqueio de dupla contagem existe apenas no fluxo de lotes CDV: `verificarDuplicidadeDocumental()` (`cdvEngineV2.ts` §5.4 — colisão por chave NF-e/hash SHA-256/MTR entre lotes custodiados, zerando o evitado e gerando `audit_entry`), usado no Sandbox e no motor de lotes, **não** no upload de notas do PainelCliente.
- **Unidades divergentes:** `uCom` é armazenado; não há conversão (t/L/m³/kWh → kg) nem verificação `qCom × vUnCom` vs `vProd`.
- **Campos ausentes:** `parseNumber` retorna 0 silenciosamente; parsers NF3e/CTe injetam defaults sintéticos (`'Concessionária de Energia'`, `'NF3E'+Date.now()`) quando o nó falta.
- `resumo_itens_json` persiste **somente os 15 primeiros itens** (`slice(0, 15)`) — perda silenciosa em notas grandes.
- O XML original não é custodiado como lastro (só campos extraídos) — fragiliza auditoria/perícia.
- Parser roda no navegador; não há revalidação server-side (DV, duplicidade) no fluxo de notas.

## 3. Módulo de cálculo e fatores de emissão

Existe:

- Motor determinístico `src/services/cdvEngineV2.ts` (DM-ORB-001): `evitado = massa_kg × fe_ref × LI × DF − PE_alocado`; PE rateado por massa; refrigerantes com GWP AR6 (R-134a 1.530 / R-1234yf 0,50); incerteza por soma em quadratura (u_FE por peça, u_massa ±1% balança / ±10% estimado); tiers T1–T4; segregação fóssil/biogênico; **memória de cálculo por item** (`pecas_detalhes` + `fatores_snapshot` com fator, fonte, vigência, versão, data de publicação, fronteira, incerteza, flags `indicativo`/`bloqueado_atestado`).
- Fatores: catálogo canônico `src/services/catalogoFatoresOficiais.ts` (aço 2,18 worldsteel; alumínio 14,40 IAI 2024; cobre 4,10 ICA; polímeros com flag; lã de rocha proxy pendente; "outros" 1,5 conservador), mesclado com registro do gestor master (`catalogoFatoresDmrvService.ts`, com importação CSV). `/fatores` público sem valores; catálogo completo + CSV pericial restritos ao master.

Falta / risco:

- **Item sem fator:** o motor mapeia material desconhecido para "outros" (1,5 kgCO₂e/kg) e calcula normalmente — suposição silenciosa no nível do lote (conservadora e tier T1, mas não é "não calculado"). A camada de relatório (`dmrvEmissoesService.ts`) rotula materiais "em estruturação" como "rastreada, sem CO₂e atribuído" (fator 0), porém via palavras-chave (soja, grão, biomassa) e categorias agro — não genericamente para todo item sem fator.
- **Conversão de unidades inexistente** — a fórmula só aceita kg (gap Etapa 3).
- **Rotulagem ESTIMATIVA:** existe em contexts específicos (RLO/curbside em `destinacaoFinalService.ts`, reservas pré-laudo) e na separação confirmado/potencial, mas o produto de pegada por nota **não carrega rótulo ESTIMATIVA nem limitações metodológicas** (gap Etapa 3).
- Importação CSV de fatores sem validação visível de vigência/geografia/ano no merge; fallback hardcoded do motor pode mascarar fator não configurado.

## 4. Banco de dados

- Coleções principais (schema.json): `users`, `leads_diagnostico`, `selos`, `nfe_upload`, `cdv_lotes`, `cdv_pecas`, `lgpd_solicitacoes`, `lgpd_retencoes`, histórico de consultas, fatores, licenças, cobrança.
- Índices únicos corretos onde importa (`leads_diagnostico.cnpj`, `selos.codigo_selo`, `cdv_pecas.selo_dpp`, LGPD protocolo/retenção).
- **Falta:** unique index em `nfe_upload.chave_acesso`; **API rules (ACL) por coleção não auditadas neste run** — pendência Etapa 5.

## 5. Autenticação e isolamento

- Login PocketBase com `authStore`; `AuthContext` com papéis (gestor master, cliente, perito…) e redirect pós-login por papel; `ProtectedRoute` por papel; política de senha própria (`passwordPolicy.ts`, testada); rate limit linkado no login; troca de senha testada.
- Isolamento por CNPJ: filtros de front consultam por `cnpj`/owner — **a garantia real depende das API rules do PocketBase (não auditadas)**.
- Certificado A1 processado por extrator; chave de API guardada como hash+máscara. Verificação de A1 em repouso fica para a Etapa 5.

## 6. Logs e auditoria

- `auditService`, `demoAuditService`, `historicoConsultasService`, `auditoriaIntegridadeService` (verifica duplicidade de inventários e de chaves de acesso — teste dedicado), `audit_entry` no motor §5.4.
- Logs de runtime do backend disponíveis via Skip Cloud (não consultados nesta etapa — nenhum incidente reportado).

## 7. LGPD

- Existe: `lgpd_solicitacoes`/`lgpd_retencoes` (protocolo único, retenção por tipo), `lgpdService`, consentimento do perito completo (`BlocoConsentimentoPeritoLgpd` + testes), `PreferenciasEmailPage` com opt-out, `Privacidade`, `TermosUso`, Canal do Titular.
- Falta: consentimento LGPD **no cadastro do cliente final** (RegistroPage) não confirmado neste run; consentimento para dados fiscais de terceiros (emitente/destinatário da NF-e) não tratado.

## 8. Co-branding ACP

- Não existe co-branding configurável ainda. Há `BureauACP.tsx`, `ModeloAcpPage`, deck comercial em `/proposta-reminera` e `parceirosService`. Papel `cliente_acp`, convites e painel agregado: **não implementados** (Etapa 4).

## 9. Front-end

- SEO: 60 rotas com título único (QA verde). Tema claro/escuro com toggle testado. Testes de responsividade de header existem.
- **Performance:** sem medições (LCP/CLS/INP não medidos — exigência "antes e depois" da Etapa 6).
- **A11y:** parcial — sem auditoria WCAG AA sistemática.
- **Fluxograma circular mobile:** não encontrado componente dedicado (gap Etapa 6).

---

## Lista consolidada — bugs / riscos de segurança / lacunas

Bugs:

1. Duplicidade de NF-e possível em `nfe_upload` (sem unique index nem check) — risco direto de dupla contagem no produto de pegada.
2. Nota cancelada aceita e somada (sem tratamento de eventos de cancelamento).
3. Devolução (CFOP) não tratada — soma como operação normal.
4. `parseNumber` zera silenciosamente campos malformados; parsers NF3e/CTe injetam defaults sintéticos.
5. Só os 15 primeiros itens são persistidos por nota.
6. Item sem fator cai no fallback "outros" 1,5 kgCO₂e/kg sem marcação "não calculado" no motor (exceção: palavras-chave agro no relatório).

Riscos de segurança: 7. Parser fiscal no cliente; sem revalidação server-side de DV/chave/duplicidade no fluxo de notas. 8. API rules (ACL) das coleções não auditadas — isolamento por CNPJ pode ser só de front-end. 9. XML original da NF-e não custodiado (lastro fraco para perícia). 10. Sem consulta SEFAZ — sistema não distingue autorizada/cancelada/denegada.

Lacunas (por etapa futura): 11. Sem conversão de unidades (Etapa 3). 12. Sem rotulagem ESTIMATIVA + limitações metodológicas no produto por nota (Etapa 3). 13. Importação CSV de fatores sem validação de vigência/fonte/geografia/ano (Etapa 3). 14. Sem formulário complementar de transporte/origem (Etapa 3). 15. Sem co-branding ACP, papel `cliente_acp`, convites, painel agregado (Etapa 4). 16. Consentimento LGPD no cadastro de cliente não confirmado (Etapa 5). 17. Sem métricas de performance, a11y AA, fluxograma mobile (Etapa 6). 18. Sem suíte de testes do parser NF-e com dados anonimizados de exemplo (Etapa 7; os XMLs sintéticos atuais são bom ponto de partida).

## Perguntas pendentes

1. O piloto deve validar status de autorização via SEFAZ/InfoSimples? (`infosimplesService` existe — quais credenciais/limite de custo?)
2. NF-e sem peso: item fica "não calculado" ou usa fallback "outros"?
3. `cliente_acp` já existe como papel no backend ou será criado na Etapa 4?
4. O consentimento LGPD no cadastro do cliente (RegistroPage) já está implementado? (não verificado)
5. Há política de API rules por coleção documentada fora do código? (verificar na Etapa 5)
6. O XML da NF-e deve ser custodiado como lastro a partir da Etapa 2?
