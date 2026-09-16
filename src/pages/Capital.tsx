import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import {
  LINHAS_CREDITO_VERDE,
  FinalidadeCreditoVerde,
  simularGreenCapitalEngine,
  formatarFinalidade,
  ResultadoGreenCapitalEngine,
} from '@/services/greenCapitalEngine'
import { exportarRelatorioDossiePdf } from '@/services/relatorioLaudoPdf'
import { formatCurrencyBRL } from '@/services/nfeParser'
import {
  Coins,
  TrendingDown,
  Building2,
  FileCheck2,
  Download,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sliders,
  ExternalLink,
  Layers,
  HelpCircle,
  FileText,
} from 'lucide-react'

import type { RecordModel } from 'pocketbase'

interface LeadDiagnostico extends RecordModel {
  cnpj: string
  razao_social: string
  regime_tributario: string
  vinculo_institucional?: string
  categoria_profissional?: string
  faixa_emissoes?: string
  enquadramento_sbce?: string
}

interface EmissoesInventarioRecord extends RecordModel {
  empresa_nome: string
  cnpj: string
  escopo1_total_tco2e: number
  escopo2_localizacao_tco2e: number
  escopo2_mercado_tco2e: number
  escopo3_total_tco2e: number
  emissoes_totais_tco2e: number
  insetting_iso14067_tco2e: number
  incerteza_consolidada_pct: number
  status_sbce: string
  laudo_detalhes_json: any
}

