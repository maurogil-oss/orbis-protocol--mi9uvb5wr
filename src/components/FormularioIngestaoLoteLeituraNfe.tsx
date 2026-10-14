import React, { useState, useRef } from 'react'
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Eye,
  FileCheck2,
  Lock,
} from 'lucide-react'
import {
  lerNotaFiscalParaSugestao,
  construirRegistroAuditoriaLote,
  type DadosNotaFiscalSugeridos,
  type ItemNfeSugerido,
  type LoteComAuditoriaPreenchimento,
} from '@/services/leitorNotaFiscalService'

interface FormularioIngestaoLoteLeituraNfeProps {
  loteId?: string
  usuarioAtual?: {
    nome?: string
    email?: string
  }
  onLoteConfirmado?: (loteAuditado: LoteComAuditoriaPreenchimento) => void
  onCancelar?: () => void
}

const VALORES_INICIAIS_VAZIOS: DadosNotaFiscalSugeridos = {
  numero_nota: '',
  serie: '1',
  data_emissao: new Date().toISOString().slice(0, 10),
  emitente_razao_social: '',
  emitente_cnpj: '',
  destinatario_razao_social: '',
  destinatario_cnpj_cpf: '',
  descricao_material: '',
  peso_liquido_kg: 0,
  peso_bruto_kg: 0,
  valor_total: 0,
  itens: [],
}

