import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  submeterCredenciamentoPerito,
  TERMO_CREDENCIAMENTO_VERSAO,
  SolicitarCredenciamentoInput,
} from '@/services/peritoService'
import { LISTA_PROTOCOLOS_SETORIAIS } from '@/data/protocolosSetoriais'
import {
  ShieldCheck,
  CheckCircle2,
  Upload,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  Lock,
  UserCheck,
  BadgeCheck,
} from 'lucide-react'

export default function CredenciamentoPeritoPage() {
  const { user, isAuthenticated } = useAuth()

  const [formData, setFormData] = useState<SolicitarCredenciamentoInput>({
    nome_completo: user?.name || '',
    cpf: '',
    conselho_tipo: 'CREA',
    registro_profissional: '',
    registro_uf: 'SP',
    email_corporativo: user?.email || '',
    telefone: '',
    areas_atuacao: ['automotiva', 'siderurgia'],
    numero_art_rrt: '',
    documento_art_arquivo: null,
    aceite_termo: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [createdRecordId, setCreatedRecordId] = useState('')

  const handleToggleArea = (slug: string) => {
    setFormData((prev) => {
      const exists = prev.areas_atuacao.includes(slug)
      if (exists) {
        return { ...prev, areas_atuacao: prev.areas_atuacao.filter((s) => s !== slug) }
      } else {
        return { ...prev, areas_atuacao: [...prev.areas_atuacao, slug] }
      }
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        documento_art_arquivo: e.target.files![0],
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!formData.aceite_termo) {
      setErrorMessage(
        'É necessário ler e aceitar o Termo de Credenciamento Pericial para prosseguir.',
      )
      return
    }

    if (
      !formData.nome_completo ||
      !formData.cpf ||
      !formData.registro_profissional ||
      !formData.email_corporativo
    ) {
      setErrorMessage(
        'Por favor, preencha todos os campos obrigatórios marcados com asterisco (*).',
      )
      return
    }

    if (formData.areas_atuacao.length === 0) {
      setErrorMessage('Selecione pelo menos uma área/protocolo setorial de atuação pericial.')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await submeterCredenciamentoPerito(formData)
      setCreatedRecordId(res.id)
      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      setErrorMessage(
        err?.message ||
          'Falha ao enviar solicitação de credenciamento. Verifique os dados e tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12] text-[#F4F7FA]">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12B886]/10 border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-4">
            <BadgeCheck className="w-4 h-4 text-[#12B886]" />
            CORPO TÉCNICO & HOMOLOGAÇÃO ART / RRT
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] tracking-tight mb-3">
            Credenciamento de Perito Técnico Oficial
          </h1>
          <p className="text-xs sm:text-sm text-[#93A3B5] max-w-xl mx-auto leading-relaxed">
            Habilite-se para assinar laudos periciais dMRV, inventários de emissões GHG, pareceres
            SBCE e dossiês de conformidade do Orbis Protocol perante conselhos de classe (CREA / CRC
            / CRQ).
          </p>
        </div>

        {success ? (
          <div className="p-8 sm:p-10 rounded-3xl bg-[#111820] border border-[#12B886] shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#12B886]/20 border border-[#12B886] flex items-center justify-center mx-auto text-[#12B886]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
                Solicitação de Credenciamento Registrada!
              </h2>
              <p className="text-xs sm:text-sm text-[#93A3B5] max-w-lg mx-auto">
                Seu cadastro de perito foi recebido e está na fila de homologação do Console do
                Auditor.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#93A3B5]">Protocolo de Registro:</span>
                <span className="font-mono text-[#D9B36C] font-semibold">{createdRecordId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#93A3B5]">Status Inicial:</span>
                <span className="px-2 py-0.5 rounded bg-[#D9B36C]/20 text-[#D9B36C] font-bold uppercase text-[10px]">
                  Pendente de Conferência
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#93A3B5]">Termo de Aceite:</span>
                <span className="font-mono text-[#12B886]">{TERMO_CREDENCIAMENTO_VERSAO}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#16202B]/60 border border-[rgba(244,247,250,0.1)] text-xs text-[#93A3B5] max-w-lg mx-auto text-left leading-relaxed">
              <strong className="text-[#F4F7FA] block mb-1">Próximos passos para o Perito:</strong>
              1. A auditoria central fará a conferência do número de registro no conselho regional.
              <br />
              2. Caso você ainda não possua acesso com o e-mail{' '}
              <strong className="text-[#12B886]">{formData.email_corporativo}</strong>, realize o
              cadastro na plataforma com este mesmo endereço para que suas permissões de "perito"
              sejam vinculadas automaticamente.
              <br />
              3. Após aprovação, suas assinaturas e ART/RRT constarão oficialmente nos laudos
              exportados.
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all"
              >
                Voltar à Página Inicial
              </Link>
              <Link
                to="/solucoes/cadeias-produtivas"
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] transition-all"
              >
                Ver os 15 Protocolos Setoriais
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {errorMessage && (
              <div className="p-4 rounded-xl bg-[#F03E54]/10 border border-[#F03E54]/40 text-[#F03E54] text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SEÇÃO 1: DADOS PROFISSIONAIS DO PERITO */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-5">
              <div className="flex items-center gap-3 border-b border-[rgba(244,247,250,0.08)] pb-4">
                <div className="p-2 rounded-xl bg-[#12B886]/10 text-[#12B886]">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#F4F7FA]">
                    1. Identificação Profissional & Conselho de Classe
                  </h2>
                  <p className="text-xs text-[#93A3B5]">
                    Dados do perito habilitado perante órgão regulamentador oficial
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#93A3B5] mb-1.5">
                    Nome Completo do Perito *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome_completo}
                    onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                    placeholder="Ex.: Dr. Eng. Carlos Mendonça"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] text-xs focus:border-[#12B886] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#93A3B5] mb-1.5">
                    CPF do Perito *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] text-xs focus:border-[#12B886] outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-[#93A3B5] mb-1.5">
                      Conselho *
                    </label>
                    <select
                      value={formData.conselho_tipo}
                      onChange={(e: any) =>
                        setFormData({ ...formData, conselho_tipo: e.target.value })
                      }
                      className="w-full px-2 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] text-xs focus:border-[#12B886] outline-none"
                    >
                      <option value="CREA">CREA</option>
                      <option value="CRC">CRC</option>
                      <option value="CRQ">CRQ</option>
                      <option value="CRBio">CRBio</option>
                      <option value="OAB">OAB</option>
                      <option value="OUTRO">Outro</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-[#93A3B5] mb-1.5">
                      Nº Registro Profissional *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.registro_profissional}
                      onChange={(e) =>
                        setFormData({ ...formData, registro_profissional: e.target.value })
                      }
                      placeholder="Ex: 506.128/D"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] text-xs focus:border-[#12B886] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#93A3B5] mb-1.5">
                    UF do Conselho Regional *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={formData.registro_uf}
                    onChange={(e) =>
                      setFormData({ ...formData, registro_uf: e.target.value.toUpperCase() })
                    }
                    placeholder="SP, RJ, BA, PR..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] text-xs uppercase focus:border-[#12B886] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#93A3B5] mb-1.5">
                    E-mail Corporativo do Perito *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email_corporativo}
                    onChange={(e) =>
                      setFormData({ ...formData, email_corporativo: e.target.value })
                    }
                    placeholder="perito@engenharia.com.br"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] text-xs focus:border-[#12B886] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#93A3B5] mb-1.5">
                    Telefone / WhatsApp com DDD *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] text-xs focus:border-[#12B886] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: ÁREAS DE ATUAÇÃO E PROTOCOLOS SETORIAIS */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4">
              <div className="flex items-center gap-3 border-b border-[rgba(244,247,250,0.08)] pb-4">
                <div className="p-2 rounded-xl bg-[#D9B36C]/10 text-[#D9B36C]">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#F4F7FA]">
                    2. Áreas de Habilitação & Protocolos Setoriais
                  </h2>
                  <p className="text-xs text-[#93A3B5]">
                    Selecione as cadeias produtivas em que você possui competência para emissão de
                    laudos
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {LISTA_PROTOCOLOS_SETORIAIS.map((prot) => {
                  const selected = formData.areas_atuacao.includes(prot.slug)
                  return (
                    <button
                      type="button"
                      key={prot.slug}
                      onClick={() => handleToggleArea(prot.slug)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? 'bg-[#12B886]/15 border-[#12B886] text-[#F4F7FA]'
                          : 'bg-[#0A0E12] border-[rgba(244,247,250,0.08)] text-[#93A3B5] hover:border-[rgba(244,247,250,0.2)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono uppercase text-[#D9B36C]">
                          {selected ? 'Habilitado' : 'Disponível'}
                        </span>
                        {selected && <CheckCircle2 className="w-3.5 h-3.5 text-[#12B886]" />}
                      </div>
                      <div className="text-xs font-semibold leading-tight">{prot.nome}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* SEÇÃO 3: DOCUMENTAÇÃO COMPROBATÓRIA (ART / RRT) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4">
              <div className="flex items-center gap-3 border-b border-[rgba(244,247,250,0.08)] pb-4">
                <div className="p-2 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#F4F7FA]">
                    3. Documentação Comprobatória (ART / RRT)
                  </h2>
                  <p className="text-xs text-[#93A3B5]">
                    Referência e upload da Anotação de Responsabilidade Técnica ou RRT do Conselho
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#93A3B5] mb-1.5">
                    Número da ART / RRT Ativa (Opcional se anexar arquivo)
                  </label>
                  <input
                    type="text"
                    value={formData.numero_art_rrt}
                    onChange={(e) => setFormData({ ...formData, numero_art_rrt: e.target.value })}
                    placeholder="Ex.: ART-2025-098124-SP"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] text-xs focus:border-[#12B886] outline-none font-mono"
                  />
                  <p className="text-[10px] text-[#93A3B5] mt-1">
                    Este número figurará na chancela oficial de assinatura dos laudos periciais
                    gerados.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#93A3B5] mb-1.5">
                    Upload da ART/RRT ou Carteira Profissional (PDF/Imagem)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] text-[#93A3B5] text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#12B886]/10 file:text-[#12B886] hover:file:bg-[#12B886]/20 cursor-pointer"
                  />
                  <p className="text-[10px] text-[#93A3B5] mt-1">
                    {formData.documento_art_arquivo
                      ? `Arquivo selecionado: ${formData.documento_art_arquivo.name}`
                      : 'Anexe o comprovante de registro ou ART modelo de múltipla atuação.'}
                  </p>
                </div>
              </div>
            </div>

            {/* SEÇÃO 4: TERMO DE CREDENCIAMENTO PERICIAL VERSIONADO */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4">
              <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.08)] pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#12B886]" />
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA]">
                    Termo de Credenciamento & Responsabilidade Técnica
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#D9B36C] bg-[#16202B] px-2 py-0.5 rounded">
                  Versão {TERMO_CREDENCIAMENTO_VERSAO}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-[11px] text-[#93A3B5] space-y-2 max-h-40 overflow-y-auto leading-relaxed">
                <p>
                  1. O profissional signatário declara, sob as penas da lei e do respectivo Código
                  de Ética Profissional (CREA, CRC ou congênere), que detém habilitação técnica
                  regular e plena capacidade jurídica para atuar como Responsável Técnico nos
                  diagnósticos e laudos emitidos na plataforma Orbis Protocol.
                </p>
                <p>
                  2. Toda análise, validação de fator de emissão, chancela de integridade em
                  inventários dMRV ou atesto de elegibilidade a créditos de descarbonização (MOVER,
                  SBCE, Linhas Verdes) obedece aos critérios metodológicos do IPCC, ABNT NBR ISO
                  14064, GLEC Framework e legislação tributária vigente (LC 214/2025).
                </p>
                <p>
                  3. Os registros de data/hora UTC e IP de conexão são arquivados para fins de
                  auditoria de conformidade, garantindo rastreabilidade pericial e integridade da
                  custódia documental.
                </p>
              </div>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.aceite_termo}
                  onChange={(e) => setFormData({ ...formData, aceite_termo: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-[#12B886] focus:ring-0 border-[rgba(244,247,250,0.2)] bg-[#111820]"
                />
                <span className="text-xs text-[#F4F7FA] leading-relaxed">
                  Declaro que li, compreendi e aceito integralmente o{' '}
                  <strong className="text-[#12B886]">
                    Termo de Credenciamento e Responsabilidade Técnica (
                    {TERMO_CREDENCIAMENTO_VERSAO})
                  </strong>
                  , atestando a veracidade de todas as informações e registros profissionais
                  submetidos.
                </span>
              </label>
            </div>

            {/* BOTÃO DE SUBMISSÃO */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <span className="text-xs text-[#93A3B5]">
                Dúvidas sobre credenciamento? Contate a auditoria central via
                peritos@orbisprotocol.org
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Registrando Credenciamento...</span>
                ) : (
                  <>
                    <span>Enviar Solicitação de Credenciamento</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
