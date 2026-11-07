import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  ShieldCheck,
  TrendingDown,
  FileCheck2,
  Lock,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSeo } from '@/hooks/useSeo'
import { obterConfigCobrandingAcp, CobrandingAcpConfig } from '@/services/platformSettingsService'

export function PainelAcpPage() {
  useSeo({
    title: 'Painel ACP — Associação Comercial do Paraná — Orbis Protocol',
    description:
      'Painel de administração da parceria ACP (Associação Comercial do Paraná) na plataforma Orbis Protocol.',
  })

  const { user } = useAuth()
  const [config, setConfig] = useState<CobrandingAcpConfig | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarConfig()
  }, [])

  const carregarConfig = async () => {
    setCarregando(true)
    try {
      const cfg = await obterConfigCobrandingAcp()
      setConfig(cfg)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen py-10 md:py-16 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
        {/* Banner do Co-Branding ACP (se ativo) */}
        {config?.ativo && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-900/10 via-slate-100 to-emerald-900/10 dark:from-[#0E1A2E] dark:via-[#111827] dark:to-[#0E1A2E] border border-blue-500/30 dark:border-blue-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              {config.logo_url ? (
                <img
                  src={config.logo_url}
                  alt="Logo ACP"
                  className="h-10 sm:h-12 w-auto max-w-[160px] object-contain rounded bg-white p-1 shadow-sm"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-base shadow-sm">
                  ACP
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                  Co-branding Oficial Ativo
                </span>
                <p className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC]">
                  {config.texto_parceria || 'em parceria com a Associação Comercial do Paraná'}
                </p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Piloto Estratégico ACP • dMRV de Economia Circular e Descarbonização
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/40">
                Parceria Ativa
              </span>
            </div>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#111827] border border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-400 text-xs font-bold tracking-wider uppercase mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              PAINEL DO ADMINISTRADOR ACP
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 dark:text-[#F8FAFC]">
              GOVERNANÇA DO PILOTO ACP
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] mt-1 max-w-3xl">
              Ambiente restrito da Associação Comercial do Paraná e Gestor Master. Acompanhamento
              institucional do piloto de descarbonização, empresas associadas e passaportes técnicos
              emitidos sob o protocolo Orbis.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={carregarConfig}
              className="p-2.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]"
              title="Atualizar"
            >
              <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/solucoes/bureau-acp"
              className="px-4 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm flex items-center gap-2 text-xs uppercase tracking-wider"
            >
              <Building2 className="w-4 h-4" />
              <span>Abrir Bureau ACP</span>
            </Link>
          </div>
        </div>

        {/* Identificação da Sessão */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-500 dark:text-[#94A3B8] block text-[10px] uppercase font-bold">
                Usuário Conectado
              </span>
              <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {user?.email || 'admin@acp.org.br'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-[#94A3B8] text-[11px]">
              Papel no sistema:
            </span>
            <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-mono text-[10px] font-bold uppercase border border-blue-200 dark:border-blue-800">
              {user?.role || 'admin_acp'}
            </span>
          </div>
        </div>

        {/* Links Rápidos das Telas do Piloto ACP */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
              FLUXOS E TELAS DO PILOTO ACP
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/solucoes/bureau-acp"
              className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-3 shadow-sm group"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <Building2 className="w-3 h-3" />
                  Bureau ACP
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F8FAFC] mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Cockpit do Bureau de Fornecedores
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1 leading-relaxed">
                  Homologação técnica e climática, passaportes com revelação seletiva e
                  monitoramento de Centros de Desmonte.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                <span>Acessar cockpit</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              to="/modelo-acp"
              className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-3 shadow-sm group"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <Sparkles className="w-3 h-3" />
                  Deck Modelo
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F8FAFC] mt-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Modelo Conceitual & Apresentação ACP
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1 leading-relaxed">
                  Deck institucional com 7 slides executivos detalhando o roadmap, riscos e
                  benefícios da parceria para indústrias associadas.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Ver apresentação</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              to="/passaporte-lote/PR-BX-2026-1240105"
              className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-3 shadow-sm group"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <FileCheck2 className="w-3 h-3" />
                  DPP Demonstrativo
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F8FAFC] mt-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Passaporte Digital de Produto (Lote Piloto)
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1 leading-relaxed">
                  Demonstração pública de lote com auditoria de transporte, hipóteses declaradas e
                  rastreabilidade ponta a ponta.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span>Visualizar passaporte</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </div>

        {/* Seção de Indicadores Agregados (Placeholder Honesto - Em Estruturação) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                INDICADORES AGREGADOS DA CARTEIRA ACP
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-300 dark:border-amber-700/40 font-bold uppercase">
              Etapa 4, Peça 4b • Em estruturação
            </span>
          </div>

          <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-800">
              <Info className="w-7 h-7" />
            </div>

            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-[#F8FAFC]">
                Análise Agregada e Anonimizada em Estruturação
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                Os módulos de telemetria agregada por setor, cálculo de emissões evitadas
                consolidadas e benchmarking anonimizado entre associados ACP estão programados para
                a próxima peça (4b). Nenhum dado sintético ou estimativa não-auditada é exibido
                preventivamente.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-[#94A3B8]">
              <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                • Total de Associados Ativos
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                • Toneladas Rastreadas (tCO₂e)
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                • Score Médio ESG da Carteira
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                • Elegibilidade BRDE / Fomento PR
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PainelAcpPage
