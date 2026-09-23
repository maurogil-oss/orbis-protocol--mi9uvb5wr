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
} from 'lucide-react'
import {
  aprovarRecusarContaGestaoMaster,
  alterarPapelUsuarioMaster,
} from '@/services/adminConsoleService'
import { useAuth } from '@/contexts/AuthContext'

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
    nome: 'Cliente / Empresa',
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
      alert('O usuário com papel Master não pode ter seu papel alterado por esta interface.')
      return
    }
    setModalAlterarPapel({
      aberto: true,
      usuario: targetUser,
      novoPapel: targetUser.role || 'cliente',
      justificativa: 'Alteração de atribuição funcional deliberada pela governança Master.',
    })
  }

  const confirmarMudancaPapel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalAlterarPapel.usuario) return

    // Proteção de segurança: NUNCA permitir promover a master
    if (modalAlterarPapel.novoPapel === 'master') {
      alert("Ação proibida: O papel 'master' NUNCA pode ser concedido por interface.")
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

  if (!isMaster) {
    return (
      <div className="p-8 rounded-2xl bg-[#111820] border border-[#EF4444]/40 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-[#EF4444] mx-auto" />
        <h3 className="font-heading font-black text-lg text-[#F4F7FA]">
          Acesso Restrito ao Gestor Master
        </h3>
        <p className="text-xs text-[#93A3B5] max-w-md mx-auto">
          Esta aba é restrita exclusivamente ao papel <strong>master</strong> da plataforma.
          Administradores comuns operam o Console mas não possuem autorização para aprovar contas ou
          alterar papéis.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header da Aba */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#111820] via-[#16202B] to-[#111820] border border-[#D9B36C]/40 shadow-xl space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full bg-[#D9B36C]/20 border border-[#D9B36C]/50 text-[#D9B36C] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-3 h-3 text-[#D9B36C]" />
            GOVERNANÇA DE ACESSOS • GESTOR MASTER EXCLUSIVO
          </span>
          <span className="text-[11px] text-[#93A3B5] font-mono">
            Operador: <strong className="text-[#F4F7FA]">{user?.email}</strong> (Papel: master)
          </span>
        </div>
        <h2 className="font-heading font-black text-xl sm:text-2xl text-[#F4F7FA]">
          Painel de Governança Master & Controle de Papéis
        </h2>
        <p className="text-xs text-[#93A3B5] max-w-4xl leading-relaxed">
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
              ? 'bg-[#12B886]/10 border-[#12B886] text-[#12B886]'
              : 'bg-[#EF4444]/10 border-[#EF4444] text-[#EF4444]'
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

      {/* BLOCO 1: FILA DE CONTAS GESTÃO PENDENTES DE APROVAÇÃO */}
      <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#D9B36C]/10 text-[#D9B36C]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                Fila de Contas Gestão Pendentes de Aprovação ({contasGestaoPendentes.length})
              </h3>
              <p className="text-[11px] text-[#93A3B5]">
                Contas corporativas que selecionaram perfil "Gestão" no cadastro público e aguardam
                homologação.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAtualizar}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16202B] border border-[rgba(244,247,250,0.1)] text-xs text-[#93A3B5] hover:text-[#F4F7FA]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar Fila</span>
          </button>
        </div>

        {contasGestaoPendentes.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-center text-xs text-[#93A3B5]">
            Nenhuma conta de Gestão pendente de aprovação no momento. A fila está em dia.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contasGestaoPendentes.map((pend) => (
              <div
                key={pend.id}
                className="p-4 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#D9B36C]/20 text-[#D9B36C]">
                      Pendente de Validação
                    </span>
                    <span className="text-[10px] text-[#93A3B5] font-mono">
                      {new Date(pend.created).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <strong className="text-sm text-[#F4F7FA] block truncate">
                    {pend.name || pend.email}
                  </strong>
                  <div className="text-[11px] text-[#93A3B5] font-mono break-all">{pend.email}</div>
                  <div className="text-[10px] text-[#93A3B5]">
                    Papel solicitado:{' '}
                    <strong className="text-[#3B82F6]">{pend.role || 'admin'}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-[rgba(244,247,250,0.08)] flex items-center gap-2">
                  <button
                    type="button"
                    disabled={processandoId === pend.id}
                    onClick={() => abrirModalAprovar(pend, 'aprovar')}
                    className="flex-1 py-1.5 rounded-lg bg-[#12B886] hover:bg-[#12B886]/90 text-[#0A0E12] font-bold text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Aprovar</span>
                  </button>
                  <button
                    type="button"
                    disabled={processandoId === pend.id}
                    onClick={() => abrirModalAprovar(pend, 'recusar')}
                    className="py-1.5 px-3 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/40 font-bold text-xs flex items-center justify-center gap-1 transition-all"
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
      <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                Equipe & Usuários por Papel ({usuariosFiltrados.length} de {usuarios.length})
              </h3>
              <p className="text-[11px] text-[#93A3B5]">
                Listagem completa de contas, status de homologação e gestão direta de papéis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#93A3B5] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar e-mail, nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] text-xs text-[#F4F7FA] w-44 sm:w-56"
              />
            </div>
            <select
              value={filtroPapel}
              onChange={(e) => setFiltroPapel(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] text-xs text-[#F4F7FA]"
            >
              <option value="todos">Todos os Papéis</option>
              <option value="master">master</option>
              <option value="admin">admin</option>
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
                ? 'bg-[#D9B36C]/20 text-[#D9B36C] border-[#D9B36C]/40'
                : u.role === 'admin'
                  ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40'
                  : u.role === 'controller'
                    ? 'bg-[#A855F7]/20 text-[#A855F7] border-[#A855F7]/40'
                    : u.role === 'financeiro'
                      ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                      : u.role === 'financeiro_leitor'
                        ? 'bg-[#D9B36C]/10 text-[#D9B36C] border-[#D9B36C]/20'
                        : u.role === 'perito'
                          ? 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/40'
                          : u.role === 'parceiro'
                            ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                            : 'bg-[#93A3B5]/10 text-[#93A3B5] border-[rgba(244,247,250,0.1)]'

            return (
              <div
                key={u.id}
                className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-[#F4F7FA] truncate max-w-[220px]">
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
                            ? 'bg-[#D9B36C]/20 text-[#D9B36C]'
                            : u.status_aprovacao === 'aprovado'
                              ? 'bg-[#12B886]/20 text-[#12B886]'
                              : 'bg-[#EF4444]/20 text-[#EF4444]'
                        }`}
                      >
                        {u.status_aprovacao}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#93A3B5] font-mono truncate">{u.email}</div>
                  <div className="text-[10px] text-[#93A3B5]/70">
                    Cadastrado em {new Date(u.created).toLocaleDateString('pt-BR')} • ID: {u.id}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isUserMaster ? (
                    <span className="text-[11px] text-[#D9B36C] font-mono italic">
                      👑 Gestor Master Raiz
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={processandoId === u.id}
                      onClick={() => abrirModalMudarPapel(u)}
                      className="px-3 py-1.5 rounded-lg bg-[#16202B] hover:bg-[#12B886] hover:text-[#0A0E12] text-xs font-bold text-[#12B886] border border-[#12B886]/30 transition-all flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Alterar Papel</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* BLOCO 3: MATRIZ DE ACESSO POR NÍVEL DE GOVERNANÇA */}
      <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#12B886]/10 text-[#12B886]">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
              Matriz de Acesso por Nível (Governança Orbis Protocol)
            </h3>
            <p className="text-[11px] text-[#93A3B5]">
              Especificação institucional dos privilégios de cada papel conforme a arquitetura de
              segurança da plataforma.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-[#F4F7FA]">Cliente</strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#93A3B5]/10 text-[#93A3B5]">
                cliente
              </span>
            </div>
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              Diagnóstico SBCE, lotes próprios de desmontagem, emissão de dossiês, selos de lastro
              circular, contratação de planos e gestão das suas cobranças próprias.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-[#D9B36C]">Cliente ACP</strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#D9B36C]/20 text-[#D9B36C]">
                cliente_acp
              </span>
            </div>
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              Todos os privilégios de Cliente + identificador <code>ORB-ACP</code> + acompanhamento
              e recebimento de comissões por empresas indicadas no Paraná.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-[#F59E0B]">Parceiro</strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B]">
                parceiro
              </span>
            </div>
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              Acesso ao painel de parceiro (<code>/parceiro-painel</code>), link de indicação, lista
              de clientes indicados e comissões com anexação de nota/RPA.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-[#06B6D4]">Perito Técnico</strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#06B6D4]/20 text-[#06B6D4]">
                perito
              </span>
            </div>
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              Acesso aos lotes designados e dossiês que emite sob chancela CREA/CRC com número de
              ART/RRT homologado pelo auditor.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-[#10B981]">Financeiro</strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981]">
                financeiro
              </span>
            </div>
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              Gestão de cobranças, emissão de NFS-e, conciliação e liquidação manual com regra de
              quatro-olhos obrigatória para valores acima de R$ 5.000,00.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-[#D9B36C]">Financeiro Leitor</strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#D9B36C]/10 text-[#D9B36C]">
                financeiro_leitor
              </span>
            </div>
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              Apenas consulta aos módulos de faturamento, métricas e relatórios financeiros, sem
              permissão para liquidar cobranças ou alterar cadastros.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-[#A855F7]">Controller</strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#A855F7]/20 text-[#A855F7]">
                controller
              </span>
            </div>
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              Leitura ampla institucional: cobranças, comissões, dossiês técnicos e trilha de
              auditoria completa, sem privilégio de escrita ou mutação de registros.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-[#EF4444]">Admin Operacional</strong>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444]">
                admin
              </span>
            </div>
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              Operação diária do Console (clientes, lotes, peças, catálogo de preços, parâmetros).{' '}
              <strong>Não pode</strong> homologar cadastros de Gestão nem alterar papéis de ninguém.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-[#16202B] to-[#0A0E12] border-2 border-[#D9B36C] space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-[#D9B36C] flex items-center gap-1">
                <span>👑</span> Gestor Master
              </strong>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#D9B36C] text-[#0A0E12] font-bold">
                master
              </span>
            </div>
            <p className="text-xs text-[#F4F7FA] leading-relaxed">
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
          <div className="w-full max-w-lg rounded-2xl bg-[#111820] border-2 border-[#D9B36C] p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[rgba(244,247,250,0.1)] pb-3">
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#F4F7FA]">
                  {modalAprovacao.decisao === 'aprovar'
                    ? 'Homologar Conta de Gestão'
                    : 'Recusar Conta de Gestão'}
                </h3>
                <span className="text-xs text-[#93A3B5] mt-0.5 block">
                  {modalAprovacao.usuario.name || modalAprovacao.usuario.email} (
                  {modalAprovacao.usuario.email})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalAprovacao({ ...modalAprovacao, aberto: false })}
                className="text-[#93A3B5] hover:text-[#F4F7FA]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={confirmarDecisaoGestao} className="space-y-4 text-xs">
              {modalAprovacao.decisao === 'aprovar' && (
                <div>
                  <label className="block text-[#93A3B5] font-semibold mb-1">
                    Definir Papel no Console *
                  </label>
                  <select
                    value={modalAprovacao.papelDesignado}
                    onChange={(e) =>
                      setModalAprovacao({ ...modalAprovacao, papelDesignado: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                  >
                    <option value="admin">Admin (Console Operacional)</option>
                    <option value="controller">Controller (Leitura Ampla)</option>
                    <option value="financeiro">Financeiro (Operação & Faturamento)</option>
                    <option value="financeiro_leitor">Financeiro Leitor (Somente Consulta)</option>
                  </select>
                  <p className="text-[10px] text-[#93A3B5] mt-1">
                    * O papel 'master' não pode ser selecionado aqui — apenas atribuído no banco.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[#93A3B5] font-semibold mb-1">
                  Justificativa Formal para Trilha de Auditoria *
                </label>
                <textarea
                  rows={3}
                  required
                  value={modalAprovacao.justificativa}
                  onChange={(e) =>
                    setModalAprovacao({ ...modalAprovacao, justificativa: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:border-[#D9B36C]"
                />
              </div>

              <div className="p-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-[11px] text-[#93A3B5] space-y-1">
                <div>
                  • Decisão:{' '}
                  <strong className="text-[#F4F7FA] uppercase">{modalAprovacao.decisao}</strong>
                </div>
                <div>
                  • Responsável: <strong className="text-[#D9B36C]">{user?.email}</strong> (master)
                </div>
                <div>
                  • Ação registrada permanentemente na coleção <code>audit_log</code>.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(244,247,250,0.08)]">
                <button
                  type="button"
                  onClick={() => setModalAprovacao({ ...modalAprovacao, aberto: false })}
                  className="px-4 py-2 rounded-xl bg-[#16202B] text-xs text-[#93A3B5]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processandoId === modalAprovacao.usuario.id}
                  className={`px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider ${
                    modalAprovacao.decisao === 'aprovar'
                      ? 'bg-[#12B886] text-[#0A0E12] hover:bg-[#12B886]/90'
                      : 'bg-[#EF4444] text-white hover:bg-[#dc2626]'
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

      {/* MODAL ALTERAR PAPEL DE USUÁRIO */}
      {modalAlterarPapel.aberto && modalAlterarPapel.usuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#111820] border-2 border-[#12B886] p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[rgba(244,247,250,0.1)] pb-3">
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#F4F7FA]">
                  Alterar Nível de Acesso (Papel)
                </h3>
                <span className="text-xs text-[#93A3B5] mt-0.5 block">
                  {modalAlterarPapel.usuario.name || modalAlterarPapel.usuario.email} (
                  {modalAlterarPapel.usuario.email})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalAlterarPapel({ ...modalAlterarPapel, aberto: false })}
                className="text-[#93A3B5] hover:text-[#F4F7FA]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={confirmarMudancaPapel} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#93A3B5] font-semibold mb-1">
                  Selecione o Novo Papel *
                </label>
                <select
                  value={modalAlterarPapel.novoPapel}
                  onChange={(e) =>
                    setModalAlterarPapel({ ...modalAlterarPapel, novoPapel: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                >
                  {PAPEIS_PERMITIDOS_GOVERNANCA.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#93A3B5] mt-1">
                  * O papel 'master' não pode ser concedido por esta interface (regra de segurança
                  estrita).
                </p>
              </div>

              <div>
                <label className="block text-[#93A3B5] font-semibold mb-1">
                  Justificativa Formal para a Trilha *
                </label>
                <textarea
                  rows={3}
                  required
                  value={modalAlterarPapel.justificativa}
                  onChange={(e) =>
                    setModalAlterarPapel({ ...modalAlterarPapel, justificativa: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:border-[#12B886]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(244,247,250,0.08)]">
                <button
                  type="button"
                  onClick={() => setModalAlterarPapel({ ...modalAlterarPapel, aberto: false })}
                  className="px-4 py-2 rounded-xl bg-[#16202B] text-xs text-[#93A3B5]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processandoId === modalAlterarPapel.usuario.id}
                  className="px-5 py-2 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs uppercase tracking-wider hover:bg-[#12B886]/90 transition-all"
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
    </div>
  )
}
