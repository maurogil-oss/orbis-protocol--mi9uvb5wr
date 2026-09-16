import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  User,
  Building,
  KeyRound,
  FileSpreadsheet,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { criarSolicitacaoLGPD, TipoPedidoLGPD, SolicitacaoLGPD } from '@/services/lgpdService'

export default function CanalTitularPage() {
  const [formData, setFormData] = useState({
    nome_titular: '',
    email_titular: '',
    cpf_cnpj_titular: '',
    tipo_pedido: 'acesso_dados' as TipoPedidoLGPD,
    descricao: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState<SolicitacaoLGPD | null>(null)

  const TIPOS: { id: TipoPedidoLGPD; label: string; desc: string }[] = [
    {
      id: 'confirmacao_existencia',
      label: 'Confirmação de Tratamento',
      desc: 'Saber se o Orbis Protocol ou a MGM tratam algum dado pessoal sob sua titularidade.',
    },
    {
      id: 'acesso_dados',
      label: 'Acesso aos Dados Cadastrais',
      desc: 'Obter extrato completo de todos os dados cadastrais, técnicos e fiscais sob seu CPF/CNPJ.',
    },
    {
      id: 'correcao',
      label: 'Correção de Dados',
      desc: 'Atualizar ou retificar dados incompletos, inexatos ou desatualizados em laudos e cadastros.',
    },
    {
      id: 'anonimizacao_bloqueio_eliminacao',
      label: 'Anonimização, Bloqueio ou Eliminação',
      desc: 'Solicitar o expurgo ou desvinculação de dados desnecessários ou excessivos.',
    },
    {
      id: 'portabilidade',
      label: 'Portabilidade de Dados',
      desc: 'Exportar os dados em formato estruturado e interoperável para outro operador.',
    },
    {
      id: 'revogacao_consentimento',
      label: 'Revogação do Consentimento',
      desc: 'Retirar a autorização anteriormente concedida para triagem ou comunicações institucionais.',
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setIsSubmitting(true)

    if (
      !formData.nome_titular ||
      !formData.email_titular ||
      !formData.cpf_cnpj_titular ||
      !formData.descricao
    ) {
      setErro('Por favor, preencha todos os campos obrigatórios.')
      setIsSubmitting(false)
      return
    }

    try {
      const sol = await criarSolicitacaoLGPD({
        tipo_pedido: formData.tipo_pedido,
        nome_titular: formData.nome_titular,
        email_titular: formData.email_titular,
        cpf_cnpj_titular: formData.cpf_cnpj_titular,
        descricao: formData.descricao,
      })
      setSucesso(sol)
    } catch (err: any) {
      setErro(err.message || 'Falha ao registrar sua solicitação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/privacidade"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#93A3B5] hover:text-[#12B886] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Política de Privacidade</span>
          </Link>
          <span className="text-[11px] font-mono text-[#D9B36C]">
            Canal do Titular • Art. 18 Lei 13.709/2018
          </span>
        </div>

        {/* Hero Card */}
        <div className="p-8 sm:p-10 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-2xl mb-8 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-xs font-bold tracking-wider uppercase mb-3">
            <ShieldCheck className="w-4 h-4 text-[#12B886]" />
            CANAL DO TITULAR DE DADOS PESSOAIS
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA] mb-3">
            EXERCÍCIO DE DIREITOS DO TITULAR (ART. 18 LGPD)
          </h1>
          <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed max-w-3xl">
            Este canal exclusivo permite ao titular de dados ou ao seu representante legal
            formalizar solicitações perante a controladora{' '}
            <strong className="text-[#F4F7FA]">MGM CONSULTORIA EMPRESARIAL LTDA</strong> (CNPJ
            19.598.964/0001-01) e a infraestrutura{' '}
            <strong className="text-[#F4F7FA]">Orbis Protocol</strong>. Todas as manifestações geram
            protocolo imutável e possuem prazo legal de resposta de até{' '}
            <strong className="text-[#12B886]">15 dias</strong> conforme o Art. 19, II da Lei Geral
            de Proteção de Dados.
          </p>

          <div className="mt-6 pt-6 border-t border-[rgba(244,247,250,0.08)] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2 text-[#93A3B5]">
              <Clock className="w-4 h-4 text-[#D9B36C] shrink-0" />
              <span>
                Prazo de resposta: <strong>15 dias corridos</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#93A3B5]">
              <Lock className="w-4 h-4 text-[#12B886] shrink-0" />
              <span>Protocolo auditável com hash SHA-256</span>
            </div>
            <div className="flex items-center gap-2 text-[#93A3B5]">
              <Mail className="w-4 h-4 text-[#12B886] shrink-0" />
              <span>
                DPO: <strong>dpo@mgmconsultoria.com.br</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Feedback / Sucesso ou Formulário */}
        {sucesso ? (
          <div className="p-8 sm:p-10 rounded-2xl bg-[#111820] border border-[#12B886] text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#12B886]/10 border border-[#12B886] flex items-center justify-center text-[#12B886] mx-auto shadow-emerald-glow">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#12B886] block">
                SOLICITAÇÃO PROTOCOLADA COM SUCESSO
              </span>
              <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA] mt-1">
                SEU PEDIDO FOI ENVIADO AO ENCARREGADO (DPO)
              </h2>
              <p className="text-xs sm:text-sm text-[#93A3B5] mt-2 max-w-lg mx-auto">
                Guarde o número do protocolo abaixo para acompanhar o andamento. Nossa equipe de
                privacidade responderá via e-mail dentro do prazo legal.
              </p>
            </div>

            {/* Protocol Card */}
            <div className="p-6 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 text-left max-w-xl mx-auto space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-[rgba(244,247,250,0.08)] pb-2">
                <span className="text-[#93A3B5]">Número do Protocolo:</span>
                <span className="font-mono text-sm font-bold text-[#D9B36C]">
                  {sucesso.protocolo}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-[rgba(244,247,250,0.08)] pb-2">
                <span className="text-[#93A3B5]">Titular Solicitante:</span>
                <span className="font-semibold text-[#F4F7FA]">{sucesso.nome_titular}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[rgba(244,247,250,0.08)] pb-2">
                <span className="text-[#93A3B5]">E-mail Registrado:</span>
                <span className="font-semibold text-[#12B886]">{sucesso.email_titular}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[rgba(244,247,250,0.08)] pb-2">
                <span className="text-[#93A3B5]">Tipo de Requerimento:</span>
                <span className="font-semibold text-[#F4F7FA] uppercase">
                  {sucesso.tipo_pedido.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-[rgba(244,247,250,0.08)] pb-2">
                <span className="text-[#93A3B5]">Prazo Legal de Resposta:</span>
                <span className="font-bold text-[#12B886]">
                  Até 15 dias corridos ({sucesso.data_limite_resposta})
                </span>
              </div>
              {sucesso.hash_protocolo && (
                <div className="pt-1">
                  <span className="text-[10px] text-[#93A3B5] block mb-1">
                    Hash Probatório (SHA-256):
                  </span>
                  <span className="font-mono text-[10px] text-[#93A3B5]/80 break-all block bg-[#111820] p-2 rounded">
                    {sucesso.hash_protocolo}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/privacidade"
                className="px-6 py-3 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] text-xs uppercase tracking-wider transition-all shadow-emerald-glow"
              >
                Conferir Política de Privacidade
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSucesso(null)
                  setFormData({
                    nome_titular: '',
                    email_titular: '',
                    cpf_cnpj_titular: '',
                    tipo_pedido: 'acesso_dados',
                    descricao: '',
                  })
                }}
                className="px-5 py-3 rounded-xl font-semibold border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] text-xs"
              >
                Registrar Outro Requerimento
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-6 shadow-xl"
          >
            {erro && (
              <div className="p-4 rounded-xl bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs text-[#F03E54] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            {/* Seleção do Tipo de Pedido */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-2">
                1. Selecione o Tipo de Requerimento (Art. 18) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TIPOS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo_pedido: t.id })}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      formData.tipo_pedido === t.id
                        ? 'bg-[#12B886]/10 border-[#12B886] shadow-sm'
                        : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)] text-[#93A3B5] hover:border-[rgba(244,247,250,0.25)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-xs text-[#F4F7FA]">
                        {t.label}
                      </span>
                      {formData.tipo_pedido === t.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#12B886]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#93A3B5] leading-relaxed">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Dados do Solicitante */}
            <div className="pt-2 border-t border-[rgba(244,247,250,0.08)]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-3">
                2. Identificação do Titular / Requerente *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-[#93A3B5] mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome_titular}
                    onChange={(e) => setFormData({ ...formData, nome_titular: e.target.value })}
                    placeholder="Nome do titular"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#93A3B5] mb-1">
                    E-mail Corporativo/Pessoal *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email_titular}
                    onChange={(e) => setFormData({ ...formData, email_titular: e.target.value })}
                    placeholder="email@empresa.com.br"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#93A3B5] mb-1">
                    CPF ou CNPJ Vinculado *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cpf_cnpj_titular}
                    onChange={(e) => setFormData({ ...formData, cpf_cnpj_titular: e.target.value })}
                    placeholder="000.000.000-00 ou CNPJ"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Descrição do Pedido */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1">
                3. Descrição e Especificação do Pedido *
              </label>
              <textarea
                rows={4}
                required
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Detalhe sua solicitação (ex.: desejo receber a relação de dados coletados no diagnóstico do CNPJ XX.XXX.XXX/0001-XX ou revogar o consentimento para contatos futuros)."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886] leading-relaxed"
              />
            </div>

            {/* Aviso Legal & Encarregado */}
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex items-start gap-3 text-xs text-[#93A3B5]">
              <ShieldCheck className="w-5 h-5 text-[#12B886] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Ao enviar este pedido, a{' '}
                <strong className="text-[#F4F7FA]">MGM Consultoria Empresarial</strong> e a{' '}
                <strong className="text-[#F4F7FA]">Orbis Protocol</strong> realizarão a verificação
                de identidade do titular para segurança das informações, respondendo em até 15 dias
                nos termos dos Artigos 18 e 19 da LGPD.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Link
                to="/privacidade"
                className="px-5 py-3 rounded-xl font-semibold border border-[rgba(244,247,250,0.2)] text-[#93A3B5] hover:text-[#F4F7FA] text-xs"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Gerando protocolo imutável...'
                  : 'Protocolar Requerimento (15 Dias)'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
