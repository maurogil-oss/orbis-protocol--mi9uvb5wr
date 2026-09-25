import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Compass,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  FileText,
  Share2,
  Lock,
  ChevronRight,
  ExternalLink,
  Scale,
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  listarEdicoesRadar,
  RadarEdicaoRecord,
  RadarSegmento,
  alternarLeituraEdicao,
  verificarAcessoRadar,
  AVISO_LEGAL_RADAR,
} from '@/services/radarSemanalService'

const SEGMENTOS_DISPONIVEIS: ('todos' | RadarSegmento)[] = [
  'todos',
  'Fiscal / Tributário',
  'Ambiental/ESG',
  'Energia',
  'Financeiro',
  'Comércio Exterior',
  'Carbono/SBCE',
]

export default function CentralRadarPage() {
  const { user } = useAuth()
  const acessoInfo = verificarAcessoRadar(user)

  const [edicoes, setEdicoes] = useState<RadarEdicaoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [termoBusca, setTermoBusca] = useState('')
  const [segmentoFiltro, setSegmentoFiltro] = useState<string>('todos')
  const [apenasNaoLidas, setApenasNaoLidas] = useState(false)
  const [edicaoSelecionadaId, setEdicaoSelecionadaId] = useState<string | null>(null)
  const [copiadoLink, setCopiadoLink] = useState(false)

  const carregarEdicoes = async () => {
    setLoading(true)
    try {
      const lista = await listarEdicoesRadar(user?.id)
      setEdicoes(lista)
      if (lista.length > 0 && !edicaoSelecionadaId) {
        setEdicaoSelecionadaId(lista[0].id)
      }
    } catch (err) {
      console.error('Erro ao buscar edições na central:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarEdicoes()
  }, [user?.id])

  const edicaoAtual = useMemo(() => {
    if (!edicaoSelecionadaId) return edicoes[0] || null
    return edicoes.find((e) => e.id === edicaoSelecionadaId) || edicoes[0] || null
  }, [edicoes, edicaoSelecionadaId])

  // Filtragem
  const edicoesFiltradas = useMemo(() => {
    return edicoes.filter((e) => {
      if (apenasNaoLidas && e.lida) return false

      if (segmentoFiltro !== 'todos') {
        const contemSegmento = e.itens_normas_json.some(
          (n) => n.segmento?.toLowerCase() === segmentoFiltro.toLowerCase(),
        )
        if (!contemSegmento) return false
      }

      if (termoBusca.trim()) {
        const busca = termoBusca.toLowerCase()
        const matchTitulo = e.titulo.toLowerCase().includes(busca)
        const matchResumo = e.resumo_semana?.toLowerCase().includes(busca)
        const matchNormas = e.itens_normas_json.some(
          (n) =>
            n.norma?.toLowerCase().includes(busca) ||
            n.o_que_e?.toLowerCase().includes(busca) ||
            n.quem_afeta?.toLowerCase().includes(busca) ||
            n.o_que_muda_na_pratica?.toLowerCase().includes(busca) ||
            n.prazo?.toLowerCase().includes(busca) ||
            n.o_que_fazer_agora?.toLowerCase().includes(busca),
        )
        if (!matchTitulo && !matchResumo && !matchNormas) return false
      }

      return true
    })
  }, [edicoes, termoBusca, segmentoFiltro, apenasNaoLidas])

  const handleToggleLeitura = async (edicao: RadarEdicaoRecord) => {
    if (!user) return
    const novoStatus = !edicao.lida

    // Atualiza otimista
    setEdicoes((prev) =>
      prev.map((item) => (item.id === edicao.id ? { ...item, lida: novoStatus } : item)),
    )

    try {
      const res = await alternarLeituraEdicao(user.id, edicao.id, novoStatus, edicao.leitura_id)
      setEdicoes((prev) =>
        prev.map((item) =>
          item.id === edicao.id ? { ...item, lida: res.lida, leitura_id: res.leitura_id } : item,
        ),
      )
    } catch (err) {
      console.error('Erro ao marcar leitura:', err)
      // Reverte em caso de falha
      setEdicoes((prev) =>
        prev.map((item) => (item.id === edicao.id ? { ...item, lida: edicao.lida } : item)),
      )
    }
  }

  const userCode =
    (user as any)?.cliente_codigo || 'ORB-REF-' + (user?.id?.slice(0, 6)?.toUpperCase() || 'PRO')

  const linkIndicacao = `https://www.orbis-protocol.com/radar-semanal?ref=${encodeURIComponent(userCode)}`

  const handleCopiarLink = () => {
    navigator.clipboard.writeText(linkIndicacao)
    setCopiadoLink(true)
    setTimeout(() => setCopiadoLink(false), 3000)
  }

  // Se o usuário não tem acesso ativo (nem admin, nem trial, nem assinatura ativa)
  if (!acessoInfo.temAcesso) {
    return (
      <div className="min-h-screen bg-[#0A0E12] py-16 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-lg w-full p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#D9B36C]/10 text-[#D9B36C] flex items-center justify-center mx-auto border border-[#D9B36C]/30">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase text-[#D9B36C] tracking-wider">
              {acessoInfo.motivo === 'trial_expirado'
                ? 'SEU TESTE DE 15 DIAS EXPIROU'
                : acessoInfo.motivo === 'assinatura_expirada'
                  ? 'ASSINATURA EXPIRADA'
                  : 'ACESSO EXCLUSIVO A ASSINANTES'}
            </span>
            <h1 className="font-heading font-black text-2xl text-[#F4F7FA]">
              Central do Radar Semanal
            </h1>
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              O acervo completo de edições estruturadas, buscas avançadas e digest semanal no e-mail
              é restrito a contas com trial ativo ou assinatura regular por faixa de CNPJs.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              to="/radar-semanal"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#12B886] text-[#0A0E12] font-heading font-bold text-xs uppercase tracking-wider hover:bg-[#17C994] transition-colors"
            >
              <span>Conhecer Planos & Ativar Acesso</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <Link to="/painel" className="text-xs text-[#93A3B5] hover:text-[#F4F7FA] underline">
              Voltar ao Painel Geral
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0E12] text-[#F4F7FA]">
      {/* Top Banner de Status da Assinatura / Trial */}
      <div className="bg-[#111820] border-b border-[rgba(244,247,250,0.08)] py-3 px-4 sm:px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#12B886]/10 text-[#12B886] font-mono font-bold text-[10px] uppercase border border-[#12B886]/30">
              <Sparkles className="w-3 h-3" />
              {acessoInfo.motivo === 'admin'
                ? 'ACESSO GOVERNANÇA ADMIN'
                : acessoInfo.status === 'trial'
                  ? `TESTE GRÁTIS ATIVO (${acessoInfo.diasRestantesTrial} dias restantes)`
                  : 'ASSINATURA ATIVA'}
            </span>

            <span className="text-[#93A3B5] font-mono text-[11px]">
              Faixa: <strong>{acessoInfo.planoFaixa || 'Multi-CNPJ'}</strong>
            </span>
          </div>

          {/* Código de Indicação do Usuário */}
          <div className="flex items-center gap-2">
            <span className="text-[#93A3B5] text-[11px]">Seu ref de indicação:</span>
            <span className="font-mono text-[#12B886] font-bold px-2 py-0.5 rounded bg-[#0A0E12] border border-[#12B886]/30 text-[11px]">
              {userCode}
            </span>
            <button
              onClick={handleCopiarLink}
              className="px-2.5 py-1 rounded bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA] text-[11px] font-medium transition-colors"
              title="Copiar link de indicação"
            >
              {copiadoLink ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Cabeçalho da Central */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[rgba(244,247,250,0.08)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-5 h-5 text-[#12B886]" />
              <span className="text-xs uppercase font-mono font-bold text-[#12B886] tracking-wider">
                CENTRAL DO ASSINANTE
              </span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA]">
              Acervo do Radar Regulatório
            </h1>
            <p className="text-xs sm:text-sm text-[#93A3B5] mt-1">
              Pesquise nas edições publicadas, filtre por segmento e marque suas leituras da semana.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={carregarEdicoes}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.12)] text-xs text-[#93A3B5] hover:text-[#F4F7FA] hover:border-[#12B886] transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#12B886]' : ''}`}
              />
              <span>Atualizar</span>
            </button>
            <Link
              to="/radar-semanal"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#16202B] text-xs font-semibold text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors"
            >
              <span>Ver Planos & Upgrade</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="p-4 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.08)] flex flex-col md:flex-row items-center gap-3">
          {/* Busca */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#93A3B5] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por norma, palavra-chave, prazo, segmento..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] text-xs text-[#F4F7FA] placeholder-[#93A3B5]/40 focus:outline-none focus:border-[#12B886]"
            />
          </div>

          {/* Filtro por Segmento */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#93A3B5] shrink-0" />
            <select
              value={segmentoFiltro}
              onChange={(e) => setSegmentoFiltro(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] text-xs text-[#F4F7FA] focus:outline-none focus:border-[#12B886] w-full md:w-auto"
            >
              {SEGMENTOS_DISPONIVEIS.map((s) => (
                <option key={s} value={s}>
                  {s === 'todos' ? 'Todos os Segmentos' : s}
                </option>
              ))}
            </select>
          </div>

          {/* Checkbox Apenas Não Lidas */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-[#93A3B5] hover:text-[#F4F7FA] shrink-0 select-none px-2 py-1">
            <input
              type="checkbox"
              checked={apenasNaoLidas}
              onChange={(e) => setApenasNaoLidas(e.target.checked)}
              className="rounded bg-[#0A0E12] border-[rgba(244,247,250,0.2)] text-[#12B886] focus:ring-0"
            />
            <span>Apenas não lidas</span>
          </label>
        </div>

        {/* Layout Master-Detail: Coluna Esquerda Edições + Coluna Direita Leitura */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lista de Edições (4 colunas) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#93A3B5] px-1">
              <span>Edições no Acervo ({edicoesFiltradas.length})</span>
              <span>Clique para abrir</span>
            </div>

            {loading ? (
              <div className="p-8 rounded-xl bg-[#111820] text-center text-xs text-[#93A3B5]">
                Carregando edições...
              </div>
            ) : edicoesFiltradas.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#111820] text-center text-xs text-[#93A3B5]">
                Nenhuma edição encontrada com os filtros selecionados.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
                {edicoesFiltradas.map((ed) => {
                  const ativa = edicaoAtual?.id === ed.id
                  return (
                    <div
                      key={ed.id}
                      onClick={() => setEdicaoSelecionadaId(ed.id)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        ativa
                          ? 'bg-[#16202B] border-[#12B886] shadow-sm'
                          : 'bg-[#111820] border-[rgba(244,247,250,0.08)] hover:border-[rgba(244,247,250,0.2)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-[10px] font-bold uppercase text-[#12B886]">
                          Edição nº {ed.numero_edicao}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {ed.aberta_publico && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#D9B36C]/20 text-[#D9B36C] font-semibold">
                              Aberta
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              handleToggleLeitura(ed)
                            }}
                            className={`p-1 rounded text-xs transition-colors ${
                              ed.lida
                                ? 'text-[#12B886] hover:text-[#93A3B5]'
                                : 'text-[#93A3B5] hover:text-[#12B886]'
                            }`}
                            title={ed.lida ? 'Marcar como não lida' : 'Marcar como lida'}
                          >
                            <CheckCircle2
                              className={`w-4 h-4 ${ed.lida ? 'fill-[#12B886]/20' : 'opacity-40'}`}
                            />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-heading font-bold text-sm text-[#F4F7FA] line-clamp-2 leading-snug">
                        {ed.titulo}
                      </h3>

                      <p className="text-xs text-[#93A3B5] line-clamp-2 mt-1.5 leading-relaxed">
                        {ed.resumo_semana}
                      </p>

                      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[rgba(244,247,250,0.06)] text-[10px] text-[#93A3B5] font-mono">
                        <span>{ed.data_edicao}</span>
                        <span>{ed.itens_normas_json.length} normas</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Visualizador da Edição Selecionada (8 colunas) */}
          <div className="lg:col-span-8">
            {edicaoAtual ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-6">
                {/* Header da Leitura */}
                <div className="pb-6 border-b border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#12B886]/10 text-[#12B886] font-bold border border-[#12B886]/30">
                        Edição nº {edicaoAtual.numero_edicao}
                      </span>
                      <span className="text-xs text-[#93A3B5] font-mono">
                        Data: {edicaoAtual.data_edicao} • {edicaoAtual.mes_ano_referencia}
                      </span>
                    </div>
                    <h2 className="font-heading font-black text-xl sm:text-2xl text-[#F4F7FA] pt-1">
                      {edicaoAtual.titulo}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleLeitura(edicaoAtual)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      edicaoAtual.lida
                        ? 'bg-[#12B886]/20 text-[#12B886] border border-[#12B886]'
                        : 'bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA] border border-[rgba(244,247,250,0.15)]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{edicaoAtual.lida ? 'Edição Lida' : 'Marcar como Lida'}</span>
                  </button>
                </div>

                {/* Resumo da Semana */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border-l-4 border-[#12B886] text-xs sm:text-sm text-[#D5DFEA] leading-relaxed">
                  <strong className="text-[#12B886] block font-heading mb-1 text-[11px] uppercase tracking-wider">
                    Resumo Semanal Executivo:
                  </strong>
                  {edicaoAtual.resumo_semana}
                </div>

                {/* Lista de Normas Estruturadas */}
                <div className="space-y-5">
                  <h3 className="font-heading font-bold text-base text-[#F4F7FA] flex items-center justify-between">
                    <span>Normas Estruturadas ({edicaoAtual.itens_normas_json.length})</span>
                    <span className="text-xs text-[#93A3B5] font-normal">Formato de 5 Pilares</span>
                  </h3>

                  <div className="space-y-4">
                    {edicaoAtual.itens_normas_json.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-5 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.06)] space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-[#16202B] text-[#D9B36C] text-[10px] font-mono font-semibold border border-[#D9B36C]/30">
                              {item.segmento}
                            </span>
                            <strong className="font-heading font-bold text-sm text-[#F4F7FA]">
                              {item.norma}
                            </strong>
                          </div>
                          {item.base_legal && (
                            <span className="text-[11px] text-[#93A3B5] font-mono">
                              {item.base_legal}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                          <div className="p-2.5 rounded-lg bg-[#111820]">
                            <span className="text-[#93A3B5] font-semibold block text-[11px] mb-0.5">
                              1. O que é:
                            </span>
                            <p className="text-[#F4F7FA] leading-relaxed">{item.o_que_e}</p>
                          </div>

                          <div className="p-2.5 rounded-lg bg-[#111820]">
                            <span className="text-[#93A3B5] font-semibold block text-[11px] mb-0.5">
                              2. Quem afeta:
                            </span>
                            <p className="text-[#F4F7FA] leading-relaxed">{item.quem_afeta}</p>
                          </div>

                          <div className="p-2.5 rounded-lg bg-[#111820]">
                            <span className="text-[#93A3B5] font-semibold block text-[11px] mb-0.5">
                              3. O que muda na prática:
                            </span>
                            <p className="text-[#F4F7FA] leading-relaxed">
                              {item.o_que_muda_na_pratica}
                            </p>
                          </div>

                          <div className="p-2.5 rounded-lg bg-[#111820]">
                            <span className="text-[#F59E0B] font-semibold block text-[11px] mb-0.5">
                              4. Prazo mandatório:
                            </span>
                            <p className="text-[#F4F7FA] font-medium leading-relaxed">
                              {item.prazo}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-[#12B886]/10 border border-[#12B886]/30 text-xs">
                          <span className="text-[#12B886] font-bold block text-[11px] mb-0.5 uppercase tracking-wider">
                            5. O que fazer agora (Ação Prática):
                          </span>
                          <p className="text-[#F4F7FA] leading-relaxed">{item.o_que_fazer_agora}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bloco de Compartilhamento / Ref */}
                <div className="pt-6 border-t border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#93A3B5]">
                  <div>
                    <span className="font-semibold text-[#F4F7FA] block">
                      Indique clientes ou filiais:
                    </span>
                    <span>
                      Compartilhe o Radar com seu código de ref para vincular leads à sua conta.
                    </span>
                  </div>
                  <button
                    onClick={handleCopiarLink}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16202B] border border-[#12B886]/50 text-[#12B886] font-semibold hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors shrink-0"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiadoLink ? 'Link Copiado!' : 'Copiar Link com Ref'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-[#111820] text-center text-xs text-[#93A3B5]">
                Selecione uma edição para visualizar.
              </div>
            )}
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="pt-6 border-t border-[rgba(244,247,250,0.06)] text-center text-xs text-[#64748b]">
          <p>{AVISO_LEGAL_RADAR}</p>
        </div>
      </div>
    </div>
  )
}
