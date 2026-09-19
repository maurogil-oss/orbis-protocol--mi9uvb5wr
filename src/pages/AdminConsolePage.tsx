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
} from 'lucide-react'
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
  ParceiroRecord,
  ComissaoRecord,
} from '@/services/parceirosService'
import {
  listarCredenciamentosPeritos,
  julgarCredenciamentoPerito,
  PeritoCredenciamentoRecord,
} from '@/services/peritoService'
import { confirmarPagamentoSimulado, emitirNfse } from '@/services/cobrancaService'

type AdminTab =
  | 'receita'
  | 'clientes'
  | 'uso'
  | 'custos'
  | 'produtos'
  | 'assinaturas'
  | 'comissoes'
  | 'peritos'

export default function AdminConsolePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('receita')
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

  // Modal / Edição de Produto
  const [editandoProduto, setEditandoProduto] = useState<Partial<ServicoCatalogoRecord> | null>(
    null,
  )
  // Modal / Edição de Parceiro
  const [editandoParceiro, setEditandoParceiro] = useState<Partial<ParceiroRecord> | null>(null)
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
      ])

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
    } catch (err) {
      console.error('Erro ao carregar dados admin:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarTodosDados()
  }, [])

  // Ações de Cobrança
  const handleConfirmarPagamento = async (cobrancaId: string) => {
    if (!confirm('Deseja marcar esta cobrança como PAGA manualmente?')) return
    try {
      await confirmarPagamentoSimulado(cobrancaId)
      mostrarMensagem('Pagamento confirmado com sucesso e comissão/assinatura atualizadas!')
      carregarTodosDados()
    } catch (e: any) {
      alert('Erro: ' + e.message)
    }
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

  // Ações de Assinatura do Cliente
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

  const handlePagarComissao = async (comissaoId: string) => {
    const comprovante = prompt(
      'Informe o código ou comprovante de liquidação bancária/PIX:',
      'PIX-CONCILIADO-' + Date.now(),
    )
    if (!comprovante) return
    try {
      await registrarPagamentoComissao(comissaoId, comprovante)
      mostrarMensagem('Comissão marcada como PAGA!')
      carregarTodosDados()
    } catch (e: any) {
      alert('Erro: ' + e.message)
    }
  }

  // Ações de Perito
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
    { id: 'clientes', label: '2. Clientes', icon: Users },
    { id: 'uso', label: '3. Uso da Plataforma', icon: Activity },
    { id: 'custos', label: '4. Custos Operacionais', icon: TrendingUp },
    { id: 'produtos', label: '5. Produtos & Preços', icon: ShoppingBag },
    { id: 'assinaturas', label: '6. Assinaturas', icon: CreditCard },
    { id: 'comissoes', label: '7. Comissões & Parceiros', icon: Percent },
    { id: 'peritos', label: '8. Rede Pericial & Conselhos', icon: Award },
  ]

  const cobrancasFiltradas = cobrancas.filter((c) => {
    if (cobrancaFiltro === 'todos') return true
    return c.status === cobrancaFiltro
  })

  return (
    <div className="min-h-screen py-10 bg-[#0A0E12] text-[#F4F7FA]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Header Admin */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-[rgba(244,247,250,0.1)]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30 text-[10px] font-mono uppercase font-bold tracking-wider">
                CONSOLE DE GESTÃO ESTRATÉGICA • ETAPA 1
              </span>
              <span className="text-[11px] text-[#93A3B5] font-mono">
                Role: {user?.role || 'admin'}
              </span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA] tracking-wide">
              ADMINISTRAÇÃO ORBIS PROTOCOL
            </h1>
            <p className="text-xs sm:text-sm text-[#93A3B5] mt-1">
              Governança centralizada de faturamento, clientes mestres, consumo de APIs, parceiros e
              rede pericial.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={carregarTodosDados}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.15)] text-xs text-[#93A3B5] hover:text-[#F4F7FA] hover:border-[#12B886] transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#12B886]' : ''}`}
              />
              <span>Atualizar Dados</span>
            </button>
            <Link
              to="/painel"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16202B] border border-[#12B886]/40 text-xs font-semibold text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors"
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
            <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)]">
              <span className="text-[10px] text-[#93A3B5] uppercase block">Receita Faturada</span>
              <span className="font-heading font-black text-xl text-[#12B886]">
                R$ {kpis.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-[#93A3B5] block mt-0.5">
                {kpis.cobrancasPagas} cobranças pagas
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)]">
              <span className="text-[10px] text-[#93A3B5] uppercase block">
                Cobranças Pendentes
              </span>
              <span className="font-heading font-black text-xl text-[#D9B36C]">
                {kpis.cobrancasPendentes}
              </span>
              <span className="text-[10px] text-[#93A3B5] block mt-0.5">aguardando PIX</span>
            </div>

            <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)]">
              <span className="text-[10px] text-[#93A3B5] uppercase block">Clientes Mestres</span>
              <span className="font-heading font-black text-xl text-[#F4F7FA]">
                {kpis.totalClientes}
              </span>
              <span className="text-[10px] text-[#93A3B5] block mt-0.5">
                {kpis.totalLeads} no funil
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)]">
              <span className="text-[10px] text-[#93A3B5] uppercase block">
                Consultas DPP / Lotes
              </span>
              <span className="font-heading font-black text-xl text-[#3B82F6]">
                {kpis.totalConsultasDpp}
              </span>
              <span className="text-[10px] text-[#93A3B5] block mt-0.5">
                {kpis.totalLotesCdv} lotes CDV
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)]">
              <span className="text-[10px] text-[#93A3B5] uppercase block">Comissões a Pagar</span>
              <span className="font-heading font-black text-xl text-[#D9B36C]">
                R$ {kpis.comissoesPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-[#93A3B5] block mt-0.5">
                {kpis.totalParceiros} parceiros ativos
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)]">
              <span className="text-[10px] text-[#93A3B5] uppercase block">Fila Rede Pericial</span>
              <span className="font-heading font-black text-xl text-[#12B886]">
                {kpis.peritosPendentes}
              </span>
              <span className="text-[10px] text-[#93A3B5] block mt-0.5">
                {kpis.peritosAprovados} homologados
              </span>
            </div>
          </div>
        )}

        {/* Menu de Abas (Mobile: scroll horizontal) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-[rgba(244,247,250,0.08)] no-scrollbar">
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
                    : 'bg-[#111820] text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B] border border-[rgba(244,247,250,0.06)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{aba.label}</span>
              </button>
            )
          })}
        </div>

        {/* CONTEÚDO DOS 8 PAINÉIS */}

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
                          <span className="text-[10px] text-[#3B82F6] font-mono">
                            Ref: {c.codigo_indicacao}
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
                        {c.status !== 'pago' && (
                          <button
                            onClick={() => handleConfirmarPagamento(c.id)}
                            className="px-2.5 py-1 rounded bg-[#12B886]/20 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] font-semibold text-[11px] transition-colors"
                          >
                            Marcar Pago
                          </button>
                        )}
                        <button
                          onClick={() => handleEmitirNfseAdmin(c.id)}
                          className="px-2.5 py-1 rounded bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#93A3B5] hover:text-[#F4F7FA] text-[11px]"
                        >
                          NFS-e
                        </button>
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
                    {c.status !== 'pago' && (
                      <button
                        onClick={() => handleConfirmarPagamento(c.id)}
                        className="flex-1 py-1.5 rounded bg-[#12B886] text-[#0A0E12] font-bold text-center text-xs"
                      >
                        Confirmar Pagamento
                      </button>
                    )}
                    <button
                      onClick={() => handleEmitirNfseAdmin(c.id)}
                      className="px-3 py-1.5 rounded bg-[#16202B] border border-[rgba(244,247,250,0.2)] text-xs text-[#93A3B5]"
                    >
                      NFS-e
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. CLIENTES (CADASTRO-MESTRE) */}
        {activeTab === 'clientes' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                Cadastro-Mestre de Clientes & Pipeline de Leads
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Controle de cliente_codigo (ORB-CLI-XXXX), CNPJ vinculado, plano e leads por
                status/origem.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de Contas de Usuários Clientes (2 Cols) */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="font-heading font-bold text-sm text-[#12B886] uppercase tracking-wider">
                  Contas de Usuários Cadastrados ({clientes.length})
                </h3>

                <div className="space-y-2">
                  {clientes.map((cli) => (
                    <div
                      key={cli.id}
                      className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-[#F4F7FA] font-medium text-sm">
                            {cli.name || cli.email}
                          </strong>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30">
                            {cli.cliente_codigo || 'ORB-CLI-NOVO'}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-[#D9B36C] bg-[#D9B36C]/10 px-2 py-0.5 rounded">
                            {cli.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#93A3B5] flex flex-wrap gap-x-4">
                          <span>Email: {cli.email}</span>
                          <span>
                            CNPJ:{' '}
                            <strong className="font-mono text-[#F4F7FA]">
                              {cli.cnpj || 'Não cadastrado'}
                            </strong>
                          </span>
                          <span>
                            Plano:{' '}
                            <strong className="text-[#12B886]">
                              {cli.plano_ativo || 'Nenhum'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            cli.assinatura_status === 'ativa'
                              ? 'bg-[#12B886]/20 text-[#12B886]'
                              : 'bg-[#93A3B5]/20 text-[#93A3B5]'
                          }`}
                        >
                          {cli.assinatura_status || 'sem assinatura'}
                        </span>
                      </div>
                    </div>
                  ))}
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
                        <span className="font-mono text-[#D9B36C]">{d.alvo_identificador}</span>
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
                  Veículos desmontados com balanço de massa.
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {lotes.map((lt) => (
                    <div
                      key={lt.id}
                      className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-[#F4F7FA]">{lt.veiculo_marca_modelo}</strong>
                        <span className="text-[9px] uppercase font-bold text-[#3B82F6]">
                          {lt.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#93A3B5] font-mono">
                        {lt.cdv_nome} • Baixa: {lt.veiculo_baixa_detran}
                      </div>
                      <div className="text-[10px] text-[#12B886]">
                        {lt.total_pecas} peças • {lt.total_co2e_evitado_kg} kg CO2e evitado
                      </div>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. ASSINATURAS */}
        {activeTab === 'assinaturas' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                Gestão de Assinaturas & Renovações
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Acompanhamento de vencimentos, controle de inadimplência e ações imediatas de
                suspender ou reativar.
              </p>
            </div>

            <div className="rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D1217] text-[#93A3B5] uppercase text-[10px] border-b border-[rgba(244,247,250,0.08)]">
                  <tr>
                    <th className="p-3.5">Cliente & Código</th>
                    <th className="p-3.5">Plano Ativo</th>
                    <th className="p-3.5">Data Renovação</th>
                    <th className="p-3.5">Status da Assinatura</th>
                    <th className="p-3.5 text-right">Ação Operacional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(244,247,250,0.05)]">
                  {clientes.map((cli) => (
                    <tr key={cli.id} className="hover:bg-[#16202B]/50 transition-colors">
                      <td className="p-3.5">
                        <strong className="text-[#F4F7FA] block">{cli.name || cli.email}</strong>
                        <span className="font-mono text-[#D9B36C] text-[10px]">
                          {cli.cliente_codigo || 'ORB-CLI-XXXX'}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-[#12B886]">
                        {cli.plano_ativo || 'Nenhum'}
                      </td>
                      <td className="p-3.5 text-[#93A3B5] font-mono">
                        {cli.assinatura_renovacao || '2027-03-01'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            cli.assinatura_status === 'ativa'
                              ? 'bg-[#12B886]/20 text-[#12B886]'
                              : cli.assinatura_status === 'suspensa'
                                ? 'bg-[#F03E54]/20 text-[#F03E54]'
                                : 'bg-[#93A3B5]/20 text-[#93A3B5]'
                          }`}
                        >
                          {cli.assinatura_status || 'sem plano'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {cli.assinatura_status === 'suspensa' ? (
                          <button
                            onClick={() => handleAlterarStatusAssinatura(cli.id, 'ativa')}
                            className="px-3 py-1 rounded bg-[#12B886]/20 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] font-semibold text-[11px]"
                          >
                            Reativar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAlterarStatusAssinatura(cli.id, 'suspensa')}
                            className="px-3 py-1 rounded bg-[#F03E54]/20 text-[#F03E54] hover:bg-[#F03E54] hover:text-white font-semibold text-[11px]"
                          >
                            Suspender
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
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
                      <span className="text-[#93A3B5] uppercase font-bold text-[9px] block text-[#D9B36C]">
                        Dados Bancários (Visível só ao Admin):
                      </span>
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
                            <button
                              onClick={() => handlePagarComissao(com.id)}
                              className="px-3 py-1 rounded bg-[#12B886] text-[#0A0E12] font-bold text-xs shadow-emerald-glow"
                            >
                              Registrar Pagamento
                            </button>
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

                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          per.status === 'aprovado'
                            ? 'bg-[#12B886]/20 text-[#12B886]'
                            : per.status === 'rejeitado'
                              ? 'bg-[#F03E54]/20 text-[#F03E54]'
                              : 'bg-[#D9B36C]/20 text-[#D9B36C]'
                        }`}
                      >
                        Status: {per.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-[#93A3B5] block">ART / RRT Vinculada:</span>
                        <strong className="text-[#D9B36C] font-mono">
                          {per.numero_art_rrt || 'Não informada'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#93A3B5] block">Observação Atual do Auditor:</span>
                        <span className="text-[#F4F7FA]">
                          {per.observacao_auditor || 'Sem observações'}
                        </span>
                      </div>
                    </div>

                    {/* Ação de Julgar */}
                    {per.status === 'pendente' && (
                      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <input
                          type="text"
                          placeholder="Parecer do auditor (ex: Documentação homologada com sucesso)..."
                          value={obsPerito[per.id] || ''}
                          onChange={(e) => setObsPerito({ ...obsPerito, [per.id]: e.target.value })}
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
                    )}
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
      </div>
    </div>
  )
}
