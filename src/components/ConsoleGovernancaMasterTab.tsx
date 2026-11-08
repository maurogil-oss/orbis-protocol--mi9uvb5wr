import React, { useState } from 'react'
import {
  ShieldAlert,
  UserCheck,
  UserX,
  Users,
  KeyRound,
  FileCheck2,
  AlertTriangle,
  RefreshCw,
  Search,
  Sliders,
  ShieldCheck,
  Building2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from 'lucide-react'
import {
  aprovarRecusarContaGestaoMaster,
  alterarPapelUsuarioMaster,
  redefinirSenhaUsuarioMaster,
  convidarMembroGestaoMaster,
} from '@/services/adminConsoleService'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  Check,
  Copy,
  Download,
  Database,
  UserPlus,
  Upload,
  FileSpreadsheet,
  XCircle,
} from 'lucide-react'
import {
  getCatalogoPericialCompleto,
  downloadCsvCatalogoPericial,
  gerarCsvCatalogoPericial,
} from '@/services/catalogoFatoresDmrvService'
import {
  parseCsvFatoresEmissao,
  importarFatoresCsvPocketBase,
  MODELO_EXEMPLO_CSV_FATORES,
  CABECALHO_CSV_FATORES_PADRAO,
  ResultadoParseCsvFatores,
  ResultadoImportacaoFatores,
} from '@/services/fatoresVersionadosService'
import {
  obterAcpCobrandingConfig,
  salvarAcpCobrandingConfig,
  TEXTO_ACP_COBRANDING_PADRAO,
  LOGO_ACP_COBRANDING_PADRAO,
  type AcpCobrandingConfig,
} from '@/services/platformSettingsService'
import { useEffect } from 'react'

interface ConsoleGovernancaMasterTabProps {
  usuarios: any[]
  onAtualizar: () => void
}

export const PAPEIS_PERMITIDOS_GOVERNANCA = [
  {
    id: 'admin',
    nome: 'Admin (Console Operacional)',
    desc: 'Opera cadastros, laudos e integrações; sem governança de acessos',
  },
  {
    id: 'admin_acp',
    nome: 'Administrador ACP (Parceria Comercial)',
    desc: 'Gestão institucional do piloto ACP, Bureau ACP e acesso restrito ao Painel ACP',
  },
  {
    id: 'controller',
    nome: 'Controller',
    desc: 'Leitura ampla: cobranças, comissões, dossiês e auditoria (sem escrita)',
  },
  {
    id: 'financeiro',
    nome: 'Financeiro',
    desc: 'Cobranças, liquidações com 4-olhos > R$ 5k, NFS-e e comissões',
  },
  {
    id: 'financeiro_leitor',
    nome: 'Financeiro Leitor',
    desc: 'Somente leitura financeira, métricas e reconciliação',
  },
  {
    id: 'perito',
    nome: 'Perito Técnico',
    desc: 'Lotes designados e laudos periciais que emite com ART',
  },
  {
    id: 'parceiro',
    nome: 'Parceiro Comercial',
    desc: 'Indicados vinculados e comissões de parceiro',
  },
  {
    id: 'cliente_acp',
    nome: 'Cliente ACP',
    desc: 'Painel, dMRV, selos, lotes + comissões de indicados',
  },
  {
    id: 'cliente',
    nome: 'Cliente / Empresa (ou Remover Admin)',
    desc: 'Diagnóstico, lotes, dossiês, selos, planos e cobranças próprias',
  },
]