export default function Capital() {
  const { user } = useAuth()

  // Entradas da simulação
  const [valorDesejado, setValorDesejado] = useState<number>(500000)
  const [prazoMeses, setPrazoMeses] = useState<number>(48)
  const [finalidade, setFinalidade] = useState<FinalidadeCreditoVerde>('eficiencia_energetica')

  // Contexto de dados carregados do cliente
  const [leadAtual, setLeadAtual] = useState<LeadDiagnostico | null>(null)
  const [ultimoInventario, setUltimoInventario] = useState<EmissoesInventarioRecord | null>(null)
  const [linhaSelecionadaId, setLinhaSelecionadaId] = useState<string | null>(null)
  const [salvandoSimulacao, setSalvandoSimulacao] = useState(false)
  const [simulacaoSalvaSucesso, setSimulacaoSalvaSucesso] = useState<string | null>(null)
  const [exportandoPdf, setExportandoPdf] = useState(false)

  // Carrega dados do cliente se autenticado
  useEffect(() => {
    const carregarDadosCliente = async () => {
      try {
        if (!user?.id) return

        // 1. Lead do diagnóstico
        const leadsRes = await pb.collection('leads_diagnostico').getList<LeadDiagnostico>(1, 1, {
          sort: '-created',
        })
        if (leadsRes.items.length > 0) {
          setLeadAtual(leadsRes.items[0])
        }

        // 2. Último inventário de emissões do motor pericial
        const invRes = await pb
          .collection('emissoes_inventario')
          .getList<EmissoesInventarioRecord>(1, 1, {
            sort: '-created',
          })
        if (invRes.items.length > 0) {
          setUltimoInventario(invRes.items[0])
        }
      } catch {
        /* silencia se não houver dados */
      }
    }

    carregarDadosCliente()
  }, [user])

  // Executa o motor do Green Capital Engine
  const resultadoSimulacao: ResultadoGreenCapitalEngine = simularGreenCapitalEngine({
    valorDesejado,
    prazoMeses,
    finalidade,
    temInventarioOrbis: Boolean(ultimoInventario),
    emissoesTotaisTCO2e: ultimoInventario?.emissoes_totais_tco2e,
    regimeTributario: leadAtual?.regime_tributario,
  })

  // Salvar simulação no histórico do banco de dados
  const handleSalvarSimulacao = async () => {
    if (!user?.id) return
    setSalvandoSimulacao(true)
    setSimulacaoSalvaSucesso(null)

    const melhor = resultadoSimulacao.melhorLinha
    try {
      await pb.collection('simulacoes_credito_verde').create({
        usuario: user.id,
        empresa_nome: leadAtual?.razao_social || user.name || 'Empresa Cadastrada',
        cnpj: leadAtual?.cnpj || 'CNPJ em análise',
        valor_desejado: valorDesejado,
        prazo_meses: prazoMeses,
        finalidade: finalidade,
        linha_selecionada_id: melhor?.linha.id || 'todas',
        linha_selecionada_nome: melhor?.linha.nome || 'Melhor linha avaliada',
        taxa_padrao_aa: melhor?.taxaPadraoAa || 16.0,
        taxa_bonificada_aa: melhor?.taxaBonificadaAa || 10.0,
        economia_anual_estimada: resultadoSimulacao.economiaAnualMaxima,
        economia_total_estimada: resultadoSimulacao.economiaTotalMaxima,
        detalhes_simulacao_json: resultadoSimulacao,
      })
      setSimulacaoSalvaSucesso('Simulação registrada no seu histórico de Finanças Verdes!')
    } catch (err: any) {
      setSimulacaoSalvaSucesso(`Erro ao registrar: ${err.message || 'Falha na persistência'}`)
    } finally {
      setSalvandoSimulacao(false)
    }
  }

  // Exportar PDF do Dossiê Completo
  const handleExportarDossiePdf = async () => {
    setExportandoPdf(true)
    try {
      await exportarRelatorioDossiePdf(
        {
          identificacao: {
            razaoSocial: leadAtual?.razao_social || user?.name || 'Empresa Cliente',
            cnpj: leadAtual?.cnpj || '00.000.000/0001-00',
            responsavel: user?.name,
            regimeTributario: leadAtual?.regime_tributario,
            vinculoInstitucional: leadAtual?.vinculo_institucional,
            geradoPorNome: user?.name || 'Perito Orbis',
            geradoPorRole: 'cliente',
          },
          diagnostico: {
            enquadramentoSbceTexto: leadAtual?.enquadramento_sbce,
            statusSbce: ultimoInventario?.status_sbce,
            faixaEmissoes: leadAtual?.faixa_emissoes,
          },
          inventario: ultimoInventario ? (ultimoInventario.laudo_detalhes_json as any) : null,
          greenCapital: resultadoSimulacao,
        },
        async (hash, codigo) => {
          if (user?.id) {
            await pb.collection('relatorios_exportados').create({
              usuario: user.id,
              cnpj: leadAtual?.cnpj || '00.000.000/0001-00',
              razao_social: leadAtual?.razao_social || 'Empresa Cliente',
              tipo_relatorio: 'green_capital',
              codigo_verificacao: codigo,
              hash_sha256: hash,
              gerado_por_nome: user.name || user.email,
              gerado_por_role: 'cliente',
              metadados_json: { valorDesejado, prazoMeses, finalidade },
            })
          }
        },
      )
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar relatório PDF.')
    } finally {
      setExportandoPdf(false)
    }
  }

  const linhaDetalhada = LINHAS_CREDITO_VERDE.find((l) => l.id === linhaSelecionadaId)

  return (
    <div className="min-h-screen py-10 md:py-16 bg-[#0A0E12] text-[#F4F7FA]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Cabeçalho da Página / Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[rgba(244,247,250,0.1)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-3">
              <Coins className="w-4 h-4" />
              ORBIS GREEN CAPITAL ENGINE • FINANÇAS SUSTENTÁVEIS
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA]">
              SIMULADOR DE CRÉDITO VERDE & SPREAD BONIFICADO
            </h1>
            <p className="text-xs sm:text-sm text-[#93A3B5] mt-1 max-w-3xl">
              Monetize sua conformidade climática: compare as taxas padrão de mercado com as taxas
              bonificadas oferecidas por bancos ao comprovar descarbonização com o laudo pericial
              Orbis Protocol.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportarDossiePdf}
              disabled={exportandoPdf}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exportandoPdf ? 'Gerando Dossiê...' : 'Exportar Dossiê em PDF'}</span>
            </button>
            <Link
              to="/trilhas/sbce-financas-verdes"
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#D9B36C] hover:border-[#D9B36C]"
            >
              Trilha de Finanças Verdes
            </Link>
          </div>
        </div>

        {/* Banner de Evidência: Inventário Já Conectado */}
        {ultimoInventario ? (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-[#12B886]/10 border border-[#12B886]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#12B886]/20 text-[#12B886]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-[#12B886] block">
                  Evidência dMRV Ativa no seu Perfil
                </span>
                <div className="text-sm font-semibold text-[#F4F7FA]">
                  Inventário com{' '}
                  <strong className="text-[#12B886]">
                    {ultimoInventario.emissoes_totais_tco2e.toFixed(2)} tCO₂e
                  </strong>{' '}
                  apuradas no Motor Pericial (GWP AR6)
                </div>
                <div className="text-[11px] text-[#93A3B5]">
                  Status SBCE: {ultimoInventario.status_sbce} • Incerteza:{' '}
                  {ultimoInventario.incerteza_consolidada_pct}%
                </div>
              </div>
            </div>

            <Link
              to="/painel"
              className="text-xs font-bold text-[#12B886] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Ver no Painel do Cliente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="mb-8 p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#93A3B5]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#D9B36C] shrink-0" />
              <span>
                Nenhum inventário de emissões formalizado ainda. Importe suas notas fiscais na aba{' '}
                <strong className="text-[#F4F7FA]">Motor Pericial</strong> do Painel para maximizar
                sua nota de crédito verde.
              </span>
            </div>
            <Link
              to="/painel"
              className="px-3 py-1.5 rounded-lg bg-[#16202B] text-[#F4F7FA] hover:text-[#12B886] border border-[rgba(244,247,250,0.1)] whitespace-nowrap font-medium"
            >
              Importar NF-e
            </Link>
          </div>
        )}

        {/* GRID: CONTROLES DO SIMULADOR (ESQUERDA) x CARDS DE ECONOMIA (DIREITA) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Coluna 1..5: Controles do Simulador */}
          <div className="lg:col-span-5 p-6 sm:p-7 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl space-y-6">
            <div className="flex items-center gap-2 border-b border-[rgba(244,247,250,0.08)] pb-4">
              <Sliders className="w-5 h-5 text-[#12B886]" />
              <h2 className="font-heading font-bold text-base text-[#F4F7FA]">
                PARÂMETROS DA OPERAÇÃO DE CRÉDITO
              </h2>
            </div>

            {/* Slider / Input de Valor Desejado */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <label className="uppercase font-bold text-[#93A3B5]">Valor do Financiamento</label>
                <span className="font-mono font-bold text-sm text-[#12B886]">
                  {formatCurrencyBRL(valorDesejado)}
                </span>
              </div>
              <input
                type="range"
                min={30000}
                max={10000000}
                step={10000}
                value={valorDesejado}
                onChange={(e) => setValorDesejado(Number(e.target.value))}
                className="w-full accent-[#12B886] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#93A3B5] mt-1 font-mono">
                <span>R$ 30 mil</span>
                <span>R$ 2,5 mi</span>
                <span>R$ 5 mi</span>
                <span>R$ 10 mi</span>
              </div>
            </div>

            {/* Prazo em Meses */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <label className="uppercase font-bold text-[#93A3B5]">Prazo de Pagamento</label>
                <span className="font-mono font-bold text-sm text-[#F4F7FA]">
                  {prazoMeses} meses ({(prazoMeses / 12).toFixed(1)} anos)
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[24, 36, 48, 60, 72, 96, 120, 144].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrazoMeses(p)}
                    className={`py-2 rounded-lg text-xs font-mono font-semibold transition-all border ${
                      prazoMeses === p
                        ? 'bg-[#12B886] text-[#0A0E12] border-[#12B886]'
                        : 'bg-[#0A0E12] text-[#93A3B5] border-[rgba(244,247,250,0.1)] hover:text-[#F4F7FA]'
                    }`}
                  >
                    {p}m
                  </button>
                ))}
              </div>
            </div>

            {/* Finalidade do Investimento */}
            <div>
              <label className="block text-xs uppercase font-bold text-[#93A3B5] mb-2">
                Finalidade do Investimento Sustentável
              </label>
              <select
                value={finalidade}
                onChange={(e) => setFinalidade(e.target.value as FinalidadeCreditoVerde)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] focus:outline-none focus:ring-1 focus:ring-[#12B886]"
              >
                <option value="eficiencia_energetica">
                  Eficiência Energética & Retrofitting Industrial
                </option>
                <option value="energia_solar">Geração de Energia Solar Fotovoltaica</option>
                <option value="frota_eletrica_gas">
                  Frota Elétrica, Híbrida ou a Biometano / GNV
                </option>
                <option value="economia_circular">
                  Economia Circular, Reciclagem & Reúso (CDVs / MOVER)
                </option>
                <option value="agro_verde">
                  Agro Sustentável, Bioinsumos & Recuperação de Pastagens
                </option>
              </select>
            </div>

            {/* Ações de Registro */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSalvarSimulacao}
                disabled={salvandoSimulacao}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#12B886]/10 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-all border border-[#12B886]/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>
                  {salvandoSimulacao ? 'Gravando Simulação...' : 'Salvar no Histórico da Conta'}
                </span>
              </button>

              {simulacaoSalvaSucesso && (
                <div className="p-3 rounded-lg bg-[#12B886]/20 border border-[#12B886]/40 text-xs text-[#12B886] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{simulacaoSalvaSucesso}</span>
                </div>
              )}
            </div>
          </div>

          {/* Coluna 6..12: Painel de Resultados & Comparativo de Spread */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            {/* Top Cards de Economia de Spread */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#111820] to-[#16202B] border border-[#12B886]/40 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#12B886]">
                    Economia Anual em Spread
                  </span>
                  <TrendingDown className="w-5 h-5 text-[#12B886]" />
                </div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-[#12B886]">
                  {formatCurrencyBRL(resultadoSimulacao.economiaAnualMaxima)}
                </div>
                <p className="text-xs text-[#93A3B5] mt-1">
                  Redução média anual de juros ao comprovar mitigação climática com o laudo Orbis.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#111820] to-[#0A0E12] border border-[#D9B36C]/40 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#D9B36C]">
                    Economia Total no Contrato
                  </span>
                  <Coins className="w-5 h-5 text-[#D9B36C]" />
                </div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-[#D9B36C]">
                  {formatCurrencyBRL(resultadoSimulacao.economiaTotalMaxima)}
                </div>
                <p className="text-xs text-[#93A3B5] mt-1">
                  Juros evitados acumulados ao longo dos {prazoMeses} meses de financiamento.
                </p>
              </div>
            </div>

            {/* Destaque da Melhor Linha */}
            {resultadoSimulacao.melhorLinha && (
              <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#93A3B5]">
                    Linha com Maior Potencial de Bonificação
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#12B886]/20 text-[#12B886] text-[10px] font-bold uppercase">
                    Recomendada
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(244,247,250,0.08)]">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                      {resultadoSimulacao.melhorLinha.linha.nome}
                    </h3>
                    <div className="text-xs text-[#93A3B5] flex items-center gap-2 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-[#D9B36C]" />
                      <span>{resultadoSimulacao.melhorLinha.linha.instituicao}</span>
                      <span>•</span>
                      <span>{resultadoSimulacao.melhorLinha.linha.categoria}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-[#93A3B5] block uppercase">
                        Taxa Padrão
                      </span>
                      <span className="text-sm font-mono text-[#F03E54] line-through font-semibold">
                        {resultadoSimulacao.melhorLinha.taxaPadraoAa.toFixed(1)}% a.a.
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#12B886] block uppercase font-bold">
                        Taxa Bonificada
                      </span>
                      <span className="text-lg font-mono text-[#12B886] font-extrabold">
                        {resultadoSimulacao.melhorLinha.taxaBonificadaAa.toFixed(1)}% a.a.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                  <div>
                    <span className="text-[#93A3B5] block text-[10px] uppercase">
                      Parcela Padrão
                    </span>
                    <strong className="text-[#F4F7FA] font-mono">
                      {formatCurrencyBRL(resultadoSimulacao.melhorLinha.parcelaMensalPadrao)}/mês
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#12B886] block text-[10px] uppercase">
                      Parcela com Laudo
                    </span>
                    <strong className="text-[#12B886] font-mono">
                      {formatCurrencyBRL(resultadoSimulacao.melhorLinha.parcelaMensalBonificada)}
                      /mês
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#D9B36C] block text-[10px] uppercase">
                      Diferença de Spread
                    </span>
                    <strong className="text-[#D9B36C] font-mono">
                      -{resultadoSimulacao.melhorLinha.diferencaSpreadPontos.toFixed(1)} p.p.
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#93A3B5] block text-[10px] uppercase">
                      Carência Estimada
                    </span>
                    <strong className="text-[#F4F7FA]">
                      Até {resultadoSimulacao.melhorLinha.linha.carenciaMeses} meses
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimer Regulatório Obrigatório */}
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-[11px] text-[#93A3B5] leading-relaxed">
              <strong className="text-[#F4F7FA] block mb-1">Aviso Regulatório & Bancário:</strong>
              {resultadoSimulacao.disclaimer}
            </div>
          </div>
        </div>

        {/* TABELA COMPARATIVA COMPLETA DAS 8 LINHAS DE CRÉDITO VERDE */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#12B886]" />
                <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  MATRIZ DAS 8 LINHAS DE CRÉDITO VERDE & ELEGIBILIDADE
                </h2>
              </div>
              <p className="text-xs text-[#93A3B5] mt-0.5">
                {resultadoSimulacao.totalLinhasCompativeis} linhas atendem integralmente ao valor de{' '}
                {formatCurrencyBRL(valorDesejado)} e finalidade selecionada.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#12B886]" />
              <span className="text-xs text-[#93A3B5]">Compatível com seu perfil</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[rgba(244,247,250,0.1)] text-[#93A3B5] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-3">Instituição / Linha</th>
                  <th className="py-3 px-3">Público & Categoria</th>
                  <th className="py-3 px-3 text-right">Taxa Padrão</th>
                  <th className="py-3 px-3 text-right">Taxa Bonificada</th>
                  <th className="py-3 px-3 text-right">Economia no Prazo</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA]">
                {resultadoSimulacao.linhasAvaliadas.map((item) => (
                  <tr
                    key={item.linha.id}
                    className={`hover:bg-[#16202B]/60 transition-colors ${
                      item.compativel ? '' : 'opacity-60 bg-[#0A0E12]/40'
                    }`}
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[#F4F7FA]">{item.linha.nome}</div>
                      <div className="text-[11px] text-[#93A3B5]">
                        Faixa: {formatCurrencyBRL(item.linha.faixaValorMin)} a{' '}
                        {formatCurrencyBRL(item.linha.faixaValorMax)}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-[#D9B36C]">
                        {item.linha.instituicao} ({item.linha.categoria})
                      </div>
                      <div className="text-[10px] text-[#93A3B5] truncate max-w-[180px]">
                        {item.linha.publicoAlvo}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono text-[#93A3B5]">
                      {item.taxaPadraoAa.toFixed(1)}% a.a.
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-[#12B886]">
                      {item.taxaBonificadaAa.toFixed(1)}% a.a.
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-extrabold text-[#D9B36C]">
                      {formatCurrencyBRL(item.economiaTotalPrazo)}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {item.compativel ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#12B886]/10 text-[#12B886] text-[10px] font-bold border border-[#12B886]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Elegível
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F03E54]/10 text-[#F03E54] text-[10px] font-semibold border border-[#F03E54]/30"
                          title={item.motivosIncompatibilidade.join('; ')}
                        >
                          Incompatível
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setLinhaSelecionadaId(item.linha.id)}
                        className="px-3 py-1 rounded-lg bg-[#16202B] text-[#F4F7FA] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors text-xs font-semibold border border-[rgba(244,247,250,0.12)]"
                      >
                        Ver Dossiê
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL / DRAWER DE DETALHES DA LINHA E EVIDÊNCIAS QUE O ORBIS ATENDE */}
        {linhaDetalhada && (
          <div className="fixed inset-0 z-50 bg-[#0A0E12]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111820] border border-[rgba(244,247,250,0.15)] rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-start justify-between border-b border-[rgba(244,247,250,0.1)] pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] text-[10px] font-bold uppercase">
                      {linhaDetalhada.categoria}
                    </span>
                    <span className="text-xs text-[#93A3B5] font-mono">
                      {linhaDetalhada.instituicao}
                    </span>
                  </div>
                  <h3 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                    {linhaDetalhada.nome}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setLinhaSelecionadaId(null)}
                  className="px-3 py-1 rounded-lg bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA] text-xs font-semibold"
                >
                  Fechar
                </button>
              </div>

              <p className="text-xs text-[#93A3B5] leading-relaxed">{linhaDetalhada.descricao}</p>

              {/* Condições Financeiras */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] block">
                    Taxa Bonificada
                  </span>
                  <strong className="text-sm font-mono text-[#12B886]">
                    {linhaDetalhada.taxaBonificadaVerdeAa.toFixed(1)}% a.a.
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] block">
                    Taxa de Mercado
                  </span>
                  <strong className="text-sm font-mono text-[#F03E54] line-through">
                    {linhaDetalhada.taxaPadraoMercadoAa.toFixed(1)}% a.a.
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] block">
                    Prazo Operacional
                  </span>
                  <strong className="text-[#F4F7FA]">
                    {linhaDetalhada.prazoMinMeses} a {linhaDetalhada.prazoMaxMeses} meses
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] block">
                    Carência
                  </span>
                  <strong className="text-[#D9B36C]">
                    Até {linhaDetalhada.carenciaMeses} meses
                  </strong>
                </div>
              </div>

              {/* Exigências Documentais vs O que o Orbis Atende */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#D9B36C] mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Exigências Documentais Bancárias
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#93A3B5]">
                    {linhaDetalhada.exigenciasDocumentais.map((exig, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#D9B36C] font-bold">•</span>
                        <span>{exig}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#12B886]/10 border border-[#12B886]/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#12B886] mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Evidências Probatórias que o Orbis Protocol Já Entrega
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#F4F7FA]">
                    {linhaDetalhada.evidenciasQueOrbisAtende.map((evid, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#12B886] shrink-0 mt-0.5" />
                        <span>{evid}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="pt-2 flex items-center justify-between border-t border-[rgba(244,247,250,0.1)]">
                <button
                  type="button"
                  onClick={handleExportarDossiePdf}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Dossiê Desta Linha em PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLinhaSelecionadaId(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA]"
                >
                  Concluir Leitura
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
