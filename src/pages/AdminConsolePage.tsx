import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  DollarSign,
  Users,
  Activity,
  Layers,
  ShoppingBag,
  CreditCard,
  Percent,
  Award,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  QrCode,
  FileText,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Database,
  Building,
  UserCheck,
  Edit2,
  Save,
  Plus,
  Trash2,
  Ban,
  Check,
  Leaf,
  FileCheck2,
  SlidersHorizontal,
  ShieldAlert,
  Compass,
} from 'lucide-react'
import {
  obterMoverAmpliadoHabilitado,
  setMoverAmpliadoHabilitado,
} from '@/services/platformSettingsService'
import { GerenciadorLastrosTab } from '@/components/GerenciadorLastrosTab'
import { CcrlrSinirInteroperabilidadeTab } from '@/components/CcrlrSinirInteroperabilidadeTab'
import { PainelDmrvEmissoesEvitadas } from '@/components/PainelDmrvEmissoesEvitadas'
import { useAuth } from '@/contexts/AuthContext'
import {
  carregarAdminKpis,
  AdminKpis,
  listarClientesAdmin,
  atualizarClienteAdmin,
  listarCobrancasAdmin,
  listarLeadsAdmin,
  listarConsultasDppAdmin,
  listarLotesCdvAdmin,
  listarRevisoesPericiaisAdmin,
  listarConsultasInfosimplesAdmin,
} from '@/services/adminConsoleService'
import {
  listarServicosCatalogo,
  criarServicoCatalogo,
  atualizarServicoCatalogo,
  excluirServicoCatalogo,
  ServicoCatalogoRecord,
} from '@/services/catalogoServicosService'
import {
  listarParceiros,
  criarParceiro,
  atualizarParceiro,
  excluirParceiro,
  listarComissoes,
  registrarPagamentoComissao,
  atualizarStatusAcessoParceiro,
  ParceiroRecord,
  ComissaoRecord,
  ParceiroAcessoStatus,
} from '@/services/parceirosService'
import {
  listarCredenciamentosPeritos,
  julgarCredenciamentoPerito,
  atualizarValidadeArtPerito,
  reativarPeritoSuspenso,
  PeritoCredenciamentoRecord,
} from '@/services/peritoService'
import { listarAuditLogs, anularDocumentoDpp, AuditLogRecord } from '@/services/auditService'
import { listarPecasCdvAdmin, listarDestinacoesFinaisAdmin } from '@/services/adminConsoleService'
import {
  confirmarPagamentoSimulado,
  emitirNfse,
  verificarCiclosAssinatura,
} from '@/services/cobrancaService'
import { ConsoleGovernancaMasterTab } from '@/components/ConsoleGovernancaMasterTab'
import { ConsoleParametrosNegocioTab } from '@/components/ConsoleParametrosNegocioTab'
import {
  obterBusinessSettings,
  BusinessSettingsRecord,
  BUSINESS_SETTINGS_FALLBACK,
} from '@/services/businessSettingsService'
import { useSearchParams } from 'react-router-dom'
import { ConsoleRadarSemanalTab } from '@/components/ConsoleRadarSemanalTab'

type AdminTab =
  | 'receita'
  | 'radar_semanal'
  | 'clientes'
  | 'uso'
  | 'custos'
  | 'produtos'
  | 'assinaturas'
  | 'comissoes'
  | 'peritos'
  | 'auditoria'
  | 'lastro_conformidade'
  | 'ccrlr_sinir'
  | 'dmrv_todas_empresas'
  | 'configuracoes'
  | 'governanca'
  | 'parametros_negocio'

