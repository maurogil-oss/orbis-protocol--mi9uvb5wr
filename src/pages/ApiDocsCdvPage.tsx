import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Code2,
  KeyRound,
  Zap,
  ShieldCheck,
  Check,
  Copy,
  Radio,
  FileCode,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  Terminal,
  AlertTriangle,
  Server,
  Workflow,
  Leaf,
  Scale,
  Car,
  QrCode,
  FileCheck2,
  ChevronRight,
  Info,
} from 'lucide-react'
import { FATORES_CDV_MATERIAIS } from '@/services/cdvService'

interface CodeBlockProps {
  title?: string
  language?: string
  code: string
}

function CodeBlock({ title, language = 'json', code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[rgba(244,247,250,0.12)] bg-[#070A0D]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0E151D] border-b border-[rgba(244,247,250,0.08)]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F03E54]/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#D9B36C]/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#12B886]/70" />
          {title && (
            <span className="font-mono text-xs text-[#93A3B5] ml-2 font-medium">{title}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {language && (
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#16202B] text-[#93A3B5]">
              {language}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#16202B] hover:bg-[#12B886]/20 text-[#93A3B5] hover:text-[#12B886] transition-all flex items-center gap-1.5"
            title="Copiar código"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#12B886]" />
                <span className="text-[#12B886]">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono text-[#12B886] leading-relaxed selection:bg-[#12B886]/30 selection:text-white">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function ApiDocsCdvPage() {
  const [activeTab, setActiveTab] = useState<'payload' | 'curl'>('payload')

  const curlExemplo = `curl -X POST "https://www.orbis-protocol.com/backend/v2/cdv/lotes" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: orb_cdv_live_SEU_TOKEN_HEX_32_CHARS" \\
  -d '{
    "cdv": {
      "nome": "CDVerde Centro de Desmontagem Veicular",
      "cnpj": "76.123.456/0001-00",
      "codigo": "DETRAN-PR-CDV-0089",
      "responsavel_crea": "CREA-PR 182.940/D - Eng. Marcelo Brandão"
    },
    "veiculo_doador": {
      "marca_modelo": "Volkswagen Gol 1.6 8V Total Flex",
      "chassi": "9BWAA05U0DP991204",
      "placa": "BAX-9912",
      "baixa_detran": "PR-BX-2026-991204",
      "seguradora_sinistro": "Porto Seguro Cia de Seguros"
    },
    "pecas": [
      {
        "sku": "PART-GOL-CAPO-01",
        "descricao": "Capô Dianteiro Original com Vedação Acústica",
        "material": "Aço",
        "peso_kg": 10.0,
        "ncm": "8708.29.99"
      },
      {
        "sku": "PART-GOL-ALT-02",
        "descricao": "Alternador 90A com Bobinamento de Cobre",
        "material": "Cobre",
        "peso_kg": 2.5,
        "ncm": "8511.50.10"
      },
      {
        "sku": "PART-GOL-PARA-03",
        "descricao": "Parachoque Dianteiro Termoplástico Injetado",
        "material": "Polímeros",
        "peso_kg": 4.0,
        "ncm": "8708.10.00"
      }
    ],
    "destinacao": [
      { "sku": "PART-GOL-CAPO-01", "status": "vendida", "evidencia": "NF-e 1234" },
      { "sku": "PART-GOL-ALT-02", "status": "reciclada", "evidencia": "MTR 4410" }
    ],
    "origem": "erp"
  }'`

  const payloadCompleto = `{
  "cdv": {
    "nome": "CDVerde Centro de Desmontagem Veicular",
    "cnpj": "76.123.456/0001-00",
    "codigo": "DETRAN-PR-CDV-0089",
    "responsavel_crea": "CREA-PR 182.940/D - Eng. Marcelo Brandão"
  },
  "veiculo_doador": {
    "marca_modelo": "Volkswagen Gol 1.6 8V Total Flex",
    "chassi": "9BWAA05U0DP991204",
    "placa": "BAX-9912",
    "baixa_detran": "PR-BX-2026-991204",
    "seguradora_sinistro": "Porto Seguro Cia de Seguros"
  },
  "pecas": [
    {
      "sku": "PART-GOL-CAPO-01",
      "descricao": "Capô Dianteiro Original com Vedação Acústica",
      "material": "Aço Laminado Automotivo",
      "peso_kg": 14.5,
      "ncm": "8708.29.99",
      "responsavel_crea": "CREA-PR 182.940/D"
    },
    {
      "sku": "PART-GOL-ALT-02",
      "descricao": "Alternador 90A com Bobinamento de Cobre",
      "material": "Cobre / Alumínio Elétrico",
      "peso_kg": 5.2,
      "ncm": "8511.50.10"
    },
    {
      "sku": "PART-GOL-PARA-03",
      "descricao": "Parachoque Dianteiro Termoplástico Injetado",
      "material": "Polipropileno Automotivo (PP/EPDM)",
      "peso_kg": 3.8,
      "ncm": "8708.10.00"
    }
  ],
  "origem": "erp"
}`

  const respostaSucesso = `{
  "sucesso": true,
  "lote_id": "h1dpr8wniludemh",
  "cdv_origem": "DETRAN-PR-CDV-0089",
  "veiculo_doador": {
    "marca_modelo": "Volkswagen Gol 1.6 8V Total Flex",
    "baixa_detran": "PR-BX-2026-991204",
    "chassi_mascarado": "9BWAA05U***204",
    "seguradora_sinistro": "Porto Seguro Cia de Seguros"
  },
  "totais": {
    "peso_kg": 16.5,
    "co2e_evitado_liquido_total_kg": 12.87,
    "evitado_confirmado_kg": 10.59,
    "evitado_potencial_kg": 2.28,
    "incerteza_analitica_pct": 2.64,
    "metodologia": "DM-ORB-001 v1.1 (DF=0,30, L_i=1,0)"
  },
  "pecas": [
    {
      "sku": "PART-GOL-CAPO-01",
      "selo_dpp": "PR-SEAL-2026-991823",
      "peso_kg": 10.0,
      "evitado_liquido_kg": 6.54,
      "status_claim": "confirmado",
      "hash_sha256": "a35639641ad5c2cbfb275bfbb04d607fe13d07bf83be0ea3413da747d95d10b7"
    },
    {
      "sku": "PART-GOL-ALT-02",
      "selo_dpp": "PR-SEAL-2026-991824",
      "peso_kg": 2.5,
      "evitado_liquido_kg": 4.05,
      "status_claim": "confirmado",
      "hash_sha256": "a4b75ebff3a5ffccf90e9d6d5c64b5478440cc077755f1f77432f8373b9e4ec3"
    },
    {
      "sku": "PART-GOL-PARA-03",
      "selo_dpp": "PR-SEAL-2026-991825",
      "peso_kg": 4.0,
      "evitado_liquido_kg": 2.28,
      "status_claim": "potencial",
      "hash_sha256": "439223bbaf4ceb996843c0d7f9509df6eb10f225576a7e0cc96236b2837bc216"
    }
  ],
  "claims": [
    { "sku": "PART-GOL-CAPO-01", "status": "confirmado" },
    { "sku": "PART-GOL-ALT-02", "status": "confirmado" },
    { "sku": "PART-GOL-PARA-03", "status": "potencial" }
  ]
}`

  const erro400Exemplo = `{
  "sucesso": false,
  "erro": "Payload incompleto. Campos obrigatórios: cdv, veiculo_doador (marca_modelo, baixa_detran) e pecas (array não vazio).",
  "payload_exemplo": {
    "cdv": { "nome": "CDVerde", "cnpj": "76.123.456/0001-00", "codigo": "DETRAN-PR-CDV-0089" },
    "veiculo_doador": {
      "marca_modelo": "Volkswagen Gol 1.6 8V",
      "chassi": "9BWAA05U0DP999204",
      "placa": "BAX-9912",
      "baixa_detran": "PR-BX-2026-991204",
      "seguradora_sinistro": "Porto Seguro"
    },
    "pecas": [
      {
        "sku": "PART-SND-CAPO-01",
        "descricao": "Capô",
        "material": "Aço",
        "peso_kg": 14.5,
        "ncm": "8708.29.99"
      }
    ]
  }
}`

  const erro401Exemplo = `{
  "sucesso": false,
  "erro": "Chave de API ausente. Informe o header X-API-Key para autenticar o CDV remetente."
}`

  const erro429Exemplo = `{
  "sucesso": false,
  "erro": "Limite de 60 lotes por minuto excedido para esta chave de API. Tente novamente em instantes."
}`

  const webhookPayloadExemplo = `{
  "id": "evt_b83k2n9102js84kd",
  "evento": "lote_cdv_recebido",
  "timestamp": "2026-04-18T14:32:01.428Z",
  "ambiente": "production",
  "versao_api": "2025-01",
  "dados": {
    "lote_id": "h1dpr8wniludemh",
    "codigo_lote": "PR-BX-2026-991204",
    "origem_cdv": "DETRAN-PR-CDV-0089",
    "veiculo_modelo": "Volkswagen Gol 1.6 8V Total Flex",
    "veiculo_ano": 2024,
    "quantidade_pecas": 3,
    "total_kg_evitados_co2": 76.63,
    "hash_integridade_lote": "c1f7da379120c99a63200be64917d23a41bf372134e79247f12eef47d3c01823"
  }
}`

  const loteTesteMinimo = `{
  "cdv": {
    "nome": "CDV Homologação Piloto",
    "cnpj": "12.345.678/0001-90",
    "codigo": "DETRAN-PILOTO-001"
  },
  "veiculo_doador": {
    "marca_modelo": "Fiat Strada 1.4 Fire Flex",
    "baixa_detran": "PR-BX-2026-HOMOLOG-01",
    "placa": "ABC-1234",
    "chassi": "9BD178226G8123456"
  },
  "pecas": [
    {
      "sku": "HOMOLOG-PORTA-01",
      "descricao": "Porta Dianteira Esquerda Sem Acessórios",
      "material": "Aço Laminado",
      "peso_kg": 18.0,
      "ncm": "8708.29.99"
    },
    {
      "sku": "HOMOLOG-BLOCO-02",
      "descricao": "Cabeçote do Motor em Alumínio",
      "material": "Alumínio Automotivo",
      "peso_kg": 9.5,
      "ncm": "8409.91.90"
    }
  ],
  "origem": "manual_api"
}`

  return (
    <div className="min-h-screen py-10 md:py-16 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC] transition-colors">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
        {/* Breadcrumb / Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(244,247,250,0.08)] pb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#93A3B5]">
            <Link to="/" className="hover:text-[#12B886] transition-colors">
              Orbis Protocol
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <Link to="/solucoes/case-cdverde" className="hover:text-[#12B886] transition-colors">
              CDVerde
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <span className="text-[#12B886] font-semibold">Documentação da API v2</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#12B886]/15 border border-[#12B886]/40 text-[#12B886] text-[11px] font-mono font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12B886] animate-pulse" />
              API v2 • VIGENTE (DM-ORB-001 v1.1)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-mono font-bold">
              v1 DEPRECADA (410 GONE)
            </span>
            <Link
              to="/painel"
              className="px-3 py-1 rounded-lg bg-[#16202B] hover:bg-[#12B886]/20 border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] hover:text-[#12B886] transition-all flex items-center gap-1 font-mono"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#12B886]" />
              <span>Console de APIs</span>
            </Link>
          </div>
        </div>

        {/* 1. HERO INSTITUCIONAL & VISÃO GERAL */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-white dark:from-[#0E1A2E] dark:via-[#111827] dark:to-[#0E1A2E] border border-emerald-300 dark:border-[#059669]/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#12B886]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-xs font-mono font-bold uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5 text-[#12B886]" />
              <span>Especificação Técnica Oficial • dMRV Circular</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl text-[#F4F7FA] tracking-tight">
              API v2 — Desmontagem Veicular
            </h1>

            <p className="text-base sm:text-lg text-[#12B886] font-medium leading-relaxed">
              Ingestão automatizada de lotes de peças desmontadas, emissão instantânea de
              Passaportes Digitais de Peça (DPP), auditoria com hash SHA-256 verificável e
              consolidação pública.
            </p>

            <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed">
              Esta é a primeira especificação do <strong>Hub de APIs Orbis Protocol</strong>,
              desenhada sob medida para os Centros de Desmontagem Veicular (CDVs homologados pelo
              DETRAN/Lei Mover) e seus ERPs de desmontagem e lojas virtuais. No futuro, o hub
              expandirá para os demais setores produtivos certificados (têxtil, embalagens, metais e
              baterias).
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
                  Integridade
                </span>
                <span className="font-mono text-xs font-bold text-[#F4F7FA]">SHA-256 Canônico</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0E12]/80 border border-[rgba(244,247,250,0.08)]">
                <span className="text-[10px] uppercase font-mono text-[#93A3B5] block">
                  Saída Pública
                </span>
                <span className="font-mono text-xs font-bold text-[#3B82F6]">
                  /passaporte-lote/:id
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. AUTENTICAÇÃO */}
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
              Toda chamada à API deve incluir a chave no cabeçalho HTTP{' '}
              <code className="px-1.5 py-0.5 rounded bg-[#0A0E12] border border-[#12B886]/40 font-mono text-[#12B886] font-bold">
                X-API-Key
              </code>
              . As chaves de acesso começam com o prefixo{' '}
              <code className="font-mono text-[#D9B36C]">orb_cdv_live_</code> e são vinculadas
              estritamente ao CNPJ do CDV homologado.
            </p>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
              <span className="text-[10px] uppercase font-mono text-[#D9B36C] font-bold block">
                Exemplo de Cabeçalho HTTP:
              </span>
              <div className="font-mono text-xs text-slate-900 dark:text-[#F8FAFC] bg-slate-50 dark:bg-[#0A1628] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                X-API-Key: orb_cdv_live_a1b2c3d4e5f60718293a4b5c6d7e8f90
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 space-y-1.5">
                <div className="flex items-center gap-2 text-[#12B886] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Armazenamento Criptográfico Seguro</span>
                </div>
                <p className="text-[11px] text-[#93A3B5]">
                  A plataforma Orbis Protocol{' '}
                  <strong>nunca armazena sua chave em texto puro</strong>. No banco de dados,
                  guardamos apenas o hash SHA-256 da chave. Por essa razão, a chave completa é
                  exibida uma única vez no momento da geração.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] space-y-1.5">
                <div className="flex items-center gap-2 text-[#D9B36C] font-bold">
                  <Terminal className="w-4 h-4" />
                  <span>Onde Gerar ou Regenerar</span>
                </div>
                <p className="text-[11px] text-[#93A3B5]">
                  Acesse o{' '}
                  <Link to="/painel" className="text-[#12B886] underline font-medium">
                    Console de APIs no Painel do Cliente
                  </Link>
                  . Se a chave for comprometida, basta clicar em &quot;Regenerar Chave&quot; — a
                  anterior será revogada instantaneamente e a nova entrará em vigor em segundos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. RATE LIMIT */}
        <section id="rate-limit" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16202B] border border-[#D9B36C]/30 flex items-center justify-center text-[#D9B36C]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                2. Rate Limit & Políticas de Tráfego
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Capacidade dimensionada para alto volume de desmontagens diárias com proteção contra
                rajadas.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs text-slate-600 dark:text-[#94A3B8]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#D9B36C] font-bold block">
                  Limite por Chave de API:
                </span>
                <span className="font-mono text-lg font-bold text-[#F4F7FA]">
                  60 lotes por minuto por CDV
                </span>
              </div>
              <div className="text-right text-[11px]">
                <span className="text-[#12B886] font-bold block">
                  Equivalente a 3.600 veículos / hora
                </span>
                <span className="text-[#93A3B5]">Janela deslizante de 60 segundos</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-heading font-bold text-sm text-[#F4F7FA]">
                Comportamento ao atingir o limite (HTTP 429 Too Many Requests):
              </h3>
              <p className="leading-relaxed">
                Caso seu ERP ou script exceda 60 lotes na janela de 1 minuto, a API responderá com o
                status HTTP <code className="text-[#F03E54] font-mono font-bold">429</code> e a
                mensagem{' '}
                <em className="text-[#F4F7FA]">
                  &quot;Limite de 60 lotes por minuto excedido para esta chave de API. Tente
                  novamente em instantes.&quot;
                </em>
                .
              </p>
              <div className="p-3 rounded-lg bg-[#16202B] border border-[rgba(244,247,250,0.08)] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
                <span className="text-[11px]">
                  <strong>Recomendação de Integração:</strong> Implemente política de{' '}
                  <strong className="text-[#F4F7FA]">retry com backoff exponencial</strong>{' '}
                  (aguardar 1s, 2s, 4s...) ao interceptar status 429. Como cada lote pode conter
                  dezenas de peças de um mesmo veículo doador, agrupar peças por lote é a prática
                  ótima recomendada.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. ENDPOINT DE INGESTÃO DE LOTES */}
        <section id="endpoint-ingestao" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16202B] border border-[#12B886]/30 flex items-center justify-center text-[#12B886]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                3. Endpoint de Ingestão de Lotes CDV
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Processa o veículo doador, calcula fatores de emissão evitada, emite selos PR-SEAL e
                grava o DPP.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Endpoint Method & URL */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/30">
              <div className="flex items-center gap-3 font-mono">
                <span className="px-2.5 py-1 rounded bg-[#12B886] text-[#0A0E12] font-black text-xs">
                  POST
                </span>
                <span className="text-sm font-bold text-[#F4F7FA]">/backend/v2/cdv/lotes</span>
              </div>
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs">
                <strong>Atenção:</strong> O endpoint legado <code>POST /backend/v1/cdv/lotes</code>{' '}
                foi <span className="font-bold underline">descontinuado com HTTP 410 Gone</span>.
                Migre todas as integrações de ERP para a rota <code>/backend/v2/cdv/lotes</code>{' '}
                (motor DM-ORB-001 v1.1 com DF=0,30, L_i=1,0 e proteção inter-CDVs).
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#93A3B5]">
                <span>Content-Type:</span>
                <span className="text-[#12B886]">application/json</span>
              </div>
            </div>

            {/* Alternador Payload / cURL */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.08)] pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('payload')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      activeTab === 'payload'
                        ? 'bg-[#12B886] text-[#0A0E12]'
                        : 'bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA]'
                    }`}
                  >
                    Payload JSON (Entrada)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('curl')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      activeTab === 'curl'
                        ? 'bg-[#12B886] text-[#0A0E12]'
                        : 'bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA]'
                    }`}
                  >
                    Exemplo cURL
                  </button>
                </div>
                <span className="text-[11px] font-mono text-[#93A3B5] hidden sm:inline">
                  {activeTab === 'payload' ? 'Corpo completo da requisição' : 'Linha de comando'}
                </span>
              </div>

              {activeTab === 'payload' ? (
                <CodeBlock
                  title="payload-exemplo-ingestao-cdv.json"
                  language="json"
                  code={payloadCompleto}
                />
              ) : (
                <CodeBlock title="disparo-curl-cdv.sh" language="bash" code={curlExemplo} />
              )}
            </div>

            {/* Descrição campo a campo */}
            <div className="space-y-3 pt-2">
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-[#D9B36C]">
                Dicionário de Dados do Payload (Campo a Campo):
              </h3>

              <div className="overflow-x-auto rounded-xl border border-[rgba(244,247,250,0.1)] bg-[#0A0E12]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[rgba(244,247,250,0.1)] text-[#93A3B5] uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Campo</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Obrigatoriedade</th>
                      <th className="py-2.5 px-3">Descrição / Regras de Negócio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(244,247,250,0.06)] font-mono text-[11px]">
                    {/* Bloco CDV */}
                    <tr className="bg-[#111820]/40">
                      <td colSpan={4} className="py-1.5 px-3 font-sans font-bold text-[#12B886]">
                        Objeto: cdv
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#12B886]">cdv.nome</td>
                      <td className="py-2 px-3 text-[#93A3B5]">string</td>
                      <td className="py-2 px-3 text-[#12B886] font-bold">Opcional</td>
                      <td className="py-2 px-3 text-[#F4F7FA] font-sans">
                        Razão social ou fantasia do CDV. Se omitido, usa o nome vinculado à API key.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#12B886]">cdv.cnpj</td>
                      <td className="py-2 px-3 text-[#93A3B5]">string</td>
                      <td className="py-2 px-3 text-[#12B886] font-bold">Opcional</td>
                      <td className="py-2 px-3 text-[#F4F7FA] font-sans">
                        CNPJ do CDV com ou sem pontuação (ex: 76.123.456/0001-00).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#12B886]">cdv.codigo</td>
                      <td className="py-2 px-3 text-[#93A3B5]">string</td>
                      <td className="py-2 px-3 text-[#12B886] font-bold">Opcional</td>
                      <td className="py-2 px-3 text-[#F4F7FA] font-sans">
                        Código de credenciamento do DETRAN (ex: DETRAN-PR-CDV-0089).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#12B886]">cdv.responsavel_crea</td>
                      <td className="py-2 px-3 text-[#93A3B5]">string</td>
                      <td className="py-2 px-3 text-[#12B886] font-bold">Opcional</td>
                      <td className="py-2 px-3 text-[#F4F7FA] font-sans">
                        Engenheiro mecânico responsável técnico e número de ART/CREA.
                      </td>
                    </tr>

                    {/* Bloco Veículo Doador */}
                    <tr className="bg-[#111820]/40">
                      <td colSpan={4} className="py-1.5 px-3 font-sans font-bold text-[#12B886]">
                        Objeto: veiculo_doador
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#12B886]">veiculo_doador.marca_modelo</td>
                      <td className="py-2 px-3 text-[#93A3B5]">string</td>
                      <td className="py-2 px-3 text-[#F03E54] font-bold">OBRIGATÓRIO</td>
                      <td className="py-2 px-3 text-[#F4F7FA] font-sans">
                        Marca, modelo e versão do veículo baixado (ex: Volkswagen Gol 1.6 8V).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#12B886]">veiculo_doador.baixa_detran</td>
                      <td className="py-2 px-3 text-[#93A3B5]">string</td>
                      <td className="py-2 px-3 text-[#F03E54] font-bold">OBRIGATÓRIO</td>
                      <td className="py-2 px-3 text-[#F4F7FA] font-sans">
                        Número da certidão de baixa definitiva de veículo no DETRAN.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#12B886]">veiculo_doador.chassi</td>
                      <td className="py-2 px-3 text-[#93A3B5]">string</td>
                      <td className="py-2 px-3 text-[#12B886] font-bold">Opcional</td>
                      <td className="py-2 px-3 text-[#F4F7FA] font-sans">
                        Número do chassi. Por privacidade, a API mascara exibindo apenas os 6
                        últimos dígitos nos relatórios públicos.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#12B886]">veiculo_doador.placa</td>
                      <td className="py-2 px-3 text-[#93A3B5]">string</td>
                      <td className="py-2 px-3 text-[#12B886] font-bold">Opcional</td>
                      <td className="py-2 px-3 text-[#F4F7FA] font-sans">
                        Placa original antes da baixa no DETRAN.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#12B886]">
                        veiculo_doador.seguradora_sinistro
                      </td>
                      <td className="py-2 px-3 text-[#93A3B5]">string</td>
                      <td className="py-2 px-3 text-[#12B886] font-bold">Opcional</td>
                      <td className="py-2 px-3 text-[#F4F7FA] font-sans">
                        Companhia seguradora ou leilão de origem da sucata de perda total.
                      </td>
                    </tr>

                    {/* Bloco Peças */}
                    <tr className="bg-[#111820]/40">
                      <td colSpan={4} className="py-1.5 px-3 font-sans font-bold text-[#12B886]">
                        Array: pecas[] (Não vazio)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#12B886]">pecas[].sku</td>
                      <td className="py-2 px-3 text-[#93A3B5]">string</td>
                      <td className="py-2 px-3 text-[#F03E54] font-bold">OBRIGATÓRIO</td>
                      <td className="py-2 px-3 text-[#F4F7FA] font-sans">
                        Código de estoque interno / SKU da peça no ERP do CDV.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#12B886]">pecas[].descricao</td>
                      <td className="py-2 px-3 text-[#93A3B5]">string</td>
                      <td className="py-2 px-3 text-[#F03E54] font-bold">OBRIGATÓRIO</td>
                      <td className="py-2 px-3 text-[#F4F7FA] font-sans">
                        Nome comercial e especificação técnica da peça reutilizável.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#12B886]">pecas[].material</td>
                      <td className="py-2 px-3 text-[#93A3B5]">string</td>
                      <td className="py-2 px-3 text-[#F03E54] font-bold">OBRIGATÓRIO</td>
                      <td className="py-2 px-3 text-[#F4F7FA] font-sans">
                        Material dominante para aplicação do fator curado (ex: Aço, Alumínio, Cobre,
                        Polímero/Plástico ou Outros).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#12B886]">pecas[].peso_kg</td>
                      <td className="py-2 px-3 text-[#93A3B5]">number</td>
                      <td className="py-2 px-3 text-[#F03E54] font-bold">OBRIGATÓRIO</td>
                      <td className="py-2 px-3 text-[#F4F7FA] font-sans">
                        Peso físico líquido da peça em quilogramas (0.01 a 5000 kg).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#12B886]">pecas[].ncm</td>
                      <td className="py-2 px-3 text-[#93A3B5]">string</td>
                      <td className="py-2 px-3 text-[#12B886] font-bold">Opcional</td>
                      <td className="py-2 px-3 text-[#F4F7FA] font-sans">
                        Classificação fiscal NCM de 8 dígitos (ex: 8708.29.99 ou 87082999).
                      </td>
                    </tr>

                    {/* Bloco Geral */}
                    <tr className="bg-[#111820]/40">
                      <td colSpan={4} className="py-1.5 px-3 font-sans font-bold text-[#12B886]">
                        Campo geral
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#12B886]">origem</td>
                      <td className="py-2 px-3 text-[#93A3B5]">string</td>
                      <td className="py-2 px-3 text-[#12B886] font-bold">Opcional</td>
                      <td className="py-2 px-3 text-[#F4F7FA] font-sans">
                        Canal remetente: <code className="text-[#12B886]">erp</code>,{' '}
                        <code className="text-[#12B886]">ecommerce</code>,{' '}
                        <code className="text-[#12B886]">manual_api</code> ou{' '}
                        <code className="text-[#12B886]">planilha</code>. Padrão: erp.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Exemplo de Resposta de Sucesso */}
            <div className="space-y-3 pt-4 border-t border-[rgba(244,247,250,0.08)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-mono font-bold text-xs">
                    HTTP 201 Created
                  </span>
                  <h3 className="font-heading font-bold text-sm text-[#F4F7FA]">
                    Exemplo de Resposta de Sucesso da Ingestão
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#93A3B5]">
                  Retorna selos PR-SEAL, hashes SHA-256 e links públicos
                </span>
              </div>
              <CodeBlock title="resposta-sucesso-201.json" language="json" code={respostaSucesso} />
            </div>
          </div>
        </section>

        {/* 5. CÓDIGOS DE ERRO */}
        <section id="codigos-erro" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16202B] border border-[#F03E54]/30 flex items-center justify-center text-[#F03E54]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                4. Códigos de Retorno & Respostas de Erro
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Mensagens descritivas em português com exemplos reais retornados pela API.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 400 */}
            <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded bg-[#D9B36C]/20 text-[#D9B36C] font-mono font-bold text-xs">
                    HTTP 400 Bad Request
                  </span>
                </div>
                <h3 className="font-heading font-bold text-sm text-[#F4F7FA] mb-1">
                  Payload Incompleto ou Inválido
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed mb-3">
                  Ocorre quando campos obrigatórios como marca_modelo, baixa_detran ou o array de
                  peças não são fornecidos, ou quando peso/NCM são inválidos.
                </p>
              </div>
              <CodeBlock title="erro-400.json" language="json" code={erro400Exemplo} />
            </div>

            {/* 401 */}
            <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded bg-[#F03E54]/20 text-[#F03E54] font-mono font-bold text-xs">
                    HTTP 401 Unauthorized
                  </span>
                </div>
                <h3 className="font-heading font-bold text-sm text-[#F4F7FA] mb-1">
                  Chave Ausente, Inválida ou Revogada
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed mb-3">
                  Retornado quando o cabeçalho X-API-Key não foi enviado, quando o hash da chave não
                  bate com a base, ou quando a chave está desativada.
                </p>
              </div>
              <CodeBlock title="erro-401.json" language="json" code={erro401Exemplo} />
            </div>

            {/* 429 */}
            <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded bg-[#F03E54]/20 text-[#F03E54] font-mono font-bold text-xs">
                    HTTP 429 Too Many Requests
                  </span>
                </div>
                <h3 className="font-heading font-bold text-sm text-[#F4F7FA] mb-1">
                  Rate Limit Excedido
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed mb-3">
                  Disparado automaticamente quando a chave remetente envia mais de 60 lotes em uma
                  janela de 60 segundos. A aplicação deve aguardar e retentar.
                </p>
              </div>
              <CodeBlock title="erro-429.json" language="json" code={erro429Exemplo} />
            </div>
          </div>
        </section>

        {/* 6. FATORES DE EMISSÃO CURADOS POR MATERIAL */}
        <section id="fatores-co2e" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16202B] border border-[#12B886]/30 flex items-center justify-center text-[#12B886]">
              <Leaf className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                  5. Catálogo Curado de Fatores de CO₂e Evitado
                </h2>
                <Link
                  to="/fatores"
                  className="px-3 py-1 rounded-lg bg-[#12B886]/15 hover:bg-[#12B886]/25 border border-[#12B886]/40 text-xs text-[#12B886] font-mono font-bold flex items-center gap-1.5 transition-all"
                >
                  <span>Ver Página Completa /fatores</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-xs text-[#93A3B5]">
                Fatores conservadores aplicados pelo motor dMRV da plataforma para cálculo de
                insetting e descarbonização. Congelados no documento no momento da emissão.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4">
            <div className="overflow-x-auto rounded-xl border border-[rgba(244,247,250,0.1)] bg-[#0A0E12]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[rgba(244,247,250,0.1)] text-[#93A3B5] uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Material Dominante</th>
                    <th className="py-3 px-4">Classificação Comercial</th>
                    <th className="py-3 px-4 text-right">Fator Curado</th>
                    <th className="py-3 px-4">Unidade</th>
                    <th className="py-3 px-4">Fonte Metodológica & Norma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA]">
                  {Object.entries(FATORES_CDV_MATERIAIS).map(([key, item]) => (
                    <tr key={key} className="hover:bg-[#16202B]/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#12B886] uppercase">
                        {key}
                      </td>
                      <td className="py-3 px-4 font-medium">{item.nome}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-base text-[#12B886]">
                        {item.fatorKgCO2ePorKg.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#93A3B5]">
                        kgCO₂e / kg peça
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#93A3B5]">
                        {item.fonte} ({item.ano})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/20 flex items-start gap-3 text-xs text-[#93A3B5] leading-relaxed">
              <Scale className="w-5 h-5 text-[#12B886] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F4F7FA]">Critério Conservador & dMRV Auditável:</strong>{' '}
                Quando a peça possui material não enquadrado estritamente nas quatro categorias
                primárias (ex: materiais mistos, compósitos ou sem especificação), a API adota
                automaticamente o fator conservador de{' '}
                <strong className="text-[#12B886]">1,50 kgCO₂e/kg</strong> e marca a flag{' '}
                <code className="text-[#D9B36C] font-mono">incerteza_material: true</code> na
                resposta para assegurar conformidade com a ISO 14067 e auditoria pericial sem risco
                de superestimação de créditos.
              </div>
            </div>
          </div>
        </section>

        {/* 7. WEBHOOKS B2B */}
        <section id="webhooks" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16202B] border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6]">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                6. Webhooks B2B — Evento &quot;lote_cdv_recebido&quot;
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Notificações instantâneas HTTP POST assinadas com HMAC-SHA256 no seu endpoint HTTPS.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-6 text-xs text-[#93A3B5]">
            <p className="leading-relaxed">
              Sempre que um novo lote for ingerido e processado com sucesso, o Orbis Protocol
              dispara uma notificação webhook com o payload consolidado do evento{' '}
              <code className="font-mono text-[#D9B36C] font-bold">lote_cdv_recebido</code>.
            </p>

            {/* Cabeçalhos do Webhook */}
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
              <span className="text-[10px] uppercase font-mono text-[#3B82F6] font-bold block">
                Cabeçalhos HTTP Enviados no Webhook:
              </span>
              <div className="font-mono text-[11px] space-y-1 text-[#F4F7FA]">
                <div>
                  <span className="text-[#93A3B5]">X-Orbis-Event:</span> lote_cdv_recebido
                </div>
                <div>
                  <span className="text-[#93A3B5]">X-Orbis-Signature:</span>{' '}
                  <span className="text-[#12B886]">
                    sha256_hex(hmac(payload, secret_cadastrado))
                  </span>
                </div>
                <div>
                  <span className="text-[#93A3B5]">X-Orbis-Timestamp:</span>{' '}
                  2026-04-18T14:32:01.428Z
                </div>
                <div>
                  <span className="text-[#93A3B5]">Content-Type:</span> application/json
                </div>
              </div>
            </div>

            {/* Payload do Webhook */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-[#F4F7FA] font-bold">
                Payload JSON Entregue no Webhook:
              </span>
              <CodeBlock
                title="webhook-lote-cdv-recebido.json"
                language="json"
                code={webhookPayloadExemplo}
              />
            </div>

            {/* Como cadastrar e política de retry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
                <div className="flex items-center gap-2 text-[#F4F7FA] font-bold">
                  <Workflow className="w-4 h-4 text-[#12B886]" />
                  <span>Cadastro no Painel B2B</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Para cadastrar sua URL HTTPS de recebimento, acesse o{' '}
                  <Link to="/painel" className="text-[#12B886] underline font-medium">
                    Painel do Cliente → aba Webhooks B2B
                  </Link>
                  . Lá você pode definir a URL, copiar ou regenerar o segredo HMAC e disparar testes
                  manuais com log de resposta.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
                <div className="flex items-center gap-2 text-[#F4F7FA] font-bold">
                  <Zap className="w-4 h-4 text-[#D9B36C]" />
                  <span>Política de Retry & Timeout</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  O dispatcher do Orbis Protocol aguarda resposta com timeout de 10 segundos. São
                  consideradas entregues requisições com código HTTP na faixa 2xx (200-299). Se o
                  servidor retornar falha ou timeout, a entrega é registrada como falha no arquivo
                  de auditoria e retentada automaticamente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FLUXO DE HOMOLOGAÇÃO DO CDV */}
        <section id="homologacao" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16202B] border border-[#12B886]/30 flex items-center justify-center text-[#12B886]">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                7. Fluxo de Homologação do CDV (Passo a Passo)
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Do credenciamento técnico à emissão em ambiente de produção.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {/* Etapa 1 */}
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
                <span className="w-6 h-6 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] font-mono font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="font-heading font-bold text-xs text-[#F4F7FA]">Credenciamento</h4>
                <p className="text-[11px] text-[#93A3B5] leading-relaxed">
                  Cadastro do CNPJ do CDV homologado pelo DETRAN com responsável técnico CREA.
                </p>
              </div>

              {/* Etapa 2 */}
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
                <span className="w-6 h-6 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] font-mono font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="font-heading font-bold text-xs text-[#F4F7FA]">Gerar Chave</h4>
                <p className="text-[11px] text-[#93A3B5] leading-relaxed">
                  Gerar a chave de API no Console do Painel e configurar no ERP/TMS de desmontagem.
                </p>
              </div>

              {/* Etapa 3 */}
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
                <span className="w-6 h-6 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] font-mono font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="font-heading font-bold text-xs text-[#F4F7FA]">Lote de Teste</h4>
                <p className="text-[11px] text-[#93A3B5] leading-relaxed">
                  Enviar lote piloto mínimo com 2 a 3 peças reais para validar pesos e materiais.
                </p>
              </div>

              {/* Etapa 4 */}
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
                <span className="w-6 h-6 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] font-mono font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h4 className="font-heading font-bold text-xs text-[#F4F7FA]">Validar DPP</h4>
                <p className="text-[11px] text-[#93A3B5] leading-relaxed">
                  Acessar a URL do passaporte consolidado e conferir o hash SHA-256 e o QR Code.
                </p>
              </div>

              {/* Etapa 5 */}
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/40 space-y-2 bg-gradient-to-b from-[#0A0E12] to-[#12B886]/10">
                <span className="w-6 h-6 rounded-full bg-[#12B886] text-[#0A0E12] font-mono font-bold text-xs flex items-center justify-center">
                  5
                </span>
                <h4 className="font-heading font-bold text-xs text-[#12B886]">Produção</h4>
                <p className="text-[11px] text-[#93A3B5] leading-relaxed">
                  Liberar ingestão contínua em escala com impressão de etiquetas com QR no galpão.
                </p>
              </div>
            </div>

            {/* Sugestão de Payload Mínimo de Teste */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#D9B36C]">
                  Sugestão de Lote de Teste Mínimo (2 Peças):
                </span>
                <span className="text-[11px] text-[#93A3B5] font-mono">
                  Ideal para testar na esteira de homologação
                </span>
              </div>
              <CodeBlock
                title="lote-teste-minimo-homologacao.json"
                language="json"
                code={loteTesteMinimo}
              />
            </div>
          </div>
        </section>

        {/* 9. RODAPÉ & CTA DE CONTATO E CREDENCIAMENTO */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#111820] to-[#16202B] border border-[#12B886]/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#12B886] uppercase font-mono">
              <Sparkles className="w-4 h-4 text-[#12B886]" />
              <span>Precisa de Suporte à Integração ou Credenciamento CDV?</span>
            </div>
            <h3 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
              Conecte o seu CDV ao padrão nacional de Passaporte Digital Veicular
            </h3>
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              Nossa equipe de engenharia dMRV auxilia seu time de TI no mapeamento dos campos do
              ERP, parametrização dos NCMs e testes de stress.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              to="/diagnostico"
              className="px-6 py-3 rounded-xl font-bold text-xs bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all flex items-center justify-center gap-2 shadow-emerald-glow"
            >
              <span>Solicitar Credenciamento</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/painel"
              className="px-5 py-3 rounded-xl font-semibold text-xs border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] hover:text-[#12B886] transition-all flex items-center justify-center gap-2 bg-[#0A0E12]"
            >
              <Terminal className="w-4 h-4 text-[#12B886]" />
              <span>Abrir Console Sandbox</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
