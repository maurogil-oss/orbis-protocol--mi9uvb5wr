import React, { useState } from 'react'
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import { validarSenhaForte } from '@/lib/passwordPolicy'
import { registrarEventoAudit } from '@/services/auditService'

interface ModalAlterarSenhaProps {
  aberto: boolean
  onClose: () => void
}

export const ModalAlterarSenha: React.FC<ModalAlterarSenhaProps> = ({ aberto, onClose }) => {
  const { user } = useAuth()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  const [mostrarAtual, setMostrarAtual] = useState(false)
  const [mostrarNova, setMostrarNova] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)

  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  if (!aberto) return null

  // Indicadores da política de senha forte
  const temMin10 = novaSenha.length >= 10
  const temMaiuscula = /[A-Z]/.test(novaSenha)
  const temMinuscula = /[a-z]/.test(novaSenha)
  const temNumero = /[0-9]/.test(novaSenha)
  const temSimbolo = /[^A-Za-z0-9]/.test(novaSenha)
  const senhasConferem = Boolean(novaSenha && confirmarSenha && novaSenha === confirmarSenha)

  const handleFechar = () => {
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmarSenha('')
    setErro(null)
    setSucesso(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setSucesso(null)

    if (!user?.id) {
      setErro('Usuário não autenticado no sistema.')
      return
    }

    if (!senhaAtual.trim()) {
      setErro('Por favor, informe sua senha atual.')
      return
    }

    // 1. Validação estrita da política de senha forte (mín. 10 caracteres, 1 maiúscula, 1 minúscula, 1 número)
    const validacao = validarSenhaForte(novaSenha)
    if (!validacao.valida) {
      setErro(validacao.mensagem)
      return
    }

    // 2. Confirmação da nova senha
    if (novaSenha !== confirmarSenha) {
      setErro('A confirmação da nova senha não confere.')
      return
    }

    // 3. Senha nova diferente da atual
    if (senhaAtual === novaSenha) {
      setErro('A nova senha deve ser diferente da senha atual.')
      return
    }

    setProcessando(true)

    try {
      // Endpoint nativo autenticado do PocketBase para alteração da própria senha
      await pb.collection('users').update(user.id, {
        oldPassword: senhaAtual,
        password: novaSenha,
        passwordConfirm: confirmarSenha,
      })

      // Auditoria com registrarEventoAudit: JAMAIS logar senha ou hash no payload
      await registrarEventoAudit({
        acao: 'usuario_alterou_propria_senha',
        entidade: 'users',
        entidade_id: user.id,
        detalhes: {
          email: user.email || '',
          timestamp: new Date().toISOString(),
          ip_origem: 'browser_client',
        },
      })

      setSucesso('Senha alterada com sucesso! Utilize a nova senha em seus próximos acessos.')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    } catch (err: any) {
      const msgErro =
        err?.data?.data?.oldPassword?.message ||
        err?.data?.data?.password?.message ||
        err?.data?.message ||
        err?.message ||
        'Não foi possível alterar a senha. Verifique se a senha atual está correta.'

      setErro(
        msgErro.includes('Failed to authenticate') || msgErro.includes('invalid')
          ? 'Senha atual incorreta. Por favor, tente novamente.'
          : msgErro,
      )
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-alterar-senha"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] p-6 space-y-5 shadow-2xl relative text-left">
        {/* Cabeçalho do Modal */}
        <div className="flex items-start justify-between border-b border-[rgba(244,247,250,0.08)] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="titulo-alterar-senha"
                className="font-heading font-bold text-base text-[#F4F7FA]"
              >
                Alterar Minha Senha
              </h3>
              <p className="text-xs text-[#93A3B5] mt-0.5">
                {user?.email || 'Conta Orbis Protocol'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFechar}
            className="p-1.5 rounded-lg text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B] transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagens de Feedback */}
        {erro && (
          <div className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/40 text-xs text-[#EF4444] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="p-3.5 rounded-xl bg-[#12B886]/10 border border-[#12B886]/40 text-xs text-[#12B886] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{sucesso}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Campo Senha Atual */}
          <div>
            <label className="block text-[#93A3B5] font-semibold mb-1.5">Senha Atual *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#93A3B5] absolute left-3 top-3" />
              <input
                type={mostrarAtual ? 'text' : 'password'}
                required
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Informe sua senha atual"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:border-[#12B886] text-xs transition-colors"
              />
              <button
                type="button"
                onClick={() => setMostrarAtual(!mostrarAtual)}
                className="absolute right-3 top-2.5 text-[#93A3B5] hover:text-[#F4F7FA]"
                tabIndex={-1}
                aria-label={mostrarAtual ? 'Ocultar senha' : 'Exibir senha'}
              >
                {mostrarAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Campo Nova Senha */}
          <div>
            <label className="block text-[#93A3B5] font-semibold mb-1.5">
              Nova Senha (mín. 10 caracteres) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#93A3B5] absolute left-3 top-3" />
              <input
                type={mostrarNova ? 'text' : 'password'}
                required
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Crie uma nova senha forte"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:border-[#12B886] text-xs transition-colors"
              />
              <button
                type="button"
                onClick={() => setMostrarNova(!mostrarNova)}
                className="absolute right-3 top-2.5 text-[#93A3B5] hover:text-[#F4F7FA]"
                tabIndex={-1}
                aria-label={mostrarNova ? 'Ocultar senha' : 'Exibir senha'}
              >
                {mostrarNova ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Campo Confirmar Nova Senha */}
          <div>
            <label className="block text-[#93A3B5] font-semibold mb-1.5">
              Confirmar Nova Senha *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#93A3B5] absolute left-3 top-3" />
              <input
                type={mostrarConfirmar ? 'text' : 'password'}
                required
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] focus:outline-none focus:border-[#12B886] text-xs transition-colors"
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                className="absolute right-3 top-2.5 text-[#93A3B5] hover:text-[#F4F7FA]"
                tabIndex={-1}
                aria-label={mostrarConfirmar ? 'Ocultar senha' : 'Exibir senha'}
              >
                {mostrarConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Guia de Política de Senha Forte */}
          <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1.5">
            <div className="text-[11px] font-semibold text-[#93A3B5] flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#12B886]" />
              <span>Política de Segurança da Senha</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div
                className={`flex items-center gap-1.5 ${temMin10 ? 'text-[#12B886]' : 'text-[#93A3B5]'}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${temMin10 ? 'bg-[#12B886]' : 'bg-[#93A3B5]/40'}`}
                />
                <span>Mínimo 10 caracteres</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${temMaiuscula ? 'text-[#12B886]' : 'text-[#93A3B5]'}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${temMaiuscula ? 'bg-[#12B886]' : 'bg-[#93A3B5]/40'}`}
                />
                <span>1 letra maiúscula [A-Z]</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${temMinuscula ? 'text-[#12B886]' : 'text-[#93A3B5]'}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${temMinuscula ? 'bg-[#12B886]' : 'bg-[#93A3B5]/40'}`}
                />
                <span>1 letra minúscula [a-z]</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${temNumero ? 'text-[#12B886]' : 'text-[#93A3B5]'}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${temNumero ? 'bg-[#12B886]' : 'bg-[#93A3B5]/40'}`}
                />
                <span>1 número [0-9]</span>
              </div>
              <div
                className={`flex items-center gap-1.5 col-span-2 ${temSimbolo ? 'text-[#12B886]' : 'text-[#93A3B5]'}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${temSimbolo ? 'bg-[#12B886]' : 'bg-[#93A3B5]/40'}`}
                />
                <span>1 caractere especial ou símbolo (!@#$%^&*...)</span>
              </div>
            </div>
            {novaSenha && confirmarSenha && (
              <div
                className={`text-[10px] pt-1 flex items-center gap-1.5 ${senhasConferem ? 'text-[#12B886]' : 'text-[#EF4444]'}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${senhasConferem ? 'bg-[#12B886]' : 'bg-[#EF4444]'}`}
                />
                <span>{senhasConferem ? 'As senhas conferem ✓' : 'As senhas não coincidem'}</span>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(244,247,250,0.08)]">
            <button
              type="button"
              onClick={handleFechar}
              disabled={processando}
              className="px-4 py-2.5 rounded-xl bg-[#16202B] text-xs font-semibold text-[#93A3B5] hover:text-[#F4F7FA] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={processando || !senhaAtual || !novaSenha || !confirmarSenha}
              className="px-5 py-2.5 rounded-xl bg-[#12B886] hover:bg-[#0CA678] text-[#0A0E12] font-bold text-xs uppercase tracking-wider transition-all shadow-emerald-glow disabled:opacity-50 flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{processando ? 'Atualizando...' : 'Atualizar Senha'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
