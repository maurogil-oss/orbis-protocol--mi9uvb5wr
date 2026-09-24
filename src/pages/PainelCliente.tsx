import React, { useState, useEffect, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtime } from '@/hooks/use-realtime'
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  Award,
  CreditCard,
  Scale,
  UploadCloud,
  FileCode,
  Trash2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Receipt,
  FileCheck,
  Download,
  Coins,
  KeyRound,
  Sliders,
} from 'lucide-react'
import { ModalAlterarSenha } from '@/components/ModalAlterarSenha'
import { simularGreenCapitalEngine } from '@/services/greenCapitalEngine'
import {
  exportarRelatorioDossiePdf,
  DocumentoFonteNFe,
  calcularHashCanonicalDocumentosFonte,
  exportarDocumentosFonteCsv,
} from '@/services/relatorioLaudoPdf'
import {
  calcularComparativoTributario,
  ResultadoComparativoTributario,
} from '@/services/tributosReforma'
import { ComparativoTributarioView } from '@/components/ComparativoTributarioView'
import { parseNFeXML, formatCurrencyBRL } from '@/services/nfeParser'
import {
  processarDocumentoFiscal,
  DocumentoFiscalProcessado,
} from '@/services/modelosFiscaisParser'
import {
  registrarFechamentoCompetencia,
  obterFechamentoCompetencia,
  HashCompetenciaRecord,
} from '@/services/fechamentoCompetenciaService'
import { FLAG_DESVIO_ANP_MSG } from '@/services/faixaPrecoANP'
import { calcularInventarioEmissoes, InventarioEmissoesResultado } from '@/services/motorEmissoes'
import { MotorEmissoesView } from '@/components/MotorEmissoesView'
import {
  dispararTriagemPericial,
  ResultadoTriagemPericial,
} from '@/services/revisorPericialService'
import { InfoSimplesImportTab } from '@/components/InfoSimplesImportTab'
import { ConsoleApisCdvTab } from '@/components/ConsoleApisCdvTab'
import { WebhooksB2BTab } from '@/components/WebhooksB2BTab'
import {
  buscarCredenciamentoAtivoPerito,
  PeritoCredenciamentoRecord,
} from '@/services/peritoService'
import { HubConexaoFiscal } from '@/components/HubConexaoFiscal'
import { formatarFinalidade } from '@/services/greenCapitalEngine'
import { Terminal, Car, Network, Radio, Leaf } from 'lucide-react'
import { PainelDmrvEmissoesEvitadas } from '@/components/PainelDmrvEmissoesEvitadas'
import { CcrlrSinirInteroperabilidadeTab } from '@/components/CcrlrSinirInteroperabilidadeTab'
import { GerenciadorLastrosTab } from '@/components/GerenciadorLastrosTab'

import type { RecordModel } from 'pocketbase'

interface LeadDiagnostico extends RecordModel {
  cnpj: string
  razao_social: string
  status: 'novo' | 'em_analise' | 'concluido'
  regime_tributario: string
  categoria_profissional: string
  vinculo_institucional: string
  usuario?: string
  faixa_emissoes?: string
  enquadramento_sbce?: string
  exporta_ue_cbam?: string
  cbam_bens?: string
  comparativo_tributario_json?: any
}

interface NFeUploadRecord extends RecordModel {
  usuario: string
  chave_acesso: string
  numero_nota: string
  serie: string
  modelo: string
  data_emissao: string
  cnpj_emitente: string
  nome_emitente: string
  cnpj_destinatario: string
  nome_destinatario: string
  valor_total_nf: number
  valor_icms: number
  valor_ipi: number
  valor_pis: number
  valor_cofins: number
  qtd_itens: number
  nome_arquivo: string
}

interface SeloRecord extends RecordModel {
  codigo_selo: string
  empresa: string
  cnpj: string
  status: string
  data_emissao: string
  data_validade: string
}

