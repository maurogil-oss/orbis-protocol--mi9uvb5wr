import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  WebhookConfigRecord,
  WebhookEntregaRecord,
  EVENTOS_WEBHOOK_DISPONIVEIS,
  listarWebhooksUsuario,
  criarWebhookConfig,
  atualizarWebhookConfig,
  excluirWebhookConfig,
  listarEntregasWebhooks,
  testarDisparoWebhook,
  gerarSegredoHmac,
} from '@/services/webhooksB2BService'
import {
  Radio,
  Plus,
  Play,
  RotateCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Code,
  Clock,
  Shield,
  Key,
  AlertTriangle,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react'

export function WebhooksB2BTab() {
  const { user } = useAuth()
  const [webhooks, setWebhooks] = useState<WebhookConfigRecord[]>([])
  const [entregas, setEntregas] = useState<WebhookEntregaRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})

  // Form de novo webhook
  const [novoNome, setNovoNome] = useState('')
  const [novaUrl, setNovaUrl] = useState('')
  const [novoSecret, setNovoSecret] = useState(gerarSegredoHmac())
  const [eventosSelecionados, setEventosSelecionados] = useState<string[]>([
    'lote_cdv_recebido',
    'selo_emitido',
  ])
  const [isSalvando, setIsSalvando] = useState(false)
  const [formError, setFormError] = useState('')

  // Disparo de teste
  const [isTestando, setIsTestando] = useState<string | null>(null)
  const [testeResultado, setTesteResultado] = useState<any>(null)

  const carregarDados = async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const [whList, logsList] = await Promise.all([
        listarWebhooksUsuario(user.id),
        listarEntregasWebhooks(user.id, 25),
      ])
      setWebhooks(whList)
      setEntregas(logsList)
    } catch (err) {
      console.error('Erro ao carregar webhooks:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [user?.id])

  const handleToggleEvento = (id: string) => {
    setEventosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    )
  }

  const handleCriarWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!novaUrl.startsWith('http://') && !novaUrl.startsWith('https://')) {
      setFormError('A URL de destino deve começar com http:// ou https://')
      return
    }

    if (eventosSelecionados.length === 0) {
      setFormError('Selecione pelo menos um evento para receber notificações')
      return
    }

    try {
      setIsSalvando(true)
      await criarWebhookConfig({
        nome_aplicacao: novoNome,
        url_destino: novaUrl,
        secret_hmac: novoSecret,
        eventos_ativos: eventosSelecionados,
      })
      setShowNovoModal(false)
      setNovoNome('')
      setNovaUrl('')
      setNovoSecret(gerarSegredoHmac())
      await carregarDados()
    } catch (err: any) {
      setFormError(err.message || 'Erro ao registrar webhook')
    } finally {
      setIsSalvando(false)
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja realmente remover esta integração de webhook?')) return
    try {
      await excluirWebhookConfig(id)
      await carregarDados()
    } catch (err: any) {
      alert(err.message || 'Erro ao remover webhook')
    }
  }

  const handleRegenerarSecret = async (wh: WebhookConfigRecord) => {
    const novo = gerarSegredoHmac()
    if (
      !confirm(
        'Atenção: Ao regenerar o segredo, você deverá atualizar a chave HMAC no seu servidor de destino. Confirmar?',
      )
    )
      return
    try {
      await atualizarWebhookConfig(wh.id, { secret_hmac: novo })
      await carregarDados()
    } catch (err: any) {
      alert(err.message || 'Erro ao regenerar segredo')
    }
  }

  const handleDispararTeste = async (whId: string) => {
    setIsTestando(whId)
    setTesteResultado(null)
    try {
      const res = await testarDisparoWebhook(whId, 'lote_cdv_recebido')
      setTesteResultado(res)
      await carregarDados()
    } catch (err: any) {
      alert(err.message || 'Erro ao disparar teste de webhook')
    } finally {
      setIsTestando(null)
    }
  }

  const copiarParaClipboard = (texto: string, chave: string) => {
    navigator.clipboard.writeText(texto)
    setCopiedKey(chave)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER DA ABA */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#111820] border border-[#12B886]/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-5 h-5 text-[#12B886]" />
            <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
              Webhooks B2B & Mensageria Criptográfica
            </h2>
          </div>
          <p className="text-xs text-[#93A3B5] max-w-2xl leading-relaxed">
            Receba notificações em tempo real assinadas com{' '}
            <strong className="text-[#F4F7FA]">HMAC-SHA256</strong> em seu ERP/TMS/WMS sempre que um
            lote CDV for ingerido, um Passaporte Digital (DPP) for homologado ou um laudo pericial
            for gerado.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNovoSecret(gerarSegredoHmac())
            setShowNovoModal(true)
          }}
          className="px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Novo Endpoint</span>
        </button>
      </div>

      {/* RESULTADO DO TESTE IMEDIATO SE HOUVER */}
      {testeResultado && (
        <div
          className={`p-4 rounded-2xl border text-xs space-y-2 ${
            testeResultado.ok
              ? 'bg-[#12B886]/10 border-[#12B886]'
              : 'bg-[#F03E54]/10 border-[#F03E54]'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-2">
              {testeResultado.ok ? (
                <CheckCircle2 className="w-4 h-4 text-[#12B886]" />
              ) : (
                <XCircle className="w-4 h-4 text-[#F03E54]" />
              )}
              Resultado do Teste de Conexão: HTTP {testeResultado.http_status} (
              {testeResultado.status_entrega})
            </span>
            <span className="font-mono text-[11px] text-[#93A3B5]">
              Tempo: {testeResultado.tempo_resposta_ms} ms
            </span>
          </div>
          <div className="text-[11px] text-[#93A3B5]">
            Corpo retornado:{' '}
            <span className="font-mono text-[#F4F7FA]">
              {testeResultado.resposta_corpo || '(Sem corpo retornado)'}
            </span>
          </div>
          <div className="text-[10px] text-[#93A3B5] font-mono break-all">
            Header X-Orbis-Signature: {testeResultado.signature_gerada}
          </div>
        </div>
      )}

      {/* LISTA DE ENDPOINTS REGISTRADOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-[#D9B36C]">
            Endpoints Configurados ({webhooks.length})
          </h3>
          <button
            onClick={carregarDados}
            className="text-xs text-[#12B886] hover:underline flex items-center gap-1"
          >
            <RotateCw className="w-3 h-3" />
            <span>Atualizar</span>
          </button>
        </div>

        {webhooks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] text-center text-xs text-[#93A3B5]">
            Nenhum webhook registrado ainda. Clique no botão acima para cadastrar sua URL de destino
            e receber eventos em tempo real.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(244,247,250,0.06)] pb-3">
                  <div>
                    <span className="font-heading font-extrabold text-base text-[#F4F7FA] block">
                      {wh.nome_aplicacao}
                    </span>
                    <span className="font-mono text-xs text-[#12B886] break-all">
                      {wh.url_destino}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isTestando === wh.id}
                      onClick={() => handleDispararTeste(wh.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#16202B] border border-[#12B886]/40 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" />
                      <span>{isTestando === wh.id ? 'Testando...' : 'Testar Disparo'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExcluir(wh.id)}
                      className="p-1.5 rounded-lg bg-[#16202B] text-[#93A3B5] hover:text-[#F03E54] transition-colors"
                      title="Excluir Webhook"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Segredo HMAC */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Key className="w-4 h-4 text-[#D9B36C] shrink-0" />
                    <span className="text-[#93A3B5]">Segredo HMAC (Secret):</span>
                    <span className="font-mono text-[#F4F7FA]">
                      {visibleSecrets[wh.id] ? wh.secret_hmac : '••••••••••••••••••••••••••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleSecrets((prev) => ({ ...prev, [wh.id]: !prev[wh.id] }))
                      }
                      className="text-[#93A3B5] hover:text-[#F4F7FA]"
                      title="Mostrar/Ocultar"
                    >
                      {visibleSecrets[wh.id] ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => copiarParaClipboard(wh.secret_hmac, wh.id)}
                      className="text-[#12B886] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === wh.id ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegenerarSecret(wh)}
                      className="text-[#D9B36C] hover:underline text-[11px]"
                    >
                      Regenerar
                    </button>
                  </div>
                </div>

                {/* Eventos Inscritos */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[#93A3B5]">Eventos Ativos:</span>
                  {(wh.eventos_ativos || []).map((ev) => (
                    <span
                      key={ev}
                      className="px-2 py-0.5 rounded-full bg-[#16202B] border border-[#12B886]/30 text-[#12B886] font-mono text-[10px]"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HISTÓRICO DE ENTREGAS */}
      <div className="space-y-4 pt-4 border-t border-[rgba(244,247,250,0.1)]">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-[#F4F7FA]">
            Histórico Recente de Entregas B2B ({entregas.length})
          </h3>
          <span className="text-[11px] text-[#93A3B5]">Últimas 25 tentativas</span>
        </div>

        {entregas.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.08)] text-center text-xs text-[#93A3B5]">
            Nenhum evento disparado ainda. Use o botão "Testar Disparo" acima para validar seu
            webhook.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[rgba(244,247,250,0.1)] bg-[#111820]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[rgba(244,247,250,0.08)] text-[#93A3B5] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Status / Data</th>
                  <th className="py-3 px-4">Evento</th>
                  <th className="py-3 px-4">URL de Destino</th>
                  <th className="py-3 px-4 text-center">HTTP Status</th>
                  <th className="py-3 px-4 text-right">Latência</th>
                  <th className="py-3 px-4 text-right">Assinatura HMAC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(244,247,250,0.05)] text-[#F4F7FA]">
                {entregas.map((log) => (
                  <tr key={log.id} className="hover:bg-[#16202B]/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {log.status_entrega === 'sucesso' ? (
                          <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#F03E54] shrink-0" />
                        )}
                        <div>
                          <span
                            className={`font-bold uppercase text-[10px] ${
                              log.status_entrega === 'sucesso' ? 'text-[#12B886]' : 'text-[#F03E54]'
                            }`}
                          >
                            {log.status_entrega}
                          </span>
                          <div className="text-[10px] text-[#93A3B5]">
                            {log.created?.slice(0, 19).replace('T', ' ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#D9B36C]">{log.evento}</td>
                    <td
                      className="py-3 px-4 text-[11px] truncate max-w-[200px]"
                      title={log.url_destino}
                    >
                      {log.url_destino}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          log.http_status && log.http_status >= 200 && log.http_status < 300
                            ? 'bg-[#12B886]/20 text-[#12B886]'
                            : 'bg-[#F03E54]/20 text-[#F03E54]'
                        }`}
                      >
                        {log.http_status || 'TIMEOUT'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-[#93A3B5]">
                      {log.tempo_resposta_ms ? `${log.tempo_resposta_ms} ms` : '-'}
                    </td>
                    <td
                      className="py-3 px-4 text-right font-mono text-[10px] text-[#93A3B5] truncate max-w-[120px]"
                      title={log.signature_hmac}
                    >
                      {log.signature_hmac ? `${log.signature_hmac.slice(0, 12)}...` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DOCUMENTAÇÃO INLINE COM EXEMPLO DE VALIDAÇÃO HMAC */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-4">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-[#3B82F6]" />
          <h3 className="font-heading font-extrabold text-base text-[#F4F7FA]">
            Guia de Integração: Validação da Assinatura HMAC-SHA256 no seu Servidor
          </h3>
        </div>

        <p className="text-xs text-[#93A3B5] leading-relaxed">
          Cada requisição POST enviada pelo Orbis Protocol inclui o cabeçalho{' '}
          <code className="text-[#12B886] bg-[#0A0E12] px-1.5 py-0.5 rounded">
            X-Orbis-Signature
          </code>{' '}
          contendo a assinatura hexadecimal HMAC-SHA256 do corpo bruto (raw body) da requisição,
          calculada com o seu segredo cadastrado.
        </p>

        <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] font-mono text-[11px] text-[#F4F7FA] overflow-x-auto space-y-2">
          <div className="text-[#93A3B5]">// Exemplo Node.js / Express para validação:</div>
          <div>
            <span className="text-[#3B82F6]">import</span> crypto{' '}
            <span className="text-[#3B82F6]">from</span>{' '}
            <span className="text-[#12B886]">'crypto'</span>;
          </div>
          <div className="pt-2">
            <span className="text-[#3B82F6]">function</span>{' '}
            <span className="text-[#D9B36C]">validarWebhookOrbis</span>(req) &#123;
          </div>
          <div className="pl-4">
            <span className="text-[#3B82F6]">const</span> signatureHeader = req.headers[
            <span className="text-[#12B886]">'x-orbis-signature'</span>];
          </div>
          <div className="pl-4">
            <span className="text-[#3B82F6]">const</span> hmac = crypto.createHmac(
            <span className="text-[#12B886]">'sha256'</span>, process.env.
            <span className="text-[#D9B36C]">ORBIS_WEBHOOK_SECRET</span>);
          </div>
          <div className="pl-4">
            <span className="text-[#3B82F6]">const</span> expectedSig =
            hmac.update(JSON.stringify(req.body)).digest(
            <span className="text-[#12B886]">'hex'</span>);
          </div>
          <div className="pl-4">
            <span className="text-[#3B82F6]">return</span>{' '}
            crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSig));
          </div>
          <div>&#125;</div>
        </div>
      </div>

      {/* MODAL DE NOVO WEBHOOK */}
      {showNovoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111820] border border-[#12B886] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.08)] pb-3">
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#F4F7FA]">
                Registrar Webhook B2B
              </h3>
              <button
                onClick={() => setShowNovoModal(false)}
                className="text-[#93A3B5] hover:text-[#F4F7FA] text-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-[#F03E54]/10 border border-[#F03E54]/40 text-[#F03E54] text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCriarWebhook} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#93A3B5] mb-1 font-semibold">
                  Nome da Aplicação / Sistema *
                </label>
                <input
                  type="text"
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: ERP SAP / Protheus / WMS Logística"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] outline-none focus:border-[#12B886]"
                />
              </div>

              <div>
                <label className="block text-[#93A3B5] mb-1 font-semibold">
                  URL de Destino (Endpoint HTTPS) *
                </label>
                <input
                  type="url"
                  required
                  value={novaUrl}
                  onChange={(e) => setNovaUrl(e.target.value)}
                  placeholder="https://api.empresa.com.br/webhooks/orbis"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] outline-none focus:border-[#12B886] font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[#93A3B5] font-semibold">Segredo HMAC (Secret)</label>
                  <button
                    type="button"
                    onClick={() => setNovoSecret(gerarSegredoHmac())}
                    className="text-[#12B886] hover:underline text-[10px]"
                  >
                    Gerar Novo
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={novoSecret}
                  onChange={(e) => setNovoSecret(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] text-[#12B886] outline-none focus:border-[#12B886] font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[#93A3B5] mb-2 font-semibold">
                  Eventos Notificados:
                </label>
                <div className="space-y-2">
                  {EVENTOS_WEBHOOK_DISPONIVEIS.map((ev) => {
                    const sel = eventosSelecionados.includes(ev.id)
                    return (
                      <label
                        key={ev.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          sel
                            ? 'bg-[#12B886]/10 border-[#12B886] text-[#F4F7FA]'
                            : 'bg-[#0A0E12] border-[rgba(244,247,250,0.06)] text-[#93A3B5]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={sel}
                          onChange={() => handleToggleEvento(ev.id)}
                          className="mt-0.5"
                        />
                        <div>
                          <strong className="block text-xs text-[#F4F7FA]">{ev.nome}</strong>
                          <span className="text-[10px] text-[#93A3B5]">{ev.desc}</span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[rgba(244,247,250,0.08)]">
                <button
                  type="button"
                  onClick={() => setShowNovoModal(false)}
                  className="px-4 py-2 rounded-xl border border-[rgba(244,247,250,0.2)] text-[#F4F7FA]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSalvando}
                  className="px-5 py-2 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] disabled:opacity-50"
                >
                  {isSalvando ? 'Salvando...' : 'Cadastrar Webhook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
