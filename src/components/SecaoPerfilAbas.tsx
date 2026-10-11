import React, { useState, useRef, useId } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  ShoppingCart,
  UserCheck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
} from 'lucide-react'

export type PerfilId = 'empresa' | 'comprador' | 'perito' | 'acp'

export interface PerfilTabInfo {
  id: PerfilId
  tabLabel: string
  subtitulo: string
  tituloPainel: string
  descricao: string
  destaque: string
  beneficios: string[]
  botaoTexto: string
  botaoDestino: string
  botaoState?: { papel: string; role: string }
  icon: React.ComponentType<{ className?: string }>
}

export const PERFIS_ABAS: PerfilTabInfo[] = [
  {
    id: 'empresa',
    tabLabel: 'Empresa',
    subtitulo: 'Indústrias, manufatura, frotas e geradores de emissões',
    tituloPainel: 'Diagnóstico e Gestão de Emissões por NF-e',
    descricao:
      'Lemos cada nota fiscal de insumos e operações da sua empresa para apurar a intensidade real de carbono, enquadramento compulsório ao SBCE e geração do Atestado Orbis (com ART/RRT).',
    destaque:
      'Substitui estimativas bancárias genéricas por apuração insumo a insumo com lastro na SEFAZ.',
    beneficios: [
      'Cálculo automatizado de Escopos 1, 2 e 3 baseado nas notas fiscais',
      'Enquadramento aos limiares da Lei 15.042/2024 (10k e 25k tCO₂e)',
      'Documentos prontos para envio aos órgãos de controle, bancos e contabilidade',
    ],
    botaoTexto: 'Iniciar Diagnóstico',
    botaoDestino: '/diagnostico',
    icon: Building2,
  },
  {
    id: 'comprador',
    tabLabel: 'Comprador',
    subtitulo: 'Grandes corporações, compras sustentáveis e gestores de suprimentos',
    tituloPainel: 'Conferência Criptográfica de Fornecedores',
    descricao:
      'Valide a autenticidade e o lastro pericial de cada atestado emitido pelos seus fornecedores. Rastreabilidade ponta a ponta sem risco de greenwashing para relatórios IFRS S1/S2.',
    destaque: 'Conferência pública instantânea do hash SHA-256 e da ART/RRT vinculada ao lote.',
    beneficios: [
      'Consulta pública de Atestados Orbis e Passaportes Digitais de Produto (DPP)',
      'Mitigação comprovada de emissões de Escopo 3 da cadeia de valor',
      'Interoperabilidade com manifestos MTR-SINIR e rastreabilidade veicular',
    ],
    botaoTexto: 'Verificar Atestado',
    botaoDestino: '/verificador',
    icon: ShoppingCart,
  },
  {
    id: 'perito',
    tabLabel: 'Perito',
    subtitulo: 'Engenheiros CREA, contadores CRC e auditores de carbono',
    tituloPainel: 'Apresentação da Revisão Pericial e Credenciamento',
    descricao:
      'Atue na validação pericial formal de inventários e lastros dMRV. Vincule suas ARTs e RRTs com remuneração transparente por laudo auditado na rede técnica Orbis.',
    destaque: 'Fluxo de revisão estruturado sob NBC TO 3000 do CFC e normas do CONFEA/CREA.',
    beneficios: [
      'Credenciamento profissional remunerado na infraestrutura Orbis',
      'Ambiente digital dedicado para revisão de memória de cálculo e fatores de emissão',
      'Assinatura digital com carimbo de tempo ICP-Brasil e registro canônico',
    ],
    botaoTexto: 'Apresentação da Revisão Pericial',
    botaoDestino: '/revisor-f6',
    icon: UserCheck,
  },
  {
    id: 'acp',
    tabLabel: 'Associado ACP',
    subtitulo: 'Empresas e parceiros da Associação Comercial do Paraná',
    tituloPainel: 'Portal do Parceiro e Acesso Corporativo ACP',
    descricao:
      'Acesso prioritário para associados da ACP com código corporativo ORB-ACP-XXXX, integração direta com linhas de crédito verde e cockpit setorial de conformidade.',
    destaque: 'Atendimento corporativo e condições preferenciais viabilizadas pela parceria ACP.',
    beneficios: [
      'Entrada direta no Painel do Parceiro e Bureau de Conformidade',
      'Acesso a condições diferenciadas e orientação para crédito verde',
      'Emissão simplificada do passaporte sustentável da empresa associada',
    ],
    botaoTexto: 'Portal do Parceiro',
    botaoDestino: '/parceiro',
    icon: Sparkles,
  },
]

export interface SecaoPerfilAbasProps {
  className?: string
  id?: string
}

/**
 * Seção de Perfil em Abas logo após o Hero:
 * - Abas "Empresa", "Comprador", "Perito", "Associado ACP"
 * - Acessibilidade completa: role="tablist", role="tab", aria-selected, setas navegam, alvos >= 44px
 * - Cada aba tem seu texto próprio e botão próprio apontando ao caminho certo:
 *   - Empresa -> Iniciar Diagnóstico (/diagnostico)
 *   - Comprador -> Verificar Atestado (/verificador)
 *   - Perito -> apresentação da revisão pericial (/revisor-f6)
 *   - Associado ACP -> portal do parceiro (/parceiro)
 * - Contraste >= 4.5:1, sem textos < 12px
 */
