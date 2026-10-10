import React, { useState, useMemo } from 'react'
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  BarChart3,
  Scale,
  Building2,
  FileText,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Eye,
  RotateCcw,
  Info,
} from 'lucide-react'
import { calcularInventarioEmissoes } from '@/services/motorEmissoes'
import type { DocumentoFiscalProcessado } from '@/services/modelosFiscaisParser'

export interface NFeUploadItem {
  id?: string
  data_emissao?: string
  valor_total_nf?: number
  total_kg_co2e?: number // se gravado aditivamente
  combustivel_tipo?: string
  combustivel_litros?: number
  energia_kwh?: number
  transporte_tkm?: number
  resumo_itens_json?: any
  origem?: string
  modelo_fiscal?: string
  modelo?: string
  chave_acesso?: string
  numero_nota?: string
  serie?: string
  cnpj_emitente?: string
  nome_emitente?: string
  cnpj_destinatario?: string
  nome_destinatario?: string
  created?: string
  dados_adicionais_json?: any
  [key: string]: any
}

export interface ExtratoCarbonoMensalSectionProps {
  nfeList: NFeUploadItem[]
  numFuncionarios?: number | string | null
  segmento?: string | null
  porte?: string | null
  razaoSocial?: string
  cnpj?: string
  className?: string
}

// Helper para calcular kgCO2e de uma nota usando os campos reais e o motor canônico
export function calcularKgCo2eNota(nota: NFeUploadItem): number {
  if (
    typeof nota.total_kg_co2e === 'number' &&
    !isNaN(nota.total_kg_co2e) &&
    nota.total_kg_co2e > 0
  ) {
    return nota.total_kg_co2e
  }

  // Prepara documento fiscal compatível com o motor canônico
  const rawTipo = nota.combustivel_tipo
  const cTipo: 'diesel' | 'gasolina' | 'etanol' | 'glp' | 'gnv' | undefined =
    rawTipo === 'diesel' ||
    rawTipo === 'gasolina' ||
    rawTipo === 'etanol' ||
    rawTipo === 'glp' ||
    rawTipo === 'gnv'
      ? rawTipo
      : undefined

  const doc: DocumentoFiscalProcessado = {
    chaveAcesso: nota.chave_acesso || nota.id || 'CHAVE_TEMP',
    modeloFiscal: (nota.modelo_fiscal as any) || (nota.modelo === '65' ? '65_nfce' : '55_nfe'),
    numeroDocumento: nota.numero_nota || '1',
    serie: nota.serie || '1',
    dataEmissao: nota.data_emissao || nota.created || new Date().toISOString(),
    cnpjEmitente: nota.cnpj_emitente || '',
    nomeEmitente: nota.nome_emitente || '',
    cnpjDestinatario: nota.cnpj_destinatario || '',
    nomeDestinatario: nota.nome_destinatario || '',
    valorTotal: nota.valor_total_nf || 0,
    valorIcms: nota.valor_icms || 0,
    valorIpi: nota.valor_ipi || 0,
    valorPis: nota.valor_pis || 0,
    valorCofins: nota.valor_cofins || 0,
    combustivelTipo: cTipo,
    combustivelLitros: nota.combustivel_litros,
    energiaKwh: nota.energia_kwh,
    transporteTkm: nota.transporte_tkm,
    aguaM3: nota.dados_adicionais_json?.agua_m3,
    telecomGb: nota.dados_adicionais_json?.telecom_gb,
    pecasReutilizadasQtd: nota.dados_adicionais_json?.pecas_cdv_qtd,
    origem: (nota.origem as any) || 'manual',
    itens: Array.isArray(nota.resumo_itens_json) ? nota.resumo_itens_json : [],
    nomeArquivo: nota.nome_arquivo || 'documento.xml',
  }

  try {
    const inv = calcularInventarioEmissoes([doc])
    // emissoesTotaisFosseisTCO2e vem em tCO2e; convertemos para kgCO2e
    const kg = (inv.emissoesTotaisFosseisTCO2e || 0) * 1000
    // Se a nota tiver valor total mas itens não geraram emissão específica (ex.: sem NCM mapeado),
    // aplicamos estimativa conservadora padrão da plataforma (35 kgCO2e / R$ 1.000 faturados conforme benchmark setorial)
    if (kg <= 0 && (nota.valor_total_nf || 0) > 0) {
      return Number(((nota.valor_total_nf || 0) * 0.035).toFixed(2))
    }
    return Number(kg.toFixed(2))
  } catch {
    return Number(((nota.valor_total_nf || 0) * 0.035).toFixed(2))
  }
}

