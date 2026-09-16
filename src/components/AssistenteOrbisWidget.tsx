import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  MessageSquare,
  X,
  Send,
  Bot,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Building2,
  RotateCcw,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { consultarCNPJ, cleanCNPJ } from '@/services/cnpj'
import { calcularComparativoTributario } from '@/services/tributosReforma'

interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
}

export function AssistenteOrbisWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Olá! Sou o **Assistente Orbis**, especialista em transição da Reforma Tributária (IBS/CBS) e governança climática (SBCE Lei 15.042/2024).\n\nPosso esboçar um comparativo preliminar da sua empresa e checar o impacto esperado na desoneração de tributos e créditos. Qual o **CNPJ** ou setor de atuação da sua empresa?',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  // Dados coletados preliminares
  const [detectedCnpj, setDetectedCnpj] = useState<string | null>(null)
  const [detectedRazao, setDetectedRazao] = useState<string | null>(null)
  const [leadSaved, setLeadSaved] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Detectar menção a CNPJ no texto e consultar
  const tryDetectAndEnrichCNPJ = async (text: string) => {
    const rawMatches = text.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{14}/)
    if (rawMatches && !detectedCnpj) {
      const clean = cleanCNPJ(rawMatches[0])
      if (clean.length === 14) {
        setDetectedCnpj(clean)
        try {
          const dados = await consultarCNPJ(clean)
          if (dados && dados.razao_social) {
            setDetectedRazao(dados.razao_social)
            // Salva lead preliminar no backend com origem "agente_ia"
            salvarLeadPreliminar({
              cnpj: clean,
              razao_social: dados.razao_social,
              regime_tributario: dados.regime_tributario_sugerido || 'A confirmar',
            })
          }
        } catch {
          /* ignora se falhar */
        }
      }
    }
  }

  // Registrar lead capturado no backend
  const salvarLeadPreliminar = async (dados: {
    cnpj: string
    razao_social: string
    regime_tributario?: string
    faixa_impacto_tributario?: string
  }) => {
    try {
      const comparativo = calcularComparativoTributario({
        razao_social: dados.razao_social,
        regime_tributario: dados.regime_tributario,
      })

      await fetch(`${pb.baseUrl}/backend/v1/agent-save-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cnpj: dados.cnpj,
          razao_social: dados.razao_social,
          regime_tributario: dados.regime_tributario,
          faixa_impacto_tributario: comparativo.faixaImpacto,
          comparativo_tributario_json: comparativo,
        }),
      })
      setLeadSaved(true)
    } catch {
      /* intentionally ignored */
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const text = inputValue.trim()
    if (!text || isLoading) return

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)

    // Tenta detectar CNPJ no texto do usuário
    tryDetectAndEnrichCNPJ(text)

    try {
      // Chama o endpoint de chat do agente nativo
      const resp = await fetch(`${pb.baseUrl}/backend/v1/agent-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
        }),
      })

      if (!resp.ok) {
        throw new Error('Falha na resposta do assistente')
      }

      const data = await resp.json()
      if (data.conversation_id) {
        setConversationId(data.conversation_id)
      }

      const botMsg: ChatMessage = {
        id: data.message_id || String(Date.now()),
        role: 'assistant',
        content: data.content || 'Compreendido. Vamos analisar as diretrizes aplicáveis.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err: any) {
      // Resposta resiliente com fallback inteligente se serviço externo de IA estiver indisponível
      const fallbackResponse = gerarRespostaFallback(text)
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: 'assistant',
          content: fallbackResponse,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Resposta fallback regulatória caso a API de IA tenha latência ou indisponibilidade
  const gerarRespostaFallback = (userText: string): string => {
    const lower = userText.toLowerCase()
    if (
      lower.includes('cbam') ||
      lower.includes('export') ||
      lower.includes('europa') ||
      lower.includes('ue')
    ) {
      return (
        'Para empresas **exportadoras à União Europeia (CBAM)**, a desoneração é ampla e a rastreabilidade de emissões via dMRV evita sobretaxas na fronteira do bloco europeu.\n\n' +
        'Recomendamos iniciar o diagnóstico completo para detalhar as NCMs abrangidas (aço, cimento, fertilizantes, alumínio).'
      )
    }
    if (lower.includes('simples')) {
      return (
        'Empresas optantes pelo **Simples Nacional** operam em faixa adaptativa na Reforma Tributária (EC 132/2023): você poderá manter a guia unificada (DAS) ou optar por recolher IBS/CBS por fora para transferir créditos financeiros integrais aos seus clientes corporativos (B2B).\n\n' +
        '*Aviso regulatório: estimativa preliminar e educativa a confirmar pelo contribuinte.*'
      )
    }
    if (
      lower.includes('mover') ||
      lower.includes('automot') ||
      lower.includes('cdv') ||
      lower.includes('peça')
    ) {
      return (
        'O **Programa MOVER (Lei 14.902/2024)** contempla estritamente montadoras e Centrais de Desmontagem Veicular (CDVs credenciados). Ele permite créditos sobre descarbonização e reutilização de peças com rastreabilidade.\n\n' +
        'Clique em "Continuar no diagnóstico completo" para validar o enquadramento do seu CNPJ.'
      )
    }
    return (
      'Obrigado pelas informações! A transição da **Reforma Tributária (EC 132/2023 - IBS/CBS)** e os limiares de reporte do **SBCE (Lei 15.042/2024)** trazem impactos profundos na cadeia de créditos.\n\n' +
      'Para emitir o protocolo oficial e visualizar a tabela comparativa tributária detalhada, recomendo avançar para o diagnóstico completo.'
    )
  }

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content:
          'Olá! Sou o Assistente Orbis. Informe o **CNPJ** ou o setor da sua empresa para iniciarmos a pré-qualificação preliminar.',
        timestamp: new Date(),
      },
    ])
    setConversationId(null)
    setDetectedCnpj(null)
    setDetectedRazao(null)
    setLeadSaved(false)
  }

  // Discreto: renderiza apenas um botão flutuante e modal quando aberto
  return (
    <div className="fixed bottom-5 right-5 z-40 print:hidden">
      {/* Botão Flutuante quando fechado */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#F4F7FA] shadow-2xl hover:border-[#12B886] hover:bg-[#16202B] transition-all transform hover:scale-105"
          title="Abrir Assistente Orbis"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-[#12B886] group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#12B886] animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#12B886]" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-xs font-bold leading-tight">Assistente Orbis</span>
            <span className="block text-[10px] text-[#93A3B5]">Pré-qualificação IA</span>
          </div>
        </button>
      )}

      {/* Caixa de Chat Flutuante quando aberto */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] max-h-[85vh] rounded-2xl bg-[#111820] border border-[#12B886]/40 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header do Widget */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#16202B] to-[#111820] border-b border-[rgba(244,247,250,0.1)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#12B886]/10 border border-[#12B886]/40 flex items-center justify-center text-[#12B886]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-heading font-bold text-xs text-[#F4F7FA]">
                    ASSISTENTE ORBIS
                  </h4>
                  <span className="px-1.5 py-0.2 rounded bg-[#12B886]/20 text-[#12B886] text-[9px] font-bold uppercase">
                    Skip IA
                  </span>
                </div>
                <p className="text-[10px] text-[#93A3B5]">Reforma IBS/CBS • SBCE • CBAM</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-md text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B]"
                title="Reiniciar conversa"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B]"
                title="Fechar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Aviso Regulatório Curto */}
          <div className="px-3 py-1.5 bg-[#0A0E12] border-b border-[rgba(244,247,250,0.06)] text-[10px] text-[#93A3B5] flex items-center justify-between">
            <span className="truncate">
              Estimativas preliminares e alinhadas à Lei 15.042/2024.
            </span>
            {detectedCnpj && (
              <span className="font-mono text-[#D9B36C] font-semibold shrink-0 ml-2">
                CNPJ {detectedCnpj.slice(0, 8)}...
              </span>
            )}
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-[#12B886]/10 border border-[#12B886]/30 flex items-center justify-center text-[#12B886] shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-3.5 py-2.5 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#12B886] text-[#0A0E12] font-medium rounded-tr-none'
                      : 'bg-[#16202B] border border-[rgba(244,247,250,0.08)] text-[#F4F7FA] rounded-tl-none whitespace-pre-wrap'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-[#93A3B5] text-xs">
                <div className="w-6 h-6 rounded-full bg-[#12B886]/10 border border-[#12B886]/30 flex items-center justify-center text-[#12B886] shrink-0">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
                <span>Assistente calculando diretrizes...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Handoff para o Funil Completo */}
          <div className="px-3.5 py-2 bg-[#0A0E12] border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between gap-2">
            <span className="text-[10px] text-[#93A3B5] truncate">
              Pronto para gerar o laudo pericial?
            </span>
            <Link
              to="/diagnostico"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 rounded-lg bg-[#12B886] text-[#0A0E12] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 hover:bg-[#0CA678] shrink-0 transition-colors"
            >
              <span>Continuar no diagnóstico</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Campo de Entrada */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-[#111820] border-t border-[rgba(244,247,250,0.1)] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite seu CNPJ, setor ou dúvida..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] text-xs text-[#F4F7FA] placeholder-[#93A3B5]/60 focus:outline-none focus:ring-1 focus:ring-[#12B886]"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 rounded-xl bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] disabled:opacity-40 transition-colors shrink-0"
              title="Enviar mensagem"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
