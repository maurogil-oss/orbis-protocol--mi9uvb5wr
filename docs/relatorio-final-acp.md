# Relatório Final e Entrega do Piloto ACP — Orbis Protocol (Etapas 1 a 7)

**Data de Conclusão Técnica:** 2026-03-20  
**Escopo:** Piloto Institucional com a Associação Comercial do Paraná (ACP)  
**Ambiente:** Skip Cloud (PocketBase) + Vite / React / TypeScript / Tailwind CSS  
**Norma Metodológica:** DM-ORB-001 v1.1 — Diretriz Metodológica de Prova Documental da Economia Circular e Descarbonização

---

## 1. Sumário Executivo

O presente documento consolida a execução integral do plano de engenharia de software e conformidade pericial (Etapas 1 a 7) desenvolvido para viabilizar o piloto conjunto entre o **Orbis Protocol** e a **Associação Comercial do Paraná (ACP)**. O projeto estabelece a infraestrutura digital para rastreabilidade de emissões de Escopo 3, circularidade de materiais e prova documental de descarbonização voltada a empresas associadas da ACP, garantindo rigor metodológico, isolamento estrito de dados e conformidade com a LGPD.

---

## 2. Consolidação por Etapa (Etapas 1 a 7)

### Etapa 1 — Auditoria Inicial e Diagnóstico de Conformidade

- **O que foi encontrado e feito:**
  - Auditoria profunda da árvore de código e arquitetura de dados, gerando o relatório pericial inicial (`docs/auditoria-etapa1-acp.md`).
  - Mapeamento das regras de captura de NF-e, motores de emissões, fatores de emissão canônicos e interfaces de governança.
  - Identificação das necessidades de isolamento entre participantes e alinhamento com a diretriz de k-anonimato para relatórios da ACP.
- **Como testar:**
  - Leitura do documento `docs/auditoria-etapa1-acp.md` e verificação das referências de código mapeadas.
- **Pendências/Riscos conhecidos:** Nenhum impeditivo remanescente nesta etapa; serviu como baseline para as etapas subsequentes.

### Etapa 2 — Captura e Ingestão Fiscal de NF-e

- **O que foi feito:**
  - **Peça 2a:** Deduplicação estrita de chave de acesso (44 dígitos com validação de DV módulo 11), bloqueando reprocessamento indevido.
  - **Peça 2b:** Detecção automática e recusa fundamentada de NF-e cancelada na SEFAZ (via evento de cancelamento `tpEvento 110111` ou protocolo `cStat 101`).
  - **Peça 2c:** Tratamento explícito de devoluções (CFOPs 1.2xx, 5.2xx, 1.4xx, 5.4xx), desconsiderando-as do cômputo de pegada de carbono.
  - **Peça 2d:** Persistência integral de todos os itens da nota fiscal (eliminado corte arbitrário anterior de 15 itens) e tratamento de itens sem fator com flag explícita `naoCalculado: true` e emissão estritamente `0,000 tCO2e` (proibido fallback arbitrário).
  - **Peça 2e:** Custódia de XML original com hash criptográfico SHA-256 e amarração pericial.
- **Como testar:**
  - Execução dos testes automatizados:
    - `src/services/__tests__/nfeCancelamentoDevolucaoService.test.ts`
    - `src/services/__tests__/nfeDuplicidadeService.test.ts`
    - `src/services/__tests__/nfeItensNaoCalculadoECompletos.test.ts`
    - `src/services/__tests__/nfeCustodiaIntegracao.test.ts`
- **Pendências/Riscos conhecidos:**
  - **Consulta online em tempo real à SEFAZ não implementada nesta fase:** O sistema depende do XML completo fornecido pelo usuário/emissor contendo protocolo `protNFe` ou eventos `procEventoNFe`. A integração via webservice SEFAZ em tempo real requer certificado A1 e credenciais governamentais ativas do emitente.

### Etapa 3 — Cálculo de Emissões, Memória Pericial e Fatores

- **O que foi feito:**
  - **Peça 3a:** Conversão explícita de unidades físicas de entrada (toneladas multiplicadas por 1.000, gramas divididas por 1.000, quilogramas mantidos) com gravação de fórmula textual legível na memória pericial; recusa de unidades incompatíveis com massa (ex.: UN, CX) que são marcadas como não calculadas.
  - **Peça 3b:** Versionamento de catálogo de fatores oficiais canônicos (`catalogoFatoresOficiais.ts`) com importação/exportação CSV pericial, preservando snapshots imutáveis em lotes já emitidos e amarrados aos hashes.
  - **Peça 3c:** Formulário complementar de dados para declaração de hipóteses de transporte, energia e destinação.
  - **Peça 3d:** Aplicação do rótulo "ESTIMATIVA" e explicitação das limitações metodológicas em relatórios e atestados que não utilizem dados primários auditados.
