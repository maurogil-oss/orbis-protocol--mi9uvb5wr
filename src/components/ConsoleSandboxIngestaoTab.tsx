import React, { useState } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  gerarLoteSintetico,
  gerarSementeRodada,
  formatarCnpj,
  normalizarSegmento,
  type DocumentoSintetico,
  type SegmentoSandbox,
  type ProtocoloSetorialSlug,
  SEGMENTOS_SANDBOX_CATALOGO,
  MARCA_SANDBOX_OBRIGATORIA,
} from '@/services/sandboxSyntheticGenerator'
import {
  Sparkles,
  Download,
  FileCode,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  Eye,
  RefreshCw,
  XCircle,
  Layers,
} from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  consultarTriadorIngestao,
  TriagemIngestaoCdvResultado,
} from '@/services/triadorIngestaoCdvService'
import {
  contarRegistrosSandboxPurge,
  executarSandboxPurge,
  type SandboxPurgeContagem,
} from '@/services/adminConsoleService'
import { useAuth } from '@/contexts/AuthContext'
import { Trash2, ShieldCheck } from 'lucide-react'

export interface PipelineIngestaoResultado {
  sucesso: boolean
  documentoId: string
  chaveAcesso: string
  seloDpp: string
  hashIntegridade: string
  registroSeloId?: string
  registroLoteId?: string
  registroPecaId?: string
  registroInventarioId?: string
  pecasGravadas?: number
  pecasTotal?: number
  totalPesoKg?: number
  totalCo2eEvitadoKg?: number
  erro?: string
  detalhesErro?: string
}

/**
 * Calcula os valores de Escopo 1, 2 e 3 do inventário GHG coerentes com o protocolo setorial do lote.
 * Ex.:
 * - combustíveis / energia / logística: predomínio de Escopo 1 (frotas, combustão)
 * - siderurgia / cimento / química / mineração: altas emissões diretas (Escopo 1) e processo
 * - varejo / têxtil / alimentos / papel / farmacêutica: eletricidade (Escopo 2) e cadeia (Escopo 3)
 * - construção / materiais críticos: forte cadeia de suprimentos / insumos (Escopo 3)
 */
export function calcularInventarioGhgPorSegmento(
  slug: ProtocoloSetorialSlug,
  volumeLote: number,
): {
  escopo1Tco2e: number
  escopo2LocalizacaoTco2e: number
  escopo2MercadoTco2e: number
  escopo3Tco2e: number
  emissoesTotaisTco2e: number
  statusSbce: 'isento_monitoramento' | 'dever_reporte_10k' | 'compensacao_25k'
  descricaoPerfil: string
} {
  const fatorVol = Math.max(1, Math.min(5, volumeLote / 10))

  let esc1 = 45.0
  let esc2 = 25.0
  let esc3 = 110.0
  let desc = 'Perfil balanceado de serviços e comércio'

  switch (slug) {
    case 'energia':
      esc1 = Math.round(180.5 * fatorVol * 10) / 10
      esc2 = Math.round(22.0 * fatorVol * 10) / 10
      esc3 = Math.round(95.0 * fatorVol * 10) / 10
      desc = 'Combustão estacionária, destilação e frotas de distribuição de combustíveis'
      break
    case 'logistica':
      esc1 = Math.round(240.0 * fatorVol * 10) / 10
      esc2 = Math.round(14.5 * fatorVol * 10) / 10
      esc3 = Math.round(130.0 * fatorVol * 10) / 10
      desc = 'Combustão móvel de frota pesada interestadual diesel B14 e agregados'
      break
    case 'siderurgia':
      esc1 = Math.round(520.0 * fatorVol * 10) / 10
      esc2 = Math.round(180.0 * fatorVol * 10) / 10
      esc3 = Math.round(310.0 * fatorVol * 10) / 10
      desc = 'Redução metalúrgica em altos-fornos, fornos a arco EAF e bio-redutores'
      break
    case 'cimento':
      esc1 = Math.round(480.0 * fatorVol * 10) / 10
      esc2 = Math.round(110.0 * fatorVol * 10) / 10
      esc3 = Math.round(260.0 * fatorVol * 10) / 10
      desc = 'Descarbonatação do calcário a 1450°C e coprocessamento de clínquer'
      break
    case 'quimica':
      esc1 = Math.round(310.0 * fatorVol * 10) / 10
      esc2 = Math.round(95.0 * fatorVol * 10) / 10
      esc3 = Math.round(220.0 * fatorVol * 10) / 10
      desc = 'Reações químicas industriais, craqueamento térmico e solventes'
      break
    case 'mineracao':
      esc1 = Math.round(290.0 * fatorVol * 10) / 10
      esc2 = Math.round(140.0 * fatorVol * 10) / 10
      esc3 = Math.round(185.0 * fatorVol * 10) / 10
      desc = 'Operação de mina a céu aberto, britagem e flotação de minerais'
      break
    case 'agro':
      esc1 = Math.round(140.0 * fatorVol * 10) / 10
      esc2 = Math.round(18.0 * fatorVol * 10) / 10
      esc3 = Math.round(210.0 * fatorVol * 10) / 10
      desc = 'Fertilizantes nitrogenados, diesel agrícola em tratores e colheita'
      break
    case 'automotiva':
      esc1 = Math.round(65.0 * fatorVol * 10) / 10
      esc2 = Math.round(42.0 * fatorVol * 10) / 10
      esc3 = Math.round(290.0 * fatorVol * 10) / 10
      desc = 'Desmontagem técnica de veículos em fim de vida (ELV), logística reversa e despoluição'
      break
    case 'construcao':
      esc1 = Math.round(55.0 * fatorVol * 10) / 10
      esc2 = Math.round(30.0 * fatorVol * 10) / 10
      esc3 = Math.round(380.0 * fatorVol * 10) / 10
      desc =
        'Canteiros de obras, armaduras de aço CA-50, agregados de concreto e demolição controlada'
      break
    case 'varejo':
      esc1 = Math.round(28.0 * fatorVol * 10) / 10
      esc2 = Math.round(85.0 * fatorVol * 10) / 10
      esc3 = Math.round(245.0 * fatorVol * 10) / 10
      desc =
        'Eletricidade predial do SIN em centros de distribuição e logística reversa de eletroeletrônicos'
      break
    case 'materiais-criticos-recuperados':
      esc1 = Math.round(22.0 * fatorVol * 10) / 10
      esc2 = Math.round(48.0 * fatorVol * 10) / 10
      esc3 = Math.round(320.0 * fatorVol * 10) / 10
      desc =
        'Cominuição de placas de circuito impresso, segregação de cobre secundário e rastreabilidade urbana'
      break
    case 'textil':
      esc1 = Math.round(40.0 * fatorVol * 10) / 10
      esc2 = Math.round(62.0 * fatorVol * 10) / 10
      esc3 = Math.round(160.0 * fatorVol * 10) / 10
      desc = 'Fiação, tecelagem, reciclagem de garrafas PET em fios e tingimento com caldeiras'
      break
    case 'plasticos':
      esc1 = Math.round(50.0 * fatorVol * 10) / 10
      esc2 = Math.round(75.0 * fatorVol * 10) / 10
      esc3 = Math.round(210.0 * fatorVol * 10) / 10
      desc = 'Extrusão, injeção termoplástica e reciclagem mecânica de resinas PP/PEAD'
      break
    case 'alimentos':
      esc1 = Math.round(85.0 * fatorVol * 10) / 10
      esc2 = Math.round(58.0 * fatorVol * 10) / 10
      esc3 = Math.round(195.0 * fatorVol * 10) / 10
      desc = 'Processamento térmico, fermentação cervejeira e embalagens pós-consumo'
      break
    case 'papel':
      esc1 = Math.round(110.0 * fatorVol * 10) / 10
      esc2 = Math.round(50.0 * fatorVol * 10) / 10
      esc3 = Math.round(175.0 * fatorVol * 10) / 10
      desc = 'Despolpamento, caldeiras de recuperação e reciclagem de papelão ondulado'
      break
    case 'farmaceutica':
      esc1 = Math.round(32.0 * fatorVol * 10) / 10
      esc2 = Math.round(68.0 * fatorVol * 10) / 10
      esc3 = Math.round(140.0 * fatorVol * 10) / 10
      desc = 'Salas limpas, climatização de precisão e descarte de embalagens farmacêuticas'
      break
  }

  const total = Math.round((esc1 + esc2 + esc3) * 10) / 10
  let statusSbce: 'isento_monitoramento' | 'dever_reporte_10k' | 'compensacao_25k' =
    'isento_monitoramento'
  if (total >= 25000) {
    statusSbce = 'compensacao_25k'
  } else if (total >= 10000) {
    statusSbce = 'dever_reporte_10k'
  }

  return {
    escopo1Tco2e: esc1,
    escopo2LocalizacaoTco2e: esc2,
    escopo2MercadoTco2e: esc2,
    escopo3Tco2e: esc3,
    emissoesTotaisTco2e: total,
    statusSbce,
    descricaoPerfil: desc,
  }
}