export const ConsoleGovernancaMasterTab: React.FC<ConsoleGovernancaMasterTabProps> = ({
  usuarios,
  onAtualizar,
}) => {
  const { user, isMaster } = useAuth()
  const [busca, setBusca] = useState('')
  const [filtroPapel, setFiltroPapel] = useState('todos')
  const [processandoId, setProcessandoId] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  // Estado para Modal de Decisão de Aprovação de Conta Gestão
  const [modalAprovacao, setModalAprovacao] = useState<{
    aberto: boolean
    usuario: any | null
    decisao: 'aprovar' | 'recusar'
    papelDesignado: string
    justificativa: string
  }>({
    aberto: false,
    usuario: null,
    decisao: 'aprovar',
    papelDesignado: 'admin',
    justificativa: '',
  })

  // Estado para Modal de Alteração de Papel de Usuário
  const [modalAlterarPapel, setModalAlterarPapel] = useState<{
    aberto: boolean
    usuario: any | null
    novoPapel: string
    justificativa: string
  }>({
    aberto: false,
    usuario: null,
    novoPapel: 'cliente',
    justificativa: '',
  })

  // Estado para Modal de Redefinição de Senha de Usuário pelo Master
  const [modalRedefinirSenha, setModalRedefinirSenha] = useState<{
    aberto: boolean
    usuario: any | null
    senhaTemporaria: string | null
    copiado: boolean
  }>({
    aberto: false,
    usuario: null,
    senhaTemporaria: null,
    copiado: false,
  })

  // Estado para o Bloco / Formulário "Convidar Gestão"
  const { toast } = useToast()
  const [conviteNome, setConviteNome] = useState('')
  const [conviteEmail, setConviteEmail] = useState('')
  const [convitePapel, setConvitePapel] = useState<
    'admin' | 'controller' | 'financeiro' | 'financeiro_leitor'
  >('admin')
  const [conviteJustificativa, setConviteJustificativa] = useState('')
  const [convidando, setConvidando] = useState(false)
  const [conviteSucessoResultado, setConviteSucessoResultado] = useState<{
    email: string
    nome: string
    papel: string
    senhaTemporaria: string
    copiado: boolean
  } | null>(null)

  // Fatores de emissão canônicos e controle de exportação CSV
  const catalogoFatores = getCatalogoPericialCompleto()
  const { hashControle } = gerarCsvCatalogoPericial()
  const [copiouHashCsv, setCopiouHashCsv] = useState(false)

  // Estado para Co-branding ACP (Etapa 4 Peça 4b)
  const [cobrandingConfig, setCobrandingConfig] = useState<AcpCobrandingConfig>({
    ativo: false,
    texto: TEXTO_ACP_COBRANDING_PADRAO,
    logoUrl: LOGO_ACP_COBRANDING_PADRAO,
  })
  const [carregandoCobranding, setCarregandoCobranding] = useState(false)
  const [salvandoCobranding, setSalvandoCobranding] = useState(false)

  // Estado para confirmação rápida de atribuição/remoção do papel admin_acp
  const [confirmacaoAdminAcp, setConfirmacaoAdminAcp] = useState<{
    aberto: boolean
    usuario: any | null
    acao: 'atribuir' | 'remover'
  }>({
    aberto: false,
    usuario: null,
    acao: 'atribuir',
  })

  useEffect(() => {
    let ativo = true
    const carregar = async () => {
      setCarregandoCobranding(true)
      try {
        const cfg = await obterAcpCobrandingConfig()
        if (ativo) {
          setCobrandingConfig(cfg)
        }
      } catch {
        // Fallback já tratado no service
      } finally {
        if (ativo) setCarregandoCobranding(false)
      }
    }
    carregar()
    return () => {
      ativo = false
    }
  }, [])

  const handleSalvarCobranding = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvandoCobranding(true)
    try {
      const salvo = await salvarAcpCobrandingConfig(
        {
          ativo: cobrandingConfig.ativo,
          texto: cobrandingConfig.texto,
          logoUrl: cobrandingConfig.logoUrl,
        },
        user?.email || 'master',
      )
      setCobrandingConfig(salvo)
      toast({
        title: 'Co-branding ACP atualizado',
        description:
          'Configuração persistida com sucesso. O cabeçalho institucional e as telas ACP foram atualizados em tempo real.',
      })
      exibirFeedback('ok', 'Configurações de Co-branding ACP salvas e sincronizadas com sucesso.')
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar co-branding',
        description: err?.message || 'Falha ao gravar parâmetros de co-branding ACP.',
        variant: 'destructive',
      })
      exibirFeedback('erro', 'Falha ao salvar parâmetros de co-branding ACP.')
    } finally {
      setSalvandoCobranding(false)
    }
  }

  const handleToggleRapidoAdminAcp = (targetUser: any) => {
    if (targetUser.role === 'master') {
      toast({
        title: 'Operação Não Permitida',
        description: 'O papel Master não pode ser alterado.',
        variant: 'destructive',
      })
      return
    }
    if (targetUser.id === user?.id) {
      toast({
        title: 'Operação Não Permitida',
        description: 'Proteção anti-travamento: o Gestor Master não pode alterar o próprio papel.',
        variant: 'destructive',
      })
      return
    }

    const estaComoAdminAcp = targetUser.role === 'admin_acp'
    setConfirmacaoAdminAcp({
      aberto: true,
      usuario: targetUser,
      acao: estaComoAdminAcp ? 'remover' : 'atribuir',
    })
  }

  const executarToggleAdminAcp = async () => {
    if (!confirmacaoAdminAcp.usuario) return
    const target = confirmacaoAdminAcp.usuario
    const novoPapel = confirmacaoAdminAcp.acao === 'atribuir' ? 'admin_acp' : 'cliente'
    const justificativa =
      confirmacaoAdminAcp.acao === 'atribuir'
        ? 'Atribuição do papel Administrador ACP deliberada pela Governança Master para gestão do piloto ACP.'
        : 'Remoção do papel Administrador ACP deliberada pela Governança Master (retorno ao perfil cliente).'

    setProcessandoId(target.id)
    try {
      const res = await alterarPapelUsuarioMaster({
        userId: target.id,
        novoPapel,
        justificativa,
      })

      toast({
        title:
          confirmacaoAdminAcp.acao === 'atribuir'
            ? 'Papel admin_acp atribuído'
            : 'Papel admin_acp removido',
        description:
          confirmacaoAdminAcp.acao === 'atribuir'
            ? `O usuário ${target.email} agora tem acesso ao Painel ACP e ao Bureau ACP.`
            : `O usuário ${target.email} retornou ao papel 'cliente'.`,
      })
      exibirFeedback('ok', res.mensagem || 'Papel alterado e auditado com sucesso.')
      setConfirmacaoAdminAcp({ aberto: false, usuario: null, acao: 'atribuir' })
      onAtualizar()
    } catch (err: any) {
      toast({
        title: 'Erro na alteração de papel',
        description: err?.message || 'Falha ao alterar papel para admin_acp.',
        variant: 'destructive',
      })
      exibirFeedback('erro', err?.message || 'Falha ao alterar papel para admin_acp.')
    } finally {
      setProcessandoId(null)
    }
  }

  // Estado para Importação de Fatores via CSV (Etapa 3 Peça 3b)
  const [csvConteudo, setCsvConteudo] = useState('')
  const [previaCsv, setPreviaCsv] = useState<ResultadoParseCsvFatores | null>(null)
  const [importandoCsv, setImportandoCsv] = useState(false)
  const [resultadoImportacao, setResultadoImportacao] = useState<ResultadoImportacaoFatores | null>(
    null,
  )
  const [mostrarExemploCsv, setMostrarExemploCsv] = useState(false)

  const handleCarregarArquivoCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = (event.target?.result as string) || ''
      setCsvConteudo(text)
      const preview = parseCsvFatoresEmissao(text)
      setPreviaCsv(preview)
      setResultadoImportacao(null)
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleExecutarImportacaoCsv = async () => {
    if (!csvConteudo.trim()) return
    setImportandoCsv(true)
    try {
      const res = await importarFatoresCsvPocketBase(csvConteudo)
      setResultadoImportacao(res)
      if (res.sucesso) {
        toast({
          title: 'Importação concluída com sucesso',
          description: `${res.totalImportados} fator(es) foram gravados na tabela versionada.`,
        })
      } else {
        toast({
          title: 'Importação com pendências ou recusa',
          description: res.mensagem,
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Erro na importação',
        description: err?.message || 'Falha ao processar arquivo CSV.',
        variant: 'destructive',
      })
    } finally {
      setImportandoCsv(false)
    }
  }

  const handleBaixarModeloCsv = () => {
    const blob = new Blob([MODELO_EXEMPLO_CSV_FATORES], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modelo_fatores_emissao_acp.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownloadCsvFatores = () => {
    downloadCsvCatalogoPericial()
    exibirFeedback(
      'ok',
      'Arquivo catalogo_fatores_dmrv_dm_orb_001.csv gerado e baixado com sucesso.',
    )
  }

  const handleCopiarHashCsv = () => {
    navigator.clipboard.writeText(hashControle)
    setCopiouHashCsv(true)
    setTimeout(() => setCopiouHashCsv(false), 2000)
  }

  const exibirFeedback = (tipo: 'ok' | 'erro', texto: string) => {
    setMensagem({ tipo, texto })
    setTimeout(() => setMensagem(null), 5000)
  }

  // Contas Gestão que estão com status_aprovacao === 'pendente'
  const contasGestaoPendentes = usuarios.filter((u) => {
    const isPendente = u.status_aprovacao === 'pendente'
    // Usuários com perfil de gestão pendente
    return isPendente
  })

  // Usuários filtrados para a listagem de equipe/papéis
  const usuariosFiltrados = usuarios.filter((u) => {
    const matchBusca =
      !busca ||
      (u.email || '').toLowerCase().includes(busca.toLowerCase()) ||
      (u.name || '').toLowerCase().includes(busca.toLowerCase()) ||
      (u.id || '').toLowerCase().includes(busca.toLowerCase())

    const matchPapel = filtroPapel === 'todos' || u.role === filtroPapel
    return matchBusca && matchPapel
  })

  const abrirModalAprovar = (targetUser: any, decisao: 'aprovar' | 'recusar') => {
    setModalAprovacao({
      aberto: true,
      usuario: targetUser,
      decisao,
      papelDesignado: targetUser.role === 'admin' ? 'admin' : targetUser.role || 'admin',
      justificativa:
        decisao === 'aprovar'
          ? 'Cadastro corporativo de Gestão validado e homologado pelo Gestor Master.'
          : 'Cadastro corporativo não homologado pelo Gestor Master.',
    })
  }

  const confirmarDecisaoGestao = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalAprovacao.usuario) return
    setProcessandoId(modalAprovacao.usuario.id)

    try {
      const res = await aprovarRecusarContaGestaoMaster({
        userId: modalAprovacao.usuario.id,
        decisao: modalAprovacao.decisao,
        novoPapel: modalAprovacao.decisao === 'aprovar' ? modalAprovacao.papelDesignado : undefined,
        justificativa: modalAprovacao.justificativa,
      })

      exibirFeedback(
        'ok',
        res.mensagem || 'Decisão processada e registrada na trilha de auditoria.',
      )
      setModalAprovacao({
        aberto: false,
        usuario: null,
        decisao: 'aprovar',
        papelDesignado: 'admin',
        justificativa: '',
      })
      onAtualizar()
    } catch (err: any) {
      exibirFeedback('erro', err?.message || 'Falha ao processar homologação de conta.')
    } finally {
      setProcessandoId(null)
    }
  }

  const abrirModalMudarPapel = (targetUser: any) => {
    if (targetUser.role === 'master') {
      toast({
        title: 'Operação Não Permitida',
        description:
          'O usuário com papel Master não pode ter seu papel alterado por esta interface.',
        variant: 'destructive',
      })
      return
    }
    if (targetUser.id === user?.id) {
      toast({
        title: 'Operação Não Permitida',
        description: 'Proteção anti-travamento: o Gestor Master não pode alterar o próprio papel.',
        variant: 'destructive',
      })
      return
    }
    setModalAlterarPapel({
      aberto: true,
      usuario: targetUser,
      novoPapel: targetUser.role || 'cliente',
      justificativa: 'Alteração de atribuição funcional deliberada pela governança Master.',
    })
  }

  const abrirModalRedefinirSenha = (targetUser: any) => {
    setModalRedefinirSenha({
      aberto: true,
      usuario: targetUser,
      senhaTemporaria: null,
      copiado: false,
    })
  }

  const executarRedefinicaoSenhaMaster = async () => {
    if (!modalRedefinirSenha.usuario) return
    setProcessandoId(modalRedefinirSenha.usuario.id)

    try {
      const res = await redefinirSenhaUsuarioMaster({
        userId: modalRedefinirSenha.usuario.id,
      })
      setModalRedefinirSenha((prev) => ({
        ...prev,
        senhaTemporaria: res.senha_temporaria,
        copiado: false,
      }))
      exibirFeedback('ok', 'Senha temporária gerada e auditada com sucesso.')
    } catch (err: any) {
      exibirFeedback('erro', err?.message || 'Falha ao gerar nova senha para o usuário.')
    } finally {
      setProcessandoId(null)
    }
  }

  const copiarSenhaTemporaria = () => {
    if (!modalRedefinirSenha.senhaTemporaria) return
    navigator.clipboard.writeText(modalRedefinirSenha.senhaTemporaria)
    setModalRedefinirSenha((prev) => ({ ...prev, copiado: true }))
    setTimeout(() => {
      setModalRedefinirSenha((prev) => ({ ...prev, copiado: false }))
    }, 3000)
  }

  const confirmarMudancaPapel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalAlterarPapel.usuario) return

    // Proteção de segurança: NUNCA permitir promover a master
    if (modalAlterarPapel.novoPapel === 'master') {
      toast({
        title: 'Ação Proibida',
        description: "O papel 'master' NUNCA pode ser concedido por interface.",
        variant: 'destructive',
      })
      return
    }

    setProcessandoId(modalAlterarPapel.usuario.id)

    try {
      const res = await alterarPapelUsuarioMaster({
        userId: modalAlterarPapel.usuario.id,
        novoPapel: modalAlterarPapel.novoPapel,
        justificativa: modalAlterarPapel.justificativa,
      })

      exibirFeedback('ok', res.mensagem || 'Papel alterado e auditado com sucesso.')
      setModalAlterarPapel({
        aberto: false,
        usuario: null,
        novoPapel: 'cliente',
        justificativa: '',
      })
      onAtualizar()
    } catch (err: any) {
      exibirFeedback('erro', err?.message || 'Falha ao alterar papel.')
    } finally {
      setProcessandoId(null)
    }
  }

  const handleSubmeterConviteGestao = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanNome = conviteNome.trim()
    const cleanEmail = conviteEmail.trim().toLowerCase()

    if (!cleanNome) {
      toast({
        title: 'Nome Obrigatório',
        description: 'Por favor, informe o nome completo do membro de Gestão.',
        variant: 'destructive',
      })
      return
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast({
        title: 'E-mail Inválido',
        description: 'Por favor, informe um e-mail corporativo válido para o convite.',
        variant: 'destructive',
      })
      return
    }

    setConvidando(true)
    try {
      const res = await convidarMembroGestaoMaster({
        nome: cleanNome,
        email: cleanEmail,
        papelGestao: convitePapel,
        statusAprovacao: 'aprovado',
        justificativa:
          conviteJustificativa.trim() || 'Convite direto criado pelo Gestor Master no Console',
      })

      toast({
        title: 'Membro Convidado com Sucesso',
        description: res.mensagem || `Usuário ${cleanEmail} criado com papel ${convitePapel}.`,
      })

      setConviteSucessoResultado({
        email: res.credencial_inicial?.email || cleanEmail,
        nome: cleanNome,
        papel: convitePapel,
        senhaTemporaria: res.credencial_inicial?.senha_temporaria || '',
        copiado: false,
      })

      // Limpa os campos do formulário
      setConviteNome('')
      setConviteEmail('')
      setConvitePapel('admin')
      setConviteJustificativa('')
      onAtualizar()
    } catch (err: any) {
      toast({
        title: 'Falha ao Convidar Membro de Gestão',
        description: err?.message || 'Ocorreu um erro ao convidar membro de gestão.',
        variant: 'destructive',
      })
    } finally {
      setConvidando(false)
    }
  }

  const handleCopiarSenhaConvite = () => {
    if (!conviteSucessoResultado?.senhaTemporaria) return
    navigator.clipboard.writeText(conviteSucessoResultado.senhaTemporaria)
    setConviteSucessoResultado((prev) => (prev ? { ...prev, copiado: true } : null))
    toast({
      title: 'Senha Copiada',
      description: 'Senha temporária copiada para a área de transferência.',
    })
    setTimeout(() => {
      setConviteSucessoResultado((prev) => (prev ? { ...prev, copiado: false } : null))
    }, 3000)
  }

  if (!isMaster) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-red-500/40 text-center space-y-4 text-slate-900 dark:text-[#F8FAFC]">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-heading font-black text-lg text-slate-900 dark:text-[#F8FAFC]">
          Acesso Restrito ao Gestor Master
        </h3>
        <p className="text-xs text-slate-600 dark:text-[#94A3B8] max-w-md mx-auto">
          Esta aba é restrita exclusivamente ao papel <strong>master</strong> da plataforma.
          Administradores comuns operam o Console mas não possuem autorização para aprovar contas ou
          alterar papéis.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-900 dark:text-[#F8FAFC]">
      {/* Header da Aba */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-[#0E1A2E] dark:via-[#111827] dark:to-[#0E1A2E] border border-amber-300 dark:border-[#D9B36C]/40 shadow-xl space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#D9B36C]/20 border border-amber-300 dark:border-[#D9B36C]/50 text-amber-700 dark:text-[#D9B36C] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-3 h-3 text-amber-600 dark:text-[#D9B36C]" />
            GOVERNANÇA DE ACESSOS • GESTOR MASTER EXCLUSIVO
          </span>
          <span className="text-[11px] text-slate-600 dark:text-[#94A3B8] font-mono">
            Operador: <strong className="text-slate-900 dark:text-[#F8FAFC]">
              {user?.email}
            </strong>{' '}
            (Papel: master)
          </span>
        </div>
        <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-[#F8FAFC]">
          Painel de Governança Master & Controle de Papéis
        </h2>
        <p className="text-xs text-slate-600 dark:text-[#94A3B8] max-w-4xl leading-relaxed">
          Área privativa do Gestor Master. Somente este papel possui prerrogativa de homologar
          cadastros corporativos de Gestão pendentes e alterar níveis de acesso de usuários. Todas
          as ações gravam na trilha imutável <code>audit_log</code> com identificação e timestamp.
        </p>
      </div>

      {/* Alerta de Feedback */}
      {mensagem && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            mensagem.tipo === 'ok'
              ? 'bg-emerald-50 dark:bg-[#059669]/15 border-emerald-300 dark:border-[#059669] text-emerald-800 dark:text-[#059669]'
              : 'bg-red-500/10 border-red-500 text-red-500'
          }`}
        >
          <span>{mensagem.texto}</span>
          <button
            type="button"
            onClick={() => setMensagem(null)}
            className="underline font-bold ml-4"
          >
            fechar
          </button>
        </div>
      )}

      {/* BLOCO NOVO: CONVIDAR GESTÃO (EXCLUSIVO GESTOR MASTER) */}
      <div
        data-testid="bloco-convidar-gestao"
        className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border-2 border-emerald-500/40 dark:border-[#12B886]/40 space-y-5 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-[#12B886]/10 text-emerald-700 dark:text-[#12B886]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-[#F8FAFC]">
                Convidar Gestão
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-[#94A3B8]">
                Criação direta de colaborador interno no perfil de Gestão com senha temporária
                gerada.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-[#12B886]/20 border border-emerald-300 dark:border-[#12B886]/50 text-emerald-800 dark:text-[#12B886] text-[10px] font-mono font-bold uppercase tracking-wider w-fit">
            Apenas Gestor Master
          </span>
        </div>

        {/* Formulário Convidar Gestão */}
        <form onSubmit={handleSubmeterConviteGestao} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="convite-nome-input"
                className="block text-slate-600 dark:text-[#94A3B8] font-semibold mb-1"
              >
                Nome Completo do Colaborador *
              </label>
              <input
                id="convite-nome-input"
                type="text"
                required
                placeholder="Ex: Carlos Eduardo de Castro"
                value={conviteNome}
                onChange={(e) => setConviteNome(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="convite-email-input"
                className="block text-slate-600 dark:text-[#94A3B8] font-semibold mb-1"
              >
                E-mail Corporativo *
              </label>
              <input
                id="convite-email-input"
                type="email"
                required
                placeholder="colaborador@orbis-protocol.com"
                value={conviteEmail}
                onChange={(e) => setConviteEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="convite-papel-select"
                className="block text-slate-600 dark:text-[#94A3B8] font-semibold mb-1"
              >
                Papel Interno de Gestão *
              </label>
              <select
                id="convite-papel-select"
                value={convitePapel}
                onChange={(e) =>
                  setConvitePapel(
                    e.target.value as 'admin' | 'controller' | 'financeiro' | 'financeiro_leitor',
                  )
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              >
                <option value="admin">admin — Operação geral do Console (sem governança)</option>
                <option value="controller">controller — Leitura ampla e auditoria</option>
                <option value="financeiro">
                  financeiro — Faturamento, conciliação e liquidação
                </option>
                <option value="financeiro_leitor">
                  financeiro_leitor — Somente consulta financeira
                </option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="convite-justificativa-input"
              className="block text-slate-600 dark:text-[#94A3B8] font-semibold mb-1"
            >
              Justificativa / Motivo do Convite (Trilha de Auditoria)
            </label>
            <input
              id="convite-justificativa-input"
              type="text"
              placeholder="Ex: Novo colaborador contratado para a controladoria financeira"
              value={conviteJustificativa}
              onChange={(e) => setConviteJustificativa(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
              * A conta nasce homologada com senha temporária forte para entrega segura.
            </span>
            <button
              type="submit"
              disabled={convidando}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 dark:bg-[#12B886] dark:hover:bg-[#0CA678] text-white dark:text-[#0A0E12] transition-all flex items-center gap-2 shadow-emerald-glow disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{convidando ? 'Criando Conta...' : 'Convidar e Gerar Acesso'}</span>
            </button>
          </div>
        </form>

        {/* Card de Senha Temporária Gerada após Sucesso */}
        {conviteSucessoResultado && (
          <div
            data-testid="resultado-convite-gestao"
            className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border-2 border-emerald-400 dark:border-[#12B886] space-y-3 animate-fade-in"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 dark:bg-[#12B886]/20 text-emerald-800 dark:text-[#12B886]">
                  <Check className="w-3 h-3" /> Conta de Gestão Criada com Sucesso
                </span>
                <p className="text-xs text-slate-700 dark:text-[#F8FAFC] font-medium">
                  Colaborador <strong>{conviteSucessoResultado.nome}</strong> (
                  {conviteSucessoResultado.email}) cadastrado no papel{' '}
                  <strong className="text-blue-600 dark:text-[#60A5FA]">
                    {conviteSucessoResultado.papel}
                  </strong>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConviteSucessoResultado(null)}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-[#F8FAFC]"
                title="Fechar resumo"
              >
                ✕
              </button>
            </div>

            {/* Senha Temporária e Instrução de Primeiro Acesso */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] uppercase font-mono font-semibold text-slate-500 dark:text-[#94A3B8] block">
                  Senha Temporária Inicial Gerada:
                </span>
                <span className="font-mono text-sm sm:text-base font-bold text-amber-700 dark:text-[#D9B36C] select-all break-all">
                  {conviteSucessoResultado.senhaTemporaria}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopiarSenhaConvite}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-all ${
                  conviteSucessoResultado.copiado
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 dark:bg-[#12B886]/20 text-emerald-700 dark:text-[#12B886] border border-emerald-300 dark:border-[#12B886]/40 hover:bg-emerald-100'
                }`}
              >
                {conviteSucessoResultado.copiado ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Senha</span>
                  </>
                )}
              </button>
            </div>

            {/* Instrução explícita de troca no primeiro acesso */}
            <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-[#D9B36C]/10 border border-amber-300/80 dark:border-[#D9B36C]/30 text-[11px] text-amber-900 dark:text-[#D9B36C] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Instrução Obrigatória de Primeiro Acesso:</span>
              </div>
              <p className="leading-relaxed">
                Envie esta credencial temporária ao colaborador de forma segura. O colaborador deve
                acessar a plataforma e{' '}
                <strong>obrigatoriamente realizar a troca de senha no primeiro acesso</strong>{' '}
                através do menu de usuário ou pela tela de redefinição de credenciais corporativas.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* BLOCO ACP: CONTROLE DO CO-BRANDING ACP (ETAPA 4 PEÇA 4b) */}
      <div
        data-testid="bloco-controle-cobranding-acp"
        className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border-2 border-blue-500/40 dark:border-[#3B82F6]/40 space-y-5 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-[#3B82F6]/10 text-blue-600 dark:text-[#60A5FA]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-[#F8FAFC]">
                  Co-branding ACP (Parceria Comercial)
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                    cobrandingConfig.ativo
                      ? 'bg-emerald-50 dark:bg-[#059669]/20 text-emerald-700 dark:text-[#059669] border-emerald-300 dark:border-[#059669]/40'
                      : 'bg-slate-100 dark:bg-[#111827] text-slate-500 dark:text-[#94A3B8] border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {cobrandingConfig.ativo ? 'ATIVO NO CABEÇALHO' : 'DESATIVADO'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] mt-0.5">
                Configuração persistida em <code>platform_settings</code> (chave{' '}
                <code>acp_cobranding</code>). Sincronizada em tempo real com o cabeçalho
                institucional e as telas do piloto ACP.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-[#3B82F6]/20 border border-blue-300 dark:border-[#3B82F6]/50 text-blue-700 dark:text-[#60A5FA] text-[10px] font-mono font-bold uppercase tracking-wider w-fit">
            Piloto ACP • Master
          </span>
        </div>

        <form onSubmit={handleSalvarCobranding} className="space-y-4 text-xs">
          {/* Toggle Ativar / Desativar */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">
                Exibir Co-branding Institucional ACP
              </span>
              <span className="text-[11px] text-slate-600 dark:text-[#94A3B8]">
                Quando ativo, insere a chancela da Associação Comercial do Paraná no cabeçalho e
                destaca a parceria nas telas do convênio.
              </span>
            </div>

            <button
              type="button"
              data-testid="toggle-acp-cobranding"
              onClick={() => setCobrandingConfig((prev) => ({ ...prev, ativo: !prev.ativo }))}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all shrink-0 ${
                cobrandingConfig.ativo
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-200 dark:bg-[#111827] text-slate-700 dark:text-[#94A3B8] border-slate-300 dark:border-slate-700'
              }`}
            >
              {cobrandingConfig.ativo ? (
                <>
                  <ToggleRight className="w-4 h-4 text-white" />
                  <span>Co-branding Ativado</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                  <span>Co-branding Desativado</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo de Texto da Parceria */}
            <div>
              <label
                htmlFor="acp-cobranding-texto-input"
                className="block text-slate-600 dark:text-[#94A3B8] font-semibold mb-1"
              >
                Texto da Parceria (padrão oficial) *
              </label>
              <input
                id="acp-cobranding-texto-input"
                type="text"
                required
                value={cobrandingConfig.texto}
                onChange={(e) =>
                  setCobrandingConfig((prev) => ({ ...prev, texto: e.target.value }))
                }
                placeholder="em parceria com a Associação Comercial do Paraná"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
              <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-1">
                Padrão: <code>{TEXTO_ACP_COBRANDING_PADRAO}</code>
              </p>
            </div>

            {/* Campo URL do Logo */}
            <div>
              <label
                htmlFor="acp-cobranding-logo-input"
                className="block text-slate-600 dark:text-[#94A3B8] font-semibold mb-1"
              >
                URL do Logo ACP (opcional)
              </label>
              <input
                id="acp-cobranding-logo-input"
                type="url"
                value={cobrandingConfig.logoUrl || ''}
                onChange={(e) =>
                  setCobrandingConfig((prev) => ({ ...prev, logoUrl: e.target.value }))
                }
                placeholder="https://... ou caminho relativo do logotipo"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
              <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-1">
                Se vazio, a plataforma renderiza o badge tipográfico institucional ACP.
              </p>
            </div>
          </div>

          {/* Pré-visualização da Chancela */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-dashed border-slate-300 dark:border-slate-700 text-[11px] space-y-1">
            <span className="font-semibold text-slate-500 dark:text-[#94A3B8] block uppercase text-[10px]">
              Pré-visualização da Chancela no Cabeçalho:
            </span>
            <div className="flex items-center gap-2 pt-1">
              <span className="font-heading font-black text-xs text-slate-900 dark:text-[#F8FAFC]">
                ORBIS PROTOCOL
              </span>
              <span className="text-slate-400">•</span>
              {cobrandingConfig.ativo ? (
                <span className="text-blue-700 dark:text-[#60A5FA] font-medium flex items-center gap-1.5">
                  {cobrandingConfig.logoUrl && (
                    <img
                      src={cobrandingConfig.logoUrl}
                      alt="Logo ACP"
                      className="h-4 w-auto object-contain inline"
                      onError={(e) => {
                        // Oculta imagem quebrada
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                  )}
                  <span>{cobrandingConfig.texto}</span>
                </span>
              ) : (
                <span className="text-slate-400 italic">(chancela desativada)</span>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              data-testid="btn-salvar-cobranding-acp"
              disabled={salvandoCobranding || carregandoCobranding}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Building2 className="w-4 h-4" />
              <span>
                {salvandoCobranding ? 'Salvando Co-branding...' : 'Salvar Co-branding ACP'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* BLOCO 1: FILA DE CONTAS GESTÃO PENDENTES DE APROVAÇÃO */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-[#D9B36C]/10 text-amber-700 dark:text-[#D9B36C]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F8FAFC]">
                Fila de Contas Gestão Pendentes de Aprovação ({contasGestaoPendentes.length})
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-[#94A3B8]">
                Contas corporativas que selecionaram perfil "Gestão" no cadastro público e aguardam
                homologação.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAtualizar}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar Fila</span>
          </button>
        </div>

        {contasGestaoPendentes.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-[#94A3B8]">
            Nenhuma conta de Gestão pendente de aprovação no momento. A fila está em dia.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contasGestaoPendentes.map((pend) => (
              <div
                key={pend.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-amber-300 dark:border-[#D9B36C]/40 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-50 dark:bg-[#D9B36C]/20 text-amber-700 dark:text-[#D9B36C]">
                      Pendente de Validação
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] font-mono">
                      {new Date(pend.created).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <strong className="text-sm text-slate-900 dark:text-[#F8FAFC] block truncate">
                    {pend.name || pend.email}
                  </strong>
                  <div className="text-[11px] text-slate-600 dark:text-[#94A3B8] font-mono break-all">
                    {pend.email}
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-[#94A3B8]">
                    Papel solicitado:{' '}
                    <strong className="text-blue-600 dark:text-[#2563EB]">
                      {pend.role || 'admin'}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={processandoId === pend.id}
                    onClick={() => abrirModalAprovar(pend, 'aprovar')}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-[#059669] dark:hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Aprovar</span>
                  </button>
                  <button
                    type="button"
                    disabled={processandoId === pend.id}
                    onClick={() => abrirModalAprovar(pend, 'recusar')}
                    className="py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-300 dark:border-red-500/40 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Recusar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BLOCO 2: LISTA DE USUÁRIOS DO TIME POR PAPEL COM STATUS */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-[#2563EB]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F8FAFC]">
                Equipe & Usuários por Papel ({usuariosFiltrados.length} de {usuarios.length})
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-[#94A3B8]">
                Listagem completa de contas, status de homologação e gestão direta de papéis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#94A3B8] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar e-mail, nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-[#F8FAFC] w-44 sm:w-56"
              />
            </div>
            <select
              value={filtroPapel}
              onChange={(e) => setFiltroPapel(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-[#F8FAFC]"
            >
              <option value="todos">Todos os Papéis</option>
              <option value="master">master</option>
              <option value="admin">admin</option>
              <option value="admin_acp">admin_acp</option>
              <option value="controller">controller</option>
              <option value="financeiro">financeiro</option>
              <option value="financeiro_leitor">financeiro_leitor</option>
              <option value="perito">perito</option>
              <option value="cliente_acp">cliente_acp</option>
              <option value="parceiro">parceiro</option>
              <option value="cliente">cliente</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {usuariosFiltrados.map((u) => {
            const isUserMaster = u.role === 'master'
            const badgeCor =
              u.role === 'master'
                ? 'bg-amber-50 dark:bg-[#D9B36C]/20 text-amber-700 dark:text-[#D9B36C] border-amber-300 dark:border-[#D9B36C]/40'
                : u.role === 'admin'
                  ? 'bg-red-500/10 text-red-600 border-red-300 dark:border-[#EF4444]/40'
                  : u.role === 'admin_acp'
                    ? 'bg-blue-500/10 text-blue-600 border-blue-300 dark:border-[#3B82F6]/40'
                    : u.role === 'controller'
                      ? 'bg-purple-500/10 text-purple-600 border-purple-300 dark:border-[#A855F7]/40'
                      : u.role === 'financeiro'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:border-[#10B981]/40'
                        : u.role === 'financeiro_leitor'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-300 dark:border-[#D9B36C]/20'
                          : u.role === 'perito'
                            ? 'bg-cyan-500/10 text-cyan-600 border-cyan-300 dark:border-[#06B6D4]/40'
                            : u.role === 'parceiro'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-300 dark:border-[#F59E0B]/40'
                              : u.role === 'cliente_acp'
                                ? 'bg-amber-500/10 text-amber-700 dark:text-[#D9B36C] border-amber-300 dark:border-[#D9B36C]/30'
                                : 'bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] border-slate-200 dark:border-slate-800'

            return (
              <div
                key={u.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-slate-900 dark:text-[#F8FAFC] truncate max-w-[220px]">
                      {u.name || '(Sem nome)'}
                    </strong>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${badgeCor}`}
                    >
                      {u.role || 'cliente'}
                    </span>
                    {u.status_aprovacao && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${
                          u.status_aprovacao === 'pendente'
                            ? 'bg-amber-50 dark:bg-[#D9B36C]/20 text-amber-700 dark:text-[#D9B36C]'
                            : u.status_aprovacao === 'aprovado'
                              ? 'bg-emerald-50 dark:bg-[#059669]/20 text-emerald-700 dark:text-[#059669]'
                              : 'bg-red-500/10 text-red-600'
                        }`}
                      >
                        {u.status_aprovacao}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-[#94A3B8] font-mono truncate">
                    {u.email}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-[#94A3B8]/70">
                    Cadastrado em {new Date(u.created).toLocaleDateString('pt-BR')} • ID: {u.id}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isUserMaster ? (
                    <span className="text-[11px] text-amber-600 dark:text-[#D9B36C] font-mono italic">
                      👑 Gestor Master Raiz
                    </span>
                  ) : (
                    <>
                      {/* Botão rápido para atribuir / remover papel admin_acp */}
                      <button
                        type="button"
                        data-testid={`btn-toggle-admin-acp-${u.id}`}
                        disabled={processandoId === u.id}
                        onClick={() => handleToggleRapidoAdminAcp(u)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          u.role === 'admin_acp'
                            ? 'bg-blue-50 dark:bg-[#3B82F6]/20 text-blue-700 dark:text-[#60A5FA] border-blue-300 dark:border-[#3B82F6]/40 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                            : 'bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-[#94A3B8] border-slate-200 dark:border-slate-800 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:text-[#60A5FA]'
                        }`}
                        title={
                          u.role === 'admin_acp'
                            ? 'Remover papel admin_acp deste usuário'
                            : 'Atribuir papel admin_acp (Acesso ao Painel e Bureau ACP)'
                        }
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>
                          {u.role === 'admin_acp' ? 'Remover Admin ACP' : 'Tornar Admin ACP'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={processandoId === u.id}
                        onClick={() => abrirModalRedefinirSenha(u)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#111827] hover:bg-amber-500 hover:text-slate-900 dark:hover:bg-[#D9B36C] dark:hover:text-[#0A1628] text-xs font-bold text-amber-700 dark:text-[#D9B36C] border border-amber-300 dark:border-[#D9B36C]/40 transition-all flex items-center gap-1.5"
                        title="Gerar senha temporária forte para este usuário"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Redefinir Senha</span>
                      </button>
                      <button
                        type="button"
                        disabled={processandoId === u.id}
                        onClick={() => abrirModalMudarPapel(u)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#111827] hover:bg-emerald-600 hover:text-white dark:hover:bg-[#2563EB] text-xs font-bold text-emerald-700 dark:text-[#2563EB] border border-emerald-300 dark:border-[#2563EB]/40 transition-all flex items-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Alterar Papel</span>
                      </button>
                    </>
                  )}{' '}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* BLOCO 2.5: CATÁLOGO PERICIAL DE FATORES DE EMISSÃO (dMRV DM-ORB-001) - EXCLUSIVO GESTOR MASTER */}
      <div
        data-testid="bloco-catalogo-pericial-fatores"
        className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border-2 border-emerald-500/40 dark:border-[#12B886]/40 space-y-5 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-[#12B886]/20 border border-emerald-300 dark:border-[#12B886]/50 text-emerald-800 dark:text-[#12B886] text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
              <Database className="w-3 h-3 text-emerald-600 dark:text-[#12B886]" />
              dMRV DM-ORB-001 v1.1 • AUDITORIA PERICIAL
            </div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-[#F8FAFC]">
              Catálogo Pericial de Fatores de Emissão (dMRV DM-ORB-001)
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] max-w-3xl mt-0.5 leading-relaxed">
              Repositório oficial dos fatores de emissão canônicos, incertezas analíticas u_FE,
              tiers e fontes homologadas. O acesso e a exportação deste inventário são restritos
              privativamente ao Gestor Master para salvaguarda do segredo industrial metodológico e
              auditoria externa.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadCsvFatores}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 dark:bg-[#12B886] dark:hover:bg-[#0CA678] text-white dark:text-[#0A0E12] transition-all flex items-center justify-center gap-2 shadow-emerald-glow"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV Pericial</span>
            </button>
          </div>
        </div>

        {/* Banner de Hash de Controle das Linhas */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-emerald-300/60 dark:border-[#12B886]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-[#94A3B8] block">
              Hash de Controle Integral do Catálogo (Anti-Adulteração):
            </span>
            <span className="font-mono text-xs text-emerald-700 dark:text-[#12B886] font-bold break-all">
              {hashControle}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopiarHashCsv}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-[#F8FAFC] hover:border-emerald-500 transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            {copiouHashCsv ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#12B886]" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Hash</span>
              </>
            )}
          </button>
        </div>

        {/* Tabela Completa do Catálogo Pericial */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0A1628] border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-[#94A3B8] uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-3">Categoria / Grupo</th>
                <th className="py-3 px-3">Material / Subsistema</th>
                <th className="py-3 px-3 text-right">Fator (kgCO₂e/kg)</th>
                <th className="py-3 px-3 text-right">Incerteza (u_FE)</th>
                <th className="py-3 px-3">Tier Metodológico</th>
                <th className="py-3 px-3">Fonte e Ano Canônico</th>
                <th className="py-3 px-3 text-center">Situação Auditoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#0E1A2E] text-slate-800 dark:text-[#F8FAFC]">
              {catalogoFatores.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 dark:hover:bg-[#111827]/60 transition-colors"
                >
                  <td className="py-2.5 px-3">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-[#94A3B8]">
                      {item.categoria}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium">
                    <div>{item.material}</div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-[#64748B]">
                      ID: {item.id}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700 dark:text-[#D9B36C]">
                    {item.fator.toFixed(2)} {item.unidade}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-[#94A3B8]">
                    {item.incertezaFormatada}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-[11px] text-blue-600 dark:text-[#60A5FA]">
                      {item.tier}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-600 dark:text-[#94A3B8]">
                    <div>{item.fonte}</div>
                    <div className="text-[10px] text-slate-500">Ano: {item.ano}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.pendenteVerificacao ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-700 dark:text-[#D9B36C] border border-amber-500/40">
                        Pendente de verificação
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-800 dark:text-[#12B886] border border-emerald-500/40">
                        Homologado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-[#94A3B8] pt-2 border-t border-slate-200 dark:border-slate-800 font-mono">
          <span>Total de registros homologados no motor: {catalogoFatores.length}</span>
          <span>Arquivo CSV canônico: catalogo_fatores_dmrv_dm_orb_001.csv</span>
        </div>

        {/* SUB-BLOCO: IMPORTAÇÃO DE FATORES VERSIONADOS VIA CSV (ETAPA 3 PEÇA 3b) */}
        <div
          data-testid="secao-importacao-csv-fatores"
          className="mt-6 p-5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-emerald-300 dark:border-[#12B886]/40 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-[#12B886]" />
                <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                  Importação de Fatores de Emissão Versionados (CSV)
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-0.5">
                Regra rígida de governança: campos obrigatórios registrados com versão (fonte, ano,
                escopo, geografia, unidade, validade).
                <strong> Linhas sem fonte são estritamente recusadas</strong> e nenhum fator sem
                fonte homologada entra na tabela.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleBaixarModeloCsv}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Modelo CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setMostrarExemploCsv(!mostrarExemploCsv)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-[#12B886] hover:underline"
              >
                {mostrarExemploCsv ? 'Ocultar Estrutura' : 'Ver Colunas Aceitas'}
              </button>
            </div>
          </div>

          {mostrarExemploCsv && (
            <div className="p-3 rounded-lg bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-[11px] font-mono space-y-2">
              <div className="text-slate-700 dark:text-[#F8FAFC] font-bold">
                Cabeçalho padrão esperado:
              </div>
              <div className="p-2 rounded bg-slate-100 dark:bg-[#0A1628] text-slate-800 dark:text-emerald-400 select-all overflow-x-auto">
                {CABECALHO_CSV_FATORES_PADRAO}
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[10px]">
                Campos obrigatórios: <code>codigo</code>, <code>fator</code>, <code>fonte</code>.
                Colunas adicionais versionadas: <code>ano</code>, <code>escopo</code>,{' '}
                <code>geografia</code>, <code>unidade</code>, <code>validade</code>,{' '}
                <code>versao</code>, <code>incerteza_pct</code>, <code>tier</code>,{' '}
                <code>descricao</code>.
              </div>
            </div>
          )}

          {/* Upload do Arquivo CSV */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleCarregarArquivoCsv}
                className="hidden"
                data-testid="input-csv-fatores"
              />
              <div className="p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl bg-white dark:bg-[#0E1A2E] text-center text-xs text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600 dark:text-[#12B886]" />
                <span>
                  {csvConteudo
                    ? 'Arquivo carregado. Clique para trocar de arquivo'
                    : 'Selecionar arquivo CSV no seu computador'}
                </span>
              </div>
            </label>

            <button
              type="button"
              disabled={!previaCsv || previaCsv.totalAceitas === 0 || importandoCsv}
              onClick={handleExecutarImportacaoCsv}
              className="px-5 py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center gap-2 shrink-0 shadow-emerald-glow"
              data-testid="btn-importar-fatores-csv"
            >
              {importandoCsv ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Gravar Fatores Validados</span>
                </>
              )}
            </button>
          </div>

          {/* Prévia da Análise do CSV */}
          {previaCsv && (
            <div className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">
                  Diagnóstico do Arquivo CSV:
                </span>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-slate-600 dark:text-slate-400">
                    Lidas: <strong>{previaCsv.totalLinhasLidas}</strong>
                  </span>
                  <span className="text-emerald-700 dark:text-[#12B886]">
                    Válidas: <strong>{previaCsv.totalAceitas}</strong>
                  </span>
                  <span className="text-rose-600 dark:text-rose-400">
                    Recusadas: <strong>{previaCsv.totalRecusadas}</strong>
                  </span>
                </div>
              </div>

              {/* Tabela de erros de validação (ex: linha sem fonte) */}
              {previaCsv.erros.length > 0 && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Linhas Rejeitadas pela Governança (Nenhum fator entra sem fonte homologada):
                    </span>
                  </div>
                  <ul className="text-[11px] text-rose-700 dark:text-rose-300/90 list-disc list-inside space-y-1">
                    {previaCsv.erros.map((err, idx) => (
                      <li key={idx} className="font-mono">
                        {err.motivo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lista dos fatores validados prontos para entrar */}
              {previaCsv.fatoresValidos.length > 0 && (
                <div className="overflow-x-auto max-h-48 rounded border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 dark:bg-[#0A1628] text-slate-500 uppercase text-[9px] font-bold">
                      <tr>
                        <th className="py-1.5 px-2">Código</th>
                        <th className="py-1.5 px-2">Material</th>
                        <th className="py-1.5 px-2">Fator</th>
                        <th className="py-1.5 px-2">Unidade</th>
                        <th className="py-1.5 px-2">Fonte</th>
                        <th className="py-1.5 px-2">Ano</th>
                        <th className="py-1.5 px-2">Escopo</th>
                        <th className="py-1.5 px-2">Validade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previaCsv.fatoresValidos.map((f, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#111827]">
                          <td className="py-1 px-2 font-mono">{f.codigo}</td>
                          <td className="py-1 px-2">{f.material}</td>
                          <td className="py-1 px-2 font-mono font-bold text-emerald-700 dark:text-[#12B886]">
                            {f.fator}
                          </td>
                          <td className="py-1 px-2">{f.unidade}</td>
                          <td className="py-1 px-2">{f.fonte}</td>
                          <td className="py-1 px-2 font-mono">{f.ano}</td>
                          <td className="py-1 px-2">{f.escopo}</td>
                          <td className="py-1 px-2">{f.validade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Feedback do Resultado da Gravação */}
          {resultadoImportacao && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold ${
                resultadoImportacao.sucesso
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300'
              }`}
            >
              {resultadoImportacao.mensagem}
            </div>
          )}
        </div>
      </div>

      {/* BLOCO 3: MATRIZ DE ACESSO POR NÍVEL DE GOVERNANÇA */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-[#059669]/10 text-emerald-700 dark:text-[#059669]">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F8FAFC]">
              Matriz de Acesso por Nível (Governança Orbis Protocol)
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-[#94A3B8]">
              Especificação institucional dos privilégios de cada papel conforme a arquitetura de
              segurança da plataforma.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-slate-900 dark:text-[#F8FAFC]">Cliente</strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8]">
                cliente
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Diagnóstico SBCE, lotes próprios de desmontagem, emissão de dossiês, selos de lastro
              circular, contratação de planos e gestão das suas cobranças próprias.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-amber-700 dark:text-[#D9B36C]">Cliente ACP</strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-[#D9B36C]/20 text-amber-700 dark:text-[#D9B36C]">
                cliente_acp
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Todos os privilégios de Cliente + identificador <code>ORB-ACP</code> + acompanhamento
              e recebimento de comissões por empresas indicadas no Paraná.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-amber-600 dark:text-[#F59E0B]">Parceiro</strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-[#F59E0B]/20 text-amber-700 dark:text-[#F59E0B]">
                parceiro
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Acesso ao painel de parceiro (<code>/parceiro</code>), link de indicação, lista de
              clientes indicados e comissões com anexação de nota/RPA.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-cyan-700 dark:text-[#06B6D4]">Perito Técnico</strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-[#06B6D4]/20 text-cyan-700 dark:text-[#06B6D4]">
                perito
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Acesso aos lotes designados e dossiês que emite sob chancela CREA/CRC com número de
              ART/RRT homologado pelo auditor.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-emerald-700 dark:text-[#10B981]">Financeiro</strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-[#10B981]/20 text-emerald-700 dark:text-[#10B981]">
                financeiro
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Gestão de cobranças, emissão de NFS-e, conciliação e liquidação manual com regra de
              quatro-olhos obrigatória para valores acima de R$ 5.000,00.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-amber-700 dark:text-[#D9B36C]">
                Financeiro Leitor
              </strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-[#D9B36C]/10 text-amber-700 dark:text-[#D9B36C]">
                financeiro_leitor
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Apenas consulta aos módulos de faturamento, métricas e relatórios financeiros, sem
              permissão para liquidar cobranças ou alterar cadastros.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-purple-700 dark:text-[#A855F7]">Controller</strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-50 dark:bg-[#A855F7]/20 text-purple-700 dark:text-[#A855F7]">
                controller
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Leitura ampla institucional: cobranças, comissões, dossiês técnicos e trilha de
              auditoria completa, sem privilégio de escrita ou mutação de registros.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-red-600 dark:text-[#EF4444]">
                Admin Operacional
              </strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 border border-red-300 dark:border-[#EF4444]/20">
                admin
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Operação diária do Console (clientes, lotes, peças, catálogo de preços, parâmetros).{' '}
              <strong>Não pode</strong> homologar cadastros de Gestão nem alterar papéis de ninguém.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-gradient-to-br dark:from-[#111827] dark:to-[#0A1628] border-2 border-amber-400 dark:border-[#D9B36C] space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-amber-700 dark:text-[#D9B36C] flex items-center gap-1">
                <span>👑</span> Gestor Master
              </strong>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-400 dark:bg-[#D9B36C] text-slate-900 dark:text-[#0A1628] font-bold">
                master
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-[#F8FAFC] leading-relaxed">
              Acesso irrestrito a todas as operações + governança privativa de acessos
              (aprovação/recusa de contas Gestão e alteração de papéis).{' '}
              <em>Atribuível apenas diretamente no banco</em>.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL DECISÃO DE CONTA GESTÃO PENDENTE */}
      {modalAprovacao.aberto && modalAprovacao.usuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0E1A2E] border-2 border-amber-400 dark:border-[#D9B36C] p-6 space-y-4 shadow-2xl text-slate-900 dark:text-[#F8FAFC]">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-[#F8FAFC]">
                  {modalAprovacao.decisao === 'aprovar'
                    ? 'Homologar Conta de Gestão'
                    : 'Recusar Conta de Gestão'}
                </h3>
                <span className="text-xs text-slate-600 dark:text-[#94A3B8] mt-0.5 block">
                  {modalAprovacao.usuario.name || modalAprovacao.usuario.email} (
                  {modalAprovacao.usuario.email})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalAprovacao({ ...modalAprovacao, aberto: false })}
                className="text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={confirmarDecisaoGestao} className="space-y-4 text-xs">
              {modalAprovacao.decisao === 'aprovar' && (
                <div>
                  <label className="block text-slate-600 dark:text-[#94A3B8] font-semibold mb-1">
                    Definir Papel no Console *
                  </label>
                  <select
                    value={modalAprovacao.papelDesignado}
                    onChange={(e) =>
                      setModalAprovacao({ ...modalAprovacao, papelDesignado: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC]"
                  >
                    <option value="admin">Admin (Console Operacional)</option>
                    <option value="controller">Controller (Leitura Ampla)</option>
                    <option value="financeiro">Financeiro (Operação & Faturamento)</option>
                    <option value="financeiro_leitor">Financeiro Leitor (Somente Consulta)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-1">
                    * O papel 'master' não pode ser selecionado aqui — apenas atribuído no banco.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-slate-600 dark:text-[#94A3B8] font-semibold mb-1">
                  Justificativa Formal para Trilha de Auditoria *
                </label>
                <textarea
                  rows={3}
                  required
                  value={modalAprovacao.justificativa}
                  onChange={(e) =>
                    setModalAprovacao({ ...modalAprovacao, justificativa: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-amber-400 dark:focus:border-[#D9B36C]"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-[#94A3B8] space-y-1">
                <div>
                  • Decisão:{' '}
                  <strong className="text-slate-900 dark:text-[#F8FAFC] uppercase">
                    {modalAprovacao.decisao}
                  </strong>
                </div>
                <div>
                  • Responsável:{' '}
                  <strong className="text-amber-700 dark:text-[#D9B36C]">{user?.email}</strong>{' '}
                  (master)
                </div>
                <div>
                  • Ação registrada permanentemente na coleção <code>audit_log</code>.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAprovacao({ ...modalAprovacao, aberto: false })}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#111827] text-xs text-slate-600 dark:text-[#94A3B8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processandoId === modalAprovacao.usuario.id}
                  className={`px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider ${
                    modalAprovacao.decisao === 'aprovar'
                      ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-[#059669] dark:hover:bg-emerald-600 text-white'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {processandoId === modalAprovacao.usuario.id
                    ? 'Processando...'
                    : 'Confirmar Decisão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO RÁPIDA: ATRIBUIR / REMOVER ADMIN ACP */}
      {confirmacaoAdminAcp.aberto && confirmacaoAdminAcp.usuario && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1A2E] border-2 border-blue-500/40 dark:border-[#3B82F6]/50 p-6 space-y-4 shadow-2xl text-slate-900 dark:text-[#F8FAFC]">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-[#3B82F6]/10 text-blue-600 dark:text-[#60A5FA]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-[#F8FAFC]">
                    {confirmacaoAdminAcp.acao === 'atribuir'
                      ? 'Atribuir Papel admin_acp'
                      : 'Remover Papel admin_acp'}
                  </h3>
                  <span className="text-[11px] text-slate-600 dark:text-[#94A3B8] block truncate max-w-[260px]">
                    {confirmacaoAdminAcp.usuario.email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfirmacaoAdminAcp({ aberto: false, usuario: null, acao: 'atribuir' })
                }
                className="text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-[#CBD5E1]">
              <p>
                {confirmacaoAdminAcp.acao === 'atribuir' ? (
                  <>
                    Você está prestes a conceder o papel <strong>admin_acp</strong> para o usuário{' '}
                    <strong>
                      {confirmacaoAdminAcp.usuario.name || confirmacaoAdminAcp.usuario.email}
                    </strong>
                    . Este usuário passará a ter permissão de acesso ao{' '}
                    <strong>Painel ACP (/painel-acp)</strong>, ao Bureau ACP e aos fluxos
                    institucionais da parceria ACP.
                  </>
                ) : (
                  <>
                    Você está prestes a remover o papel <strong>admin_acp</strong> do usuário{' '}
                    <strong>
                      {confirmacaoAdminAcp.usuario.name || confirmacaoAdminAcp.usuario.email}
                    </strong>
                    . O papel será revertido para <strong>cliente</strong> e o acesso ao Painel ACP
                    será imediatamente revogado.
                  </>
                )}
              </p>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                <div className="text-slate-500 dark:text-[#94A3B8]">
                  Papel Atual:{' '}
                  <span className="font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
                    {confirmacaoAdminAcp.usuario.role}
                  </span>
                </div>
                <div className="text-slate-500 dark:text-[#94A3B8]">
                  Novo Papel:{' '}
                  <span className="font-mono font-bold text-blue-600 dark:text-[#60A5FA]">
                    {confirmacaoAdminAcp.acao === 'atribuir' ? 'admin_acp' : 'cliente'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() =>
                  setConfirmacaoAdminAcp({ aberto: false, usuario: null, acao: 'atribuir' })
                }
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#111827] text-xs text-slate-600 dark:text-[#94A3B8] hover:bg-slate-200 dark:hover:bg-[#1E293B]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={processandoId === confirmacaoAdminAcp.usuario.id}
                onClick={executarToggleAdminAcp}
                className={`px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all ${
                  confirmacaoAdminAcp.acao === 'atribuir'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processandoId === confirmacaoAdminAcp.usuario.id
                  ? 'Gravando...'
                  : confirmacaoAdminAcp.acao === 'atribuir'
                    ? 'Confirmar Atribuição'
                    : 'Confirmar Remoção'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTERAR PAPEL DE USUÁRIO */}
      {modalAlterarPapel.aberto && modalAlterarPapel.usuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0E1A2E] border-2 border-emerald-500/40 dark:border-slate-800 p-6 space-y-4 shadow-2xl text-slate-900 dark:text-[#F8FAFC]">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-[#F8FAFC]">
                  Alterar Nível de Acesso (Papel)
                </h3>
                <span className="text-xs text-slate-600 dark:text-[#94A3B8] mt-0.5 block">
                  {modalAlterarPapel.usuario.name || modalAlterarPapel.usuario.email} (
                  {modalAlterarPapel.usuario.email})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalAlterarPapel({ ...modalAlterarPapel, aberto: false })}
                className="text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={confirmarMudancaPapel} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-[#94A3B8] font-semibold mb-1">
                  Selecione o Novo Papel *
                </label>
                <select
                  value={modalAlterarPapel.novoPapel}
                  onChange={(e) =>
                    setModalAlterarPapel({ ...modalAlterarPapel, novoPapel: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC]"
                >
                  {PAPEIS_PERMITIDOS_GOVERNANCA.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-1">
                  * O papel 'master' não pode ser concedido por esta interface (regra de segurança
                  estrita).
                </p>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-[#94A3B8] font-semibold mb-1">
                  Justificativa Formal para a Trilha *
                </label>
                <textarea
                  rows={3}
                  required
                  value={modalAlterarPapel.justificativa}
                  onChange={(e) =>
                    setModalAlterarPapel({ ...modalAlterarPapel, justificativa: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-emerald-600 dark:focus:border-[#2563EB]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAlterarPapel({ ...modalAlterarPapel, aberto: false })}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#111827] text-xs text-slate-600 dark:text-[#94A3B8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processandoId === modalAlterarPapel.usuario.id}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-[#2563EB] dark:hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  {processandoId === modalAlterarPapel.usuario.id
                    ? 'Gravando...'
                    : 'Salvar Alteração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REDEFINIR SENHA DE USUÁRIO PELO MASTER */}
      {modalRedefinirSenha.aberto && modalRedefinirSenha.usuario && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0E1A2E] border-2 border-amber-400 dark:border-[#D9B36C] p-6 space-y-4 shadow-2xl text-slate-900 dark:text-[#F8FAFC]">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-[#D9B36C]/10 text-amber-700 dark:text-[#D9B36C] border border-amber-300 dark:border-[#D9B36C]/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-[#F8FAFC]">
                    Redefinir Senha de Usuário
                  </h3>
                  <span className="text-xs text-slate-600 dark:text-[#94A3B8] mt-0.5 block">
                    {modalRedefinirSenha.usuario.name || modalRedefinirSenha.usuario.email} (
                    {modalRedefinirSenha.usuario.email})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setModalRedefinirSenha({
                    aberto: false,
                    usuario: null,
                    senhaTemporaria: null,
                    copiado: false,
                  })
                }
                className="text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
              >
                ✕
              </button>
            </div>

            {!modalRedefinirSenha.senhaTemporaria ? (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  Esta ação gerará uma <strong>senha temporária forte e aleatória</strong> para o
                  usuário <strong>{modalRedefinirSenha.usuario.email}</strong>, substituindo a senha
                  atual de forma segura no banco de dados sem passar por validações de login.
                </p>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-amber-300 dark:border-[#D9B36C]/30 space-y-1.5 text-[11px] text-slate-600 dark:text-[#94A3B8]">
                  <div className="text-amber-700 dark:text-[#D9B36C] font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Aviso de Segurança e Sigilo</span>
                  </div>
                  <p>
                    A senha gerada será <strong>exibida apenas UMA vez</strong> na próxima tela. Ela
                    não é gravada em logs, auditorias ou consultas posteriores. Copie-a e forneça ao
                    usuário de forma segura.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      setModalRedefinirSenha({
                        aberto: false,
                        usuario: null,
                        senhaTemporaria: null,
                        copiado: false,
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#111827] text-xs text-slate-600 dark:text-[#94A3B8]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={processandoId === modalRedefinirSenha.usuario.id}
                    onClick={executarRedefinicaoSenhaMaster}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-[#D9B36C] text-slate-900 font-bold text-xs uppercase tracking-wider dark:hover:bg-[#D9B36C]/90 transition-all flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>
                      {processandoId === modalRedefinirSenha.usuario.id
                        ? 'Gerando Senha...'
                        : 'Gerar Senha Temporária'}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-[#059669]/15 border border-emerald-300 dark:border-[#059669]/30 text-emerald-800 dark:text-[#059669] space-y-1">
                  <strong className="font-bold block text-sm">Senha Gerada com Sucesso!</strong>
                  <p className="text-[11px] text-slate-700 dark:text-[#F8FAFC]/90">
                    A senha temporária abaixo já foi aplicada à conta do usuário.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-600 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Esta senha temporária será exibida apenas agora. Copie-a e envie de forma segura
                    ao usuário.
                  </span>
                </div>

                {/* Exibição da Senha com Botão Copiar */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-amber-300 dark:border-[#D9B36C] flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] text-slate-600 dark:text-[#94A3B8] uppercase font-mono tracking-wider block">
                      Senha Temporária Gerada:
                    </span>
                    <span className="text-base sm:text-lg font-mono font-bold text-amber-700 dark:text-[#D9B36C] select-all break-all">
                      {modalRedefinirSenha.senhaTemporaria}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={copiarSenhaTemporaria}
                    className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all ${
                      modalRedefinirSenha.copiado
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-slate-900 dark:bg-[#D9B36C] dark:hover:bg-[#D9B36C]/90'
                    }`}
                  >
                    {modalRedefinirSenha.copiado ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      setModalRedefinirSenha({
                        aberto: false,
                        usuario: null,
                        senhaTemporaria: null,
                        copiado: false,
                      })
                    }
                    className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-[#111827] text-xs font-bold text-slate-900 dark:text-[#F8FAFC] hover:bg-slate-200 dark:hover:bg-[#1f2d3d]"
                  >
                    Concluído & Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
