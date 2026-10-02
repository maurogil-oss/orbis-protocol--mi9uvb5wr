import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
  Check,
  Cpu,
  TrendingUp,
  Scale,
  Info,
} from 'lucide-react'
import {
  AvaliacaoAdicionalidadeData,
  CdvLoteRecord,
  carregarAvaliacaoAdicionalidade,
  salvarAvaliacaoAdicionalidade,
} from '@/services/cdvService'

export interface SecaoAvaliacaoAdicionalidadeProps {
  /**
   * Identificador do lote CDV
   */
  loteId: string
  /**
   * Objeto do lote (opcional para contexto e fallback)
   */
  lote?: CdvLoteRecord | null
  /**
   * Se a chave global MOVER ampliado está habilitada.
   * A seção de adicionalidade sempre persiste suas respostas mesmo com a chave desligada,
   * mas na visualização pública pode condicionar a exibição ao contexto do dossiê ou prop explicita.
   */
  moverHabilitado?: boolean
  /**
   * Forçar exibição mesmo que moverHabilitado seja falso (ex.: no dossiê técnico restrito)
   */
  forceExibir?: boolean
  /**
   * Modo somente leitura (ex.: exibição pública externa sem permissão de edição)
   */
  readOnly?: boolean
  /**
   * Callback opcional chamado após salvamento com sucesso
   */
  onSalvo?: (dados: AvaliacaoAdicionalidadeData) => void
  /**
   * Classe customizada opcional para o wrapper
   */
  className?: string
}

export const VALOR_PADRAO_ADICIONALIDADE: AvaliacaoAdicionalidadeData = {
  adicionalidade_investimento: true,
  barreira_tecnologica: true,
  nao_obrigatoriedade_legal: true,
  justificativa_pericial:
    'A atividade de desmonte técnico com descaracterização rastreada, descontaminação integral de fluidos e inventário digital berço-ao-portão demanda custos adicionais operacionais de mão de obra especializada e infraestrutura de rastreabilidade dMRV não remunerados pela venda convencional de sucata mista ferrosa. Há clara barreira tecnológica superada pela adoção de etiquetagem criptográfica de peças verdes e rastreamento de balanço de massa curbside. Adicionalmente, inexiste obrigatoriedade legal compulsória no ordenamento jurídico nacional para a segregação de 77 subsistemas catalogados e quantificação de emissões evitadas para além da baixa cadastral pura no sistema DETRAN.',
  data_avaliacao: new Date().toISOString(),
  avaliador_nome: 'Autoavaliação pericial pré-VVB — pendente de validação por terceira parte',
  status_parecer: 'conforme_declarado',
}