- **Como testar:**
  - Execução dos testes automatizados:
    - `src/services/__tests__/nfeConversaoUnidadesMemoria.test.ts`
    - `src/services/__tests__/fatoresVersionadosService.test.ts`
    - `src/services/__tests__/catalogoFatores.test.ts`
    - `src/services/__tests__/nfeAntiDuplaContagemEstimativa.test.ts`
- **Pendências/Riscos conhecidos:**
  - Variações regionais de fatores secundários requerem contínua atualização por comitê pericial quando houver revisões de normas internacionais (worldsteel, IAI, ICA).

### Etapa 4 — Parceria ACP e Co-branding Regional

- **O que foi feito:**
  - **Peça 4a:** Identidade visual e co-branding ACP (marca, selos e paleta institucional) sincronizados em tempo real via eventos do navegador.
  - **Peça 4b:** Definição do papel de usuário `admin_acp`, garantindo governança exclusiva para gestores da associação comercial.
  - **Peça 4c:** Sistema de convites por link parametrizado e token criptográfico para onboarding de empresas associadas com prefixo `ORB-ACP`.
  - **Peça 4d:** Painel de indicadores agregados da ACP (`/painel-acp` e `/bureau-acp`) com aplicação rigorosa da **Regra de k-anonimato (mínimo de 3 empresas ativas para liberar exibição de emissões tCO2e)** para evitar desanonimização dedutiva, e exportação em PDF e CSV sob a Opção B (sem fatores abertos ou dados nominais).
- **Como testar:**
  - Execução dos testes automatizados:
    - `src/services/__tests__/acpConvitesService.test.ts`
    - `src/services/__tests__/acpIndicadoresService.test.ts`
    - `src/pages/__tests__/acpCobrandingEAdminAcpGovernanca.test.ts`
    - `src/pages/__tests__/conviteAcpFluxo.test.ts`
    - `src/pages/__tests__/painelAcpIndicadoresAgregados.test.ts`
- **Pendências/Riscos conhecidos:**
  - **Disparo automático de e-mail de convite da ACP aguarda configuração de credenciais SMTP de produção:** Atualmente o fluxo entrega link copiável e disparável manualmente pelo gestor.

### Etapa 5 — LGPD, Termos de Uso e Isolamento de Dados

- **O que foi feito:**
  - **Peça 5a:** Telas de `/privacidade`, `/termos` e consentimento LGPD explícito no cadastro (versão v1.0 — 2026-02), registrando timestamp, versão aceita e IP do titular no usuário e na trilha de auditoria.
  - **Peça 5b:** Auditoria e reforço das API Rules do PocketBase/Skip Cloud (migração `0123_reforcar_api_rules_acp_e_empresas.js`), assegurando isolamento de lotes (`cdv_lotes`) e peças (`cdv_pecas`) estritamente ao CNPJ da empresa proprietária e impedindo acesso de `admin_acp` a dados brutos de notas ou fornecedores individuais de outras empresas.
- **Como testar:**
  - Execução dos testes automatizados:
    - `src/pages/__tests__/consentimentoLgpdETermos.test.ts`
    - `src/services/__tests__/termoConsentimentoService.test.ts`
    - `src/services/__tests__/apiRulesIsolamentoAcp.test.ts`
- **Pendências/Riscos conhecidos (OBRIGATÓRIO DESTACAR):**
  - **Peça 5c NÃO EXECUTADA nesta fase:** Auditoria de logs centralizada em nível de infraestrutura, criptografia de campos em repouso no banco de dados (além do hash SHA-256 já implementado na aplicação), confirmação formal do certificado HTTPS no domínio customizado e política automatizada de backups de infraestrutura no host externo da ACP/provedor de nuvem são requisitos de sustentação e segurança que precisam ser contratados/homologados antes do go-live definitivo.
  - **Revisão jurídica obrigatória:** Os textos da Política de Privacidade e dos Termos de Uso foram estruturados do ponto de vista de produto/LGPD, mas demandam homologação prévia do departamento jurídico da ACP antes do lançamento oficial.

### Etapa 6 — Performance, Otimização Mobile e Acessibilidade (WCAG AA)

- **O que foi feito:**
  - Otimização do CSS e padronização global do anel de foco acessível (`:focus-visible`) conforme critérios de conformidade WCAG AA.
  - Inclusão da Associação Comercial do Paraná na seção institucional de parceiros da home page com logotipo acessível, descrição do piloto e links institucionais.
  - Garantia de responsividade de cabeçalho, tabelas e modais sem truncamentos em dispositivos móveis.
- **Como testar:**
  - Execução dos testes automatizados:
    - `src/pages/__tests__/etapa6PerformanceDesign.test.ts`
    - `src/components/__tests__/headerDesktopResponsive.test.ts`
    - `src/components/__tests__/headerMobileThemeToggle.test.ts`
- **Pendências/Riscos conhecidos:** Monitoramento contínuo de Core Web Vitals no ambiente de produção da Skip Cloud sob carga real.

### Etapa 7 — Testes Consolidados, Dados de Demonstração e Entrega

