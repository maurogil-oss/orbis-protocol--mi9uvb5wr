import React, { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { useAuth } from '@/contexts/AuthContext'
import { consultarCNPJ, cleanCNPJ, isValidCNPJ, DadosEmpresaCNPJ } from '@/services/cnpj'
import { sugerirTrilhaPorCNAE, SugestaoTrilhaCNAE } from '@/services/cnaeTrilhasMapping'
import {
  EMPRESAS_MODELO_DEMONSTRACAO,
  EmpresaModeloDemonstrativa,
  isCnpjDemonstracao,
  obterModeloDemonstracao,
  obterModeloDemonstracaoPorRaiz,
  converterModeloParaDadosCNPJ,
} from '@/services/demonstracaoService'
import {
  calcularComparativoTributario,
  ResultadoComparativoTributario,
} from '@/services/tributosReforma'
import { ComparativoTributarioView } from '@/components/ComparativoTributarioView'
import { PROTOCOLOS_SETORIAIS } from '@/data/protocolosSetoriais'
import {
  SegmentoDiagnosticoId,
  SEGMENTOS_DIAGNOSTICO,
  PerguntasSegmentoAlimentacao,
  calcularDiagnosticoAlimentacao,
  ResultadoComparativoSegmentoAlimentacao,
} from '@/services/diagnosticoSegmentosService'
import { FormularioSegmentoAlimentacao } from '@/components/FormularioSegmentoAlimentacao'
import { ResultadoSegmentoAlimentacaoView } from '@/components/ResultadoSegmentoAlimentacaoView'
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
  KeyRound,
  FileCheck2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Globe,
  Flame,
  Scale,
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

export type TestModel = EmpresaModeloDemonstrativa

export const MODELOS_TESTE = EMPRESAS_MODELO_DEMONSTRACAO

export function calcularEnquadramentoSBCE(
  faixa: 'abaixo_10k' | 'entre_10k_25k' | 'acima_25k' | 'nao_sei_calcular',
): string {
  switch (faixa) {
    case 'abaixo_10k':
      return 'Abaixo do limiar de reporte no SBCE (< 10.000 tCO₂e/ano)'
    case 'entre_10k_25k':
      return 'Sujeito a reporte no SBCE (10.000 a 25.000 tCO₂e/ano)'
    case 'acima_25k':
      return 'Sujeito a reporte e obrigação de compensação no SBCE (> 25.000 tCO₂e/ano)'
    case 'nao_sei_calcular':
    default:
      return 'Avaliação preliminar pendente de inventário técnico'
  }
}

export default function Diagnostico() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  // Tab: 'novo' | 'retomar'
  const [tab, setTab] = useState<'novo' | 'retomar'>('novo')

  // Wizard Step: 1, 2, 3, 4 (Triagem de emissões), 5 (Consentimento LGPD), 6 (Comparativo Tributário), 7 (Sucesso)
  const [step, setStep] = useState<number>(1)

  // CNPJ Consultation State
  const [isConsultingCNPJ, setIsConsultingCNPJ] = useState(false)
  const [cnpjLookupError, setCnpjLookupError] = useState<string>('')
  const [cnpjWarningInativo, setCnpjWarningInativo] = useState<string>('')
  const [sugestaoModeloRaiz, setSugestaoModeloRaiz] = useState<EmpresaModeloDemonstrativa | null>(
    null,
  )
  const [sugestaoCnaeTrilha, setSugestaoCnaeTrilha] = useState<SugestaoTrilhaCNAE | null>(null)
  const [cnpjSuccessData, setCnpjSuccessData] = useState<DadosEmpresaCNPJ | null>(null)
  const [isModelMode, setIsModelMode] = useState<boolean>(false)
  const [modeloAtivo, setModeloAtivo] = useState<EmpresaModeloDemonstrativa | null>(null)

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
    regime_tributario: 'A confirmar',
    // Triagem de Emissões & CBAM
    consumo_energia: '',
    frota_propria: 'nao' as 'sim' | 'nao',
    inventario_ghg: 'nao' as 'sim' | 'nao' | 'em_andamento',
    iso_14001: 'nao' as 'sim' | 'nao',
    faixa_emissoes: 'nao_sei_calcular' as
      | 'abaixo_10k'
      | 'entre_10k_25k'
      | 'acima_25k'
      | 'nao_sei_calcular',
    exporta_ue_cbam: 'nao' as 'sim' | 'nao',
    cbam_bens: '',
    // Segmentação setorial (Flagship Alimentação / Turismo em estruturação / MEI em estruturação)
    segmento_economico: 'geral' as SegmentoDiagnosticoId,
    dados_alimentacao: {
      tipo_estabelecimento: 'restaurante' as PerguntasSegmentoAlimentacao['tipo_estabelecimento'],
      porte_funcionarios: '5_a_15' as PerguntasSegmentoAlimentacao['porte_funcionarios'],
      porte_faturamento_mensal:
        '30k_a_100k' as PerguntasSegmentoAlimentacao['porte_faturamento_mensal'],
      principais_insumos: ['carnes', 'embalagens_plasticas', 'oleo_fritura', 'bebidas'],
      fontes_energia: ['eletrica_concessionaria', 'glp_botijao'],
      residuos_gerados: ['organicos', 'oleo_fritura_usado', 'reciclaveis_secos'],
      origem_insumos: 'mista' as PerguntasSegmentoAlimentacao['origem_insumos'],
      logistica_reversa_embalagens:
        'em_estruturacao' as PerguntasSegmentoAlimentacao['logistica_reversa_embalagens'],
    },
    aceite_lgpd: false,
  })

  // Retomar Form
  const [retomarCNPJ, setRetomarCNPJ] = useState('')
  const [retomarSenha, setRetomarSenha] = useState('')
  const [retomarError, setRetomarError] = useState('')
  const [isRetomando, setIsRetomando] = useState(false)

  // Cálculo reativo do comparativo tributário
  const comparativoCalculado = calcularComparativoTributario({
    regime_tributario: formData.regime_tributario,
    categoria_profissional: formData.categoria_profissional,
    vinculo_institucional: formData.vinculo_institucional,
    faixa_emissoes: formData.faixa_emissoes,
    exporta_ue_cbam: formData.exporta_ue_cbam,
    cbam_bens: formData.cbam_bens,
    razao_social: formData.razao_social,
  })

  // Submission State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [protocoloGerado, setProtocoloGerado] = useState<{
    id: string
    cnpj: string
    razao_social: string
    status: string
    demonstracao?: boolean
    vinculo_institucional?: string
    enquadramento_sbce?: string
    comparativo?: ResultadoComparativoTributario
    segmento?: SegmentoDiagnosticoId
    resultadoAlimentacao?: ResultadoComparativoSegmentoAlimentacao
  } | null>(null)

  // Retomada: Lead carregado para revisão/consulta do comparativo
  const [leadRetomado, setLeadRetomado] = useState<{
    id: string
    cnpj: string
    razao_social: string
    regime_tributario: string
    demonstracao?: boolean
    enquadramento_sbce?: string
    exporta_ue_cbam?: string
    cbam_bens?: string
    status: string
    comparativo?: ResultadoComparativoTributario
  } | null>(null)

  // Consulta de CNPJ (Modelos de teste ou APIs Públicas com OpenCNPJ)
  const handleConsultarCNPJ = async (cnpjToSearch?: string) => {
    const rawCNPJ = cnpjToSearch || formData.cnpj
    const digits = cleanCNPJ(rawCNPJ)

    if (digits.length !== 14) {
      setCnpjLookupError('Informe um CNPJ completo com 14 dígitos numéricos.')
      return
    }

    // Validação estrita de dígitos verificadores
    if (!isValidCNPJ(digits)) {
      const modeloPorRaiz = obterModeloDemonstracaoPorRaiz(digits)
      if (modeloPorRaiz) {
        setSugestaoModeloRaiz(modeloPorRaiz)
      }
      setCnpjLookupError(
        'CNPJ inválido (dígitos verificadores incorretos). Você pode corrigir ou preencher manualmente.',
      )
      return
    }

    setCnpjLookupError('')
    setCnpjWarningInativo('')
    setCnpjSuccessData(null)
    setSugestaoCnaeTrilha(null)
    setIsModelMode(false)
    setSugestaoModeloRaiz(null)

    // 1. Base Demonstrativa Local Pedagógica: Pula consulta externa
    const matchingModel = obterModeloDemonstracao(digits)
    if (matchingModel) {
      applyModel(matchingModel)
      return
    }

    // 2. Busca na API pública (OpenCNPJ com fallback tolerante)
    setModeloAtivo(null)
    setIsModelMode(false)
    setIsConsultingCNPJ(true)
    try {
      const data = await consultarCNPJ(digits)
      setCnpjSuccessData(data)
      setIsModelMode(false)

      // Verifica situação cadastral da empresa (alerta amigável e não bloqueante)
      if (!data.ativa) {
        setCnpjWarningInativo(
          `Situação cadastral na Receita Federal: ${data.descricao_situacao_cadastral || data.situacao_cadastral || 'INATIVA/BAIXADA'}. Você pode prosseguir normalmente com o diagnóstico se for uma simulação preparatória ou processo de reativação.`,
        )
      } else {
        setCnpjWarningInativo('')
      }

      // Mapeamento inteligente de CNAE para trilha regulatória & protocolo
      const sugestao = sugerirTrilhaPorCNAE(
        data.cnae_fiscal,
        data.cnaes_lista || data.cnaes_secundarios,
      )
      if (sugestao) {
        setSugestaoCnaeTrilha(sugestao)
        if (sugestao.protocoloSlug === 'alimentos') {
          setFormData((prev) => ({ ...prev, segmento_economico: 'alimentacao' }))
        }
      }

      setFormData((prev) => ({
        ...prev,
        cnpj: maskCNPJ(digits),
        razao_social: data.razao_social || prev.razao_social,
        email: data.email || prev.email,
        whatsapp: data.ddd_telefone ? maskPhone(data.ddd_telefone) : prev.whatsapp,
        regime_tributario:
          data.regime_tributario_sugerido && data.regime_tributario_sugerido !== 'A confirmar'
            ? data.regime_tributario_sugerido
            : prev.regime_tributario,
        vinculo_institucional:
          sugestao?.vinculoInstitucionalSugerido &&
          prev.vinculo_institucional === 'Mercado Nacional (Bahia, SP, Brasil)'
            ? sugestao.vinculoInstitucionalSugerido
            : prev.vinculo_institucional,
        categoria_profissional:
          sugestao?.categoriaProfissionalSugerida &&
          prev.categoria_profissional === 'Empresário / Diretor / Gestor da Empresa'
            ? sugestao.categoriaProfissionalSugerida
            : prev.categoria_profissional,
      }))

      // Limpa eventuais erros de campo antigos
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.cnpj
        delete next.razao_social
        return next
      })
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Não foi possível consultar os dados na Receita Federal. O preenchimento manual está liberado.'
      setCnpjLookupError(msg)
    } finally {
      setIsConsultingCNPJ(false)
    }
  }

  // Apply quick test model
  const applyModel = (model: EmpresaModeloDemonstrativa) => {
    setIsModelMode(true)
    setModeloAtivo(model)
    setCnpjSuccessData(converterModeloParaDadosCNPJ(model))
    setCnpjLookupError('')
    setSugestaoModeloRaiz(null)
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
      consumo_energia: model.consumo_energia || prev.consumo_energia,
      frota_propria: model.frota_propria || prev.frota_propria,
      inventario_ghg: model.inventario_ghg || prev.inventario_ghg,
      iso_14001: model.iso_14001 || prev.iso_14001,
      faixa_emissoes: model.faixa_emissoes || prev.faixa_emissoes,
      exporta_ue_cbam: model.exporta_ue_cbam || prev.exporta_ue_cbam,
      cbam_bens: model.cbam_bens || prev.cbam_bens,
      senha: prev.senha,
      confirmaSenha: prev.confirmaSenha,
      aceite_lgpd: true,
    }))
    setFieldErrors({})
  }

  // Validate step 1
  const validateStep1 = () => {
    const errors: Record<string, string> = {}
    const digits = cleanCNPJ(formData.cnpj)
    if (digits.length !== 14) {
      errors.cnpj = 'Informe um CNPJ válido com 14 dígitos'
    } else if (!isValidCNPJ(digits)) {
      // Se coincidir com a raiz de um modelo de teste, define sugestão
      const modeloPorRaiz = obterModeloDemonstracaoPorRaiz(digits)
      if (modeloPorRaiz) {
        setSugestaoModeloRaiz(modeloPorRaiz)
      }
      errors.cnpj = 'CNPJ inválido (dígitos verificadores incorretos)'
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

  // Validate step 4 (Triagem de emissões)
  const validateStep4 = () => {
    return true
  }

  // Validate step 5 (Consentimento LGPD)
  const validateStep5 = () => {
    const errors: Record<string, string> = {}
    if (!formData.aceite_lgpd) {
      errors.aceite_lgpd = 'Você deve concordar com os termos da LGPD para prosseguir'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Step Advancement
  const nextStep = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    if (step === 3 && !validateStep3()) return
    if (step === 4 && !validateStep4()) return
    if (step === 5 && !validateStep5()) return
    setStep((s) => s + 1)
  }

  const prevStep = () => {
    setStep((s) => Math.max(1, s - 1))
    setFieldErrors({})
  }

  // Final submission: creates user (if needed) & creates/updates leads_diagnostico
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!formData.aceite_lgpd) {
      setFieldErrors({ aceite_lgpd: 'Você deve concordar com os termos da LGPD para prosseguir' })
      return
    }

    setIsSubmitting(true)
    setGeneralError('')
    setFieldErrors({})

    const isDemo = isModelMode || Boolean(obterModeloDemonstracao(formData.cnpj))
    const enquadramentoPreliminar = calcularEnquadramentoSBCE(formData.faixa_emissoes)
    const resultadoAlimentacao =
      formData.segmento_economico === 'alimentacao'
        ? calcularDiagnosticoAlimentacao(formData.dados_alimentacao)
        : undefined

    try {
      let createdUserId = ''

      // 1. Try to create or retrieve user
      try {
        const newUser = await pb.collection('users').create({
          email: formData.email.trim(),
          password: formData.senha,
          passwordConfirm: formData.confirmaSenha,
          name: formData.responsavel,
          role: 'cliente',
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
      const leadPayload = {
        cnpj: formData.cnpj,
        razao_social: formData.razao_social,
        email: formData.email,
        whatsapp: formData.whatsapp,
        responsavel: formData.responsavel,
        categoria_profissional: formData.categoria_profissional,
        conselho: formData.conselho,
        vinculo_institucional: formData.vinculo_institucional,
        regime_tributario: formData.regime_tributario,
        consumo_energia: formData.consumo_energia,
        frota_propria: formData.frota_propria,
        inventario_ghg: formData.inventario_ghg,
        iso_14001: formData.iso_14001,
        faixa_emissoes: formData.faixa_emissoes,
        enquadramento_sbce: enquadramentoPreliminar,
        exporta_ue_cbam: formData.exporta_ue_cbam,
        cbam_bens: formData.cbam_bens,
        faixa_impacto_tributario: comparativoCalculado.faixaImpacto,
        comparativo_tributario_json: comparativoCalculado,
        status: 'novo',
        segmento_economico: formData.segmento_economico,
        diagnostico_segmento_json:
          formData.segmento_economico === 'alimentacao'
            ? {
                dados_formulario: formData.dados_alimentacao,
                resultado_estimado: resultadoAlimentacao,
              }
            : null,
        demonstracao: isDemo,
        ...(createdUserId ? { usuario: createdUserId } : {}),
      }

      // Submissão via endpoint seguro server-side para captura de IP, timestamp UTC e termo LGPD
      const token = pb.authStore.token
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        authHeaders['Authorization'] = token
      }

      // Captura ref de indicação da URL ou de navegação prévia no Radar Semanal
      const searchRef =
        searchParams.get('ref') || localStorage.getItem('orbis_radar_ref') || undefined

      const resLead = await fetch(`${pb.baseUrl}/backend/v1/lead-diagnostico-submit`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ...leadPayload,
          ref_indicacao: searchRef,
          termo_versao: 'v2026-01',
          origem: searchRef ? 'radar_semanal_ref' : 'funil',
        }),
      })

      if (resLead.ok) {
        leadRecord = await resLead.json()
      } else {
        const errJson = await resLead.json().catch(() => ({}))
        // Fallback com token de autenticação via SDK se usuário acabou de logar
        try {
          const existingLead = await pb
            .collection('leads_diagnostico')
            .getFirstListItem(`cnpj='${formData.cnpj}'`)
          leadRecord = await pb.collection('leads_diagnostico').update(existingLead.id, {
            ...leadPayload,
            consentimento_data_hora: new Date().toISOString(),
            termo_versao: 'v2026-01',
          })
        } catch {
          try {
            leadRecord = await pb.collection('leads_diagnostico').create({
              ...leadPayload,
              consentimento_data_hora: new Date().toISOString(),
              termo_versao: 'v2026-01',
            })
          } catch {
            throw new Error(
              errJson.error || 'Falha ao registrar diagnóstico. Verifique os dados informados.',
            )
          }
        }
      }

      setProtocoloGerado({
        id: leadRecord.id,
        cnpj: leadRecord.cnpj,
        razao_social: leadRecord.razao_social,
        status: leadRecord.status || 'novo',
        demonstracao: isDemo,
        vinculo_institucional: leadRecord.vinculo_institucional || formData.vinculo_institucional,
        enquadramento_sbce: enquadramentoPreliminar,
        comparativo: comparativoCalculado,
        segmento: formData.segmento_economico,
        resultadoAlimentacao: resultadoAlimentacao,
      })
      setStep(7) // Success screen (Etapa 7)
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
      const cleanInput = cleanCNPJ(retomarCNPJ.trim())
      const lead = await pb
        .collection('leads_diagnostico')
        .getFirstListItem(`cnpj='${retomarCNPJ.trim()}' || cnpj ~ '${cleanInput}'`)

      if (!lead) {
        setRetomarError('Nenhum diagnóstico encontrado para este CNPJ.')
        setIsRetomando(false)
        return
      }

      // Se for um dos modelos de teste ou usuário corporativo, permite visualizar o comparativo
      let comp = (lead.comparativo_tributario_json as ResultadoComparativoTributario) || null
      if (!comp) {
        comp = calcularComparativoTributario({
          regime_tributario: lead.regime_tributario,
          categoria_profissional: lead.categoria_profissional,
          vinculo_institucional: lead.vinculo_institucional,
          faixa_emissoes: lead.faixa_emissoes,
          exporta_ue_cbam: lead.exporta_ue_cbam,
          cbam_bens: lead.cbam_bens,
          razao_social: lead.razao_social,
        })
      }

      // Tenta autenticar no painel se informou senha
      if (retomarSenha && lead.email) {
        try {
          const authRes = await login(lead.email, retomarSenha)
          if (authRes.success) {
            navigate('/painel')
            return
          }
        } catch (_) {
          // Se falhou login formal, exibe a tela de revisão do diagnóstico abaixo
        }
      }

      setLeadRetomado({
        id: lead.id,
        cnpj: lead.cnpj,
        razao_social: lead.razao_social,
        regime_tributario: lead.regime_tributario,
        demonstracao: Boolean(lead.demonstracao || isCnpjDemonstracao(lead.cnpj)),
        enquadramento_sbce: lead.enquadramento_sbce,
        exporta_ue_cbam: lead.exporta_ue_cbam,
        cbam_bens: lead.cbam_bens,
        status: lead.status || 'concluido',
        comparativo: comp,
      })
    } catch (err: unknown) {
      setRetomarError('Diagnóstico não localizado para o CNPJ informado.')
    } finally {
      setIsRetomando(false)
    }
  }

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12] w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 w-full min-w-0">
        {/* Header Breadcrumb / Title */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-4">
            <ShieldCheck className="w-4 h-4 text-[#12B886]" />
            FUNIL QUALIFICADO • RADAR FISCAL & EMISSÕES
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA] tracking-wide mb-3 break-words [overflow-wrap:anywhere] max-w-full">
            DIAGNÓSTICO & QUALIFICAÇÃO TRIBUTÁRIA POR CNPJ
          </h1>
          <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed">
            Informe os dados da sua organização para realizarmos o cálculo de elegibilidade
            preparatória às diretrizes do SBCE (Lei 15.042/2024), créditos de descarbonização do
            MOVER (Lei 14.902/2024 para o setor automotivo) e emissão do protocolo pericial.
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
          <div className="max-w-4xl p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl">
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
                  placeholder="Digite sua senha cadastrada"
                  className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isRetomando}
                className="w-full py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isRetomando ? 'Localizando dados...' : 'Consultar Diagnóstico & Comparativo'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Tela de Retomada/Revisão com Comparativo Tributário */}
            {leadRetomado && leadRetomado.comparativo && (
              <div className="mt-8 pt-6 border-t border-[rgba(244,247,250,0.12)] space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#D9B36C] uppercase tracking-wider block">
                      Diagnóstico Localizado • ID {leadRetomado.id}
                    </span>
                    <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                      {leadRetomado.razao_social}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {leadRetomado.demonstracao && (
                      <span className="px-2.5 py-1 rounded bg-[#D9B36C] text-[#0A0E12] text-xs font-black uppercase tracking-wider">
                        DEMONSTRAÇÃO
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded bg-[#12B886]/20 border border-[#12B886]/40 text-[#12B886] text-xs font-semibold uppercase">
                      Status: {leadRetomado.status}
                    </span>
                  </div>
                </div>
                <ComparativoTributarioView
                  comparativo={leadRetomado.comparativo}
                  regimeDeclarado={leadRetomado.regime_tributario}
                  exportaUE={leadRetomado.exporta_ue_cbam === 'sim'}
                  cbamBens={leadRetomado.cbam_bens}
                  enquadramentoSBCE={leadRetomado.enquadramento_sbce}
                  modoRevisao={true}
                />

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#16202B] border border-[#12B886]/40 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors"
                  >
                    Fazer Login Completo na Plataforma
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* NOVO DIAGNOSTICO WIZARD + MODELOS LATERAIS */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* WIZARD FORM (COL 1..7) */}
            <div className="lg:col-span-7 bg-[#111820] border border-[rgba(244,247,250,0.12)] rounded-2xl p-6 sm:p-8 shadow-2xl relative">
              {/* Progress Bar */}
              {step < 7 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-2">
                    <span className="text-[#12B886]">
                      Etapa {step} de 6: {step === 1 && 'Dados da Empresa'}
                      {step === 2 && 'Responsável e Perfil'}
                      {step === 3 && 'Vínculo Institucional'}
                      {step === 4 && 'Triagem de Emissões & CBAM'}
                      {step === 5 && 'Conformidade LGPD'}
                      {step === 6 && 'Comparativo Tributário (Reforma)'}
                    </span>
                    <span>{Math.round((step / 6) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0A0E12] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#12B886] to-[#27C08C] transition-all duration-300"
                      style={{ width: `${(step / 6) * 100}%` }}
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
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5]">
                        CNPJ da Empresa *
                      </label>
                      <span className="text-[11px] text-[#93A3B5]/80">
                        Consulta pública automática na Receita Federal
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={formData.cnpj}
                          onChange={(e) => {
                            const formatted = maskCNPJ(e.target.value)
                            setFormData({ ...formData, cnpj: formatted })
                            setCnpjLookupError('')
                            setCnpjWarningInativo('')
                            const digits = cleanCNPJ(formatted)
                            if (digits.length === 14) {
                              if (isValidCNPJ(digits)) {
                                handleConsultarCNPJ(formatted)
                              } else {
                                const modeloPorRaiz = obterModeloDemonstracaoPorRaiz(digits)
                                if (modeloPorRaiz) {
                                  setSugestaoModeloRaiz(modeloPorRaiz)
                                }
                              }
                            } else {
                              setSugestaoModeloRaiz(null)
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleConsultarCNPJ()
                            }
                          }}
                          placeholder="00.000.000/0000-00"
                          className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886] font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleConsultarCNPJ()}
                        disabled={isConsultingCNPJ}
                        className="px-5 py-3 rounded-lg bg-[#16202B] border border-[#12B886]/40 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-all font-semibold text-xs flex items-center gap-2 shrink-0 disabled:opacity-50"
                        title="Consultar dados cadastrais na Receita via OpenCNPJ"
                      >
                        {isConsultingCNPJ ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Consultando...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            <span>Consultar</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#93A3B5]/80 mt-1">
                      Usaremos seu CNPJ para identificar sua empresa e sugerir sua trilha
                      regulatória e tributária a partir dos dados públicos oficiais.
                    </p>
                    {fieldErrors.cnpj && (
                      <span className="text-xs text-[#F03E54] mt-1 block">{fieldErrors.cnpj}</span>
                    )}

                    {/* Sugestão UX: Se a raiz corresponder a um modelo pedagógico */}
                    {sugestaoModeloRaiz && (
                      <div className="mt-2.5 p-3.5 rounded-xl bg-[#D9B36C]/15 border border-[#D9B36C]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
                        <div className="flex items-start gap-2 text-[#D9B36C]">
                          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-[#F4F7FA] block">
                              Você quis dizer{' '}
                              <strong className="text-[#D9B36C] font-mono font-bold">
                                {sugestaoModeloRaiz.cnpj}
                              </strong>
                              ?
                            </span>
                            <span className="text-[11px] text-[#93A3B5]">
                              A raiz informada corresponde ao modelo pedagógico &quot;
                              {sugestaoModeloRaiz.razao_social}&quot; com DVs oficiais calculados.
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyModel(sugestaoModeloRaiz)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#D9B36C] text-[#0A0E12] hover:bg-[#C9A25B] font-bold text-xs uppercase tracking-wider transition-all shadow flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <span>Usar modelo {sugestaoModeloRaiz.cnpj}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Feedback de Consulta: Loading (Linear dark-first) */}
                  {isConsultingCNPJ && (
                    <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(18,184,134,0.3)] flex items-center gap-3 animate-pulse shadow-sm">
                      <Loader2 className="w-4 h-4 text-[#12B886] animate-spin shrink-0" />
                      <div className="text-xs">
                        <span className="text-[#F4F7FA] font-medium block">
                          Consultando dados cadastrais oficiais...
                        </span>
                        <span className="text-[#93A3B5] text-[11px]">
                          Buscando via OpenCNPJ (Receita Federal) com enriquecimento automático.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Feedback de Consulta: CNPJ Inativo / Situação não ativa (Aviso amigável não-bloqueante) */}
                  {cnpjWarningInativo && (
                    <div className="p-4 rounded-xl bg-[#D9B36C]/10 border border-[#D9B36C]/40 space-y-2 animate-fade-in">
                      <div className="flex items-start gap-2.5 text-xs text-[#D9B36C]">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-semibold">
                            Atenção à Situação Cadastral
                          </strong>
                          <span className="text-[#F4F7FA]/90">{cnpjWarningInativo}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feedback de Consulta: Erro com opção de preenchimento manual */}
                  {cnpjLookupError && (
                    <div className="p-4 rounded-xl bg-[#F03E54]/10 border border-[#F03E54]/30 space-y-2 animate-fade-in">
                      <div className="flex items-start gap-2.5 text-xs text-[#F03E54]">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-semibold">
                            Consulta automática não concluída
                          </strong>
                          <span>{cnpjLookupError}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#93A3B5] pl-6">
                        O formulário segue liberado para digitação manual: confira a digitação ou
                        preencha a <strong>Razão Social</strong> e demais dados abaixo para
                        continuar.
                      </p>
                    </div>
                  )}

                  {/* Sugestão Inteligente de Trilha Regulatória por CNAE */}
                  {sugestaoCnaeTrilha && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#12B886]/15 via-[#111820] to-[#0A0E12] border border-[#12B886]/40 space-y-2.5 shadow-emerald-glow animate-fade-in">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#12B886] shrink-0" />
                          <span className="text-xs font-bold uppercase tracking-wider text-[#12B886]">
                            Trilha Regulatória Sugerida para seu CNAE
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-[#12B886]/20 text-[#12B886] text-[10px] font-mono font-semibold uppercase">
                          {sugestaoCnaeTrilha.nomeSegmento}
                        </span>
                      </div>
                      <p className="text-xs text-[#F4F7FA] leading-relaxed">
                        {sugestaoCnaeTrilha.descricaoSugestao}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {sugestaoCnaeTrilha.destaquesRegulatorios.map((destaque) => (
                          <span
                            key={destaque}
                            className="px-2 py-0.5 rounded bg-[#16202B] border border-[rgba(244,247,250,0.12)] text-[#93A3B5] text-[10px] font-medium"
                          >
                            ✓ {destaque}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback de Consulta: Empresa Real Encontrada */}
                  {cnpjSuccessData && (
                    <div className="p-4 rounded-xl bg-[#12B886]/10 border border-[#12B886]/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#12B886] animate-ping" />
                          <span className="text-xs font-bold uppercase tracking-wider text-[#12B886] flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            Dados Oficiais Obtidos via{' '}
                            {cnpjSuccessData.fonte === 'opencnpj'
                              ? 'OpenCNPJ (Receita Federal)'
                              : cnpjSuccessData.fonte === 'brasilapi'
                                ? 'BrasilAPI'
                                : 'Minha Receita'}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                            cnpjSuccessData.ativa
                              ? 'bg-[#12B886]/20 text-[#12B886]'
                              : 'bg-[#D9B36C]/20 text-[#D9B36C]'
                          }`}
                        >
                          Situação:{' '}
                          {cnpjSuccessData.descricao_situacao_cadastral ||
                            (cnpjSuccessData.ativa ? 'ATIVA' : 'A CONFIRMAR')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-[rgba(18,184,134,0.15)] pt-2.5">
                        {cnpjSuccessData.cnae_fiscal && (
                          <div className="sm:col-span-2">
                            <span className="text-[#93A3B5] block text-[11px]">
                              CNAE Principal:
                            </span>
                            <span className="text-[#F4F7FA] font-medium">
                              {cnpjSuccessData.cnae_fiscal}
                              {cnpjSuccessData.cnae_fiscal_descricao
                                ? ` — ${cnpjSuccessData.cnae_fiscal_descricao}`
                                : ''}
                            </span>
                          </div>
                        )}
                        {(cnpjSuccessData.municipio ||
                          cnpjSuccessData.uf ||
                          cnpjSuccessData.logradouro) && (
                          <div>
                            <span className="text-[#93A3B5] block text-[11px]">
                              Localidade / Endereço:
                            </span>
                            <span className="text-[#F4F7FA]">
                              {[
                                cnpjSuccessData.logradouro,
                                cnpjSuccessData.numero,
                                cnpjSuccessData.bairro,
                                cnpjSuccessData.municipio,
                                cnpjSuccessData.uf,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                          </div>
                        )}
                        {cnpjSuccessData.porte && (
                          <div>
                            <span className="text-[#93A3B5] block text-[11px]">
                              Porte da Empresa:
                            </span>
                            <span className="text-[#D9B36C] font-semibold">
                              {cnpjSuccessData.porte}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selo / Banner Visível de MODO DEMONSTRAÇÃO */}
                  {isModelMode && (
                    <div className="p-4 rounded-xl bg-[#D9B36C]/15 border-2 border-[#D9B36C] space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#D9B36C] text-[#0A0E12] font-black text-xs tracking-wider uppercase shadow-sm">
                            DEMONSTRAÇÃO
                          </span>
                          <span className="text-xs font-bold text-[#F4F7FA]">
                            EMPRESA-MODELO PEDAGÓGICA (MODO DEMO ATIVO)
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-[#D9B36C]">
                          {formData.regime_tributario} • ISENTO DE COBRANÇA
                        </span>
                      </div>
                      <p className="text-xs text-[#93A3B5] leading-relaxed">
                        {modeloAtivo?.descricao_pedagogica ||
                          'Esta empresa é um modelo pedagógico com dados pré-configurados para demonstrar o enquadramento tributário e de emissões. Diagnósticos gerados em modo demonstração não geram cobrança e não compõem estatísticas públicas.'}
                      </p>
                    </div>
                  )}

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
                    <p className="text-[11px] text-[#93A3B5]/80 mt-1">
                      Identifica a pessoa jurídica na emissão do laudo técnico e no protocolo
                      pericial preliminar.
                    </p>
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
                      <p className="text-[11px] text-[#93A3B5]/80 mt-1">
                        Para criar seu acesso seguro e enviar o diagnóstico completo e o relatório
                        comparativo.
                      </p>
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
                      <p className="text-[11px] text-[#93A3B5]/80 mt-1">
                        Canal direto para envio do protocolo e contato operacional do auditor
                        pericial.
                      </p>
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
                    <p className="text-[11px] text-[#93A3B5]/80 mt-1">
                      Identifica o signatário legal e responsável técnico pela abertura do
                      protocolo.
                    </p>
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
                      <p className="text-[11px] text-[#93A3B5]/80 mt-1">
                        Define os termos de responsabilidade técnica e o tipo de chancela requerida.
                      </p>
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
                      <p className="text-[11px] text-[#93A3B5]/80 mt-1">
                        Para vinculação formal de ART/RRT ou parecer de auditoria CRC no laudo dMRV.
                      </p>
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
                      <p className="text-[11px] text-[#93A3B5]/80 mt-1">
                        Protege o acesso à consulta e permite retomar o comparativo quando quiser.
                      </p>
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
                      <p className="text-[11px] text-[#93A3B5]/80 mt-1">
                        Garante que sua credencial foi digitada sem erros tipográficos.
                      </p>
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

              {/* STEP 3: VÍNCULO INSTITUCIONAL & REGIME DECLARADO */}
              {step === 3 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="border-b border-[rgba(244,247,250,0.08)] pb-3">
                    <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                      3. VÍNCULO INSTITUCIONAL & REGIME TRIBUTÁRIO
                    </h2>
                    <p className="text-xs text-[#93A3B5]">
                      Selecione seu enquadramento institucional e informe o regime tributário
                      declarado.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        val: 'Mercado Nacional (Bahia, SP, Brasil)',
                        title: 'Mercado Nacional (Bahia, SP, Brasil)',
                        sub: 'Tabela de Mercado • Sem filiação específica • Validação preparatória SBCE e IFRS',
                      },
                      {
                        val: 'Associado ACP (Paraná)',
                        title: 'Associado ACP (Paraná)',
                        sub: 'Condição Subsidiada PME • Bureau ACP + IBESG',
                      },
                      {
                        val: 'Cadeia Automotiva / CDV (Programa MOVER)',
                        title: 'Cadeia Automotiva / CDV (Programa MOVER)',
                        sub: 'Programa MOVER • Exclusivo para fabricantes e desmanches DETRAN credenciados',
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
                      Regime tributário: a confirmar pelo contribuinte
                    </label>
                    <select
                      value={formData.regime_tributario}
                      onChange={(e) =>
                        setFormData({ ...formData, regime_tributario: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                    >
                      <option value="A confirmar">A confirmar pelo contribuinte (padrão)</option>
                      <option value="Simples Nacional">Simples Nacional</option>
                      <option value="Lucro Presumido">Lucro Presumido</option>
                      <option value="Lucro Real">Lucro Real</option>
                    </select>
                    <p className="text-[11px] text-[#93A3B5]/80 mt-1">
                      Necessário para simular a carga comparativa da Reforma Tributária (PIS/COFINS
                      vs. IBS/CBS). O regime é informado pelo contribuinte e verificado na auditoria
                      documental.
                    </p>
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
                      Avançar para Triagem de Emissões
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: NOVO PASSO DE TRIAGEM DE EMISSÕES & CBAM */}
              {step === 4 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="border-b border-[rgba(244,247,250,0.08)] pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="w-4 h-4 text-[#D9B36C]" />
                      <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                        4. TRIAGEM DE EMISSÕES & FRONTEIRA CBAM
                      </h2>
                    </div>
                    <p className="text-xs text-[#93A3B5]">
                      Avaliação preliminar para enquadramento aos limiares da Lei 15.042/2024 (SBCE)
                      e comércio exterior.
                    </p>
                  </div>

                  {/* Consumo aproximado de energia */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                      Porte / Consumo Aproximado de Energia
                    </label>
                    <input
                      type="text"
                      value={formData.consumo_energia}
                      onChange={(e) =>
                        setFormData({ ...formData, consumo_energia: e.target.value })
                      }
                      placeholder="Ex.: Baixa tensão comercial / Alta tensão industrial (MWh/ano)"
                      className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                    />
                    <p className="text-[11px] text-[#93A3B5]/80 mt-1">
                      Alimenta o cálculo de emissões indiretas por consumo de eletricidade do SIN
                      (Escopo 2).
                    </p>
                  </div>

                  {/* Frota própria e Certificações */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                        Possui Frota Própria?
                      </label>
                      <select
                        value={formData.frota_propria}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            frota_propria: e.target.value as 'sim' | 'nao',
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886] text-xs"
                      >
                        <option value="nao">Não</option>
                        <option value="sim">Sim (Diesel / Flex / Elétrico)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                        Inventário GHG Protocol?
                      </label>
                      <select
                        value={formData.inventario_ghg}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            inventario_ghg: e.target.value as 'sim' | 'nao' | 'em_andamento',
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886] text-xs"
                      >
                        <option value="nao">Não possui</option>
                        <option value="em_andamento">Em andamento</option>
                        <option value="sim">Sim (Concluído)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                        Certificação ISO 14001?
                      </label>
                      <select
                        value={formData.iso_14001}
                        onChange={(e) =>
                          setFormData({ ...formData, iso_14001: e.target.value as 'sim' | 'nao' })
                        }
                        className="w-full px-3 py-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886] text-xs"
                      >
                        <option value="nao">Não</option>
                        <option value="sim">Sim</option>
                      </select>
                    </div>
                  </div>

                  {/* SEGMENTAÇÃO SETORIAL: Flagship Alimentação & Em Estruturação */}
                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#F4F7FA]">
                          Trilha por Segmento Econômico
                        </label>
                        <span className="text-[11px] text-[#12B886] font-semibold">
                          Flagship Alimentação Disponível
                        </span>
                      </div>
                      <p className="text-[11px] text-[#93A3B5] mt-0.5">
                        Selecione seu segmento para habilitar perguntas operacionais e comparativo
                        setorial calibrado.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {SEGMENTOS_DIAGNOSTICO.map((seg) => {
                        const isAtivo = seg.status === 'ativo'
                        const isSelected = formData.segmento_economico === seg.id
                        return (
                          <div
                            key={seg.id}
                            onClick={() => {
                              if (isAtivo) {
                                setFormData({ ...formData, segmento_economico: seg.id })
                              }
                            }}
                            className={`p-3 rounded-xl border text-xs transition-all ${
                              isSelected
                                ? 'bg-[#12B886]/15 border-[#12B886] text-[#F4F7FA] shadow-sm'
                                : isAtivo
                                  ? 'bg-[#111820] border-[rgba(244,247,250,0.1)] text-[#93A3B5] hover:border-[#12B886]/40 cursor-pointer'
                                  : 'bg-[#111820]/40 border-[rgba(244,247,250,0.06)] text-[#93A3B5]/60 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-semibold text-xs leading-tight">
                                {seg.nome}
                              </span>
                              {seg.status === 'em_estruturacao' ? (
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase tracking-wider shrink-0">
                                  em estruturação
                                </span>
                              ) : seg.id === 'alimentacao' ? (
                                <span className="px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] text-[9px] font-bold uppercase tracking-wider shrink-0">
                                  Flagship
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-wider shrink-0">
                                  Geral
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#93A3B5] leading-normal">
                              {seg.subtitulo}
                            </p>
                            {seg.descricaoStatus && (
                              <p className="text-[10px] text-amber-400/80 mt-1 italic leading-tight">
                                ℹ️ {seg.descricaoStatus}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Questionário Setorial do Segmento Alimentação (Flagship) */}
                    {formData.segmento_economico === 'alimentacao' && (
                      <FormularioSegmentoAlimentacao
                        dados={formData.dados_alimentacao}
                        onChange={(novosDados) =>
                          setFormData({ ...formData, dados_alimentacao: novosDados })
                        }
                      />
                    )}
                  </div>

                  {/* Faixa de Emissões Anuais */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                      Estimativa Aproximada de Emissões Anuais (Escopo 1 e 2)
                    </label>
                    <select
                      value={formData.faixa_emissoes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          faixa_emissoes: e.target.value as
                            | 'abaixo_10k'
                            | 'entre_10k_25k'
                            | 'acima_25k'
                            | 'nao_sei_calcular',
                        })
                      }
                      className="w-full px-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                    >
                      <option value="abaixo_10k">&lt; 10.000 tCO₂e / ano</option>
                      <option value="entre_10k_25k">10.000 a 25.000 tCO₂e / ano</option>
                      <option value="acima_25k">&gt; 25.000 tCO₂e / ano</option>
                      <option value="nao_sei_calcular">
                        Não sei calcular (avaliação pendente)
                      </option>
                    </select>
                    <p className="text-[11px] text-[#93A3B5]/80 mt-1">
                      Determina se sua organização estará sujeita ao plano de monitoramento
                      compulsório ou teto da Lei 15.042/2024.
                    </p>

                    {/* Feedback preliminar SBCE */}
                    <div className="mt-2.5 p-3 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/30 text-xs flex items-center justify-between">
                      <span className="text-[#93A3B5]">Enquadramento preliminar SBCE:</span>
                      <span className="font-semibold text-[#D9B36C]">
                        {calcularEnquadramentoSBCE(formData.faixa_emissoes)}
                      </span>
                    </div>
                  </div>

                  {/* Pergunta CBAM União Europeia */}
                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="block text-xs font-bold text-[#F4F7FA]">
                          A empresa exporta produtos para a União Europeia? (Mecanismo CBAM)
                        </label>
                        <span className="text-[11px] text-[#93A3B5]">
                          Requer cálculo de emissões incorporadas para aduanas europeias.
                        </span>
                      </div>
                      <select
                        value={formData.exporta_ue_cbam}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            exporta_ue_cbam: e.target.value as 'sim' | 'nao',
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886] text-xs shrink-0"
                      >
                        <option value="nao">Não exporta para UE</option>
                        <option value="sim">Sim, exporta para UE</option>
                      </select>
                    </div>

                    {formData.exporta_ue_cbam === 'sim' && (
                      <div className="pt-2 border-t border-[rgba(244,247,250,0.06)] animate-fade-in">
                        <label className="block text-[11px] font-semibold text-[#D9B36C] uppercase mb-1">
                          Bens cobertos exportados:
                        </label>
                        <input
                          type="text"
                          value={formData.cbam_bens}
                          onChange={(e) => setFormData({ ...formData, cbam_bens: e.target.value })}
                          placeholder="Ex.: Aço, alumínio, cimento, fertilizantes, hidrogênio ou outros"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 text-xs focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                        />
                      </div>
                    )}
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

              {/* STEP 5: ACEITE LGPD */}
              {step === 5 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-[rgba(244,247,250,0.08)] pb-3">
                    <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                      5. CONSENTIMENTO & TERMOS LGPD
                    </h2>
                    <p className="text-xs text-[#93A3B5]">
                      Termo de autorização de tratamento de dados cadastrais, fiscais e
                      operacionais.
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
                      <span className="text-[#93A3B5]">Regime Declarado:</span>
                      <span className="font-semibold text-[#F4F7FA]">
                        {formData.regime_tributario}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[rgba(244,247,250,0.05)]">
                      <span className="text-[#93A3B5]">Enquadramento SBCE:</span>
                      <span className="font-semibold text-[#D9B36C]">
                        {calcularEnquadramentoSBCE(formData.faixa_emissoes)}
                      </span>
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
                        Concordo com o tratamento dos dados cadastrais, operacionais e fiscais pela{' '}
                        <strong className="text-[#F4F7FA]">ORBIS PROTOCOL</strong> e pela{' '}
                        <strong className="text-[#F4F7FA]">
                          MGM CONSULTORIA EMPRESARIAL LTDA (CNPJ 19.598.964/0001-01)
                        </strong>
                        , com finalidade restrita à análise preliminar de elegibilidade tributária,
                        triagem de emissões e emissão do protocolo pericial preliminar, em
                        conformidade com a{' '}
                        <a
                          href="/privacidade"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#12B886] underline font-semibold hover:text-[#12B886]/80"
                        >
                          Política de Privacidade LGPD
                        </a>{' '}
                        (Lei 13.709/2018).
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
                      type="button"
                      onClick={nextStep}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
                    >
                      Ver Comparativo Tributário
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6: COMPARATIVO TRIBUTÁRIO (REFORMA EC 132/2023) */}
              {step === 6 && (
                <div className="space-y-6">
                  <ComparativoTributarioView
                    comparativo={comparativoCalculado}
                    regimeDeclarado={formData.regime_tributario}
                    exportaUE={formData.exporta_ue_cbam === 'sim'}
                    cbamBens={formData.cbam_bens}
                    enquadramentoSBCE={calcularEnquadramentoSBCE(formData.faixa_emissoes)}
                    onConfirmar={() => handleSubmit()}
                    onVoltar={prevStep}
                    isSubmitting={isSubmitting}
                  />
                </div>
              )}

              {/* STEP 7: TELA DE SUCESSO / RESUMO */}
              {step === 7 && protocoloGerado && (
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
                      a análise técnica preparatória de enquadramento ao SBCE e MOVER.
                    </p>
                  </div>

                  {/* Selo Visível DEMONSTRAÇÃO caso gerado por modelo */}
                  {protocoloGerado.demonstracao && (
                    <div className="max-w-xl mx-auto p-3.5 rounded-xl bg-[#D9B36C]/20 border-2 border-[#D9B36C] flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 rounded bg-[#D9B36C] text-[#0A0E12] font-black text-xs tracking-wider uppercase">
                          DEMONSTRAÇÃO
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[#F4F7FA]">
                            Diagnóstico Pedagógico de Modelo
                          </div>
                          <div className="text-[11px] text-[#93A3B5]">
                            Isento de cobrança • Excluído das métricas públicas e relatórios do
                            Console
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Etiqueta de honestidade obrigatória */}
                  <div className="max-w-xl mx-auto p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-700 dark:text-[#D9B36C] text-xs font-medium text-center">
                    ⚠️ Resumo preliminar — não substitui laudo pericial probatório. Cadastro
                    gratuito entrega o diagnóstico completo do CNPJ sem valores de nota. Pegada por
                    nota e produto disponível no trial de 15 dias (5 notas) e no plano contratado.
                  </div>

                  {/* Resultado Setorial Alimentação (se aplicável) */}
                  {protocoloGerado.resultadoAlimentacao && (
                    <div className="max-w-2xl mx-auto">
                      <ResultadoSegmentoAlimentacaoView
                        resultado={protocoloGerado.resultadoAlimentacao}
                        razaoSocial={protocoloGerado.razao_social}
                        cnpj={protocoloGerado.cnpj}
                      />
                    </div>
                  )}

                  {/* Summary Card */}
                  <div className="p-6 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 text-left max-w-xl mx-auto space-y-3 relative overflow-hidden">
                    {protocoloGerado.demonstracao && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 select-none">
                        <span className="text-6xl font-black text-[#D9B36C] -rotate-12 uppercase tracking-widest">
                          DEMONSTRAÇÃO
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs border-b border-[rgba(244,247,250,0.08)] pb-2">
                      <span className="text-[#93A3B5]">Identificador:</span>
                      <span className="font-mono text-xs text-[#D9B36C] font-semibold">
                        {protocoloGerado.id}
                      </span>
                    </div>{' '}
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
                    {protocoloGerado.enquadramento_sbce && (
                      <div className="flex justify-between items-center text-xs border-b border-[rgba(244,247,250,0.08)] pb-2">
                        <span className="text-[#93A3B5]">Enquadramento SBCE:</span>
                        <span className="font-semibold text-[#D9B36C] text-right">
                          {protocoloGerado.enquadramento_sbce}
                        </span>
                      </div>
                    )}
                    {protocoloGerado.comparativo && (
                      <div className="flex justify-between items-center text-xs border-b border-[rgba(244,247,250,0.08)] pb-2">
                        <span className="text-[#93A3B5]">Situação em relação à Reforma:</span>
                        <span className="font-semibold text-[#12B886] text-right">
                          {protocoloGerado.comparativo.tituloImpacto}
                        </span>
                      </div>
                    )}
                    {/* Detalhe do Protocolo Setorial Enquadrado */}
                    {(() => {
                      const vinc = (protocoloGerado.vinculo_institucional || '').toLowerCase()
                      const rz = (protocoloGerado.razao_social || '').toLowerCase()
                      let protKey = 'varejo'
                      if (
                        vinc.includes('automotiva') ||
                        rz.includes('cdv') ||
                        rz.includes('desmanche')
                      ) {
                        protKey = 'automotiva'
                      } else if (
                        rz.includes('metal') ||
                        rz.includes('aco') ||
                        rz.includes('siderurg')
                      ) {
                        protKey = 'siderurgia'
                      } else if (rz.includes('alimento') || rz.includes('bebida')) {
                        protKey = 'alimentos'
                      } else if (rz.includes('grao') || rz.includes('agro')) {
                        protKey = 'agro'
                      } else if (rz.includes('transporte') || rz.includes('logistica')) {
                        protKey = 'logistica'
                      }
                      const prot = PROTOCOLOS_SETORIAIS[protKey]
                      if (!prot) return null
                      return (
                        <div className="pt-2 border-b border-[rgba(244,247,250,0.08)] pb-2">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="text-[#93A3B5]">Protocolo Setorial Homologado:</span>
                            <span className="font-bold text-[#12B886] text-right">{prot.nome}</span>
                          </div>
                          <p className="text-[11px] text-[#93A3B5] mb-2">{prot.tagline}</p>
                          <Link
                            to={`/protocolos/${prot.slug}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#12B886] hover:underline"
                          >
                            <span>Ver enquadramento legal e evidências exigidas ({prot.nome})</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )
                    })()}
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
                        setCnpjSuccessData(null)
                        setCnpjLookupError('')
                        setSugestaoModeloRaiz(null)
                        setIsModelMode(false)
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
                          regime_tributario: 'A confirmar',
                          consumo_energia: '',
                          frota_propria: 'nao',
                          inventario_ghg: 'nao',
                          iso_14001: 'nao',
                          faixa_emissoes: 'nao_sei_calcular',
                          exporta_ue_cbam: 'nao',
                          cbam_bens: '',
                          segmento_economico: 'geral',
                          dados_alimentacao: {
                            tipo_estabelecimento: 'restaurante',
                            porte_funcionarios: '5_a_15',
                            porte_faturamento_mensal: '30k_a_100k',
                            principais_insumos: [
                              'carnes',
                              'embalagens_plasticas',
                              'oleo_fritura',
                              'bebidas',
                            ],
                            fontes_energia: ['eletrica_concessionaria', 'glp_botijao'],
                            residuos_gerados: [
                              'organicos',
                              'oleo_fritura_usado',
                              'reciclaveis_secos',
                            ],
                            origem_insumos: 'mista',
                            logistica_reversa_embalagens: 'em_estruturacao',
                          },
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
                    EMPRESAS-MODELO DE DEMONSTRAÇÃO
                  </h3>
                </div>
                <p className="text-xs text-[#93A3B5] mb-5">
                  4 modelos pedagógicos com CNPJs válidos pré-configurados (2 Lucro Presumido e 2
                  Lucro Real) para demonstração a prospects. Pulam consulta externa, recebem selo
                  DEMONSTRAÇÃO e não geram cobrança:
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
                        <div className="flex items-center gap-3 text-[11px] text-[#93A3B5] mb-2">
                          <span className="font-mono text-[#D9B36C]">{m.cnpj}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#16202B] text-[#93A3B5] text-[10px]">
                            {m.regime_tributario}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#93A3B5] mb-3">
                          <span className="text-[#12B886]">SBCE: </span>
                          <span>
                            {m.faixa_emissoes === 'abaixo_10k' && '< 10k tCO₂e'}
                            {m.faixa_emissoes === 'entre_10k_25k' && '10k–25k tCO₂e (Reporte)'}
                            {m.faixa_emissoes === 'acima_25k' && '> 25k tCO₂e (Compensação)'}
                            {!m.faixa_emissoes && 'Avaliação pendente'}
                          </span>
                          {m.exporta_ue_cbam === 'sim' && (
                            <span className="ml-2 px-1.5 py-0.2 rounded bg-[#D9B36C]/20 text-[#D9B36C] text-[9px] font-bold">
                              CBAM UE
                            </span>
                          )}
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
                  Todos os dados submetidos são protegidos por controle estrito de acesso e
                  vinculados ao seu CNPJ. Os laudos periciais têm caráter preparatório para o
                  Sistema SBCE (Lei 15.042/2024) e para o Programa MOVER automotivo.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