export default function PainelCliente() {
  const { user, isMaster, isAdmin } = useAuth()
  const isParceiro = user?.role === 'parceiro'
  const [modalAlterarSenhaAberto, setModalAlterarSenhaAberto] = useState(false)

  const [leads, setLeads] = useState<LeadDiagnostico[]>([])
  const [selos, setSelos] = useState<SeloRecord[]>([])
  const [nfeList, setNfeList] = useState<NFeUploadRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Abas de visualização do módulo fiscal, motor pericial e console CDV
  const [abaFiscalAtiva, setAbaFiscalAtiva] = useState<
    | 'hub_fiscal'
    | 'dmrv_emissoes'
    | 'lastro_circularidade'
    | 'ccrlr_sinir'
    | 'upload_manual'
    | 'infosimples'
    | 'motor_emissoes'
    | 'cdv_apis'
    | 'webhooks_b2b'
  >('hub_fiscal')
  const [peritoCredenciado, setPeritoCredenciado] = useState<PeritoCredenciamentoRecord | null>(
    null,
  )
  const [possuiIREC, setPossuiIREC] = useState(false)
  const [isSalvandoInventario, setIsSalvandoInventario] = useState(false)
  const [inventarioSalvoMsg, setInventarioSalvoMsg] = useState<string | null>(null)
  const [isExportandoPdf, setIsExportandoPdf] = useState(false)

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Metodologia 5 Etapas
  const etapasMetodologia = [
    { num: '01', label: 'Diagnóstico Setorial', concluido: true },
    { num: '02', label: 'Fatores Oficiais MCTI', concluido: true },
    { num: '03', label: 'Ingestão Ativa NF-e (Mod. 55/65)', concluido: nfeList.length > 0 },
    { num: '04', label: 'Emissão de Laudos', concluido: false },
    { num: '05', label: 'Selo Oficial Concedido', concluido: false },
  ]

  const loadData = async () => {
    if (isParceiro) return
    setIsLoading(true)
    try {
      const leadsList = await pb.collection('leads_diagnostico').getList<LeadDiagnostico>(1, 10, {
        sort: '-created',
      })
      setLeads(leadsList.items)

      const selosList = await pb.collection('selos').getList<SeloRecord>(1, 5, {
        sort: '-created',
      })
      setSelos(selosList.items)

      // Buscar NF-e enviadas pelo usuário
      if (user?.id) {
        const nfeRecords = await pb.collection('nfe_upload').getFullList<NFeUploadRecord>({
          filter: `usuario = "${user.id}"`,
          sort: '-created',
        })
        setNfeList(nfeRecords)
      }
    } catch {
      /* intentionally ignored */
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    if (user?.id) {
      buscarCredenciamentoAtivoPerito(user.id).then((p) => setPeritoCredenciado(p))
    }
  }, [user])

  // Realtime updates for leads
  useRealtime<LeadDiagnostico>('leads_diagnostico', (data) => {
    if (data.action === 'create') {
      setLeads((prev) => [data.record, ...prev])
    } else if (data.action === 'update') {
      setLeads((prev) => prev.map((l) => (l.id === data.record.id ? data.record : l)))
    }
  })

  // Realtime updates for nfe_upload
  useRealtime<NFeUploadRecord>('nfe_upload', (data) => {
    if (data.action === 'create') {
      setNfeList((prev) => [data.record, ...prev])
    } else if (data.action === 'delete') {
      setNfeList((prev) => prev.filter((item) => item.id !== data.record.id))
    }
  })

  // Processamento e Upload de arquivos XML NF-e
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (!user?.id) {
      setUploadError('Você precisa estar autenticado para enviar notas fiscais.')
      return
    }

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    let successCount = 0
    const errors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Limitar a arquivos de até 5MB (.xml, .json, .txt)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: excede o limite máximo de 5 MB`)
        continue
      }

      try {
        const text = await file.text()
        const parsedDoc = processarDocumentoFiscal(text, file.name)

        // Grava no PocketBase com suporte aos novos modelos fiscais
        await pb.collection('nfe_upload').create({
          usuario: user.id,
          chave_acesso: parsedDoc.chaveAcesso,
          numero_nota: parsedDoc.numeroDocumento,
          serie: parsedDoc.serie,
          modelo: parsedDoc.modeloFiscal.split('_')[0],
          modelo_fiscal: parsedDoc.modeloFiscal,
          data_emissao: parsedDoc.dataEmissao,
          cnpj_emitente: parsedDoc.cnpjEmitente,
          nome_emitente: parsedDoc.nomeEmitente,
          cnpj_destinatario: parsedDoc.cnpjDestinatario,
          nome_destinatario: parsedDoc.nomeDestinatario,
          valor_total_nf: parsedDoc.valorTotal,
          valor_icms: parsedDoc.valorIcms,
          valor_ipi: parsedDoc.valorIpi,
          valor_pis: parsedDoc.valorPis,
          valor_cofins: parsedDoc.valorCofins,
          qtd_itens: parsedDoc.itens.length,
          resumo_itens_json: parsedDoc.itens.slice(0, 15),
          nome_arquivo: file.name,
          origem: 'manual',
          combustivel_tipo: parsedDoc.combustivelTipo,
          combustivel_litros: parsedDoc.combustivelLitros,
          energia_kwh: parsedDoc.energiaKwh,
          transporte_tkm: parsedDoc.transporteTkm,
          flags_revisao: parsedDoc.flagsRevisao || [],
          dados_adicionais_json: {
            agua_m3: parsedDoc.aguaM3,
            telecom_gb: parsedDoc.telecomGb,
            pecas_cdv_qtd: parsedDoc.pecasReutilizadasQtd,
            valor_ibs_total: parsedDoc.valorIbsTotal || 0,
            valor_cbs_total: parsedDoc.valorCbsTotal || 0,
            tem_destaque_ibs_cbs: parsedDoc.temDestaqueIbsCbs || false,
            aviso_fase_teste: parsedDoc.avisoFaseTesteIbsCbs,
            itens_sujeitos_is_qtd: parsedDoc.totalItensSujeitosIS || 0,
            itens_sujeitos_is: parsedDoc.itensSujeitosIS || [],
          },
        })
        successCount++
      } catch (err: any) {
        errors.push(`${file.name}: ${err.message || 'Erro ao processar documento fiscal'}`)
      }
    }

    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (successCount > 0) {
      setUploadSuccess(
        `${successCount} nota(s) fiscal(is) processada(s) e incorporada(s) com sucesso!`,
      )
      // Recarrega lista
      loadData()
    }
    if (errors.length > 0) {
      setUploadError(errors.join(' | '))
    }
  }

  // Excluir nota fiscal enviada
  const handleDeleteNfe = async (id: string) => {
    if (!confirm('Deseja realmente remover esta nota fiscal da apuração?')) return
    try {
      await pb.collection('nfe_upload').delete(id)
      setNfeList((prev) => prev.filter((item) => item.id !== id))
    } catch {
      /* intentionally ignored */
    }
  }

  const currentLead = leads[0]
  const currentSelo = selos[0]

  // Totais agregados das notas fiscais enviadas (incluindo IBS/CBS e itens sujeitos a IS)
  const totaisNfe = nfeList.reduce(
    (acc, curr) => {
      acc.totalNotas += 1
      acc.somaValorTotal += curr.valor_total_nf || 0
      acc.somaPisCofins += (curr.valor_pis || 0) + (curr.valor_cofins || 0)
      acc.somaIcms += curr.valor_icms || 0
      acc.somaIpi += curr.valor_ipi || 0

      const dadosAdic = (curr as any).dados_adicionais_json || {}
      const vIbs = dadosAdic.valor_ibs_total || 0
      const vCbs = dadosAdic.valor_cbs_total || 0
      const temDestaque = dadosAdic.tem_destaque_ibs_cbs || false
      const isQtd = dadosAdic.itens_sujeitos_is_qtd || 0

      acc.somaIbs += vIbs
      acc.somaCbs += vCbs
      if (temDestaque || vIbs > 0 || vCbs > 0) {
        acc.notasComIbsCbs += 1
      } else {
        acc.notasSemIbsCbs += 1
      }
      acc.totalItensIS += isQtd

      // Coleta itens com NCM
      if (Array.isArray(curr.resumo_itens_json)) {
        curr.resumo_itens_json.forEach((it: any) => {
          if (it.ncm) {
            acc.itensParaComparativo.push({ ncm: it.ncm, descricao: it.descricao })
          }
        })
      }

      return acc
    },
    {
      totalNotas: 0,
      somaValorTotal: 0,
      somaPisCofins: 0,
      somaIcms: 0,
      somaIpi: 0,
      somaIbs: 0,
      somaCbs: 0,
      notasComIbsCbs: 0,
      notasSemIbsCbs: 0,
      totalItensIS: 0,
      itensParaComparativo: [] as Array<{ ncm?: string; descricao?: string }>,
    },
  )

  // Documentos fiscais adaptados para o Motor Pericial de Emissões
  const docsParaEmissoes: DocumentoFiscalProcessado[] = nfeList.map((item) => {
    // Normaliza tipo de combustível
    const rawTipo = (item as any).combustivel_tipo
    const cTipo: 'diesel' | 'gasolina' | 'etanol' | 'glp' | 'gnv' | undefined =
      rawTipo === 'diesel' ||
      rawTipo === 'gasolina' ||
      rawTipo === 'etanol' ||
      rawTipo === 'glp' ||
      rawTipo === 'gnv'
        ? rawTipo
        : undefined

    return {
      chaveAcesso: item.chave_acesso || item.id,
      modeloFiscal:
        ((item as any).modelo_fiscal as any) || (item.modelo === '65' ? '65_nfce' : '55_nfe'),
      numeroDocumento: item.numero_nota || '1',
      serie: item.serie || '1',
      dataEmissao: item.data_emissao || item.created,
      cnpjEmitente: item.cnpj_emitente || '',
      nomeEmitente: item.nome_emitente || '',
      cnpjDestinatario: item.cnpj_destinatario || '',
      nomeDestinatario: item.nome_destinatario || '',
      valorTotal: item.valor_total_nf || 0,
      valorIcms: item.valor_icms || 0,
      valorIpi: item.valor_ipi || 0,
      valorPis: item.valor_pis || 0,
      valorCofins: item.valor_cofins || 0,
      combustivelTipo: cTipo,
      combustivelLitros: (item as any).combustivel_litros,
      energiaKwh: (item as any).energia_kwh,
      transporteTkm: (item as any).transporte_tkm,
      aguaM3: (item as any).dados_adicionais_json?.agua_m3,
      telecomGb: (item as any).dados_adicionais_json?.telecom_gb,
      pecasReutilizadasQtd: (item as any).dados_adicionais_json?.pecas_cdv_qtd,
      origem: ((item as any).origem as any) || 'manual',
      itens: Array.isArray((item as any).resumo_itens_json) ? (item as any).resumo_itens_json : [],
      nomeArquivo: item.nome_arquivo,
    }
  })

  // Consulta se há total evitado em lotes CDV vinculados por CNPJ
  const [cdvCo2eEvitadoTotal, setCdvCo2eEvitadoTotal] = useState(0)
  const [hashFechamentoAtual, setHashFechamentoAtual] = useState<HashCompetenciaRecord | null>(null)
  const [isFechandoCompetencia, setIsFechandoCompetencia] = useState(false)
  const [fechamentoMsg, setFechamentoMsg] = useState<string | null>(null)

  useEffect(() => {
    const buscarCdvTotal = async () => {
      try {
        const lotes = await pb.collection('cdv_lotes').getFullList({
          sort: '-created',
        })
        const total = lotes.reduce((acc, curr: any) => acc + (curr.total_co2e_evitado_kg || 0), 0)
        setCdvCo2eEvitadoTotal(total)
      } catch {
        /* intentionally ignored */
      }
    }
    buscarCdvTotal()
  }, [])

  // Cálculo do Inventário Pericial de Emissões (incorporando insetting ISO 14067 de lotes CDV)
  const inventarioEmissoes = calcularInventarioEmissoes(docsParaEmissoes, {
    empresaNome: currentLead?.razao_social || 'Empresa Cadastrada',
    cnpj: currentLead?.cnpj || 'CNPJ em Análise',
    possuiIREC: possuiIREC,
    insettingCdvCo2eKg: cdvCo2eEvitadoTotal,
  })

  // Estado da Triagem Pericial Automática (Revisor Pericial Skip Cloud)
  const [resultadoTriagem, setResultadoTriagem] = useState<ResultadoTriagemPericial | null>(null)
  const [isLoadingTriagem, setIsLoadingTriagem] = useState(false)

  // Disparo automático da triagem pericial quando o inventário é calculado/concluído
  const handleExecutarTriagem = async () => {
    setIsLoadingTriagem(true)
    try {
      const res = await dispararTriagemPericial({
        empresa_nome: inventarioEmissoes.empresaNome,
        cnpj: inventarioEmissoes.cnpj,
        inventario: inventarioEmissoes,
        is_demo: false,
      })
      setResultadoTriagem(res)
    } catch (err) {
      console.error('Falha na triagem pericial:', err)
    } finally {
      setIsLoadingTriagem(false)
    }
  }

  // Executa a triagem na primeira carga após termos leads ou notas
  useEffect(() => {
    let ativo = true
    if (
      inventarioEmissoes &&
      (!resultadoTriagem || resultadoTriagem.empresa_nome !== inventarioEmissoes.empresaNome)
    ) {
      dispararTriagemPericial({
        empresa_nome: inventarioEmissoes.empresaNome,
        cnpj: inventarioEmissoes.cnpj,
        inventario: inventarioEmissoes,
        is_demo: false,
      })
        .then((res) => {
          if (ativo) setResultadoTriagem(res)
        })
        .catch((e) => console.log('Triagem inicial em background:', e))
    }
    return () => {
      ativo = false
    }
  }, [currentLead?.cnpj, nfeList.length, possuiIREC])

  // Exportação do Dossiê Pericial em PDF
  const handleExportarDossieCompleto = async () => {
    setIsExportandoPdf(true)
    try {
      const simulacaoCap = simularGreenCapitalEngine({
        valorDesejado: 500000,
        prazoMeses: 48,
        finalidade: 'eficiencia_energetica',
        temInventarioOrbis: Boolean(inventarioEmissoes),
        emissoesTotaisTCO2e: inventarioEmissoes.emissoesTotaisFosseisTCO2e,
      })

      // Mapeamento de documentos fonte (NF-e) com crédito apurado = PIS + COFINS
      const docsFonteMapeados: DocumentoFonteNFe[] = nfeList.map((item) => ({
        id: item.id,
        chave_acesso: item.chave_acesso,
        numero_nota: item.numero_nota,
        serie: item.serie,
        data_emissao: item.data_emissao,
        cnpj_emitente: item.cnpj_emitente,
        nome_emitente: item.nome_emitente,
        valor_total_nf: item.valor_total_nf,
        credito_apurado: (item.valor_pis || 0) + (item.valor_cofins || 0),
        valor_pis: item.valor_pis,
        valor_cofins: item.valor_cofins,
        valor_icms: item.valor_icms,
        modelo: (item as any).modelo_fiscal || item.modelo,
      }))

      const cnpjAlvo = currentLead?.cnpj || 'CNPJ em Análise'
      const hashFontes =
        docsFonteMapeados.length > 0
          ? await calcularHashCanonicalDocumentosFonte(docsFonteMapeados, cnpjAlvo)
          : undefined

      await exportarRelatorioDossiePdf(
        {
          identificacao: {
            razaoSocial: currentLead?.razao_social || user?.name || 'Empresa Cadastrada',
            cnpj: cnpjAlvo,
            responsavel: currentLead?.responsavel || user?.name,
            regimeTributario: currentLead?.regime_tributario,
            vinculoInstitucional: currentLead?.vinculo_institucional,
            geradoPorNome: user?.name || user?.email || 'Perito Orbis',
            geradoPorRole: 'cliente',
            demonstracao: Boolean(currentLead?.demonstracao),
            peritoCredenciado: peritoCredenciado
              ? {
                  nome: peritoCredenciado.nome_completo,
                  conselho: peritoCredenciado.conselho_tipo,
                  registro: peritoCredenciado.registro_profissional,
                  uf: peritoCredenciado.registro_uf,
                  numeroArtRrt: peritoCredenciado.numero_art_rrt,
                  termoVersao: peritoCredenciado.termo_versao,
                }
              : undefined,
          },
          diagnostico: {
            enquadramentoSbceTexto: currentLead?.enquadramento_sbce,
            statusSbce: inventarioEmissoes.enquadramentoSBCE.status,
            exportaUeCbam: currentLead?.exporta_ue_cbam,
            cbamBens: currentLead?.cbam_bens,
            faixaEmissoes: currentLead?.faixa_emissoes,
          },
          inventario: inventarioEmissoes,
          comparativoTributario: comparativoCalculado,
          greenCapital: simulacaoCap,
          documentosFonte: docsFonteMapeados.length > 0 ? docsFonteMapeados : undefined,
          hashDocumentosFonte: hashFontes,
          codigoSelo: currentSelo?.codigo_selo,
        },
        async (hash, codigo) => {
          if (user?.id) {
            await pb.collection('relatorios_exportados').create({
              usuario: user.id,
              cnpj: currentLead?.cnpj || 'CNPJ em Análise',
              razao_social: currentLead?.razao_social || 'Empresa Cadastrada',
              tipo_relatorio: 'dossie_completo_pericial',
              codigo_verificacao: codigo,
              hash_sha256: hash,
              gerado_por_nome: user.name || user.email,
              gerado_por_role: 'cliente',
              metadados_json: {
                totalNotas: totaisNfe.totalNotas,
                emissoesTotais: inventarioEmissoes.emissoesTotaisFosseisTCO2e,
              },
            })
          }
        },
      )
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar relatório em PDF.')
    } finally {
      setIsExportandoPdf(false)
    }
  }

  // Salvar Inventário no Banco de Dados
  // Carrega fechamento de competência existente quando há CNPJ
  useEffect(() => {
    const cnpjAtual = currentLead?.cnpj || 'CNPJ em Análise'
    obterFechamentoCompetencia(cnpjAtual)
      .then((rec) => {
        if (rec) setHashFechamentoAtual(rec)
      })
      .catch(() => {})
  }, [currentLead?.cnpj])

  // Disparo manual do Fechamento de Competência encadeado
  const handleExecutarFechamentoCompetencia = async () => {
    setIsFechandoCompetencia(true)
    setFechamentoMsg(null)
    try {
      const cnpjAtual = currentLead?.cnpj || 'CNPJ em Análise'
      const agora = new Date()
      const compAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`
      const chaves = nfeList.map((n) => n.chave_acesso || n.id).filter(Boolean)

      const rec = await registrarFechamentoCompetencia({
        cnpj: cnpjAtual,
        competencia: compAtual,
        chavesOuHashesNotas: chaves,
      })
      setHashFechamentoAtual(rec)
      setFechamentoMsg(
        `Hash de fechamento da competência: ${rec.hash_fechamento.slice(0, 16)}... verificado ✓`,
      )
    } catch (err: any) {
      setFechamentoMsg(`Falha ao fechar competência: ${err.message || 'Erro inesperado'}`)
    } finally {
      setIsFechandoCompetencia(false)
    }
  }

  const handleSalvarInventario = async () => {
    if (!user?.id) return
    setIsSalvandoInventario(true)
    setInventarioSalvoMsg(null)
    try {
      await pb.collection('emissoes_inventario').create({
        usuario: user.id,
        empresa_nome: inventarioEmissoes.empresaNome,
        cnpj: inventarioEmissoes.cnpj,
        ano_base: inventarioEmissoes.anoBase,
        periodo_referencia: inventarioEmissoes.periodoReferencia,
        escopo1_total_tco2e: inventarioEmissoes.escopo1TotalTCO2e,
        escopo2_localizacao_tco2e: inventarioEmissoes.escopo2LocalizacaoTCO2e,
        escopo2_mercado_tco2e: inventarioEmissoes.escopo2MercadoTCO2e,
        escopo3_total_tco2e: inventarioEmissoes.escopo3TotalTCO2e,
        emissoes_biogenicas_tco2e: inventarioEmissoes.emissoesBiogenicasTotalTCO2e,
        emissoes_totais_tco2e: inventarioEmissoes.emissoesTotaisFosseisTCO2e,
        insetting_iso14067_tco2e: inventarioEmissoes.insettingTotalTCO2e,
        incerteza_consolidada_pct: inventarioEmissoes.incertezaConsolidadaPct,
        status_sbce: inventarioEmissoes.enquadramentoSBCE.status,
        versao_metodologia: inventarioEmissoes.versaoMetodologia,
        laudo_detalhes_json: inventarioEmissoes,
      })
      setInventarioSalvoMsg(
        'Laudo pericial de emissões registrado com sucesso na base de auditoria!',
      )
    } catch (err: any) {
      setInventarioSalvoMsg(`Erro ao salvar: ${err.message || 'Falha na persistência.'}`)
    } finally {
      setIsSalvandoInventario(false)
    }
  }

  // Se houver notas reais, injetamos no cálculo comparativo
  const comparativoCalculado = currentLead
    ? calcularComparativoTributario({
        regime_tributario: currentLead.regime_tributario,
        categoria_profissional: currentLead.categoria_profissional,
        vinculo_institucional: currentLead.vinculo_institucional,
        faixa_emissoes: currentLead.faixa_emissoes,
        exporta_ue_cbam: currentLead.exporta_ue_cbam,
        cbam_bens: currentLead.cbam_bens,
        razao_social: currentLead.razao_social,
        dadosNFeReais:
          totaisNfe.totalNotas > 0
            ? {
                totalNotas: totaisNfe.totalNotas,
                periodoResumo: `apuradas na conta`,
                somaValorTotal: totaisNfe.somaValorTotal,
                somaPisCofins: totaisNfe.somaPisCofins,
                somaIcms: totaisNfe.somaIcms,
                somaIpi: totaisNfe.somaIpi,
                somaIbs: totaisNfe.somaIbs,
                somaCbs: totaisNfe.somaCbs,
                notasComIbsCbs: totaisNfe.notasComIbsCbs,
                notasSemIbsCbs: totaisNfe.notasSemIbsCbs,
                itensOuNCMs: totaisNfe.itensParaComparativo,
              }
            : undefined,
      })
    : null

  // Isolamento estrito de painel: papel parceiro deve usar /parceiro-painel e não o painel do cliente
  if (isParceiro) {
    return <Navigate to="/parceiro-painel" replace />
  }

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-[rgba(244,247,250,0.1)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-3">
              <ShieldCheck className="w-4 h-4" />
              PAINEL DO CLIENTE • AMBIENTE AUTENTICADO
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA]">
              VISÃO GERAL DO PROTOCOLO & CRÉDITOS FISCAIS
            </h1>
            <p className="text-xs sm:text-sm text-[#93A3B5] mt-1">
              Organização:{' '}
              <strong className="text-[#F4F7FA]">
                {currentLead?.razao_social || 'Empresa Cadastrada'}
              </strong>{' '}
              ({currentLead?.cnpj || 'CNPJ em análise'})
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {(isMaster || isAdmin) && (
              <Link
                to="/admin"
                className="px-4 py-2.5 rounded-lg text-xs font-bold bg-[#16202B] border border-[#D9B36C] text-[#D9B36C] hover:bg-[#D9B36C]/10 transition-all flex items-center gap-2 shadow-sm"
                title="Acesso direto ao Console Administrativo e Governança"
              >
                <Sliders className="w-3.5 h-3.5 text-[#D9B36C]" />
                <span>Console Admin</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setModalAlterarSenhaAberto(true)}
              className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] hover:border-[#12B886] hover:text-[#12B886] transition-all flex items-center gap-2"
              title="Alterar a senha da minha conta"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Alterar senha</span>
            </button>
            <button
              type="button"
              onClick={handleExportarDossieCompleto}
              disabled={isExportandoPdf}
              className="px-4 py-2.5 rounded-lg text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center gap-1.5 disabled:opacity-50"
              title="Gerar PDF completo do inventário e comparativo para entregar ao cliente"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportandoPdf ? 'Gerando Laudo PDF...' : 'Exportar Laudo PDF'}</span>
            </button>
            <Link
              to="/capital"
              className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#16202B] border border-[#12B886]/40 text-[#12B886] hover:bg-[#12B886]/10 flex items-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Green Capital (8 Linhas)</span>
            </Link>
            <Link
              to="/diagnostico"
              className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] hover:border-[#12B886]"
            >
              Novo CNPJ
            </Link>
          </div>
        </div>

        {/* Modal de Alteração da Própria Senha */}
        <ModalAlterarSenha
          aberto={modalAlterarSenhaAberto}
          onClose={() => setModalAlterarSenhaAberto(false)}
        />

        {/* SELETOR DE ABAS DO MÓDULO FISCAL & MOTOR PERICIAL */}
        <div className="flex border-b border-[rgba(244,247,250,0.1)] mb-8 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setAbaFiscalAtiva('dmrv_emissoes')}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              abaFiscalAtiva === 'dmrv_emissoes'
                ? 'border-[#12B886] text-[#12B886]'
                : 'border-transparent text-[#93A3B5] hover:text-[#F4F7FA]'
            }`}
          >
            <Leaf className="w-4 h-4 text-emerald-500" />
            <span>Painel dMRV Emissões Evitadas (GHG & SBCE)</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaFiscalAtiva('lastro_circularidade')}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              abaFiscalAtiva === 'lastro_circularidade'
                ? 'border-[#D9B36C] text-[#D9B36C]'
                : 'border-transparent text-[#93A3B5] hover:text-[#F4F7FA]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#D9B36C]" />
            <span>Lastro de Circularidade (Dec. 11.413)</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaFiscalAtiva('ccrlr_sinir')}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              abaFiscalAtiva === 'ccrlr_sinir'
                ? 'border-[#3B82F6] text-[#3B82F6]'
                : 'border-transparent text-[#93A3B5] hover:text-[#F4F7FA]'
            }`}
          >
            <FileText className="w-4 h-4 text-[#60A5FA]" />
            <span>CCRLR & Interoperabilidade SINIR</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaFiscalAtiva('hub_fiscal')}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              abaFiscalAtiva === 'hub_fiscal'
                ? 'border-[#12B886] text-[#12B886]'
                : 'border-transparent text-[#93A3B5] hover:text-[#F4F7FA]'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Hub Conexão Fiscal ACP (3 Modelos)</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaFiscalAtiva('upload_manual')}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              abaFiscalAtiva === 'upload_manual'
                ? 'border-[#12B886] text-[#12B886]'
                : 'border-transparent text-[#93A3B5] hover:text-[#F4F7FA]'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload de Arquivos Fiscais (10 Modelos)</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaFiscalAtiva('infosimples')}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              abaFiscalAtiva === 'infosimples'
                ? 'border-[#12B886] text-[#12B886]'
                : 'border-transparent text-[#93A3B5] hover:text-[#F4F7FA]'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Importar via InfoSimples (Chave 44 Dígitos)</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaFiscalAtiva('motor_emissoes')}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              abaFiscalAtiva === 'motor_emissoes'
                ? 'border-[#12B886] text-[#12B886]'
                : 'border-transparent text-[#93A3B5] hover:text-[#F4F7FA]'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Motor Pericial de Emissões (Escopos 1/2/3)</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaFiscalAtiva('cdv_apis')}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              abaFiscalAtiva === 'cdv_apis'
                ? 'border-[#12B886] text-[#12B886]'
                : 'border-transparent text-[#93A3B5] hover:text-[#F4F7FA]'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Console de APIs (Módulo CDV & DPP)</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaFiscalAtiva('webhooks_b2b')}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              abaFiscalAtiva === 'webhooks_b2b'
                ? 'border-[#12B886] text-[#12B886]'
                : 'border-transparent text-[#93A3B5] hover:text-[#F4F7FA]'
            }`}
          >
            <Radio className="w-4 h-4 text-[#D9B36C]" />
            <span>Webhooks B2B & Mensageria</span>
          </button>
        </div>

        {/* FEEDBACK DE SALVAMENTO DO INVENTÁRIO */}
        {inventarioSalvoMsg && (
          <div className="mb-6 p-4 rounded-xl bg-[#12B886]/10 border border-[#12B886]/30 text-xs text-[#12B886] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{inventarioSalvoMsg}</span>
          </div>
        )}

        {/* CONTEÚDO DAS ABAS */}
        {abaFiscalAtiva === 'dmrv_emissoes' && (
          <div className="mb-10">
            <PainelDmrvEmissoesEvitadas />
          </div>
        )}

        {abaFiscalAtiva === 'lastro_circularidade' && (
          <div className="mb-10">
            <GerenciadorLastrosTab />
          </div>
        )}

        {abaFiscalAtiva === 'ccrlr_sinir' && (
          <div className="mb-10">
            <CcrlrSinirInteroperabilidadeTab />
          </div>
        )}

        {abaFiscalAtiva === 'hub_fiscal' && (
          <div className="mb-10">
            <HubConexaoFiscal
              usuarioId={user?.id || ''}
              cnpjEmpresa={currentLead?.cnpj}
              razaoSocial={currentLead?.razao_social}
              onNfeImportada={() => loadData()}
              onNavegarParaAba={(aba) => setAbaFiscalAtiva(aba as any)}
            />
          </div>
        )}

        {abaFiscalAtiva === 'cdv_apis' && (
          <div className="mb-10">
            <ConsoleApisCdvTab
              cdvNome={currentLead?.razao_social || 'CDVerde Centro de Desmontagem Veicular'}
              cdvCnpj={currentLead?.cnpj || '76.123.456/0001-00'}
              cdvCodigo="DETRAN-PR-CDV-0089"
            />
          </div>
        )}

        {abaFiscalAtiva === 'webhooks_b2b' && (
          <div className="mb-10">
            <WebhooksB2BTab />
          </div>
        )}

        {abaFiscalAtiva === 'infosimples' && (
          <div className="mb-10">
            <InfoSimplesImportTab usuarioId={user?.id || ''} onImportSuccess={() => loadData()} />
          </div>
        )}

        {abaFiscalAtiva === 'motor_emissoes' && (
          <div className="mb-10 space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleExportarDossieCompleto}
                disabled={isExportandoPdf}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExportandoPdf ? 'Exportando Laudo...' : 'Exportar Laudo Técnico em PDF'}
                </span>
              </button>
            </div>
            <MotorEmissoesView
              inventario={inventarioEmissoes}
              possuiIREC={possuiIREC}
              onToggleIREC={(val) => setPossuiIREC(val)}
              onSalvarInventario={handleSalvarInventario}
              isSalvando={isSalvandoInventario}
              resultadoTriagem={resultadoTriagem}
              isLoadingTriagem={isLoadingTriagem}
              onReexecutarTriagem={handleExecutarTriagem}
            />
          </div>
        )}

        {abaFiscalAtiva === 'upload_manual' && (
          <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[#12B886]/30 mb-10 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-[#12B886]" />
                  <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                    INGESTÃO MULTI-MODELO FISCAL (NF-E, NFC-E, NFS-E, CT-E, MDF-E, NF3E, NFCOM,
                    BP-E, CT-E OS, FATURAS)
                  </h2>
                </div>
                <p className="text-xs text-[#93A3B5] mt-1">
                  Envie seus arquivos fiscais para substituir estimativas preliminares por créditos
                  fiscais reais apurados e alimentar o motor pericial de emissões de Escopo 1, 2 e
                  3.
                </p>
              </div>

              {/* Botões de Ação: Upload e Fechamento de Competência */}
              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFilesSelected}
                  accept=".xml,text/xml,.json,.txt"
                  multiple
                  className="hidden"
                  id="nfe-file-input"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center gap-2 disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isUploading ? 'Processando...' : 'Importar Documentos Fiscais'}</span>
                </button>

                <button
                  type="button"
                  disabled={isFechandoCompetencia || nfeList.length === 0}
                  onClick={handleExecutarFechamentoCompetencia}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#16202B] text-[#D9B36C] border border-[#D9B36C]/40 hover:bg-[#D9B36C]/10 transition-all flex items-center gap-2 disabled:opacity-40"
                  title="Calcula e registra o hash encadeado SHA-256 de todas as notas fiscais da competência"
                >
                  <ShieldCheck className="w-4 h-4 text-[#D9B36C]" />
                  <span>{isFechandoCompetencia ? 'Fechando...' : 'Fechar Competência'}</span>
                </button>

                <button
                  type="button"
                  disabled={nfeList.length === 0}
                  onClick={async () => {
                    const docsMapeados: DocumentoFonteNFe[] = nfeList.map((item) => ({
                      id: item.id,
                      chave_acesso: item.chave_acesso,
                      numero_nota: item.numero_nota,
                      serie: item.serie,
                      data_emissao: item.data_emissao,
                      cnpj_emitente: item.cnpj_emitente,
                      nome_emitente: item.nome_emitente,
                      valor_total_nf: item.valor_total_nf,
                      credito_apurado: (item.valor_pis || 0) + (item.valor_cofins || 0),
                      valor_pis: item.valor_pis,
                      valor_cofins: item.valor_cofins,
                      valor_icms: item.valor_icms,
                      modelo: (item as any).modelo_fiscal || item.modelo,
                    }))
                    const cnpjAlvo = currentLead?.cnpj || 'CNPJ em Análise'
                    const hashFontes = await calcularHashCanonicalDocumentosFonte(
                      docsMapeados,
                      cnpjAlvo,
                    )
                    exportarDocumentosFonteCsv({
                      razaoSocial: currentLead?.razao_social || 'Empresa Cadastrada',
                      cnpj: cnpjAlvo,
                      documentos: docsMapeados,
                      hashDocumentosFonte: hashFontes,
                    })
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#16202B] text-[#12B886] border border-[#12B886]/40 hover:bg-[#12B886]/10 transition-all flex items-center gap-2 disabled:opacity-40"
                  title="Exporta arquivo CSV analítico com BOM e cabeçalho de integridade criptográfica SHA-256"
                >
                  <Download className="w-4 h-4 text-[#12B886]" />
                  <span>Exportar relação completa (CSV)</span>
                </button>
              </div>
            </div>

            {/* Banner Informativo do Hash de Fechamento por Competência */}
            {(hashFechamentoAtual || fechamentoMsg) && (
              <div className="mb-5 p-3.5 rounded-xl bg-[#0A0E12] border border-[#12B886]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#12B886] font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0" />
                  <span>
                    Hash de fechamento da competência:{' '}
                    <strong className="font-mono text-[#F4F7FA]">
                      {hashFechamentoAtual
                        ? `${hashFechamentoAtual.hash_fechamento.slice(0, 18)}...${hashFechamentoAtual.hash_fechamento.slice(-6)}`
                        : ''}
                    </strong>{' '}
                    verificado ✓
                  </span>
                </div>
                <div className="text-[11px] text-[#93A3B5] font-mono">
                  Competência: {hashFechamentoAtual?.competencia || 'Vigente'} •{' '}
                  {hashFechamentoAtual?.total_notas || nfeList.length} notas inclusas
                </div>
              </div>
            )}

            {/* Feedback de erro/sucesso */}
            {uploadError && (
              <div className="mb-4 p-3 rounded-lg bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs text-[#F03E54] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
            {uploadSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-[#12B886]/10 border border-[#12B886]/30 text-xs text-[#12B886] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {/* Resumo dos Créditos Apurados */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#93A3B5] block mb-0.5">
                  Docs Ingeridos
                </span>
                <span className="text-xl font-heading font-black text-[#F4F7FA]">
                  {totaisNfe.totalNotas}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#12B886] block mb-0.5">
                  PIS/Cofins Real
                </span>
                <span className="text-xl font-heading font-black text-[#12B886]">
                  {formatCurrencyBRL(totaisNfe.somaPisCofins)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#D9B36C] block mb-0.5">
                  ICMS Destacado
                </span>
                <span className="text-xl font-heading font-black text-[#D9B36C]">
                  {formatCurrencyBRL(totaisNfe.somaIcms)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#93A3B5] block mb-0.5">
                  IPI Apurado
                </span>
                <span className="text-xl font-heading font-black text-[#F4F7FA]">
                  {formatCurrencyBRL(totaisNfe.somaIpi)}
                </span>
              </div>
            </div>

            {/* Alerta Educativo de Transição IBS/CBS e Imposto Seletivo */}
            <div className="mb-6 p-4 rounded-xl bg-[#16202B] border border-[#12B886]/30 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-[#12B886] font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#12B886]" />
                  <span>TRANSIÇÃO REFORMA TRIBUTÁRIA (FASE-TESTE 2026)</span>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#12B886]/10 text-[#12B886] font-semibold border border-[#12B886]/30">
                  Prazo Oficial: 1º/08/2026
                </span>
              </div>

              {totaisNfe.notasComIbsCbs > 0 ? (
                <div className="text-[#F4F7FA] text-xs">
                  Foram identificados grupos <strong className="text-[#12B886]">IBS/CBS</strong> em{' '}
                  <span className="font-mono text-[#12B886] font-bold">
                    {totaisNfe.notasComIbsCbs} nota(s)
                  </span>
                  . Total apurado: IBS {formatCurrencyBRL(totaisNfe.somaIbs)} | CBS{' '}
                  {formatCurrencyBRL(totaisNfe.somaCbs)}.
                </div>
              ) : (
                <div className="text-[#93A3B5] text-xs leading-relaxed">
                  <span className="text-[#D9B36C] font-semibold">Aviso educativo: </span>
                  Notas sem destaque IBS/CBS — a partir de{' '}
                  <strong className="text-[#F4F7FA]">1º/08/2026</strong> o destaque (IBS 0,1% / CBS
                  0,9% na fase-teste) é obrigatório; verifique a atualização do emissor. O
                  recolhimento é dispensado se as obrigações acessórias forem cumpridas (art. 348 da
                  LC 214/2025).
                </div>
              )}

              {totaisNfe.totalItensIS > 0 && (
                <div className="pt-2 border-t border-[rgba(244,247,250,0.08)] flex items-center gap-2 text-xs text-[#F03E54]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Identificado(s) <strong>{totaisNfe.totalItensIS} item(ns)</strong> com NCM
                    sujeito ao <strong>Imposto Seletivo</strong> (LC 214/2025).
                  </span>
                </div>
              )}
            </div>

            {/* Lista de Notas Processadas */}
            {nfeList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[rgba(244,247,250,0.1)] text-[#93A3B5] uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Documento / Emissão</th>
                      <th className="py-2.5 px-3">Origem</th>
                      <th className="py-2.5 px-3">Emitente</th>
                      <th className="py-2.5 px-3">Destinatário</th>
                      <th className="py-2.5 px-3 text-right">Valor Total</th>
                      <th className="py-2.5 px-3 text-right">IBS / CBS</th>
                      <th className="py-2.5 px-3 text-right">Créd. PIS/Cofins</th>
                      <th className="py-2.5 px-3 text-right">ICMS</th>
                      <th className="py-2.5 px-3 text-center">Validação</th>
                      <th className="py-2.5 px-3 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA]">
                    {nfeList.map((item) => (
                      <tr key={item.id} className="hover:bg-[#16202B]/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-semibold text-[#12B886]">
                            Doc nº {item.numero_nota || 'S/N'} (Série {item.serie || '1'})
                          </div>
                          <div className="text-[10px] text-[#93A3B5]">
                            {item.data_emissao
                              ? item.data_emissao.slice(0, 10)
                              : 'Data não informada'}{' '}
                            • Mod. {(item as any).modelo_fiscal || item.modelo}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                              (item as any).origem === 'infosimples'
                                ? 'bg-[#3B82F6]/20 text-[#3B82F6]'
                                : 'bg-[#12B886]/20 text-[#12B886]'
                            }`}
                          >
                            {(item as any).origem || 'manual'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div
                            className="font-semibold truncate max-w-[150px]"
                            title={item.nome_emitente}
                          >
                            {item.nome_emitente || 'Não informado'}
                          </div>
                          <div className="text-[10px] font-mono text-[#93A3B5]">
                            {item.cnpj_emitente}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="truncate max-w-[150px]" title={item.nome_destinatario}>
                            {item.nome_destinatario || 'Consumidor'}
                          </div>
                          <div className="text-[10px] font-mono text-[#93A3B5]">
                            {item.cnpj_destinatario}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {formatCurrencyBRL(item.valor_total_nf || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {((item as any).dados_adicionais_json?.valor_ibs_total || 0) > 0 ||
                          ((item as any).dados_adicionais_json?.valor_cbs_total || 0) > 0 ? (
                            <div className="text-[#12B886] font-bold">
                              {formatCurrencyBRL(
                                ((item as any).dados_adicionais_json?.valor_ibs_total || 0) +
                                  ((item as any).dados_adicionais_json?.valor_cbs_total || 0),
                              )}
                              <span className="block text-[9px] text-[#93A3B5]">
                                IBS:{' '}
                                {formatCurrencyBRL(
                                  (item as any).dados_adicionais_json?.valor_ibs_total || 0,
                                )}{' '}
                                | CBS:{' '}
                                {formatCurrencyBRL(
                                  (item as any).dados_adicionais_json?.valor_cbs_total || 0,
                                )}
                              </span>
                            </div>
                          ) : (
                            <span
                              className="text-[10px] text-[#D9B36C] cursor-help block"
                              title="Nota sem destaque IBS/CBS — a partir de 1º/08/2026 o destaque (IBS 0,1% / CBS 0,9%) é obrigatório"
                            >
                              Sem IBS/CBS
                            </span>
                          )}
                          {((item as any).dados_adicionais_json?.itens_sujeitos_is_qtd || 0) >
                            0 && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-[#F03E54]/20 text-[#F03E54] text-[9px] font-bold">
                              IS ({(item as any).dados_adicionais_json.itens_sujeitos_is_qtd})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#12B886] font-semibold">
                          {formatCurrencyBRL((item.valor_pis || 0) + (item.valor_cofins || 0))}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#D9B36C]">
                          {formatCurrencyBRL(item.valor_icms || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {Array.isArray((item as any).flags_revisao) &&
                          (item as any).flags_revisao.length > 0 ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#D9B36C]/20 border border-[#D9B36C]/40 text-[#D9B36C] text-[10px] font-semibold cursor-help"
                              title={(item as any).flags_revisao.join(' | ')}
                            >
                              <AlertCircle className="w-3 h-3 text-[#D9B36C]" />
                              Desvio ANP
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#12B886] font-mono">Conforme</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteNfe(item.id)}
                            className="p-1 rounded text-[#93A3B5] hover:text-[#F03E54] hover:bg-[#F03E54]/10 transition-colors"
                            title="Remover nota fiscal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-[rgba(244,247,250,0.12)] rounded-xl text-xs text-[#93A3B5] bg-[#0A0E12]">
                <FileCode className="w-8 h-8 text-[#93A3B5]/40 mx-auto mb-2" />
                Nenhum documento fiscal importado ainda. Selecione arquivos XML/JSON ou use a aba de
                importação via InfoSimples.
              </div>
            )}
          </div>
        )}

        {/* 2. COMPARATIVO DA REFORMA TRIBUTÁRIA ATUALIZADO COM CRÉDITOS REAIS */}
        {currentLead && comparativoCalculado && (
          <div className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] mb-10 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#12B886]" />
                <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  DIAGNÓSTICO TRIBUTÁRIO • REFORMA EC 132/2023 (IBS/CBS)
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {totaisNfe.totalNotas > 0 && (
                  <span className="px-3 py-1 rounded-full bg-[#12B886]/10 text-[#12B886] font-bold text-xs uppercase border border-[#12B886]/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Alimentado com {totaisNfe.totalNotas} NF-e reais
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleExportarDossieCompleto}
                  disabled={isExportandoPdf}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#16202B] border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#12B886]" />
                  <span>Exportar PDF</span>
                </button>
              </div>
            </div>
            <ComparativoTributarioView
              comparativo={comparativoCalculado}
              regimeDeclarado={currentLead.regime_tributario}
              exportaUE={currentLead.exporta_ue_cbam === 'sim'}
              cbamBens={currentLead.cbam_bens}
              enquadramentoSBCE={currentLead.enquadramento_sbce}
              modoRevisao={true}
            />
          </div>
        )}

        {/* 3. PROGRESSO DO DIAGNÓSTICO (5 ETAPAS) */}
        <div className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] mb-10 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                ESTEIRA DE CERTIFICAÇÃO & DESCARBONIZAÇÃO (5 FASES)
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Acompanhe o status do seu laudo probatório e homologação de selo.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30">
              {nfeList.length > 0 ? '60% CONCLUÍDO' : '40% CONCLUÍDO'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {etapasMetodologia.map((etapa, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  etapa.concluido
                    ? 'bg-[#12B886]/10 border-[#12B886] text-[#F4F7FA]'
                    : idx === 3
                      ? 'bg-[#D9B36C]/10 border-[#D9B36C] text-[#F4F7FA]'
                      : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)] text-[#93A3B5]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading font-bold text-base text-[#12B886]">
                    {etapa.num}
                  </span>
                  {etapa.concluido ? (
                    <CheckCircle2 className="w-4 h-4 text-[#12B886]" />
                  ) : idx === 3 ? (
                    <Clock className="w-4 h-4 text-[#D9B36C] animate-pulse" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#93A3B5]/40" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold leading-tight mb-1">{etapa.label}</div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#93A3B5]">
                    {etapa.concluido ? 'Concluído' : idx === 3 ? 'Em Análise Pericial' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. GRID: SELO OBTIDO & LAUDOS EMITIDOS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          <div className="lg:col-span-5 p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-6 h-6 text-[#D9B36C]" />
                <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  SELO OFICIAL CONCEDIDO
                </h3>
              </div>

              {currentSelo ? (
                <div className="p-6 rounded-xl bg-gradient-to-b from-[#16202B] to-[#0A0E12] border border-[#12B886] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-[#93A3B5] font-semibold">
                      Chancela dMRV
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#12B886]/20 text-[#12B886] text-[10px] font-bold uppercase">
                      Ativo
                    </span>
                  </div>

                  <div>
                    <div className="font-heading font-black text-2xl text-[#12B886] tracking-wider">
                      {currentSelo.codigo_selo}
                    </div>
                    <div className="text-xs text-[#F4F7FA] font-medium mt-1">
                      {currentSelo.empresa}
                    </div>
                    <div className="text-[11px] font-mono text-[#D9B36C]">
                      CNPJ: {currentSelo.cnpj}
                    </div>
                  </div>

                  <div className="text-[11px] text-[#93A3B5] border-t border-[rgba(244,247,250,0.08)] pt-3 flex justify-between">
                    <span>Validade até:</span>
                    <span className="text-[#F4F7FA] font-semibold">
                      {new Date(currentSelo.data_validade).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-[#0A0E12] border border-dashed border-[rgba(244,247,250,0.15)] text-center text-xs text-[#93A3B5]">
                  Selo oficial em fase de emissão final após conferência das notas e balanço de
                  emissões.
                </div>
              )}
            </div>

            <div className="pt-6">
              <Link
                to="/verificador"
                className="w-full py-3 rounded-xl text-xs font-semibold border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] hover:text-[#12B886] transition-all flex items-center justify-center gap-2"
              >
                <span>Consultar no Verificador Público</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#12B886]" />
                <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  LAUDOS PERICIAIS & DOCUMENTOS EMITIDOS
                </h3>
              </div>
              <span className="text-xs font-mono text-[#93A3B5]">3 documentos</span>
            </div>

            <div className="space-y-3">
              {[
                {
                  titulo: 'Laudo Pericial Preliminar de Descarbonização',
                  tipo: 'Preparatório para o SBCE (Lei 15.042/2024)',
                  data: '15/09/2024',
                  status: 'Homologado',
                  art: 'ART-CREA/CRC 2024-9481',
                },
                {
                  titulo: 'Dossiê Verde para Spread Bancário',
                  tipo: 'Preparação para Exigências ESG de Credores (Res. BCB 4.945/2021)',
                  data: '10/09/2024',
                  status: 'Válido',
                  art: 'Diretrizes PRSAC Instituições Financeiras',
                },
                {
                  titulo: 'Passaporte Digital de Produto (DPP)',
                  tipo: 'Programa MOVER (Lei 14.902/2024)',
                  data: '02/09/2024',
                  status: 'Emitido',
                  art: 'Selo DETRAN Vinculado',
                },
              ].map((doc, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/40 transition-all flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-[#F4F7FA] mb-0.5">{doc.titulo}</h4>
                    <div className="flex items-center gap-3 text-[11px] text-[#93A3B5]">
                      <span>{doc.tipo}</span>
                      <span>•</span>
                      <span className="text-[#D9B36C]">{doc.art}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-bold text-[10px] uppercase">
                        {doc.status}
                      </span>
                      <span className="block text-[10px] text-[#93A3B5] mt-1">{doc.data}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportarDossieCompleto}
                      className="p-2 rounded-lg bg-[#16202B] text-[#93A3B5] hover:text-[#12B886] hover:bg-[#12B886]/10 transition-colors"
                      title="Baixar Laudo em PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. ATALHO AOS PLANOS & FATURAMENTO */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#111820] via-[#16202B] to-[#111820] border border-[rgba(244,247,250,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-heading font-bold text-base text-[#F4F7FA]">
              PRECISA DE GOVERNANÇA AVANÇADA E SUPORTE A SPED/NF-E EM LOTE?
            </h4>
            <p className="text-xs text-[#93A3B5] mt-0.5">
              Conheça os planos Corporativos com preparação para ERPs e suporte pericial dMRV.
            </p>
          </div>
          <Link
            to="/planos"
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] shrink-0"
          >
            Acessar Planos & Faturamento
          </Link>
        </div>
      </div>
    </div>
  )
}
