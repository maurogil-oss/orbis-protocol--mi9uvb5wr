import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  FileText,
  AlertTriangle,
  Building2,
  Lock,
  Mail,
  Scale,
  ArrowRight,
  Check,
  MessageSquare,
  Compass,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  PLANOS_RADAR_SEMANAL,
  AVISO_LEGAL_RADAR,
  obterEdicaoAbertaDoMes,
  RadarEdicaoRecord,
  ativarTrial15DiasUsuario,
  verificarAcessoRadar,
} from '@/services/radarSemanalService'

export default function RadarSemanalPublicPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const refParam = searchParams.get('ref') || ''
  const [edicaoAberta, setEdicaoAberta] = useState<RadarEdicaoRecord | null>(null)
  const [loadingEdicao, setLoadingEdicao] = useState(true)
  const [ativandoTrial, setAtivandoTrial] = useState(false)
  const [trialAtivadoSucesso, setTrialAtivadoSucesso] = useState(false)

  // Status de acesso do usuário atual se estiver logado
  const acessoInfo = verificarAcessoRadar(user)

  useEffect(() => {
    // Guarda o ref em localStorage para persistir na jornada de cadastro se navegar entre abas
    if (refParam) {
      try {
        localStorage.setItem('orbis_radar_ref', refParam)
      } catch {
        /* intentionally ignored */
      }
    }

    obterEdicaoAbertaDoMes()
      .then((res) => setEdicaoAberta(res))
      .catch(() => {})
      .finally(() => setLoadingEdicao(false))
  }, [refParam])

  const handleIniciarTrialLogado = async (faixa: any = '1_cnpj') => {
    if (!user) return
    setAtivandoTrial(true)
    try {
      await ativarTrial15DiasUsuario(user.id, faixa)
      setTrialAtivadoSucesso(true)
      setTimeout(() => {
        navigate('/central-radar')
      }, 1200)
    } catch (err: any) {
      alert('Erro ao ativar degustação gratuita: ' + err.message)
    } finally {
      setAtivandoTrial(false)
    }
  }

  // URL para registro levando o ref e a intenção de plano
  const getRegistroUrlComRef = (faixa: string) => {
    const params = new URLSearchParams()
    if (refParam) params.set('ref', refParam)
    params.set('origem', 'radar_semanal')
    params.set('plano_faixa', faixa)
    return `/registro?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-[#0A0E12] text-[#F4F7FA] selection:bg-[#12B886]/30">
      {/* Banner de Indicação se ?ref estiver presente */}
      {refParam && (
        <div className="bg-[#12B886]/10 border-b border-[#12B886]/30 py-2.5 px-4 text-center text-xs">
          <span className="text-[#12B886] font-semibold">
            Você foi convidado através do parceiro{' '}
            <strong className="font-mono underline text-[#F4F7FA]">{refParam}</strong>.
          </span>{' '}
          <span className="text-[#93A3B5]">
            Seu teste gratuito de 15 dias sem cartão está liberado com suporte prioritário!
          </span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden border-b border-[rgba(244,247,250,0.08)]">
        {/* Glow de fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#12B886]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111820] border border-[#12B886]/30 text-xs text-[#12B886] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#12B886]" />
              <span>Inteligência Regulatória por Assinatura • Toda Segunda 7h</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-[#F4F7FA] tracking-tight leading-[1.1]">
              RADAR SEMANAL <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#12B886] via-[#17C994] to-[#20E3A2]">
                REGULATÓRIO & FISCAL
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-[#93A3B5] leading-relaxed max-w-2xl mx-auto">
              O serviço executivo essencial para empresas, contadores e auditores. Normas do Diário
              Oficial, IBS/CBS, SBCE, CVM e Banco Central destrinchadas em formato padrão acionável:
              <strong className="text-[#F4F7FA]">
                {' '}
                O que é, Quem afeta, O que muda, Prazo e O que fazer agora.
              </strong>
            </p>

            {/* CTAs de Destaque */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {isAuthenticated && acessoInfo.temAcesso ? (
                <Link
                  to="/central-radar"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#12B886] text-[#0A0E12] font-heading font-bold text-sm hover:bg-[#17C994] transition-all shadow-emerald-glow"
                >
                  <Compass className="w-4 h-4" />
                  <span>Acessar Minha Central de Radar</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : isAuthenticated && !acessoInfo.temAcesso ? (
                <button
                  onClick={() => handleIniciarTrialLogado('1_cnpj')}
                  disabled={ativandoTrial}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#12B886] text-[#0A0E12] font-heading font-bold text-sm hover:bg-[#17C994] transition-all shadow-emerald-glow disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {ativandoTrial
                      ? 'Ativando Degustação...'
                      : 'Iniciar teste grátis de 15 dias — sem cartão'}
                  </span>
                </button>
              ) : (
                <Link
                  to={getRegistroUrlComRef('1_cnpj')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#12B886] text-[#0A0E12] font-heading font-bold text-sm hover:bg-[#17C994] transition-all shadow-emerald-glow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Iniciar teste grátis de 15 dias — sem cartão</span>
                </Link>
              )}

              <a
                href="#edicao-do-mes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] font-medium text-sm hover:border-[#12B886]/50 hover:text-[#12B886] transition-all"
              >
                <FileText className="w-4 h-4 text-[#D9B36C]" />
                <span>Ler Edição Aberta do Mês</span>
              </a>
            </div>

            {trialAtivadoSucesso && (
              <div className="p-3 rounded-lg bg-[#12B886]/15 border border-[#12B886] text-xs text-[#12B886] animate-fade-in font-medium">
                Degustação de 15 dias ativada com sucesso! Redirecionando para a Central...
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#93A3B5] pt-2">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#12B886]" /> Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#12B886]" /> Sem fidelidade contratual
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#12B886]" /> Curadoria editorial manual
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 2: O Formato Rígido de 5 Pilares */}
      <section className="py-16 md:py-20 border-b border-[rgba(244,247,250,0.08)] bg-[#0D1217]/50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA]">
              Zero Prolixidade Jurídica: O Formato de 5 Pilares
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] mt-2">
              Cada norma é sintetizada exatamente na mesma estrutura mental para que diretores e
              contadores tomem decisões em 3 minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.08)] hover:border-[#12B886]/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#12B886]/20 text-[#12B886] font-mono font-bold flex items-center justify-center text-xs mb-3">
                1
              </div>
              <h3 className="font-heading font-bold text-sm text-[#F4F7FA] mb-1">O que é</h3>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Resumo claro e desprovido de jargões sobre a norma ou instrução publicada.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.08)] hover:border-[#12B886]/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 text-[#3B82F6] font-mono font-bold flex items-center justify-center text-xs mb-3">
                2
              </div>
              <h3 className="font-heading font-bold text-sm text-[#F4F7FA] mb-1">Quem afeta</h3>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Quais setores econômicos, portes empresariais ou regimes tributários estão no
                escopo.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.08)] hover:border-[#12B886]/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#D9B36C]/20 text-[#D9B36C] font-mono font-bold flex items-center justify-center text-xs mb-3">
                3
              </div>
              <h3 className="font-heading font-bold text-sm text-[#F4F7FA] mb-1">
                O que muda na prática
              </h3>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Impacto direto nos sistemas fiscais, contratos, operações e obrigações acessórias.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.08)] hover:border-[#12B886]/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] font-mono font-bold flex items-center justify-center text-xs mb-3">
                4
              </div>
              <h3 className="font-heading font-bold text-sm text-[#F4F7FA] mb-1">Prazo</h3>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Datas de vigência, marcos de adaptação e janelas limites de transmissão sem multa.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.08)] hover:border-[#12B886]/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#12B886]/20 text-[#12B886] font-mono font-bold flex items-center justify-center text-xs mb-3">
                5
              </div>
              <h3 className="font-heading font-bold text-sm text-[#F4F7FA] mb-1">
                O que fazer agora
              </h3>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Checklist executivo de ações preventivas imediatas para evitar riscos e autuações.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 3: Planos por Faixa de CNPJs (Preço por carteira atendida) */}
      <section id="planos" className="py-16 md:py-24 border-b border-[rgba(244,247,250,0.08)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#12B886]">
              PREÇO TRANSPARENTE POR FAIXA DE CNPJs ATENDIDOS
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA]">
              Escolha o Plano Ideal para Sua Empresa ou Escritório
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5]">
              Modelo justo orientado pelo tamanho da carteira de empresas sob seu monitoramento. Sem
              cobrança por usuário ou licença complexa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANOS_RADAR_SEMANAL.map((plano) => (
              <div
                key={plano.id}
                className={`rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
                  plano.destaque
                    ? 'bg-[#111820] border-2 border-[#12B886] shadow-xl shadow-[#12B886]/10'
                    : 'bg-[#111820] border border-[rgba(244,247,250,0.1)] hover:border-[rgba(244,247,250,0.25)]'
                }`}
              >
                {plano.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#12B886] text-[#0A0E12] font-heading font-black text-[10px] uppercase tracking-wider shadow-sm">
                    Mais Escolhido
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-[#93A3B5] font-mono block uppercase">
                      {plano.faixaTexto}
                    </span>
                    <h3 className="font-heading font-bold text-lg text-[#F4F7FA] mt-0.5">
                      {plano.nome}
                    </h3>
                  </div>

                  <div className="pt-2 pb-1 border-b border-[rgba(244,247,250,0.06)]">
                    <span className="font-heading font-black text-2xl sm:text-3xl text-[#12B886]">
                      {plano.precoTexto}
                    </span>
                    {plano.precoMensal && (
                      <span className="text-xs text-[#93A3B5] block mt-0.5 font-normal">
                        Faturamento mensal recorrente
                      </span>
                    )}
                  </div>

                  {/* Benefícios */}
                  <ul className="space-y-2.5 text-xs text-[#93A3B5] pt-2">
                    {plano.beneficios.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#12B886] shrink-0 mt-0.5" />
                        <span className="leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Regra de Licença Expressa */}
                  <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-[11px] text-[#93A3B5] leading-relaxed">
                    <strong className="text-[#D9B36C] block mb-0.5">Regra de Licença:</strong>
                    {plano.regraLicenca}
                  </div>
                </div>

                <div className="pt-6">
                  {plano.precoMensal === null ? (
                    <a
                      href="mailto:contato@orbis-protocol.com?subject=Proposta%20Radar%20Semanal%20Multi-CNPJ%20Corporate"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-xs font-semibold text-[#F4F7FA] hover:border-[#12B886] hover:text-[#12B886] transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Falar com Consultor</span>
                    </a>
                  ) : isAuthenticated && acessoInfo.temAcesso ? (
                    <Link
                      to="/central-radar"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#16202B] text-xs font-semibold text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors"
                    >
                      <span>Acessar Acervo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : isAuthenticated && !acessoInfo.temAcesso ? (
                    <button
                      onClick={() => handleIniciarTrialLogado(plano.id)}
                      disabled={ativandoTrial}
                      className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors ${
                        plano.destaque
                          ? 'bg-[#12B886] text-[#0A0E12] hover:bg-[#17C994]'
                          : 'bg-[#16202B] text-[#F4F7FA] hover:bg-[#12B886] hover:text-[#0A0E12]'
                      }`}
                    >
                      <span>Iniciar teste de 15 dias</span>
                    </button>
                  ) : (
                    <Link
                      to={getRegistroUrlComRef(plano.id)}
                      className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors ${
                        plano.destaque
                          ? 'bg-[#12B886] text-[#0A0E12] hover:bg-[#17C994]'
                          : 'bg-[#16202B] text-[#F4F7FA] hover:bg-[#12B886] hover:text-[#0A0E12]'
                      }`}
                    >
                      <span>Iniciar teste de 15 dias</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.06)] text-xs text-[#93A3B5] text-center max-w-2xl mx-auto">
            <span className="font-semibold text-[#F4F7FA]">Acesso individual por login:</span> Todos
            os planos possuem autenticação pessoal e intransferível. Nos planos multi-CNPJ (até 5,
            até 30 e Corporate), o repasse e encaminhamento dos relatórios executivos aos CNPJs
            contratados é expressamente autorizado.
          </div>
        </div>
      </section>

      {/* Seção 4: Edição do Mês Aberta ao Público (Prova de Qualidade & Lead Gen) */}
      <section
        id="edicao-do-mes"
        className="py-16 md:py-24 border-b border-[rgba(244,247,250,0.08)] bg-[#070A0D]"
      >
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D9B36C]/10 border border-[#D9B36C]/30 text-xs text-[#D9B36C] font-semibold">
              <FileText className="w-3.5 h-3.5" />
              <span>Edição Aberta do Mês • Prova de Qualidade Editorial</span>
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA]">
              Confira uma Edição Real na Íntegra
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5]">
              Uma edição por mês é mantida aberta ao público para que você valide a profundidade
              técnica e o valor prático antes de assinar.
            </p>
          </div>

          {loadingEdicao ? (
            <div className="p-12 text-center text-xs text-[#93A3B5]">
              Carregando edição do mês...
            </div>
          ) : edicaoAberta ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-6 shadow-2xl">
              {/* Header da Edição Aberta */}
              <div className="pb-6 border-b border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2 py-0.5 rounded bg-[#12B886]/10 text-[#12B886] font-mono text-[10px] uppercase font-bold border border-[#12B886]/30">
                      Edição nº {edicaoAberta.numero_edicao}
                    </span>
                    <span className="text-xs text-[#93A3B5] font-mono">
                      Data: {edicaoAberta.data_edicao} • {edicaoAberta.mes_ano_referencia}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-xl sm:text-2xl text-[#F4F7FA]">
                    {edicaoAberta.titulo}
                  </h3>
                </div>

                <span className="px-3 py-1 rounded-full bg-[#D9B36C]/10 text-[#D9B36C] border border-[#D9B36C]/30 text-xs font-semibold shrink-0 self-start sm:self-auto">
                  Acesso Público Liberado
                </span>
              </div>

              {/* Resumo da Semana */}
              <div className="p-4 rounded-xl bg-[#0A0E12] border-l-4 border-[#12B886] text-xs sm:text-sm text-[#D5DFEA] leading-relaxed">
                <strong className="text-[#12B886] block font-heading mb-1 uppercase tracking-wider text-[11px]">
                  Resumo Executivo da Curadoria:
                </strong>
                {edicaoAberta.resumo_semana}
              </div>

              {/* Lista das Normas no formato fixo dos 5 pilares */}
              <div className="space-y-6 pt-2">
                <h4 className="font-heading font-bold text-base text-[#F4F7FA] flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#12B886]" />
                  <span>
                    Normas Analisadas Nesta Edição ({edicaoAberta.itens_normas_json.length})
                  </span>
                </h4>

                <div className="space-y-4">
                  {edicaoAberta.itens_normas_json.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-5 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.06)] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-[#16202B] text-[#D9B36C] text-[10px] font-mono font-semibold border border-[#D9B36C]/30">
                            {item.segmento}
                          </span>
                          <strong className="font-heading font-bold text-sm text-[#F4F7FA]">
                            {item.norma}
                          </strong>
                        </div>
                        {item.base_legal && (
                          <span className="text-[11px] text-[#93A3B5] font-mono">
                            {item.base_legal}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                        <div className="p-2.5 rounded-lg bg-[#111820]">
                          <span className="text-[#93A3B5] font-semibold block text-[11px] mb-0.5">
                            1. O que é:
                          </span>
                          <p className="text-[#F4F7FA] leading-relaxed">{item.o_que_e}</p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#111820]">
                          <span className="text-[#93A3B5] font-semibold block text-[11px] mb-0.5">
                            2. Quem afeta:
                          </span>
                          <p className="text-[#F4F7FA] leading-relaxed">{item.quem_afeta}</p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#111820]">
                          <span className="text-[#93A3B5] font-semibold block text-[11px] mb-0.5">
                            3. O que muda na prática:
                          </span>
                          <p className="text-[#F4F7FA] leading-relaxed">
                            {item.o_que_muda_na_pratica}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#111820]">
                          <span className="text-[#F59E0B] font-semibold block text-[11px] mb-0.5">
                            4. Prazo mandatório:
                          </span>
                          <p className="text-[#F4F7FA] font-medium leading-relaxed">{item.prazo}</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-[#12B886]/10 border border-[#12B886]/30 text-xs">
                        <span className="text-[#12B886] font-bold block text-[11px] mb-0.5 uppercase tracking-wider">
                          5. O que fazer agora (Ação Imediata):
                        </span>
                        <p className="text-[#F4F7FA] leading-relaxed">{item.o_que_fazer_agora}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloco de Conversão pós-leitura */}
              <div className="pt-6 border-t border-[rgba(244,247,250,0.08)] text-center space-y-4">
                <p className="text-xs text-[#93A3B5] max-w-xl mx-auto">
                  Gostou da clareza e profundidade? Toda segunda-feira 7h enviamos as normas mais
                  críticas da semana diretamente para você.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to={getRegistroUrlComRef('1_cnpj')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#12B886] text-[#0A0E12] font-heading font-bold text-xs hover:bg-[#17C994] transition-all shadow-emerald-glow"
                  >
                    <span>Iniciar teste grátis de 15 dias — sem cartão</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/diagnostico"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-xs text-[#93A3B5] hover:text-[#F4F7FA] transition-colors"
                  >
                    <span>Diagnóstico gratuito do seu CNPJ</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-[#111820] text-center text-xs text-[#93A3B5]">
              Nenhuma edição pública disponível no momento.
            </div>
          )}
        </div>
      </section>

      {/* Seção 5: Programa de Indicação para Assinantes */}
      <section className="py-14 border-b border-[rgba(244,247,250,0.08)] bg-[#0A0E12]">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#111820] to-[#0D1217] border border-[#12B886]/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#12B886]">
                PROGRAMA DE INDICAÇÃO & CONFIANÇA
              </span>
              <h3 className="font-heading font-bold text-xl text-[#F4F7FA]">
                Cada Assinante Possui Seu Código de Indicação Rastreável
              </h3>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Ao receber cada digest semanal, você tem seu link exclusivo para compartilhar com
                clientes e parceiros. Quando eles iniciam o teste ou contratam, a origem fica
                gravada no ecossistema para fins de relacionamento e comissionamento.
              </p>
            </div>

            <div className="shrink-0 text-center">
              <Link
                to={getRegistroUrlComRef('1_cnpj')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#16202B] border border-[#12B886] text-xs font-bold text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors"
              >
                <span>Criar Conta e Obter Código</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé de Posicionamento Mandatório */}
      <footer className="py-10 bg-[#070A0D] text-center border-t border-[rgba(244,247,250,0.06)]">
        <div className="max-w-[900px] mx-auto px-4 space-y-3">
          <p className="text-xs sm:text-sm text-[#93A3B5] font-medium leading-relaxed">
            {AVISO_LEGAL_RADAR}
          </p>
          <p className="text-[11px] text-[#64748b] leading-relaxed">
            Orbis Protocol • Inteligência regulatória, infraestrutura de conformidade e prova
            documental. As análises refletem atos normativos oficiais e publicações governamentais.
          </p>
        </div>
      </footer>
    </div>
  )
}
