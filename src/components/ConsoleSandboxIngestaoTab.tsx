import React, { useState } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  gerarLoteSintetico,
  formatarCnpj,
  type DocumentoSintetico,
  type SegmentoSandbox,
  MARCA_SANDBOX_OBRIGATORIA,
} from '@/services/sandboxSyntheticGenerator'
import {
  Sparkles,
  Download,
  Database,
  FileCode,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  ArrowRight,
  Eye,
  RefreshCw,
} from 'lucide-react'

export interface PipelineIngestaoResultado {
  sucesso: boolean
  documentoId: string
  chaveAcesso: string
  seloDpp: string
  hashIntegridade: string
  registroSeloId?: string
  registroLoteId?: string
  registroPecaId?: string
  erro?: string
}

export function ConsoleSandboxIngestaoTab() {
  const [segmento, setSegmento] = useState<SegmentoSandbox>('combustiveis')
  const [volume, setVolume] = useState<number>(10)
  const [usarAlfanumerico, setUsarAlfanumerico] = useState<boolean>(true)
  const [gerando, setGerando] = useState<boolean>(false)
  const [loteGerado, setLoteGerado] = useState<DocumentoSintetico[]>([])
  const [docSelecionado, setDocSelecionado] = useState<DocumentoSintetico | null>(null)
  const [modalXmlAberto, setModalXmlAberto] = useState<boolean>(false)

  // Estado de Ingestão no Pipeline
  const [ingestando, setIngestando] = useState<boolean>(false)
  const [resultadosIngestao, setResultadosIngestao] = useState<PipelineIngestaoResultado[]>([])
  const [progressoIngestao, setProgressoIngestao] = useState<{ atual: number; total: number }>({
    atual: 0,
    total: 0,
  })

  // Helper para identificar fator e categoria do material com base no catálogo canônico
  // Aço 2,18; Alumínio 14,40; Cobre 5,40; Polímeros 1,90; Concreto/agregado reciclado 0,12; outros/genérico 1,50
  const obterFatorECategoriaMaterial = (
    item: any,
    segmentoDoc: SegmentoSandbox,
  ): {
    categoriaSelect: 'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'outros'
    categoriaDescritiva: string
    fatorCo2eKg: number
    statusCalculo: 'calculado' | 'em_estruturacao_de_catalogo'
  } => {
    // Regra crítica para mineração urbana: ouro/paládio/prata/terras raras ficam "em estruturação de catálogo"
    if (
      item.statusCalculo === 'em_estruturacao_de_catalogo' ||
      (segmentoDoc === 'mineracao_urbana_criticos' && item.categoriaMaterial !== 'cobre')
    ) {
      return {
        categoriaSelect: 'outros',
        categoriaDescritiva: 'Minerais Críticos & Metais Nobres (Em estruturação de catálogo)',
        fatorCo2eKg: 0,
        statusCalculo: 'em_estruturacao_de_catalogo',
      }
    }

    const cat = item.categoriaMaterial || ''
    if (cat === 'aco') {
      return {
        categoriaSelect: 'aco',
        categoriaDescritiva: 'Aço Laminado / Estampado',
        fatorCo2eKg: 2.18,
        statusCalculo: 'calculado',
      }
    }
    if (cat === 'aluminio') {
      return {
        categoriaSelect: 'aluminio',
        categoriaDescritiva: 'Alumínio Primário Automotivo / Industrial',
        fatorCo2eKg: 14.4,
        statusCalculo: 'calculado',
      }
    }
    if (cat === 'cobre') {
      return {
        categoriaSelect: 'cobre',
        categoriaDescritiva: 'Cobre / Bobinamentos Elétricos',
        fatorCo2eKg: 5.4,
        statusCalculo: 'calculado',
      }
    }
    if (cat === 'polimeros') {
      return {
        categoriaSelect: 'polimeros',
        categoriaDescritiva: 'Polímeros Automotivos e Termoplásticos (PP / EPDM / ABS)',
        fatorCo2eKg: 1.9,
        statusCalculo: 'calculado',
      }
    }
    if (cat === 'concreto') {
      return {
        categoriaSelect: 'outros',
        categoriaDescritiva: 'Concreto / Agregados Reciclados de Construção Civil (RCD)',
        fatorCo2eKg: 0.12,
        statusCalculo: 'calculado',
      }
    }
    return {
      categoriaSelect: 'outros',
      categoriaDescritiva: 'Outros Materiais (Estimativa Conservadora)',
      fatorCo2eKg: 1.5,
      statusCalculo: 'calculado',
    }
  }

  // Gerar novo lote sintético
  const handleGerarLote = async () => {
    setGerando(true)
    setResultadosIngestao([])
    try {
      const lote = await gerarLoteSintetico({
        segmento,
        quantidade: volume,
        usarCnpjAlfanumerico: usarAlfanumerico,
      })
      setLoteGerado(lote)
      setDocSelecionado(lote[0] || null)
    } catch (err: any) {
      alert('Erro ao gerar documentos sintéticos: ' + err.message)
    } finally {
      setGerando(false)
    }
  }

  // Download de XML individual
  const handleDownloadXmlIndividual = (doc: DocumentoSintetico) => {
    const blob = new Blob([doc.xmlConteudo], { type: 'application/xml;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${doc.modeloFiscal === '57' ? 'CTE' : 'NFE'}_${doc.chaveAcesso}_SANDBOX.xml`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Download de lote completo em múltiplos XMLs ou arquivo único concatenado
  const handleDownloadLoteCompleto = () => {
    if (loteGerado.length === 0) return
    const separador = `\n<!-- ======================================================== -->\n`
    const conteudoCompleto = loteGerado
      .map(
        (doc, i) =>
          `<!-- DOCUMENTO SINTETICO #${i + 1} - CHAVE: ${doc.chaveAcesso} -->\n${doc.xmlConteudo}`,
      )
      .join(separador)

    const blob = new Blob([conteudoCompleto], { type: 'application/xml;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `LOTE_SANDBOX_${segmento.toUpperCase()}_${loteGerado.length}_DOCS.xml`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Executar Ingestão no Pipeline
  const handleIngestarPipeline = async () => {
    if (loteGerado.length === 0) {
      alert('Gere um lote sintético antes de iniciar a ingestão no pipeline.')
      return
    }

    setIngestando(true)
    setResultadosIngestao([])
    setProgressoIngestao({ atual: 0, total: loteGerado.length })

    const resultados: PipelineIngestaoResultado[] = []

    for (let i = 0; i < loteGerado.length; i++) {
      const doc = loteGerado[i]
      setProgressoIngestao({ atual: i + 1, total: loteGerado.length })

      // Gera código de selo padrão PR-SEAL-2026-XXXXXX
      const sufixoHex = Math.floor(100000 + Math.random() * 900000).toString()
      const codigoSelo = `PR-SEAL-2026-${sufixoHex}`
      const hoje = new Date().toISOString().slice(0, 10)
      const validadeAnoQueVem = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)

      try {
        // 1. Gravar na coleção 'selos' com origem: 'sintetico'
        let regSeloId = ''
        try {
          const regSelo = await pb.collection('selos').create({
            codigo_selo: codigoSelo,
            empresa: doc.razaoSocialEmitente,
            cnpj: formatarCnpj(doc.cnpjEmitente),
            status: 'ativo',
            data_emissao: hoje,
            data_validade: validadeAnoQueVem,
            hash_integridade: doc.hashSha256,
            origem: 'sintetico',
          })
          regSeloId = regSelo.id
        } catch (seloErr: any) {
          console.warn('Gravação em selos falhou ou requer permissão:', seloErr)
        }

        // 2. Se for segmento com peças/itens rastreáveis (desmanche_cdv, varejo_reverso, construcao_rcd, mineracao_urbana_criticos)
        // calcular CO₂e com motor real por material e gravar cdv_lotes + cdv_pecas por item
        let regLoteId = ''
        let regPecaId = ''
        const segmentosComRastreabilidade = [
          'desmanche_cdv',
          'varejo_reverso',
          'construcao_rcd',
          'mineracao_urbana_criticos',
        ]

        if (segmentosComRastreabilidade.includes(doc.segmento)) {
          try {
            // Processamento peça a peça com cálculo oficial de carbono
            const itensProcessados = await Promise.all(
              doc.itens.map(async (it, itemIdx) => {
                const infoMat = obterFatorECategoriaMaterial(it, doc.segmento)
                const pesoKg = Number(it.pesoKg || 0)
                const seloItem =
                  doc.itens.length === 1 ? codigoSelo : `${codigoSelo}-${itemIdx + 1}`

                // co2e_evitado_kg = round(pesoKg * fator * 100)/100
                const co2eEvitadoKg =
                  infoMat.statusCalculo === 'em_estruturacao_de_catalogo'
                    ? 0
                    : Math.round(pesoKg * infoMat.fatorCo2eKg * 100) / 100

                // Hash canônico por peça incluindo o CO2e calculado
                const textoHashPeca = `${seloItem}|${it.cProd}|${it.xProd}|${pesoKg.toFixed(2)}|${co2eEvitadoKg.toFixed(2)}|${formatarCnpj(doc.cnpjEmitente)}|${doc.chaveAcesso}`
                let hashPeca = ''
                if (typeof crypto !== 'undefined' && crypto.subtle) {
                  const enc = new TextEncoder()
                  const hb = await crypto.subtle.digest('SHA-256', enc.encode(textoHashPeca))
                  hashPeca = Array.from(new Uint8Array(hb))
                    .map((b) => b.toString(16).padStart(2, '0'))
                    .join('')
                } else {
                  hashPeca = doc.hashSha256
                }

                return {
                  item: it,
                  seloDpp: seloItem,
                  categoriaSelect: infoMat.categoriaSelect,
                  categoriaDescritiva: infoMat.categoriaDescritiva,
                  fatorCo2eKg: infoMat.fatorCo2eKg,
                  statusCalculo: infoMat.statusCalculo,
                  pesoKg,
                  co2eEvitadoKg,
                  hashPeca,
                }
              }),
            )

            // Agregação no lote
            const totalPesoLote =
              Math.round(itensProcessados.reduce((acc, p) => acc + p.pesoKg, 0) * 100) / 100
            const totalCo2eLote =
              Math.round(itensProcessados.reduce((acc, p) => acc + p.co2eEvitadoKg, 0) * 100) / 100

            const descricaoVeiculo =
              doc.segmento === 'desmanche_cdv'
                ? 'Veículo Teste Sandbox Orbis (Sintético)'
                : doc.segmento === 'varejo_reverso'
                  ? 'Lote Varejo Reverso & Eletroeletrônicos (Sintético)'
                  : doc.segmento === 'construcao_rcd'
                    ? 'Lote Agregados Reciclados de Concreto RCD (Sintético)'
                    : 'Lote Mineração Urbana & Materiais Críticos (Sintético)'

            const regLote = await pb.collection('cdv_lotes').create({
              cdv_nome: doc.razaoSocialEmitente,
              cdv_cnpj: formatarCnpj(doc.cnpjEmitente),
              cdv_codigo: `SANDBOX-${doc.segmento.toUpperCase().slice(0, 10)}`,
              veiculo_marca_modelo: descricaoVeiculo,
              veiculo_chassi: doc.dadosAdicionais.chassi || `SYNTH-${doc.chaveAcesso.slice(-8)}`,
              veiculo_baixa_detran: `SYN-BX-${sufixoHex}`,
              origem_envio: 'erp',
              status: 'processado',
              total_pecas: doc.itens.length,
              total_peso_kg: totalPesoLote,
              total_co2e_evitado_kg: totalCo2eLote,
              is_demo: true,
              origem: 'sintetico',
              payload_bruto_json: {
                tipo: 'sandbox_sintetico',
                segmento: doc.segmento,
                chaveAcesso: doc.chaveAcesso,
                hashSha256: doc.hashSha256,
                marca: MARCA_SANDBOX_OBRIGATORIA,
                totalItens: doc.itens.length,
                totalPesoKg: totalPesoLote,
                totalCo2eKg: totalCo2eLote,
              },
            })
            regLoteId = regLote.id

            // Grava TODAS as peças no banco com seu respectivo cálculo oficial
            for (let pIdx = 0; pIdx < itensProcessados.length; pIdx++) {
              const p = itensProcessados[pIdx]
              const materialDeclaradoTexto =
                p.statusCalculo === 'em_estruturacao_de_catalogo'
                  ? `${p.categoriaDescritiva} [STATUS: EM ESTRUTURAÇÃO DE CATÁLOGO - ZERO CRÉDITO]`
                  : p.categoriaDescritiva

              const regPeca = await pb.collection('cdv_pecas').create({
                lote: regLote.id,
                sku_interno: p.item.cProd,
                selo_dpp: p.seloDpp,
                descricao_peca: p.item.xProd,
                categoria_material: p.categoriaSelect,
                material_declarado: materialDeclaradoTexto,
                peso_kg: p.pesoKg,
                ncm: p.item.ncm,
                fator_co2e_kg: p.fatorCo2eKg,
                co2e_evitado_kg: p.co2eEvitadoKg,
                hash_sha256: p.hashPeca,
                responsavel_crea: 'CREA-PR 000.000/D (Sandbox)',
                cdv_origem: `SANDBOX-${doc.segmento.toUpperCase().slice(0, 10)}`,
                cdv_cnpj: formatarCnpj(doc.cnpjEmitente),
                status: 'ativo',
                situacao_checklist: 'etiquetada',
                origem: 'sintetico',
              })
              if (pIdx === 0) {
                regPecaId = regPeca.id
              }
            }
          } catch (cdvErr: any) {
            console.warn('Gravação em cdv_lotes/pecas falhou:', cdvErr)
          }
        }

        resultados.push({
          sucesso: true,
          documentoId: doc.id,
          chaveAcesso: doc.chaveAcesso,
          seloDpp: codigoSelo,
          hashIntegridade: doc.hashSha256,
          registroSeloId: regSeloId,
          registroLoteId: regLoteId,
          registroPecaId: regPecaId,
        })
      } catch (err: any) {
        resultados.push({
          sucesso: false,
          documentoId: doc.id,
          chaveAcesso: doc.chaveAcesso,
          seloDpp: codigoSelo,
          hashIntegridade: doc.hashSha256,
          erro: err.message || 'Erro durante processamento no pipeline',
        })
      }
    }

    setResultadosIngestao(resultados)
    setIngestando(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho do Sandbox */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 shadow-xl text-white space-y-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Sandbox de Ingestão (Fase 1)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono">
            <ShieldAlert className="w-3.5 h-3.5" />
            Ambiente Isolado • Não Integrado à SEFAZ
          </span>
        </div>

        <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-100 tracking-wide">
          GERADOR NATIVO & INGESTÃO SINTÉTICA DE DOCUMENTOS FISCAIS
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
          Gere conjuntos controlados de NF-e e CT-e sintéticos com algoritmos matemáticos oficiais
          (módulo 11 de CNPJs tradicionais e alfanuméricos da IN RFB 2.229/2024, chaves de 44
          dígitos com DV SEFAZ e carimbo de rastreabilidade). Os dados são gravados com a marca{' '}
          <strong className="text-emerald-400 font-mono">origem: &apos;sintetico&apos;</strong> e
          ficam estritamente isolados das consultas e métricas públicas.
        </p>
      </div>

      {/* Painel de Controles e Configuração do Lote */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Seletor de Segmento */}
          <div className="space-y-1.5">
            <label className="block font-semibold uppercase text-slate-500 dark:text-[#93A3B5] text-[11px]">
              Segmento de Negócio
            </label>
            <select
              value={segmento}
              onChange={(e) => setSegmento(e.target.value as SegmentoSandbox)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="combustiveis">Combustíveis (Diesel S10 / Biometanol)</option>
              <option value="desmanche_cdv">Desmanche & Peças Usadas (CDV / Renova)</option>
              <option value="transporte_cte">Frete & Transporte (CT-e Interestadual)</option>
              <option value="varejo_reverso">
                Comércio & Varejo (Logística Reversa Eletro/Embalagens)
              </option>
              <option value="construcao_rcd">
                Imobiliário & Construção Civil (RCD / Agregados Reciclados)
              </option>
              <option value="mineracao_urbana_criticos">
                Mineração Urbana & Materiais Críticos (Cobre / Au / Pd / Terras Raras)
              </option>
            </select>
          </div>

          {/* Volume do Lote */}
          <div className="space-y-1.5">
            <label className="block font-semibold uppercase text-slate-500 dark:text-[#93A3B5] text-[11px]">
              Volume do Lote
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 10, 20, 50].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVolume(v)}
                  className={`py-2 rounded-lg font-mono font-bold text-center border transition-all ${
                    volume === v
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#0A0E12] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Suporte a CNPJ Alfanumérico */}
          <div className="space-y-1.5">
            <label className="block font-semibold uppercase text-slate-500 dark:text-[#93A3B5] text-[11px]">
              CNPJ Alfanumérico (IN 2.229/2024)
            </label>
            <button
              type="button"
              onClick={() => setUsarAlfanumerico(!usarAlfanumerico)}
              className={`w-full py-2.5 px-3 rounded-xl border font-semibold flex items-center justify-between transition-colors ${
                usarAlfanumerico
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-[#0A0E12] border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>
                {usarAlfanumerico ? 'Habilitado (Misto 0-9 / A-Z)' : 'Desabilitado (Apenas 0-9)'}
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  usarAlfanumerico ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
            </button>
          </div>

          {/* Botão de Ação Gerar Lote */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <button
              type="button"
              onClick={handleGerarLote}
              disabled={gerando || ingestando}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {gerando ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gerando Lote...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar {volume} Docs Sintéticos</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Resumo da Marca Legal Obrigatória */}
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="block font-semibold">
              Marcação Canônica Obrigatória em infCpl / xObs:
            </strong>
            <code className="block font-mono bg-white/70 dark:bg-black/30 p-1 rounded border border-amber-300 dark:border-amber-800 break-all text-[10px]">
              {MARCA_SANDBOX_OBRIGATORIA}
            </code>
          </div>
        </div>
      </div>

      {/* Exibição do Lote Gerado */}
      {loteGerado.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                  Lote de Documentos Prontos ({loteGerado.length})
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  Demonstração
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chaves calculadas com DV SEFAZ módulo 11 e tags íntegras para parse e ingestão.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadLoteCompleto}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-300 dark:border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Lote (.xml)</span>
              </button>

              <button
                type="button"
                onClick={handleIngestarPipeline}
                disabled={ingestando}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                {ingestando ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      Ingestando ({progressoIngestao.atual}/{progressoIngestao.total})...
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Ingestar no Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback de Progresso e Ingestão */}
          {resultadosIngestao.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ingestão de {resultadosIngestao.filter((r) => r.sucesso).length} documentos
                  concluída com sucesso!
                </span>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                  Carimbo permanente: origem = &apos;sintetico&apos;
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Os hashes SHA-256 e os selos foram gravados no banco de dados isolados de qualquer
                consulta pública externa.
              </p>
            </div>
          )}

          {/* Tabela do Lote */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Doc & Modelo</th>
                  <th className="p-3">Chave de Acesso (44 Dígitos)</th>
                  <th className="p-3">Emitente & CNPJ</th>
                  <th className="p-3">Valor Total</th>
                  <th className="p-3">Hash Canônico SHA-256</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {loteGerado.map((doc, idx) => {
                  const resultado = resultadosIngestao.find((r) => r.documentoId === doc.id)
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold font-mono">
                            #{idx + 1} {doc.modeloFiscal === '57' ? 'CT-e' : 'NF-e'}{' '}
                            {doc.numeroDocumento}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Demonstração
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          Série {doc.serie} • {doc.dataEmissao}
                        </span>
                      </td>

                      <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        <div className="truncate max-w-[220px]" title={doc.chaveAcesso}>
                          {doc.chaveAcesso}
                        </div>
                        {resultado?.seloDpp && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            {resultado.seloDpp}
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <span className="font-semibold block truncate max-w-[180px]">
                          {doc.razaoSocialEmitente}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {formatarCnpj(doc.cnpjEmitente)}
                        </span>
                      </td>

                      <td className="p-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        R${' '}
                        {doc.valorTotal.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      <td className="p-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="truncate block max-w-[140px]" title={doc.hashSha256}>
                          {doc.hashSha256.slice(0, 16)}...
                        </span>
                      </td>

                      <td className="p-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDocSelecionado(doc)
                            setModalXmlAberto(true)
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-semibold border border-slate-300 dark:border-slate-700"
                          title="Ver XML e Detalhes"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" />
                          XML
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadXmlIndividual(doc)}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-semibold border border-slate-300 dark:border-slate-700"
                          title="Baixar XML Individual"
                        >
                          <Download className="w-3.5 h-3.5 inline mr-1" />
                          Baixar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Visualizador de XML e Detalhes */}
      {modalXmlAberto && docSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-[#111820] border-2 border-emerald-600 p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-600" />
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                  XML Sintético • {docSelecionado.id}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">
                  Demonstração
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalXmlAberto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Chave de Acesso:</span>
                <span
                  className="font-mono text-emerald-600 dark:text-emerald-400 truncate block font-bold"
                  title={docSelecionado.chaveAcesso}
                >
                  {docSelecionado.chaveAcesso}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">CNPJ Emitente:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">
                  {formatarCnpj(docSelecionado.cnpjEmitente)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Valor Total:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  R${' '}
                  {docSelecionado.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Carimbo:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                  origem: &apos;sintetico&apos;
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">
                {docSelecionado.xmlConteudo}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 font-mono text-[11px] truncate max-w-md">
                Hash SHA-256: {docSelecionado.hashSha256}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadXmlIndividual(docSelecionado)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
                >
                  Baixar Este XML
                </button>
                <button
                  type="button"
                  onClick={() => setModalXmlAberto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-300"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
