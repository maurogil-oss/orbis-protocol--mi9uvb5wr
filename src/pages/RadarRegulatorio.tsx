import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import {
  ITENS_RADAR_REGULATORIO,
  ItemRadarRegulatorio,
  StatusNorma,
} from '@/data/radarRegulatorioData'
import {
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  FileCheck2,
  Building2,
  Globe2,
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

interface LeadDiagnosticoLocal {
  id: string
  cnpj: string
  razao_social: string
  regime_tributario?: string
  enquadramento_sbce?: string
  faixa_emissoes?: string
  exporta_ue_cbam?: string
  cbam_bens?: string
  vinculo_institucional?: string
}

interface NfeUploadItemLocal {
  id: string
  chave_acesso?: string
  dados_adicionais_json?: any
}

export default function RadarRegulatorio() {
  const { isAuthenticated, user } = useAuth()

  // Filtros de visualização
  const [statusFiltro, setStatusFiltro] = useState<string>('todos')
  const [setorFiltro, setSetorFiltro] = useState<string>('todos')
  const [buscaTexto, setBuscaTexto] = useState<string>('')

  // Dados do usuário logado (se houver)
  const [lead, setLead] = useState<LeadDiagnosticoLocal | null>(null)
  const [nfeList, setNfeList] = useState<NfeUploadItemLocal[]>([])
  const [loadingData, setLoadingData] = useState<boolean>(false)

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    const carregarDadosUsuario = async () => {
      setLoadingData(true)
      try {
        // Busca diagnóstico do usuário
        const leadRes = await pb
          .collection('leads_diagnostico')
          .getList<LeadDiagnosticoLocal>(1, 1, {
            filter: `usuario = "${user.id}"`,
            sort: '-created',
          })
        if (leadRes.items.length > 0) {
          setLead(leadRes.items[0])
        }

        // Busca notas enviadas
        const nfeRes = await pb.collection('nfe_upload').getList<NfeUploadItemLocal>(1, 50, {
          filter: `usuario = "${user.id}"`,
        })
        setNfeList(nfeRes.items)
      } catch (err) {
        console.error('Erro ao carregar dados do usuário no Radar Regulatório:', err)
      } finally {
        setLoadingData(false)
      }
    }

    carregarDadosUsuario()
  }, [isAuthenticated, user?.id])

  // Filtragem dos itens da linha do tempo
  const itensFiltrados = useMemo(() => {
    return ITENS_RADAR_REGULATORIO.filter((item) => {
      if (statusFiltro !== 'todos' && item.status !== statusFiltro) return false
      if (setorFiltro !== 'todos' && item.tagSetorial !== setorFiltro) return false
      if (buscaTexto.trim()) {
        const t = buscaTexto.toLowerCase()
        const match =
          item.titulo.toLowerCase().includes(t) ||
          item.norma.toLowerCase().includes(t) ||
          item.descricaoCurta.toLowerCase().includes(t) ||
          item.acaoRecomendada.toLowerCase().includes(t) ||
          item.quemAfeta.some((q) => q.toLowerCase().includes(t))
        if (!match) return false
      }
      return true
    })
  }, [statusFiltro, setorFiltro, buscaTexto])

  // Lógica do Checklist de Conformidade Personalizado para Usuário Logado
  const checklistPersonalizado = useMemo(() => {
    if (!lead && nfeList.length === 0) return []

    const exportaUE = lead?.exporta_ue_cbam === 'sim'
    const faixaEmissoes = lead?.faixa_emissoes
    const acima25k = faixaEmissoes === 'acima_25k'
    const entre10ke25k = faixaEmissoes === 'entre_10k_25k'
    const temNotas = nfeList.length > 0
    const temNotaComIbsCbs = nfeList.some(
      (n) =>
        Boolean(n.dados_adicionais_json?.tem_destaque_ibs_cbs) ||
        (n.dados_adicionais_json?.valor_ibs_total || 0) > 0,
    )
    const temItensIS = nfeList.some(
      (n) => (n.dados_adicionais_json?.itens_sujeitos_is_qtd || 0) > 0,
    )

    return [
      {
        id: 'chk_ibscbs_01082026',
        norma: 'LC 214/2025 (Art. 348)',
        titulo: 'Destaque de IBS 0,1% e CBS 0,9% na NF-e a partir de 1º/08/2026',
        pronto: temNotaComIbsCbs,
        statusTexto: temNotaComIbsCbs
          ? 'Sua empresa já importou nota com grupos IBS/CBS identificados'
          : temNotas
            ? 'Atenção: Suas notas atuais não contam com o grupo IBS/CBS — atualize seu software emissor ERP antes de 1º/08/2026'
            : 'Pendente de validação de XML de NF-e: teste um arquivo emitido pelo seu ERP',
        acao: 'Verificar se a versão do emissor SEFAZ já gera os grupos <IBSCBS> com cClassTrib.',
        link: '/painel',
        linkTexto: 'Ver Notas no Painel',
        critico: true,
      },
      {
        id: 'chk_sbce',
        norma: 'Lei Federal 15.042/2024 (SBCE)',
        titulo: 'Enquadramento nos Limiares do Mercado Regulado de Carbono',
        pronto: !acima25k && !entre10ke25k && Boolean(lead),
        statusTexto: acima25k
          ? 'Emissões acima de 25.000 tCO₂e/ano: sujeita a reporte e compensação obrigatória de emissões no SBCE'
          : entre10ke25k
            ? 'Emissões entre 10.000 e 25.000 tCO₂e/ano: sujeita a dever de reporte anual auditado'
            : lead
              ? 'Abaixo do limiar de monitoramento obrigatório (< 10.000 tCO₂e/ano) ou preliminar'
              : 'Faça o diagnóstico para calcular o limiar de sua empresa',
        acao:
          acima25k || entre10ke25k
            ? 'Estruturar o inventário pericial dMRV (Escopos 1 e 2) com chancela oficial Orbis.'
            : 'Manter monitoramento preventivo de faturas de combustíveis e energia.',
        link: '/painel',
        linkTexto: 'Acessar Motor de Emissões',
        critico: acima25k || entre10ke25k,
      },
      {
        id: 'chk_cbam',
        norma: 'Regulamento Europeu CBAM 2023/956',
        titulo: 'Mecanismo de Ajuste de Carbono na Fronteira da União Europeia',
        pronto: !exportaUE,
        statusTexto: exportaUE
          ? `Empresa assinalou exportação para a UE (${lead?.cbam_bens || 'bens industriais'}): exige declaração de emissões específicas incorporadas`
          : 'Sua empresa não opera exportações diretas de bens cobertos pelo CBAM',
        acao: exportaUE
          ? 'Emitir laudo técnico pericial de emissões de berço ao portão (Cradle-to-Gate).'
          : 'Monitorar caso haja vendas indiretas para multinacionais exportadoras.',
        link: '/capital',
        linkTexto: 'Linhas de Financiamento Verde',
        critico: exportaUE,
      },
      {
        id: 'chk_is',
        norma: 'LC 214/2025 (Imposto Seletivo)',
        titulo: 'Rastreabilidade de NCM para bens sujeitos ao Imposto Seletivo',
        pronto: !temItensIS,
        statusTexto: temItensIS
          ? 'Foram identificados itens em suas notas com NCMs correspondentes às listas de incidência do Imposto Seletivo'
          : temNotas
            ? 'Nenhum NCM das notas importadas coincide com bens sujeitos ao Seletivo'
            : 'Audite seus códigos NCM para prever impacto de margem a partir de 2027',
        acao: 'Auditar cadastro fiscal de NCMs (veículos, tabaco, bebidas, minerais, carvão).',
        link: '/painel',
        linkTexto: 'Checar NCMs das Notas',
        critico: temItensIS,
      },
    ]
  }, [lead, nfeList])

  const getStatusBadge = (status: StatusNorma) => {
    switch (status) {
      case 'Vigente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/30">
            <CheckCircle2 className="w-3 h-3" />
            Vigente
          </span>
        )
      case 'Em fase-teste':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D9B36C]/15 text-[#D9B36C] border border-[#D9B36C]/40">
            <Clock className="w-3 h-3" />
            Em Fase-Teste
          </span>
        )
      case 'Previsto':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
            <Calendar className="w-3 h-3" />
            Previsto
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12] text-[#F4F7FA]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Top Header Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[rgba(244,247,250,0.1)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-3">
              <ShieldCheck className="w-4 h-4 text-[#12B886]" />
              RADAR REGULATÓRIO 2026 • ORBIS PROTOCOL
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] tracking-tight">
              CRONOGRAMA DE NORMAS, MARCOS & CONFORMIDADE
            </h1>
            <p className="text-xs sm:text-sm text-[#93A3B5] mt-1 max-w-2xl leading-relaxed">
              Mapeamento contínuo das novas diretrizes da Reforma Tributária (LC 214/2025, LC
              227/2026, Decreto 12.955/2026), fase-teste 1º/08/2026, mercado SBCE de carbono e
              diretivas internacionais (CBAM, EUDR, CSRD).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/diagnostico"
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center gap-2"
            >
              <span>Fazer Diagnóstico Gratuito</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ALERTA PRINCIPAL: DESTAQUE 1º/08/2026 */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#111820] via-[#16202B] to-[#111820] border border-[#12B886]/50 mb-10 shadow-emerald-glow">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#12B886]/20 text-[#12B886] shrink-0 mt-0.5">
                <Calendar className="w-6 h-6 text-[#12B886]" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#12B886]">
                  <span>Marco Regulatório Crítico • Contagem Regressiva</span>
                </div>
                <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[#F4F7FA]">
                  1º de Agosto de 2026: Destaque Obrigatório de IBS (0,1%) e CBS (0,9%) na NF-e
                </h2>
                <p className="text-xs text-[#93A3B5] max-w-3xl leading-relaxed">
                  Conforme o <strong className="text-[#F4F7FA]">Artigo 348 da LC 214/2025</strong>,
                  a emissão de NF-e (modelo 55) e NFC-e (modelo 65) passa a exigir os grupos XML
                  específicos de IBS e CBS na fase-teste. O recolhimento efetivo é dispensado se as
                  obrigações acessórias forem transmitidas sem inconsistências.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2">
              <div className="px-4 py-2 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 text-center">
                <span className="block text-[10px] text-[#93A3B5] uppercase font-mono">
                  Alíquotas Fase-Teste
                </span>
                <span className="font-heading font-black text-lg text-[#12B886]">
                  0,1% IBS + 0,9% CBS
                </span>
              </div>
              <Link
                to={isAuthenticated ? '/painel' : '/diagnostico'}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] text-center transition-colors"
              >
                {isAuthenticated ? 'Auditar XMLs no Painel' : 'Testar Minha Empresa'}
              </Link>
            </div>
          </div>
        </div>

        {/* CHECKLIST DE CONFORMIDADE PERSONALIZADO (SE LOGADO COM LEAD OU DADOS) */}
        {isAuthenticated && (
          <div className="mb-12 p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[#12B886]/40 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[rgba(244,247,250,0.1)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#12B886]/20 text-[#12B886]">
                  <FileCheck2 className="w-5 h-5 text-[#12B886]" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#F4F7FA]">
                    SEU CHECKLIST DE CONFORMIDADE REGULATÓRIA
                  </h3>
                  <span className="text-xs text-[#93A3B5]">
                    Cruzamento dos dados do seu diagnóstico (
                    {lead?.razao_social || user?.name || 'Sua Conta'}) com os prazos legais
                  </span>
                </div>
              </div>

              {lead && (
                <div className="text-xs text-[#93A3B5] font-mono px-3 py-1 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                  CNPJ: <strong className="text-[#12B886]">{lead.cnpj}</strong>
                </div>
              )}
            </div>

            {loadingData ? (
              <div className="py-8 text-center text-xs text-[#93A3B5]">
                Carregando dados cadastrais do seu diagnóstico...
              </div>
            ) : checklistPersonalizado.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {checklistPersonalizado.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      item.pronto
                        ? 'bg-[#12B886]/5 border-[#12B886]/30'
                        : item.critico
                          ? 'bg-[#F03E54]/5 border-[#F03E54]/30'
                          : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase text-[#93A3B5]">
                          {item.norma}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            item.pronto
                              ? 'bg-[#12B886]/20 text-[#12B886] border-[#12B886]/40'
                              : 'bg-[#D9B36C]/20 text-[#D9B36C] border-[#D9B36C]/40'
                          }`}
                        >
                          {item.pronto ? 'Conforme / Preparado' : 'Ação Necessária'}
                        </span>
                      </div>

                      <h4 className="font-heading font-bold text-sm text-[#F4F7FA] mb-2">
                        {item.titulo}
                      </h4>

                      <p className="text-xs text-[#93A3B5] leading-relaxed mb-3">
                        {item.statusTexto}
                      </p>

                      <div className="p-2.5 rounded-lg bg-[#070A0D] border border-[rgba(244,247,250,0.06)] text-[11px] text-[#F4F7FA] mb-3">
                        <strong className="text-[#12B886] block text-[10px] uppercase tracking-wider mb-0.5">
                          Ação Recomendada:
                        </strong>
                        {item.acao}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[rgba(244,247,250,0.06)] flex justify-end">
                      <Link
                        to={item.link}
                        className="text-xs font-semibold text-[#12B886] hover:underline flex items-center gap-1"
                      >
                        <span>{item.linkTexto}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[#93A3B5] border border-dashed border-[rgba(244,247,250,0.1)] rounded-xl">
                Nenhum lead com CNPJ encontrado para esta conta. Inicie um diagnóstico para gerar
                seu checklist personalizado.
                <div className="mt-3">
                  <Link
                    to="/diagnostico"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#12B886] hover:underline"
                  >
                    <span>Iniciar Diagnóstico por CNPJ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BANNER DE CONVITE SE NÃO ESTIVER LOGADO */}
        {!isAuthenticated && (
          <div className="mb-12 p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#D9B36C]/20 text-[#D9B36C] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                  Deseja seu checklist de conformidade personalizado por CNPJ?
                </h3>
                <p className="text-xs text-[#93A3B5] mt-0.5">
                  Preencha o diagnóstico gratuito ou conecte-se para cruzar os dados da sua empresa
                  (regime tributário, emissões SBCE e exportação) com a régua normativa.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <Link
                to="/diagnostico"
                className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
              >
                Fazer Diagnóstico
              </Link>
              <Link
                to="/login"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886]"
              >
                Entrar
              </Link>
            </div>
          </div>
        )}

        {/* BARRA DE FILTROS & BUSCA */}
        <div className="mb-8 p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.08)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-[#93A3B5]">
              <Filter className="w-3.5 h-3.5 text-[#12B886]" />
              <span className="font-semibold uppercase text-[10px] tracking-wider">Status:</span>
            </div>
            {(['todos', 'Vigente', 'Em fase-teste', 'Previsto'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFiltro(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFiltro === st
                    ? 'bg-[#12B886] text-[#0A0E12]'
                    : 'bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA]'
                }`}
              >
                {st === 'todos' ? 'Todos os Status' : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-[#93A3B5]">
              <span className="font-semibold uppercase text-[10px] tracking-wider">Eixo:</span>
            </div>
            {(
              ['todos', 'Tributário', 'Carbono/SBCE', 'Comércio Exterior', 'Ambiental/ESG'] as const
            ).map((setor) => (
              <button
                key={setor}
                type="button"
                onClick={() => setSetorFiltro(setor)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  setorFiltro === setor
                    ? 'bg-[#D9B36C] text-[#0A0E12]'
                    : 'bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA]'
                }`}
              >
                {setor === 'todos' ? 'Todos os Eixos' : setor}
              </button>
            ))}
          </div>
        </div>

        {/* TIMELINE REGULATÓRIA VERTICAL */}
        <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-3 sm:before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[rgba(244,247,250,0.12)]">
          {itensFiltrados.map((item, idx) => (
            <div key={item.id} className="relative group animate-fade-in">
              {/* Marcador na Timeline */}
              <div
                className={`absolute -left-6 sm:-left-10 top-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 transition-transform group-hover:scale-110 ${
                  item.status === 'Vigente'
                    ? 'bg-[#12B886]/20 border-[#12B886] text-[#12B886]'
                    : item.status === 'Em fase-teste'
                      ? 'bg-[#D9B36C]/20 border-[#D9B36C] text-[#D9B36C]'
                      : 'bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6]'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    item.status === 'Vigente'
                      ? 'bg-[#12B886]'
                      : item.status === 'Em fase-teste'
                        ? 'bg-[#D9B36C]'
                        : 'bg-[#3B82F6]'
                  }`}
                />
              </div>

              {/* Card da Norma */}
              <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/40 transition-all shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-extrabold text-[#12B886] px-2.5 py-0.5 rounded bg-[#12B886]/10 border border-[#12B886]/20">
                      {item.dataMarco}
                    </span>
                    <span className="text-xs font-bold text-[#D9B36C] px-2.5 py-0.5 rounded bg-[#D9B36C]/10 border border-[#D9B36C]/20">
                      {item.norma}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-[#93A3B5] px-2 py-0.5 rounded bg-[#16202B]">
                      {item.tagSetorial}
                    </span>
                  </div>

                  {getStatusBadge(item.status)}
                </div>

                <div>
                  <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#F4F7FA]">
                    {item.titulo}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed mt-2">
                    {item.descricaoCurta}
                  </p>
                </div>

                {/* Quem Afeta & Ação Recomendada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#D9B36C] tracking-wider block">
                      Quem Afeta (Segmentos):
                    </span>
                    <ul className="space-y-1 text-xs text-[#F4F7FA]">
                      {item.quemAfeta.map((seg, sIdx) => (
                        <li
                          key={sIdx}
                          className="flex items-start gap-1.5 text-[11px] text-[#93A3B5]"
                        >
                          <span className="text-[#12B886] font-bold">•</span>
                          <span>{seg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[#12B886]/20 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#12B886] tracking-wider block">
                      Ação Recomendada Orbis:
                    </span>
                    <p className="text-xs text-[#F4F7FA] leading-relaxed">{item.acaoRecomendada}</p>
                  </div>
                </div>

                <div className="text-[11px] text-[#93A3B5]/80 border-t border-[rgba(244,247,250,0.06)] pt-2.5 flex items-center justify-between">
                  <span>Base Legal: {item.baseLegal}</span>
                  <Link
                    to="/diagnostico"
                    className="text-[#12B886] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Auditar Minha Empresa</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé da Página: Call-to-Action Institucional */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-[#111820] to-[#16202B] border border-[#12B886]/30 text-center space-y-4">
          <ShieldCheck className="w-10 h-10 text-[#12B886] mx-auto" />
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#F4F7FA]">
            Sua organização pronta para 1º de Agosto de 2026 e o Marco do SBCE
          </h2>
          <p className="text-xs sm:text-sm text-[#93A3B5] max-w-xl mx-auto leading-relaxed">
            O Orbis Protocol integra os dados dos seus documentos fiscais eletrônicos com motores
            periciais de emissões (Escopo 1/2/3) e comparativos automáticos de alíquotas IBS/CBS.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/diagnostico"
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
            >
              Iniciar Diagnóstico por CNPJ
            </Link>
            <Link
              to="/verificador"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886]"
            >
              Consultar Selos Homologados
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
