import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  FileSignature,
  RotateCcw,
  Info,
  Calendar,
  Award,
  FileText,
  User,
  Scale,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  VERSAO_TERMO_CONSENTIMENTO_LGPD,
  ConsentimentoPeritoRecord,
  buscarConsentimentoAtivoPerito,
  registrarConsentimentoPerito,
  revogarConsentimentoPerito,
  resolverExibicaoPerito,
} from '@/services/consentimentoPeritoService'
import {
  buscarCredenciamentoAtivoPerito,
  PeritoCredenciamentoRecord,
} from '@/services/peritoService'
import pb from '@/lib/pocketbase/client'

interface BlocoConsentimentoPeritoLgpdProps {
  /** Se deve renderizar com visual compacto ou expandido */
  compacto?: boolean
  /** Callback opcional chamado após alteração do consentimento */
  onConsentimentoChange?: (consentimento: ConsentimentoPeritoRecord | null) => void
}

export function BlocoConsentimentoPeritoLgpd({
  compacto = false,
  onConsentimentoChange,
}: BlocoConsentimentoPeritoLgpdProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [revogando, setRevogando] = useState(false)
  const [confirmandoRevogacao, setConfirmandoRevogacao] = useState(false)
  const [motivoRevogacao, setMotivoRevogacao] = useState('')

  const [consentimentoAtivo, setConsentimentoAtivo] = useState<ConsentimentoPeritoRecord | null>(
    null,
  )
  const [ultimoConsentimentoRevogado, setUltimoConsentimentoRevogado] =
    useState<ConsentimentoPeritoRecord | null>(null)
  const [peritoCredenciado, setPeritoCredenciado] = useState<PeritoCredenciamentoRecord | null>(
    null,
  )

  // Formulário para aceite do termo
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [conselhoTipo, setConselhoTipo] = useState('CREA')
  const [registroProfissional, setRegistroProfissional] = useState('')
  const [registroUf, setRegistroUf] = useState('SP')
  const [numeroArtRrt, setNumeroArtRrt] = useState('')
  const [documentoIdentificacao, setDocumentoIdentificacao] = useState('')
  const [declaracaoCienteTermo, setDeclaracaoCienteTermo] = useState(false)
  const [mostrarTermoCompleto, setMostrarTermoCompleto] = useState(!compacto)

  // Carregar dados iniciais
  const carregarDados = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 1. Buscar credenciamento do perito para pré-preenchimento
      const cred = await buscarCredenciamentoAtivoPerito(user.id)
      if (cred) {
        setPeritoCredenciado(cred)
        setNomeCompleto(cred.nome_completo || '')
        setConselhoTipo(cred.conselho_tipo || 'CREA')
        setRegistroProfissional(cred.registro_profissional || '')
        setRegistroUf(cred.registro_uf || 'SP')
        setNumeroArtRrt(cred.numero_art_rrt || '')
        setDocumentoIdentificacao(cred.cpf || '')
      } else {
        setNomeCompleto(user.name || '')
      }

      // 2. Buscar consentimento ativo do perito autenticado
      const consent = await buscarConsentimentoAtivoPerito({
        usuarioId: user.id,
      })

      if (consent) {
        setConsentimentoAtivo(consent)
        setNomeCompleto(consent.nome_completo)
        setConselhoTipo(consent.conselho_tipo || 'CREA')
        setRegistroProfissional(consent.registro_profissional)
        setRegistroUf(consent.registro_uf || 'SP')
        if (consent.numero_art_rrt) setNumeroArtRrt(consent.numero_art_rrt)
        if (consent.documento_identificacao)
          setDocumentoIdentificacao(consent.documento_identificacao)
      } else {
        setConsentimentoAtivo(null)

        // Se não tiver ativo, buscar se já houve algum revogado para histórico
        try {
          const revogados = await pb
            .collection('consentimentos_perito')
            .getList<ConsentimentoPeritoRecord>(1, 1, {
              filter: `usuario = '${user.id}' && status = 'revogado'`,
              sort: '-updated',
            })
          if (revogados.items.length > 0) {
            setUltimoConsentimentoRevogado(revogados.items[0])
          }
        } catch {
          /* silencioso */
        }
      }

      if (onConsentimentoChange) {
        onConsentimentoChange(consent)
      }
    } catch (err) {
      console.error('[BlocoConsentimentoPeritoLgpd] Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [user?.id])

  // Submeter aceite formal
  const handleAceitarConsentimento = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!declaracaoCienteTermo) {
      toast({
        title: 'Declaração obrigatória',
        description:
          'É necessário confirmar a leitura e concordância com os termos de divulgação LGPD-PERITO-v1.0.',
        variant: 'destructive',
      })
      return
    }

    if (!nomeCompleto.trim() || !registroProfissional.trim()) {
      toast({
        title: 'Campos incompletos',
        description:
          'Nome completo e número de registro profissional são obrigatórios para a autorização formal.',
        variant: 'destructive',
      })
      return
    }

    setSalvando(true)
    try {
      const novoConsentimento = await registrarConsentimentoPerito({
        nomeCompleto,
        registroProfissional,
        conselhoTipo,
        registroUf,
        numeroArtRrt: numeroArtRrt || undefined,
        documentoIdentificacao: documentoIdentificacao || undefined,
        peritoCredenciamentoId: peritoCredenciado?.id,
        observacao: `Consentimento formal registrado pelo titular perito técnico em ${new Date().toLocaleDateString('pt-BR')}.`,
      })

      setConsentimentoAtivo(novoConsentimento)
      setUltimoConsentimentoRevogado(null)
      setDeclaracaoCienteTermo(false)

      if (onConsentimentoChange) {
        onConsentimentoChange(novoConsentimento)
      }

      toast({
        title: 'Consentimento registrado com sucesso!',
        description:
          'A autorização de divulgação formal foi gravada. Seus dados completos agora constarão nos novos Passaportes e Atestados Orbis vinculados à sua ART/RRT.',
      })
    } catch (err: any) {
      console.error('[BlocoConsentimentoPeritoLgpd] Erro ao salvar consentimento:', err)
      toast({
        title: 'Falha ao registrar consentimento',
        description:
          err?.message || 'Não foi possível gravar o termo de consentimento. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  // Revogar consentimento
  const handleRevogarConsentimento = async () => {
    if (!consentimentoAtivo?.id) return

    setRevogando(true)
    try {
      const revogado = await revogarConsentimentoPerito(
        consentimentoAtivo.id,
        motivoRevogacao.trim() ||
          'Revogação formal de consentimento solicitada pelo perito titular na área autenticada.',
      )

      setUltimoConsentimentoRevogado(revogado)
      setConsentimentoAtivo(null)
      setConfirmandoRevogacao(false)
      setMotivoRevogacao('')

      if (onConsentimentoChange) {
        onConsentimentoChange(null)
      }

      toast({
        title: 'Consentimento revogado com sucesso!',
        description:
          'Sua autorização de divulgação foi revogada. O sistema reativou imediatamente a proteção por mascaramento nos Passaportes e consultas públicas.',
      })
    } catch (err: any) {
      console.error('[BlocoConsentimentoPeritoLgpd] Erro ao revogar consentimento:', err)
      toast({
        title: 'Falha ao revogar consentimento',
        description: err?.message || 'Não foi possível revogar o consentimento. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setRevogando(false)
    }
  }

  // Pré-visualização de como os dados aparecem em documentos
  const previewMascarado = resolverExibicaoPerito(
    `${conselhoTipo}-${registroUf} ${registroProfissional} - ${nomeCompleto}`,
    null,
  )

  const previewRevelado = consentimentoAtivo
    ? resolverExibicaoPerito(undefined, consentimentoAtivo)
    : resolverExibicaoPerito(undefined, {
        id: 'preview',
        nome_completo: nomeCompleto || 'Dr. Carlos Mendonça',
        conselho_tipo: conselhoTipo,
        registro_profissional: registroProfissional || '182.940/D',
        registro_uf: registroUf,
        numero_art_rrt: numeroArtRrt || '2026/0014829',
        termo_versao: VERSAO_TERMO_CONSENTIMENTO_LGPD,
        termo_aceito_em: new Date().toISOString(),
        status: 'ativo',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      })

  if (loading) {
    return (
      <Card className="bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 shadow-sm animate-pulse">
        <CardContent className="p-8 text-center text-xs text-slate-500 dark:text-[#94A3B8]">
          Carregando dados de governança LGPD do perito técnico...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0A1628]/40 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Gestão de Privacidade LGPD • Art. 7º, I & Art. 6º, III
            </div>
            <CardTitle className="text-lg sm:text-xl font-heading font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              Termo de Consentimento para Divulgação de Dados Técnicos
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-[#94A3B8] max-w-2xl leading-relaxed">
              Controle a forma como sua qualificação profissional e identificação técnica são
              apresentadas nos Passaportes dMRV, Atestados de Conformidade e verificadores públicos
              da plataforma Orbis Protocol.
            </CardDescription>
          </div>

          <div className="shrink-0">
            {consentimentoAtivo ? (
              <Badge className="bg-emerald-600 text-white dark:bg-[#059669] flex items-center gap-1.5 px-3 py-1 font-mono text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Consentimento Ativo
              </Badge>
            ) : ultimoConsentimentoRevogado ? (
              <Badge
                variant="outline"
                className="border-amber-400 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 flex items-center gap-1.5 px-3 py-1 font-mono text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Consentimento Revogado (Mascaramento Ativo)
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 flex items-center gap-1.5 px-3 py-1 font-mono text-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                Padrão Restritivo (Mascaramento Ativo)
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-7 space-y-6">
        {/* ============================================================== */}
        {/* ESTADO ATUAL DO CONSENTIMENTO */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Esquerdo: Situação Registrada */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-emerald-600 dark:text-[#059669]" />
                Situação Registrada em Base
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-[#94A3B8]">
                Versão: {VERSAO_TERMO_CONSENTIMENTO_LGPD}
              </span>
            </div>

            {consentimentoAtivo ? (
              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                      Status da Autorização
                    </span>
                    <span className="font-bold text-xs uppercase text-emerald-700 dark:text-emerald-300">
                      ● Ativo
                    </span>
                  </div>
                  <div className="text-xs">
                    <strong>Titular:</strong> {consentimentoAtivo.nome_completo}
                  </div>
                  <div className="text-xs">
                    <strong>Registro:</strong> {consentimentoAtivo.conselho_tipo || 'CREA'}-
                    {consentimentoAtivo.registro_uf || 'SP'}{' '}
                    {consentimentoAtivo.registro_profissional}
                  </div>
                  {consentimentoAtivo.numero_art_rrt && (
                    <div className="text-xs">
                      <strong>ART/RRT Vinculada:</strong> {consentimentoAtivo.numero_art_rrt}
                    </div>
                  )}
                  <div className="text-[11px] text-emerald-800 dark:text-emerald-400/90 pt-1 border-t border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between">
                    <span>Aceito em:</span>
                    <span>
                      {new Date(consentimentoAtivo.termo_aceito_em).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            ) : ultimoConsentimentoRevogado ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400">
                    Consentimento Revogado
                  </span>
                  <span className="font-mono text-[10px]">
                    {ultimoConsentimentoRevogado.revogado_em
                      ? new Date(ultimoConsentimentoRevogado.revogado_em).toLocaleString('pt-BR')
                      : 'Data não registrada'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  A revogação foi registrada com sucesso. A plataforma voltou a aplicar a regra
                  padrão de minimização de dados do Art. 6º, III da LGPD nos verificadores e
                  passaportes emitidos.
                </p>
                {ultimoConsentimentoRevogado.observacao && (
                  <div className="text-[10px] italic text-amber-800/80 dark:text-amber-400/80">
                    Motivo: {ultimoConsentimentoRevogado.observacao}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Nenhum consentimento formal ativo
                </div>
                <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  Por padrão restritivo de privacidade (Privacy by Default), o Orbis Protocol
                  mascara automaticamente o nome e dígitos centrais do seu registro profissional em
                  todos os passaportes e laudos públicos.
                </p>
              </div>
            )}
          </div>

          {/* Card Direito: Simulação de Exibição Pública */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-heading font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Impacto nos Passaportes Públicos & Verificador
            </span>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-[#94A3B8] block">
                  Exibição no Passaporte (Estado Atual em Produção):
                </span>
                <div className="font-mono text-xs font-bold text-slate-900 dark:text-[#F8FAFC] break-all">
                  {consentimentoAtivo
                    ? previewRevelado.textoFormatado
                    : previewMascarado.textoFormatado}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-[#94A3B8] italic flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  {consentimentoAtivo ? previewRevelado.notaLgpd : previewMascarado.notaLgpd}
                </div>
              </div>

              {/* Nota de Segurança e Minimização */}
              <div className="text-[11px] text-slate-600 dark:text-[#94A3B8] leading-tight">
                <strong>Garantia de Minimização:</strong> Sem o seu consentimento formal ativo,
                documentos públicos jamais expõem seu nome completo ou documento individual,
                mantendo apenas a comprovação da qualificação técnica habilitada e a ART pericial.
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TEXTO INTEGRAL DO TERMO LGPD-PERITO-v1.0 (CANÔNICO) */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0A1628]/60 overflow-hidden">
          <div className="p-4 bg-slate-100/70 dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-[#059669]" />
              <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-[#F8FAFC]">
                Termo Canônico de Consentimento & Divulgação Técnica (Versão{' '}
                {VERSAO_TERMO_CONSENTIMENTO_LGPD})
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMostrarTermoCompleto(!mostrarTermoCompleto)}
              className="text-xs h-7 text-slate-600 dark:text-[#94A3B8]"
            >
              {mostrarTermoCompleto ? 'Recolher Termo' : 'Exibir Termo Completo'}
            </Button>
          </div>

          {mostrarTermoCompleto && (
            <div className="p-5 sm:p-6 text-xs text-slate-700 dark:text-[#CBD5E1] space-y-4 max-h-[360px] overflow-y-auto leading-relaxed font-sans border-b border-slate-200 dark:border-slate-800">
              <div className="text-center font-heading font-bold text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-200 dark:border-slate-800">
                TERMO DE CONSENTIMENTO LIVRE, INFORMADO E INEQUÍVOCO PARA DIVULGAÇÃO DE DADOS
                PROFISSIONAIS
                <div className="text-[11px] font-normal font-mono text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  Em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018
                  — LGPD)
                </div>
              </div>

              <div className="space-y-2">
                <p>
                  <strong>1. DO CONTROLADOR E DO OBJETO:</strong> O presente Termo regula o
                  tratamento e a divulgação de dados de identificação profissional do Responsável
                  Técnico (Perito Engenheiro, Auditor ou Perito Avaliado), na qualidade de titular,
                  perante a plataforma ORBIS PROTOCOL, infraestrutura digital de prova documental da
                  economia circular e mensuração, relato e verificação digital (dMRV).
                </p>

                <p>
                  <strong>2. DA FINALIDADE ESPECÍFICA (Art. 7º, I c/c Art. 8º da LGPD):</strong> O
                  titular autoriza de forma expressa e inequívoca a veiculação pública de seu Nome
                  Completo, Conselho Profissional (CREA/CFT/CRQ), Número de Registro Profissional,
                  Unidade da Federação e Número da Anotação de Responsabilidade Técnica (ART) ou
                  Registro de Responsabilidade Técnica (RRT) nas interfaces públicas dos Passaportes
                  do Lote e da Peça, no Verificador de Conformidade Orbis e nos Atestados de
                  Conformidade emitidos.
                </p>

                <p>
                  <strong>3. DA BASE LEGAL:</strong> O tratamento objeto deste instrumento
                  fundamenta-se estritamente no consentimento fornecido pelo titular (Art. 7º,
                  inciso I da Lei 13.709/2018), em cumprimento ao dever de transparência técnica
                  perante o Sistema Brasileiro de Comércio de Emissões (SBCE — Lei 15.042/2024), ao
                  Programa MOVER (Lei 14.902/2024) e à Política Nacional de Resíduos Sólidos (PNRS —
                  Lei 12.305/2010).
                </p>

                <p>
                  <strong>4. DO PRINCÍPIO DA MINIMIZAÇÃO (Art. 6º, III da LGPD):</strong> Na
                  ausência deste consentimento, ou após sua eventual revogação, o Orbis Protocol
                  adota de maneira imperativa a técnica de mascaramento parcial dos dados (exemplo
                  padrão: <code>Eng. Responsável • CREA-** ***.*/D • ART ***-UF</code>), preservando
                  a higidez do sigilo pessoal sem comprometer a rastreabilidade do lote pericial.
                </p>

                <p>
                  <strong>
                    5. DO DIREITO DE REVOGAÇÃO A QUALQUER MOMENTO (Art. 8º, § 5º da LGPD):
                  </strong>{' '}
                  O consentimento aqui manifestado poderá ser revogado a qualquer tempo pelo
                  titular, mediante simples acionamento do botão "Revogar Consentimento" disponível
                  nesta área autenticada, com efeito imediato para novas consultas e emissões na
                  plataforma.
                </p>

                <p className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300 font-medium text-[11px]">
                  <strong>CLÁUSULA DE SEGURANÇA JURÍDICA:</strong> Conforme o Art. 8º, § 5º da LGPD
                  e os princípios da estabilidade dos atos jurídicos perfeitos, a revogação do
                  consentimento{' '}
                  <strong>
                    NÃO AFETA nem invalida os documentos físicos, certidões e relatórios probatórios
                    formalmente já emitidos
                  </strong>{' '}
                  durante a vigência da autorização anterior.
                </p>

                <p>
                  <strong>6. VEDAÇÃO AO DESVIO DE FINALIDADE:</strong> Os dados do profissional
                  técnico não serão comercializados, cedidos para finalidades publicitárias de
                  terceiros ou utilizados para fins diversos da verificação de autenticidade
                  pericial e conformidade regulatória dMRV.
                </p>
              </div>
            </div>
          )}

          {/* Rodapé informativo de irretratabilidade pretérita */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#111827]/40 text-[11px] text-slate-500 dark:text-[#94A3B8] flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Vigência canônica: Imediata a partir do registro formal no banco de dados.
            </span>
            <span className="font-mono text-[10px]">ID Hash do Termo: LGPD-PERITO-SHA256</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* AÇÕES: FORMULÁRIO DE ACEITE OU BOTÃO DE REVOGAÇÃO */}
        {/* ============================================================== */}
        {!consentimentoAtivo ? (
          <form onSubmit={handleAceitarConsentimento} className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-[#059669]/10 border border-emerald-200 dark:border-[#059669]/30 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-[#F8FAFC] font-heading font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#059669]" />
                Autorizar Divulgação Completa do Responsável Técnico
              </div>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                Ao registrar seu consentimento, seus dados cadastrais serão associados aos lotes e
                passaportes chancelados, substituindo a exibição anônima/mascarada pelo seu nome e
                qualificação profissional completa.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
                    Nome Completo do Perito *
                  </label>
                  <input
                    type="text"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    placeholder="Ex: Carlos Eduardo de Mendonça"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
                    Conselho de Classe *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={conselhoTipo}
                      onChange={(e) => setConselhoTipo(e.target.value)}
                      className="w-28 px-3 py-2 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] text-xs focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="CREA">CREA</option>
                      <option value="CFT">CFT</option>
                      <option value="CRQ">CRQ</option>
                      <option value="CRC">CRC</option>
                      <option value="OAB">OAB</option>
                    </select>

                    <input
                      type="text"
                      value={registroUf}
                      onChange={(e) => setRegistroUf(e.target.value.toUpperCase().slice(0, 2))}
                      placeholder="UF (ex: SP)"
                      maxLength={2}
                      className="w-20 px-3 py-2 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] text-xs uppercase font-mono text-center focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
                    Registro Profissional *
                  </label>
                  <input
                    type="text"
                    value={registroProfissional}
                    onChange={(e) => setRegistroProfissional(e.target.value)}
                    placeholder="Ex: 182.940/D ou 506070-SP"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
                    Número de ART / RRT Vinculada (Opcional)
                  </label>
                  <input
                    type="text"
                    value={numeroArtRrt}
                    onChange={(e) => setNumeroArtRrt(e.target.value)}
                    placeholder="Ex: 2026/0014829"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
                    CPF ou Documento de Identificação (Para hash interno, nunca divulgado)
                  </label>
                  <input
                    type="text"
                    value={documentoIdentificacao}
                    onChange={(e) => setDocumentoIdentificacao(e.target.value)}
                    placeholder="000.000.000-00 (utilizado exclusivamente para conferência de autenticidade)"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Checkbox de leitura mandatória */}
              <div className="pt-2 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="check-termo-lgpd-aceite"
                  checked={declaracaoCienteTermo}
                  onChange={(e) => setDeclaracaoCienteTermo(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="check-termo-lgpd-aceite"
                  className="text-xs text-slate-700 dark:text-[#CBD5E1] font-medium cursor-pointer select-none leading-snug"
                >
                  Declaro que li e compreendi os termos da versão{' '}
                  <strong>{VERSAO_TERMO_CONSENTIMENTO_LGPD}</strong>, autorizando expressamente a
                  veiculação de meus dados de identificação técnica nos passaportes e laudos Orbis
                  Protocol (Art. 7º, I da LGPD). Reconheço que poderei revogar esta autorização a
                  qualquer momento.
                </label>
              </div>

              {/* Botão de aceite formal */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-[#059669]" />
                  Registro seguro com data, hora e IP do titular perito
                </div>

                <Button
                  type="submit"
                  disabled={salvando || !declaracaoCienteTermo}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 dark:bg-[#059669] dark:hover:bg-emerald-600 text-white font-bold text-xs shadow-sm h-10 px-6"
                >
                  {salvando ? (
                    'Gravando Consentimento...'
                  ) : (
                    <>
                      <FileSignature className="w-4 h-4 mr-2" />
                      Aceitar e Autorizar Divulgação
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          /* ============================================================== */
          /* PAINEL DE REVOGAÇÃO COM CONFIRMAÇÃO INLINE */
          /* ============================================================== */
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-900 dark:text-[#F8FAFC] font-heading font-bold text-sm">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Revogação do Consentimento (Art. 8º, § 5º da LGPD)
                </div>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] max-w-xl leading-relaxed">
                  Deseja interromper a divulgação pública de sua identificação nos passaportes? Ao
                  revogar, a plataforma reativa imediatamente o mascaramento protetivo padrão.
                </p>
              </div>

              {!confirmandoRevogacao ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmandoRevogacao(true)}
                  className="border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold shrink-0 h-9"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Revogar Consentimento
                </Button>
              ) : null}
            </div>

            {/* Painel Inline de Confirmação de Revogação (NUNCA alert()) */}
            {confirmandoRevogacao && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 space-y-3">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Confirmação de Revogação de Autorização LGPD
                </div>
                <p className="text-[11px] text-red-900 dark:text-red-300 leading-relaxed">
                  Você está prestes a revogar a autorização de divulgação. A partir deste momento,
                  todas as novas consultas e passaportes emitidos voltarão a exibir seu registro sob
                  mascaramento parcial (<code>Eng. Responsável • CREA-** ***.*/D</code>).
                </p>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-slate-600 dark:text-[#94A3B8]">
                    Motivo da Revogação (Opcional para trilha de auditoria):
                  </label>
                  <input
                    type="text"
                    value={motivoRevogacao}
                    onChange={(e) => setMotivoRevogacao(e.target.value)}
                    placeholder="Ex: Encerramento de contrato, opção por privacidade estrita, etc."
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0A1628] border border-red-200 dark:border-red-900 text-slate-900 dark:text-[#F8FAFC] text-xs"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-white/70 dark:bg-[#0A1628]/70 border border-red-200/60 dark:border-red-900/40 text-[11px] text-slate-600 dark:text-[#94A3B8] leading-tight">
                  <strong>Nota Jurídica de Salvaguarda:</strong> A revogação entra em vigor
                  imediatamente para todas as futuras visualizações na plataforma e novos
                  relatórios,{' '}
                  <em>não atingindo nem invalidando atestados e passaportes pretéritos</em>{' '}
                  formalmente emitidos durante o período de validade do seu consentimento.
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setConfirmandoRevogacao(false)
                      setMotivoRevogacao('')
                    }}
                    disabled={revogando}
                    className="text-xs h-8 text-slate-600 dark:text-[#94A3B8]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleRevogarConsentimento}
                    disabled={revogando}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-8 px-4"
                  >
                    {revogando ? 'Revogando...' : 'Confirmar e Revogar Autorização'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* NOTA VISÍVEL PERMANENTE DE SEGURANÇA E IRRETRATABILIDADE PASSADA */}
        {/* ============================================================== */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-[#94A3B8]">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Salvaguarda Documental (Art. 8º, § 5º da LGPD):</strong> A revogação do
            consentimento é um direito inviolável do titular e tem efeitos prospectivos (ex nunc).
            Ela restaura o mascaramento dos dados para qualquer nova consulta pública, mas não afeta
            a validade jurídica de relatórios periciais ou atestados emitidos com divulgação
            autorizada no momento de sua assinatura.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