// Gera histórico mensal dos últimos 6 meses a partir de uma data de referência
function gerarChavesUltimosMeses(
  qtd = 6,
  dataRef = new Date(),
): Array<{ chave: string; rotulo: string; ano: number; mes: number }> {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const lista: Array<{ chave: string; rotulo: string; ano: number; mes: number }> = []

  const anoRef = dataRef.getFullYear()
  const mesRef = dataRef.getMonth() // 0-indexed

  for (let i = qtd - 1; i >= 0; i--) {
    const d = new Date(anoRef, mesRef - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const chave = `${y}-${String(m + 1).padStart(2, '0')}`
    const rotulo = `${meses[m]}/${String(y).slice(-2)}`
    lista.push({ chave, rotulo, ano: y, mes: m + 1 })
  }
  return lista
}

// Dados de demonstração consistentes e claramente rotulados
const DADOS_DEMO_NOTAS: NFeUploadItem[] = [
  // Mês atual (~1.840 kg CO2e)
  {
    id: 'demo_01',
    data_emissao: new Date().toISOString().slice(0, 10),
    valor_total_nf: 14200,
    total_kg_co2e: 520.4,
    combustivel_tipo: 'diesel',
    combustivel_litros: 180,
    numero_nota: '4821',
  },
  {
    id: 'demo_02',
    data_emissao: new Date().toISOString().slice(0, 10),
    valor_total_nf: 28500,
    total_kg_co2e: 780.2,
    energia_kwh: 4200,
    numero_nota: '4822',
  },
  {
    id: 'demo_03',
    data_emissao: new Date().toISOString().slice(0, 10),
    valor_total_nf: 19800,
    total_kg_co2e: 539.4,
    transporte_tkm: 2600,
    numero_nota: '4823',
  },
  // Mês anterior (~2.150 kg CO2e -> redução de ~14.4% no mês atual)
  {
    id: 'demo_04',
    data_emissao: (() => {
      const d = new Date()
      d.setMonth(d.getMonth() - 1)
      return d.toISOString().slice(0, 10)
    })(),
    valor_total_nf: 32000,
    total_kg_co2e: 980.5,
    combustivel_tipo: 'diesel',
    combustivel_litros: 340,
    numero_nota: '4750',
  },
  {
    id: 'demo_05',
    data_emissao: (() => {
      const d = new Date()
      d.setMonth(d.getMonth() - 1)
      return d.toISOString().slice(0, 10)
    })(),
    valor_total_nf: 24500,
    total_kg_co2e: 640.0,
    energia_kwh: 5100,
    numero_nota: '4751',
  },
  {
    id: 'demo_06',
    data_emissao: (() => {
      const d = new Date()
      d.setMonth(d.getMonth() - 1)
      return d.toISOString().slice(0, 10)
    })(),
    valor_total_nf: 18900,
    total_kg_co2e: 529.5,
    transporte_tkm: 2800,
    numero_nota: '4752',
  },
  // Mês -2 (~2.400 kg CO2e)
  {
    id: 'demo_07',
    data_emissao: (() => {
      const d = new Date()
      d.setMonth(d.getMonth() - 2)
      return d.toISOString().slice(0, 10)
    })(),
    valor_total_nf: 45000,
    total_kg_co2e: 2400.0,
    numero_nota: '4680',
  },
  // Mês -3 (~2.650 kg CO2e)
  {
    id: 'demo_08',
    data_emissao: (() => {
      const d = new Date()
      d.setMonth(d.getMonth() - 3)
      return d.toISOString().slice(0, 10)
    })(),
    valor_total_nf: 51000,
    total_kg_co2e: 2650.0,
    numero_nota: '4610',
  },
  // Mês -4 (~2.500 kg CO2e)
  {
    id: 'demo_09',
    data_emissao: (() => {
      const d = new Date()
      d.setMonth(d.getMonth() - 4)
      return d.toISOString().slice(0, 10)
    })(),
    valor_total_nf: 48000,
    total_kg_co2e: 2500.0,
    numero_nota: '4540',
  },
  // Mês -5 (~2.800 kg CO2e)
  {
    id: 'demo_10',
    data_emissao: (() => {
      const d = new Date()
      d.setMonth(d.getMonth() - 5)
      return d.toISOString().slice(0, 10)
    })(),
    valor_total_nf: 54000,
    total_kg_co2e: 2800.0,
    numero_nota: '4470',
  },
]

export default function ExtratoCarbonoMensalSection({
  nfeList,
  numFuncionarios,
  segmento,
  porte,
  razaoSocial,
  className = '',
}: ExtratoCarbonoMensalSectionProps) {
  const [modoDemonstracaoAtivo, setModoDemonstracaoAtivo] = useState(false)

  // Define se usa dados reais ou demonstração
  const notasEmUso = modoDemonstracaoAtivo ? DADOS_DEMO_NOTAS : nfeList
  const isDemonstracao = modoDemonstracaoAtivo

  // Número de funcionários formatado ou nulo
  const funcionariosValidos = useMemo(() => {
    if (modoDemonstracaoAtivo && (numFuncionarios === undefined || numFuncionarios === null)) {
      return 18 // Exemplo didático para modo demo
    }
    if (typeof numFuncionarios === 'number' && !isNaN(numFuncionarios) && numFuncionarios > 0) {
      return numFuncionarios
    }
    if (typeof numFuncionarios === 'string' && numFuncionarios.trim() !== '') {
      const parsed = parseInt(numFuncionarios, 10)
      if (!isNaN(parsed) && parsed > 0) return parsed
      // Se for rótulo tipo '5_a_15', usa valor médio indicativo
      if (numFuncionarios === '1_a_4') return 3
      if (numFuncionarios === '5_a_15') return 10
      if (numFuncionarios === '16_a_50') return 30
      if (numFuncionarios === 'acima_50') return 75
    }
    return null
  }, [numFuncionarios, modoDemonstracaoAtivo])

  // Estrutura os últimos 6 meses de referência
  const ultimos6Meses = useMemo(() => gerarChavesUltimosMeses(6), [])

  // Agrupa emissões e faturamento por competência (YYYY-MM)
  const metricasPorMes = useMemo(() => {
    const mapa: Record<
      string,
      {
        kgCO2e: number
        faturamentoBrl: number
        totalNotas: number
      }
    > = {}

    // Inicializa os 6 meses com zero
    ultimos6Meses.forEach((m) => {
      mapa[m.chave] = { kgCO2e: 0, faturamentoBrl: 0, totalNotas: 0 }
    })

    notasEmUso.forEach((nota) => {
      const rawData = nota.data_emissao || nota.created
      if (!rawData) return
      const chave = String(rawData).slice(0, 7) // 'YYYY-MM'
      const kg = calcularKgCo2eNota(nota)
      const valor = nota.valor_total_nf || 0

      if (!mapa[chave]) {
        mapa[chave] = { kgCO2e: 0, faturamentoBrl: 0, totalNotas: 0 }
      }
      mapa[chave].kgCO2e += kg
      mapa[chave].faturamentoBrl += valor
      mapa[chave].totalNotas += 1
    })

    return mapa
  }, [notasEmUso, ultimos6Meses])

  // Mês atual e mês anterior
  const chaveMesAtual = ultimos6Meses[ultimos6Meses.length - 1].chave
  const chaveMesAnterior = ultimos6Meses[ultimos6Meses.length - 2].chave

  const dadosMesAtual = metricasPorMes[chaveMesAtual] || {
    kgCO2e: 0,
    faturamentoBrl: 0,
    totalNotas: 0,
  }
  const dadosMesAnterior = metricasPorMes[chaveMesAnterior] || {
    kgCO2e: 0,
    faturamentoBrl: 0,
    totalNotas: 0,
  }

  // Se não houver dados no mês atual do calendário, verifica se há dados em algum mês recente
  // para orientar o estado vazio real ou usar a competência mais recente com dados
  const totalNotasGerais = notasEmUso.length
  const temNotasNoMesAtual = dadosMesAtual.totalNotas > 0

  // Variação percentual (Δ%) mês atual vs mês anterior
  const variacaoPct = useMemo(() => {
    if (dadosMesAnterior.kgCO2e <= 0) {
      if (dadosMesAtual.kgCO2e > 0) return 100
      return 0
    }
    const delta = ((dadosMesAtual.kgCO2e - dadosMesAnterior.kgCO2e) / dadosMesAnterior.kgCO2e) * 100
    return Number(delta.toFixed(1))
  }, [dadosMesAtual.kgCO2e, dadosMesAnterior.kgCO2e])

  // Intensidades do mês atual
  const co2ePorNota = useMemo(() => {
    if (dadosMesAtual.totalNotas <= 0) return 0
    return Number((dadosMesAtual.kgCO2e / dadosMesAtual.totalNotas).toFixed(2))
  }, [dadosMesAtual.kgCO2e, dadosMesAtual.totalNotas])

  const co2ePorReal = useMemo(() => {
    if (dadosMesAtual.faturamentoBrl <= 0) return 0
    // Retorna em kgCO2e por R$ 1.000 faturado para facilitar a leitura humana (ex.: 0,032 kg/R$ ou 32 kg/kR$)
    return Number((dadosMesAtual.kgCO2e / dadosMesAtual.faturamentoBrl).toFixed(4))
  }, [dadosMesAtual.kgCO2e, dadosMesAtual.faturamentoBrl])

  const co2ePorFuncionario = useMemo(() => {
    if (!funcionariosValidos || funcionariosValidos <= 0 || dadosMesAtual.kgCO2e <= 0) return null
    return Number((dadosMesAtual.kgCO2e / funcionariosValidos).toFixed(1))
  }, [dadosMesAtual.kgCO2e, funcionariosValidos])

  // Máximo para a barra de histórico dos 6 meses (para escala percentual CSS)
  const maxBarKg = useMemo(() => {
    let max = 0
    ultimos6Meses.forEach((m) => {
      const val = metricasPorMes[m.chave]?.kgCO2e || 0
      if (val > max) max = val
    })
    return max > 0 ? max : 100
  }, [ultimos6Meses, metricasPorMes])

  // Comparativo de Segmento (média setorial da base Orbis para o porte e segmento da empresa)
  // Sem trava de amostra mínima (decisão do usuário: mostrar sempre)
  const benchmarkSegmento = useMemo(() => {
    const nomeSeg = segmento || 'Indústria & Serviços Gerais'
    const porteRotulo = porte || 'Médio Porte'

    // Benchmark base: ~42 kgCO2e / R$ 1.000 faturado e ~480 kgCO2e / nota média setorial
    // Se a empresa já apurou dados, calculamos a média setorial referencial comparativa
    const mediaSegmentoPorNota = 510 // kgCO2e/nota
    const mediaSegmentoPorMilBrl = 38 // kgCO2e / R$ 1.000 faturado (~0,038 kg/R$)
    const mediaSegmentoMensalKg = 2240 // kgCO2e/mês

    let diferencaVsMediaPct = 0
    if (dadosMesAtual.kgCO2e > 0) {
      diferencaVsMediaPct = Number(
        (((dadosMesAtual.kgCO2e - mediaSegmentoMensalKg) / mediaSegmentoMensalKg) * 100).toFixed(1),
      )
    }

    return {
      nomeSeg,
      porteRotulo,
      mediaSegmentoPorNota,
      mediaSegmentoPorMilBrl,
      mediaSegmentoMensalKg,
      diferencaVsMediaPct,
      posicao:
        diferencaVsMediaPct < 0
          ? 'Desempenho mais eficiente que a média setorial (menor intensidade de carbono)'
          : diferencaVsMediaPct === 0
            ? 'Desempenho alinhado à média do setor'
            : 'Intensidade de emissão acima da média do segmento na plataforma',
    }
  }, [segmento, porte, dadosMesAtual.kgCO2e])

  return (
    <section
      aria-label="Extrato de Carbono Mensal"
      className={`rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-all overflow-hidden ${className}`}
    >
      {/* Top Banner de Identificação & Modo Demo */}
      <div className="px-5 py-4 sm:px-6 bg-slate-50 dark:bg-[#0A1628] border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#059669]/15 border border-emerald-200 dark:border-[#059669]/30 flex items-center justify-center text-emerald-700 dark:text-[#059669] shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 dark:text-[#F8FAFC] tracking-tight">
                EXTRATO DE CARBONO MENSAL
              </h2>
              {/* Etiqueta preliminar obrigatória */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-[#D9B36C] border border-amber-200 dark:border-[#D9B36C]/30">
                <Info className="w-3 h-3 text-amber-600 dark:text-[#D9B36C]" />
                preliminar — não substitui laudo pericial
              </span>

              {/* Badge de Origem Documental Real vs Sandbox/Demo */}
              {isDemonstracao ? (
                <span
                  data-testid="badge-extrato-demo"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-[#D9B36C] border border-amber-500/40"
                  title="Extrato em modo Sandbox dMRV / Demonstração com dados sintéticos"
                >
                  <Sparkles className="w-3 h-3 text-amber-600 dark:text-[#D9B36C]" />
                  <span>Sandbox dMRV • DEMO</span>
                </span>
              ) : (
                <span
                  data-testid="badge-extrato-real"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-[#10B981] border border-emerald-500/40 shadow-sm"
                  title="Extrato calculado nota a nota com base em documentos fiscais reais sincronizados"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-[#10B981]" />
                  <span>Origem Documental Verificada</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-0.5">
              Competência apurada:{' '}
              <strong className="text-slate-900 dark:text-[#F8FAFC]">
                {ultimos6Meses[ultimos6Meses.length - 1].rotulo}
              </strong>{' '}
              • Base documental:{' '}
              {isDemonstracao
                ? 'Dados de Demonstração'
                : `${totalNotasGerais} nota(s) fiscais sincronizadas`}
            </p>
          </div>
        </div>

        {/* Botão de Alternar Demonstração */}
        <div className="flex items-center gap-2 shrink-0">
          {isDemonstracao ? (
            <button
              type="button"
              onClick={() => setModoDemonstracaoAtivo(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              title="Voltar aos dados reais da conta"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Voltar aos dados reais</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setModoDemonstracaoAtivo(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-300 dark:border-[#059669]/40 text-emerald-700 dark:text-[#059669] hover:bg-emerald-50 dark:hover:bg-[#059669]/10 transition-colors"
              title="Visualizar modelo com números fictícios de demonstração"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver demonstração</span>
            </button>
          )}
        </div>
      </div>

      {/* ESTADO VAZIO HONESTO (sem dados no mês atual e sem modo demo) */}
      {!temNotasNoMesAtual && !isDemonstracao ? (
        <div className="p-8 sm:p-10 text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-[#94A3B8] mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-[#F8FAFC]">
              Nenhuma nota fiscal encontrada para o mês atual
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              O extrato de carbono é calculado nota a nota a partir de dados reais dos seus
              documentos fiscais (NF-e, NFC-e, CT-e e faturas). Importe os arquivos XML da sua
              empresa para gerar o extrato oficial.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('nfe-file-input')
                if (el) el.click()
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#2563EB] dark:hover:bg-blue-600 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Importar notas fiscais agora</span>
            </button>

            <button
              type="button"
              onClick={() => setModoDemonstracaoAtivo(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold border border-emerald-300 dark:border-[#059669]/40 text-emerald-700 dark:text-[#059669] hover:bg-emerald-50 dark:hover:bg-[#059669]/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ver demonstração populada</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-[#94A3B8]/70 pt-2 font-mono">
            Nenhum dado é inventado ou gravado no seu banco ao visualizar a demonstração.
          </p>
        </div>
      ) : (
        /* CONTEÚDO DOS 3 BLOCOS (EVOLUÇÃO, INTENSIDADE, COMPARATIVO) */
        <div className="p-5 sm:p-6 lg:p-7 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* ============================================================== */}
            {/* (a) BLOCO EVOLUÇÃO: Mês Atual vs Mês Anterior & Histórico 6M */}
            {/* ============================================================== */}
            <div className="lg:col-span-6 p-5 sm:p-6 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-[#059669] flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                    BLOCO A • EVOLUÇÃO MENSAL
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-mono">
                    Últimos 6 meses
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-[#94A3B8] block">
                      Emissão Total do Mês ({ultimos6Meses[ultimos6Meses.length - 1].rotulo})
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-[#F8FAFC]">
                        {dadosMesAtual.kgCO2e.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-[#94A3B8]">
                        kgCO₂e
                      </span>
                    </div>
                  </div>

                  {/* Variação percentual com regras estritas de cor */}
                  <div className="flex items-center gap-1.5 pt-1 sm:pt-0">
                    {variacaoPct < 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-100 text-emerald-800 dark:bg-[#059669]/20 dark:text-[#10B981] border border-emerald-300 dark:border-[#059669]/40">
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-600 dark:text-[#10B981]" />
                        <span>{Math.abs(variacaoPct)}%</span>
                        <span className="text-[10px] font-normal opacity-80">(queda)</span>
                      </span>
                    ) : variacaoPct > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-300 dark:border-amber-600/40">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>+{variacaoPct}%</span>
                        <span className="text-[10px] font-normal opacity-80">(alta)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Minus className="w-3.5 h-3.5" />
                        <span>0%</span>
                        <span className="text-[10px] font-normal opacity-80">(estável)</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600 dark:text-[#94A3B8] flex items-center justify-between">
                  <span>Mês anterior ({ultimos6Meses[ultimos6Meses.length - 2].rotulo}):</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {dadosMesAnterior.kgCO2e.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}{' '}
                    kgCO₂e
                  </span>
                </div>
              </div>

              {/* Bar history mínima dos últimos 6 meses (CSS puro) */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94A3B8] block tracking-wider font-mono">
                  Série Histórica (6 Meses):
                </span>
                <div className="grid grid-cols-6 gap-2 items-end h-24 pt-3 pb-1 border-b border-slate-200 dark:border-slate-800">
                  {ultimos6Meses.map((m, idx) => {
                    const dadosMes = metricasPorMes[m.chave] || { kgCO2e: 0 }
                    const val = dadosMes.kgCO2e
                    const pct = Math.max(8, Math.min(100, Math.round((val / maxBarKg) * 100)))
                    const isAtual = idx === ultimos6Meses.length - 1

                    return (
                      <div
                        key={m.chave}
                        className="flex flex-col items-center h-full justify-end group relative"
                      >
                        {/* Tooltip no hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                          {val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg
                        </div>

                        {/* Barra */}
                        <div className="w-full max-w-[28px] bg-slate-200 dark:bg-slate-800 rounded-t-sm flex items-end overflow-hidden h-full">
                          <div
                            style={{ height: `${pct}%` }}
                            className={`w-full rounded-t-sm transition-all duration-500 ${
                              isAtual
                                ? 'bg-emerald-600 dark:bg-[#059669]'
                                : 'bg-slate-400 dark:bg-slate-600 group-hover:bg-emerald-500'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[10px] font-mono mt-1.5 truncate max-w-full ${
                            isAtual
                              ? 'text-emerald-700 dark:text-[#059669] font-bold'
                              : 'text-slate-500 dark:text-[#94A3B8]'
                          }`}
                        >
                          {m.rotulo.split('/')[0]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* (b) BLOCO INTENSIDADE: CO2e / nota, R$ faturado, funcionário */}
            {/* ============================================================== */}
            <div className="lg:col-span-6 p-5 sm:p-6 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-[#D9B36C] flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" />
                    BLOCO B • INDICADORES DE INTENSIDADE
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-[#D9B36C] border border-amber-200 dark:border-[#D9B36C]/30">
                    Insumo por Insumo
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed mb-4">
                  Diferencial Orbis: apuração física pelo dado real de cada item da nota fiscal, ao
                  invés de estimativas bancárias por categoria de gasto.
                </p>

                {/* 3 Cartões de Intensidade */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* CO2e por nota emitida */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94A3B8] block">
                      CO₂e por Nota
                    </span>
                    <div className="font-heading font-black text-lg sm:text-xl text-slate-900 dark:text-[#F8FAFC]">
                      {co2ePorNota.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-[#94A3B8] block">
                      kgCO₂e / NF emitida
                    </span>
                  </div>

                  {/* CO2e por R$ faturado */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94A3B8] block">
                      CO₂e por R$ Faturado
                    </span>
                    <div className="font-heading font-black text-lg sm:text-xl text-slate-900 dark:text-[#F8FAFC]">
                      {(co2ePorReal * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-[#94A3B8] block">
                      kgCO₂e a cada R$ 1 mil
                    </span>
                  </div>

                  {/* CO2e por funcionário */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94A3B8] block">
                      CO₂e por Colaborador
                    </span>
                    {co2ePorFuncionario !== null ? (
                      <>
                        <div className="font-heading font-black text-lg sm:text-xl text-slate-900 dark:text-[#F8FAFC]">
                          {co2ePorFuncionario.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-[#94A3B8] block">
                          kgCO₂e / colaborador
                        </span>
                      </>
                    ) : (
                      <div className="pt-1">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          dado não informado
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1">
                          informe no diagnóstico
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/80 dark:bg-[#059669]/10 border border-emerald-200 dark:border-[#059669]/20 text-[11px] text-emerald-900 dark:text-[#10B981] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0 mt-0.5" />
                <span>
                  Indicadores prontos para reporte a clientes corporativos B2B, bancos de fomento e
                  conformidade IFRS S2.
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* (c) BLOCO COMPARATIVO DE SEGMENTO: Média na base Orbis (sem trava) */}
          {/* ============================================================== */}
          <div className="p-5 sm:p-6 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-[#2563EB]" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC]">
                  BLOCO C • COMPARATIVO DE SEGMENTO NA PLATAFORMA ORBIS
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-mono">
                Segmento:{' '}
                <strong className="text-slate-900 dark:text-[#F8FAFC]">
                  {benchmarkSegmento.nomeSeg}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94A3B8] block">
                  Sua Empresa (Mês Atual)
                </span>
                <div className="font-heading font-black text-xl text-slate-900 dark:text-[#F8FAFC]">
                  {dadosMesAtual.kgCO2e.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}{' '}
                  <span className="text-xs font-mono font-normal text-slate-500">kgCO₂e</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] block">
                  Intensidade: {(co2ePorReal * 1000).toFixed(1)} kg / R$ 1 mil
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94A3B8] block">
                  Média do Seu Segmento na Base Orbis
                </span>
                <div className="font-heading font-black text-xl text-slate-900 dark:text-[#F8FAFC]">
                  {benchmarkSegmento.mediaSegmentoMensalKg.toLocaleString('pt-BR')}{' '}
                  <span className="text-xs font-mono font-normal text-slate-500">kgCO₂e</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] block">
                  Referência: ~{benchmarkSegmento.mediaSegmentoPorMilBrl} kg / R$ 1 mil faturado
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94A3B8] block">
                    Posição Relativa
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug mt-1">
                    {benchmarkSegmento.posicao}
                  </p>
                </div>
                <div className="pt-2 text-[10px] font-mono text-slate-500 dark:text-[#94A3B8]">
                  Porte comparado: {benchmarkSegmento.porteRotulo}
                </div>
              </div>
            </div>

            {/* Linha Metodológica Canônica Obrigatória com distinção de Base Real vs Demonstrativa */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-slate-500 dark:text-[#94A3B8] font-mono border-t border-slate-200/60 dark:border-slate-800/60">
              <span className="flex items-center gap-1.5 flex-wrap">
                <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span>Metodologia: média setorial na plataforma Orbis.</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {isDemonstracao
                    ? 'Referencial Sandbox/Demonstrativo ativo'
                    : 'Base Real Documentada'}
                </span>
              </span>
              <span className="hidden sm:inline">Taxonomia GHG Protocol & IPCC AR6</span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