- **O que foi feito:**
  - **Consolidação de Testes:** Criação da suíte `src/services/__tests__/nfeEtapa7ConsolidacaoTestes.test.ts`, unificando a verificação de ponta a ponta: parser de NF-e, conversão explícita de unidades, cálculo de emissões, tratamento de notas canceladas, descarte de devoluções e tratamento de itens não calculados.
  - **Dados de Demonstração Anonimizados:** Módulo `src/services/dadosDemoAcpService.ts` com 1 Lote Didático ACP (`ORB-ACP-DEMO-2026-001`) e 3 notas fiscais fictícias completas, contemplando materiais com fatores canônicos oficiais (Aço 2,18, Cobre 4,10, Alumínio 14,40), itens em tonelada e itens não calculados. Integrado com a flag global `isLoteDemo` e aviso visual obrigatório `DEMO`.
  - **Suíte de Testes dos Dados Demo:** `src/services/__tests__/dadosDemoAcpService.test.ts` garantindo que os dados didáticos não interferem em lotes de clientes reais.
  - **Documentação Final:** Emissão deste relatório técnico `docs/relatorio-final-acp.md`.
- **Como testar:**
  - Execução de `npm run test` cobrindo todas as suítes da Etapa 7.
- **Pendências/Riscos conhecidos:** Nenhuma pendência impeditiva no ambiente de desenvolvimento.

---

## 3. Registro Obrigatório de Pendências e Riscos Conhecidos

Conforme diretriz do projeto e transparência técnica, as seguintes pendências **permanecem em aberto e NÃO foram concluídas nem devem ser prometidas como prontas sem homologação adicional**:

1. **Peça 5c não executada nesta fase:**
   - Logs de auditoria centralizados em SIEM/infraestrutura dedicada.
   - Criptografia de dados sensíveis em repouso diretamente no banco de dados.
   - Confirmação formal do certificado TLS/HTTPS para domínios de terceiros e política formalizada de backups com retenção off-site.
2. **Envio automático de e-mail de convite ACP aguardando SMTP de produção:**
   - O fluxo de convites gera os tokens criptográficos e links co-branded com sucesso, porém o disparo automático via e-mail depende do fornecimento e credenciamento de um servidor SMTP institucional autenticado da ACP.
3. **Revisão jurídica dos textos de LGPD antes do piloto:**
   - A minuta de Política de Privacidade e Termos de Uso (v1.0 — 2026-02) precisa ser formalmente revisada e aprovada pelo corpo jurídico da ACP antes do início das operações com associados.
4. **Consulta online à SEFAZ não implementada nesta fase:**
   - A captura fiscal opera por importação direta de XML ou DANFE (com agente de extração e custódia de hash SHA-256). Consultas automáticas diretamente aos webservices estaduais da SEFAZ exigem integração com infraestrutura de certificados corporativos A1 não inclusa no escopo atual.

---

## 4. Checklist Prático de Go-Live do Piloto ACP

Para que o piloto seja ativado publicamente com os associados da ACP, a equipe gestora deve cumprir o seguinte checklist operacional:

| Item                                     | Área Responsável        | Status Pré-Piloto | Ação Necessária                                                                                            |
| :--------------------------------------- | :---------------------- | :---------------- | :--------------------------------------------------------------------------------------------------------- |
| **Revisão Jurídica LGPD**                | Jurídico ACP / DPO      | Pendente          | Validar termos de `/privacidade` e `/termos` e autorizar versão v1.0.                                      |
| **Configuração de Servidor SMTP**        | TI ACP / Infraestrutura | Pendente          | Configurar host SMTP, porta, usuário e senha para disparo de convites co-branded.                          |
| **Credenciais de Cobrança PagBank**      | Financeiro ACP / Orbis  | Pendente          | Inserir tokens de produção do PagBank se houver cobrança imediata de associados no plano pago.             |
| **Confirmação HTTPS e Backups**          | TI / Infraestrutura     | Pendente          | Auditar apontamento DNS do domínio oficial e rotina de backup do Skip Cloud / PocketBase.                  |
| **Separação de Dados Demo vs. Reais**    | Operação / Perícia      | Concluído         | Garantir que operadores utilizem a tag `DEMO` nos testes e que dados reais usem chaves fiscais autênticas. |
| **Credenciamento de Gestores admin_acp** | Governança Orbis        | Pronto            | Criar o primeiro usuário com papel `admin_acp` e repassar credenciais ao comitê da ACP.                    |
| **Validação da Regra de k-Anonimato**    | Perícia Técnica         | Concluído         | Confirmar que indicadores agregados do Bureau ACP só aparecem com $\ge 3$ associados ativos.               |

---

## 5. Conclusão da Entrega

A plataforma Orbis Protocol encontra-se tecnicamente capacitada para a realização do piloto com a Associação Comercial do Paraná, provendo rastreabilidade íntegra de insumos industriais, cálculo pericial de emissões conforme a norma DM-ORB-001 v1.1 e ferramentas de governança co-branded exclusivas para a ACP.