export default function AdminConsolePage() {
  const [searchParams] = useSearchParams()
  const { user, isFinanceiroLeitor, isAdmin, isMaster, requestPasswordReset } = useAuth()
  // Matriz de papéis (Requisito 5):
  // admin edita, financeiro edita e libera acessos, financeiro_leitor só visualiza, parceiro só o próprio painel
  const isFinanceiroEditor = (user as any)?.role === 'financeiro'
  const canEditAndRelease = isAdmin || isFinanceiroEditor
  const isReadOnly = isFinanceiroLeitor && !canEditAndRelease
  const initialTab = ((): AdminTab => {
    const qTab = searchParams.get('tab')
    if (qTab === 'governanca' && isMaster) return 'governanca'
    if (qTab === 'parametros_negocio') return 'parametros_negocio'
    if (qTab === 'receita') return 'receita'
    if (qTab === 'auditoria') return 'auditoria'
    if (qTab === 'clientes') return 'clientes'
    return isMaster ? 'governanca' : 'receita'
  })()
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettingsRecord>(
    BUSINESS_SETTINGS_FALLBACK,
  )
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<AdminKpis | null>(null)

  // Dados das tabelas
  const [cobrancas, setCobrancas] = useState<any[]>([])
  const [cobrancaFiltro, setCobrancaFiltro] = useState<string>('todos')
  const [clientes, setClientes] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [dpps, setDpps] = useState<any[]>([])
  const [lotes, setLotes] = useState<any[]>([])
  const [revisoes, setRevisoes] = useState<any[]>([])
  const [consultasInfosimples, setConsultasInfosimples] = useState<any[]>([])
  const [catalogo, setCatalogo] = useState<ServicoCatalogoRecord[]>([])
  const [parceiros, setParceiros] = useState<ParceiroRecord[]>([])
  const [comissoes, setComissoes] = useState<ComissaoRecord[]>([])
  const [peritos, setPeritos] = useState<PeritoCredenciamentoRecord[]>([])
  const [pecasCdv, setPecasCdv] = useState<any[]>([])
  const [destinacoesFinais, setDestinacoesFinais] = useState<any[]>([])

  // Estado da Trilha de Auditoria (Painel 9)
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([])
  const [totalAuditLogs, setTotalAuditLogs] = useState<number>(0)
  const [auditLoading, setAuditLoading] = useState<boolean>(false)
  const [auditFiltroEntidade, setAuditFiltroEntidade] = useState<string>('todas')
  const [auditFiltroAcao, setAuditFiltroAcao] = useState<string>('todas')
  const [auditFiltroAtor, setAuditFiltroAtor] = useState<string>('')
  const [auditFiltroDataInicio, setAuditFiltroDataInicio] = useState<string>('')
  const [auditFiltroDataFim, setAuditFiltroDataFim] = useState<string>('')
  const [auditPagina, setAuditPagina] = useState<number>(1)
  const [auditDetalheLog, setAuditDetalheLog] = useState<AuditLogRecord | null>(null)

  // Estado para Anulação Formal de Documento DPP
  const [modalAnulacao, setModalAnulacao] = useState<{
    aberto: boolean
    tipo: 'peca' | 'lote' | 'destinacao' | 'selo'
    id: string
    identificadorVisual: string
    motivo: string
    submetendo: boolean
  }>({
    aberto: false,
    tipo: 'lote',
    id: '',
    identificadorVisual: '',
    motivo: '',
    submetendo: false,
  })

  // Estado para Reativação de Perito Suspenso
  const [modalReativarPerito, setModalReativarPerito] = useState<{
    aberto: boolean
    perito: PeritoCredenciamentoRecord | null
    motivo: string
    novaValidadeArt: string
    submetendo: boolean
  }>({
    aberto: false,
    perito: null,
    motivo: '',
    novaValidadeArt: '',
    submetendo: false,
  })

  // Estado para Edição Inline de ART
  const [editandoArtId, setEditandoArtId] = useState<string | null>(null)
  const [novaValidadeArtInput, setNovaValidadeArtInput] = useState<string>('')
  const [salvandoArt, setSalvandoArt] = useState<boolean>(false)

  // Modal / Edição de Produto
  const [editandoProduto, setEditandoProduto] = useState<Partial<ServicoCatalogoRecord> | null>(
    null,
  )
  // Modal / Edição de Parceiro
  const [editandoParceiro, setEditandoParceiro] = useState<Partial<ParceiroRecord> | null>(null)
  // Edição inline de cadastro mestre de cliente (Item 5 do CFO)
  const [editandoClienteId, setEditandoClienteId] = useState<string | null>(null)
  const [clienteForm, setClienteForm] = useState<{
    cnpj: string
    plano_ativo: string
    assinatura_status: string
  }>({
    cnpj: '',
    plano_ativo: '',
    assinatura_status: '',
  })
  const [salvandoCliente, setSalvandoCliente] = useState(false)
  const [executandoRetroalimentacao, setExecutandoRetroalimentacao] = useState(false)
  const [sincronizandoCiclo, setSincronizandoCiclo] = useState(false)
  const [resumoCiclo, setResumoCiclo] = useState<{
    cobrancas_geradas: number
    cobrancas_vencidas: number
    users_atualizados: number
    data: string
  } | null>(null)
  // Observação perito
  const [obsPerito, setObsPerito] = useState<Record<string, string>>({})
  // Feedback
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  const mostrarMensagem = (msg: string) => {
    setMensagemSucesso(msg)
    setTimeout(() => setMensagemSucesso(''), 4000)
  }

  const carregarTodosDados = async () => {
    setLoading(true)
    try {
      const [
        kpisData,
        cobsData,
        cliData,
        leadsData,
        dppsData,
        lotesData,
        revsData,
        infosData,
        catData,
        parcData,
        comData,
        peritosData,
        pecasData,
        destData,
        bSettings,
      ] = await Promise.all([
        carregarAdminKpis(),
        listarCobrancasAdmin(),
        listarClientesAdmin(),
        listarLeadsAdmin(),
        listarConsultasDppAdmin(),
        listarLotesCdvAdmin(),
        listarRevisoesPericiaisAdmin(),
        listarConsultasInfosimplesAdmin(),
        listarServicosCatalogo(),
        listarParceiros(),
        listarComissoes(),
        listarCredenciamentosPeritos(),
        listarPecasCdvAdmin().catch(() => []),
        listarDestinacoesFinaisAdmin().catch(() => []),
        obterBusinessSettings().catch(() => BUSINESS_SETTINGS_FALLBACK),
      ])

      if (bSettings) {
        setBusinessSettings(bSettings)
      }

      setKpis(kpisData)
      setCobrancas(cobsData)
      setClientes(cliData)
      setLeads(leadsData)
      setDpps(dppsData)
      setLotes(lotesData)
      setRevisoes(revsData)
      setConsultasInfosimples(infosData)
      setCatalogo(catData)
      setParceiros(parcData)
      setComissoes(comData)
      setPeritos(peritosData)
      setPecasCdv(pecasData)
      setDestinacoesFinais(destData)
    } catch (err) {
      console.error('Erro ao carregar dados admin:', err)
    } finally {
      setLoading(false)
    }
  }

  const carregarAuditLogs = async () => {
    setAuditLoading(true)
    try {
      const res = await listarAuditLogs({
        entidade: auditFiltroEntidade,
        acao: auditFiltroAcao,
        ator: auditFiltroAtor,
        dataInicio: auditFiltroDataInicio || undefined,
        dataFim: auditFiltroDataFim || undefined,
        page: auditPagina,
        perPage: 25,
      })
      setAuditLogs(res.items)
      setTotalAuditLogs(res.totalItems)
    } catch (err) {
      console.error('Erro ao carregar audit_logs:', err)
    } finally {
      setAuditLoading(false)
    }
  }

  useEffect(() => {
    carregarTodosDados()
  }, [])

  useEffect(() => {
    if (activeTab === 'auditoria') {
      carregarAuditLogs()
    }
  }, [
    activeTab,
    auditFiltroEntidade,
    auditFiltroAcao,
    auditFiltroAtor,
    auditFiltroDataInicio,
    auditFiltroDataFim,
    auditPagina,
  ])

  // Estado para Modal de Liquidação Manual (Item 1 e Item 2 do CFO: Auditoria, 4-olhos, Justificativa e Divergência)
  const [modalLiquidacao, setModalLiquidacao] = useState<{
    aberto: boolean
    cobranca: any | null
    justificativa: string
    comprovanteRef: string
    confirmacaoDuplaCheck: boolean
    etapaDupla: boolean // Para valores > 5000
    divergenteAviso: boolean
    submetendo: boolean
  }>({
    aberto: false,
    cobranca: null,
    justificativa: '',
    comprovanteRef: '',
    confirmacaoDuplaCheck: false,
    etapaDupla: false,
    divergenteAviso: false,
    submetendo: false,
  })

  // Detalhe de auditoria da cobrança (visualização da trilha)
  const [cobrancaDetalheAuditoria, setCobrancaDetalheAuditoria] = useState<any | null>(null)

  // Estado para Flag de Configuração MOVER Ampliado
  const [moverAmpliadoHabilitado, setMoverAmpliadoHabilitadoState] = useState<boolean>(false)
  const [salvandoMoverFlag, setSalvandoMoverFlag] = useState<boolean>(false)

  useEffect(() => {
    obterMoverAmpliadoHabilitado()
      .then((val) => setMoverAmpliadoHabilitadoState(val))
      .catch(() => {})
  }, [])

  const handleToggleMoverAmpliado = async () => {
    if (isReadOnly) return
    const novoValor = !moverAmpliadoHabilitado
    setSalvandoMoverFlag(true)
    try {
      await setMoverAmpliadoHabilitado(novoValor, user?.email || user?.name || 'admin')
      setMoverAmpliadoHabilitadoState(novoValor)
      mostrarMensagem(
        novoValor
          ? 'Catálogo Ampliado do Programa MOVER habilitado na plataforma!'
          : 'Catálogo Ampliado do Programa MOVER desabilitado (restringido a CONTRAN 611 vigente).',
      )
    } catch (err: any) {
      alert('Erro ao atualizar configuração da plataforma: ' + err.message)
    } finally {
      setSalvandoMoverFlag(false)
    }
  }

  const limiteFourEyesAtual = businessSettings?.limite_four_eyes ?? 5000

  const abrirModalLiquidacao = (cob: any) => {
    const isDivergente = Boolean(cob.divergencia_preco || cob.origem_preco === 'contingencia')
    const valorCob = Number(cob.valor) || 0
    const exigeQuatroOlhos = valorCob > limiteFourEyesAtual
    setModalLiquidacao({
      aberto: true,
      cobranca: cob,
      justificativa: isDivergente
        ? 'Divergência detectada entre fallback e catálogo: valor conferido e aprovado pelo operador conforme Parecer CFO.'
        : '',
      comprovanteRef: cob.txid ? `PIX-${cob.txid.slice(0, 10)}` : '',
      confirmacaoDuplaCheck: false,
      etapaDupla: exigeQuatroOlhos,
      divergenteAviso: isDivergente,
      submetendo: false,
    })
  }

  const executarLiquidacaoManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalLiquidacao.cobranca) return

    if (!modalLiquidacao.justificativa.trim()) {
      alert('Preenchimento obrigatório da justificativa da liquidação manual.')
      return
    }
    if (!modalLiquidacao.comprovanteRef.trim()) {
      alert('Preenchimento obrigatório da referência do comprovante (ex.: nº documento/PIX).')
      return
    }

    const valorCob = Number(modalLiquidacao.cobranca.valor) || 0
    if (valorCob > limiteFourEyesAtual && !modalLiquidacao.confirmacaoDuplaCheck) {
      alert(
        `Para cobranças acima de R$ ${limiteFourEyesAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, a segunda confirmação é obrigatória (Regra de Quatro Olhos).`,
      )
      return
    }

    setModalLiquidacao((prev) => ({ ...prev, submetendo: true }))
    try {
      await confirmarPagamentoSimulado({
        cobranca_id: modalLiquidacao.cobranca.id,
        justificativa: modalLiquidacao.justificativa,
        comprovante_ref: modalLiquidacao.comprovanteRef,
        confirmacao_dupla: modalLiquidacao.confirmacaoDuplaCheck,
        is_manual: true,
        liquidado_por: `${user?.name || user?.email || 'Administrador'} (Console Gestão)`,
      })

      mostrarMensagem(
        'Cobrança liquidada com sucesso! Trilha de auditoria e comissão/assinatura registradas.',
      )
      setModalLiquidacao({
        aberto: false,
        cobranca: null,
        justificativa: '',
        comprovanteRef: '',
        confirmacaoDuplaCheck: false,
        etapaDupla: false,
        divergenteAviso: false,
        submetendo: false,
      })
      carregarTodosDados()
    } catch (err: any) {
      alert('Erro ao liquidar cobrança: ' + err.message)
    } finally {
      setModalLiquidacao((prev) => ({ ...prev, submetendo: false }))
    }
  }

  const handleConfirmarPagamento = (cob: any) => {
    abrirModalLiquidacao(cob)
  }

  const handleEmitirNfseAdmin = async (cobrancaId: string) => {
    try {
      await emitirNfse(cobrancaId)
      mostrarMensagem('Solicitação de NFS-e processada!')
      carregarTodosDados()
    } catch (e: any) {
      alert('Erro: ' + e.message)
    }
  }

  // Ações de Assinatura do Cliente e Recorrência (Item 6 do CFO)
  const handleSincronizarCiclosAssinatura = async () => {
    setSincronizandoCiclo(true)
    try {
      const res = await verificarCiclosAssinatura()
      setResumoCiclo({
        cobrancas_geradas: res.cobrancas_geradas,
        cobrancas_vencidas: res.cobrancas_vencidas,
        users_atualizados: res.users_atualizados,
        data: res.data_verificacao,
      })
      mostrarMensagem(
        `Ciclo sincronizado: ${res.cobrancas_geradas} cobrança(s) gerada(s), ${res.cobrancas_vencidas} vencida(s) expirada(s), ${res.users_atualizados} usuário(s) atualizado(s).`,
      )
      carregarTodosDados()
    } catch (e: any) {
      alert('Erro ao sincronizar ciclos: ' + e.message)
    } finally {
      setSincronizandoCiclo(false)
    }
  }

  const handleAlterarStatusAssinatura = async (userId: string, novoStatus: string) => {
    try {
      await atualizarClienteAdmin(userId, { assinatura_status: novoStatus })
      mostrarMensagem(`Assinatura do cliente atualizada para ${novoStatus}.`)
      carregarTodosDados()
    } catch (e: any) {
      alert('Erro: ' + e.message)
    }
  }

  // Ações de Produtos
  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !editandoProduto?.nome ||
      !editandoProduto.servico_id ||
      editandoProduto.preco === undefined
    ) {
      alert('Preencha os campos obrigatórios.')
      return
    }
    try {
      if (editandoProduto.id && editandoProduto.id.length > 10) {
        await atualizarServicoCatalogo(editandoProduto.id, editandoProduto)
        mostrarMensagem('Produto atualizado no catálogo!')
      } else {
        await criarServicoCatalogo(editandoProduto)
        mostrarMensagem('Novo produto cadastrado no catálogo!')
      }
      setEditandoProduto(null)
      carregarTodosDados()
    } catch (e: any) {
      alert('Erro: ' + e.message)
    }
  }

  const handleExcluirProduto = async (id: string) => {
    if (!confirm('Deseja realmente remover este produto do catálogo?')) return
    try {
      await excluirServicoCatalogo(id)
      mostrarMensagem('Produto removido.')
      carregarTodosDados()
    } catch (e: any) {
      alert('Erro: ' + e.message)
    }
  }

  // Ações de Parceiros
  const handleSalvarParceiro = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !editandoParceiro?.nome ||
      !editandoParceiro.cpf_cnpj ||
      editandoParceiro.percentual_comissao === undefined
    ) {
      alert('Preencha os campos obrigatórios.')
      return
    }
    try {
      if (editandoParceiro.id) {
        await atualizarParceiro(editandoParceiro.id, editandoParceiro)
        mostrarMensagem('Dados do parceiro atualizados!')
      } else {
        const randCode = 'ORB-PAR-' + Math.floor(1000 + Math.random() * 9000)
        await criarParceiro({
          ...editandoParceiro,
          codigo_parceiro: editandoParceiro.codigo_parceiro || randCode,
          status: editandoParceiro.status || 'ativo',
        })
        mostrarMensagem('Novo parceiro cadastrado!')
      }
      setEditandoParceiro(null)
      carregarTodosDados()
    } catch (e: any) {
      alert('Erro: ' + e.message)
    }
  }

  const handleValidarDocumentoFiscalParceiro = async (parceiroId: string, validado: boolean) => {
    try {
      await atualizarParceiro(parceiroId, { documento_fiscal_validado: validado })
      mostrarMensagem(
        validado
          ? 'Documentação fiscal do parceiro homologada com sucesso!'
          : 'Validação fiscal removida.',
      )
      carregarTodosDados()
    } catch (e: any) {
      alert('Erro ao validar documentação fiscal: ' + e.message)
    }
  }

  const handlePagarComissao = async (comissao: ComissaoRecord) => {
    // Regra do Item 3: O botão "Registrar pagamento" SÓ fica habilitado se o parceiro tiver doc fiscal anexada/validada
    const parceiroDaComissao = parceiros.find((p) => p.id === comissao.parceiro_id)
    const docValida = Boolean(
      parceiroDaComissao?.documento_fiscal_validado && parceiroDaComissao?.documento_fiscal_url,
    )

    if (!docValida) {
      alert('Repasse bloqueado: anexe RPA (PF) ou NFS-e (PJ) para liberar o pagamento.')
      return
    }

    const comprovante = prompt(
      'Informe o código ou comprovante de liquidação bancária/PIX:',
      'PIX-CONCILIADO-' + Date.now(),
    )
    if (!comprovante) return
    try {
      await registrarPagamentoComissao(comissao.id, comprovante)
      mostrarMensagem('Comissão marcada como PAGA com comprovação fiscal!')
      carregarTodosDados()
    } catch (e: any) {
      alert('Erro: ' + e.message)
    }
  }

  // Ações de Perito
  // Ações de Cadastro-Mestre de Clientes (Item 5 do CFO)
  const iniciarEdicaoCliente = (cli: any) => {
    setEditandoClienteId(cli.id)
    setClienteForm({
      cnpj: cli.cnpj || '',
      plano_ativo: cli.plano_ativo || '',
      assinatura_status: cli.assinatura_status || 'n/a',
    })
  }

  const salvarEdicaoCliente = async (clienteId: string) => {
    setSalvandoCliente(true)
    try {
      await atualizarClienteAdmin(clienteId, {
        cnpj: clienteForm.cnpj.trim(),
        plano_ativo: clienteForm.plano_ativo.trim(),
        assinatura_status: clienteForm.assinatura_status.trim(),
      })
      mostrarMensagem('Cadastro-mestre do cliente atualizado com sucesso!')
      setEditandoClienteId(null)
      carregarTodosDados()
    } catch (err: any) {
      alert('Erro ao atualizar cadastro-mestre: ' + err.message)
    } finally {
      setSalvandoCliente(false)
    }
  }

  // Concessão / Revogação de papéis: Restrito EXCLUSIVAMENTE ao Gestor Master
  const handleAlternarPapelFinanceiroLeitor = async (cli: any) => {
    if (!isMaster) {
      alert(
        'Acesso negado: Administradores comuns operam o Console mas NÃO podem aprovar acessos, promover ou alterar papéis de ninguém. Ação privativa do Gestor Master na aba Governança.',
      )
      return
    }
    const novoPapel = cli.role === 'financeiro_leitor' ? 'cliente' : 'financeiro_leitor'
    const confirmMsg =
      novoPapel === 'financeiro_leitor'
        ? `Confirmar alteração de papel para 'financeiro_leitor' para ${cli.email}? Trilha de auditoria será gravada com operador Master.`
        : `Confirmar revogação do papel 'financeiro_leitor' de ${cli.email}, retornando-o a 'cliente'?`

    if (!confirm(confirmMsg)) return

    try {
      const { alterarPapelUsuarioMaster } = await import('@/services/adminConsoleService')
      await alterarPapelUsuarioMaster({
        userId: cli.id,
        novoPapel,
        justificativa: 'Alteração rápida de papel financeiro_leitor pelo Gestor Master',
      })
      mostrarMensagem(
        `Papel de ${cli.email} atualizado para '${novoPapel}' pelo Master! Mudança registrada na trilha.`,
      )
      carregarTodosDados()
    } catch (err: any) {
      alert('Erro ao atualizar papel do usuário: ' + err.message)
    }
  }

  // Gestão de status de liberação/suspensão do Parceiro (Requisito 3)
  const [salvandoStatusParceiroId, setSalvandoStatusParceiroId] = useState<string | null>(null)

  const handleAlterarAcessoParceiro = async (cli: any, novoStatus: ParceiroAcessoStatus) => {
    if (!canEditAndRelease) {
      alert(
        'Acesso negado: apenas o gestor financeiro ou administrador possui permissão para liberar/suspender parceiros. Leitores financeiros possuem visualização exclusiva.',
      )
      return
    }
    const statusLabel =
      novoStatus === 'liberado'
        ? 'LIBERAR'
        : novoStatus === 'suspenso'
          ? 'SUSPENDER'
          : 'DEFINIR COMO PENDENTE'

    const confirmMsg = `Deseja ${statusLabel} o acesso financeiro do parceiro ${cli.name || cli.email} (${cli.cliente_codigo})? O evento será registrado no audit_log com quem liberou, quando e para quem.`
    if (!confirm(confirmMsg)) return

    setSalvandoStatusParceiroId(cli.id)
    try {
      const res = await atualizarStatusAcessoParceiro(
        cli.id,
        novoStatus,
        `Alteração de status de acesso realizada no Painel de Clientes por ${user?.name || user?.email}`,
      )
      mostrarMensagem(
        res.mensagem || `Status de acesso do parceiro atualizado para ${novoStatus.toUpperCase()}!`,
      )
      carregarTodosDados()
    } catch (err: any) {
      alert('Erro ao atualizar status de acesso do parceiro: ' + err.message)
    } finally {
      setSalvandoStatusParceiroId(null)
    }
  }

  // Disparo de reset de senha pelo Admin no painel Clientes (Item 1)
  const handleAdminResetSenha = async (cli: any) => {
    if (isReadOnly) return
    if (!cli.email) {
      alert('Usuário não possui e-mail cadastrado.')
      return
    }
    if (
      !confirm(
        `Confirmar envio de link seguro de redefinição de senha para ${cli.email}? O evento será auditado.`,
      )
    ) {
      return
    }

    try {
      await requestPasswordReset(cli.email)
      mostrarMensagem(
        `Link de redefinição de senha enviado para ${cli.email} e evento auditado! (Nenhum token é exposto)`,
      )
    } catch (err: any) {
      alert('Erro ao solicitar redefinição: ' + err.message)
    }
  }

  // Edição inline de validade ART (Item 2)
  const handleSalvarValidadeArt = async (peritoId: string) => {
    if (isReadOnly) return
    if (!novaValidadeArtInput) {
      alert('Informe uma data de validade para a ART.')
      return
    }
    setSalvandoArt(true)
    try {
      await atualizarValidadeArtPerito(peritoId, novaValidadeArtInput)
      mostrarMensagem('Validade da ART atualizada com sucesso e registrada na trilha!')
      setEditandoArtId(null)
      setNovaValidadeArtInput('')
      carregarTodosDados()
    } catch (err: any) {
      alert('Erro ao atualizar validade da ART: ' + err.message)
    } finally {
      setSalvandoArt(false)
    }
  }

  // Reativação formal de perito suspenso (Item 2)
  const handleExecutarReativacaoPerito = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isReadOnly || !modalReativarPerito.perito) return
    if (!modalReativarPerito.motivo || modalReativarPerito.motivo.length < 5) {
      alert('O motivo da reativação é obrigatório (mínimo 5 caracteres).')
      return
    }

    setModalReativarPerito((prev) => ({ ...prev, submetendo: true }))
    try {
      await reativarPeritoSuspenso({
        id: modalReativarPerito.perito.id,
        motivoReativacao: modalReativarPerito.motivo,
        novaValidadeArt: modalReativarPerito.novaValidadeArt || undefined,
        auditorEmail: user?.email || 'contato@orbis-protocol.com',
      })
      mostrarMensagem('Perito reativado com sucesso e status restaurado!')
      setModalReativarPerito({
        aberto: false,
        perito: null,
        motivo: '',
        novaValidadeArt: '',
        submetendo: false,
      })
      carregarTodosDados()
    } catch (err: any) {
      alert('Erro ao reativar perito: ' + err.message)
    } finally {
      setModalReativarPerito((prev) => ({ ...prev, submetendo: false }))
    }
  }

  // Anulação formal de documento DPP (Peça, Lote, Destinação) (Item 2)
  const handleExecutarAnulacaoDpp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isReadOnly || !modalAnulacao.id) return
    if (!modalAnulacao.motivo || modalAnulacao.motivo.length < 10) {
      alert('O motivo da anulação é obrigatório e deve ter no mínimo 10 caracteres.')
      return
    }

    setModalAnulacao((prev) => ({ ...prev, submetendo: true }))
    try {
      const res = await anularDocumentoDpp({
        tipo: modalAnulacao.tipo,
        id: modalAnulacao.id,
        motivo: modalAnulacao.motivo.trim(),
      })
      mostrarMensagem(
        res.mensagem || 'Documento formalmente anulado. Permanece auditável na trilha pública!',
      )
      setModalAnulacao({
        aberto: false,
        tipo: 'lote',
        id: '',
        identificadorVisual: '',
        motivo: '',
        submetendo: false,
      })
      carregarTodosDados()
    } catch (err: any) {
      alert('Erro ao anular documento DPP: ' + err.message)
    } finally {
      setModalAnulacao((prev) => ({ ...prev, submetendo: false }))
    }
  }

  // Retroalimentação defensiva disparada pelo admin on-demand
  const rodarRetroalimentacaoDefensiva = async () => {
    if (!confirm('Deseja rodar a retroalimentação defensiva de cadastro-mestre agora?')) return
    setExecutandoRetroalimentacao(true)
    try {
      let atualizados = 0
      for (const cli of clientes) {
        let mudou = false
        let novoCnpj = cli.cnpj || ''
        let novoStatus = cli.assinatura_status || ''

        // Se CNPJ estiver em branco, procurar em leads
        if (!novoCnpj) {
          const leadMatch = leads.find(
            (l) =>
              (l.usuario && l.usuario === cli.id) ||
              (l.email && l.email.toLowerCase() === (cli.email || '').toLowerCase()),
          )
          if (leadMatch && leadMatch.cnpj) {
            novoCnpj = leadMatch.cnpj
            mudou = true
          }
        }

        // Se ainda sem CNPJ, buscar em cobranças
        if (!novoCnpj) {
          const cobMatch = cobrancas.find(
            (c) =>
              (c.usuario && c.usuario === cli.id) ||
              (c.tomador_email &&
                c.tomador_email.toLowerCase() === (cli.email || '').toLowerCase()),
          )
          if (cobMatch && cobMatch.tomador_cpf_cnpj) {
            novoCnpj = cobMatch.tomador_cpf_cnpj
            mudou = true
          }
        }

        // Se não tiver assinatura_status e não tiver cobranças nem plano
        if (!novoStatus) {
          const temCob = cobrancas.some((c) => c.usuario === cli.id)
          if (!temCob && !cli.plano_ativo) {
            novoStatus = 'n/a'
            mudou = true
          }
        }

        if (mudou) {
          await atualizarClienteAdmin(cli.id, {
            cnpj: novoCnpj,
            ...(novoStatus ? { assinatura_status: novoStatus } : {}),
          })
          atualizados += 1
        }
      }

      mostrarMensagem(
        `Retroalimentação defensiva concluída! ${atualizados} conta(s) enriquecida(s).`,
      )
      carregarTodosDados()
    } catch (e: any) {
      alert('Erro na retroalimentação: ' + e.message)
    } finally {
      setExecutandoRetroalimentacao(false)
    }
  }

  const handleJulgarPerito = async (id: string, status: 'aprovado' | 'rejeitado') => {
    const obs =
      obsPerito[id] ||
      (status === 'aprovado'
        ? 'Homologado pelo Auditor Orbis Protocol'
        : 'Documentação inconsistente')
    try {
      await julgarCredenciamentoPerito({
        id,
        status,
        observacao_auditor: obs,
      })
      mostrarMensagem(`Credenciamento pericial ${status}!`)
      carregarTodosDados()
    } catch (e: any) {
      alert('Erro: ' + e.message)
    }
  }

  const abas: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'receita', label: '1. Receita & Cobranças', icon: DollarSign },
    { id: 'radar_semanal', label: 'Radar Semanal (Assinantes & Digest)', icon: Compass },
    { id: 'clientes', label: '2. Clientes', icon: Users },
    { id: 'uso', label: '3. Uso da Plataforma', icon: Activity },
    { id: 'custos', label: '4. Custos Operacionais', icon: TrendingUp },
    { id: 'produtos', label: '5. Produtos & Preços', icon: ShoppingBag },
    { id: 'assinaturas', label: '6. Assinaturas', icon: CreditCard },
    { id: 'comissoes', label: '7. Comissões & Parceiros', icon: Percent },
    { id: 'peritos', label: '8. Rede Pericial & Conselhos', icon: Award },
    { id: 'auditoria', label: '9. Auditoria & Trilha Imutável', icon: ShieldCheck },
    {
      id: 'lastro_conformidade',
      label: '10. Lastro Circularidade (Dec. 11.413)',
      icon: FileCheck2,
    },
    { id: 'ccrlr_sinir', label: '11. CCRLR & Interoperabilidade SINIR', icon: Layers },
    { id: 'dmrv_todas_empresas', label: '12. dMRV Emissões Evitadas (SBCE)', icon: Leaf },
    { id: 'configuracoes', label: '13. Governança & MOVER', icon: SlidersHorizontal },
    ...(isMaster
      ? [
          {
            id: 'governanca' as AdminTab,
            label: '14. Governança Master (Acessos & Papéis)',
            icon: ShieldAlert,
          },
          {
            id: 'parametros_negocio' as AdminTab,
            label: '15. Parâmetros do Negócio',
            icon: SlidersHorizontal,
          },
        ]
      : []),
  ]

  const cobrancasFiltradas = cobrancas.filter((c) => {
    if (cobrancaFiltro === 'todos') return true
    return c.status === cobrancaFiltro
  })

  return (
    <div className="min-h-screen py-10 bg-slate-50 dark:bg-[#0A0E12] text-slate-900 dark:text-[#F4F7FA] transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Header Admin */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200 dark:border-[rgba(244,247,250,0.1)]">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-[#12B886]/10 text-emerald-800 dark:text-[#12B886] border border-emerald-300 dark:border-[#12B886]/30 text-[10px] font-mono uppercase font-bold tracking-wider">
                CONSOLE DE GESTÃO ESTRATÉGICA • CONTROLES INTERNOS
              </span>
              <span className="text-[11px] text-slate-500 dark:text-[#93A3B5] font-mono">
                Role: {user?.role || 'admin'}
              </span>
              {/* Badge fixo de Acesso Somente Visualização para papel financeiro_leitor */}
              {isReadOnly && (
                <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-[#D9B36C]/20 text-amber-800 dark:text-[#D9B36C] border border-amber-300 dark:border-[#D9B36C]/50 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700 dark:text-[#D9B36C]" />
                  <span>Acesso somente visualização</span>
                </span>
              )}
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-[#F4F7FA] tracking-wide">
              ADMINISTRAÇÃO ORBIS PROTOCOL
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] mt-1">
              Governança centralizada de faturamento, clientes mestres, consumo de APIs, parceiros,
              rede pericial e trilha de auditoria append-only.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={carregarTodosDados}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-600 dark:text-[#93A3B5] hover:text-slate-900 dark:hover:text-[#F4F7FA] hover:border-[#12B886] transition-colors shadow-sm"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#12B886]' : ''}`}
              />
              <span>Atualizar Dados</span>
            </button>
            <Link
              to="/painel"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#16202B] border border-emerald-300 dark:border-[#12B886]/40 text-xs font-semibold text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors shadow-sm"
            >
              <span>Painel do Cliente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Mensagem de Feedback */}
        {mensagemSucesso && (
          <div className="mb-6 p-4 rounded-xl bg-[#12B886]/10 border border-[#12B886] text-xs text-[#12B886] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{mensagemSucesso}</span>
            </div>
            <button
              onClick={() => setMensagemSucesso('')}
              className="text-[#12B886] text-xs underline"
            >
              fechar
            </button>
          </div>
        )}

        {/* Top Cards Resumo Geral */}
        {kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-sm">
              <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase block">
                Receita Faturada
              </span>
              <span className="font-heading font-black text-xl text-[#12B886]">
                R$ {kpis.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
                {kpis.cobrancasPagas} cobranças pagas
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-sm">
              <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase block">
                Cobranças Pendentes
              </span>
              <span className="font-heading font-black text-xl text-amber-700 dark:text-[#D9B36C]">
                {kpis.cobrancasPendentes}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
                aguardando PIX
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-sm">
              <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase block">
                Clientes Mestres
              </span>
              <span className="font-heading font-black text-xl text-slate-900 dark:text-[#F4F7FA]">
                {kpis.totalClientes}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
                {kpis.totalLeads} no funil
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-sm">
              <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase block">
                Consultas DPP / Lotes
              </span>
              <span className="font-heading font-black text-xl text-blue-600 dark:text-[#3B82F6]">
                {kpis.totalConsultasDpp}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
                {kpis.totalLotesCdv} lotes CDV
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-sm">
              <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase block">
                Comissões a Pagar
              </span>
              <span className="font-heading font-black text-xl text-amber-700 dark:text-[#D9B36C]">
                R$ {kpis.comissoesPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
                {kpis.totalParceiros} parceiros ativos
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-sm">
              <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase block">
                Fila Rede Pericial
              </span>
              <span className="font-heading font-black text-xl text-[#12B886]">
                {kpis.peritosPendentes}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
                {kpis.peritosAprovados} homologados
              </span>
            </div>
          </div>
        )}

        {/* Menu de Abas (Mobile: scroll horizontal) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] no-scrollbar">
          {abas.map((aba) => {
            const Icon = aba.icon
            const active = activeTab === aba.id
            return (
              <button
                key={aba.id}
                onClick={() => setActiveTab(aba.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#12B886] text-[#0A0E12] shadow-emerald-glow'
                    : 'bg-white dark:bg-[#111820] text-slate-600 dark:text-[#93A3B5] hover:text-slate-900 dark:hover:text-[#F4F7FA] hover:bg-slate-100 dark:hover:bg-[#16202B] border border-slate-200 dark:border-[rgba(244,247,250,0.06)] shadow-sm'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{aba.label}</span>
              </button>
            )
          })}
        </div>

        {/* CONTEÚDO DOS 8 PAINÉIS */}

        {/* RADAR SEMANAL: GESTÃO DE ASSINANTES, EDIÇÕES E DISPARO DE DIGEST */}
        {activeTab === 'radar_semanal' && (
          <div className="space-y-6">
            <ConsoleRadarSemanalTab />
          </div>
        )}

        {/* 1. RECEITA & COBRANÇAS */}
        {activeTab === 'receita' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  Gestão de Receitas & Cobranças PIX
                </h2>
                <p className="text-xs text-[#93A3B5]">
                  Visualização detalhada de TXIDs, QRs, NFS-e e liquidação manual de transações.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#93A3B5]" />
                <select
                  value={cobrancaFiltro}
                  onChange={(e) => setCobrancaFiltro(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] focus:outline-none"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="pago">Pagas</option>
                  <option value="pendente">Pendentes</option>
                  <option value="pendente_simulacao">Pendentes (Simulação)</option>
                  <option value="cancelado">Canceladas</option>
                </select>
              </div>
            </div>

            {/* Tabela de Cobranças (Mobile: Cartões) */}
            <div className="hidden md:block rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D1217] text-[#93A3B5] uppercase text-[10px] border-b border-[rgba(244,247,250,0.08)]">
                  <tr>
                    <th className="p-3.5">Tomador & CNPJ</th>
                    <th className="p-3.5">Serviço</th>
                    <th className="p-3.5">Valor</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">TXID / Indicação</th>
                    <th className="p-3.5">NFS-e</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(244,247,250,0.05)]">
                  {cobrancasFiltradas.map((c) => (
                    <tr key={c.id} className="hover:bg-[#16202B]/50 transition-colors">
                      <td className="p-3.5">
                        <strong className="text-[#F4F7FA] block">{c.tomador_nome}</strong>
                        <span className="text-[#93A3B5] font-mono text-[11px]">
                          {c.tomador_cpf_cnpj}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[#D9B36C] font-semibold">{c.servico_nome}</span>
                      </td>
                      <td className="p-3.5 font-bold font-heading text-sm text-[#12B886]">
                        R$ {Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            c.status === 'pago'
                              ? 'bg-[#12B886]/20 text-[#12B886]'
                              : 'bg-[#D9B36C]/20 text-[#D9B36C]'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-[10px] text-[#93A3B5] block truncate max-w-[140px]">
                          {c.txid}
                        </span>
                        {c.codigo_indicacao && (
                          <span className="text-[10px] text-[#3B82F6] font-mono block">
                            Ref: {c.codigo_indicacao}
                          </span>
                        )}
                        {(c.divergencia_preco || c.origem_preco === 'contingencia') && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#D9B36C]/20 text-[#D9B36C] border border-[#D9B36C]/40 mt-0.5">
                            Contingência / Divergente
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {c.nfse_numero ? (
                          <div className="text-[10px] text-[#12B886]">
                            <span>Nº {c.nfse_numero}</span>
                            <span className="block text-[9px] text-[#93A3B5] font-mono">
                              {c.nfse_verificacao}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#93A3B5]">
                            {c.nfse_status || 'Pendente'}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {c.status !== 'pago' && !isReadOnly && (
                          <button
                            onClick={() => handleConfirmarPagamento(c)}
                            className="px-2.5 py-1 rounded bg-[#12B886]/20 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] font-semibold text-[11px] transition-colors"
                          >
                            Marcar Pago
                          </button>
                        )}
                        {c.status !== 'pago' && isReadOnly && (
                          <span className="text-[11px] text-[#93A3B5]/50 italic pr-1">
                            Somente leitura
                          </span>
                        )}
                        <button
                          onClick={() => setCobrancaDetalheAuditoria(c)}
                          className="px-2.5 py-1 rounded bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#D9B36C] hover:text-[#F4F7FA] text-[11px]"
                          title="Ver Trilha de Auditoria e Liquidação"
                        >
                          Auditoria
                        </button>
                        {!isReadOnly && (
                          <button
                            onClick={() => handleEmitirNfseAdmin(c.id)}
                            className="px-2.5 py-1 rounded bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#93A3B5] hover:text-[#F4F7FA] text-[11px]"
                          >
                            NFS-e
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {cobrancasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-xs text-[#93A3B5]">
                        Nenhuma cobrança registrada neste filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Versão Mobile em Cartões */}
            <div className="md:hidden space-y-3">
              {cobrancasFiltradas.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-[#F4F7FA]">{c.tomador_nome}</strong>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === 'pago'
                          ? 'bg-[#12B886]/20 text-[#12B886]'
                          : 'bg-[#D9B36C]/20 text-[#D9B36C]'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#93A3B5] font-mono">{c.tomador_cpf_cnpj}</div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#D9B36C] font-semibold">{c.servico_nome}</span>
                    <span className="font-heading font-black text-sm text-[#12B886]">
                      R$ {Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#93A3B5] font-mono break-all">
                    TXID: {c.txid}
                  </div>
                  {(c.divergencia_preco || c.origem_preco === 'contingencia') && (
                    <div className="text-[10px] text-[#D9B36C] font-bold">
                      ⚠ Origem Contingência / Divergência de Preço
                    </div>
                  )}
                  {c.codigo_indicacao && (
                    <div className="text-[10px] text-[#3B82F6] font-mono">
                      Ref Parceiro: {c.codigo_indicacao}
                    </div>
                  )}
                  {c.nfse_numero && (
                    <div className="text-[10px] text-[#12B886]">
                      NFS-e: {c.nfse_numero} (Cód: {c.nfse_verificacao})
                    </div>
                  )}
                  <div className="pt-2 flex gap-2">
                    {c.status !== 'pago' && !isReadOnly && (
                      <button
                        onClick={() => handleConfirmarPagamento(c)}
                        className="flex-1 py-1.5 rounded bg-[#12B886] text-[#0A0E12] font-bold text-center text-xs"
                      >
                        Confirmar Pagamento
                      </button>
                    )}
                    <button
                      onClick={() => setCobrancaDetalheAuditoria(c)}
                      className="px-3 py-1.5 rounded bg-[#16202B] border border-[rgba(244,247,250,0.2)] text-xs text-[#D9B36C]"
                    >
                      Auditoria
                    </button>
                    {!isReadOnly && (
                      <button
                        onClick={() => handleEmitirNfseAdmin(c.id)}
                        className="px-3 py-1.5 rounded bg-[#16202B] border border-[rgba(244,247,250,0.2)] text-xs text-[#93A3B5]"
                      >
                        NFS-e
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. CLIENTES (CADASTRO-MESTRE) */}
        {activeTab === 'clientes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  Base Cadastral de Clientes & Cadastro-Mestre
                </h2>
                <p className="text-xs text-[#93A3B5]">
                  Gestão das contas com permissão cliente, integridade cadastral e leads gerados a
                  partir do Diagnóstico SBCE.
                </p>
              </div>

              <button
                type="button"
                onClick={rodarRetroalimentacaoDefensiva}
                disabled={executandoRetroalimentacao || isReadOnly}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111820] border border-[#12B886]/50 text-xs text-[#12B886] font-semibold hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors disabled:opacity-40"
                title="Cruza dados de leads e cobranças para preencher CNPJ e status n/a automaticamente"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${executandoRetroalimentacao ? 'animate-spin' : ''}`}
                />
                <span>
                  {executandoRetroalimentacao
                    ? 'Retroalimentando...'
                    : 'Rodar Retroalimentação Defensiva'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de Contas de Usuários Clientes (2 Cols) */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-[#12B886] uppercase tracking-wider">
                    Contas de Usuários Cadastrados ({clientes.length})
                  </h3>
                  <span className="text-[11px] text-[#93A3B5]">
                    {
                      clientes.filter(
                        (c) =>
                          !c.cnpj ||
                          !c.plano_ativo ||
                          !c.assinatura_status ||
                          c.assinatura_status === 'n/a',
                      ).length
                    }{' '}
                    contas incompletas
                  </span>
                </div>

                <div className="space-y-3">
                  {clientes.map((cli) => {
                    const isIncompleto =
                      !cli.cnpj ||
                      !cli.plano_ativo ||
                      !cli.assinatura_status ||
                      cli.assinatura_status === 'n/a'
                    const estaEditando = editandoClienteId === cli.id

                    return (
                      <div
                        key={cli.id}
                        className={`p-4 rounded-xl bg-[#111820] border transition-all ${
                          isIncompleto
                            ? 'border-[#D9B36C]/40 hover:border-[#D9B36C]'
                            : 'border-[rgba(244,247,250,0.1)]'
                        } space-y-3 text-xs`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-[#F4F7FA] font-medium text-sm">
                              {cli.name || cli.email}
                            </strong>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30">
                              {cli.cliente_codigo ||
                                (cli.role === 'parceiro' ? 'ORB-PAR-NOVO' : 'ORB-CLI-NOVO')}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-[#D9B36C] bg-[#D9B36C]/10 px-2 py-0.5 rounded">
                              {cli.role}
                            </span>
                            {/* Destaque Status de Parceiro */}
                            {cli.role === 'parceiro' && (
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                                  cli.parceiro_acesso_status === 'liberado'
                                    ? 'bg-[#12B886]/20 border-[#12B886] text-[#12B886]'
                                    : cli.parceiro_acesso_status === 'suspenso'
                                      ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444]'
                                      : 'bg-[#D9B36C]/20 border-[#D9B36C] text-[#D9B36C]'
                                }`}
                              >
                                Parceiro:{' '}
                                {cli.parceiro_acesso_status === 'liberado'
                                  ? 'Liberado'
                                  : cli.parceiro_acesso_status === 'suspenso'
                                    ? 'Suspenso'
                                    : 'Pendente'}
                              </span>
                            )}
                            {/* Destaque Cadastro Incompleto (Item 5 do CFO) */}
                            {isIncompleto && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Cadastro incompleto
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                cli.assinatura_status === 'ativa'
                                  ? 'bg-[#12B886]/20 text-[#12B886]'
                                  : cli.assinatura_status === 'inadimplente'
                                    ? 'bg-[#EF4444]/20 text-[#EF4444]'
                                    : 'bg-[#93A3B5]/20 text-[#93A3B5]'
                              }`}
                            >
                              {cli.assinatura_status || 'sem assinatura'}
                            </span>

                            {/* Ações por Usuário: Reset de Senha, Papel financeiro_leitor, Editar Cadastro */}
                            {!isReadOnly && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleAdminResetSenha(cli)}
                                  className="px-2 py-1 rounded bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#93A3B5] hover:text-[#F4F7FA] hover:border-[#12B886] text-[11px] transition-colors"
                                  title="Envia link seguro de redefinição de senha para o e-mail do usuário e registra em audit_log"
                                >
                                  Enviar link de redefinição
                                </button>

                                {/* Concessão de papéis visível somente ao Master (Regra 2) */}
                                {isMaster && (
                                  <button
                                    type="button"
                                    onClick={() => handleAlternarPapelFinanceiroLeitor(cli)}
                                    className={`px-2 py-1 rounded border text-[11px] font-medium transition-colors ${
                                      cli.role === 'financeiro_leitor'
                                        ? 'bg-[#D9B36C]/20 border-[#D9B36C] text-[#D9B36C] hover:bg-[#D9B36C]/30'
                                        : 'bg-[#16202B] border-[rgba(244,247,250,0.15)] text-[#93A3B5] hover:text-[#D9B36C]'
                                    }`}
                                    title="Exclusivo Master: Conceder ou revogar papel financeiro_leitor"
                                  >
                                    {cli.role === 'financeiro_leitor'
                                      ? 'Revogar Financeiro Leitor'
                                      : 'Tornar Financeiro Leitor'}
                                  </button>
                                )}

                                {!estaEditando && (
                                  <button
                                    type="button"
                                    onClick={() => iniciarEdicaoCliente(cli)}
                                    className="px-2.5 py-1 rounded bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] font-semibold text-[11px] transition-colors"
                                  >
                                    Editar Cadastro
                                  </button>
                                )}

                                {/* Ações de Liberação/Suspensão exclusiva para Parceiro (Requisito 3) */}
                                {cli.role === 'parceiro' && (
                                  <div className="flex items-center gap-1 pl-1 border-l border-[rgba(244,247,250,0.15)]">
                                    {cli.parceiro_acesso_status !== 'liberado' && (
                                      <button
                                        type="button"
                                        disabled={salvandoStatusParceiroId === cli.id}
                                        onClick={() => handleAlterarAcessoParceiro(cli, 'liberado')}
                                        className="px-2 py-1 rounded bg-[#12B886] text-[#0A0E12] hover:bg-[#12B886]/90 font-bold text-[11px] transition-colors shadow-sm"
                                        title="Liberar acesso do parceiro ao painel financeiro (grava audit_log)"
                                      >
                                        {salvandoStatusParceiroId === cli.id
                                          ? 'Gravando...'
                                          : 'Liberar Acesso'}
                                      </button>
                                    )}
                                    {cli.parceiro_acesso_status !== 'suspenso' && (
                                      <button
                                        type="button"
                                        disabled={salvandoStatusParceiroId === cli.id}
                                        onClick={() => handleAlterarAcessoParceiro(cli, 'suspenso')}
                                        className="px-2 py-1 rounded bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] hover:bg-[#EF4444]/30 font-semibold text-[11px] transition-colors"
                                        title="Suspender acesso do parceiro ao painel financeiro (grava audit_log)"
                                      >
                                        Suspender
                                      </button>
                                    )}
                                    {cli.parceiro_acesso_status !== 'pendente' && (
                                      <button
                                        type="button"
                                        disabled={salvandoStatusParceiroId === cli.id}
                                        onClick={() => handleAlterarAcessoParceiro(cli, 'pendente')}
                                        className="px-2 py-1 rounded bg-[#D9B36C]/20 border border-[#D9B36C]/40 text-[#D9B36C] hover:bg-[#D9B36C]/30 text-[11px] transition-colors"
                                        title="Retornar acesso para pendente de homologação"
                                      >
                                        Pendente
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            {isReadOnly && (
                              <span className="text-[11px] text-[#93A3B5]/50 italic">
                                Modo Leitura
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Visualização Padrão */}
                        {!estaEditando ? (
                          <div className="text-[11px] text-[#93A3B5] flex flex-wrap gap-x-4 gap-y-1 bg-[#0A0E12] p-2.5 rounded-lg border border-[rgba(244,247,250,0.06)]">
                            <span>
                              Email:{' '}
                              <strong className="text-[#F4F7FA] font-normal">{cli.email}</strong>
                            </span>
                            <span>
                              CNPJ:{' '}
                              <strong
                                className={`font-mono ${
                                  cli.cnpj ? 'text-[#F4F7FA]' : 'text-[#EF4444]'
                                }`}
                              >
                                {cli.cnpj || 'Em branco'}
                              </strong>
                            </span>
                            <span>
                              Plano Ativo:{' '}
                              <strong
                                className={cli.plano_ativo ? 'text-[#12B886]' : 'text-[#EF4444]'}
                              >
                                {cli.plano_ativo || 'Em branco'}
                              </strong>
                            </span>
                            <span>
                              Status Assinatura:{' '}
                              <strong
                                className={
                                  cli.assinatura_status === 'inadimplente'
                                    ? 'text-[#EF4444]'
                                    : cli.assinatura_status === 'n/a'
                                      ? 'text-[#D9B36C]'
                                      : 'text-[#12B886]'
                                }
                              >
                                {cli.assinatura_status || 'Em branco'}
                              </strong>
                            </span>
                            {cli.assinatura_renovacao && (
                              <span>
                                Renovação:{' '}
                                <strong className="text-[#D9B36C]">
                                  {cli.assinatura_renovacao}
                                </strong>
                              </span>
                            )}
                          </div>
                        ) : (
                          /* Formulário de Edição Inline do Cadastro-Mestre */
                          <div className="p-3.5 rounded-xl bg-[#0A0E12] border-2 border-[#12B886] space-y-3 animate-fade-in">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#12B886] block">
                              Edição Inline do Cadastro-Mestre (users)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-[#93A3B5] mb-1">
                                  CNPJ *
                                </label>
                                <input
                                  type="text"
                                  placeholder="00.000.000/0000-00"
                                  value={clienteForm.cnpj}
                                  onChange={(e) =>
                                    setClienteForm({ ...clienteForm, cnpj: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-[#93A3B5] mb-1">
                                  Plano Ativo
                                </label>
                                <select
                                  value={clienteForm.plano_ativo}
                                  onChange={(e) =>
                                    setClienteForm({ ...clienteForm, plano_ativo: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA]"
                                >
                                  <option value="">(Em branco)</option>
                                  <option value="diagnostico">diagnostico</option>
                                  <option value="laudo_pericial">laudo_pericial</option>
                                  <option value="assinatura_bureau">assinatura_bureau</option>
                                  <option value="corporativo">corporativo</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-[#93A3B5] mb-1">
                                  Status Assinatura
                                </label>
                                <select
                                  value={clienteForm.assinatura_status}
                                  onChange={(e) =>
                                    setClienteForm({
                                      ...clienteForm,
                                      assinatura_status: e.target.value,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA]"
                                >
                                  <option value="n/a">n/a (sem relação de assinatura)</option>
                                  <option value="ativa">ativa</option>
                                  <option value="inadimplente">inadimplente</option>
                                  <option value="cancelada">cancelada</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditandoClienteId(null)}
                                className="px-3 py-1 rounded-lg bg-[#16202B] text-xs text-[#93A3B5]"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                disabled={salvandoCliente}
                                onClick={() => salvarEdicaoCliente(cli.id)}
                                className="px-4 py-1 rounded-lg bg-[#12B886] text-[#0A0E12] font-bold text-xs"
                              >
                                {salvandoCliente ? 'Salvando...' : 'Salvar Alterações'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              {/* Pipeline de Leads (1 Col) */}
              <div className="space-y-3">
                <h3 className="font-heading font-bold text-sm text-[#D9B36C] uppercase tracking-wider">
                  Pipeline de Leads ({leads.length})
                </h3>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {leads.map((ld) => (
                    <div
                      key={ld.id}
                      className="p-3.5 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.08)] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-[#F4F7FA] truncate max-w-[180px]">
                          {ld.razao_social}
                        </strong>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#3B82F6]/20 text-[#3B82F6]">
                          {ld.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#93A3B5] font-mono">{ld.cnpj}</div>
                      <div className="text-[10px] text-[#D9B36C]">
                        Origem: {ld.origem || 'funil'} • {ld.conselho || 'Sem conselho'}
                      </div>
                      <div className="text-[10px] text-[#93A3B5] truncate">
                        Resp: {ld.responsavel || ld.email}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. USO DA PLATAFORMA */}
        {activeTab === 'uso' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                Uso & Consumo da Plataforma Orbis
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Monitoramento de consultas aos DPPs (Passaportes de Peças), lotes CDV ingeridos e
                revisões periciais dMRV.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Consultas DPP */}
              <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#12B886]">
                    Consultas DPP ({dpps.length})
                  </span>
                  <QrCode className="w-4 h-4 text-[#12B886]" />
                </div>
                <p className="text-[11px] text-[#93A3B5]">
                  Acessos públicos a selos e passaportes via QR/Web.
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {dpps.slice(0, 15).map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[#D9B36C] truncate max-w-[170px]">
                          {d.alvo_identificador}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-[#12B886]">
                          {d.canal}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#93A3B5]">
                        Hash conferido: {d.hash_conferido ? 'Sim' : 'Não'} •{' '}
                        {new Date(d.created).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ))}
                  {dpps.length === 0 && (
                    <span className="text-xs text-[#93A3B5]">Nenhuma consulta registrada.</span>
                  )}
                </div>
              </div>

              {/* Lotes CDV */}
              <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#3B82F6]">
                    Lotes CDV Ingeridos ({lotes.length})
                  </span>
                  <Layers className="w-4 h-4 text-[#3B82F6]" />
                </div>
                <p className="text-[11px] text-[#93A3B5]">
                  Veículos desmontados com balanço de massa e controle de anulação.
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {lotes.map((lt) => (
                    <div
                      key={lt.id}
                      className={`p-2.5 rounded-lg bg-[#0A0E12] border text-[11px] space-y-1 ${
                        lt.status === 'anulado'
                          ? 'border-[#EF4444]/40 bg-[#EF4444]/5'
                          : 'border-[rgba(244,247,250,0.06)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-[#F4F7FA] truncate max-w-[160px]">
                          {lt.veiculo_marca_modelo}
                        </strong>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            lt.status === 'anulado'
                              ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                              : 'text-[#3B82F6] bg-[#3B82F6]/10'
                          }`}
                        >
                          {lt.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#93A3B5] font-mono">
                        {lt.cdv_nome} • Lote: {lt.numero_lote || lt.id}
                      </div>
                      <div className="text-[10px] text-[#12B886]">
                        {lt.total_pecas} peças • {lt.total_co2e_evitado_kg} kg CO2e evitado
                      </div>

                      {lt.status === 'anulado' ? (
                        <div className="text-[9px] text-[#EF4444] pt-0.5">
                          Anulado em{' '}
                          {new Date(lt.anulado_em || lt.updated).toLocaleDateString('pt-BR')}:{' '}
                          {lt.motivo_anulacao}
                        </div>
                      ) : (
                        !isReadOnly && (
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setModalAnulacao({
                                  aberto: true,
                                  tipo: 'lote',
                                  id: lt.id,
                                  identificadorVisual: `Lote ${lt.numero_lote || lt.id} (${lt.veiculo_marca_modelo})`,
                                  motivo: '',
                                  submetendo: false,
                                })
                              }
                              className="px-2 py-0.5 rounded bg-[#EF4444]/15 hover:bg-[#EF4444]/30 text-[#EF4444] text-[10px] font-semibold border border-[#EF4444]/30 transition-colors"
                            >
                              Anular documento
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                  {lotes.length === 0 && (
                    <span className="text-xs text-[#93A3B5]">Nenhum lote registrado.</span>
                  )}
                </div>
              </div>

              {/* Revisões Periciais */}
              <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#D9B36C]">
                    Revisões Periciais ({revisoes.length})
                  </span>
                  <Award className="w-4 h-4 text-[#D9B36C]" />
                </div>
                <p className="text-[11px] text-[#93A3B5]">
                  Triagens de conformidade dMRV geradas pelo Revisor Pericial.
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {revisoes.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-[#F4F7FA]">{rev.empresa_nome}</strong>
                        <span className="text-[10px] font-bold text-[#12B886]">
                          {rev.score_pericial}/100
                        </span>
                      </div>
                      <div className="text-[10px] text-[#93A3B5]">
                        Grau: <strong className="text-[#D9B36C]">{rev.grau_conformidade}</strong> •
                        Achados: {rev.achados_total}
                      </div>
                      <div className="text-[10px] text-[#93A3B5] truncate">
                        Plano rec: {rev.plano_recomendado}
                      </div>
                    </div>
                  ))}
                  {revisoes.length === 0 && (
                    <span className="text-xs text-[#93A3B5]">
                      Nenhuma revisão pericial registrada.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Subseções Adicionais de Lote / Peça / Destinação com Anulação */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              {/* Peças CDV Ingeridas */}
              <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#F4F7FA]">
                      Peças CDV / Passaportes Rastreados ({pecasCdv.length})
                    </h3>
                    <p className="text-[11px] text-[#93A3B5]">
                      Passaportes unitários de componentes automotivos (cdv_pecas).
                    </p>
                  </div>
                  <Layers className="w-4 h-4 text-[#12B886]" />
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {pecasCdv.map((peca) => (
                    <div
                      key={peca.id}
                      className={`p-2.5 rounded-lg bg-[#0A0E12] border text-xs space-y-1 ${
                        peca.status === 'anulado'
                          ? 'border-[#EF4444]/40 bg-[#EF4444]/5'
                          : 'border-[rgba(244,247,250,0.06)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-[#F4F7FA]">
                          {peca.descricao || peca.codigo_peca}
                        </strong>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            peca.status === 'anulado'
                              ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                              : 'text-[#12B886] bg-[#12B886]/10'
                          }`}
                        >
                          {peca.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#93A3B5] font-mono">
                        Cód: {peca.codigo_peca} • Material:{' '}
                        {peca.material_predominante || 'Diversos'}
                      </div>
                      {peca.hash_canonical && (
                        <div className="text-[9px] text-[#93A3B5]/70 font-mono truncate">
                          Hash: {peca.hash_canonical}
                        </div>
                      )}

                      {peca.status === 'anulado' ? (
                        <div className="text-[9px] text-[#EF4444] pt-0.5">
                          Anulado em{' '}
                          {new Date(peca.anulado_em || peca.updated).toLocaleDateString('pt-BR')}:{' '}
                          {peca.motivo_anulacao}
                        </div>
                      ) : (
                        !isReadOnly && (
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setModalAnulacao({
                                  aberto: true,
                                  tipo: 'peca',
                                  id: peca.id,
                                  identificadorVisual: `Peça ${peca.codigo_peca} (${peca.descricao || 'Componente'})`,
                                  motivo: '',
                                  submetendo: false,
                                })
                              }
                              className="px-2 py-0.5 rounded bg-[#EF4444]/15 hover:bg-[#EF4444]/30 text-[#EF4444] text-[10px] font-semibold border border-[#EF4444]/30 transition-colors"
                            >
                              Anular documento
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                  {pecasCdv.length === 0 && (
                    <span className="text-xs text-[#93A3B5]">Nenhuma peça CDV cadastrada.</span>
                  )}
                </div>
              </div>

              {/* Destinações Finais DPP */}
              <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#F4F7FA]">
                      Destinações Finais DPP ({destinacoesFinais.length})
                    </h3>
                    <p className="text-[11px] text-[#93A3B5]">
                      Manifestos de destinação final sustentável e reciclagem
                      (dpp_destinacao_final).
                    </p>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-[#D9B36C]" />
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {destinacoesFinais.map((dest) => (
                    <div
                      key={dest.id}
                      className={`p-2.5 rounded-lg bg-[#0A0E12] border text-xs space-y-1 ${
                        dest.status === 'anulado'
                          ? 'border-[#EF4444]/40 bg-[#EF4444]/5'
                          : 'border-[rgba(244,247,250,0.06)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-[#F4F7FA]">
                          {dest.operador_destinacao || dest.tipo_residuo || 'Destinação Final'}
                        </strong>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            dest.status === 'anulado'
                              ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                              : 'text-[#D9B36C] bg-[#D9B36C]/10'
                          }`}
                        >
                          {dest.status || 'ativo'}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#93A3B5] font-mono">
                        Manifesto: {dest.numero_manifesto_mtr || dest.id} • Peso:{' '}
                        {dest.peso_total_kg || 0} kg
                      </div>
                      {dest.hash_canonical && (
                        <div className="text-[9px] text-[#93A3B5]/70 font-mono truncate">
                          Hash: {dest.hash_canonical}
                        </div>
                      )}

                      {dest.status === 'anulado' ? (
                        <div className="text-[9px] text-[#EF4444] pt-0.5">
                          Anulado em{' '}
                          {new Date(dest.anulado_em || dest.updated).toLocaleDateString('pt-BR')}:{' '}
                          {dest.motivo_anulacao}
                        </div>
                      ) : (
                        !isReadOnly && (
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setModalAnulacao({
                                  aberto: true,
                                  tipo: 'destinacao',
                                  id: dest.id,
                                  identificadorVisual: `Destinação ${dest.numero_manifesto_mtr || dest.id}`,
                                  motivo: '',
                                  submetendo: false,
                                })
                              }
                              className="px-2 py-0.5 rounded bg-[#EF4444]/15 hover:bg-[#EF4444]/30 text-[#EF4444] text-[10px] font-semibold border border-[#EF4444]/30 transition-colors"
                            >
                              Anular documento
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                  {destinacoesFinais.length === 0 && (
                    <span className="text-xs text-[#93A3B5]">Nenhuma destinação registrada.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CUSTOS OPERACIONAIS */}
        {activeTab === 'custos' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                Custos Operacionais & Margem
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Consumo de créditos de API (InfoSimples, consultas fiscais de NF-e) e cálculo de
                margem operacional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)]">
                <span className="text-xs text-[#93A3B5] uppercase block">
                  Total Consultas InfoSimples
                </span>
                <span className="font-heading font-black text-2xl text-[#F4F7FA]">
                  {consultasInfosimples.length}
                </span>
                <span className="text-[11px] text-[#93A3B5] block mt-1">
                  varreduras automáticas de NF-e
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)]">
                <span className="text-xs text-[#93A3B5] uppercase block">
                  Custo Total de Créditos
                </span>
                <span className="font-heading font-black text-2xl text-[#F03E54]">
                  {consultasInfosimples.reduce(
                    (acc, cur) => acc + (Number(cur.custo_creditos) || 0),
                    0,
                  )}{' '}
                  créditos
                </span>
                <span className="text-[11px] text-[#93A3B5] block mt-1">
                  consumidos junto ao provedor
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)]">
                <span className="text-xs text-[#93A3B5] uppercase block">
                  Margem Bruta Estimada
                </span>
                <span className="font-heading font-black text-2xl text-[#12B886]">94.2%</span>
                <span className="text-[11px] text-[#93A3B5] block mt-1">
                  receita direta vs infraestrutura de APIs
                </span>
              </div>
            </div>

            {/* Tabela de Consultas InfoSimples */}
            <div className="rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] overflow-hidden">
              <div className="p-4 border-b border-[rgba(244,247,250,0.08)]">
                <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#93A3B5]">
                  Histórico Recente de Consultas InfoSimples
                </h3>
              </div>
              <div className="divide-y divide-[rgba(244,247,250,0.05)] text-xs">
                {consultasInfosimples.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#D9B36C]">{c.chave_acesso}</span>
                        <span className="text-[9px] uppercase font-bold text-[#12B886] bg-[#12B886]/10 px-2 py-0.5 rounded">
                          {c.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#93A3B5]">
                        Retorno: {c.mensagem_retorno || 'Operação realizada com sucesso'} •{' '}
                        {new Date(c.created).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[#F03E54] font-mono font-bold">
                        {c.custo_creditos || 1} créditos
                      </span>
                      <span className="text-[10px] text-[#93A3B5] block">
                        Certificado A1: {c.usou_certificado_a1 ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  </div>
                ))}
                {consultasInfosimples.length === 0 && (
                  <div className="p-6 text-center text-xs text-[#93A3B5]">
                    Nenhuma consulta registrada ainda.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. PRODUTOS & PREÇOS (CRUD DO CATÁLOGO) */}
        {activeTab === 'produtos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  Catálogo Oficial de Produtos & Preços
                </h2>
                <p className="text-xs text-[#93A3B5]">
                  Controle da coleção servicos_catalogo com reflexo imediato em /planos e /checkout.
                </p>
              </div>

              {!isReadOnly && (
                <button
                  onClick={() =>
                    setEditandoProduto({
                      nome: '',
                      servico_id: '',
                      descricao: '',
                      preco: 0,
                      tipo: 'avulso',
                      ativo: true,
                      ordem: catalogo.length + 1,
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs shadow-emerald-glow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Produto</span>
                </button>
              )}
            </div>

            {/* Formulário de Edição (se aberto) */}
            {editandoProduto && (
              <form
                onSubmit={handleSalvarProduto}
                className="p-6 rounded-2xl bg-[#111820] border-2 border-[#12B886] space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.08)] pb-3">
                  <h3 className="font-heading font-bold text-sm text-[#F4F7FA]">
                    {editandoProduto.id ? 'Editar Produto do Catálogo' : 'Cadastrar Novo Produto'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditandoProduto(null)}
                    className="text-xs text-[#93A3B5] hover:text-[#F4F7FA]"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-[#93A3B5] mb-1">Nome do Produto *</label>
                    <input
                      type="text"
                      required
                      value={editandoProduto.nome || ''}
                      onChange={(e) =>
                        setEditandoProduto({ ...editandoProduto, nome: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#93A3B5] mb-1">
                      ID do Serviço (slug único) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editandoProduto.servico_id || ''}
                      onChange={(e) =>
                        setEditandoProduto({ ...editandoProduto, servico_id: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#93A3B5] mb-1">Preço em Reais (R$) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={editandoProduto.preco || ''}
                      onChange={(e) =>
                        setEditandoProduto({ ...editandoProduto, preco: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#12B886] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[#93A3B5] mb-1">Tipo de Cobrança *</label>
                    <select
                      value={editandoProduto.tipo || 'avulso'}
                      onChange={(e) =>
                        setEditandoProduto({ ...editandoProduto, tipo: e.target.value as any })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                    >
                      <option value="avulso">Avulso</option>
                      <option value="recorrente">Recorrente</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-[#93A3B5] mb-1">Descrição Comercial</label>
                  <textarea
                    rows={2}
                    value={editandoProduto.descricao || ''}
                    onChange={(e) =>
                      setEditandoProduto({ ...editandoProduto, descricao: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditandoProduto(null)}
                    className="px-4 py-2 rounded-lg bg-[#16202B] text-xs text-[#93A3B5]"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-[#12B886] text-[#0A0E12] font-bold text-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </form>
            )}

            {/* Grid dos Produtos Reais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {catalogo.map((prod) => (
                <div
                  key={prod.id}
                  className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#D9B36C] uppercase font-bold">
                        {prod.servico_id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#12B886]/10 text-[#12B886]">
                        {prod.tipo}
                      </span>
                    </div>

                    <h3 className="font-heading font-extrabold text-lg text-[#F4F7FA]">
                      {prod.nome}
                    </h3>

                    <div className="font-heading font-black text-3xl text-[#12B886]">
                      R$ {Number(prod.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>

                    <p className="text-xs text-[#93A3B5] leading-relaxed">{prod.descricao}</p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between">
                    <span className="text-[10px] text-[#93A3B5]">Ordem: {prod.ordem}</span>
                    {!isReadOnly ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditandoProduto(prod)}
                          className="p-2 rounded-lg bg-[#16202B] text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExcluirProduto(prod.id)}
                          className="p-2 rounded-lg bg-[#16202B] text-[#F03E54] hover:bg-[#F03E54] hover:text-white transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#93A3B5]/50 italic">Somente leitura</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. ASSINATURAS (Item 6 do Parecer CFO: Calendário de Recorrência & Inadimplência) */}
        {activeTab === 'assinaturas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  Calendário de Cobrança Recorrente & Gestão de Inadimplência
                </h2>
                <p className="text-xs text-[#93A3B5]">
                  Controle do Bureau ACP (R$ 7.800/mês), agendamento diário de renovação (cron D+1)
                  e detecção defensiva de cobranças vencidas (+7 dias).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSincronizarCiclosAssinatura}
                  disabled={sincronizandoCiclo}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs shadow-emerald-glow disabled:opacity-50"
                  title="Executar verificação on-demand do ciclo recorrente (gerar D+1 e marcar atrasos > 7 dias)"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${sincronizandoCiclo ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {sincronizandoCiclo ? 'Sincronizando Ciclo...' : 'Verificar Ciclo On-Demand'}
                  </span>
                </button>
              </div>
            </div>

            {/* Alerta de Inadimplência se houver clientes inadimplentes */}
            {clientes.some((c) => c.assinatura_status === 'inadimplente') && (
              <div className="p-4 rounded-xl bg-[#EF4444]/15 border-2 border-[#EF4444] text-xs text-[#EF4444] flex items-start gap-3 shadow-lg">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#EF4444]" />
                <div className="space-y-1">
                  <strong className="block font-bold uppercase tracking-wider text-sm">
                    Alerta de Inadimplência Detectada (Parecer CFO):
                  </strong>
                  <p className="leading-relaxed">
                    Existem assinantes com faturas recorrentes em atraso superior a 7 dias. O status
                    da assinatura foi automaticamente ajustado para <strong>inadimplente</strong> e
                    o acesso pericial foi bloqueado até a quitação da cobrança gerada.
                  </p>
                </div>
              </div>
            )}

            {/* Painel do Agendador (Cron e On-Demand) */}
            <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-[#93A3B5]">
                <Clock className="w-4 h-4 text-[#12B886] shrink-0" />
                <span>
                  <strong>Job Agendado Ativo:</strong> cron diário às 04:00 AM (
                  <code className="text-[#12B886]">0 4 * * *</code>) gera automaticamente cobranças
                  em D+1 e marca vencidas com +7 dias de atraso.
                </span>
              </div>
              {resumoCiclo && (
                <span className="text-[11px] font-mono text-[#D9B36C] bg-[#0A0E12] px-2.5 py-1 rounded border border-[rgba(244,247,250,0.08)]">
                  Última sincronização: {resumoCiclo.data} • {resumoCiclo.cobrancas_geradas}{' '}
                  gerada(s) • {resumoCiclo.cobrancas_vencidas} vencida(s)
                </span>
              )}
            </div>

            <div className="rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D1217] text-[#93A3B5] uppercase text-[10px] border-b border-[rgba(244,247,250,0.08)]">
                  <tr>
                    <th className="p-3.5">Cliente & Código</th>
                    <th className="p-3.5">CNPJ</th>
                    <th className="p-3.5">Plano Ativo</th>
                    <th className="p-3.5">Próxima Renovação</th>
                    <th className="p-3.5">Status da Assinatura</th>
                    <th className="p-3.5 text-right">Ação Operacional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(244,247,250,0.05)]">
                  {clientes.map((cli) => {
                    const isInadimplente = cli.assinatura_status === 'inadimplente'
                    return (
                      <tr
                        key={cli.id}
                        className={`hover:bg-[#16202B]/50 transition-colors ${
                          isInadimplente ? 'bg-[#EF4444]/5' : ''
                        }`}
                      >
                        <td className="p-3.5">
                          <strong className="text-[#F4F7FA] block">{cli.name || cli.email}</strong>
                          <span className="font-mono text-[#D9B36C] text-[10px]">
                            {cli.cliente_codigo || 'ORB-CLI-XXXX'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-[#93A3B5]">
                          {cli.cnpj || '-'}
                        </td>
                        <td className="p-3.5 font-semibold text-[#12B886]">
                          {cli.plano_ativo || 'Nenhum'}
                        </td>
                        <td className="p-3.5 font-mono">
                          {cli.assinatura_renovacao ? (
                            <span className="text-[#D9B36C] font-semibold">
                              {cli.assinatura_renovacao}
                            </span>
                          ) : (
                            <span className="text-[#93A3B5]">Sem data definida</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              cli.assinatura_status === 'ativa'
                                ? 'bg-[#12B886]/20 text-[#12B886] border border-[#12B886]/30'
                                : cli.assinatura_status === 'inadimplente'
                                  ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 animate-pulse'
                                  : cli.assinatura_status === 'suspensa'
                                    ? 'bg-[#F03E54]/20 text-[#F03E54]'
                                    : 'bg-[#93A3B5]/20 text-[#93A3B5]'
                            }`}
                          >
                            {cli.assinatura_status || 'sem plano'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          {!isReadOnly ? (
                            cli.assinatura_status === 'suspensa' || isInadimplente ? (
                              <button
                                onClick={() => handleAlterarStatusAssinatura(cli.id, 'ativa')}
                                className="px-3 py-1 rounded bg-[#12B886]/20 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] font-semibold text-[11px]"
                              >
                                Reativar / Quitar
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAlterarStatusAssinatura(cli.id, 'suspensa')}
                                className="px-3 py-1 rounded bg-[#F03E54]/20 text-[#F03E54] hover:bg-[#F03E54] hover:text-white font-semibold text-[11px]"
                              >
                                Suspender
                              </button>
                            )
                          ) : (
                            <span className="text-[11px] text-[#93A3B5]/50 italic">
                              Visualização apenas
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. COMISSÕES & PARCEIROS */}
        {activeTab === 'comissoes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  Gestão de Parceiros & Comissões de Afiliados
                </h2>
                <p className="text-xs text-[#93A3B5]">
                  CRUD de parceiros, comissões calculadas na liquidação e repasse de honorários
                  (dados bancários restritos ao admin).
                </p>
              </div>

              {!isReadOnly && (
                <button
                  onClick={() =>
                    setEditandoParceiro({
                      nome: '',
                      cpf_cnpj: '',
                      contato: '',
                      percentual_comissao: 10,
                      banco: '',
                      agencia: '',
                      conta: '',
                      chave_pix: '',
                      status: 'ativo',
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs shadow-emerald-glow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Parceiro</span>
                </button>
              )}
            </div>

            {/* Formulário Parceiro */}
            {editandoParceiro && (
              <form
                onSubmit={handleSalvarParceiro}
                className="p-6 rounded-2xl bg-[#111820] border-2 border-[#12B886] space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.08)] pb-3">
                  <h3 className="font-heading font-bold text-sm text-[#F4F7FA]">
                    {editandoParceiro.id
                      ? 'Editar Dados do Parceiro'
                      : 'Cadastrar Novo Parceiro Afiliado'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditandoParceiro(null)}
                    className="text-xs text-[#93A3B5] hover:text-[#F4F7FA]"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-[#93A3B5] mb-1">Nome / Razão Social *</label>
                    <input
                      type="text"
                      required
                      value={editandoParceiro.nome || ''}
                      onChange={(e) =>
                        setEditandoParceiro({ ...editandoParceiro, nome: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#93A3B5] mb-1">CPF ou CNPJ *</label>
                    <input
                      type="text"
                      required
                      value={editandoParceiro.cpf_cnpj || ''}
                      onChange={(e) =>
                        setEditandoParceiro({ ...editandoParceiro, cpf_cnpj: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#93A3B5] mb-1">
                      Percentual de Comissão (%) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.5"
                      value={editandoParceiro.percentual_comissao || ''}
                      onChange={(e) =>
                        setEditandoParceiro({
                          ...editandoParceiro,
                          percentual_comissao: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#12B886] font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs pt-2">
                  <div>
                    <label className="block text-[#93A3B5] mb-1">Banco</label>
                    <input
                      type="text"
                      value={editandoParceiro.banco || ''}
                      onChange={(e) =>
                        setEditandoParceiro({ ...editandoParceiro, banco: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#93A3B5] mb-1">Agência</label>
                    <input
                      type="text"
                      value={editandoParceiro.agencia || ''}
                      onChange={(e) =>
                        setEditandoParceiro({ ...editandoParceiro, agencia: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#93A3B5] mb-1">Conta Corrente</label>
                    <input
                      type="text"
                      value={editandoParceiro.conta || ''}
                      onChange={(e) =>
                        setEditandoParceiro({ ...editandoParceiro, conta: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#93A3B5] mb-1">Chave PIX</label>
                    <input
                      type="text"
                      value={editandoParceiro.chave_pix || ''}
                      onChange={(e) =>
                        setEditandoParceiro({ ...editandoParceiro, chave_pix: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#93A3B5] mb-1">Tipo Documentação Fiscal</label>
                    <select
                      value={editandoParceiro.tipo_documentacao || 'RPA'}
                      onChange={(e) =>
                        setEditandoParceiro({
                          ...editandoParceiro,
                          tipo_documentacao: e.target.value as 'RPA' | 'NFSe_pj',
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                    >
                      <option value="RPA">RPA (Pessoa Física)</option>
                      <option value="NFSe_pj">NFS-e (Pessoa Jurídica)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[#93A3B5] mb-1">
                      URL / Link Comprovante Fiscal (RPA ou NFS-e)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: https://storage.../nfse-001.pdf ou chave de acesso"
                      value={editandoParceiro.documento_fiscal_url || ''}
                      onChange={(e) =>
                        setEditandoParceiro({
                          ...editandoParceiro,
                          documento_fiscal_url: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] font-mono text-[11px]"
                    />
                  </div>
                  <div className="sm:col-span-3 flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="docFiscalValidadoCheck"
                      checked={Boolean(editandoParceiro.documento_fiscal_validado)}
                      onChange={(e) =>
                        setEditandoParceiro({
                          ...editandoParceiro,
                          documento_fiscal_validado: e.target.checked,
                        })
                      }
                      className="rounded text-[#12B886] focus:ring-[#12B886]"
                    />
                    <label
                      htmlFor="docFiscalValidadoCheck"
                      className="text-xs text-[#F4F7FA] cursor-pointer"
                    >
                      <strong>Documentação Fiscal Validada pela Controladoria</strong> (obrigatória
                      para liberar botão de repasse)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditandoParceiro(null)}
                    className="px-4 py-2 rounded-lg bg-[#16202B] text-xs text-[#93A3B5]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-[#12B886] text-[#0A0E12] font-bold text-xs"
                  >
                    Salvar Parceiro
                  </button>
                </div>
              </form>
            )}

            {/* Lista de Parceiros & Dados Bancários */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-sm text-[#12B886] uppercase tracking-wider">
                Parceiros Cadastrados ({parceiros.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parceiros.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-[#F4F7FA] text-sm block">{p.nome}</strong>
                        <span className="font-mono text-[11px] text-[#D9B36C]">
                          {p.codigo_parceiro}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#12B886]/10 text-[#12B886]">
                        {p.percentual_comissao}% comissão
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#93A3B5] uppercase font-bold text-[9px] block text-[#D9B36C]">
                          Dados Bancários (Visível só ao Admin):
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              p.documento_fiscal_validado
                                ? 'bg-[#12B886]/20 text-[#12B886] border border-[#12B886]/40'
                                : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                            }`}
                          >
                            {p.documento_fiscal_validado
                              ? `Fiscal Validado (${p.tipo_documentacao || 'RPA'})`
                              : 'Fiscal Pendente'}
                          </span>
                        </div>
                      </div>
                      <div>
                        Banco: {p.banco || 'Não informado'} • Ag: {p.agencia || '-'} • CC:{' '}
                        {p.conta || '-'}
                      </div>
                      <div>
                        Chave PIX:{' '}
                        <strong className="font-mono text-[#F4F7FA]">
                          {p.chave_pix || 'Não informada'}
                        </strong>
                      </div>
                      <div className="pt-1 flex items-center justify-between text-[10px] border-t border-[rgba(244,247,250,0.06)]">
                        <span className="text-[#93A3B5]">
                          Doc Fiscal:{' '}
                          {p.documento_fiscal_url ? (
                            <a
                              href={p.documento_fiscal_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#12B886] underline font-mono ml-1"
                            >
                              Abrir Comprovante
                            </a>
                          ) : (
                            <span className="text-[#EF4444] ml-1">Não anexado</span>
                          )}
                        </span>
                        {p.documento_fiscal_url && !p.documento_fiscal_validado && (
                          <button
                            type="button"
                            onClick={() => handleValidarDocumentoFiscalParceiro(p.id, true)}
                            className="px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-bold hover:bg-[#12B886] hover:text-[#0A0E12]"
                          >
                            Homologar Fiscal
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-[#93A3B5]">
                        Link de indicação:{' '}
                        <code className="text-[#3B82F6]">/checkout?ref={p.codigo_parceiro}</code>
                      </span>
                      <button
                        onClick={() => setEditandoParceiro(p)}
                        className="px-3 py-1 rounded bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabela de Comissões */}
            <div className="space-y-3 pt-6">
              <h3 className="font-heading font-bold text-sm text-[#D9B36C] uppercase tracking-wider">
                Comissões Geradas por Vendas ({comissoes.length})
              </h3>

              <div className="rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0D1217] text-[#93A3B5] uppercase text-[10px] border-b border-[rgba(244,247,250,0.08)]">
                    <tr>
                      <th className="p-3.5">Parceiro</th>
                      <th className="p-3.5">Base de Cálculo</th>
                      <th className="p-3.5">% Aplicado (Congelado)</th>
                      <th className="p-3.5">Valor Comissão</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Repasse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(244,247,250,0.05)]">
                    {comissoes.map((com) => (
                      <tr key={com.id} className="hover:bg-[#16202B]/50 transition-colors">
                        <td className="p-3.5">
                          <strong className="text-[#F4F7FA] block">
                            {com.expand?.parceiro_id?.nome || 'Parceiro'}
                          </strong>
                          <span className="text-[10px] font-mono text-[#93A3B5]">
                            Cobrança ID: {com.cobranca_id}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[#93A3B5]">
                          R${' '}
                          {Number(com.base_calculo).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="p-3.5 font-bold text-[#D9B36C]">
                          {com.percentual_aplicado}%
                        </td>
                        <td className="p-3.5 font-bold font-heading text-sm text-[#12B886]">
                          R${' '}
                          {Number(com.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              com.status === 'paga'
                                ? 'bg-[#12B886]/20 text-[#12B886]'
                                : 'bg-[#D9B36C]/20 text-[#D9B36C]'
                            }`}
                          >
                            {com.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {com.status !== 'paga' ? (
                            isReadOnly ? (
                              <span className="text-[11px] text-[#93A3B5]/50 italic">
                                Somente leitura
                              </span>
                            ) : (
                              (() => {
                                const pRef = parceiros.find((p) => p.id === com.parceiro_id)
                                const liberado = Boolean(
                                  pRef?.documento_fiscal_validado && pRef?.documento_fiscal_url,
                                )
                                return liberado ? (
                                  <button
                                    onClick={() => handlePagarComissao(com)}
                                    className="px-3 py-1 rounded bg-[#12B886] text-[#0A0E12] font-bold text-xs shadow-emerald-glow hover:bg-[#0fa376] transition-all"
                                    title="Documentação fiscal conferida. Registrar liquidação."
                                  >
                                    Registrar Pagamento
                                  </button>
                                ) : (
                                  <div className="inline-block text-right">
                                    <button
                                      disabled
                                      className="px-3 py-1 rounded bg-[#16202B] text-[#93A3B5] cursor-not-allowed text-xs font-semibold border border-[rgba(244,247,250,0.1)] opacity-60"
                                      title="Repasse bloqueado: anexe RPA (PF) ou NFS-e (PJ) para liberar o pagamento"
                                    >
                                      Registrar Pagamento
                                    </button>
                                    <span className="block text-[9px] text-[#EF4444] mt-0.5 max-w-[150px] leading-tight text-right">
                                      Repasse bloqueado: anexe RPA (PF) ou NFS-e (PJ) para liberar o
                                      pagamento
                                    </span>
                                  </div>
                                )
                              })()
                            )
                          ) : (
                            <span className="text-[10px] text-[#93A3B5] font-mono">
                              Pago em{' '}
                              {com.data_pagamento
                                ? new Date(com.data_pagamento).toLocaleDateString('pt-BR')
                                : 'Hoje'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {comissoes.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-xs text-[#93A3B5]">
                          Nenhuma comissão calculada até o momento. Comissões nascem automaticamente
                          na liquidação de cobranças com parceiro associado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4-OLHOS E TRILHA DE AUDITORIA DE LIQUIDAÇÃO MANUAL (Item 1 e 2 do CFO) */}
        {modalLiquidacao.aberto && modalLiquidacao.cobranca && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xl rounded-2xl bg-[#111820] border-2 border-[#12B886] p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-[rgba(244,247,250,0.1)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#12B886]" />
                    <h3 className="font-heading font-extrabold text-lg text-[#F4F7FA]">
                      Liquidação Manual & Quatro Olhos
                    </h3>
                  </div>
                  <span className="text-xs text-[#93A3B5] mt-1 block">
                    Controle de Governança e Parecer do CFO • ID: {modalLiquidacao.cobranca.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setModalLiquidacao({
                      aberto: false,
                      cobranca: null,
                      justificativa: '',
                      comprovanteRef: '',
                      confirmacaoDuplaCheck: false,
                      etapaDupla: false,
                      divergenteAviso: false,
                      submetendo: false,
                    })
                  }
                  className="text-[#93A3B5] hover:text-[#F4F7FA] text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Informações da Cobrança */}
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#93A3B5]">Serviço / Produto:</span>
                  <strong className="text-[#D9B36C] font-semibold">
                    {modalLiquidacao.cobranca.servico_nome}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#93A3B5]">Tomador:</span>
                  <strong className="text-[#F4F7FA]">
                    {modalLiquidacao.cobranca.tomador_nome} (
                    {modalLiquidacao.cobranca.tomador_cpf_cnpj})
                  </strong>
                </div>
                <div className="flex items-center justify-between border-t border-[rgba(244,247,250,0.06)] pt-2">
                  <span className="text-[#93A3B5]">Valor a Liquidar:</span>
                  <strong className="font-heading font-black text-lg text-[#12B886]">
                    R${' '}
                    {Number(modalLiquidacao.cobranca.valor).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                </div>
              </div>

              {/* Alerta de Divergência de Preço (Item 1 do CFO) */}
              {modalLiquidacao.divergenteAviso && (
                <div className="p-4 rounded-xl bg-[#D9B36C]/10 border-2 border-[#D9B36C] text-xs text-[#D9B36C] space-y-2">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>Bloqueio Preventivo — Preço de Contingência / Divergente</span>
                  </div>
                  <p className="leading-relaxed">
                    Esta cobrança foi gerada a partir da tabela de contingência ou apresenta
                    divergência de valor com o catálogo cadastrado.
                  </p>
                  <p className="text-[11px] text-[#93A3B5]">
                    Conforme a norma de controle interno, a liquidação manual exige confirmação
                    explícita e justificativa detalhada para ser liberada no banco de dados.
                  </p>
                </div>
              )}

              {/* Alerta de Valor Acima do Limite Four-Eyes (Regra de Quatro Olhos Dinâmica) */}
              {Number(modalLiquidacao.cobranca.valor) > limiteFourEyesAtual && (
                <div className="p-4 rounded-xl bg-[#3B82F6]/10 border-2 border-[#3B82F6] text-xs text-[#3B82F6] space-y-1">
                  <strong className="block font-bold text-sm uppercase tracking-wide">
                    ⚠️ Valor acima de R${' '}
                    {limiteFourEyesAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{' '}
                    exige dupla confirmação (Regra de Quatro Olhos)
                  </strong>
                  <p className="text-[#93A3B5] text-[11px]">
                    Transações acima do limite configurado em Parâmetros do Negócio exigem validação
                    cadastral e aprovação em duas etapas pelo auditor ou gestor financeiro antes do
                    repasse e ativação pericial.
                  </p>
                </div>
              )}

              <form onSubmit={executarLiquidacaoManual} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#93A3B5] mb-1 font-semibold">
                    Referência do Comprovante de Pagamento * (nº PIX / doc bancário)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: E20260408152345... ou TED 849204"
                    value={modalLiquidacao.comprovanteRef}
                    onChange={(e) =>
                      setModalLiquidacao({ ...modalLiquidacao, comprovanteRef: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] font-mono focus:outline-none focus:border-[#12B886]"
                  />
                </div>

                <div>
                  <label className="block text-[#93A3B5] mb-1 font-semibold">
                    Justificativa Obrigatória da Liquidação Manual *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Descreva a conciliação bancária, extrato conferido ou autorização especial do financeiro..."
                    value={modalLiquidacao.justificativa}
                    onChange={(e) =>
                      setModalLiquidacao({ ...modalLiquidacao, justificativa: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:border-[#12B886]"
                  />
                </div>

                {/* Checkbox de Segunda Confirmação para > limiteFourEyesAtual */}
                {Number(modalLiquidacao.cobranca.valor) > limiteFourEyesAtual && (
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#0A0E12] border border-[#3B82F6]/40 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={modalLiquidacao.confirmacaoDuplaCheck}
                      onChange={(e) =>
                        setModalLiquidacao({
                          ...modalLiquidacao,
                          confirmacaoDuplaCheck: e.target.checked,
                        })
                      }
                      className="mt-0.5 rounded text-[#12B886] focus:ring-[#12B886]"
                    />
                    <span className="text-[11px] text-[#F4F7FA] leading-tight">
                      <strong>Confirmo em segunda etapa</strong> que o valor de R${' '}
                      {Number(modalLiquidacao.cobranca.valor).toLocaleString('pt-BR')}, os dados do
                      tomador e a autenticidade do comprovante bancário foram devidamente checados.
                    </span>
                  </label>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-[rgba(244,247,250,0.08)]">
                  <button
                    type="button"
                    onClick={() =>
                      setModalLiquidacao({
                        aberto: false,
                        cobranca: null,
                        justificativa: '',
                        comprovanteRef: '',
                        confirmacaoDuplaCheck: false,
                        etapaDupla: false,
                        divergenteAviso: false,
                        submetendo: false,
                      })
                    }
                    className="px-4 py-2.5 rounded-xl bg-[#16202B] text-xs text-[#93A3B5] hover:text-[#F4F7FA]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalLiquidacao.submetendo}
                    className="px-6 py-2.5 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-emerald-glow disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {modalLiquidacao.submetendo
                        ? 'Liquidando...'
                        : 'Confirmar e Gravar Auditoria'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DETALHE DA TRILHA DE AUDITORIA */}
        {cobrancaDetalheAuditoria && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xl rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.15)] p-6 sm:p-8 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.1)] pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#D9B36C]" />
                  <h3 className="font-heading font-extrabold text-base text-[#F4F7FA]">
                    Trilha de Auditoria da Cobrança
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCobrancaDetalheAuditoria(null)}
                  className="text-[#93A3B5] hover:text-[#F4F7FA]"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#0A0E12] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#93A3B5]">ID:</span>
                    <span className="font-mono text-[#F4F7FA]">{cobrancaDetalheAuditoria.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#93A3B5]">TXID:</span>
                    <span className="font-mono text-[#D9B36C]">
                      {cobrancaDetalheAuditoria.txid}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#93A3B5]">Status:</span>
                    <span className="font-bold text-[#12B886] uppercase">
                      {cobrancaDetalheAuditoria.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#93A3B5]">Origem do Preço:</span>
                    <span className="text-[#F4F7FA]">
                      {cobrancaDetalheAuditoria.origem_preco || 'catalogo'}
                      {cobrancaDetalheAuditoria.divergencia_preco ? ' (com divergência)' : ''}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#16202B] border border-[rgba(244,247,250,0.08)] space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#12B886] block">
                    Registros de Liquidação Manual & 4-Olhos:
                  </span>
                  <div>
                    <span className="text-[#93A3B5] block">Liquidado Por:</span>
                    <strong className="text-[#F4F7FA]">
                      {cobrancaDetalheAuditoria.liquidado_por ||
                        'Processamento Automático de Gateway'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#93A3B5] block">Data e Hora da Liquidação:</span>
                    <span className="text-[#F4F7FA]">
                      {cobrancaDetalheAuditoria.liquidado_em ||
                      cobrancaDetalheAuditoria.data_pagamento
                        ? new Date(
                            cobrancaDetalheAuditoria.liquidado_em ||
                              cobrancaDetalheAuditoria.data_pagamento,
                          ).toLocaleString('pt-BR')
                        : 'Não liquidado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#93A3B5] block">Referência do Comprovante:</span>
                    <span className="font-mono text-[#D9B36C]">
                      {cobrancaDetalheAuditoria.liquidacao_comprovante_ref ||
                        cobrancaDetalheAuditoria.url_comprovante ||
                        'Não informada'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#93A3B5] block">Justificativa Registrada:</span>
                    <p className="text-[#F4F7FA] bg-[#0A0E12] p-2 rounded-lg mt-1 border border-[rgba(244,247,250,0.06)]">
                      {cobrancaDetalheAuditoria.liquidacao_justificativa ||
                        'Liquidação regular via arranjo PIX do Banco Central.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCobrancaDetalheAuditoria(null)}
                  className="px-5 py-2 rounded-xl bg-[#16202B] text-xs font-semibold text-[#F4F7FA]"
                >
                  Fechar Trilha
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 8. REDE PERICIAL & CONSELHOS */}
        {activeTab === 'peritos' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                Governança da Rede Pericial & Conselhos Profissionais
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Fila de aprovação de credenciamentos com ART/RRT, rede ativa por conselho/UF e
                pipeline de recrutamento de leads.
              </p>
            </div>

            {/* Fila de Credenciamentos perito_credenciamentos */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-sm text-[#12B886] uppercase tracking-wider">
                Fila de Julgamento de Credenciamentos ({peritos.length})
              </h3>

              <div className="space-y-3">
                {peritos.map((per) => (
                  <div
                    key={per.id}
                    className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-[#F4F7FA] text-base">{per.nome_completo}</strong>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#3B82F6]/20 text-[#3B82F6]">
                            {per.conselho_tipo} - {per.registro_uf}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#93A3B5] font-mono mt-0.5">
                          Registro: {per.registro_profissional} • CPF: {per.cpf} • Email:{' '}
                          {per.email_corporativo}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            per.status === 'aprovado'
                              ? 'bg-[#12B886]/20 text-[#12B886]'
                              : per.status === 'suspenso'
                                ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 animate-pulse'
                                : per.status === 'rejeitado'
                                  ? 'bg-[#F03E54]/20 text-[#F03E54]'
                                  : 'bg-[#D9B36C]/20 text-[#D9B36C]'
                          }`}
                        >
                          Status: {per.status}
                        </span>

                        {/* Botão de Reativação se o perito estiver suspenso */}
                        {per.status === 'suspenso' && !isReadOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              setModalReativarPerito({
                                aberto: true,
                                perito: per,
                                motivo: '',
                                novaValidadeArt: per.validade_art || '',
                                submetendo: false,
                              })
                            }
                            className="px-3 py-1 rounded-lg bg-[#12B886] text-[#0A0E12] font-bold text-xs shadow-emerald-glow hover:bg-[#0ca678] transition-colors"
                          >
                            Reativar Perito
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Alerta de Perito Suspenso */}
                    {per.status === 'suspenso' && (
                      <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs text-[#EF4444] space-y-1">
                        <strong className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          Perito Suspenso — ART Vencida ou Decisão de Auditoria
                        </strong>
                        <p className="text-[11px] text-[#F4F7FA]/90">
                          Motivo:{' '}
                          {per.motivo_suspensao ||
                            'Validade da ART expirada no sistema automático.'}
                        </p>
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                      <div>
                        <span className="text-[#93A3B5] block">ART / RRT Vinculada:</span>
                        <strong className="text-[#D9B36C] font-mono">
                          {per.numero_art_rrt || 'Não informada'}
                        </strong>
                      </div>

                      {/* Validade da ART com badge de alerta e edição inline */}
                      <div>
                        <span className="text-[#93A3B5] block mb-1">Validade da ART:</span>
                        {editandoArtId === per.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={novaValidadeArtInput}
                              onChange={(e) => setNovaValidadeArtInput(e.target.value)}
                              className="px-2 py-1 rounded bg-[#111820] border border-[rgba(244,247,250,0.2)] text-xs text-[#F4F7FA] font-mono"
                            />
                            <button
                              type="button"
                              disabled={salvandoArt}
                              onClick={() => handleSalvarValidadeArt(per.id)}
                              className="px-2 py-1 rounded bg-[#12B886] text-[#0A0E12] font-bold text-[10px]"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditandoArtId(null)
                                setNovaValidadeArtInput('')
                              }}
                              className="px-2 py-1 rounded bg-[#16202B] text-[#93A3B5] text-[10px]"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[#F4F7FA]">
                              {per.validade_art
                                ? new Date(per.validade_art).toLocaleDateString('pt-BR')
                                : 'Não cadastrada'}
                            </span>

                            {/* Badges de alerta de ART */}
                            {(() => {
                              if (!per.validade_art) return null
                              const hoje = new Date()
                              hoje.setHours(0, 0, 0, 0)
                              const val = new Date(per.validade_art)
                              const diffDias = Math.ceil(
                                (val.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
                              )

                              if (diffDias < 0) {
                                return (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40">
                                    Vencida ({Math.abs(diffDias)}d atrás)
                                  </span>
                                )
                              }
                              if (diffDias <= 60) {
                                return (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#D9B36C]/20 text-[#D9B36C] border border-[#D9B36C]/40">
                                    Vence em {diffDias} dias
                                  </span>
                                )
                              }
                              return (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#12B886]/10 text-[#12B886]">
                                  Regular ({diffDias}d)
                                </span>
                              )
                            })()}

                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditandoArtId(per.id)
                                  setNovaValidadeArtInput(
                                    per.validade_art ? per.validade_art.slice(0, 10) : '',
                                  )
                                }}
                                className="text-[10px] text-[#12B886] hover:underline ml-1"
                              >
                                Editar
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-[#93A3B5] block">Observação Atual do Auditor:</span>
                        <span className="text-[#F4F7FA] break-words">
                          {per.observacao_auditor || 'Sem observações'}
                        </span>
                      </div>
                    </div>

                    {/* Ação de Julgar */}
                    {per.status === 'pendente' &&
                      (isReadOnly ? (
                        <div className="text-[11px] text-[#93A3B5]/50 italic pt-1">
                          Julgamento pericial restrito ao Administrador.
                        </div>
                      ) : (
                        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <input
                            type="text"
                            placeholder="Parecer do auditor (ex: Documentação homologada com sucesso)..."
                            value={obsPerito[per.id] || ''}
                            onChange={(e) =>
                              setObsPerito({ ...obsPerito, [per.id]: e.target.value })
                            }
                            className="flex-1 px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA]"
                          />
                          <button
                            onClick={() => handleJulgarPerito(per.id, 'aprovado')}
                            className="px-4 py-2 rounded-lg bg-[#12B886] text-[#0A0E12] font-bold text-xs shadow-emerald-glow flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aprovar Perito</span>
                          </button>
                          <button
                            onClick={() => handleJulgarPerito(per.id, 'rejeitado')}
                            className="px-4 py-2 rounded-lg bg-[#F03E54]/20 text-[#F03E54] hover:bg-[#F03E54] hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rejeitar</span>
                          </button>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline de Leads com Conselho Informado (Recrutamento) */}
            <div className="space-y-3 pt-6">
              <h3 className="font-heading font-bold text-sm text-[#D9B36C] uppercase tracking-wider">
                Pipeline de Recrutamento — Leads que Informaram Conselho Profissional (
                {leads.filter((l) => l.conselho).length})
              </h3>

              <div className="rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0D1217] text-[#93A3B5] uppercase text-[10px] border-b border-[rgba(244,247,250,0.08)]">
                    <tr>
                      <th className="p-3.5">Profissional & Razão Social</th>
                      <th className="p-3.5">Conselho Declarado</th>
                      <th className="p-3.5">Categoria</th>
                      <th className="p-3.5">Contato</th>
                      <th className="p-3.5 text-right">Status do Lead</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(244,247,250,0.05)]">
                    {leads
                      .filter((l) => l.conselho)
                      .map((lead) => (
                        <tr key={lead.id} className="hover:bg-[#16202B]/50 transition-colors">
                          <td className="p-3.5">
                            <strong className="text-[#F4F7FA] block">
                              {lead.responsavel || lead.razao_social}
                            </strong>
                            <span className="text-[10px] text-[#93A3B5]">{lead.razao_social}</span>
                          </td>
                          <td className="p-3.5 font-bold font-mono text-[#D9B36C]">
                            {lead.conselho}
                          </td>
                          <td className="p-3.5 text-[#93A3B5]">{lead.categoria_profissional}</td>
                          <td className="p-3.5 text-[#93A3B5]">
                            <div>{lead.email}</div>
                            <div className="text-[10px] text-[#12B886]">{lead.whatsapp}</div>
                          </td>
                          <td className="p-3.5 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#3B82F6]/20 text-[#3B82F6]">
                              {lead.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 9. AUDITORIA & TRILHA IMUTÁVEL (audit_log append-only) */}
        {activeTab === 'auditoria' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#12B886]" />
                  <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                    Trilha Central de Auditoria Corporativa (audit_log)
                  </h2>
                </div>
                <p className="text-xs text-[#93A3B5] mt-0.5">
                  Registros append-only de governança, congelamentos, anulações e liquidações.
                  Acesso estritamente somente leitura para todos os usuários e administradores.
                </p>
              </div>

              <button
                type="button"
                onClick={carregarAuditLogs}
                disabled={auditLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111820] border border-[#12B886]/40 text-xs text-[#12B886] font-semibold hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar Trilha</span>
              </button>
            </div>

            {/* Barra de Filtros */}
            <div className="p-4 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#93A3B5] mb-1">
                  Entidade
                </label>
                <select
                  value={auditFiltroEntidade}
                  onChange={(e) => {
                    setAuditFiltroEntidade(e.target.value)
                    setAuditPagina(1)
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                >
                  <option value="todas">Todas as Entidades</option>
                  <option value="cobrancas">cobrancas</option>
                  <option value="cdv_pecas">cdv_pecas</option>
                  <option value="cdv_lotes">cdv_lotes</option>
                  <option value="dpp_destinacao_final">dpp_destinacao_final</option>
                  <option value="perito_credenciamentos">perito_credenciamentos</option>
                  <option value="users">users</option>
                  <option value="auth">auth / credenciais</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#93A3B5] mb-1">
                  Ação
                </label>
                <select
                  value={auditFiltroAcao}
                  onChange={(e) => {
                    setAuditFiltroAcao(e.target.value)
                    setAuditPagina(1)
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                >
                  <option value="todas">Todas as Ações</option>
                  <option value="liquidacao_manual">liquidacao_manual</option>
                  <option value="anulacao_documento">anulacao_documento</option>
                  <option value="suspensao_art_vencida">suspensao_art_vencida</option>
                  <option value="reativacao_perito">reativacao_perito</option>
                  <option value="alteracao_role">alteracao_role</option>
                  <option value="password_reset_request">password_reset_request</option>
                  <option value="password_reset_confirm">password_reset_confirm</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#93A3B5] mb-1">
                  Ator (E-mail ou ID)
                </label>
                <input
                  type="text"
                  placeholder="Filtro de ator..."
                  value={auditFiltroAtor}
                  onChange={(e) => {
                    setAuditFiltroAtor(e.target.value)
                    setAuditPagina(1)
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#93A3B5] mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={auditFiltroDataInicio}
                  onChange={(e) => {
                    setAuditFiltroDataInicio(e.target.value)
                    setAuditPagina(1)
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#93A3B5] mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={auditFiltroDataFim}
                  onChange={(e) => {
                    setAuditFiltroDataFim(e.target.value)
                    setAuditPagina(1)
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] font-mono"
                />
              </div>
            </div>

            {/* Tabela de Audit Logs */}
            <div className="rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D1217] text-[#93A3B5] uppercase text-[10px] border-b border-[rgba(244,247,250,0.08)]">
                  <tr>
                    <th className="p-3.5">Data / Hora</th>
                    <th className="p-3.5">Entidade</th>
                    <th className="p-3.5">Registro ID</th>
                    <th className="p-3.5">Ação Realizada</th>
                    <th className="p-3.5">Ator Responsável</th>
                    <th className="p-3.5">IP</th>
                    <th className="p-3.5 text-right">Detalhes JSON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(244,247,250,0.05)]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#16202B]/50 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-[#93A3B5] whitespace-nowrap">
                        {new Date(log.created).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#D9B36C]">{log.entidade}</td>
                      <td className="p-3.5 font-mono text-[11px] text-[#F4F7FA] truncate max-w-[120px]">
                        {log.registro_id}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/30">
                          {log.acao}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-[#F4F7FA] truncate max-w-[160px]">
                        {log.ator_email || log.ator_id || 'sistema'}
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-[#93A3B5]">
                        {log.ip || '-'}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setAuditDetalheLog(log)}
                          className="px-2.5 py-1 rounded bg-[#16202B] hover:bg-[#12B886] hover:text-[#0A0E12] text-[#D9B36C] border border-[rgba(244,247,250,0.12)] text-[11px] font-semibold transition-colors"
                        >
                          Ver JSON
                        </button>
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-[#93A3B5]">
                        {auditLoading
                          ? 'Carregando trilha de auditoria...'
                          : 'Nenhum evento auditado encontrado com os filtros selecionados.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Paginação */}
              <div className="p-3.5 border-t border-[rgba(244,247,250,0.08)] bg-[#0D1217] flex items-center justify-between text-xs text-[#93A3B5]">
                <span>
                  Total de registros auditados:{' '}
                  <strong className="text-[#F4F7FA]">{totalAuditLogs}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={auditPagina <= 1}
                    onClick={() => setAuditPagina((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded bg-[#16202B] border border-[rgba(244,247,250,0.1)] disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <span className="font-mono text-[#F4F7FA]">Página {auditPagina}</span>
                  <button
                    type="button"
                    disabled={auditLogs.length < 25}
                    onClick={() => setAuditPagina((p) => p + 1)}
                    className="px-3 py-1 rounded bg-[#16202B] border border-[rgba(244,247,250,0.1)] disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. LASTRO DE CIRCULARIDADE (DECRETO 11.413/2023) */}
        {activeTab === 'lastro_conformidade' && (
          <div className="space-y-6">
            <GerenciadorLastrosTab />
          </div>
        )}

        {/* 11. CCRLR & INTEROPERABILIDADE SINIR */}
        {activeTab === 'ccrlr_sinir' && (
          <div className="space-y-6">
            <CcrlrSinirInteroperabilidadeTab />
          </div>
        )}

        {/* 12. dMRV EMISSÕES EVITADAS (SBCE / GHG PROTOCOL) */}
        {activeTab === 'dmrv_todas_empresas' && (
          <div className="space-y-6">
            <PainelDmrvEmissoesEvitadas />
          </div>
        )}

        {/* 14. GOVERNANÇA MASTER (VISÍVEL SOMENTE AO PAPEL MASTER) */}
        {activeTab === 'governanca' && isMaster && (
          <ConsoleGovernancaMasterTab usuarios={clientes} onAtualizar={carregarTodosDados} />
        )}

        {/* 15. PARÂMETROS DO NEGÓCIO (VISÍVEL SOMENTE AO PAPEL MASTER) */}
        {activeTab === 'parametros_negocio' && (
          <ConsoleParametrosNegocioTab onParametrosAtualizados={carregarTodosDados} />
        )}

        {/* 13. GOVERNANÇA DA PLATAFORMA & PARÂMETROS REGULATÓRIOS (MOVER) */}
        {activeTab === 'configuracoes' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                Parâmetros Regulatórios & Governança da Plataforma
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Controle de escopo metodológico para centros de desmontagem veicular (CDV) e
                catálogo oficial.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[rgba(244,247,250,0.08)]">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-base text-[#F4F7FA]">
                      Ampliação do Programa MOVER (28 Peças em Validação)
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                        moverAmpliadoHabilitado
                          ? 'bg-[#12B886]/10 text-[#12B886] border-[#12B886]/30'
                          : 'bg-[#93A3B5]/10 text-[#93A3B5] border-[rgba(244,247,250,0.1)]'
                      }`}
                    >
                      {moverAmpliadoHabilitado ? 'HABILITADO' : 'DESABILITADO'}
                    </span>
                  </div>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    Quando ativado, os centros de desmontagem visualizam e podem preencher a segunda
                    aba do checklist com as 28 peças ampliadas do Programa MOVER (Airbags, Cintos,
                    Climatização, Vidros, Interior). A aba é estritamente informativa e não integra
                    o hash SHA-256 canônico de conformidade da Res. CONTRAN 611/2016.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    disabled={isReadOnly || salvandoMoverFlag}
                    onClick={handleToggleMoverAmpliado}
                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 ${
                      moverAmpliadoHabilitado ? 'bg-[#12B886]' : 'bg-[#16202B]'
                    }`}
                    role="switch"
                    aria-checked={moverAmpliadoHabilitado}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        moverAmpliadoHabilitado ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-[#F4F7FA]">
                    {salvandoMoverFlag
                      ? 'Salvando...'
                      : moverAmpliadoHabilitado
                        ? 'Ativo'
                        : 'Inativo'}
                  </span>
                </div>
              </div>

              {/* Informações Regulatórias do Catálogo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-2">
                  <strong className="text-[#12B886] block font-heading font-semibold">
                    1. CONTRAN 611/2016 Vigente (49 Peças)
                  </strong>
                  <p className="text-[#93A3B5] leading-relaxed">
                    Sempre ativo na plataforma. Base legal vinculante para emissão do laudo de
                    rastreabilidade e baixa pericial via DETRAN. 7 itens classificados formalmente
                    como de segurança com destinação restrita a reciclagem ou recondicionamento
                    autorizado.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-2">
                  <strong className="text-[#D9B36C] block font-heading font-semibold">
                    2. Ampliação MOVER (28 Peças Informativas)
                  </strong>
                  <p className="text-[#93A3B5] leading-relaxed">
                    Submetido à validação metodológica. Inclui ressalva do compressor do
                    ar-condicionado (descontaminação HFC/PAG), enquadramento pendente do eixo
                    traseiro e neutralização de airbags pirotécnicos. Se a flag for desligada, as
                    leituras salvas são preservadas na base, ficando ocultas dos relatórios
                    públicos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETALHE JSON DE AUDIT_LOG */}
        {auditDetalheLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl rounded-2xl bg-[#111820] border-2 border-[#12B886] p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.1)] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#12B886]" />
                  <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                    Detalhes do Evento de Auditoria ({auditDetalheLog.acao})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAuditDetalheLog(null)}
                  className="text-[#93A3B5] hover:text-[#F4F7FA]"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#0A0E12] p-3 rounded-xl border border-[rgba(244,247,250,0.06)]">
                <div>
                  <span className="text-[#93A3B5] block">Entidade:</span>
                  <strong className="text-[#D9B36C] font-mono">{auditDetalheLog.entidade}</strong>
                </div>
                <div>
                  <span className="text-[#93A3B5] block">Registro ID:</span>
                  <strong className="text-[#F4F7FA] font-mono">
                    {auditDetalheLog.registro_id}
                  </strong>
                </div>
                <div>
                  <span className="text-[#93A3B5] block">Ator:</span>
                  <strong className="text-[#12B886] truncate block">
                    {auditDetalheLog.ator_email || auditDetalheLog.ator_id}
                  </strong>
                </div>
                <div>
                  <span className="text-[#93A3B5] block">Data/Hora:</span>
                  <span className="text-[#F4F7FA] font-mono">
                    {new Date(auditDetalheLog.created).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#93A3B5]">
                  Payload / Metadados Imutáveis (JSON)
                </span>
                <pre className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] text-[#12B886] font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(auditDetalheLog.detalhes || {}, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2 border-t border-[rgba(244,247,250,0.08)]">
                <button
                  type="button"
                  onClick={() => setAuditDetalheLog(null)}
                  className="px-5 py-2 rounded-xl bg-[#16202B] text-xs font-semibold text-[#F4F7FA]"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ANULAÇÃO FORMAL DE DOCUMENTO DPP */}
        {modalAnulacao.aberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl bg-[#111820] border-2 border-[#EF4444] p-6 space-y-5 shadow-2xl">
              <div className="flex items-start justify-between border-b border-[rgba(244,247,250,0.1)] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
                    <h3 className="font-heading font-extrabold text-lg text-[#F4F7FA]">
                      Anulação Formal de Documento DPP
                    </h3>
                  </div>
                  <span className="text-xs text-[#93A3B5] mt-1 block">
                    {modalAnulacao.identificadorVisual}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setModalAnulacao({
                      aberto: false,
                      tipo: 'lote',
                      id: '',
                      identificadorVisual: '',
                      motivo: '',
                      submetendo: false,
                    })
                  }
                  className="text-[#93A3B5] hover:text-[#F4F7FA]"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#F4F7FA] space-y-2">
                <strong className="text-[#EF4444] block uppercase font-bold">
                  Atenção: Ação Irreversível e Auditada
                </strong>
                <p className="text-[#93A3B5] leading-relaxed">
                  A anulação congela o documento, atualiza seu status para <strong>anulado</strong>{' '}
                  e registra o evento na trilha imutável. O registro NÃO é excluído da base e sua
                  anulação ficará permanentemente visível para conferência pública pelo hash
                  canônico.
                </p>
              </div>

              <form onSubmit={handleExecutarAnulacaoDpp} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#93A3B5] font-semibold mb-1">
                    Justificativa Formal Obrigatória * (mínimo 10 caracteres)
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={10}
                    placeholder="Descreva o motivo formal da anulação (ex: Erro no balanço de massa, duplicidade cadastral, laudo retificado)..."
                    value={modalAnulacao.motivo}
                    onChange={(e) => setModalAnulacao({ ...modalAnulacao, motivo: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:border-[#EF4444]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-[rgba(244,247,250,0.08)]">
                  <button
                    type="button"
                    onClick={() =>
                      setModalAnulacao({
                        aberto: false,
                        tipo: 'lote',
                        id: '',
                        identificadorVisual: '',
                        motivo: '',
                        submetendo: false,
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-[#16202B] text-xs text-[#93A3B5]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalAnulacao.submetendo || modalAnulacao.motivo.length < 10}
                    className="px-5 py-2 rounded-xl bg-[#EF4444] text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-colors hover:bg-[#dc2626]"
                  >
                    {modalAnulacao.submetendo ? 'Anulando Documento...' : 'Confirmar Anulação'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL REATIVAÇÃO DE PERITO SUSPENSO */}
        {modalReativarPerito.aberto && modalReativarPerito.perito && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl bg-[#111820] border-2 border-[#12B886] p-6 space-y-5 shadow-2xl">
              <div className="flex items-start justify-between border-b border-[rgba(244,247,250,0.1)] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#12B886]" />
                    <h3 className="font-heading font-extrabold text-lg text-[#F4F7FA]">
                      Reativação de Perito Credenciado
                    </h3>
                  </div>
                  <span className="text-xs text-[#93A3B5] mt-1 block">
                    {modalReativarPerito.perito.nome_completo} (
                    {modalReativarPerito.perito.conselho_tipo}{' '}
                    {modalReativarPerito.perito.registro_uf})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setModalReativarPerito({
                      aberto: false,
                      perito: null,
                      motivo: '',
                      novaValidadeArt: '',
                      submetendo: false,
                    })
                  }
                  className="text-[#93A3B5] hover:text-[#F4F7FA]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleExecutarReativacaoPerito} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#93A3B5] font-semibold mb-1">
                    Nova Data de Validade da ART
                  </label>
                  <input
                    type="date"
                    value={modalReativarPerito.novaValidadeArt}
                    onChange={(e) =>
                      setModalReativarPerito({
                        ...modalReativarPerito,
                        novaValidadeArt: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#93A3B5] font-semibold mb-1">
                    Motivo da Reativação / Parecer da Auditoria * (mínimo 5 caracteres)
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={5}
                    placeholder="Descreva a comprovação da renovação da ART pericial, certidão de regularidade do conselho..."
                    value={modalReativarPerito.motivo}
                    onChange={(e) =>
                      setModalReativarPerito({
                        ...modalReativarPerito,
                        motivo: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:border-[#12B886]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-[rgba(244,247,250,0.08)]">
                  <button
                    type="button"
                    onClick={() =>
                      setModalReativarPerito({
                        aberto: false,
                        perito: null,
                        motivo: '',
                        novaValidadeArt: '',
                        submetendo: false,
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-[#16202B] text-xs text-[#93A3B5]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      modalReativarPerito.submetendo || modalReativarPerito.motivo.length < 5
                    }
                    className="px-5 py-2 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-colors shadow-emerald-glow"
                  >
                    {modalReativarPerito.submetendo ? 'Reativando...' : 'Reativar Credenciamento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
