import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  ShieldCheck,
  Award,
  TrendingDown,
  CheckCircle2,
  ExternalLink,
  Plus,
  Edit,
  Eye,
  Copy,
  Check,
  Search,
  Filter,
  Layers,
  Leaf,
  FileCheck2,
  Lock,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  Package,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  listarPassaportesBureau,
  salvarPassaporteBureau,
  PassaporteFornecedorRecord,
} from '@/services/bureauPassaporteService'

export function BureauACP() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [passaportes, setPassaportes] = useState<PassaporteFornecedorRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [copiadoId, setCopiadoId] = useState<string | null>(null)

  // Modal / Edição de Passaporte
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [passaporteEdicao, setPassaporteEdicao] =
    useState<Partial<PassaporteFornecedorRecord> | null>(null)
  const [isSalvando, setIsSalvando] = useState(false)

  useEffect(() => {
    carregarPassaportes()
  }, [])

  const carregarPassaportes = async () => {
    setIsLoading(true)
    try {
      const lista = await listarPassaportesBureau()
      setPassaportes(lista)
    } catch {
      /* intentionally ignored */
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopiarLink = (token: string, id: string) => {
    const url = `${window.location.origin}/passaporte-fornecedor/${token}`
    navigator.clipboard.writeText(url)
    setCopiadoId(id)
    setTimeout(() => setCopiadoId(null), 3000)
  }

  const handleAbrirNovoPassaporte = () => {
    const randomToken = 'orbis-pass-' + Math.random().toString(36).substring(2, 10)
    setPassaporteEdicao({
      empresa_nome: '',
      empresa_cnpj: '',
      setor_atuacao: 'Indústria Metalmecânica & Cadeia Automotiva',
      token_consulta: randomToken,
      kg_co2e_por_kg_produzido: 2.15,
      peso_produzido_kg_ano: 320000,
      emissoes_totais_tco2e: 688,
      score_esg: 85,
      ativo: true,
      data_inventario_origem: new Date().toISOString().split('T')[0],
      matriz_gri_json: {
        economica: {
          status: 'conforme',
          itens: [
            { codigo: 'GRI 201', nome: 'Desempenho Econômico e Valor Direto', status: 'atendido' },
            { codigo: 'GRI 205', nome: 'Anticorrupção e Ética Concorrencial', status: 'atendido' },
          ],
        },
        ambiental: {
          status: 'conforme',
          itens: [
            { codigo: 'GRI 302', nome: 'Eficiência Energética e Matriz Limpa', status: 'atendido' },
            { codigo: 'GRI 305', nome: 'Inventário de Emissões GEE dMRV', status: 'atendido' },
          ],
        },
        social: {
          status: 'conforme',
          itens: [
            { codigo: 'GRI 403', nome: 'Saúde e Segurança do Trabalho (SST)', status: 'atendido' },
          ],
        },
      },
      certidoes_json: [
        {
          nome: 'CNDT - Débitos Trabalhistas',
          emissor: 'TST',
          status: 'valida',
          validade: '2026-12-31',
        },
        {
          nome: 'CND Tributos Federais e Previdenciários',
          emissor: 'Receita Federal',
          status: 'valida',
          validade: '2026-10-30',
        },
        {
          nome: 'Certificação ISO 14001:2015',
          emissor: 'Certificadora Acreditada',
          status: 'valida',
          validade: '2027-05-15',
        },
      ],
      curva_mac_json: [
        {
          iniciativa: 'Eficiência de Iluminação Industrial LED & Sensores',
          custo_reais_por_tco2e: -35,
          potencial_reducao_tco2e: 45,
          pay_back_meses: 12,
        },
        {
          iniciativa: 'Substituição de Queimadores por Indução Elétrica',
          custo_reais_por_tco2e: 40,
          potencial_reducao_tco2e: 120,
          pay_back_meses: 28,
        },
      ],
      dossie_elegibilidade_json: {
        brde_recupera_sul: {
          atende: true,
          pontuacao: 90,
          itens_atendidos: [
            'Inventário GHG auditado',
            'Licença de Operação válida',
            'Taxa bonificada elegível',
          ],
        },
        fomento_parana_verde: {
          atende: true,
          pontuacao: 92,
          itens_atendidos: [
            'Empreendimento no Paraná',
            'Certidões em dia',
            'Plano de descarbonização',
          ],
        },
      },
      config_revelacao_json: {
        mostrar_kg_co2e_produzido: true,
        mostrar_score_esg: true,
        mostrar_matriz_gri: true,
        mostrar_certidoes: true,
        mostrar_curva_mac: true,
        mostrar_dossie_elegibilidade: true,
        mostrar_volume_financeiro: false,
        mostrar_margem_lucro: false,
        mostrar_clientes_privados: false,
      },
    })
    setIsModalOpen(true)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passaporteEdicao || !passaporteEdicao.empresa_nome || !passaporteEdicao.empresa_cnpj) {
      alert('Preencha os campos obrigatórios da empresa.')
      return
    }

    setIsSalvando(true)
    try {
      // Computar hash de integridade
      const canonical = `${passaporteEdicao.empresa_cnpj}|${passaporteEdicao.token_consulta}|${passaporteEdicao.score_esg}|${passaporteEdicao.kg_co2e_por_kg_produzido}`
      const hash = Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))),
      )
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      const dadosParaSalvar = {
        ...passaporteEdicao,
        hash_integridade: hash,
        usuario: user?.id || 'admin',
      }

      await salvarPassaporteBureau(passaporteEdicao.id || null, dadosParaSalvar)
      setIsModalOpen(false)
      setPassaporteEdicao(null)
      await carregarPassaportes()
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar Passaporte do Fornecedor.')
    } finally {
      setIsSalvando(false)
    }
  }

  const passaportesFiltrados = passaportes.filter(
    (p) =>
      p.empresa_nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.empresa_cnpj.includes(busca) ||
      p.token_consulta.toLowerCase().includes(busca.toLowerCase()),
  )

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(244,247,250,0.1)] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-xs font-bold tracking-wider uppercase mb-2">
              <ShieldCheck className="w-4 h-4 text-[#12B886]" />
              COCKPIT DO BUREAU ACP • ASSOCIAÇÃO COMERCIAL DO PARANÁ
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA]">
              PASSAPORTE DO FORNECEDOR COM REVELAÇÃO SELETIVA
            </h1>
            <p className="text-xs sm:text-sm text-[#93A3B5] mt-1 max-w-3xl">
              Plataforma de homologação técnica e climática para cadeias compradoras. Revelação
              seletiva: compradores acessam indicadores verificados (kg CO₂e/kg, Score ESG, Curva
              MAC e Dossiê BRDE) sem expor margens comerciais ou preços estratégicos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={carregarPassaportes}
              className="p-2.5 rounded-lg bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#93A3B5] hover:text-[#F4F7FA]"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleAbrirNovoPassaporte}
              className="px-5 py-2.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center gap-2 text-xs uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Passaporte</span>
            </button>
          </div>
        </div>

        {/* 3 Métricas Rápidas do Cockpit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#93A3B5] block">Fornecedores Homologados</span>
              <div className="font-heading font-black text-3xl text-[#12B886] mt-1">
                {passaportes.length}
              </div>
              <span className="text-[10px] text-[#D9B36C] mt-1 block">
                Passaportes Verificados dMRV
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#12B886]/10 flex items-center justify-center text-[#12B886]">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#93A3B5] block">Score Médio ESG da Carteira</span>
              <div className="font-heading font-black text-3xl text-[#D9B36C] mt-1">
                {passaportes.length > 0
                  ? Math.round(
                      passaportes.reduce((acc, p) => acc + (p.score_esg || 0), 0) /
                        passaportes.length,
                    )
                  : 88}
                <span className="text-sm font-normal text-[#93A3B5]">/100</span>
              </div>
              <span className="text-[10px] text-[#12B886] mt-1 block">Conformidade Plena</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#D9B36C]/10 flex items-center justify-center text-[#D9B36C]">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#93A3B5] block">Elegibilidade BRDE / Fomento PR</span>
              <div className="font-heading font-black text-3xl text-[#12B886] mt-1">100%</div>
              <span className="text-[10px] text-[#93A3B5] mt-1 block">Com Dossiê Conectado</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#12B886]/10 flex items-center justify-center text-[#12B886]">
              <FileCheck2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Painel de Acesso Rápido aos Documentos Demonstrativos (DCP Corporativo & DCP do Produto) */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#111820] via-[#16202B] to-[#111820] border border-[#12B886]/40 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(244,247,250,0.08)] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#12B886] animate-pulse" />
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-[#F4F7FA]">
                DOCUMENTOS DEMONSTRATIVOS DCP • ESTRUTURA IMPRIMÍVEL (2 PÁGINAS)
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#D9B36C] uppercase bg-[#D9B36C]/10 px-2.5 py-0.5 rounded border border-[#D9B36C]/30">
              Padrão Oficial Orbis • Chave SHA-256 Verificável
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card DCP Corporativo Demo */}
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/60 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/30">
                    <Building2 className="w-3 h-3" />
                    Corporativo Demo
                  </span>
                  <span className="text-[10px] font-mono text-[#93A3B5]">
                    Competência Julho/2026
                  </span>
                </div>
                <h4 className="font-heading font-bold text-base text-[#F4F7FA]">
                  DCP Corporativo Demo (Indústrias & Logística Integrada)
                </h4>
                <p className="text-xs text-[#93A3B5] mt-1 leading-relaxed">
                  Página imprimível de 2 páginas lendo as 12 NF-e: Materialidade por CNAE,
                  inventário com duplo reporte (SIN × I-REC), classificação física NCM com Tiers,
                  parecer do Revisor e histórico de consultas.
                </p>
              </div>

              <div className="pt-2 border-t border-[rgba(244,247,250,0.06)] flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#D9B36C]">12 NF-e • 12 CNAEs</span>
                <Link
                  to="/corporativo/dcp"
                  className="px-3.5 py-1.5 rounded-lg bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-emerald-glow"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Abrir DCP Corporativo</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>

            {/* Card DCP do Produto Demo (Klabin NCM 4819) */}
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/60 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
                    <Package className="w-3 h-3" />
                    Produto / NCM 4819
                  </span>
                  <span className="text-[10px] font-mono text-[#93A3B5]">
                    Selo ORB-DCP-KLBN-4819
                  </span>
                </div>
                <h4 className="font-heading font-bold text-base text-[#F4F7FA]">
                  DCP do Produto (Caixas Kraft Klabin S.A.)
                </h4>
                <p className="text-xs text-[#93A3B5] mt-1 leading-relaxed">
                  Página imprimível de 2 páginas com unidade funcional de "1 unidade vendida",
                  pegada segregada fóssil × biogênica × emissões evitadas, hash SHA-256 verificável
                  e QR code público (?via=qr).
                </p>
              </div>

              <div className="pt-2 border-t border-[rgba(244,247,250,0.06)] flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#D9B36C]">
                  Unidade Funcional: 1 un
                </span>
                <Link
                  to="/dcp/ORB-DCP-KLBN-4819"
                  className="px-3.5 py-1.5 rounded-lg bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-emerald-glow"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Abrir DCP do Produto</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[#93A3B5] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por razão social, CNPJ ou token..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886]"
            />
          </div>

          <div className="text-xs text-[#93A3B5] flex items-center gap-2">
            <span>Revelação Seletiva:</span>
            <span className="px-2.5 py-1 rounded bg-[#12B886]/10 text-[#12B886] font-mono text-[10px] font-bold">
              Proteção Ativa de Dados Estratégicos
            </span>
          </div>
        </div>

        {/* Lista de Passaportes do Fornecedor */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-[#12B886] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#93A3B5]">
              Carregando carteira de fornecedores do Bureau...
            </p>
          </div>
        ) : passaportesFiltrados.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[rgba(244,247,250,0.15)] rounded-2xl bg-[#111820] space-y-3">
            <Building2 className="w-10 h-10 text-[#93A3B5] mx-auto opacity-50" />
            <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
              Nenhum fornecedor encontrado
            </h3>
            <p className="text-xs text-[#93A3B5]">
              Crie o primeiro passaporte do fornecedor para gerar links de consulta para os
              compradores.
            </p>
            <button
              onClick={handleAbrirNovoPassaporte}
              className="px-5 py-2.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] text-xs uppercase"
            >
              Criar Passaporte Demonstrativo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {passaportesFiltrados.map((pass) => (
              <div
                key={pass.id}
                className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] hover:border-[#12B886]/40 transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[rgba(244,247,250,0.06)] pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                        {pass.empresa_nome}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded bg-[#16202B] text-[#D9B36C] font-mono font-bold text-xs">
                        CNPJ: {pass.empresa_cnpj}
                      </span>
                    </div>
                    <div className="text-xs text-[#93A3B5] mt-1 flex flex-wrap gap-4">
                      <span>
                        Setor:{' '}
                        <strong className="text-[#F4F7FA]">
                          {pass.setor_atuacao || 'Industrial'}
                        </strong>
                      </span>
                      <span>
                        Inventário Origem:{' '}
                        <strong className="text-[#12B886]">
                          {pass.data_inventario_origem || '2026-02-15'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Score & Indicadores Resumidos */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[10px] text-[#93A3B5] block uppercase font-bold">
                        Intensidade
                      </span>
                      <span className="font-heading font-black text-xl text-[#12B886]">
                        {pass.kg_co2e_por_kg_produzido?.toFixed(2) || '1.84'}{' '}
                        <span className="text-xs font-normal text-[#93A3B5]">kg CO₂e/kg</span>
                      </span>
                    </div>

                    <div className="text-right border-l border-[rgba(244,247,250,0.08)] pl-6">
                      <span className="text-[10px] text-[#93A3B5] block uppercase font-bold">
                        Score ESG
                      </span>
                      <span className="font-heading font-black text-2xl text-[#D9B36C]">
                        {pass.score_esg || 88}
                        <span className="text-xs font-normal text-[#93A3B5]">/100</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-painel: Acesso Comprador via Link Tokenizado */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-[#12B886]" />
                      <strong className="text-[#F4F7FA]">
                        Link Público Tokenizado do Comprador:
                      </strong>
                    </div>
                    <div className="font-mono text-[11px] text-[#93A3B5] truncate">
                      {window.location.origin}/passaporte-fornecedor/{pass.token_consulta}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => handleCopiarLink(pass.token_consulta, pass.id)}
                      className="px-3.5 py-2 rounded-lg bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#93A3B5] hover:text-[#F4F7FA] text-xs flex items-center gap-1.5"
                    >
                      {copiadoId === pass.id ? (
                        <Check className="w-3.5 h-3.5 text-[#12B886]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiadoId === pass.id ? 'Copiado!' : 'Copiar Link Comprador'}</span>
                    </button>

                    <Link
                      to={`/passaporte-fornecedor/${pass.token_consulta}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-lg bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] font-bold text-xs flex items-center gap-1.5 shadow-emerald-glow"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Abrir Visão do Comprador</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setPassaporteEdicao(pass)
                        setIsModalOpen(true)
                      }}
                      className="p-2 rounded-lg bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA]"
                      title="Editar configurações de revelação"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL DE CRIAÇÃO / EDIÇÃO DO PASSAPORTE */}
        {isModalOpen && passaporteEdicao && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-2xl w-full my-8 p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.15)] shadow-2xl space-y-6 text-xs animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.1)] pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#12B886] block">
                    Cockpit Bureau ACP
                  </span>
                  <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                    {passaporteEdicao.id
                      ? 'EDITAR PASSAPORTE DO FORNECEDOR'
                      : 'CRIAR NOVO PASSAPORTE'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#93A3B5] hover:text-[#F4F7FA] text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSalvar} className="space-y-5">
                {/* Dados Principais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-[#93A3B5] mb-1">Razão Social *</label>
                    <input
                      type="text"
                      required
                      value={passaporteEdicao.empresa_nome || ''}
                      onChange={(e) =>
                        setPassaporteEdicao({ ...passaporteEdicao, empresa_nome: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#93A3B5] mb-1">CNPJ *</label>
                    <input
                      type="text"
                      required
                      value={passaporteEdicao.empresa_cnpj || ''}
                      onChange={(e) =>
                        setPassaporteEdicao({ ...passaporteEdicao, empresa_cnpj: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#93A3B5] mb-1">
                      Setor de Atuação
                    </label>
                    <input
                      type="text"
                      value={passaporteEdicao.setor_atuacao || ''}
                      onChange={(e) =>
                        setPassaporteEdicao({ ...passaporteEdicao, setor_atuacao: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#93A3B5] mb-1">
                      Token de Consulta Pública
                    </label>
                    <input
                      type="text"
                      required
                      value={passaporteEdicao.token_consulta || ''}
                      onChange={(e) =>
                        setPassaporteEdicao({ ...passaporteEdicao, token_consulta: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#D9B36C] font-mono"
                    />
                  </div>
                </div>

                {/* Métricas Técnicas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                  <div>
                    <label className="block text-[10px] text-[#93A3B5] mb-1">
                      kg CO₂e/kg Produzido
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={passaporteEdicao.kg_co2e_por_kg_produzido ?? 1.84}
                      onChange={(e) =>
                        setPassaporteEdicao({
                          ...passaporteEdicao,
                          kg_co2e_por_kg_produzido: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded bg-[#111820] border border-[rgba(244,247,250,0.15)] text-[#12B886] font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#93A3B5] mb-1">Volume kg/ano</label>
                    <input
                      type="number"
                      value={passaporteEdicao.peso_produzido_kg_ano ?? 300000}
                      onChange={(e) =>
                        setPassaporteEdicao({
                          ...passaporteEdicao,
                          peso_produzido_kg_ano: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded bg-[#111820] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#93A3B5] mb-1">
                      Score ESG (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={passaporteEdicao.score_esg ?? 85}
                      onChange={(e) =>
                        setPassaporteEdicao({
                          ...passaporteEdicao,
                          score_esg: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded bg-[#111820] border border-[rgba(244,247,250,0.15)] text-[#D9B36C] font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Configuração de Revelação Seletiva */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 space-y-3">
                  <div className="flex items-center gap-2 text-[#12B886] font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Configuração de Revelação Seletiva (O que o Comprador Pode Ver)</span>
                  </div>
                  <p className="text-[11px] text-[#93A3B5]">
                    Os dados sensíveis da sua empresa nunca são expostos. Marque os blocos técnicos
                    que serão projetados na URL do comprador:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <label className="flex items-center gap-2 text-[#F4F7FA] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          passaporteEdicao.config_revelacao_json?.mostrar_kg_co2e_produzido ?? true
                        }
                        onChange={(e) =>
                          setPassaporteEdicao({
                            ...passaporteEdicao,
                            config_revelacao_json: {
                              ...passaporteEdicao.config_revelacao_json!,
                              mostrar_kg_co2e_produzido: e.target.checked,
                            },
                          })
                        }
                        className="accent-[#12B886]"
                      />
                      <span>Intensidade de Emissão (kg CO₂e/kg)</span>
                    </label>

                    <label className="flex items-center gap-2 text-[#F4F7FA] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={passaporteEdicao.config_revelacao_json?.mostrar_score_esg ?? true}
                        onChange={(e) =>
                          setPassaporteEdicao({
                            ...passaporteEdicao,
                            config_revelacao_json: {
                              ...passaporteEdicao.config_revelacao_json!,
                              mostrar_score_esg: e.target.checked,
                            },
                          })
                        }
                        className="accent-[#12B886]"
                      />
                      <span>Score ESG Calculado (0-100)</span>
                    </label>

                    <label className="flex items-center gap-2 text-[#F4F7FA] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={passaporteEdicao.config_revelacao_json?.mostrar_curva_mac ?? true}
                        onChange={(e) =>
                          setPassaporteEdicao({
                            ...passaporteEdicao,
                            config_revelacao_json: {
                              ...passaporteEdicao.config_revelacao_json!,
                              mostrar_curva_mac: e.target.checked,
                            },
                          })
                        }
                        className="accent-[#12B886]"
                      />
                      <span>Curva MAC (Custo de Abatimento)</span>
                    </label>

                    <label className="flex items-center gap-2 text-[#F4F7FA] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          passaporteEdicao.config_revelacao_json?.mostrar_dossie_elegibilidade ??
                          true
                        }
                        onChange={(e) =>
                          setPassaporteEdicao({
                            ...passaporteEdicao,
                            config_revelacao_json: {
                              ...passaporteEdicao.config_revelacao_json!,
                              mostrar_dossie_elegibilidade: e.target.checked,
                            },
                          })
                        }
                        className="accent-[#12B886]"
                      />
                      <span>Dossiê BRDE / Fomento Paraná</span>
                    </label>

                    <label className="flex items-center gap-2 text-[#F4F7FA] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={passaporteEdicao.config_revelacao_json?.mostrar_certidoes ?? true}
                        onChange={(e) =>
                          setPassaporteEdicao({
                            ...passaporteEdicao,
                            config_revelacao_json: {
                              ...passaporteEdicao.config_revelacao_json!,
                              mostrar_certidoes: e.target.checked,
                            },
                          })
                        }
                        className="accent-[#12B886]"
                      />
                      <span>Certidões Fiscais e Ambientais</span>
                    </label>

                    <label className="flex items-center gap-2 text-[#F4F7FA] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={passaporteEdicao.config_revelacao_json?.mostrar_matriz_gri ?? true}
                        onChange={(e) =>
                          setPassaporteEdicao({
                            ...passaporteEdicao,
                            config_revelacao_json: {
                              ...passaporteEdicao.config_revelacao_json!,
                              mostrar_matriz_gri: e.target.checked,
                            },
                          })
                        }
                        className="accent-[#12B886]"
                      />
                      <span>Matriz GRI Simplificada</span>
                    </label>
                  </div>

                  <div className="pt-2 border-t border-[rgba(244,247,250,0.06)] flex items-center gap-2 text-[10px] text-[#93A3B5]">
                    <Lock className="w-3 h-3 text-[#D9B36C]" />
                    <span>
                      Sigilo Absoluto: Preços unitários, margens de lucro e faturamento NUNCA são
                      revelados na API pública.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[rgba(244,247,250,0.15)] text-[#93A3B5] hover:text-[#F4F7FA]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSalvando}
                    className="px-6 py-2.5 rounded-lg bg-[#12B886] text-[#0A0E12] font-bold uppercase tracking-wider shadow-emerald-glow"
                  >
                    {isSalvando ? 'Salvando...' : 'Salvar Passaporte'}
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
export default BureauACP
