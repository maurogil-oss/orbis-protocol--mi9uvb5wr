import { useState, useEffect } from 'react'
import {
  Compass,
  Users,
  FileText,
  Send,
  Plus,
  Edit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react'
import {
  listarAssinantesRadarAdmin,
  atualizarAcessoRadarUsuarioAdmin,
  criarOuAtualizarEdicaoAdmin,
  listarEdicoesRadar,
  dispararDigestSemanalAdmin,
  RadarEdicaoRecord,
  RadarAcessoStatus,
  RadarFaixaCnpj,
  ItemNormaRadar,
  PLANOS_RADAR_SEMANAL,
  AVISO_LEGAL_RADAR,
} from '@/services/radarSemanalService'
import { ITENS_RADAR_REGULATORIO } from '@/data/radarRegulatorioData'

export function ConsoleRadarSemanalTab() {
  const [subAba, setSubAba] = useState<'assinantes' | 'edicoes' | 'curadoria'>('assinantes')

  // Estado de Assinantes
  const [assinantes, setAssinantes] = useState<any[]>([])
  const [loadingAssinantes, setLoadingAssinantes] = useState(false)
  const [filtroAssinante, setFiltroAssinante] = useState('')

  // Estado de Edições
  const [edicoes, setEdicoes] = useState<RadarEdicaoRecord[]>([])
  const [loadingEdicoes, setLoadingEdicoes] = useState(false)

  // Disparo manual
  const [disparandoDigest, setDisparandoDigest] = useState(false)
  const [resultadoDisparo, setResultadoDisparo] = useState<any>(null)

  // Modal / Edição em Formulário
  const [editandoEdicao, setEditandoEdicao] = useState<Partial<RadarEdicaoRecord> | null>(null)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  // Edição rápida de assinante
  const [editandoUsuario, setEditandoUsuario] = useState<any | null>(null)
  const [salvandoUsuario, setSalvandoUsuario] = useState(false)

  const carregarDados = async () => {
    setLoadingAssinantes(true)
    setLoadingEdicoes(true)
    try {
      const [u, e] = await Promise.all([
        listarAssinantesRadarAdmin(),
        listarEdicoesRadar('admin'), // Pega todas as edições
      ])
      setAssinantes(u)
      setEdicoes(e)
    } catch (err) {
      console.error('Erro ao carregar dados do Radar no console:', err)
    } finally {
      setLoadingAssinantes(false)
      setLoadingEdicoes(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const handleSalvarAcessoAssinante = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editandoUsuario) return
    setSalvandoUsuario(true)
    try {
      await atualizarAcessoRadarUsuarioAdmin(editandoUsuario.id, {
        radar_acesso_status: editandoUsuario.radar_acesso_status,
        radar_plano_faixa: editandoUsuario.radar_plano_faixa,
        radar_trial_fim: editandoUsuario.radar_trial_fim,
        radar_assinatura_fim: editandoUsuario.radar_assinatura_fim,
      })
      alert('Acesso do usuário ao Radar Semanal atualizado!')
      setEditandoUsuario(null)
      carregarDados()
    } catch (err: any) {
      alert('Erro ao atualizar assinante: ' + err.message)
    } finally {
      setSalvandoUsuario(false)
    }
  }

  const handleDispararDigest = async (edicaoId?: string) => {
    if (
      !confirm('Deseja disparar o Digest por e-mail para todos os usuários com acesso ativo/trial?')
    ) {
      return
    }
    setDisparandoDigest(true)
    setResultadoDisparo(null)
    try {
      const res = await dispararDigestSemanalAdmin(edicaoId)
      setResultadoDisparo(res)
      alert(`Digest disparado com sucesso! Total enviados: ${res.total_enviados}`)
      carregarDados()
    } catch (err: any) {
      alert('Erro ao disparar digest: ' + err.message)
    } finally {
      setDisparandoDigest(false)
    }
  }

  const handleCriarNovaEdicao = () => {
    const proximoNumero = (edicoes[0]?.numero_edicao || 0) + 1
    const hojeIso = new Date().toISOString().split('T')[0]

    // Preenche com uma norma modelo baseada no acervo do radar
    const normaExemplo: ItemNormaRadar = {
      id: 'norma-' + Date.now(),
      norma: 'Instrução Normativa RFB nº 2.xxx/2026',
      segmento: 'Fiscal / Tributário',
      o_que_e: 'Regulamentação complementar sobre apuração de créditos.',
      quem_afeta: 'Empresas do regime cumulativo e não cumulativo.',
      o_que_muda_na_pratica: 'Exigência de preenchimento dos registros analíticos.',
      prazo: 'Imediato',
      o_que_fazer_agora: 'Revisar parametrizações do ERP.',
      base_legal: 'IN RFB nº 2.xxx/2026',
    }

    setEditandoEdicao({
      numero_edicao: proximoNumero,
      titulo: `Edição ${String(proximoNumero).padStart(2, '0')} — `,
      resumo_semana: 'Resumo das atualizações regulatórias e fiscais mais relevantes da semana.',
      data_edicao: hojeIso,
      mes_ano_referencia: 'Março 2026',
      aberta_publico: false,
      publicada: true,
      autor_editorial: 'Curadoria Regulatória Orbis',
      itens_normas_json: [normaExemplo],
    })
  }

  const handleImportarNormaDoRadar = (itemRadar: any) => {
    if (!editandoEdicao) return
    const novaNorma: ItemNormaRadar = {
      id: itemRadar.id,
      norma: itemRadar.norma || itemRadar.titulo,
      segmento:
        itemRadar.tagSetorial === 'Tributário'
          ? 'Fiscal / Tributário'
          : (itemRadar.tagSetorial as any) || 'Fiscal / Tributário',
      o_que_e: itemRadar.descricaoCurta || itemRadar.titulo,
      quem_afeta: Array.isArray(itemRadar.quemAfeta)
        ? itemRadar.quemAfeta.join('; ')
        : itemRadar.quemAfeta || '',
      o_que_muda_na_pratica: itemRadar.descricaoCurta || '',
      prazo: itemRadar.dataMarco || 'Consulte o calendário oficial',
      o_que_fazer_agora: itemRadar.acaoRecomendada || '',
      base_legal: itemRadar.baseLegal || '',
    }

    const normasAtuais = editandoEdicao.itens_normas_json || []
    setEditandoEdicao({
      ...editandoEdicao,
      itens_normas_json: [...normasAtuais, novaNorma],
    })
  }

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editandoEdicao) return
    setSalvandoEdicao(true)
    try {
      await criarOuAtualizarEdicaoAdmin(editandoEdicao)
      alert('Edição salva com sucesso!')
      setEditandoEdicao(null)
      carregarDados()
    } catch (err: any) {
      alert('Erro ao salvar edição: ' + err.message)
    } finally {
      setSalvandoEdicao(false)
    }
  }

  const assinantesFiltrados = assinantes.filter((u) => {
    if (!filtroAssinante.trim()) return true
    const f = filtroAssinante.toLowerCase()
    return (
      u.email?.toLowerCase().includes(f) ||
      u.name?.toLowerCase().includes(f) ||
      u.empresa_nome?.toLowerCase().includes(f) ||
      u.cliente_codigo?.toLowerCase().includes(f) ||
      u.radar_ref_origem?.toLowerCase().includes(f)
    )
  })

  return (
    <div className="space-y-6 text-slate-900 dark:text-[#F8FAFC]">
      {/* Header da Aba */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-5 h-5 text-emerald-600 dark:text-[#059669]" />
            <span className="text-xs uppercase font-mono font-bold text-emerald-700 dark:text-[#059669] tracking-wider">
              PRODUTO RADAR SEMANAL • GESTÃO OPERACIONAL
            </span>
          </div>
          <h2 className="font-heading font-black text-xl text-slate-900 dark:text-[#F8FAFC]">
            Painel Administrativo do Radar Regulatório
          </h2>
          <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">
            Liberação manual de acessos (v1), curadoria editorial das edições e disparo manual do
            digest semanal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDispararDigest()}
            disabled={disparandoDigest}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-[#2563EB] dark:hover:bg-blue-600 text-white font-heading font-bold text-xs transition-all disabled:opacity-50 shadow-sm"
          >
            <Send className={`w-3.5 h-3.5 ${disparandoDigest ? 'animate-pulse' : ''}`} />
            <span>{disparandoDigest ? 'Disparando...' : 'Disparar Digest Agora'}</span>
          </button>
          <button
            onClick={carregarDados}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] border border-slate-200 dark:border-slate-800 transition-colors"
            title="Recarregar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {resultadoDisparo && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-[#059669]/15 border border-emerald-300 dark:border-[#059669] text-xs text-emerald-800 dark:text-[#F8FAFC] space-y-1">
          <div className="font-bold text-emerald-700 dark:text-[#059669]">
            Relatório de Disparo do Digest Semanal:
          </div>
          <p>
            Edição nº {resultadoDisparo.numero_edicao} • Total destinatários enviados:{' '}
            <strong>{resultadoDisparo.total_enviados}</strong> • Falhas:{' '}
            {resultadoDisparo.total_erros}
          </p>
        </div>
      )}

      {/* Navegação entre Sub-abas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setSubAba('assinantes')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            subAba === 'assinantes'
              ? 'bg-emerald-600 text-white dark:bg-[#2563EB]'
              : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
          }`}
        >
          <Users className="w-3.5 h-3.5 inline mr-1.5" />
          Assinantes & Controle de Acesso ({assinantes.length})
        </button>
        <button
          onClick={() => setSubAba('edicoes')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            subAba === 'edicoes'
              ? 'bg-emerald-600 text-white dark:bg-[#2563EB]'
              : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 inline mr-1.5" />
          Edições & Publicação ({edicoes.length})
        </button>
      </div>

      {/* Sub-aba 1: Assinantes & Acessos */}
      {subAba === 'assinantes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nome, e-mail, código ref, origem..."
                value={filtroAssinante}
                onChange={(e) => setFiltroAssinante(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#94A3B8]/40 focus:outline-none focus:border-emerald-600 dark:focus:border-[#2563EB]"
              />
            </div>
            <span className="text-xs text-slate-600 dark:text-[#94A3B8]">
              Mostrando {assinantesFiltrados.length} contas
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1A2E]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] border-b border-slate-200 dark:border-slate-800 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Usuário / Empresa</th>
                  <th className="py-2.5 px-3">Status Radar</th>
                  <th className="py-2.5 px-3">Faixa de CNPJs</th>
                  <th className="py-2.5 px-3">Validade Trial / Assinatura</th>
                  <th className="py-2.5 px-3">Ref Próprio</th>
                  <th className="py-2.5 px-3">Ref Origem (Indicado por)</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loadingAssinantes ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 dark:text-[#94A3B8]">
                      Carregando assinantes...
                    </td>
                  </tr>
                ) : assinantesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 dark:text-[#94A3B8]">
                      Nenhum assinante encontrado com acesso configurado.
                    </td>
                  </tr>
                ) : (
                  assinantesFiltrados.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#111827]/40 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                          {u.name || 'Sem nome'}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-[#94A3B8]">
                          {u.email}
                        </div>
                        {u.empresa_nome && (
                          <div className="text-[10px] text-slate-500 dark:text-[#94A3B8]/70 font-mono">
                            {u.empresa_nome} {u.cnpj ? `(${u.cnpj})` : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            u.radar_acesso_status === 'ativo'
                              ? 'bg-emerald-50 dark:bg-[#059669]/15 text-emerald-700 dark:text-[#059669] border border-emerald-300 dark:border-[#059669]/30'
                              : u.radar_acesso_status === 'trial'
                                ? 'bg-blue-50 dark:bg-[#3B82F6]/10 text-blue-700 dark:text-[#3B82F6] border border-blue-200 dark:border-[#3B82F6]/30'
                                : u.radar_acesso_status === 'expirado'
                                  ? 'bg-red-50 dark:bg-[#EF4444]/10 text-red-700 dark:text-[#EF4444] border border-red-200 dark:border-[#EF4444]/30'
                                  : 'bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8]'
                          }`}
                        >
                          {u.radar_acesso_status || 'nenhum'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-amber-700 dark:text-[#D9B36C]">
                        {u.radar_plano_faixa || '-'}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-[#94A3B8]">
                        {u.radar_trial_fim && (
                          <div>
                            Trial: {new Date(u.radar_trial_fim).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {u.radar_assinatura_fim && (
                          <div className="text-emerald-700 dark:text-[#059669]">
                            Assin: {new Date(u.radar_assinatura_fim).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {!u.radar_trial_fim && !u.radar_assinatura_fim && '-'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-emerald-700 dark:text-[#059669]">
                        {u.cliente_codigo || '-'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-amber-700 dark:text-[#D9B36C]">
                        {u.radar_ref_origem || '-'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setEditandoUsuario({ ...u })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-[#111827] text-xs font-semibold text-emerald-700 dark:text-[#059669] hover:bg-emerald-600 hover:text-white dark:hover:bg-[#2563EB] transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Gerenciar</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-aba 2: Edições & Publicação */}
      {subAba === 'edicoes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-[#94A3B8]">
              Total de edições cadastradas: {edicoes.length}
            </span>
            <button
              onClick={handleCriarNovaEdicao}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-[#2563EB] dark:hover:bg-blue-600 text-white font-heading font-bold text-xs transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Edição Semanal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {edicoes.map((ed) => (
              <div
                key={ed.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase text-emerald-700 dark:text-[#059669] px-2 py-0.5 rounded bg-emerald-50 dark:bg-[#059669]/10 border border-emerald-300 dark:border-[#059669]/30">
                      Edição nº {ed.numero_edicao}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {ed.aberta_publico && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-[#D9B36C]/20 text-amber-700 dark:text-[#D9B36C] font-semibold">
                          Aberta ao público
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          ed.publicada
                            ? 'bg-emerald-50 dark:bg-[#059669]/20 text-emerald-700 dark:text-[#059669]'
                            : 'bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8]'
                        }`}
                      >
                        {ed.publicada ? 'Publicada' : 'Rascunho'}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                    {ed.titulo}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-[#94A3B8] line-clamp-3 leading-relaxed">
                    {ed.resumo_semana}
                  </p>

                  <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-mono pt-1">
                    Data: {ed.data_edicao} • {ed.itens_normas_json.length} normas cadastradas
                  </div>

                  {ed.data_envio_digest && (
                    <div className="text-[10px] text-emerald-700 dark:text-[#059669] font-mono">
                      Digest enviado em:{' '}
                      {new Date(ed.data_envio_digest).toLocaleDateString('pt-BR')} (
                      {ed.total_destinatarios_enviados} envios)
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDispararDigest(ed.id)}
                    disabled={disparandoDigest}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-[#94A3B8] hover:text-emerald-700 dark:hover:text-[#059669] transition-colors"
                    title="Disparar esta edição especificamente por e-mail"
                  >
                    <Send className="w-3 h-3" />
                    <span>Disparar E-mail</span>
                  </button>

                  <button
                    onClick={() => setEditandoEdicao({ ...ed })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#111827] text-xs font-semibold text-slate-700 dark:text-[#F8FAFC] hover:bg-emerald-600 hover:text-white dark:hover:bg-[#2563EB] transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal / Drawer: Editar Acesso do Usuário */}
      {editandoUsuario && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl text-slate-900 dark:text-[#F8FAFC]">
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F8FAFC]">
              Gerenciar Acesso ao Radar Semanal
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
              Usuário: <strong>{editandoUsuario.name}</strong> ({editandoUsuario.email})
            </p>

            <form onSubmit={handleSalvarAcessoAssinante} className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-slate-600 dark:text-[#94A3B8] block mb-1">
                  Status de Acesso:
                </label>
                <select
                  value={editandoUsuario.radar_acesso_status || 'nenhum'}
                  onChange={(e) =>
                    setEditandoUsuario({
                      ...editandoUsuario,
                      radar_acesso_status: e.target.value as RadarAcessoStatus,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-[#F8FAFC]"
                >
                  <option value="nenhum">Nenhum / Sem Acesso</option>
                  <option value="trial">Trial (Degustação 15 dias)</option>
                  <option value="ativo">Assinatura Ativa (Pago/Liberado)</option>
                  <option value="expirado">Expirado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#94A3B8] block mb-1">
                  Faixa de CNPJs:
                </label>
                <select
                  value={editandoUsuario.radar_plano_faixa || '1_cnpj'}
                  onChange={(e) =>
                    setEditandoUsuario({
                      ...editandoUsuario,
                      radar_plano_faixa: e.target.value as RadarFaixaCnpj,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-[#F8FAFC]"
                >
                  <option value="1_cnpj">1 CNPJ (R$ 59/mês)</option>
                  <option value="ate_5_cnpjs">Até 5 CNPJs (R$ 149/mês)</option>
                  <option value="ate_30_cnpjs">Até 30 CNPJs (R$ 249/mês)</option>
                  <option value="acima_30_sob_consulta">Acima de 30 CNPJs (Sob Consulta)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#94A3B8] block mb-1">
                  Validade do Trial (ISO / YYYY-MM-DD):
                </label>
                <input
                  type="date"
                  value={
                    editandoUsuario.radar_trial_fim
                      ? editandoUsuario.radar_trial_fim.split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setEditandoUsuario({
                      ...editandoUsuario,
                      radar_trial_fim: e.target.value ? new Date(e.target.value).toISOString() : '',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#94A3B8] block mb-1">
                  Validade da Assinatura (ISO / YYYY-MM-DD):
                </label>
                <input
                  type="date"
                  value={
                    editandoUsuario.radar_assinatura_fim
                      ? editandoUsuario.radar_assinatura_fim.split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setEditandoUsuario({
                      ...editandoUsuario,
                      radar_assinatura_fim: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : '',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-[#F8FAFC]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditandoUsuario(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#111827] text-xs font-semibold text-slate-600 dark:text-[#94A3B8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoUsuario}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-[#2563EB] dark:hover:bg-blue-600 text-white text-xs font-bold"
                >
                  {salvandoUsuario ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Editor de Edição Semanal */}
      {editandoEdicao && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 space-y-6 shadow-2xl my-8 text-slate-900 dark:text-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-heading font-black text-lg text-slate-900 dark:text-[#F8FAFC]">
                  {editandoEdicao.id ? 'Editar Edição Semanal' : 'Criar Nova Edição Semanal'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                  Alimentação manual do conteúdo curado no formato padrão de 5 pilares.
                </p>
              </div>
              <button
                onClick={() => setEditandoEdicao(null)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-[#94A3B8] block mb-1">
                    Número da Edição:
                  </label>
                  <input
                    type="number"
                    value={editandoEdicao.numero_edicao || 1}
                    onChange={(e) =>
                      setEditandoEdicao({
                        ...editandoEdicao,
                        numero_edicao: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-[#F8FAFC]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-[#94A3B8] block mb-1">
                    Data da Edição:
                  </label>
                  <input
                    type="date"
                    value={editandoEdicao.data_edicao || ''}
                    onChange={(e) =>
                      setEditandoEdicao({ ...editandoEdicao, data_edicao: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-[#F8FAFC]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-[#94A3B8] block mb-1">
                    Mês/Ano Referência:
                  </label>
                  <input
                    type="text"
                    value={editandoEdicao.mes_ano_referencia || 'Março 2026'}
                    onChange={(e) =>
                      setEditandoEdicao({ ...editandoEdicao, mes_ano_referencia: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#94A3B8] block mb-1">
                  Título da Edição:
                </label>
                <input
                  type="text"
                  value={editandoEdicao.titulo || ''}
                  onChange={(e) => setEditandoEdicao({ ...editandoEdicao, titulo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-[#F8FAFC]"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-[#94A3B8] block mb-1">
                  Resumo Executivo da Semana:
                </label>
                <textarea
                  rows={3}
                  value={editandoEdicao.resumo_semana || ''}
                  onChange={(e) =>
                    setEditandoEdicao({ ...editandoEdicao, resumo_semana: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-[#F8FAFC]"
                />
              </div>

              <div className="flex items-center gap-6 py-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-900 dark:text-[#F8FAFC]">
                  <input
                    type="checkbox"
                    checked={Boolean(editandoEdicao.aberta_publico)}
                    onChange={(e) =>
                      setEditandoEdicao({ ...editandoEdicao, aberta_publico: e.target.checked })
                    }
                    className="rounded bg-slate-50 dark:bg-[#0A1628] border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-[#2563EB]"
                  />
                  <span>Edição aberta ao público (Edição do Mês para captura de leads)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-900 dark:text-[#F8FAFC]">
                  <input
                    type="checkbox"
                    checked={editandoEdicao.publicada !== false}
                    onChange={(e) =>
                      setEditandoEdicao({ ...editandoEdicao, publicada: e.target.checked })
                    }
                    className="rounded bg-slate-50 dark:bg-[#0A1628] border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-[#2563EB]"
                  />
                  <span>Publicada</span>
                </label>
              </div>

              {/* Curadoria: Normas da Edição */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                    Normas Estruturadas ({editandoEdicao.itens_normas_json?.length || 0})
                  </h4>

                  {/* Atalho de importação do acervo estático de radar */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600 dark:text-[#94A3B8]">
                      Importar do acervo:
                    </span>
                    <select
                      onChange={(e) => {
                        const item = ITENS_RADAR_REGULATORIO.find((it) => it.id === e.target.value)
                        if (item) handleImportarNormaDoRadar(item)
                      }}
                      value=""
                      className="px-2 py-1 rounded bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-[11px] text-amber-700 dark:text-[#D9B36C]"
                    >
                      <option value="">+ Selecionar norma existente...</option>
                      {ITENS_RADAR_REGULATORIO.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.norma} - {n.titulo.slice(0, 50)}...
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {editandoEdicao.itens_normas_json?.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-emerald-700 dark:text-[#059669] font-mono">
                          Norma #{idx + 1}: {item.norma}
                        </strong>
                        <button
                          type="button"
                          onClick={() => {
                            const filtrados = editandoEdicao.itens_normas_json?.filter(
                              (_, i) => i !== idx,
                            )
                            setEditandoEdicao({
                              ...editandoEdicao,
                              itens_normas_json: filtrados,
                            })
                          }}
                          className="text-red-500 hover:underline text-[11px]"
                        >
                          Remover
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-600 dark:text-[#94A3B8] block">
                            1. O que é:
                          </span>
                          <input
                            type="text"
                            value={item.o_que_e}
                            onChange={(e) => {
                              const novas = [...(editandoEdicao.itens_normas_json || [])]
                              novas[idx].o_que_e = e.target.value
                              setEditandoEdicao({ ...editandoEdicao, itens_normas_json: novas })
                            }}
                            className="w-full px-2 py-1 rounded bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC]"
                          />
                        </div>

                        <div>
                          <span className="text-slate-600 dark:text-[#94A3B8] block">
                            2. Quem afeta:
                          </span>
                          <input
                            type="text"
                            value={item.quem_afeta}
                            onChange={(e) => {
                              const novas = [...(editandoEdicao.itens_normas_json || [])]
                              novas[idx].quem_afeta = e.target.value
                              setEditandoEdicao({ ...editandoEdicao, itens_normas_json: novas })
                            }}
                            className="w-full px-2 py-1 rounded bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC]"
                          />
                        </div>

                        <div>
                          <span className="text-slate-600 dark:text-[#94A3B8] block">
                            3. O que muda na prática:
                          </span>
                          <input
                            type="text"
                            value={item.o_que_muda_na_pratica}
                            onChange={(e) => {
                              const novas = [...(editandoEdicao.itens_normas_json || [])]
                              novas[idx].o_que_muda_na_pratica = e.target.value
                              setEditandoEdicao({ ...editandoEdicao, itens_normas_json: novas })
                            }}
                            className="w-full px-2 py-1 rounded bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC]"
                          />
                        </div>

                        <div>
                          <span className="text-amber-700 dark:text-[#D9B36C] block">
                            4. Prazo:
                          </span>
                          <input
                            type="text"
                            value={item.prazo}
                            onChange={(e) => {
                              const novas = [...(editandoEdicao.itens_normas_json || [])]
                              novas[idx].prazo = e.target.value
                              setEditandoEdicao({ ...editandoEdicao, itens_normas_json: novas })
                            }}
                            className="w-full px-2 py-1 rounded bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC]"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-emerald-700 dark:text-[#059669] block text-[11px]">
                          5. O que fazer agora:
                        </span>
                        <input
                          type="text"
                          value={item.o_que_fazer_agora}
                          onChange={(e) => {
                            const novas = [...(editandoEdicao.itens_normas_json || [])]
                            novas[idx].o_que_fazer_agora = e.target.value
                            setEditandoEdicao({ ...editandoEdicao, itens_normas_json: novas })
                          }}
                          className="w-full px-2 py-1 rounded bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditandoEdicao(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#111827] text-xs font-semibold text-slate-600 dark:text-[#94A3B8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEdicao}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-[#2563EB] dark:hover:bg-blue-600 text-white font-heading font-bold text-xs"
                >
                  {salvandoEdicao ? 'Gravando...' : 'Salvar Edição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
