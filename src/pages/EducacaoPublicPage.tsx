import React, { useState } from 'react'
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  Store,
  ChevronRight,
  HelpCircle,
  Clock,
  Send,
  Building,
  School,
  FileCheck,
  AlertCircle,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { LICOES_ORBIS_EDUCACAO_MEI, LicaoEducacaoMEI } from '@/data/orbisEducacaoData'
import {
  registrarInscricaoMEI,
  emitirAtestadoParticipacaoOrbis,
  RegistroAtestadoParticipacao,
} from '@/services/orbisEducacaoService'
import { AtestadoParticipacaoOrbisCard } from '@/components/AtestadoParticipacaoOrbisCard'

export default function EducacaoPublicPage() {
  const navigate = useNavigate()

  // Aba ativa: 'programa' | 'trilha_mei' | 'escolas' | 'patrocinio'
  const [activeTab, setActiveTab] = useState<'programa' | 'trilha_mei' | 'escolas' | 'patrocinio'>(
    'programa',
  )

  // Inscrição MEI
  const [inscricaoMEI, setInscricaoMEI] = useState({
    nome: '',
    cpf_ou_cnpj: '',
    email: '',
    whatsapp: '',
    municipio: '',
    uf: '',
    patrocinador: '',
  })
  const [meiInscrito, setMeiInscrito] = useState(false)
  const [loadingInscricao, setLoadingInscricao] = useState(false)
  const [erroInscricao, setErroInscricao] = useState('')

  // Trilha Gamificada
  const [licaoAtualIndex, setLicaoAtualIndex] = useState(0)
  const [licoesConcluidas, setLicoesConcluidas] = useState<number[]>([])
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<number | null>(null)
  const [respostaFeedback, setRespostaFeedback] = useState<{
    correta: boolean
    explicacao: string
  } | null>(null)

  // Atestado Emitido ao finalizar
  const [atestadoGerado, setAtestadoGerado] = useState<RegistroAtestadoParticipacao | null>(null)
  const [emitindoAtestado, setEmitindoAtestado] = useState(false)

  // Patrocínio B2B2C Form
  const [patrocinioForm, setPatrocinioForm] = useState({
    entidade: '',
    tipo: 'prefeitura',
    contatoNome: '',
    email: '',
    telefone: '',
    municipioUf: '',
    estimativaPublico: '500_a_2000',
    mensagem: '',
  })
  const [patrocinioEnviado, setPatrocinioEnviado] = useState(false)

  const licaoAtual = LICOES_ORBIS_EDUCACAO_MEI[licaoAtualIndex]
  const totalLicoes = LICOES_ORBIS_EDUCACAO_MEI.length
  const progressoPercentual = Math.round((licoesConcluidas.length / totalLicoes) * 100)

  const handleInscricaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inscricaoMEI.nome || !inscricaoMEI.cpf_ou_cnpj || !inscricaoMEI.email) {
      setErroInscricao('Preencha os campos obrigatórios (Nome, CPF/CNPJ e E-mail).')
      return
    }

    setLoadingInscricao(true)
    setErroInscricao('')

    try {
      await registrarInscricaoMEI(inscricaoMEI)
      setMeiInscrito(true)
      setActiveTab('trilha_mei')
    } catch (err: unknown) {
      setErroInscricao(
        'Não foi possível gravar a inscrição no momento. Você pode prosseguir na trilha.',
      )
      setMeiInscrito(true)
      setActiveTab('trilha_mei')
    } finally {
      setLoadingInscricao(false)
    }
  }

  const handleResponderQuiz = () => {
    if (opcaoSelecionada === null) return
    const correta = opcaoSelecionada === licaoAtual.perguntaQuiz.respostaCorretaIndex
    setRespostaFeedback({
      correta,
      explicacao: licaoAtual.perguntaQuiz.explicacao,
    })

    if (correta && !licoesConcluidas.includes(licaoAtual.id)) {
      setLicoesConcluidas([...licoesConcluidas, licaoAtual.id])
    }
  }

  const handleAvancarLicao = () => {
    setOpcaoSelecionada(null)
    setRespostaFeedback(null)
    if (licaoAtualIndex < totalLicoes - 1) {
      setLicaoAtualIndex(licaoAtualIndex + 1)
    } else {
      // Concluiu todas as lições -> emitir atestado
      handleFinalizarTrilha()
    }
  }

  const handleFinalizarTrilha = async () => {
    setEmitindoAtestado(true)
    try {
      const atestado = await emitirAtestadoParticipacaoOrbis({
        nome: inscricaoMEI.nome || 'Participante Orbis Educação MEI',
        documento: inscricaoMEI.cpf_ou_cnpj || 'MEI_PARTICIPANTE',
        tipoPublico: 'mei',
        patrocinador: inscricaoMEI.patrocinador || 'Prefeitura / SEBRAE / Iniciativa Orbis B2B2C',
      })
      setAtestadoGerado(atestado)
    } catch (err) {
      console.error('Erro ao emitir atestado:', err)
    } finally {
      setEmitindoAtestado(false)
    }
  }

  return (
    <div className="min-h-screen py-10 md:py-16 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F4F7FA] w-full max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
        {/* HERO / APRESENTAÇÃO */}
        <div className="max-w-3xl mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-[#12B886] text-xs font-bold tracking-wider uppercase mb-3">
            <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-[#12B886]" />
            ORBIS EDUCAÇÃO • PROGRAMA DE FORMAÇÃO E INCLUSÃO
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 dark:text-[#F4F7FA] tracking-tight mb-3">
            Educação Climática, Reforma Tributária e Circularidade
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-[#93A3B5] leading-relaxed">
            <strong className="text-slate-800 dark:text-[#F4F7FA]">
              Orbis Protocol é a plataforma de prova; Orbis Educação é a frente de inclusão e
              aprendizado.
            </strong>{' '}
            Capacitação prática e gamificada para MEIs, pequenos negócios e comunidades escolares.
            Ao concluir, emita seu{' '}
            <strong className="text-emerald-700 dark:text-[#12B886]">
              Atestado de Participação Orbis
            </strong>{' '}
            com hash SHA-256 verificável.
          </p>
        </div>

        {/* NAVEGAÇÃO ENTRE ABAS DO PROGRAMA */}
        <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-slate-200 dark:border-[rgba(244,247,250,0.12)] pb-3">
          {[
            { id: 'programa', label: 'Visão do Programa', icon: Sparkles },
            { id: 'trilha_mei', label: 'Trilha Gamificada MEI (7 Lições)', icon: Store },
            { id: 'escolas', label: 'Escolas & Redes de Ensino', icon: School },
            { id: 'patrocinio', label: 'Patrocine este Programa (B2B2C)', icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon
            const isCurrent = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                  isCurrent
                    ? 'bg-emerald-600 text-white shadow-emerald-glow'
                    : 'bg-white dark:bg-[#0E1A2E] text-slate-600 dark:text-[#93A3B5] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[rgba(244,247,250,0.08)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* ========================================================= */}
        {/* ABA 1: VISÃO GERAL DO PROGRAMA */}
        {/* ========================================================= */}
        {activeTab === 'programa' && (
          <div className="space-y-8 animate-fade-in">
            {/* 3 Pilares */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-[#12B886]">
                  <Store className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F4F7FA]">
                  Trilha Gratuita para o MEI
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5] leading-relaxed">
                  O microempreendedor aprende o que é pegada de carbono da nota fiscal, o que muda
                  na reforma tributária e como economizar com embalagens e energia.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('trilha_mei')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-[#12B886] hover:underline"
                >
                  <span>Iniciar Trilha MEI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <School className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F4F7FA]">
                  Escolas Públicas & Particulares
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5] leading-relaxed">
                  Cadastro próprio de escolas com etapas (infantil a médio), turmas atendidas e
                  emissão de atestados verificáveis para turmas e estudantes.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('escolas')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Ver Cadastro de Escolas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F4F7FA]">
                  Modelo B2B2C Sustentável
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5] leading-relaxed">
                  O MEI e o aluno público recebem a capacitação de forma 100% gratuita; prefeituras,
                  SEBRAE, associações comerciais e grandes compradores patrocinam.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('patrocinio')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <span>Quero Patrocinar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Aviso de honestidade canônica */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-800 dark:text-[#D9B36C] text-xs font-medium space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Posicionamento Canônico e Integridade Institucional:</span>
              </div>
              <p className="leading-relaxed pl-6">
                O documento emitido por esta frente é exclusivamente o{' '}
                <strong>Atestado de Participação Orbis</strong> (verificável com hash). Nunca usamos
                as designações &quot;Certificado&quot; ou &quot;Certificação&quot; para o programa
                educacional, e nunca prometemos crédito de carbono ou benefício fiscal financeiro a
                participantes.
              </p>
            </div>

            {/* Ponte para o Funil */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 max-w-xl">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                  Ponte de Acesso Direto
                </span>
                <h3 className="font-heading font-bold text-xl sm:text-2xl">
                  Pronto para medir suas notas reais?
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                  Faça o diagnóstico gratuito do seu CNPJ e experimente o trial de 15 dias sem
                  cartão com até 5 notas fiscais calculadas pelo motor analítico do Orbis Protocol.
                </p>
              </div>
              <Link
                to="/diagnostico"
                className="px-6 py-3.5 rounded-xl font-bold bg-white text-emerald-800 hover:bg-slate-100 transition-all text-xs sm:text-sm shadow-md whitespace-nowrap"
              >
                Fazer Diagnóstico Gratuito
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 2: TRILHA GAMIFICADA MEI */}
        {/* ========================================================= */}
        {activeTab === 'trilha_mei' && (
          <div className="space-y-8 animate-fade-in">
            {/* Se ainda não cadastrou os dados básicos do MEI */}
            {!meiInscrito && (
              <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-xl">
                <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-[#12B886]">
                  <Store className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Inscrição Gratuita do MEI
                  </span>
                </div>
                <h2 className="font-heading font-extrabold text-xl text-slate-900 dark:text-[#F4F7FA] mb-2">
                  Identificação do Participante
                </h2>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5] mb-5">
                  Informe seus dados para emitir o Atestado de Participação Orbis com seu nome e
                  documento ao concluir as 7 lições.
                </p>

                {erroInscricao && (
                  <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs">
                    {erroInscricao}
                  </div>
                )}

                <form onSubmit={handleInscricaoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                      Nome Completo do Microempreendedor *
                    </label>
                    <input
                      type="text"
                      value={inscricaoMEI.nome}
                      onChange={(e) => setInscricaoMEI({ ...inscricaoMEI, nome: e.target.value })}
                      placeholder="Ex.: Maria Silva Santos"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                        CPF ou CNPJ MEI *
                      </label>
                      <input
                        type="text"
                        value={inscricaoMEI.cpf_ou_cnpj}
                        onChange={(e) =>
                          setInscricaoMEI({ ...inscricaoMEI, cpf_ou_cnpj: e.target.value })
                        }
                        placeholder="000.000.000-00 ou CNPJ"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        value={inscricaoMEI.email}
                        onChange={(e) =>
                          setInscricaoMEI({ ...inscricaoMEI, email: e.target.value })
                        }
                        placeholder="contato@meunegocio.com"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                        WhatsApp
                      </label>
                      <input
                        type="text"
                        value={inscricaoMEI.whatsapp}
                        onChange={(e) =>
                          setInscricaoMEI({ ...inscricaoMEI, whatsapp: e.target.value })
                        }
                        placeholder="(00) 00000-0000"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                        Município
                      </label>
                      <input
                        type="text"
                        value={inscricaoMEI.municipio}
                        onChange={(e) =>
                          setInscricaoMEI({ ...inscricaoMEI, municipio: e.target.value })
                        }
                        placeholder="Ex.: Salvador"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                        UF
                      </label>
                      <input
                        type="text"
                        value={inscricaoMEI.uf}
                        maxLength={2}
                        onChange={(e) =>
                          setInscricaoMEI({ ...inscricaoMEI, uf: e.target.value.toUpperCase() })
                        }
                        placeholder="BA"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                      Patrocinador / Parceria (Opcional)
                    </label>
                    <input
                      type="text"
                      value={inscricaoMEI.patrocinador}
                      onChange={(e) =>
                        setInscricaoMEI({ ...inscricaoMEI, patrocinador: e.target.value })
                      }
                      placeholder="Ex.: SEBRAE / Prefeitura de Salvador / Associação Comercial"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loadingInscricao}
                    className="w-full py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs uppercase tracking-wider transition-all shadow-emerald-glow flex items-center justify-center gap-2"
                  >
                    {loadingInscricao ? 'Registrando...' : 'Iniciar Trilha de 7 Lições'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Trilha Ativa */}
            {meiInscrito && !atestadoGerado && (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Barra de Progresso Gamificada */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)]">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-emerald-700 dark:text-[#12B886]">
                      Lição {licaoAtualIndex + 1} de {totalLicoes}: {licaoAtual.titulo}
                    </span>
                    <span className="font-mono">{progressoPercentual}% Concluído</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#0A1220] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${Math.max(10, progressoPercentual)}%` }}
                    />
                  </div>
                  {/* Navegador de bolinhas das lições */}
                  <div className="flex items-center justify-between gap-1 mt-3">
                    {LICOES_ORBIS_EDUCACAO_MEI.map((licao, idx) => {
                      const concluida = licoesConcluidas.includes(licao.id)
                      const isAtual = idx === licaoAtualIndex
                      return (
                        <button
                          key={licao.id}
                          type="button"
                          onClick={() => {
                            setLicaoAtualIndex(idx)
                            setOpcaoSelecionada(null)
                            setRespostaFeedback(null)
                          }}
                          className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                            isAtual
                              ? 'bg-emerald-600 text-white'
                              : concluida
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-[#0A1220] text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          L{idx + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Card da Lição Atual */}
                <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-xl space-y-5">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-[rgba(244,247,250,0.1)] pb-4">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-[#12B886] text-[10px] font-bold uppercase tracking-wider">
                        Lição {licaoAtual.id} • Duração ~{licaoAtual.tempoMinutos} min
                      </span>
                      <h2 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-[#F4F7FA] mt-1">
                        {licaoAtual.titulo}
                      </h2>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#0A1220] flex items-center justify-center text-emerald-600 dark:text-[#12B886] shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Conteúdo da Lição */}
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-[#CBD5E1] leading-relaxed space-y-3">
                    <p>{licaoAtual.conteudoTexto}</p>
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-xs">
                      <strong className="text-emerald-800 dark:text-emerald-300 block mb-1">
                        💡 Dica prática para seu negócio:
                      </strong>
                      <span className="text-slate-700 dark:text-[#CBD5E1]">
                        {licaoAtual.dicaPratica}
                      </span>
                    </div>
                  </div>

                  {/* Quiz de Fixação */}
                  <div className="pt-4 border-t border-slate-200 dark:border-[rgba(244,247,250,0.08)] space-y-3">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-[#12B886]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F4F7FA]">
                        Quiz de Fixação (Validação de Aprendizado)
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-[#CBD5E1] font-medium">
                      {licaoAtual.perguntaQuiz.enunciado}
                    </p>

                    <div className="space-y-2">
                      {licaoAtual.perguntaQuiz.opcoes.map((opcao, optIdx) => {
                        const isSelected = opcaoSelecionada === optIdx
                        return (
                          <label
                            key={optIdx}
                            onClick={() => {
                              if (!respostaFeedback) {
                                setOpcaoSelecionada(optIdx)
                              }
                            }}
                            className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white font-medium'
                                : 'bg-slate-50 dark:bg-[#0A1220] border-slate-200 dark:border-[rgba(244,247,250,0.1)] text-slate-600 dark:text-[#93A3B5] hover:border-emerald-500/40'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`quiz_${licaoAtual.id}`}
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>{opcao}</span>
                          </label>
                        )
                      })}
                    </div>

                    {/* Feedback do Quiz */}
                    {respostaFeedback && (
                      <div
                        className={`p-3.5 rounded-xl text-xs space-y-1 ${
                          respostaFeedback.correta
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          {respostaFeedback.correta ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Resposta correta!</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                              <span>Resposta incorreta. Tente novamente!</span>
                            </>
                          )}
                        </div>
                        <p className="leading-relaxed">{respostaFeedback.explicacao}</p>
                      </div>
                    )}

                    {/* Botão de Ação */}
                    <div className="pt-2 flex justify-end">
                      {!respostaFeedback ? (
                        <button
                          type="button"
                          disabled={opcaoSelecionada === null}
                          onClick={handleResponderQuiz}
                          className="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs transition-all shadow-sm disabled:opacity-50"
                        >
                          Confirmar Resposta
                        </button>
                      ) : respostaFeedback.correta ? (
                        <button
                          type="button"
                          onClick={handleAvancarLicao}
                          className="px-6 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs transition-all shadow-emerald-glow flex items-center gap-1.5"
                        >
                          <span>
                            {licaoAtualIndex < totalLicoes - 1
                              ? 'Avançar para Próxima Lição'
                              : 'Concluir Trilha & Emitir Atestado'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setOpcaoSelecionada(null)
                            setRespostaFeedback(null)
                          }}
                          className="px-5 py-2.5 rounded-xl font-semibold border border-rose-300 text-rose-600 text-xs"
                        >
                          Tentar Outra Opção
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tela de Atestado Emitido ao Finalizar */}
            {atestadoGerado && (
              <div className="space-y-6">
                <AtestadoParticipacaoOrbisCard atestado={atestadoGerado} />

                {/* Ponte do Funil: Diagnóstico Gratuito + Trial de 5 notas */}
                <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl space-y-4 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                        Próximo Passo no Funil Orbis
                      </span>
                      <h3 className="font-heading font-extrabold text-xl text-white mt-1">
                        Diagnóstico Completo + Trial de 5 Notas
                      </h3>
                      <p className="text-xs text-emerald-100 mt-1 max-w-md">
                        Com seu atestado em mãos, avalie as notas fiscais reais da sua empresa. O
                        cadastro gratuito entrega o diagnóstico sem valores de nota; o trial de 15
                        dias sem cartão calcula 5 notas com pegada por produto.
                      </p>
                    </div>
                    <Link
                      to="/diagnostico"
                      className="px-6 py-3.5 rounded-xl font-bold bg-white text-emerald-800 hover:bg-slate-100 transition-all text-xs uppercase tracking-wider shadow-md shrink-0 whitespace-nowrap"
                    >
                      Acessar Diagnóstico
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 3: ESCOLAS & REDES DE ENSINO (PÚBLICAS E PARTICULARES) */}
        {/* ========================================================= */}
        {activeTab === 'escolas' && (
          <div className="space-y-8 animate-fade-in">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                  Entidade Própria na Plataforma
                </span>
                <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-[#F4F7FA] mt-1">
                  Cadastro e Painel de Escolas
                </h2>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5] mt-1 max-w-2xl">
                  Suporta dois perfis: (a) escola participante pública patrocinada por prefeituras
                  ou secretarias de educação; (b) escola particular compradora direta do programa.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to="/escolas/cadastro"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm flex items-center gap-1.5"
                >
                  <School className="w-4 h-4" />
                  <span>Cadastrar Escola</span>
                </Link>
                <Link
                  to="/escolas/painel"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#16202B] text-slate-800 dark:text-[#F4F7FA] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] transition-all flex items-center gap-1.5"
                >
                  <Building className="w-4 h-4" />
                  <span>Painel do Programa</span>
                </Link>
              </div>
            </div>

            {/* Comparativo dos 2 Perfis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-[#12B886] text-xs font-bold uppercase">
                  (a) Escola Pública Participante
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F4F7FA]">
                  Inscrita via Secretaria ou Patrocinador
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5] leading-relaxed">
                  Rede municipal ou estadual com inscrição individual ou em lote. Custo zero para a
                  escola e para os alunos, com custeio via patrocinador B2B2C ou convênio público.
                </p>
                <ul className="text-xs text-slate-600 dark:text-[#93A3B5] space-y-1.5">
                  <li>✓ Inscrição em lote por planilha ou formulário</li>
                  <li>✓ Relatório consolidado para secretarias de educação</li>
                  <li>✓ Atestados emitidos com hash para alunos e turmas</li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase">
                  (b) Escola Particular Compradora Direta
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F4F7FA]">
                  Camada Comercial por Faixa de Alunos
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5] leading-relaxed">
                  Contratação direta pela instituição de ensino para implementar a trilha curricular
                  de sustentabilidade e emitir atestados aos estudantes.
                </p>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-[#D9B36C] text-xs">
                  <strong>Nota Canônica:</strong> As faixas de preço para particulares estão
                  mantidas como placeholders para fechamento oficial após a conclusão do piloto
                  municipal.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 4: BLOCO "PATROCINE ESTE PROGRAMA" (B2B2C) */}
        {/* ========================================================= */}
        {activeTab === 'patrocinio' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase">
                <Building2 className="w-4 h-4" />
                PATROCINE ESTE PROGRAMA • B2B2C
              </div>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-[#F4F7FA]">
                Impacto Real para Prefeituras, SEBRAE e Grandes Compradores
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5]">
                Financie a capacitação de MEIs e comunidades escolares da sua região ou cadeia de
                suprimentos. O participante recebe de graça; o patrocinador recebe métricas
                rastreáveis de impacto com prova documental.
              </p>
            </div>

            {patrocinioEnviado ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-emerald-500/40 text-center space-y-3 shadow-xl">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500 mx-auto flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white">
                  Proposta de Patrocínio Recebida
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5] max-w-md mx-auto">
                  Entraremos em contato com a equipe de responsabilidade socioambiental da sua
                  entidade para apresentar os formatos de adesão, cotas e integração ao painel de
                  impacto.
                </p>
                <button
                  type="button"
                  onClick={() => setPatrocinioEnviado(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white"
                >
                  Enviar Outra Solicitação
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setPatrocinioEnviado(true)
                }}
                className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-xl space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                      Nome da Entidade / Empresa *
                    </label>
                    <input
                      type="text"
                      value={patrocinioForm.entidade}
                      onChange={(e) =>
                        setPatrocinioForm({ ...patrocinioForm, entidade: e.target.value })
                      }
                      placeholder="Ex.: Prefeitura Municipal / SEBRAE / Empresa S.A."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                      Tipo de Organização
                    </label>
                    <select
                      value={patrocinioForm.tipo}
                      onChange={(e) =>
                        setPatrocinioForm({ ...patrocinioForm, tipo: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                    >
                      <option value="prefeitura">Prefeitura Municipal / Secretaria</option>
                      <option value="sebrae">SEBRAE / Sistema S</option>
                      <option value="associacao">Associação Comercial / CDL</option>
                      <option value="grande_comprador">
                        Grande Empresa / Cadeia de Compradores
                      </option>
                      <option value="instituto">Instituto / Fundação Corporativa</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                      Responsável pelo Contato *
                    </label>
                    <input
                      type="text"
                      value={patrocinioForm.contatoNome}
                      onChange={(e) =>
                        setPatrocinioForm({ ...patrocinioForm, contatoNome: e.target.value })
                      }
                      placeholder="Nome do gestor"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                      E-mail Institucional *
                    </label>
                    <input
                      type="email"
                      value={patrocinioForm.email}
                      onChange={(e) =>
                        setPatrocinioForm({ ...patrocinioForm, email: e.target.value })
                      }
                      placeholder="gestor@orgao.gov.br"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={patrocinioForm.telefone}
                      onChange={(e) =>
                        setPatrocinioForm({ ...patrocinioForm, telefone: e.target.value })
                      }
                      placeholder="(00) 0000-0000"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                      Município e UF Alvo
                    </label>
                    <input
                      type="text"
                      value={patrocinioForm.municipioUf}
                      onChange={(e) =>
                        setPatrocinioForm({ ...patrocinioForm, municipioUf: e.target.value })
                      }
                      placeholder="Ex.: Curitiba/PR ou Salvador/BA"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                      Estimativa de Público a Capacitar
                    </label>
                    <select
                      value={patrocinioForm.estimativaPublico}
                      onChange={(e) =>
                        setPatrocinioForm({ ...patrocinioForm, estimativaPublico: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                    >
                      <option value="100_a_500">100 a 500 MEIs / Alunos</option>
                      <option value="500_a_2000">500 a 2.000 MEIs / Alunos</option>
                      <option value="2000_a_10000">2.000 a 10.000 MEIs / Alunos</option>
                      <option value="acima_10000">Acima de 10.000 (Rede Completa)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                    Mensagem ou Objetivos do Patrocínio
                  </label>
                  <textarea
                    rows={3}
                    value={patrocinioForm.mensagem}
                    onChange={(e) =>
                      setPatrocinioForm({ ...patrocinioForm, mensagem: e.target.value })
                    }
                    placeholder="Descreva as metas de inclusão, escolas envolvidas ou cadeias de fornecedores que pretende engajar."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Solicitação de Parceria B2B2C</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
