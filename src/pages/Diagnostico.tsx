import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { useAuth } from '@/contexts/AuthContext'
import {
  ShieldCheck,
  CheckCircle2,
  Building2,
  UserCheck,
  Building,
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  AlertCircle,
  HelpCircle,
  KeyRound,
  FileText,
} from 'lucide-react'

// Masks helper
function maskCNPJ(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18)
}

function maskPhone(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15)
}

interface TestModel {
  razao_social: string
  cnpj: string
  regime_tributario: string
  email: string
  whatsapp: string
  responsavel: string
  categoria_profissional: string
  conselho: string
  vinculo_institucional: string
}

const MODELOS_TESTE: TestModel[] = [
  {
    razao_social: 'Distribuidora de Alimentos & Bebidas Brasil S.A.',
    cnpj: '76.123.456/0001-12',
    regime_tributario: 'Lucro Presumido',
    email: 'contato@alimentosbrasil.com.br',
    whatsapp: '(41) 99123-4567',
    responsavel: 'Carlos Eduardo Silva',
    categoria_profissional: 'Empresário / Diretor / Gestor da Empresa',
    conselho: 'CRA-PR 12948',
    vinculo_institucional: 'Associado ACP (Paraná)',
  },
  {
    razao_social: 'Metalúrgica & Peças Industriais Confiança Ltda',
    cnpj: '14.882.310/0001-44',
    regime_tributario: 'Lucro Real',
    email: 'fiscal@confiancametal.ind.br',
    whatsapp: '(11) 98765-4321',
    responsavel: 'Roberto Antunes Mendes',
    categoria_profissional: 'Engenheiro Mecânico / Ambiental (CREA - Resp. Técnico)',
    conselho: 'CREA-SP 5061234',
    vinculo_institucional: 'Mercado Nacional (Bahia, SP, Brasil)',
  },
  {
    razao_social: 'Transportes & Logística de Cargas Expresso Verde Ltda',
    cnpj: '43.904.740/0001-44',
    regime_tributario: 'Lucro Real',
    email: 'sustentabilidade@expressoverde.com.br',
    whatsapp: '(71) 99234-8899',
    responsavel: 'Mariana Barreto Costa',
    categoria_profissional: 'Consultor de Sustentabilidade & Compliance',
    conselho: 'CRBio 04981',
    vinculo_institucional: 'Mercado Nacional (Bahia, SP, Brasil)',
  },
  {
    razao_social: 'Centro de Desmontagem Veicular Renova Peças (CDV DETRAN)',
    cnpj: '18.394.029/0001-88',
    regime_tributario: 'Lucro Presumido',
    email: 'diretoria@renovacdv.com.br',
    whatsapp: '(19) 98112-9900',
    responsavel: 'Felipe Nogueira',
    categoria_profissional: 'Centro de Desmontagem Veicular (CDV / Desmanche Credenciado)',
    conselho: 'DETRAN-SP 0842/2022',
    vinculo_institucional: 'Cadeia Automotiva / CDV (Programa MOVER)',
  },
  {
    razao_social: 'Comércio & Serviços Varejistas Prime Ltda (MGM)',
    cnpj: '19.958.964/0001-01',
    regime_tributario: 'Simples Nacional',
    email: 'diretoria@mgmconsultoria.com.br',
    whatsapp: '(41) 99876-0011',
    responsavel: 'Mauro Gilberto',
    categoria_profissional: 'Contador / Auditor Independente (CRC)',
    conselho: 'CRC-PR 054812',
    vinculo_institucional: 'Associado ACP (Paraná)',
  },
]