export function ConsoleSandboxIngestaoTab() {
  const [segmento, setSegmento] = useState<SegmentoSandbox>('automotiva')
  const [volume, setVolume] = useState<number>(10)
  const [usarAlfanumerico, setUsarAlfanumerico] = useState<boolean>(true)
  const [sementeRodadaAtual, setSementeRodadaAtual] = useState<number | null>(null)
  const [gerando, setGerando] = useState<boolean>(false)
  const [loteGerado, setLoteGerado] = useState<DocumentoSintetico[]>([])
  const [docSelecionado, setDocSelecionado] = useState<DocumentoSintetico | null>(null)
  const [modalXmlAberto, setModalXmlAberto] = useState<boolean>(false)

  // Autenticação para verificar permissão admin/master no expurgo
  const { user } = useAuth()
  const isMasterOuAdmin = user?.role === 'master' || user?.role === 'admin'

  // Estados do Modal de Purge Sandbox (2 etapas)
  const [modalPurgeAberto, setModalPurgeAberto] = useState<boolean>(false)
  const [etapaPurge, setEtapaPurge] = useState<1 | 2>(1)
  const [carregandoContagemPurge, setCarregandoContagemPurge] = useState<boolean>(false)
  const [contagemPurge, setContagemPurge] = useState<SandboxPurgeContagem | null>(null)
  const [confirmacaoTexto, setConfirmacaoTexto] = useState<string>('')
  const [executandoPurge, setExecutandoPurge] = useState<boolean>(false)
  const [resultadoPurge, setResultadoPurge] = useState<string | null>(null)

  // Estado de Ingestão no Pipeline
  const [ingestando, setIngestando] = useState<boolean>(false)
  const [triandoAgente, setTriandoAgente] = useState<boolean>(false)
  const [triagemResultado, setTriagemResultado] = useState<TriagemIngestaoCdvResultado | null>(null)
  const [resultadosIngestao, setResultadosIngestao] = useState<PipelineIngestaoResultado[]>([])
  const [progressoIngestao, setProgressoIngestao] = useState<{ atual: number; total: number }>({
    atual: 0,
    total: 0,
  })

  // Helper para identificar fator e categoria do material com base no catálogo canônico
  // Aço 2,18; Alumínio 14,40; Cobre 4,10; Polímeros 1,90; Concreto/agregado reciclado 0,12;
  // Refrigerante R-134a 1530; R-1234yf 0,50.
  // Sem fator oficial = fator 0, CO₂e 0 e status 'em_estruturacao_de_catalogo' ("massa rastreada sem crédito de carbono").
  // NUNCA inventar número nem usar estimativa fictícia.
  const obterFatorECategoriaMaterial = (
    item: any,
    segmentoDoc: SegmentoSandbox,
  ): {
    categoriaSelect:
      | 'aco'
      | 'aluminio'
      | 'cobre'
      | 'polimeros'
      | 'concreto'
      | 'outros'
      | 'agro_rastreado'
    categoriaDescritiva: string
    fatorCo2eKg: number
    statusCalculo: 'calculado' | 'em_estruturacao_de_catalogo'
  } => {
    const slugCanonico = normalizarSegmento(segmentoDoc)
    const cat = String(item.categoriaMaterial || '').toLowerCase()
    const descItem = String(item.xProd || '').toLowerCase()

    // Fluidos refrigerantes com fatores oficiais DM-ORB-001 / IPCC AR6
    if (
      descItem.includes('r-134a') ||
      descItem.includes('r134a') ||
      descItem.includes('hfc-134a')
    ) {
      return {
        categoriaSelect: 'outros',
        categoriaDescritiva: 'Fluido Refrigerante R-134a (GWP 1530 IPCC AR6)',
        fatorCo2eKg: 1530.0,
        statusCalculo: 'calculado',
      }
    }
    if (
      descItem.includes('r-1234yf') ||
      descItem.includes('r1234yf') ||
      descItem.includes('hfo-1234yf')
    ) {
      return {
        categoriaSelect: 'outros',
        categoriaDescritiva: 'Fluido Refrigerante R-1234yf (GWP 0,50 IPCC AR6)',
        fatorCo2eKg: 0.5,
        statusCalculo: 'calculado',
      }
    }

    // Detecção estrita de minerais críticos / nobres (mineração urbana: restrito a ouro, paládio, prata, terras raras, ndfeb)
    const isMineralCritico =
      descItem.includes('ouro') ||
      descItem.includes('paladio') ||
      descItem.includes('paládio') ||
      descItem.includes('prata') ||
      descItem.includes('terras raras') ||
      descItem.includes('terras_raras') ||
      descItem.includes('ndfeb') ||
      (slugCanonico === 'materiais-criticos-recuperados' && cat !== 'cobre')

    if (isMineralCritico) {
      return {
        categoriaSelect: 'outros',
        categoriaDescritiva:
          item.xProd || 'Minerais Críticos & Metais Nobres (Em estruturação de catálogo)',
        fatorCo2eKg: 0,
        statusCalculo: 'em_estruturacao_de_catalogo',
      }
    }

    // Detecção de agro/biomassa/grãos rastreados (soja, grãos, milho, biomassa em estruturação de catálogo)
    const isAgroRastreado =
      slugCanonico === 'agro' ||
      cat === 'agro' ||
      cat === 'agro_rastreado' ||
      descItem.includes('soja') ||
      descItem.includes('grao') ||
      descItem.includes('grão') ||
      descItem.includes('milho') ||
      descItem.includes('biomassa')

    if (isAgroRastreado) {
      return {
        categoriaSelect: 'agro_rastreado',
        categoriaDescritiva:
          item.xProd || 'Massa Agro & Biomassa Rastreada (Em estruturação de catálogo)',
        fatorCo2eKg: 0,
        statusCalculo: 'em_estruturacao_de_catalogo',
      }
    }

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
        fatorCo2eKg: 4.1,
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
    if (cat === 'concreto' || descItem.includes('concreto') || descItem.includes('rcd')) {
      return {
        categoriaSelect: 'concreto',
        categoriaDescritiva: 'Concreto / Agregados Reciclados de Construção Civil (RCD)',
        fatorCo2eKg: 0.12,
        statusCalculo: 'calculado',
      }
    }

    // Se o item tiver fator explicitamente declarado oficial e status 'calculado'
    if (
      item.statusCalculo === 'calculado' &&
      typeof item.fatorCo2eKg === 'number' &&
      item.fatorCo2eKg > 0
    ) {
      return {
        categoriaSelect: 'outros',
        categoriaDescritiva: item.xProd || 'Material com Fator Oficial Declarado',
        fatorCo2eKg: item.fatorCo2eKg,
        statusCalculo: 'calculado',
      }
    }

    // SEM FATOR OFICIAL: zero crédito, status em estruturação de catálogo (massa rastreada sem crédito)
    return {
      categoriaSelect: 'outros',
      categoriaDescritiva:
        item.xProd || 'Massa Rastreada sem Crédito de Carbono (Em estruturação de catálogo)',
      fatorCo2eKg: 0,
      statusCalculo: 'em_estruturacao_de_catalogo',
    }
  }

  // Executar Triagem Não-Bloqueante com o Agente Nativo Skip Cloud
  const handleTriarComAgente = async () => {
    if (loteGerado.length === 0) return
    setTriandoAgente(true)
    try {
      const primeiroDoc = loteGerado[0]
      const resumoLote = {
        segmento,
        totalDocumentos: loteGerado.length,
        chaveAcesso: primeiroDoc.chaveAcesso,
        cnpjEmitente: primeiroDoc.cnpjEmitente,
        razaoSocial: primeiroDoc.razaoSocialEmitente,
        itens: primeiroDoc.itens.map((it) => ({
          cProd: it.cProd,
          xProd: it.xProd,
          ncm: it.ncm,
          pesoKg: it.pesoKg,
          categoriaMaterial: it.categoriaMaterial,
        })),
      }
      const resultado = await consultarTriadorIngestao(resumoLote, 9000)
      if (resultado) {
        setTriagemResultado(resultado)
      }
    } catch (err) {
      console.warn('[Triador Ingestão CDV] Triagem não-bloqueante ignorada:', err)
    } finally {
      setTriandoAgente(false)
    }
  }

  // Gerar novo lote sintético
  const handleGerarLote = async () => {
    setGerando(true)
    setResultadosIngestao([])
    setTriagemResultado(null)
    try {
      const novaSemente = gerarSementeRodada()
      setSementeRodadaAtual(novaSemente)
      const lote = await gerarLoteSintetico({
        segmento,
        quantidade: volume,
        usarCnpjAlfanumerico: usarAlfanumerico,
        roundSeed: novaSemente,
      })
      setLoteGerado(lote)
      setDocSelecionado(lote[0] || null)
    } catch (err: any) {
      alert('Erro ao gerar documentos sintéticos: ' + err.message)
    } finally {
      setGerando(false)
    }
  }

  // Iniciar fluxo do modal de Purge em 2 etapas
  const handleAbrirModalPurge = async () => {
    setModalPurgeAberto(true)
    setEtapaPurge(1)
    setConfirmacaoTexto('')
    setCarregandoContagemPurge(true)
    try {
      const cont = await contarRegistrosSandboxPurge()
      setContagemPurge(cont)
    } catch (err: any) {
      alert('Erro ao contar registros elegíveis: ' + err.message)
    } finally {
      setCarregandoContagemPurge(false)
    }
  }

  const handleConfirmarPurgeEtapa2 = async () => {
    if (confirmacaoTexto.trim().toUpperCase() !== 'EXPURGAR-SANDBOX') {
      alert('Digite exatamente EXPURGAR-SANDBOX para autorizar a exclusão.')
      return
    }

    setExecutandoPurge(true)
    try {
      const res = await executarSandboxPurge('EXPURGAR-SANDBOX')
      setResultadoPurge(
        res.mensagem ||
          `Expurgo concluído: ${res.lotes} lotes, ${res.pecas} peças e ${res.selos} selos excluídos.`,
      )
      setModalPurgeAberto(false)
    } catch (err: any) {
      alert('Erro ao executar expurgo do Sandbox: ' + (err?.message || 'Falha na exclusão'))
    } finally {
      setExecutandoPurge(false)
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

  // Download de lote completo
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
    const usuarioLogado = pb.authStore.model

    // 1. INVENTÁRIO GHG SINTÉTICO (Item 1):
    // UPSERT com origem: 'sintetico' + cnpj do documento + segmento
    // Se existir, UPDATE dos campos de escopo + laudo_detalhes_json (marcando atualizadoEm); se não, create.
    const slugCanonico = normalizarSegmento(segmento)
    const dadosInventarioGhg = calcularInventarioGhgPorSegmento(slugCanonico, loteGerado.length)
    let inventarioGhgId = ''

    try {
      const primeiroDoc = loteGerado[0]
      const cnpjFormatado = formatarCnpj(primeiroDoc.cnpjEmitente)
      const anoAtual = new Date().getFullYear()

      // Buscar inventário sintético existente para este CNPJ
      let inventarioExistente: any = null
      try {
        const registros = await pb.collection('emissoes_inventario').getFullList({
          filter: `origem = "sintetico" && cnpj = "${cnpjFormatado}"`,
          sort: '-created',
        })
        // Encontrar aquele cujo segmento no laudo_detalhes_json corresponda ao slugCanonico
        inventarioExistente = registros.find((r: any) => {
          try {
            const d =
              typeof r.laudo_detalhes_json === 'string'
                ? JSON.parse(r.laudo_detalhes_json)
                : r.laudo_detalhes_json
            return d?.segmento === slugCanonico
          } catch {
            return false
          }
        })
      } catch {
        inventarioExistente = null
      }

      const payloadInventario = {
        usuario: usuarioLogado?.id || null,
        empresa_nome: `${primeiroDoc.razaoSocialEmitente} (Demonstração)`,
        cnpj: cnpjFormatado,
        ano_base: anoAtual,
        periodo_referencia: `Exercício ${anoAtual} • Sandbox dMRV`,
        escopo1_total_tco2e: dadosInventarioGhg.escopo1Tco2e,
        escopo2_localizacao_tco2e: dadosInventarioGhg.escopo2LocalizacaoTco2e,
        escopo2_mercado_tco2e: dadosInventarioGhg.escopo2MercadoTco2e,
        escopo3_total_tco2e: dadosInventarioGhg.escopo3Tco2e,
        emissoes_biogenicas_tco2e: 0,
        emissoes_totais_tco2e: dadosInventarioGhg.emissoesTotaisTco2e,
        insetting_iso14067_tco2e: 0,
        incerteza_consolidada_pct: 3.5,
        status_sbce: dadosInventarioGhg.statusSbce,
        versao_metodologia: 'GHG Protocol Corporate Standard • ISO 14064-1:2018 (Sandbox)',
        origem: 'sintetico',
        laudo_detalhes_json: {
          tipo: 'sandbox_sintetico',
          segmento: slugCanonico,
          totalDocumentos: loteGerado.length,
          perfil: dadosInventarioGhg.descricaoPerfil,
          marca: MARCA_SANDBOX_OBRIGATORIA,
          atualizadoEm: new Date().toISOString(),
        },
      }

      if (inventarioExistente) {
        const regInv = await pb
          .collection('emissoes_inventario')
          .update(inventarioExistente.id, payloadInventario)
        inventarioGhgId = regInv.id
      } else {
        const regInv = await pb.collection('emissoes_inventario').create(payloadInventario)
        inventarioGhgId = regInv.id
      }
    } catch (invErr: any) {
      console.warn('Aviso ao gerar registro sintético em emissoes_inventario:', invErr)
    }

    // Consulta prévia não-bloqueante ao Triador de Ingestão CDV (Agente Nativo Skip Cloud)
    try {
      const docAmostra = loteGerado[0]
      const resumoTriagem = {
        segmento,
        totalDocumentos: loteGerado.length,
        chaveAcesso: docAmostra.chaveAcesso,
        cnpjEmitente: docAmostra.cnpjEmitente,
        itens: docAmostra.itens.map((it) => ({
          xProd: it.xProd,
          pesoKg: it.pesoKg,
          categoriaMaterial: it.categoriaMaterial,
        })),
      }
      consultarTriadorIngestao(resumoTriagem, 5000)
        .then((res) => {
          if (res) setTriagemResultado(res)
        })
        .catch(() => {})
    } catch {
      /* intentionally ignored */
    }

    for (let i = 0; i < loteGerado.length; i++) {
      const doc = loteGerado[i]
      setProgressoIngestao({ atual: i + 1, total: loteGerado.length })

      const sufixoHex = Math.floor(100000 + Math.random() * 900000).toString()
      const codigoSelo = `PR-SEAL-2026-${sufixoHex}`
      const hoje = new Date().toISOString().slice(0, 10)
      const validadeAnoQueVem = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)

      let regSeloId = ''
      let regLoteId = ''
      let regPecaId = ''
      let pecasGravadasContador = 0
      let pecasTotalContador = 0

      try {
        // 1. Gravar na coleção 'selos' com origem: 'sintetico'
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
          const msg = getErrorMessage(seloErr) || seloErr?.message || 'Falha ao criar selo'
          throw new Error(`[Coleção selos]: ${msg}`)
        }

        // 2. GRAVAÇÃO UNIVERSAL dMRV: TODOS os 16 segmentos gravam cdv_lotes e cdv_pecas
        // Massa agregada do documento via doc.itens.reduce(...), CO₂e só com fator oficial, sem fator = rastreado sem crédito
        const opcaoSetorial = SEGMENTOS_SANDBOX_CATALOGO.find(
          (s) => s.chave === doc.segmento || s.slugCanonico === normalizarSegmento(doc.segmento),
        )
        let totalPesoDoc = 0
        let totalCo2eDoc = 0

        if (doc.itens && doc.itens.length > 0) {
          const itensProcessados = await Promise.all(
            doc.itens.map(async (it, itemIdx) => {
              const infoMat = obterFatorECategoriaMaterial(it, doc.segmento)
              const pesoKg = Number(it.pesoKg || 0)
              const seloItem = doc.itens.length === 1 ? codigoSelo : `${codigoSelo}-${itemIdx + 1}`

              const co2eEvitadoKg =
                infoMat.statusCalculo === 'em_estruturacao_de_catalogo'
                  ? 0
                  : Math.round(pesoKg * infoMat.fatorCo2eKg * 100) / 100

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

          pecasTotalContador = itensProcessados.length

          totalPesoDoc =
            Math.round(itensProcessados.reduce((acc, p) => acc + p.pesoKg, 0) * 100) / 100
          totalCo2eDoc =
            Math.round(itensProcessados.reduce((acc, p) => acc + p.co2eEvitadoKg, 0) * 100) / 100

          const descricaoLote = `${opcaoSetorial?.titulo || 'Lote Sintético Setorial'} (Demonstração)`
          const isAutomotiva = normalizarSegmento(doc.segmento) === 'automotiva'

          let regLote: any
          try {
            regLote = await pb.collection('cdv_lotes').create({
              cdv_nome: doc.razaoSocialEmitente,
              cdv_cnpj: formatarCnpj(doc.cnpjEmitente),
              cdv_codigo: `SANDBOX-${normalizarSegmento(doc.segmento).toUpperCase().slice(0, 10)}`,
              veiculo_marca_modelo: isAutomotiva ? descricaoLote : '',
              veiculo_chassi: isAutomotiva
                ? doc.dadosAdicionais.chassi || `SYNTH-${doc.chaveAcesso.slice(-8)}`
                : '',
              veiculo_baixa_detran: isAutomotiva ? `SYN-BX-${sufixoHex}` : '',
              veiculo_placa: '',
              veiculo_seguradora: isAutomotiva
                ? (doc.dadosAdicionais as any)?.seguradora || ''
                : '',
              origem_envio: 'erp',
              status: 'processado',
              total_pecas: doc.itens.length,
              total_peso_kg: totalPesoDoc,
              total_co2e_evitado_kg: totalCo2eDoc,
              is_demo: true,
              origem: 'sintetico',
              payload_bruto_json: {
                tipo: 'sandbox_sintetico',
                segmento: doc.segmento,
                protocoloSetorialSlug: normalizarSegmento(doc.segmento),
                chaveAcesso: doc.chaveAcesso,
                hashSha256: doc.hashSha256,
                marca: MARCA_SANDBOX_OBRIGATORIA,
                totalItens: doc.itens.length,
                totalPesoKg: totalPesoDoc,
                totalCo2eKg: totalCo2eDoc,
                inventarioGhgId: inventarioGhgId || null,
              },
            })
            regLoteId = regLote.id
          } catch (loteErr: any) {
            const msg = getErrorMessage(loteErr) || loteErr?.message || 'Falha ao criar cdv_lotes'
            throw new Error(`[Coleção cdv_lotes]: ${msg}`)
          }

          const errosPecas: string[] = []
          for (let pIdx = 0; pIdx < itensProcessados.length; pIdx++) {
            const p = itensProcessados[pIdx]
            const materialDeclaradoTexto =
              p.statusCalculo === 'em_estruturacao_de_catalogo'
                ? `${p.categoriaDescritiva} [STATUS: EM ESTRUTURAÇÃO DE CATÁLOGO - ZERO CRÉDITO]`
                : p.categoriaDescritiva

            try {
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
                cdv_origem: `SANDBOX-${normalizarSegmento(doc.segmento).toUpperCase().slice(0, 10)}`,
                cdv_cnpj: formatarCnpj(doc.cnpjEmitente),
                status: 'ativo',
                situacao_checklist: 'etiquetada',
                origem: 'sintetico',
              })
              pecasGravadasContador++
              if (pIdx === 0) {
                regPecaId = regPeca.id
              }
            } catch (pecaErr: any) {
              const msg = getErrorMessage(pecaErr) || pecaErr?.message || 'Falha ao criar peça'
              errosPecas.push(`Item #${pIdx + 1} (${p.item.xProd}): ${msg}`)
            }
          }

          if (errosPecas.length > 0) {
            throw new Error(
              `[Coleção cdv_pecas]: ${errosPecas.length} de ${itensProcessados.length} peças falharam: ${errosPecas[0]}`,
            )
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
          registroInventarioId: inventarioGhgId || undefined,
          pecasGravadas: pecasGravadasContador,
          pecasTotal: pecasTotalContador,
          totalPesoKg: totalPesoDoc,
          totalCo2eEvitadoKg: totalCo2eDoc,
        })
      } catch (err: any) {
        const mensagemErro =
          err?.message || getErrorMessage(err) || 'Erro durante processamento no pipeline'
        resultados.push({
          sucesso: false,
          documentoId: doc.id,
          chaveAcesso: doc.chaveAcesso,
          seloDpp: codigoSelo,
          hashIntegridade: doc.hashSha256,
          registroSeloId: regSeloId || undefined,
          registroLoteId: regLoteId || undefined,
          registroPecaId: regPecaId || undefined,
          registroInventarioId: inventarioGhgId || undefined,
          pecasGravadas: pecasGravadasContador,
          pecasTotal: pecasTotalContador,
          erro: mensagemErro,
          detalhesErro: String(err?.stack || err),
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
            Sandbox de Ingestão dMRV
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono">
            <ShieldAlert className="w-3.5 h-3.5" />
            Ambiente Isolado • Não Integrado à SEFAZ
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 text-xs font-mono">
            <Layers className="w-3.5 h-3.5" />
            15 Protocolos Setoriais + Materiais Críticos
          </span>
        </div>

        <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-100 tracking-wide">
          GERADOR NATIVO & INGESTÃO SINTÉTICA DE DOCUMENTOS FISCAIS
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
          Gere conjuntos controlados de NF-e e CT-e sintéticos alinhados aos 15 Protocolos Setoriais
          do Orbis Protocol e ao módulo de Materiais Críticos. Cálculo de carbono SOMENTE com
          fatores oficiais do catálogo canônico (aço 2,18; alumínio 14,40; cobre 4,10; polímeros
          1,90; concreto/RCD 0,12). Os dados são gravados com a marca{' '}
          <strong className="text-emerald-400 font-mono">origem: &apos;sintetico&apos;</strong> nas
          coleções selos, cdv_lotes, cdv_pecas e emissoes_inventario, permanecendo estritamente
          isolados das consultas públicas.
        </p>
      </div>

      {/* Painel de Controles e Configuração do Lote */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Seletor de Segmento (15 Protocolos + Materiais Críticos) */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block font-semibold uppercase text-slate-500 dark:text-[#93A3B5] text-[11px]">
              Protocolo Setorial / Segmento dMRV
            </label>
            <select
              value={segmento}
              onChange={(e) => setSegmento(e.target.value as SegmentoSandbox)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {SEGMENTOS_SANDBOX_CATALOGO.map((s, idx) => (
                <option key={s.chave} value={s.chave}>
                  {idx + 1}. {s.titulo} — {s.subtitulo}
                </option>
              ))}
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
        </div>

        {/* Botão de Ação Gerar Lote e Ação de Purge */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>
              Ao ingestar, gerará automaticamente lote, peças rastreáveis e inventário GHG Protocol
              (Escopos 1/2/3) marcado com <code>origem = &apos;sintetico&apos;</code>.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isMasterOuAdmin && (
              <button
                type="button"
                onClick={handleAbrirModalPurge}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold flex items-center justify-center gap-2 border border-rose-300 dark:border-rose-800/60 shadow-sm transition-all text-xs shrink-0"
                title="Limpar exclusivamente lotes, peças e selos de teste/demo, mantendo lotes reais preservados"
              >
                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Limpar Base de Testes Sandbox (Purge Demo)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleGerarLote}
              disabled={gerando || ingestando}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 text-xs shrink-0"
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

        {/* Notificação de Expurgo Concluído */}
        {resultadoPurge && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">{resultadoPurge}</span>
            </div>
            <button
              type="button"
              onClick={() => setResultadoPurge(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

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
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                  Lote de Documentos Prontos ({loteGerado.length})
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  Demonstração
                </span>
                {sementeRodadaAtual !== null && (
                  <span
                    data-testid="badge-round-seed"
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  >
                    Semente da rodada: #{sementeRodadaAtual}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chaves calculadas com DV SEFAZ módulo 11, semente por rodada única e tags íntegras
                para parse e ingestão.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleTriarComAgente}
                disabled={triandoAgente || ingestando}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-2 transition-colors border border-indigo-200 dark:border-indigo-800 disabled:opacity-50"
                title="Consultar proposta de classificação e detecção de anomalias com o Agente Nativo Skip Cloud"
              >
                {triandoAgente ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Triando com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Triador IA Skip Cloud</span>
                  </>
                )}
              </button>

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
                    <span>Ingestar no Pipeline (com Inventário GHG)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card de Parecer do Triador de Ingestão CDV (Agente Nativo Skip Cloud) */}
          {triagemResultado && (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                    Triador de Ingestão CDV (Agente Nativo Skip Cloud)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      triagemResultado.nivel_risco === 'bloqueante'
                        ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        : triagemResultado.nivel_risco === 'alto'
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    Risco: {triagemResultado.nivel_risco.toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Assistência pré-gravação · Decisão final determinística
                </span>
              </div>

              <p className="text-xs text-indigo-900/90 dark:text-indigo-200/90">
                {triagemResultado.resumo_triagem}
              </p>

              {/* Anomalias Sinalizadas */}
              {triagemResultado.anomalias_detectadas &&
                triagemResultado.anomalias_detectadas.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-amber-100/60 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-800/40 text-[11px] space-y-1">
                    <strong className="block text-[10px] font-bold text-amber-900 dark:text-amber-200 uppercase">
                      Anomalias Sinalizadas pelo Triador (
                      {triagemResultado.anomalias_detectadas.length}):
                    </strong>
                    <ul className="list-disc list-inside space-y-0.5 font-mono text-[10px] text-amber-900 dark:text-amber-300">
                      {triagemResultado.anomalias_detectadas.map((ano, aIdx) => (
                        <li key={aIdx}>
                          <span className="font-bold">[{ano.codigo}]</span> {ano.descricao}
                          {ano.sugestao_correcao && (
                            <span className="italic opacity-85">
                              {' '}
                              — Sugestão: {ano.sugestao_correcao}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Classificações Propostas */}
              {triagemResultado.classificacao_proposta &&
                triagemResultado.classificacao_proposta.length > 0 && (
                  <div className="text-[11px] space-y-1">
                    <strong className="block text-[10px] uppercase font-bold text-indigo-800 dark:text-indigo-300">
                      Proposta de Categorias & Fontes Oficiais:
                    </strong>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10px]">
                      {triagemResultado.classificacao_proposta.slice(0, 4).map((cp, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-1.5 rounded bg-white/80 dark:bg-slate-900/60 border border-indigo-200/50 dark:border-indigo-800/40"
                        >
                          <span className="font-bold block truncate">{cp.descricao}</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            → {cp.categoria_material}
                          </span>
                          <span className="text-slate-500 block truncate text-[9px]">
                            {cp.observacao_metodologica || cp.justificativa}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Feedback de Progresso e Ingestão */}
          {resultadosIngestao.length > 0 &&
            (() => {
              const sucessos = resultadosIngestao.filter((r) => r.sucesso)
              const falhas = resultadosIngestao.filter((r) => !r.sucesso)
              const todosComSucesso = falhas.length === 0
              const todosComFalha = sucessos.length === 0

              return (
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    todosComSucesso
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                      : todosComFalha
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/50 text-rose-900 dark:text-rose-200'
                        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/50 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="font-bold flex items-center gap-1.5">
                      {todosComSucesso ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      )}
                      {todosComSucesso
                        ? `Ingestão concluída: ${sucessos.length} documento(s) e inventário GHG gravados com sucesso!`
                        : todosComFalha
                          ? `Falha na ingestão: todos os ${falhas.length} documento(s) foram recusados pelo backend.`
                          : `Ingestão parcial: ${sucessos.length} gravado(s) com sucesso e ${falhas.length} falhado(s).`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        Gravados: {sucessos.length}
                      </span>
                      {falhas.length > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300">
                          Falhados: {falhas.length}
                        </span>
                      )}
                      <span className="text-[11px] font-mono opacity-80">
                        origem = &apos;sintetico&apos;
                      </span>
                    </div>
                  </div>

                  {falhas.length > 0 && (
                    <div className="p-3 rounded-lg bg-rose-100/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-[11px] space-y-1">
                      <strong className="block font-semibold text-rose-900 dark:text-rose-200">
                        Erros reportados pelo servidor:
                      </strong>
                      <ul className="list-disc list-inside space-y-0.5 font-mono text-[10px] text-rose-800 dark:text-rose-300">
                        {falhas.slice(0, 3).map((f) => (
                          <li key={f.documentoId} className="truncate" title={f.erro}>
                            Doc {f.documentoId}: {f.erro}
                          </li>
                        ))}
                        {falhas.length > 3 && (
                          <li className="italic">...e mais {falhas.length - 3} falhas similares</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {sucessos.length > 0 &&
                    (() => {
                      const totalPecasGravadas = sucessos.reduce(
                        (acc, r) => acc + (r.pecasGravadas || 0),
                        0,
                      )
                      const totalMassaLotes =
                        Math.round(
                          sucessos.reduce((acc, r) => acc + (r.totalPesoKg || 0), 0) * 100,
                        ) / 100
                      const totalCo2eLotes =
                        Math.round(
                          sucessos.reduce((acc, r) => acc + (r.totalCo2eEvitadoKg || 0), 0) * 100,
                        ) / 100
                      const temLotesGravados = sucessos.some((r) => Boolean(r.registroLoteId))

                      return (
                        <div className="space-y-1 text-[11px] opacity-95">
                          <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                            {temLotesGravados
                              ? `Selo gravado ✓ · Lote dMRV gravado ✓ (${totalPecasGravadas} item(ns), ${totalMassaLotes.toLocaleString('pt-BR')} kg massa, ${totalCo2eLotes.toLocaleString('pt-BR')} kg CO₂e evitado)`
                              : 'Selo gravado ✓ · Lote dMRV não gerado'}
                          </p>
                          <p className="opacity-90">
                            Os registros foram persistidos nas coleções do backend com origem
                            sintetico e já podem ser auditados na aba &quot;12. dMRV Emissões
                            Evitadas (SBCE)&quot; na posição &apos;Sandbox (Demonstração)&apos;.
                          </p>
                        </div>
                      )
                    })()}
                </div>
              )
            })()}

          {/* Tabela do Lote */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Doc & Modelo</th>
                  <th className="p-3">Status Ingestão</th>
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
                  const teveTentativa = Boolean(resultado)
                  const falhou = teveTentativa && !resultado?.sucesso

                  return (
                    <tr
                      key={doc.id}
                      className={`transition-colors ${
                        falhou
                          ? 'bg-rose-50/90 dark:bg-rose-950/40 border-l-4 border-l-rose-600 hover:bg-rose-100/70'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
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

                      {/* Coluna Status Ingestão */}
                      <td className="p-3">
                        {!teveTentativa ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Aguardando
                          </span>
                        ) : resultado?.sucesso ? (
                          <div className="space-y-1">
                            {resultado.registroLoteId ? (
                              <>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  Sucesso dMRV
                                </span>
                                <span className="block text-[9px] font-mono text-emerald-700 dark:text-emerald-300 font-medium leading-tight">
                                  Selo gravado ✓ · Lote dMRV gravado ✓ (
                                  {resultado.pecasGravadas ?? 0} item(ns),{' '}
                                  {(resultado.totalPesoKg ?? 0).toLocaleString('pt-BR')} kg massa,{' '}
                                  {(resultado.totalCo2eEvitadoKg ?? 0).toLocaleString('pt-BR')} kg
                                  CO₂e evitado)
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                                  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  Sem Lote dMRV
                                </span>
                                <span className="block text-[9px] font-mono text-amber-700 dark:text-amber-300 font-medium">
                                  Selo gravado ✓ · Lote dMRV não gerado
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-w-[260px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-extrabold uppercase tracking-wide bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/40">
                                <XCircle className="w-3.5 h-3.5 shrink-0" />
                                FALHA NA GRAVAÇÃO
                              </span>
                              {resultado?.registroSeloId && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
                                  Selo OK · Lote 400
                                </span>
                              )}
                            </div>
                            <div className="p-1.5 rounded bg-rose-100/80 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/80 text-[10px] font-mono text-rose-900 dark:text-rose-200 leading-tight">
                              <strong className="block text-[9px] uppercase tracking-wider text-rose-700 dark:text-rose-300 font-bold mb-0.5">
                                Recusa pelo PocketBase:
                              </strong>
                              <span
                                className="block break-words font-medium"
                                title={resultado?.erro}
                              >
                                {resultado?.erro}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        <div className="truncate max-w-[200px]" title={doc.chaveAcesso}>
                          {doc.chaveAcesso}
                        </div>
                        {resultado?.seloDpp && resultado.sucesso && (
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

      {/* Modal de Confirmação em 2 Etapas: Purge Demo / Sandbox */}
      {modalPurgeAberto && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111820] border-2 border-rose-600 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                    Expurgo da Base Sandbox (Purge Demo)
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Etapa {etapaPurge} de 2 • Governança Restrita
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPurgeAberto(false)}
                disabled={executandoPurge}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {carregandoContagemPurge ? (
              <div className="py-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-600" />
                <p className="text-xs text-muted-foreground">
                  Auditando banco e contabilizando registros de testes (is_demo=true / sintetico)...
                </p>
              </div>
            ) : etapaPurge === 1 ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Atenção: Ação Irreversível</span>
                  </div>
                  <p className="opacity-90 leading-relaxed">
                    Esta operação excluirá definitivamente registros gerados exclusivamente no
                    Sandbox para testes.
                  </p>
                </div>

                {/* Resumo da Contagem Exata */}
                <div className="space-y-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block uppercase text-[11px]">
                    Registros Elegíveis para Exclusão:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                        Lotes Demo
                      </span>
                      <strong className="text-lg font-mono text-slate-900 dark:text-slate-100 font-black">
                        {contagemPurge?.lotes ?? 0}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                        Peças / DPP
                      </span>
                      <strong className="text-lg font-mono text-slate-900 dark:text-slate-100 font-black">
                        {contagemPurge?.pecas ?? 0}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                        Selos Digitais
                      </span>
                      <strong className="text-lg font-mono text-slate-900 dark:text-slate-100 font-black">
                        {contagemPurge?.selos ?? 0}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Garantia de Proteção de Lotes Reais */}
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="block font-semibold">Proteção do Histórico Real</strong>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      Lotes reais com lastro operacional (como o lote Volkswagen Gol ID{' '}
                      <code>h1dpr8wniludemh</code> com <code>is_demo: false</code>) e peças com
                      lastro SEFAZ <strong>NUNCA são tocados</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalPurgeAberto(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEtapaPurge(2)}
                    disabled={(contagemPurge?.total ?? 0) === 0}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all disabled:opacity-50"
                  >
                    Prosseguir para Confirmação Final →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2">
                  <p className="font-semibold leading-relaxed">
                    Para confirmar a exclusão irreversível de{' '}
                    <strong>{contagemPurge?.lotes ?? 0} lotes</strong>,{' '}
                    <strong>{contagemPurge?.pecas ?? 0} peças</strong> e{' '}
                    <strong>{contagemPurge?.selos ?? 0} selos</strong>, digite exatamente a palavra
                    abaixo:
                  </p>
                  <div className="p-2 rounded bg-white dark:bg-black/40 font-mono font-bold text-center text-sm border border-rose-400 tracking-wider">
                    EXPURGAR-SANDBOX
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase text-muted-foreground">
                    Digite a frase de autorização:
                  </label>
                  <input
                    type="text"
                    value={confirmacaoTexto}
                    onChange={(e) => setConfirmacaoTexto(e.target.value)}
                    placeholder="EXPURGAR-SANDBOX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono font-bold text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEtapaPurge(1)}
                    disabled={executandoPurge}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 disabled:opacity-50"
                  >
                    ← Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmarPurgeEtapa2}
                    disabled={
                      confirmacaoTexto.trim().toUpperCase() !== 'EXPURGAR-SANDBOX' ||
                      executandoPurge
                    }
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all disabled:opacity-40 flex items-center gap-2"
                  >
                    {executandoPurge ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Expurgando...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Confirmar Expurgo Irreversível</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
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