export const SecaoAvaliacaoAdicionalidade: React.FC<SecaoAvaliacaoAdicionalidadeProps> = ({
  loteId,
  lote,
  moverHabilitado = true,
  forceExibir = false,
  readOnly = false,
  onSalvo,
  className = '',
}) => {
  const [dados, setDados] = useState<AvaliacaoAdicionalidadeData>({
    adicionalidade_investimento: false,
    barreira_tecnologica: false,
    nao_obrigatoriedade_legal: false,
    justificativa_pericial: '',
    data_avaliacao: undefined,
    avaliador_nome: 'VVB independente acreditado',
  })
  const [carregando, setCarregando] = useState<boolean>(true)
  const [salvando, setSalvando] = useState<boolean>(false)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  // Decisão de exibição: se forceExibir for true (ex.: DossieMoverPage ou CaseCDVerde),
  // ou se moverHabilitado estiver ativo, ou se já houver avaliação registrada para o lote
  const [temDadosRegistrados, setTemDadosRegistrados] = useState<boolean>(false)

  useEffect(() => {
    let montado = true

    async function carregar() {
      if (!loteId && !lote?.id) {
        setCarregando(false)
        return
      }

      setCarregando(true)
      try {
        const id = loteId || lote?.id || ''
        const adic = await carregarAvaliacaoAdicionalidade(id, lote)

        if (!montado) return

        if (adic) {
          setDados(adic)
          setTemDadosRegistrados(true)
        } else if (lote?.is_demo || loteId === 'c1jz14hgmf7n13i' || loteId === '12401050711') {
          // Preenchimento demonstrativo padrão para lotes de teste
          setDados(VALOR_PADRAO_ADICIONALIDADE)
          setTemDadosRegistrados(true)
        } else {
          // Inicializa vazio com perito independente como padrão
          setDados({
            adicionalidade_investimento: false,
            barreira_tecnologica: false,
            nao_obrigatoriedade_legal: false,
            justificativa_pericial: '',
            avaliador_nome: 'VVB independente acreditado',
          })
          setTemDadosRegistrados(false)
        }
      } catch (err: any) {
        console.warn('Erro ao carregar avaliação de adicionalidade:', err)
      } finally {
        if (montado) setCarregando(false)
      }
    }

    carregar()

    return () => {
      montado = false
    }
  }, [loteId, lote])

  // Se a chave estiver desligada e não for forçada e não tiver dados, oculta
  // Observar que as respostas continuam salvas no backend mesmo se ocultas
  const deveExibir = forceExibir || moverHabilitado || temDadosRegistrados

  if (!deveExibir && !carregando) {
    return null
  }

  const handleCheckboxChange = (
    campo: 'adicionalidade_investimento' | 'barreira_tecnologica' | 'nao_obrigatoriedade_legal',
  ) => {
    if (readOnly) return
    setDados((prev) => ({
      ...prev,
      [campo]: !prev[campo],
    }))
  }

  const handleSalvar = async () => {
    if (readOnly) return
    setSalvando(true)
    setErro(null)
    setMensagemSucesso(null)

    try {
      const id = loteId || lote?.id || ''
      if (!id) throw new Error('Identificador do lote não localizado.')

      const payload: AvaliacaoAdicionalidadeData = {
        ...dados,
        data_avaliacao: new Date().toISOString(),
        avaliador_nome: dados.avaliador_nome || 'VVB independente acreditado',
      }

      await salvarAvaliacaoAdicionalidade(id, payload, lote)

      setMensagemSucesso('Avaliação de adicionalidade pericial gravada com sucesso.')
      setTemDadosRegistrados(true)
      if (onSalvo) onSalvo(payload)

      setTimeout(() => setMensagemSucesso(null), 4000)
    } catch (err: any) {
      setErro(err.message || 'Falha ao registrar parecer de adicionalidade.')
    } finally {
      setSalvando(false)
    }
  }

  const totalCriteriosAtendidos = [
    dados.adicionalidade_investimento,
    dados.barreira_tecnologica,
    dados.nao_obrigatoriedade_legal,
  ].filter(Boolean).length

  const conformidadePlena = totalCriteriosAtendidos === 3

  return (
    <section
      data-testid="secao-avaliacao-adicionalidade"
      className={`p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[#12B886]/40 shadow-xl space-y-6 print:bg-slate-50 print:border-slate-300 print-card ${className}`}
    >
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[rgba(244,247,250,0.08)] pb-5 print:border-slate-300">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-[11px] font-bold uppercase tracking-wider print:border-emerald-600 print:bg-emerald-50 print:text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              CAMADA DECLARATÓRIA ANEXA • DOSSIÊ MOVER (GS 448)
            </span>
            <span className="text-[10px] font-mono text-[#D9B36C] bg-[#D9B36C]/10 px-2.5 py-0.5 rounded border border-[#D9B36C]/30 print:text-amber-800 print:bg-amber-50">
              Fora do hash canônico CONTRAN 611
            </span>
          </div>
          <h3 className="font-heading font-black text-xl sm:text-2xl text-[#F4F7FA] print:text-slate-900 pt-1">
            AVALIAÇÃO DE ADICIONALIDADE PERICIAL
          </h3>
          <p className="text-xs text-[#93A3B5] print:text-slate-600 max-w-3xl leading-relaxed">
            Parecer técnico pericial para comprovação de adicionalidade climática e econômica nos
            termos da metodologia GS 448 e do Programa MOVER (Lei 14.902/2024). Integrado ao dossiê
            como declaração anexa, sem alteração no hash SHA-256 do selo das peças CONTRAN 611.
          </p>
        </div>

        {/* Badge de Status Geral da Avaliação */}
        <div className="shrink-0 flex sm:flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
              conformidadePlena
                ? 'bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/40 print:bg-emerald-100 print:text-emerald-800'
                : 'bg-[#D9B36C]/15 text-[#D9B36C] border border-[#D9B36C]/40 print:bg-amber-100 print:text-amber-800'
            }`}
          >
            {conformidadePlena ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Autoavaliação pericial pré-VVB (3/3)</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>Autoavaliação pericial em análise ({totalCriteriosAtendidos}/3)</span>
              </>
            )}
          </span>
          <span className="text-[10px] font-mono text-[#93A3B5] print:text-slate-500">
            Status:{' '}
            {dados.avaliador_nome ||
              'Autoavaliação pericial pré-VVB — pendente de validação por terceira parte'}
          </span>
        </div>
      </div>

      {/* Caixa de Aviso Metodológico */}
      <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] print:bg-white print:border-slate-200 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5 print:text-emerald-700" />
        <div className="text-[#93A3B5] print:text-slate-600 leading-relaxed">
          <strong className="text-[#F4F7FA] print:text-slate-800">
            Salvaguarda de Integridade Criptográfica:
          </strong>{' '}
          A presente avaliação pericial fica consignada em camada declaratória anexa ao lote. A
          gravação ou atualização dos critérios{' '}
          <strong className="text-[#12B886]">não altera o hash SHA-256 canônico do lote</strong>, o
          qual permanece estritamente vinculado à rastreabilidade física das peças CONTRAN 611 e aos
          metadados oficiais da baixa veicular.
        </div>
      </div>

      {/* Checklist Pericial Obrigatório (3 Critérios) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold tracking-wider text-[#F4F7FA] print:text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#12B886]" />
            Critérios Periciais de Adicionalidade (Metodologia GS 448)
          </span>
          <span className="text-[11px] font-mono text-[#93A3B5]">
            Obrigatório para conformidade pericial
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {/* (a) Adicionalidade de investimento */}
          <label
            data-testid="checklist-adicionalidade-investimento"
            className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
              dados.adicionalidade_investimento
                ? 'bg-[#16202B]/90 border-[#12B886]/50 print:bg-emerald-50 print:border-emerald-500'
                : 'bg-[#0A0E12] border-[rgba(244,247,250,0.08)] hover:border-[rgba(244,247,250,0.2)] print:bg-white print:border-slate-200'
            } ${readOnly ? 'cursor-default' : ''}`}
          >
            <div className="pt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={!!dados.adicionalidade_investimento}
                onChange={() => handleCheckboxChange('adicionalidade_investimento')}
                disabled={readOnly}
                className="w-4 h-4 rounded border-slate-700 text-[#12B886] focus:ring-[#12B886] accent-[#12B886] cursor-pointer disabled:cursor-default"
              />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F4F7FA] print:text-slate-900">
                  (a) Adicionalidade de investimento
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-[#111820] text-[#12B886] border border-[#12B886]/30">
                  Critério Financeiro / OPEX
                </span>
              </div>
              <p className="text-[#93A3B5] print:text-slate-600 leading-relaxed">
                Demonstra que a atividade de desmonte técnico, descontaminação e triagem sistemática
                envolve custos de capital (CAPEX) e despesas operacionais (OPEX) adicionais que não
                seriam cobertos nem economicamente viáveis sem a geração e valorização de ativos
                ambientais e reposição de peças verdes em relação à mera trituração para sucata
                ferrosa.
              </p>
            </div>
          </label>

          {/* (b) Barreira tecnológica */}
          <label
            data-testid="checklist-barreira-tecnologica"
            className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
              dados.barreira_tecnologica
                ? 'bg-[#16202B]/90 border-[#12B886]/50 print:bg-emerald-50 print:border-emerald-500'
                : 'bg-[#0A0E12] border-[rgba(244,247,250,0.08)] hover:border-[rgba(244,247,250,0.2)] print:bg-white print:border-slate-200'
            } ${readOnly ? 'cursor-default' : ''}`}
          >
            <div className="pt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={!!dados.barreira_tecnologica}
                onChange={() => handleCheckboxChange('barreira_tecnologica')}
                disabled={readOnly}
                className="w-4 h-4 rounded border-slate-700 text-[#12B886] focus:ring-[#12B886] accent-[#12B886] cursor-pointer disabled:cursor-default"
              />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F4F7FA] print:text-slate-900">
                  (b) Barreira tecnológica
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-[#111820] text-[#3B82F6] border border-[#3B82F6]/30">
                  Rastreabilidade dMRV
                </span>
              </div>
              <p className="text-[#93A3B5] print:text-slate-600 leading-relaxed">
                Atesta a superação de barreiras de infraestrutura digital mediante implementação de
                etiquetagem com QR Code inviolável individual por componente, sistema de custódia
                criptográfica dMRV berço-ao-portão e aferição de balanço de massa veicular para
                mitigação de riscos de fraude e desvio de rota.
              </p>
            </div>
          </label>

          {/* (c) Não-obrigatoriedade legal */}
          <label
            data-testid="checklist-nao-obrigatoriedade-legal"
            className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
              dados.nao_obrigatoriedade_legal
                ? 'bg-[#16202B]/90 border-[#12B886]/50 print:bg-emerald-50 print:border-emerald-500'
                : 'bg-[#0A0E12] border-[rgba(244,247,250,0.08)] hover:border-[rgba(244,247,250,0.2)] print:bg-white print:border-slate-200'
            } ${readOnly ? 'cursor-default' : ''}`}
          >
            <div className="pt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={!!dados.nao_obrigatoriedade_legal}
                onChange={() => handleCheckboxChange('nao_obrigatoriedade_legal')}
                disabled={readOnly}
                className="w-4 h-4 rounded border-slate-700 text-[#12B886] focus:ring-[#12B886] accent-[#12B886] cursor-pointer disabled:cursor-default"
              />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F4F7FA] print:text-slate-900">
                  (c) Não-obrigatoriedade legal
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-[#111820] text-[#D9B36C] border border-[#D9B36C]/30">
                  Além do Mandatório
                </span>
              </div>
              <p className="text-[#93A3B5] print:text-slate-600 leading-relaxed">
                Certifica que inexiste mandamento legal ou regulatório nacional (Lei 12.977/2014,
                Resoluções CONTRAN ou PNRS) que obrigue o CDV a catalogar, desmembrar e emitir
                passaportes digitais com inventário de emissões evitadas para 77 subsistemas de
                peças, indo além das obrigações cadastrais estritas de baixa veicular.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* (d) Campo de Justificativa Pericial (Textarea) */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label
            htmlFor="justificativa-pericial-textarea"
            className="text-xs uppercase font-bold tracking-wider text-[#F4F7FA] print:text-slate-900 flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-[#D9B36C]" />
            (d) Campo de Justificativa Pericial (Laudo Descritivo)
          </label>
          <span className="text-[11px] font-mono text-[#93A3B5]">
            Tom pericial e fundamentação técnica
          </span>
        </div>

        <textarea
          id="justificativa-pericial-textarea"
          data-testid="textarea-justificativa-pericial"
          value={dados.justificativa_pericial}
          onChange={(e) =>
            !readOnly && setDados((prev) => ({ ...prev, justificativa_pericial: e.target.value }))
          }
          disabled={readOnly}
          rows={5}
          placeholder="Insira a fundamentação técnica do perito avaliador com a demonstração circunstanciada da adicionalidade econômica, tecnológica e regulatória do lote veicular desmantelado..."
          className="w-full rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] p-3.5 text-xs text-[#F4F7FA] placeholder:text-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886] font-sans leading-relaxed disabled:opacity-80 print:bg-white print:border-slate-300 print:text-slate-900"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-[#93A3B5] print:text-slate-500 pt-1">
          <span>
            {dados.justificativa_pericial
              ? `${dados.justificativa_pericial.length} caracteres`
              : 'Pendente de preenchimento'}
          </span>
          {dados.data_avaliacao && (
            <span className="font-mono">
              Registrado em:{' '}
              {new Date(dados.data_avaliacao).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Mensagens de Sucesso ou Erro */}
      {mensagemSucesso && (
        <div className="p-3 rounded-xl bg-[#12B886]/10 border border-[#12B886]/40 text-xs text-[#12B886] flex items-center gap-2 font-semibold animate-fade-in no-print">
          <Check className="w-4 h-4 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {erro && (
        <div className="p-3 rounded-xl bg-[#F03E54]/10 border border-[#F03E54]/40 text-xs text-[#F03E54] flex items-center gap-2 font-semibold animate-fade-in no-print">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Ações de Persistência (apenas no modo editável e no browser) */}
      {!readOnly && (
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[rgba(244,247,250,0.06)] no-print">
          <div className="flex items-center gap-2 text-xs text-[#93A3B5]">
            <Scale className="w-4 h-4 text-[#12B886]" />
            <span>
              Persistido junto ao lote no backend (salvo mesmo com a chave global desligada).
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSalvar}
              disabled={salvando}
              data-testid="botao-salvar-adicionalidade"
              className="px-4 py-2.5 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs uppercase tracking-wider hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center gap-2 disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 ${salvando ? 'animate-spin' : ''}`} />
              <span>{salvando ? 'Gravando Parecer...' : 'Salvar Avaliação'}</span>
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default SecaoAvaliacaoAdicionalidade