export function SecaoPerfilAbas({ className = '', id = 'perfis-orbis' }: SecaoPerfilAbasProps) {
  const [activeTab, setActiveTab] = useState<PerfilId>('empresa')
  const baseId = useId()
  const tabRefs = useRef<Record<PerfilId, HTMLButtonElement | null>>({
    empresa: null,
    comprador: null,
    perito: null,
    acp: null,
  })

  const currentPerfil = PERFIS_ABAS.find((p) => p.id === activeTab) || PERFIS_ABAS[0]

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null
    const total = PERFIS_ABAS.length

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      nextIndex = (index + 1) % total
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      nextIndex = (index - 1 + total) % total
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIndex = total - 1
    }

    if (nextIndex !== null) {
      const nextPerfil = PERFIS_ABAS[nextIndex]
      setActiveTab(nextPerfil.id)
      tabRefs.current[nextPerfil.id]?.focus()
    }
  }

  const IconActive = currentPerfil.icon

  return (
    <section
      id={id}
      aria-label="Acesso e soluções por perfil"
      className={`py-16 sm:py-24 bg-slate-50 dark:bg-[#0A1628] border-b border-slate-200 dark:border-slate-800 ${className}`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-[#059669]"
              aria-hidden="true"
            />
            <span>SOLUÇÕES DIRECIONADAS</span>
          </div>
          <h2 className="font-heading font-black text-[clamp(0.72rem,2.8vw,2.25rem)] text-slate-900 dark:text-[#F8FAFC] tracking-tight mb-3 leading-tight whitespace-normal min-[480px]:whitespace-nowrap [text-wrap:balance]">
            COMO O ORBIS PROTOCOLO ATENDE O SEU PERFIL
          </h2>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            Selecione o seu papel na cadeia de valor para acessar o fluxo técnico, probatório e
            regulatório ideal.
          </p>
        </div>

        {/* Tablist Acessível: role="tablist", navegação por setas, alvos >= 44px */}
        <div className="flex justify-center mb-8">
          <div
            role="tablist"
            aria-label="Perfis de atuação no Orbis Protocol"
            className="inline-flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs max-w-full"
          >
            {PERFIS_ABAS.map((perfil, index) => {
              const isSelected = activeTab === perfil.id
              const TabIcon = perfil.icon
              const tabId = `${baseId}-tab-${perfil.id}`
              const panelId = `${baseId}-panel-${perfil.id}`

              return (
                <button
                  key={perfil.id}
                  ref={(el) => {
                    tabRefs.current[perfil.id] = el
                  }}
                  id={tabId}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  aria-controls={panelId}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setActiveTab(perfil.id)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={`min-h-[44px] min-w-[44px] px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 select-none ${
                    isSelected
                      ? 'bg-emerald-600 text-white dark:bg-[#2563EB] dark:text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#111827]'
                  }`}
                >
                  <TabIcon className="w-4 h-4 shrink-0 stroke-[2]" />
                  <span>{perfil.tabLabel}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Painel da Aba Ativa */}
        <div
          id={`${baseId}-panel-${currentPerfil.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${currentPerfil.id}`}
          tabIndex={0}
          className="rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold">
                <IconActive className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0" />
                <span>Perfil: {currentPerfil.tabLabel}</span>
              </div>

              <div>
                <h3 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-snug">
                  {currentPerfil.tituloPainel}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-[#059669] mt-1">
                  {currentPerfil.subtitulo}
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                {currentPerfil.descricao}
              </p>

              {/* Destaque Diferencial */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border-l-4 border-emerald-600 dark:border-[#059669] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-[#F8FAFC] font-semibold block mb-0.5">
                  Diferencial técnico do protocolo:
                </strong>
                <span>{currentPerfil.destaque}</span>
              </div>

              {/* Botão Próprio com Destino Específico (Alvo >= 44px) */}
              <div className="pt-2">
                <Link
                  to={currentPerfil.botaoDestino}
                  state={currentPerfil.botaoState}
                  className="inline-flex items-center justify-center gap-2.5 min-h-[48px] px-8 py-3.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#2563EB] dark:text-white dark:hover:bg-blue-600 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <span>{currentPerfil.botaoTexto}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Coluna de Benefícios / Checklist */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    O que a plataforma entrega
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-emerald-700 dark:text-[#059669]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Conformidade</span>
                  </span>
                </div>

                <ul className="space-y-3.5">
                  {currentPerfil.beneficios.map((beneficio, bIdx) => (
                    <li
                      key={bIdx}
                      className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0 mt-0.5 stroke-[2]" />
                      <span className="leading-relaxed">{beneficio}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-600 dark:text-[#94A3B8]">
                  <FileCheck className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0" />
                  <span>Documento oficial: Atestado Orbis (com ART/RRT)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SecaoPerfilAbas