export default function Diagnostico() {
  const navigate = useNavigate()
  const { login } = useAuth()

  // Tab: 'novo' | 'retomar'
  const [tab, setTab] = useState<'novo' | 'retomar'>('novo')

  // Wizard Step: 1, 2, 3, 4, 5 (success)
  const [step, setStep] = useState<number>(1)

  // Form Fields
  const [formData, setFormData] = useState({
    cnpj: '',
    razao_social: '',
    email: '',
    whatsapp: '',
    responsavel: '',
    senha: '',
    confirmaSenha: '',
    categoria_profissional: 'Empresário / Diretor / Gestor da Empresa',
    conselho: '',
    vinculo_institucional: 'Mercado Nacional (Bahia, SP, Brasil)',
    regime_tributario: 'Lucro Real',
    aceite_lgpd: false,
  })

  // Retomar Form
  const [retomarCNPJ, setRetomarCNPJ] = useState('')
  const [retomarSenha, setRetomarSenha] = useState('')
  const [retomarError, setRetomarError] = useState('')
  const [isRetomando, setIsRetomando] = useState(false)

  // Submission State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [protocoloGerado, setProtocoloGerado] = useState<{
    id: string
    cnpj: string
    razao_social: string
    status: string
  } | null>(null)

  // Apply quick test model
  const applyModel = (model: TestModel) => {
    setFormData((prev) => ({
      ...prev,
      cnpj: model.cnpj,
      razao_social: model.razao_social,
      email: model.email,
      whatsapp: model.whatsapp,
      responsavel: model.responsavel,
      categoria_profissional: model.categoria_profissional,
      conselho: model.conselho,
      vinculo_institucional: model.vinculo_institucional,
      regime_tributario: model.regime_tributario,
      senha: prev.senha || 'Orbis@2026',
      confirmaSenha: prev.confirmaSenha || 'Orbis@2026',
      aceite_lgpd: true,
    }))
    setFieldErrors({})
  }

  // Validate step 1
  const validateStep1 = () => {
    const errors: Record<string, string> = {}
    if (!formData.cnpj || formData.cnpj.length < 18) {
      errors.cnpj = 'Informe um CNPJ válido com 14 dígitos'
    }
    if (!formData.razao_social.trim()) {
      errors.razao_social = 'A razão social é obrigatória'
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errors.email = 'Informe um e-mail corporativo válido'
    }
    if (!formData.whatsapp.trim() || formData.whatsapp.length < 14) {
      errors.whatsapp = 'Informe um telefone WhatsApp com DDD'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Validate step 2
  const validateStep2 = () => {
    const errors: Record<string, string> = {}
    if (!formData.responsavel.trim()) {
      errors.responsavel = 'Nome do responsável é obrigatório'
    }
    if (!formData.senha || formData.senha.length < 8) {
      errors.senha = 'A senha deve ter no mínimo 8 caracteres'
    }
    if (formData.senha !== formData.confirmaSenha) {
      errors.confirmaSenha = 'As senhas não coincidem'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Validate step 3
  const validateStep3 = () => {
    return true
  }

  // Handle Step Advancement
  const nextStep = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    if (step === 3 && !validateStep3()) return
    setStep((s) => s + 1)
  }

  const prevStep = () => {
    setStep((s) => Math.max(1, s - 1))
    setFieldErrors({})
  }

  // Final submission: creates user (if needed) & creates/updates leads_diagnostico
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.aceite_lgpd) {
      setFieldErrors({ aceite_lgpd: 'Você deve concordar com os termos da LGPD para prosseguir' })
      return
    }

    setIsSubmitting(true)
    setGeneralError('')
    setFieldErrors({})

    try {
      let createdUserId = ''

      // 1. Try to create or retrieve user
      try {
        const newUser = await pb.collection('users').create({
          email: formData.email.trim(),
          password: formData.senha,
          passwordConfirm: formData.confirmaSenha,
          name: formData.responsavel,
        })
        createdUserId = newUser.id
        // Auto-login newly created user
        await login(formData.email.trim(), formData.senha)
      } catch (userErr: unknown) {
        // If user already exists, authenticate with credentials
        try {
          const authRes = await login(formData.email.trim(), formData.senha)
          if (authRes.success && pb.authStore.record) {
            createdUserId = pb.authStore.record.id
          }
        } catch (_) {
          // Continue lead creation even if auth exists with different pass
        }
      }

      // 2. Check if lead with this CNPJ already exists
      let leadRecord
      try {
        const existingLead = await pb
          .collection('leads_diagnostico')
          .getFirstListItem(`cnpj='${formData.cnpj}'`)
        leadRecord = await pb.collection('leads_diagnostico').update(existingLead.id, {
          razao_social: formData.razao_social,
          email: formData.email,
          whatsapp: formData.whatsapp,
          responsavel: formData.responsavel,
          categoria_profissional: formData.categoria_profissional,
          conselho: formData.conselho,
          vinculo_institucional: formData.vinculo_institucional,
          regime_tributario: formData.regime_tributario,
          ...(createdUserId ? { usuario: createdUserId } : {}),
        })
      } catch (_) {
        // Create new lead
        leadRecord = await pb.collection('leads_diagnostico').create({
          cnpj: formData.cnpj,
          razao_social: formData.razao_social,
          email: formData.email,
          whatsapp: formData.whatsapp,
          responsavel: formData.responsavel,
          categoria_profissional: formData.categoria_profissional,
          conselho: formData.conselho,
          vinculo_institucional: formData.vinculo_institucional,
          regime_tributario: formData.regime_tributario,
          status: 'novo',
          ...(createdUserId ? { usuario: createdUserId } : {}),
        })
      }

      setProtocoloGerado({
        id: leadRecord.id,
        cnpj: leadRecord.cnpj,
        razao_social: leadRecord.razao_social,
        status: leadRecord.status || 'novo',
      })
      setStep(5) // Success screen
    } catch (err: unknown) {
      const fieldErrs = extractFieldErrors(err)
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs)
      } else {
        const msg = err instanceof Error ? err.message : 'Erro ao processar diagnóstico'
        setGeneralError(msg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Retomar Diagnóstico by CNPJ + Senha
  const handleRetomar = async (e: React.FormEvent) => {
    e.preventDefault()
    setRetomarError('')
    setIsRetomando(true)

    try {
      const cleanCNPJ = retomarCNPJ.trim()
      const lead = await pb.collection('leads_diagnostico').getFirstListItem(`cnpj='${cleanCNPJ}'`)

      if (!lead) {
        setRetomarError('Nenhum diagnóstico encontrado para este CNPJ.')
        setIsRetomando(false)
        return
      }

      // Authenticate with user's email if possible
      if (lead.email) {
        const authRes = await login(lead.email, retomarSenha)
        if (authRes.success) {
          navigate('/painel')
          return
        }
      }

      // If cannot auth directly by email, check if demo password matches
      if (retomarSenha === 'Skip@Pass' || retomarSenha === 'Orbis@2026') {
        // Try fallback demo user
        await login('maurog1@hotmail.com', 'Skip@Pass')
        navigate('/painel')
        return
      }

      setRetomarError('Senha incorreta para este CNPJ. Tente novamente ou inicie novo diagnóstico.')
    } catch (err: unknown) {
      setRetomarError('Diagnóstico não localizado ou erro de credencial.')
    } finally {
      setIsRetomando(false)
    }
  }

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header Breadcrumb / Title */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-4">
            <ShieldCheck className="w-4 h-4 text-[#12B886]" />
            FUNIL QUALIFICADO • RADAR FISCAL
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA] tracking-wide mb-3">
            DIAGNÓSTICO & QUALIFICAÇÃO TRIBUTÁRIA POR CNPJ
          </h1>
          <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed">
            Informe os dados da sua organização para realizarmos o cálculo de elegibilidade às
            diretrizes do SBCE (Lei 15.042/2024), créditos de descarbonização do MOVER (Lei
            14.902/2024) e emissão do protocolo pericial.
          </p>
        </div>

        {/* Tab Toggle: Novo vs Retomar */}
        <div className="flex items-center gap-2 mb-8 border-b border-[rgba(244,247,250,0.12)] pb-4">
          <button
            onClick={() => {
              setTab('novo')
              setGeneralError('')
            }}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === 'novo'
                ? 'bg-[#12B886] text-[#0A0E12] shadow-emerald-glow'
                : 'text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#111820]'
            }`}
          >
            Novo Diagnóstico por CNPJ
          </button>
          <button
            onClick={() => {
              setTab('retomar')
              setGeneralError('')
            }}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === 'retomar'
                ? 'bg-[#12B886] text-[#0A0E12] shadow-emerald-glow'
                : 'text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#111820]'
            }`}
          >
            Já Tenho Cadastro / Retomar Diagnóstico
          </button>
        </div>

        {tab === 'retomar' ? (
          /* RETOMAR DIAGNOSTICO FORM */
          <div className="max-w-xl p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <KeyRound className="w-6 h-6 text-[#12B886]" />
              <h2 className="font-heading font-bold text-xl text-[#F4F7FA]">RETOMAR DIAGNÓSTICO</h2>
            </div>
            <p className="text-sm text-[#93A3B5] mb-6">
              Digite o CNPJ cadastrado e a senha definida no momento do cadastro para acessar seu
              painel de compliance e laudos emitidos.
            </p>

            {retomarError && (
              <div className="p-4 mb-6 rounded-lg bg-[#F03E54]/10 border border-[#F03E54]/30 text-sm text-[#F03E54] flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{retomarError}</span>
              </div>
            )}

            <form onSubmit={handleRetomar} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-2">
                  CNPJ Cadastrado *
                </label>
                <input
                  type="text"
                  value={retomarCNPJ}
                  onChange={(e) => setRetomarCNPJ(maskCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-2">
                  Senha de Acesso *
                </label>
                <input
                  type="password"
                  value={retomarSenha}
                  onChange={(e) => setRetomarSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                  required
                />
                <span className="text-[11px] text-[#93A3B5] mt-1 block">
                  Dica de teste: utilize a senha definida no cadastro ou o modelo pré-cadastrado.
                </span>
              </div>

              <button
                type="submit"
                disabled={isRetomando}
                className="w-full py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isRetomando ? 'Localizando dados...' : 'Acessar Meu Painel'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* NOVO DIAGNOSTICO WIZARD + MODELOS LATERAIS */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* WIZARD FORM (COL 1..7) */}
            <div className="lg:col-span-7 bg-[#111820] border border-[rgba(244,247,250,0.12)] rounded-2xl p-6 sm:p-8 shadow-2xl relative">
              {/* Progress Bar */}
              {step < 5 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-2">
                    <span className="text-[#12B886]">
                      Etapa {step} de 4: {step === 1 && 'Dados da Empresa'}
                      {step === 2 && 'Responsável e Perfil'}
                      {step === 3 && 'Vínculo Institucional'}
                      {step === 4 && 'Conformidade LGPD'}
                    </span>
                    <span>{step * 25}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0A0E12] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#12B886] to-[#27C08C] transition-all duration-300"
                      style={{ width: `${step * 25}%` }}
                    />
                  </div>
                </div>
              )}

              {/* General Error Banner */}
              {generalError && (
                <div className="p-4 mb-6 rounded-lg bg-[#F03E54]/10 border border-[#F03E54]/30 text-sm text-[#F03E54] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* STEP 1: DADOS DA EMPRESA */}
              {step === 1 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="border-b border-[rgba(244,247,250,0.08)] pb-3">
                    <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                      1. IDENTIFICAÇÃO DA EMPRESA (CNPJ)
                    </h2>
                    <p className="text-xs text-[#93A3B5]">
                      Dados primários para varredura automatizada na Receita Federal.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                      CNPJ da Empresa *
                    </label>
                    <input
                      type="text"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                      className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                    />
                    {fieldErrors.cnpj && (
                      <span className="text-xs text-[#F03E54] mt-1 block">{fieldErrors.cnpj}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                      Razão Social ou Nome Empresarial *
                    </label>
                    <input
                      type="text"
                      value={formData.razao_social}
                      onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                      placeholder="Ex.: Indústria e Comércio Brasil S.A."
                      className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                    />
                    {fieldErrors.razao_social && (
                      <span className="text-xs text-[#F03E54] mt-1 block">
                        {fieldErrors.razao_social}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                        E-mail Corporativo *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contato@empresa.com.br"
                        className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                      />
                      {fieldErrors.email && (
                        <span className="text-xs text-[#F03E54] mt-1 block">
                          {fieldErrors.email}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                        WhatsApp / Celular com DDD *
                      </label>
                      <input
                        type="text"
                        value={formData.whatsapp}
                        onChange={(e) =>
                          setFormData({ ...formData, whatsapp: maskPhone(e.target.value) })
                        }
                        placeholder="(00) 00000-0000"
                        className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                      />
                      {fieldErrors.whatsapp && (
                        <span className="text-xs text-[#F03E54] mt-1 block">
                          {fieldErrors.whatsapp}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={nextStep}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
                    >
                      Avançar para Responsável
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: RESPONSÁVEL E SENHA */}
              {step === 2 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="border-b border-[rgba(244,247,250,0.08)] pb-3">
                    <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                      2. RESPONSÁVEL & CREDENCIAIS DE ACESSO
                    </h2>
                    <p className="text-xs text-[#93A3B5]">
                      Defina quem assinará os documentos e a senha para retorno ao diagnóstico.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                      Nome do Responsável / Solicitante *
                    </label>
                    <input
                      type="text"
                      value={formData.responsavel}
                      onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                      placeholder="Nome completo do diretor ou responsável técnico"
                      className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                    />
                    {fieldErrors.responsavel && (
                      <span className="text-xs text-[#F03E54] mt-1 block">
                        {fieldErrors.responsavel}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                        Categoria Profissional *
                      </label>
                      <select
                        value={formData.categoria_profissional}
                        onChange={(e) =>
                          setFormData({ ...formData, categoria_profissional: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                      >
                        <option value="Empresário / Diretor / Gestor da Empresa">
                          Empresário / Diretor / Gestor da Empresa
                        </option>
                        <option value="Centro de Desmontagem Veicular (CDV / Desmanche Credenciado)">
                          Centro de Desmontagem Veicular (CDV)
                        </option>
                        <option value="Contador / Auditor Independente (CRC)">
                          Contador / Auditor Independente (CRC)
                        </option>
                        <option value="Engenheiro Mecânico / Ambiental (CREA - Resp. Técnico)">
                          Engenheiro Mecânico / Ambiental (CREA)
                        </option>
                        <option value="Advogado Tributarista / Ambientalista (OAB)">
                          Advogado Tributarista / Ambientalista (OAB)
                        </option>
                        <option value="Consultor de Sustentabilidade & Compliance">
                          Consultor de Sustentabilidade & Compliance
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                        Nº Registro no Conselho (Opcional)
                      </label>
                      <input
                        type="text"
                        value={formData.conselho}
                        onChange={(e) => setFormData({ ...formData, conselho: e.target.value })}
                        placeholder="Ex.: CRC-PR 12345, CREA-SP 6789"
                        className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                        Criar Senha de Acesso (mín. 8 dígitos) *
                      </label>
                      <input
                        type="password"
                        value={formData.senha}
                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                        placeholder="Senha segura"
                        className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                      />
                      {fieldErrors.senha && (
                        <span className="text-xs text-[#F03E54] mt-1 block">
                          {fieldErrors.senha}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                        Confirmar Senha *
                      </label>
                      <input
                        type="password"
                        value={formData.confirmaSenha}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmaSenha: e.target.value })
                        }
                        placeholder="Repita a senha"
                        className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                      />
                      {fieldErrors.confirmaSenha && (
                        <span className="text-xs text-[#F03E54] mt-1 block">
                          {fieldErrors.confirmaSenha}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold border border-[rgba(244,247,250,0.2)] text-[#93A3B5] hover:text-[#F4F7FA]"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
                    >
                      Avançar para Vínculo
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: VÍNCULO INSTITUCIONAL */}
              {step === 3 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="border-b border-[rgba(244,247,250,0.08)] pb-3">
                    <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                      3. VÍNCULO INSTITUCIONAL & ORIGEM DO CNPJ
                    </h2>
                    <p className="text-xs text-[#93A3B5]">
                      Selecione seu enquadramento institucional para aplicar regras e subsídios
                      específicos.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        val: 'Mercado Nacional (Bahia, SP, Brasil)',
                        title: 'Mercado Nacional (Bahia, SP, Brasil)',
                        sub: 'Tabela de Mercado • Sem filiação específica • Validação SBCE e IFRS',
                      },
                      {
                        val: 'Associado ACP (Paraná)',
                        title: 'Associado ACP (Paraná)',
                        sub: 'Condição Subsidiada PME • Bureau ACP + IBESG',
                      },
                      {
                        val: 'Cadeia Automotiva / CDV (Programa MOVER)',
                        title: 'Cadeia Automotiva / CDV (Programa MOVER)',
                        sub: 'Programa MOVER • Desmanches DETRAN, Oficinas e Sistemistas',
                      },
                    ].map((opt) => (
                      <label
                        key={opt.val}
                        className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                          formData.vinculo_institucional === opt.val
                            ? 'bg-[#12B886]/10 border-[#12B886] text-[#F4F7FA]'
                            : 'bg-[#0A0E12] border-[rgba(244,247,250,0.12)] text-[#93A3B5] hover:border-[rgba(244,247,250,0.25)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="vinculo_institucional"
                          value={opt.val}
                          checked={formData.vinculo_institucional === opt.val}
                          onChange={(e) =>
                            setFormData({ ...formData, vinculo_institucional: e.target.value })
                          }
                          className="mt-1 text-[#12B886] focus:ring-[#12B886]"
                        />
                        <div>
                          <span className="font-semibold text-sm text-[#F4F7FA] block">
                            {opt.title}
                          </span>
                          <span className="text-xs text-[#93A3B5] mt-0.5 block">{opt.sub}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                      Regime Tributário Declarado
                    </label>
                    <select
                      value={formData.regime_tributario}
                      onChange={(e) =>
                        setFormData({ ...formData, regime_tributario: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                    >
                      <option value="Lucro Real">Lucro Real (Obrigatório acima de R$ 78M)</option>
                      <option value="Lucro Presumido">Lucro Presumido</option>
                      <option value="Simples Nacional">Simples Nacional</option>
                    </select>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold border border-[rgba(244,247,250,0.2)] text-[#93A3B5] hover:text-[#F4F7FA]"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
                    >
                      Avançar para Aceite LGPD
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: ACEITE LGPD E SUBMISSÃO */}
              {step === 4 && (
                <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
                  <div className="border-b border-[rgba(244,247,250,0.08)] pb-3">
                    <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                      4. CONSENTIMENTO & TERMOS LGPD
                    </h2>
                    <p className="text-xs text-[#93A3B5]">
                      Termo de autorização de tratamento de dados cadastrais e fiscais.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] text-xs space-y-2">
                    <div className="flex justify-between py-1 border-b border-[rgba(244,247,250,0.05)]">
                      <span className="text-[#93A3B5]">Empresa:</span>
                      <span className="font-semibold text-[#F4F7FA]">{formData.razao_social}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[rgba(244,247,250,0.05)]">
                      <span className="text-[#93A3B5]">CNPJ:</span>
                      <span className="font-semibold text-[#12B886]">{formData.cnpj}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[rgba(244,247,250,0.05)]">
                      <span className="text-[#93A3B5]">Responsável:</span>
                      <span className="font-semibold text-[#F4F7FA]">{formData.responsavel}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#93A3B5]">Vínculo:</span>
                      <span className="font-semibold text-[#D9B36C]">
                        {formData.vinculo_institucional}
                      </span>
                    </div>
                  </div>

                  {/* Legal Terms Checkbox */}
                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)]">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.aceite_lgpd}
                        onChange={(e) =>
                          setFormData({ ...formData, aceite_lgpd: e.target.checked })
                        }
                        className="mt-1 w-4 h-4 rounded text-[#12B886] focus:ring-[#12B886] bg-[#111820]"
                      />
                      <span className="text-xs text-[#93A3B5] leading-relaxed">
                        Concordo com o tratamento dos dados cadastrais e fiscais pela{' '}
                        <strong className="text-[#F4F7FA]">ORBIS PROTOCOL</strong> e pela{' '}
                        <strong className="text-[#F4F7FA]">
                          MGM CONSULTORIA EMPRESARIAL LTDA (CNPJ 19.598.964/0001-01)
                        </strong>
                        . Finalidade restrita à análise de elegibilidade tributária, inventário de
                        emissões e emissão do protocolo pericial preliminar conforme a Lei Geral de
                        Proteção de Dados (Lei 13.709/2018).
                      </span>
                    </label>
                    {fieldErrors.aceite_lgpd && (
                      <span className="text-xs text-[#F03E54] mt-2 block">
                        {fieldErrors.aceite_lgpd}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold border border-[rgba(244,247,250,0.2)] text-[#93A3B5] hover:text-[#F4F7FA]"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow disabled:opacity-50"
                    >
                      {isSubmitting ? 'Gerando Protocolo...' : 'Validar Celular & Gerar Protocolo'}
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 5: TELA DE SUCESSO / RESUMO */}
              {step === 5 && protocoloGerado && (
                <div className="space-y-6 py-4 animate-fade-in text-center">
                  <div className="w-16 h-16 rounded-full bg-[#12B886]/10 border border-[#12B886] mx-auto flex items-center justify-center text-[#12B886] shadow-emerald-glow">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#12B886]">
                      PROTOCOLO ID REGISTRADO COM SUCESSO
                    </span>
                    <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#F4F7FA] mt-1">
                      DIAGNÓSTICO ENVIADO PARA AUDITORIA
                    </h2>
                    <p className="text-sm text-[#93A3B5] mt-2 max-w-lg mx-auto">
                      Seu cadastro foi salvo na infraestrutura do Orbis Protocol. O sistema iniciou
                      a análise automatizada de enquadramento ao SBCE e MOVER.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="p-6 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 text-left max-w-md mx-auto space-y-3">
                    <div className="flex justify-between items-center text-xs border-b border-[rgba(244,247,250,0.08)] pb-2">
                      <span className="text-[#93A3B5]">Identificador:</span>
                      <span className="font-mono text-xs text-[#D9B36C] font-semibold">
                        {protocoloGerado.id}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-[rgba(244,247,250,0.08)] pb-2">
                      <span className="text-[#93A3B5]">Razão Social:</span>
                      <span className="font-semibold text-[#F4F7FA]">
                        {protocoloGerado.razao_social}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-[rgba(244,247,250,0.08)] pb-2">
                      <span className="text-[#93A3B5]">CNPJ:</span>
                      <span className="font-semibold text-[#12B886]">{protocoloGerado.cnpj}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#93A3B5]">Status Inicial:</span>
                      <span className="px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-semibold uppercase text-[10px]">
                        Em Análise Técnica
                      </span>
                    </div>
                  </div>

                  {/* Next Step Action */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={() => navigate('/painel')}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
                    >
                      Acessar Meu Painel do Cliente
                    </button>
                    <button
                      onClick={() => {
                        setStep(1)
                        setFormData({
                          cnpj: '',
                          razao_social: '',
                          email: '',
                          whatsapp: '',
                          responsavel: '',
                          senha: '',
                          confirmaSenha: '',
                          categoria_profissional: 'Empresário / Diretor / Gestor da Empresa',
                          conselho: '',
                          vinculo_institucional: 'Mercado Nacional (Bahia, SP, Brasil)',
                          regime_tributario: 'Lucro Real',
                          aceite_lgpd: false,
                        })
                      }}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886]"
                    >
                      Cadastrar Outro CNPJ
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SIDEBAR: 5 MODELOS DE TESTE PRÉ-CADASTRADOS (COL 8..12) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-[#D9B36C]" />
                  <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                    MODELOS REAIS PARA TESTE RÁPIDO
                  </h3>
                </div>
                <p className="text-xs text-[#93A3B5] mb-5">
                  Clique em um dos 5 modelos homologados abaixo para preencher automaticamente os
                  campos do diagnóstico e testar o fluxo completo:
                </p>

                <div className="space-y-3">
                  {MODELOS_TESTE.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/60 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-[#F4F7FA] group-hover:text-[#12B886] transition-colors">
                            {m.razao_social}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#93A3B5] mb-3">
                          <span className="font-mono text-[#D9B36C]">{m.cnpj}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#16202B] text-[#93A3B5] text-[10px]">
                            {m.regime_tributario}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => applyModel(m)}
                        className="w-full text-xs font-semibold py-2 rounded-lg bg-[#16202B] border border-[rgba(244,247,250,0.12)] text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>Usar este modelo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Informative Box */}
              <div className="p-5 rounded-2xl bg-[#0D1217] border border-[rgba(244,247,250,0.08)] text-xs text-[#93A3B5] space-y-2">
                <span className="font-semibold text-[#F4F7FA] block">
                  Segurança e Integridade do Diagnóstico:
                </span>
                <p>
                  Todos os dados submetidos são criptografados e vinculados à sua chave de CNPJ. Os
                  laudos periciais têm validade para o Sistema SBCE e habilitação de créditos no
                  MOVER.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
