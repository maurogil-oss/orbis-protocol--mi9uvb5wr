import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  CreditCard,
  QrCode,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Receipt,
  Lock,
} from 'lucide-react'

interface Plano {
  id: string
  nome: string
  precoMensal: string
  periodo: string
  descricao: string
  destaque?: boolean
  beneficios: string[]
}

const PLANOS: Plano[] = [
  {
    id: 'essencial',
    nome: 'Essencial PME',
    precoMensal: 'R$ 890',
    periodo: '/mês',
    descricao:
      'Ideal para comércios, pequenas empresas e associados ACP buscando conformidade e Selo Oficial.',
    beneficios: [
      'Diagnóstico anual preliminar por CNPJ',
      'Emissão do Selo Oficial Orbis Protocol dMRV',
      'Atestado preparatório para exigências ESG bancárias',
      'Suporte técnico via e-mail e comunidade',
      'Ingestão real de XML NF-e (Mod. 55/65) com apuração de créditos tributários ativos',
    ],
  },
  {
    id: 'profissional',
    nome: 'Profissional / MOVER',
    precoMensal: 'R$ 2.450',
    periodo: '/mês',
    descricao:
      'Projetado para CDVs, indústrias médias, frotas e empresas sujeitas a auditorias periciais.',
    destaque: true,
    beneficios: [
      'Tudo do plano Essencial',
      'Dossiê preparatório para créditos do Programa MOVER (exclusivo segmento automotivo/CDVs)',
      'Passaporte Digital de Produto (DPP) automotivo',
      'Laudo pericial preliminar com ART técnica acoplada',
      'Ingestão de XML de NF-e e conciliação de créditos de PIS/Cofins, ICMS e IPI',
      'Suporte prioritário via WhatsApp',
    ],
  },
  {
    id: 'empresarial',
    nome: 'Corporativo & SBCE',
    precoMensal: 'R$ 6.800',
    periodo: '/mês',
    descricao:
      'Para grandes corporações, indústrias intensivas em carbono e exportadores com exigência CBAM.',
    beneficios: [
      'Tudo do plano Profissional',
      'Gestão multi-CNPJ e filiais corporativas',
      'Reporte voluntário IFRS S1/S2 (Res. CVM 193) com preparação para asseguração',
      'Conectores diretos para ERPs em fase de homologação',
      'Auditor técnico dedicado dMRV',
      'Ingestão de XMLs em lote e parametrização volumétrica SPED para asseguração',
    ],
  },
]