export function FormularioIngestaoLoteLeituraNfe({
  loteId,
  usuarioAtual,
  onLoteConfirmado,
  onCancelar,
}: FormularioIngestaoLoteLeituraNfeProps) {
  // Estado do formulário editável pelo operador
  const [valoresForm, setValoresForm] = useState<DadosNotaFiscalSugeridos>(VALORES_INICIAIS_VAZIOS)

  // Sugestões recebidas da leitura automática da nota fiscal
  const [sugestoesRecebidas, setSugestoesRecebidas] = useState<DadosNotaFiscalSugeridos | null>(
    null,
  )

  // Rastreamento de quais campos foram preenchidos por sugestão automática da NF-e
  const [camposSugeridosPelaNota, setCamposSugeridosPelaNota] = useState<Set<string>>(new Set())

  // Rastreamento de quais campos o operador já revisou/confirmou
  const [camposRevisados, setCamposRevisados] = useState<Set<string>>(new Set())

  // Controle de arquivo e leitura
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [isLendoDocumento, setIsLendoDocumento] = useState(false)
  const [avisoDegradacao, setAvisoDegradacao] = useState<string | null>(null)
  const [sucessoLeituraMsg, setSucessoLeituraMsg] = useState<string | null>(null)
  const [alertasLeitura, setAlertasLeitura] = useState<string[]>([])

  // Modal / Confirmação final
  const [loteSalvoAuditado, setLoteSalvoAuditado] = useState<LoteComAuditoriaPreenchimento | null>(
    null,
  )
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manipulador de anexo de documento (PDF, imagem ou XML)
  const handleSelecionarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArquivoSelecionado(file)
    setAvisoDegradacao(null)
    setSucessoLeituraMsg(null)
    setAlertasLeitura([])
    setIsLendoDocumento(true)

    try {
      const res = await lerNotaFiscalParaSugestao({
        arquivo: file,
        nomeArquivo: file.name,
      })

      if (res.sucesso_leitura && res.dados_sugeridos) {
        const dados = res.dados_sugeridos
        setSugestoesRecebidas(dados)

        // Preenche o formulário com as SUGESTÕES sem salvar no banco
        setValoresForm((prev) => ({
          ...prev,
          numero_nota: dados.numero_nota || prev.numero_nota,
          serie: dados.serie || prev.serie,
          data_emissao: dados.data_emissao || prev.data_emissao,
          emitente_razao_social: dados.emitente_razao_social || prev.emitente_razao_social,
          emitente_cnpj: dados.emitente_cnpj || prev.emitente_cnpj,
          destinatario_razao_social:
            dados.destinatario_razao_social || prev.destinatario_razao_social,
          destinatario_cnpj_cpf: dados.destinatario_cnpj_cpf || prev.destinatario_cnpj_cpf,
          descricao_material: dados.descricao_material || prev.descricao_material,
          peso_liquido_kg: dados.peso_liquido_kg || prev.peso_liquido_kg,
          peso_bruto_kg: dados.peso_bruto_kg || prev.peso_bruto_kg,
          valor_total: dados.valor_total || prev.valor_total,
          itens: dados.itens && dados.itens.length > 0 ? dados.itens : prev.itens,
        }))

        // Marca visualmente os campos sugeridos
        const novosSugeridos = new Set<string>()
        if (dados.numero_nota) novosSugeridos.add('numero_nota')
        if (dados.serie) novosSugeridos.add('serie')
        if (dados.data_emissao) novosSugeridos.add('data_emissao')
        if (dados.emitente_razao_social) novosSugeridos.add('emitente_razao_social')
        if (dados.emitente_cnpj) novosSugeridos.add('emitente_cnpj')
        if (dados.destinatario_razao_social) novosSugeridos.add('destinatario_razao_social')
        if (dados.destinatario_cnpj_cpf) novosSugeridos.add('destinatario_cnpj_cpf')
        if (dados.descricao_material) novosSugeridos.add('descricao_material')
        if (dados.peso_liquido_kg > 0) novosSugeridos.add('peso_liquido_kg')
        if (dados.peso_bruto_kg > 0) novosSugeridos.add('peso_bruto_kg')
        if (dados.valor_total > 0) novosSugeridos.add('valor_total')
        setCamposSugeridosPelaNota(novosSugeridos)

        setSucessoLeituraMsg(
          res.mensagem_operador ||
            'Campos estruturais extraídos com sucesso. Revise as sugestões abaixo antes de confirmar.',
        )
        if (res.alertas && res.alertas.length > 0) {
          setAlertasLeitura(res.alertas)
        }
      } else {
        // Degradação graciosa
        setAvisoDegradacao(
          res.mensagem_aviso || 'Não foi possível ler o documento — preenchimento manual.',
        )
      }
    } catch {
      // Degradação graciosa silenciosa e resiliente
      setAvisoDegradacao('Não foi possível ler o documento — preenchimento manual.')
    } finally {
      setIsLendoDocumento(false)
      // Limpa input file para permitir selecionar o mesmo arquivo novamente se quiser
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Permite ao usuário alterar valores sugeridos
  const handleAlterarCampo = (campo: keyof DadosNotaFiscalSugeridos, valor: any) => {
    setValoresForm((prev) => ({ ...prev, [campo]: valor }))
    // Marca como revisado pelo operador
    setCamposRevisados((prev) => new Set(prev).add(campo))
  }

  // Ação de confirmar individualmente uma sugestão
  const handleConfirmarCampoIndividual = (campo: string) => {
    setCamposRevisados((prev) => new Set(prev).add(campo))
  }

  // Confirmar todas as sugestões de uma vez
  const handleConfirmarTodasSugestoes = () => {
    setCamposRevisados(new Set(camposSugeridosPelaNota))
  }

  // Limpar sugestões e manter manual
  const handleDescartarSugestoes = () => {
    setSugestoesRecebidas(null)
    setCamposSugeridosPelaNota(new Set())
    setCamposRevisados(new Set())
    setSucessoLeituraMsg(null)
  }

  // Confirmação final humana obrigatória para persistência
  const handleConfirmarLoteFinal = (e: React.FormEvent) => {
    e.preventDefault()
    setErroValidacao(null)

    if (!valoresForm.numero_nota?.trim()) {
      setErroValidacao('Informe o número da nota fiscal.')
      return
    }
    if (!valoresForm.emitente_razao_social?.trim() && !valoresForm.emitente_cnpj?.trim()) {
      setErroValidacao('Informe ao menos a razão social ou CNPJ do emitente.')
      return
    }
    if (!valoresForm.descricao_material?.trim()) {
      setErroValidacao('Informe a descrição do material ou produto.')
      return
    }

    // Monta o objeto de auditoria registrando que nada foi automático
    const auditado = construirRegistroAuditoriaLote({
      valoresFinais: valoresForm,
      sugestoesOriginais: sugestoesRecebidas,
      usuarioConfirmador: {
        nome: usuarioAtual?.nome || 'Operador Responsável',
        email: usuarioAtual?.email || 'operador@orbisprotocol.com',
      },
      documentoRef: arquivoSelecionado?.name || 'Documento Fiscal Anexo',
      fonteLeitura: sugestoesRecebidas ? 'triador-ingestao-cdv' : 'manual',
    })

    setLoteSalvoAuditado(auditado)
    if (onLoteConfirmado) {
      onLoteConfirmado(auditado)
    }
  }

  const renderBadgeSugestao = (campo: string) => {
    const isSugerido = camposSugeridosPelaNota.has(campo)
    const isRevisado = camposRevisados.has(campo)

    if (!isSugerido) return null

    return (
      <div className="flex items-center gap-1.5 mt-1">
        <span
          data-testid={`badge-sugestao-${campo}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
          title="Valor sugerido pela leitura da nota fiscal via Agente Nativo Triador CDV"
        >
          <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
          <span>Sugerido pela leitura da nota fiscal</span>
        </span>

        {isRevisado ? (
          <span
            data-testid={`badge-confirmado-${campo}`}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-700 dark:text-[#059669] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900"
          >
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Confirmado</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => handleConfirmarCampoIndividual(campo)}
            className="text-[10px] font-medium text-slate-500 hover:text-emerald-700 dark:hover:text-[#059669] underline transition-colors"
          >
            Confirmar campo
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      data-testid="formulario-ingestao-leitura-nfe"
      className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in"
    >
      {/* CABEÇALHO DO FLUXO DE COLETA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F8FAFC]">
                Coleta do Lote • Pré-preenchimento por Leitura de Nota Fiscal
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                dMRV
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Anexe a NF-e / DANFE em PDF ou imagem. O Triador Skip Cloud sugere os campos, você
              revisa e confirma.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#0A1628] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <Lock className="w-3 h-3 text-amber-500" />
            <span>Gravação bloqueada até confirmação humana</span>
          </span>
        </div>
      </div>

      {/* ÁREA DE ANEXO DO DOCUMENTO FISCAL */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              Anexar Nota Fiscal / DANFE (PDF ou Imagem)
            </span>
            <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
              Formatos aceitos: PDF com texto selecionável, PNG ou JPG. Tamanho máximo: 10 MB.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.xml"
              onChange={handleSelecionarArquivo}
              disabled={isLendoDocumento}
              className="hidden"
              id="input-nota-fiscal-coleta"
            />
            <label
              htmlFor="input-nota-fiscal-coleta"
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm ${
                isLendoDocumento
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 dark:bg-indigo-700 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600'
              }`}
            >
              {isLendoDocumento ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Lendo documento via Triador...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Selecionar Documento</span>
                </>
              )}
            </label>
          </div>
        </div>

        {arquivoSelecionado && (
          <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-[#0E1A2E] p-2 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 truncate">
              <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0" />
              <span className="truncate font-semibold">{arquivoSelecionado.name}</span>
              <span className="text-[10px] text-slate-400">
                ({(arquivoSelecionado.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            {sugestoesRecebidas && (
              <button
                type="button"
                onClick={handleDescartarSugestoes}
                className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline shrink-0 ml-2"
              >
                Descartar sugestões
              </button>
            )}
          </div>
        )}

        {/* FEEDBACK: SUCESSO DE LEITURA OU DEGRADAÇÃO GRACIOSA */}
        {sucessoLeituraMsg && (
          <div
            data-testid="aviso-sucesso-leitura"
            className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 text-xs text-indigo-950 dark:text-indigo-200 space-y-1"
          >
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                {sucessoLeituraMsg}
              </span>
              <button
                type="button"
                onClick={handleConfirmarTodasSugestoes}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Confirmar todas as sugestões
              </button>
            </div>
            {alertasLeitura.length > 0 && (
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {alertasLeitura.join(' | ')}
              </div>
            )}
          </div>
        )}

        {avisoDegradacao && (
          <div
            data-testid="aviso-degradacao-graciosa"
            className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">{avisoDegradacao}</span>
          </div>
        )}
      </div>

      {/* FORMULÁRIO EDITÁVEL DO LOTE */}
      <form onSubmit={handleConfirmarLoteFinal} className="space-y-5">
        {erroValidacao && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erroValidacao}</span>
          </div>
        )}

        {/* 1. DADOS DA NOTA (NÚMERO, SÉRIE, DATA) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Número da Nota Fiscal *
            </label>
            <input
              data-testid="input-numero-nota"
              type="text"
              value={valoresForm.numero_nota}
              onChange={(e) => handleAlterarCampo('numero_nota', e.target.value)}
              placeholder="Ex.: 153"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            {renderBadgeSugestao('numero_nota')}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Série
            </label>
            <input
              data-testid="input-serie"
              type="text"
              value={valoresForm.serie}
              onChange={(e) => handleAlterarCampo('serie', e.target.value)}
              placeholder="Ex.: 1"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            {renderBadgeSugestao('serie')}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Data de Emissão
            </label>
            <input
              data-testid="input-data-emissao"
              type="date"
              value={valoresForm.data_emissao}
              onChange={(e) => handleAlterarCampo('data_emissao', e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            {renderBadgeSugestao('data_emissao')}
          </div>
        </div>

        {/* 2. EMITENTE E DESTINATÁRIO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50/50 dark:bg-[#0A1628]/50 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              Dados do Emitente
            </span>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Razão Social / Nome Fantasia
              </label>
              <input
                data-testid="input-emitente-nome"
                type="text"
                value={valoresForm.emitente_razao_social}
                onChange={(e) => handleAlterarCampo('emitente_razao_social', e.target.value)}
                placeholder="Ex.: Pan Urania S/A Indústria e Comércio"
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {renderBadgeSugestao('emitente_razao_social')}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                CNPJ do Emitente
              </label>
              <input
                data-testid="input-emitente-cnpj"
                type="text"
                value={valoresForm.emitente_cnpj}
                onChange={(e) => handleAlterarCampo('emitente_cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              {renderBadgeSugestao('emitente_cnpj')}
            </div>
          </div>

          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50/50 dark:bg-[#0A1628]/50 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              Dados do Destinatário
            </span>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Razão Social do Destinatário
              </label>
              <input
                data-testid="input-destinatario-nome"
                type="text"
                value={valoresForm.destinatario_razao_social}
                onChange={(e) => handleAlterarCampo('destinatario_razao_social', e.target.value)}
                placeholder="Ex.: Recicladora Centro de Desmonte Sul"
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {renderBadgeSugestao('destinatario_razao_social')}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                CNPJ / CPF do Destinatário
              </label>
              <input
                data-testid="input-destinatario-cnpj"
                type="text"
                value={valoresForm.destinatario_cnpj_cpf}
                onChange={(e) => handleAlterarCampo('destinatario_cnpj_cpf', e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              {renderBadgeSugestao('destinatario_cnpj_cpf')}
            </div>
          </div>
        </div>

        {/* 3. DESCRIÇÃO DO MATERIAL E PESOS/VALORES */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Descrição do Material / Produto no Lote *
          </label>
          <textarea
            data-testid="input-descricao-material"
            rows={2}
            value={valoresForm.descricao_material}
            onChange={(e) => handleAlterarCampo('descricao_material', e.target.value)}
            placeholder="Ex.: Peças automotivas usadas desmanchadas, capô de aço, chicote elétrico de cobre e parachoque."
            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {renderBadgeSugestao('descricao_material')}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Peso Líquido (kg)
            </label>
            <input
              data-testid="input-peso-liquido"
              type="number"
              step="0.01"
              value={valoresForm.peso_liquido_kg || ''}
              onChange={(e) =>
                handleAlterarCampo('peso_liquido_kg', parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            {renderBadgeSugestao('peso_liquido_kg')}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Peso Bruto (kg)
            </label>
            <input
              data-testid="input-peso-bruto"
              type="number"
              step="0.01"
              value={valoresForm.peso_bruto_kg || ''}
              onChange={(e) => handleAlterarCampo('peso_bruto_kg', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            {renderBadgeSugestao('peso_bruto_kg')}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Valor Total da Nota (R$)
            </label>
            <input
              data-testid="input-valor-total"
              type="number"
              step="0.01"
              value={valoresForm.valor_total || ''}
              onChange={(e) => handleAlterarCampo('valor_total', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            {renderBadgeSugestao('valor_total')}
          </div>
        </div>

        {/* 4. ITENS SUGERIDOS (SE HOUVER) */}
        {valoresForm.itens && valoresForm.itens.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>Itens Identificados na Nota Fiscal ({valoresForm.itens.length})</span>
            </span>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 dark:bg-[#0A1628] text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Descrição</th>
                    <th className="py-2 px-3 font-semibold">NCM</th>
                    <th className="py-2 px-3 font-semibold text-right">Peso (kg)</th>
                    <th className="py-2 px-3 font-semibold text-right">Valor (R$)</th>
                    <th className="py-2 px-3 font-semibold">Cat. Sugerida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {valoresForm.itens.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#111827]">
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-medium">
                        {it.descricao}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500">{it.ncm || '—'}</td>
                      <td className="py-2 px-3 font-mono text-right text-slate-700 dark:text-slate-300">
                        {it.peso_kg ? it.peso_kg.toFixed(2) : '—'}
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-slate-700 dark:text-slate-300">
                        {it.valor_total
                          ? it.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                          : '—'}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                          {it.categoria_sugerida || 'outros'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AVISO DE AUDITORIA & REGRA INEGOCIÁVEL */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Registro de Auditoria Permanente:</strong> Ao confirmar, o sistema registrará
            que os valores foram validados por{' '}
            <strong className="text-slate-900 dark:text-white">
              {usuarioAtual?.nome || 'Operador da Sessão'}
            </strong>{' '}
            ({usuarioAtual?.email || 'sessão ativa'}). Os cálculos de balanço e insetting seguem
            estritamente o motor determinístico DM-ORB-001 v1.1.
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div>
            {onCancelar && (
              <button
                type="button"
                onClick={onCancelar}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              data-testid="btn-confirmar-lote"
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 dark:bg-[#059669] text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar e Salvar no Lote</span>
            </button>
          </div>
        </div>
      </form>

      {/* FEEDBACK DE LOTE CONFIRMADO COM AUDITORIA */}
      {loteSalvoAuditado && (
        <div
          data-testid="painel-auditoria-confirmada"
          className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-900/60 text-xs space-y-2 animate-fade-in"
        >
          <div className="flex items-center gap-2 text-emerald-800 dark:text-[#059669] font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Lote Confirmado com Sucesso com Metadados de Auditoria!</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300 font-mono">
            <div>
              • Confirmado por: <strong>{loteSalvoAuditado.auditoria.confirmado_por.nome}</strong> (
              {loteSalvoAuditado.auditoria.confirmado_por.email})
            </div>
            <div>
              • Data/Hora:{' '}
              {new Date(loteSalvoAuditado.auditoria.confirmado_em).toLocaleString('pt-BR')}
            </div>
            <div>• Documento: {loteSalvoAuditado.auditoria.documento_lido_ref || 'Manual'}</div>
            <div>• Fonte de Extração: {loteSalvoAuditado.auditoria.fonte_leitura}</div>
          </div>
          <p className="text-[10px] text-slate-500">
            Os dados foram consolidados no fluxo de coleta do lote sem promessa de crédito de
            carbono, em conformidade com as diretrizes dMRV do Orbis Protocol.
          </p>
        </div>
      )}
    </div>
  )
}

export default FormularioIngestaoLoteLeituraNfe
