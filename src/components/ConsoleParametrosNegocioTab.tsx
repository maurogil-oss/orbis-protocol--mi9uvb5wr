import React, { useState, useEffect } from 'react'
import {
  SlidersHorizontal,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  History,
  DollarSign,
  Percent,
  Layers,
  Lock,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  BusinessSettingsRecord,
  AlteracaoCampoHistorico,
  obterBusinessSettings,
  salvarBusinessSettings,
  obterHistoricoUltimasAlteracoes,
  validarBusinessSettings,
} from '@/services/businessSettingsService'

interface ConsoleParametrosNegocioTabProps {
  onParametrosAtualizados?: () => void
}

export const ConsoleParametrosNegocioTab: React.FC<ConsoleParametrosNegocioTabProps> = ({
  onParametrosAtualizados,
}) => {
  const { user, isMaster } = useAuth()

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [config, setConfig] = useState<BusinessSettingsRecord | null>(null)
  const [historico, setHistorico] = useState<Record<string, AlteracaoCampoHistorico>>({})

  // Form states
  const [limiteFourEyes, setLimiteFourEyes] = useState<number>(5000)
  const [comissaoAcp, setComissaoAcp] = useState<number>(10)
  const [comissaoParceiro, setComissaoParceiro] = useState<number>(10)
  const [precoDiagnostico, setPrecoDiagnostico] = useState<number>(490)
  const [precoLaudoPericial, setPrecoLaudoPericial] = useState<number>(2850)
  const [precoAssinaturaBureau, setPrecoAssinaturaBureau] = useState<number>(7800)

  // Justificativa da alteração para audit_log
  const [justificativa, setJustificativa] = useState<string>('')

  // Feedback
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)

  const carregarDados = async () => {
    setLoading(true)
    setMensagemErro(null)
    try {
      const [settings, hist] = await Promise.all([
        obterBusinessSettings(),
        obterHistoricoUltimasAlteracoes(),
      ])

      setConfig(settings)
      setHistorico(hist)

      setLimiteFourEyes(settings.limite_four_eyes)
      setComissaoAcp(settings.comissao_acp_percent)
      setComissaoParceiro(settings.comissao_parceiro_percent)
      setPrecoDiagnostico(settings.precos_planos?.diagnostico ?? 490)
      setPrecoLaudoPericial(settings.precos_planos?.laudo_pericial ?? 2850)
      setPrecoAssinaturaBureau(settings.precos_planos?.assinatura_bureau ?? 7800)
    } catch (err: any) {
      console.error('Erro ao carregar parâmetros do negócio:', err)
      setMensagemErro('Falha ao carregar parâmetros do banco de dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isMaster) {
      carregarDados()
    }
  }, [isMaster])

  // Bloqueio institucional se não for master (Requisito 1)
  if (!isMaster) {
    return (
      <div className="p-8 sm:p-12 rounded-2xl bg-[#111820] border-2 border-[#EF4444]/40 text-center space-y-4 shadow-2xl animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center mx-auto text-[#EF4444]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-[10px] font-mono uppercase font-bold tracking-wider inline-block">
            ACESSO INSTITUCIONAL RESTRITO • PRIVATIVO GESTOR MASTER
          </span>
          <h3 className="font-heading font-black text-xl text-[#F4F7FA]">
            Acesso Restrito ao Gestor Master
          </h3>
          <p className="text-xs sm:text-sm text-[#93A3B5] max-w-lg mx-auto leading-relaxed">
            Esta tela de governança dos <strong>Parâmetros Comerciais & Regulatórios</strong> é de
            acesso exclusivo do usuário com o papel <strong>master</strong> da plataforma.
            Administradores comuns operam os módulos do Console mas não possuem autorização para
            alterar parâmetros estruturais do negócio.
          </p>
        </div>
        <div className="pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] text-[11px] font-mono text-[#93A3B5]">
            <Lock className="w-3.5 h-3.5 text-[#EF4444]" />
            <span>Papel autenticado: {user?.role || 'desconhecido'}</span>
          </div>
        </div>
      </div>
    )
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensagemSucesso(null)
    setMensagemErro(null)

    const payload = {
      limite_four_eyes: Number(limiteFourEyes),
      comissao_acp_percent: Number(comissaoAcp),
      comissao_parceiro_percent: Number(comissaoParceiro),
      precos_planos: {
        diagnostico: Number(precoDiagnostico),
        laudo_pericial: Number(precoLaudoPericial),
        assinatura_bureau: Number(precoAssinaturaBureau),
      },
    }

    const validacao = validarBusinessSettings(payload)
    if (!validacao.valido) {
      setMensagemErro(validacao.erros.join(' • '))
      return
    }

    setSalvando(true)
    try {
      const res = await salvarBusinessSettings(payload, justificativa.trim() || undefined)
      if (res.alteracoes.length === 0) {
        setMensagemSucesso('Nenhum valor foi modificado. Os parâmetros permanecem inalterados.')
      } else {
        setMensagemSucesso(
          `Parâmetros comerciais atualizados com sucesso! ${res.alteracoes.length} evento(s) de auditoria registrado(s) no audit_log.`,
        )
      }

      setJustificativa('')
      await carregarDados()
      if (onParametrosAtualizados) {
        onParametrosAtualizados()
      }
    } catch (err: any) {
      console.error('Erro ao salvar parâmetros:', err)
      setMensagemErro(err.message || 'Falha ao salvar parâmetros do negócio.')
    } finally {
      setSalvando(false)
    }
  }

  const renderBadgeUltimaAlteracao = (campoKey: string) => {
    const item = historico[campoKey]
    if (!item || !item.quando) {
      return (
        <span className="text-[10px] text-[#93A3B5]/60 italic font-mono">
          Sem alterações registradas no audit_log
        </span>
      )
    }

    const dataFormatada = new Date(item.quando).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    return (
      <div className="flex items-center gap-1.5 text-[10px] text-[#93A3B5] font-mono mt-1">
        <History className="w-3 h-3 text-[#D9B36C]" />
        <span>
          Última alteração por <strong className="text-[#12B886]">{item.atorEmail}</strong> em{' '}
          {dataFormatada}
          {item.valorAnterior !== undefined && (
            <span className="text-[#93A3B5]/80">
              {' '}
              (de {String(item.valorAnterior)} para {String(item.valorNovo)})
            </span>
          )}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Institucional da Aba */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#111820] via-[#16202B] to-[#111820] border border-[#D9B36C]/40 shadow-xl space-y-2">
        <div className="flex items-center gap-2 flex-wrap justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D9B36C]/20 border border-[#D9B36C]/50 text-[#D9B36C] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3 text-[#D9B36C]" />
              FASE 1 • PARÂMETROS COMERCIAIS & OPERACIONAIS
            </span>
            <span className="text-[11px] text-[#93A3B5] font-mono">
              Operador Master: <strong className="text-[#F4F7FA]">{user?.email}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={carregarDados}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#93A3B5] hover:text-[#F4F7FA] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#12B886]' : ''}`} />
            <span>Recarregar</span>
          </button>
        </div>

        <h2 className="font-heading font-black text-xl sm:text-2xl text-[#F4F7FA]">
          15. Parâmetros do Negócio & Regras de Governança
        </h2>
        <p className="text-xs text-[#93A3B5] max-w-4xl leading-relaxed">
          Área privativa do Gestor Master para configuração dinâmica das variáveis comerciais da
          operação Orbis Protocol: alçada de Quatro-Olhos para liquidações manuais, percentuais de
          comissão de parceiros/ACP e preços oficiais dos produtos vigentes. Cada alteração é
          registrada de forma imutável na trilha <code>audit_log</code>.
        </p>
      </div>

      {/* Alertas de Feedback */}
      {mensagemSucesso && (
        <div className="p-4 rounded-xl bg-[#12B886]/10 border border-[#12B886] text-xs text-[#12B886] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensagemSucesso(null)}
            className="text-[#12B886] underline text-xs font-bold"
          >
            fechar
          </button>
        </div>
      )}

      {mensagemErro && (
        <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444] text-xs text-[#EF4444] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{mensagemErro}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensagemErro(null)}
            className="text-[#EF4444] underline text-xs font-bold"
          >
            fechar
          </button>
        </div>
      )}

      <form onSubmit={handleSalvar} className="space-y-6">
        {/* BLOCO 1: REGRA DE QUATRO-OLHOS (LIQUIDAÇÃO MANUAL) */}
        <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                1. Limite da Regra de Quatro-Olhos (Liquidação Manual de Cobranças)
              </h3>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Define o piso de valor (em R$) a partir do qual uma liquidação manual de cobrança
                exige dupla confirmação e justificativa detalhada no Console. Qualquer cobrança com
                valor estritamente superior a este limiar ativa a trava de governança.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#F4F7FA] mb-1.5">
                Limite Four-Eyes (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-[#93A3B5] font-mono">
                  R$
                </span>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  value={limiteFourEyes}
                  onChange={(e) => setLimiteFourEyes(Number(e.target.value))}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-sm font-mono text-[#F4F7FA] focus:outline-none focus:border-[#12B886]"
                />
              </div>
              {renderBadgeUltimaAlteracao('limite_four_eyes')}
            </div>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-xs text-[#93A3B5] space-y-1">
              <span className="text-[#3B82F6] font-bold block uppercase tracking-wider text-[10px]">
                Impacto Operacional Imediato
              </span>
              <p>
                Ao salvar, cobranças com valor &gt; R${' '}
                {Number(limiteFourEyes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{' '}
                exigirão o segundo checkbox de aprovação no modal de liquidação e validação no hook
                do backend <code>cobranca_simulacao</code>.
              </p>
            </div>
          </div>
        </div>

        {/* BLOCO 2: PERCENTUAIS DE COMISSÃO (PARCEIROS & ACP) */}
        <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#D9B36C]/10 border border-[#D9B36C]/30 text-[#D9B36C] shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                2. Comissões Comerciais (Parceiros Oficiais & ACP Paraná)
              </h3>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Percentuais padrão aplicados sobre a receita de cobranças liquidadas para parceiros
                credenciados e canal institucional ACP. Variação permitida de 0% a 100%.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#F4F7FA] mb-1.5">
                Comissão Canal ACP Paraná (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  step={0.1}
                  value={comissaoAcp}
                  onChange={(e) => setComissaoAcp(Number(e.target.value))}
                  className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-sm font-mono text-[#F4F7FA] focus:outline-none focus:border-[#12B886]"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-[#93A3B5] font-mono">
                  %
                </span>
              </div>
              {renderBadgeUltimaAlteracao('comissao_acp_percent')}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F4F7FA] mb-1.5">
                Comissão Padrão de Parceiros Afiliados (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  step={0.1}
                  value={comissaoParceiro}
                  onChange={(e) => setComissaoParceiro(Number(e.target.value))}
                  className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-sm font-mono text-[#F4F7FA] focus:outline-none focus:border-[#12B886]"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-[#93A3B5] font-mono">
                  %
                </span>
              </div>
              {renderBadgeUltimaAlteracao('comissao_parceiro_percent')}
            </div>
          </div>
        </div>

        {/* BLOCO 3: PREÇOS DOS 3 PRODUTOS EXISTENTES */}
        <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#12B886]/10 border border-[#12B886]/30 text-[#12B886] shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                3. Preços Oficiais dos Planos & Produtos da Plataforma
              </h3>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Preços de referência utilizados na geração de cobranças PIX, contratos e catálogo de
                serviços. Ao salvar, os registros correspondentes em <code>servicos_catalogo</code>{' '}
                são sincronizados automaticamente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Produto 1: Diagnóstico Orbis */}
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-2">
              <div>
                <span className="text-[10px] text-[#93A3B5] uppercase font-mono block">
                  Produto 1 (Avulso)
                </span>
                <strong className="text-sm text-[#F4F7FA] block">Diagnóstico Orbis</strong>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#93A3B5] mb-1">
                  Preço Vigente (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-[#93A3B5] font-mono">R$</span>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={precoDiagnostico}
                    onChange={(e) => setPrecoDiagnostico(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.15)] text-sm font-mono text-[#F4F7FA] focus:outline-none focus:border-[#12B886]"
                  />
                </div>
              </div>
              {renderBadgeUltimaAlteracao('precos_planos.diagnostico')}
            </div>

            {/* Produto 2: Laudo Pericial */}
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-2">
              <div>
                <span className="text-[10px] text-[#93A3B5] uppercase font-mono block">
                  Produto 2 (Avulso com ART)
                </span>
                <strong className="text-sm text-[#F4F7FA] block">Laudo Pericial (MOVER)</strong>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#93A3B5] mb-1">
                  Preço Vigente (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-[#93A3B5] font-mono">R$</span>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={precoLaudoPericial}
                    onChange={(e) => setPrecoLaudoPericial(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.15)] text-sm font-mono text-[#F4F7FA] focus:outline-none focus:border-[#12B886]"
                  />
                </div>
              </div>
              {renderBadgeUltimaAlteracao('precos_planos.laudo_pericial')}
            </div>

            {/* Produto 3: Bureau ACP */}
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-2">
              <div>
                <span className="text-[10px] text-[#93A3B5] uppercase font-mono block">
                  Produto 3 (Assinatura Recorrente)
                </span>
                <strong className="text-sm text-[#F4F7FA] block">Bureau ACP (Corporativo)</strong>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#93A3B5] mb-1">
                  Preço Mensal (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-[#93A3B5] font-mono">R$</span>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={precoAssinaturaBureau}
                    onChange={(e) => setPrecoAssinaturaBureau(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.15)] text-sm font-mono text-[#F4F7FA] focus:outline-none focus:border-[#12B886]"
                  />
                </div>
              </div>
              {renderBadgeUltimaAlteracao('precos_planos.assinatura_bureau')}
            </div>
          </div>
        </div>

        {/* JUSTIFICATIVA FORMAL DE AUDITORIA (OPCIONAL/RECOMENDADA) */}
        <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3">
          <label className="block text-xs font-semibold text-[#F4F7FA]">
            Justificativa Institucional para a Trilha de Auditoria (audit_log)
          </label>
          <textarea
            rows={2}
            placeholder="Ex: Reajuste contratual aprovado em comitê diretivo; alinhamento da alçada four-eyes conforme parecer de auditoria interna..."
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] focus:outline-none focus:border-[#12B886]"
          />
          <p className="text-[11px] text-[#93A3B5]">
            Esta justificativa será acoplada aos metadados JSON de cada evento gravado na coleção
            imutável <code>audit_log</code> junto ao seu e-mail e carimbo de data/hora.
          </p>
        </div>

        {/* AÇÕES DE SALVAR */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-[#93A3B5] font-mono">
            {config?.atualizado_em && (
              <span>
                Última sincronização geral em:{' '}
                {new Date(config.atualizado_em).toLocaleString('pt-BR')}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={salvando || loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#12B886] hover:bg-[#0ca678] text-[#0A0E12] font-heading font-black text-xs uppercase tracking-wider transition-all shadow-emerald-glow disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${salvando ? 'animate-spin' : ''}`} />
            <span>{salvando ? 'Gravando Parâmetros...' : 'Salvar Alterações no Banco'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
export default ConsoleParametrosNegocioTab