export default function Financeiro() {
  const { isAuthenticated, user } = useAuth()
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano>(PLANOS[1])
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'boleto' | 'cartao'>('pix')
  const [pedidoConcluido, setPedidoConcluido] = useState(false)

  const handleSimularAssinatura = (e: React.FormEvent) => {
    e.preventDefault()
    setPedidoConcluido(true)
  }

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-4">
            <CreditCard className="w-4 h-4 text-[#12B886]" />
            FATURAMENTO & HABILITAÇÃO DE PROTOCOLO
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl md:text-5xl text-[#F4F7FA] tracking-wide mb-4">
            PORTAL FINANCEIRO & PLANOS DE ASSINATURA
          </h1>
          <p className="text-base sm:text-lg text-[#93A3B5] leading-relaxed">
            Escolha o nível de infraestrutura probatória adequado ao porte e às exigências da sua
            organização (preparatório para SBCE Lei 15.042/2024, MOVER automotivo, IFRS S1/S2
            voluntário ou Bureau ACP).
          </p>
        </div>

        {/* 1. PLANS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {PLANOS.map((plano) => (
            <div
              key={plano.id}
              className={`flex flex-col justify-between p-8 rounded-2xl transition-all duration-300 relative ${
                plano.destaque
                  ? 'bg-gradient-to-b from-[#16202B] to-[#111820] border-2 border-[#12B886] shadow-emerald-glow -translate-y-2'
                  : 'bg-[#111820] border border-[rgba(244,247,250,0.12)] hover:border-[rgba(244,247,250,0.3)]'
              }`}
            >
              {plano.destaque && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#12B886] text-[#0A0E12] text-xs font-extrabold uppercase tracking-wider shadow-md">
                  EXCLUSIVO SEGMENTO AUTOMOTIVO & CDV
                </div>
              )}

              <div>
                <h3 className="font-heading font-bold text-xl text-[#F4F7FA] mb-2">{plano.nome}</h3>
                <p className="text-xs text-[#93A3B5] mb-6 leading-relaxed">{plano.descricao}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-heading font-black text-3xl sm:text-4xl text-[#F4F7FA]">
                    {plano.precoMensal}
                  </span>
                  <span className="text-xs text-[#93A3B5] font-medium">{plano.periodo}</span>
                </div>

                <div className="space-y-3 mb-8">
                  {plano.beneficios.map((b, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5" />
                      <span className="text-[#93A3B5] leading-relaxed">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setPlanoSelecionado(plano)
                    setPedidoConcluido(false)
                    document
                      .getElementById('checkout-simulado')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className={`w-full py-3.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${
                    planoSelecionado.id === plano.id
                      ? 'bg-[#12B886] text-[#0A0E12] shadow-emerald-glow'
                      : 'border border-[rgba(244,247,250,0.25)] text-[#F4F7FA] hover:border-[#12B886]'
                  }`}
                >
                  <span>
                    {planoSelecionado.id === plano.id ? 'Plano Selecionado' : 'Selecionar Plano'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 2. SIMULATED CHECKOUT SECTION */}
        <div
          id="checkout-simulado"
          className="p-8 sm:p-10 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] mb-16 shadow-2xl"
        >
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9B36C] block mb-2">
              FLUXO DE ASSINATURA & CONTRATAÇÃO
            </span>
            <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA] mb-2">
              CONFIRMAÇÃO DO PLANO: {planoSelecionado.nome.toUpperCase()}
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] mb-6">
              Selecione o método de faturamento corporativo preferencial para sua empresa.
            </p>

            {/* Simulated limitation notice */}
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/30 text-xs text-[#D9B36C] mb-6 flex items-start gap-3">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5 font-bold">
                  Ambiente de Demonstração / Homologação:
                </strong>
                Esta versão opera em modo de simulação institucional. O pedido de assinatura será
                registrado no sistema sem cobrança em gateway real nem captura de dados de cartão de
                crédito.
              </div>
            </div>

            {pedidoConcluido ? (
              <div className="p-6 rounded-xl bg-[#0A0E12] border border-[#12B886] text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-[#12B886]/10 border border-[#12B886] flex items-center justify-center text-[#12B886] mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                    PEDIDO REGISTRADO COM SUCESSO!
                  </h3>
                  <p className="text-xs text-[#93A3B5] mt-1 max-w-md mx-auto">
                    A contratação simulada do <strong>{planoSelecionado.nome}</strong> via{' '}
                    <strong>{metodoPagamento.toUpperCase()}</strong> foi anotada em sua conta. Nosso
                    time de peritos fará o contato para a liberação da chave dMRV.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <Link
                    to="/painel"
                    className="px-6 py-2.5 rounded-lg text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678]"
                  >
                    Ir para Meu Painel
                  </Link>
                  <button
                    onClick={() => setPedidoConcluido(false)}
                    className="px-4 py-2.5 rounded-lg text-xs font-semibold border border-[rgba(244,247,250,0.2)] text-[#F4F7FA]"
                  >
                    Novo Pedido
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSimularAssinatura} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-3">
                    Forma de Pagamento Homologada:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'pix', label: 'PIX Instantâneo', desc: 'Ativação imediata' },
                      { id: 'boleto', label: 'Boleto Bancário (PJ)', desc: 'Vencimento em 3 dias' },
                      { id: 'cartao', label: 'Cartão Corporativo', desc: 'Faturamento recorrente' },
                    ].map((met) => (
                      <button
                        type="button"
                        key={met.id}
                        onClick={() => setMetodoPagamento(met.id as any)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          metodoPagamento === met.id
                            ? 'bg-[#12B886]/10 border-[#12B886] text-[#F4F7FA]'
                            : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)] text-[#93A3B5] hover:border-[rgba(244,247,250,0.25)]'
                        }`}
                      >
                        <div className="text-sm font-bold text-[#F4F7FA] mb-0.5">{met.label}</div>
                        <div className="text-[11px] text-[#93A3B5]">{met.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#93A3B5]">Total da Assinatura:</span>
                    <div className="text-lg font-heading font-black text-[#12B886]">
                      {planoSelecionado.precoMensal}{' '}
                      <span className="text-xs text-[#93A3B5] font-normal">/ cobrança mensal</span>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
                  >
                    Confirmar Pedido Simulado
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* 3. INVOICE HISTORY SECTION (PROTECTED / EMPTY IN V1) */}
        <div className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#D9B36C]" />
              <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                HISTÓRICO DE FATURAS & NOTAS FISCAIS
              </h3>
            </div>
            {!isAuthenticated && (
              <span className="inline-flex items-center gap-1 text-xs text-[#D9B36C]">
                <Lock className="w-3.5 h-3.5" />
                Requer Autenticação
              </span>
            )}
          </div>

          {isAuthenticated ? (
            <div className="text-center py-10 border border-dashed border-[rgba(244,247,250,0.15)] rounded-xl bg-[#0A0E12]">
              <Receipt className="w-8 h-8 text-[#93A3B5] mx-auto mb-2 opacity-50" />
              <p className="text-xs text-[#93A3B5]">
                Nenhuma fatura emitida ainda para a conta de{' '}
                <strong className="text-[#F4F7FA]">{user?.email}</strong> nesta versão inicial.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[#93A3B5]">
                Faça login para consultar suas notas fiscais de serviço e recibos de liquidação de
                honorários periciais.
              </p>
              <Link
                to="/login"
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#16202B] border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886]"
              >
                Fazer Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
