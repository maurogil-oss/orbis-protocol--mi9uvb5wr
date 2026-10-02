import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Zap,
  Server,
  Lock,
  Building,
  KeyRound,
  FileCode,
  Layers,
} from 'lucide-react'

export function ApiDocsNfsPage() {
  const [copiado, setCopiado] = useState<string | null>(null)

  const handleCopiar = (texto: string, rotulo: string) => {
    navigator.clipboard.writeText(texto)
    setCopiado(rotulo)
    setTimeout(() => setCopiado(null), 2500)
  }

  const endpointUrl = 'POST /backend/v1/nfs/lotes'

  const curlExemplo = `curl -X POST "https://www.orbis-protocol.com/backend/v1/nfs/lotes" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: orb_nfs_live_a1b2c3d4e5f60718293a4b5c6d7e8f90" \\
  -d '{
    "documentos": [
      {
        "nome_arquivo": "NFe_35240212345678000190550010000001231000001234.xml",
        "xml": "<nfeProc xmlns=\\"http://www.portalfiscal.inf.br/nfe\\"><NFe><infNFe Id=\\"NFe35240212345678000190550010000001231000001234\\"><ide><mod>55</mod><serie>1</serie><nNF>123</nNF><dhEmi>2026-03-15T10:30:00-03:00</dhEmi></ide><emit><CNPJ>12345678000190</CNPJ><xNome>MGM Agro Reciclagem Ltda</xNome></emit><dest><CNPJ>98765432000110</CNPJ><xNome>Cliente Destinatario SA</xNome></dest><total><ICMSTot><vNF>15000.00</vNF><vICMS>2700.00</vICMS><vPIS>247.50</vPIS><vCOFINS>1140.00</vCOFINS></ICMSTot></total><det nItem=\\"1\\"><prod><cProd>REC-01</cProd><xProd>Sucata de Aço Carbono Moída</xProd><NCM>72044900</NCM><qCom>5000</qCom><vUnCom>3.00</vUnCom><vProd>15000.00</vProd></prod></det></infNFe></NFe></nfeProc>"
      }
    ]
  }'`

  const payloadExemploCompleto = `{
  "documentos": [
    {
      "nome_arquivo": "NFe_000123.xml",
      "xml": "<nfeProc xmlns=\\"http://www.portalfiscal.inf.br/nfe\\">\\n  <NFe>\\n    <infNFe Id=\\"NFe35240212345678000190550010000001231000001234\\">\\n      <ide>\\n        <mod>55</mod>\\n        <serie>1</serie>\\n        <nNF>123</nNF>\\n        <dhEmi>2026-03-15T10:30:00-03:00</dhEmi>\\n      </ide>\\n      <emit>\\n        <CNPJ>12345678000190</CNPJ>\\n        <xNome>MGM Agro Reciclagem Ltda</xNome>\\n      </emit>\\n      <dest>\\n        <CNPJ>98765432000110</CNPJ>\\n        <xNome>Cliente Destinatario SA</xNome>\\n      </dest>\\n      <total>\\n        <ICMSTot>\\n          <vNF>15000.00</vNF>\\n          <vICMS>2700.00</vICMS>\\n          <vPIS>247.50</vPIS>\\n          <vCOFINS>1140.00</vCOFINS>\\n        </ICMSTot>\\n      </total>\\n      <det nItem=\\"1\\">\\n        <prod>\\n          <cProd>REC-01</cProd>\\n          <xProd>Sucata de Aço Carbono Moída</xProd>\\n          <NCM>72044900</NCM>\\n          <qCom>5000</qCom>\\n          <vUnCom>3.00</vUnCom>\\n          <vProd>15000.00</vProd>\\n        </prod>\\n      </det>\\n    </infNFe>\\n  </NFe>\\n</nfeProc>"
    }
  ]
}`

  const respostaSucesso = `{
  "sucesso": true,
  "status": "processado",
  "lote_id": "r8k2n9102js84kd",
  "cnpj_vinculado": "12345678000190",
  "total_recebidos": 1,
  "total_aceitos": 1,
  "total_rejeitados": 0,
  "documentos_aceitos": [
    {
      "indice": 0,
      "nfe_id": "v7m8p9q1w2e3r4t",
      "chave_acesso": "35240212345678000190550010000001231000001234",
      "numero_nota": "123",
      "serie": "1",
      "data_emissao": "2026-03-15T10:30:00-03:00",
      "cnpj_emitente": "12345678000190",
      "cnpj_destinatario": "98765432000110",
      "valor_total": 15000.00,
      "valor_pis": 247.50,
      "valor_cofins": 1140.00,
      "valor_icms": 2700.00,
      "qtd_itens": 1,
      "combustivel_detectado": null
    }
  ],
  "rejeicoes": []
}`

  const erro401Exemplo = `{
  "sucesso": false,
  "erro": "Chave de API ausente. Informe o header X-API-Key para autenticar a empresa remetente."
}`

  const erroSigiloExemplo = `{
  "sucesso": false,
  "status": "rejeitado",
  "lote_id": "b9x1m8p9q1w2e3r",
  "cnpj_vinculado": "12345678000190",
  "total_recebidos": 1,
  "total_aceitos": 0,
  "total_rejeitados": 1,
  "documentos_aceitos": [],
  "rejeicoes": [
    {
      "indice": 0,
      "chave_acesso": "35240299999999000199550010000001231000001234",
      "nome_arquivo": "NF_terceiro.xml",
      "cnpj_emitente": "99999999000199",
      "cnpj_destinatario": "88888888000188",
      "cnpj_chave": "12345678000190",
      "erro": "Violação de sigilo fiscal: o CNPJ da nota fiscal (emitente: 99.999.999/0001-99, destinatário: 88.888.888/0001-88) não coincide com o CNPJ vinculado à chave de API (12345678000190). Uma empresa não pode enviar NFs de terceiros."
    }
  ]
}`

  const erro429Exemplo = `{
  "sucesso": false,
  "erro": "Limite de 60 lotes por minuto excedido para esta chave de API. Tente novamente em instantes."
}`

  return (
    <div className="min-h-screen py-10 md:py-16 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC] transition-colors">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
        {/* Top Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(244,247,250,0.08)] pb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#93A3B5]">
            <Link to="/" className="hover:text-[#12B886] transition-colors">
              Orbis Protocol
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <Link to="/painel" className="hover:text-[#12B886] transition-colors">
              Hub Fiscal
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <span className="text-[#12B886] font-semibold">API de NFs v1</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#12B886]/15 border border-[#12B886]/40 text-[#12B886] text-[11px] font-mono font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12B886] animate-pulse" />
              API v1 • PRODUÇÃO ONLINE
            </span>
            <Link
              to="/painel"
              className="px-3 py-1 rounded-lg bg-[#16202B] hover:bg-[#12B886]/20 border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] hover:text-[#12B886] transition-all flex items-center gap-1 font-mono"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#12B886]" />
              <span>Gerenciar Chaves no Hub</span>
            </Link>
          </div>
        </div>

        {/* HERO INSTITUCIONAL */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-white dark:from-[#0E1A2E] dark:via-[#111827] dark:to-[#0E1A2E] border border-emerald-300 dark:border-[#059669]/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#12B886]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-xs font-mono font-bold uppercase tracking-wider">
              <Server className="w-3.5 h-3.5 text-[#12B886]" />
              <span>Especificação Técnica Oficial • Ingestão de Documentos Fiscais</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl text-[#F4F7FA] tracking-tight">
              API de NFs — Ingestão Direta via ERP
            </h1>

            <p className="text-base sm:text-lg text-[#12B886] font-medium leading-relaxed">
              Integração contínua de Notas Fiscais Eletrônicas (NF-e modelo 55 e NFC-e modelo 65)
              via HTTP REST. A empresa conecta seu ERP diretamente e os XMLs chegam sem upload
              manual.
            </p>

            <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed">
              Desenvolvida sob o mesmo padrão de segurança da API de Ingestão CDV do Orbis Protocol,
              a API de NFs permite que sistemas de faturamento, emissores e ERPs corporativos enviem
              lotes de XMLs prontos para processamento instantâneo no motor fiscal da plataforma,
              apurando créditos tributários (PIS, COFINS, ICMS, IPI e IBS/CBS da Reforma Tributária)
              e consumo energético/combustíveis com estrita conformidade ao sigilo fiscal e LGPD.
            </p>

            {/* Badges de Destaque */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="p-3 rounded-xl bg-[#0A0E12]/80 border border-[rgba(244,247,250,0.08)]">
                <span className="text-[10px] uppercase font-mono text-[#93A3B5] block">
                  Autenticação
                </span>
                <span className="font-mono text-xs font-bold text-[#12B886]">Header X-API-Key</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0E12]/80 border border-[rgba(244,247,250,0.08)]">
                <span className="text-[10px] uppercase font-mono text-[#93A3B5] block">
                  Taxa Limite
                </span>
                <span className="font-mono text-xs font-bold text-[#D9B36C]">60 lotes / min</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0E12]/80 border border-[rgba(244,247,250,0.08)]">
                <span className="text-[10px] uppercase font-mono text-[#93A3B5] block">
                  Sigilo Fiscal
                </span>
                <span className="font-mono text-xs font-bold text-[#F4F7FA]">Validação CNPJ</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0E12]/80 border border-[rgba(244,247,250,0.08)]">
                <span className="text-[10px] uppercase font-mono text-[#93A3B5] block">
                  Escopo v1
                </span>
                <span className="font-mono text-xs font-bold text-[#3B82F6]">Recepção de XMLs</span>
              </div>
            </div>
          </div>
        </div>

        {/* AVISO DE ESCOPO V1 */}
        <div className="p-5 rounded-2xl bg-[#16202B] border border-[#12B886]/40 flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-[#12B886] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-[#93A3B5] leading-relaxed">
            <strong className="text-[#F4F7FA] block text-sm font-heading font-bold">
              Escopo Homologado — Versão 1: Recepção de XMLs Próprios
            </strong>
            <p>
              Nesta versão 1, a API opera estritamente no modelo de{' '}
              <strong className="text-[#F4F7FA]">empurrar (push)</strong>: o ERP da própria empresa
              envia os arquivos XML de NF-e que já emitiu ou recebeu. Não há consulta ativa nem
              download automatizado direto na Receita Federal via esta rota. Para clientes que
              utilizam consulta retroativa com certificado A1 custodiado ou procuração e-CAC,
              utilize o Hub de Conexão Fiscal integrado.
            </p>
          </div>
        </div>

        {/* 1. AUTENTICAÇÃO */}
        <section id="autenticacao" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16202B] border border-[#12B886]/30 flex items-center justify-center text-[#12B886]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                1. Autenticação & Chaves de API
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Segurança com armazenamento irreversível por hash SHA-256 no banco de dados.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs leading-relaxed text-slate-600 dark:text-[#94A3B8]">
            <p>
              Toda chamada à API de NFs deve incluir o cabeçalho HTTP{' '}
              <code className="px-1.5 py-0.5 rounded bg-[#0A0E12] border border-[#12B886]/40 font-mono text-[#12B886] font-bold">
                X-API-Key
              </code>
              . As chaves de acesso começam com o prefixo{' '}
              <code className="font-mono text-[#D9B36C]">orb_nfs_live_</code> e são vinculadas
              estritamente ao CNPJ da empresa titular cadastrada.
            </p>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
              <span className="text-[10px] uppercase font-mono text-[#D9B36C] font-bold block">
                Exemplo de Cabeçalho HTTP:
              </span>
              <div className="font-mono text-xs text-[#F4F7FA] bg-[#111820] p-2.5 rounded-lg border border-[rgba(244,247,250,0.06)]">
                X-API-Key: orb_nfs_live_a1b2c3d4e5f60718293a4b5c6d7e8f90
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 space-y-1.5">
                <div className="flex items-center gap-2 text-[#12B886] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Hash Criptográfico SHA-256</span>
                </div>
                <p className="text-[11px] text-[#93A3B5]">
                  A plataforma Orbis Protocol{' '}
                  <strong>nunca armazena sua chave em texto puro</strong>. No banco de dados,
                  guardamos apenas o hash SHA-256. Por essa razão, a chave completa é exibida uma
                  única vez no momento da geração.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] space-y-1.5">
                <div className="flex items-center gap-2 text-[#D9B36C] font-bold">
                  <KeyRound className="w-4 h-4" />
                  <span>Geração e Revogação no Painel</span>
                </div>
                <p className="text-[11px] text-[#93A3B5]">
                  Acesse o{' '}
                  <Link to="/painel" className="text-[#12B886] underline font-medium">
                    Hub de Conexão Fiscal (Modelo 4)
                  </Link>
                  . Se a chave for comprometida, clique em &quot;Regenerar Chave&quot; ou
                  &quot;Revogar Chave&quot; — a revogação tem efeito imediato.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. SIGILO FISCAL E VALIDAÇÃO DE CNPJ */}
        <section id="sigilo-fiscal" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16202B] border border-[#D9B36C]/30 flex items-center justify-center text-[#D9B36C]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                2. Sigilo Fiscal & Regra de CNPJ Vinculado
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Proteção legal estrita (LC nº 105/2001 e LGPD): empresas só podem ingerir suas
                próprias notas.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4 text-xs text-[#93A3B5] leading-relaxed">
            <p>
              Para assegurar o sigilo fiscal e a integridade da trilha pericial, o backend valida
              automaticamente cada nota fiscal enviada no lote:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1">
                <strong className="text-[#12B886] block text-xs">Nota de Saída (Emitente)</strong>
                <span>
                  O CNPJ do emitente da NF-e coincide com o CNPJ vinculado à chave de API.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1">
                <strong className="text-[#12B886] block text-xs">
                  Nota de Entrada (Destinatário)
                </strong>
                <span>
                  O CNPJ do destinatário da NF-e coincide com o CNPJ vinculado à chave de API.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1">
                <strong className="text-[#D9B36C] block text-xs">Mesma Raiz / Filiais</strong>
                <span>
                  Filiais com os mesmos 8 primeiros dígitos da matriz são aceitas automaticamente.
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#F03E54]">
              ⚠️ Documentos onde nem o emitente nem o destinatário possuem vínculo com o CNPJ da
              chave são rejeitados individualmente com mensagem detalhada de violação de sigilo
              fiscal.
            </p>
          </div>
        </section>

        {/* 3. ENDPOINT DA API */}
        <section id="endpoint" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16202B] border border-[#12B886]/30 flex items-center justify-center text-[#12B886]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                3. Endpoint & Especificação do Payload
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Recebimento em lote com até 100 XMLs por requisição.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
              <div className="flex items-center gap-3 font-mono">
                <span className="px-2.5 py-1 rounded bg-[#12B886] text-[#0A0E12] font-extrabold text-xs">
                  POST
                </span>
                <span className="text-sm font-bold text-[#F4F7FA] break-all">
                  /backend/v1/nfs/lotes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#93A3B5]">Content-Type: application/json</span>
              </div>
            </div>

            {/* Exemplo cURL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#93A3B5]">
                  Exemplo de Requisição (cURL)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopiar(curlExemplo, 'curl')}
                  className="text-xs text-[#12B886] hover:underline flex items-center gap-1 font-mono"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiado === 'curl' ? 'Copiado!' : 'Copiar cURL'}</span>
                </button>
              </div>
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] overflow-x-auto">
                <pre className="text-xs text-[#12B886] font-mono leading-relaxed select-all">
                  {curlExemplo}
                </pre>
              </div>
            </div>

            {/* Formato JSON do Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#93A3B5]">
                  Estrutura JSON do Payload
                </span>
                <button
                  type="button"
                  onClick={() => handleCopiar(payloadExemploCompleto, 'payload')}
                  className="text-xs text-[#12B886] hover:underline flex items-center gap-1 font-mono"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiado === 'payload' ? 'Copiado!' : 'Copiar JSON'}</span>
                </button>
              </div>
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] overflow-x-auto">
                <pre className="text-xs text-[#F4F7FA] font-mono leading-relaxed select-all">
                  {payloadExemploCompleto}
                </pre>
              </div>
            </div>

            {/* Dicionário de Campos */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-sm text-[#F4F7FA]">
                Parâmetros do Payload:
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[rgba(244,247,250,0.1)] text-[#93A3B5] uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Campo</th>
                      <th className="py-2 px-3">Tipo</th>
                      <th className="py-2 px-3">Obrigatório</th>
                      <th className="py-2 px-3">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA]">
                    <tr>
                      <td className="py-2 px-3 font-mono text-[#12B886]">documentos</td>
                      <td className="py-2 px-3 font-mono text-[#93A3B5]">Array</td>
                      <td className="py-2 px-3 font-bold text-[#12B886]">Sim</td>
                      <td className="py-2 px-3">
                        Lista de até 100 documentos fiscais por lote (aceita também os aliases{' '}
                        <code>lote</code>, <code>nfs</code> ou <code>xmls</code>).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-[#12B886]">documentos[].xml</td>
                      <td className="py-2 px-3 font-mono text-[#93A3B5]">String</td>
                      <td className="py-2 px-3 font-bold text-[#12B886]">Sim</td>
                      <td className="py-2 px-3">
                        Conteúdo completo em texto puro do XML assinado da NF-e/NFC-e (leiaute SEFAZ
                        com tag &lt;infNFe&gt;).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-[#12B886]">
                        documentos[].nome_arquivo
                      </td>
                      <td className="py-2 px-3 font-mono text-[#93A3B5]">String</td>
                      <td className="py-2 px-3 text-[#93A3B5]">Opcional</td>
                      <td className="py-2 px-3">
                        Nome identificador do arquivo XML original enviado pelo ERP.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 4. RESPOSTAS E EXEMPLOS */}
        <section id="respostas" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16202B] border border-[#12B886]/30 flex items-center justify-center text-[#12B886]">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                4. Códigos de Resposta & Exemplos
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Respostas estruturadas com discriminação individual de aceites e rejeições.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Sucesso 201 */}
            <div className="p-6 rounded-2xl bg-[#111820] border border-[#12B886]/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#12B886] text-[#0A0E12] font-bold font-mono text-xs">
                    HTTP 201 Created
                  </span>
                  <span className="text-xs font-bold text-[#F4F7FA]">
                    Lote Processado com Sucesso
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopiar(respostaSucesso, 'res201')}
                  className="text-xs text-[#12B886] hover:underline font-mono"
                >
                  {copiado === 'res201' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] overflow-x-auto">
                <pre className="text-xs text-[#12B886] font-mono leading-relaxed select-all">
                  {respostaSucesso}
                </pre>
              </div>
            </div>

            {/* Rejeição por Sigilo Fiscal */}
            <div className="p-6 rounded-2xl bg-[#111820] border border-[#D9B36C]/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#D9B36C] text-[#0A0E12] font-bold font-mono text-xs">
                    HTTP 201 / Parcial
                  </span>
                  <span className="text-xs font-bold text-[#F4F7FA]">
                    Rejeição por Violação de Sigilo Fiscal
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopiar(erroSigiloExemplo, 'resSigilo')}
                  className="text-xs text-[#D9B36C] hover:underline font-mono"
                >
                  {copiado === 'resSigilo' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] overflow-x-auto">
                <pre className="text-xs text-[#D9B36C] font-mono leading-relaxed select-all">
                  {erroSigiloExemplo}
                </pre>
              </div>
            </div>

            {/* Erro 401 */}
            <div className="p-6 rounded-2xl bg-[#111820] border border-[#F03E54]/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#F03E54] text-white font-bold font-mono text-xs">
                    HTTP 401 Unauthorized
                  </span>
                  <span className="text-xs font-bold text-[#F4F7FA]">
                    Chave de API Ausente ou Inválida
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] overflow-x-auto">
                <pre className="text-xs text-[#F03E54] font-mono leading-relaxed select-all">
                  {erro401Exemplo}
                </pre>
              </div>
            </div>

            {/* Erro 429 */}
            <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#D9B36C] text-[#0A0E12] font-bold font-mono text-xs">
                    HTTP 429 Too Many Requests
                  </span>
                  <span className="text-xs font-bold text-[#F4F7FA]">
                    Limite de 60 Lotes/minuto Excedido
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] overflow-x-auto">
                <pre className="text-xs text-[#D9B36C] font-mono leading-relaxed select-all">
                  {erro429Exemplo}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* 5. DÚVIDAS E SUPORTE */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#16202B] border border-[#12B886]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
              Precisa homologar seu ERP com a API Orbis Protocol?
            </h3>
            <p className="text-xs text-[#93A3B5]">
              Nossa equipe técnica oferece suporte direto aos desenvolvedores e times de TI
              corporativos.
            </p>
          </div>
          <Link
            to="/painel"
            className="px-5 py-2.5 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs uppercase tracking-wider hover:bg-[#0CA678] transition-all flex items-center justify-center gap-2 shadow-emerald-glow shrink-0"
          >
            <span>Acessar Hub de Conexão Fiscal</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
