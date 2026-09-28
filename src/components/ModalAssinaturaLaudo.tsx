import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, Loader2, FileText } from 'lucide-react'
import { assinarLaudoComCertificadoA1 } from '@/services/assinaturaLaudoService'

interface ModalAssinaturaLaudoProps {
  aberto: boolean
  onClose: () => void
  relatorio: {
    id: string
    titulo?: string
    codigo_verificacao?: string
    hash_sha256?: string
    tipo_relatorio?: string
  } | null
  cnpjCustodia?: string
  razaoCustodia?: string
  onAssinaturaConcluida?: () => void
}

export function ModalAssinaturaLaudo({
  aberto,
  onClose,
  relatorio,
  cnpjCustodia,
  razaoCustodia,
  onAssinaturaConcluida,
}: ModalAssinaturaLaudoProps) {
  const [senha, setSenha] = useState('')
  const [assinando, setAssinando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<{
    hash: string
    titular: string
    dataHora: string
  } | null>(null)

  const handleFechar = () => {
    if (assinando) return
    setSenha('')
    setErro(null)
    setSucesso(null)
    onClose()
  }

  const handleAssinar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!relatorio) return
    if (!senha) {
      setErro('Informe a senha do certificado A1 custodiado para autorizar a assinatura.')
      return
    }

    setAssinando(true)
    setErro(null)

    try {
      const res = await assinarLaudoComCertificadoA1({
        relatorioId: relatorio.id,
        senhaPfx: senha,
      })

      if (!res.sucesso) {
        setErro(res.erro || 'Falha ao assinar documento com o certificado ICP-Brasil.')
        return
      }

      setSucesso({
        hash: res.hashSha256 || relatorio.hash_sha256 || '',
        titular: res.titularNome || razaoCustodia || 'Titular do Certificado',
        dataHora: res.timestampServidor || new Date().toISOString(),
      })

      if (onAssinaturaConcluida) {
        onAssinaturaConcluida()
      }
    } catch (err: any) {
      setErro(err.message || 'Erro inesperado durante a rotina de assinatura.')
    } finally {
      setAssinando(false)
      setSenha('') // Garantia de que a senha NUNCA fica retida em memória após a execução
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && handleFechar()}>
      <DialogContent className="max-w-md bg-[#111820] text-[#F4F7FA] border border-[#12B886]/40 shadow-2xl">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-[#12B886]/10 border border-[#12B886]/40 flex items-center justify-center mb-2">
            <ShieldCheck className="w-5 h-5 text-[#12B886]" />
          </div>
          <DialogTitle className="text-lg font-bold">
            Assinatura Digital ICP-Brasil (e-CNPJ A1)
          </DialogTitle>
          <DialogDescription className="text-xs text-[#93A3B5] leading-relaxed">
            Aplicação de assinatura digital baseada em certificado ICP-Brasil e-CNPJ A1 sob custódia
            do titular com prova criptográfica SHA-256 no laudo pericial.
          </DialogDescription>
        </DialogHeader>

        {sucesso ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-[#12B886]/10 border border-[#12B886]/40 text-xs text-[#12B886] space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-[#F4F7FA]">
                <CheckCircle2 className="w-4 h-4 text-[#12B886]" />
                <span>Laudo Assinado com Sucesso!</span>
              </div>
              <p className="text-[11px] text-[#93A3B5] leading-relaxed">
                Documento com assinatura digital baseada em certificado ICP-Brasil e-CNPJ A1 sob
                custódia do titular e prova criptográfica SHA-256.
              </p>
              <div className="pt-2 border-t border-[#12B886]/20 font-mono text-[10px] space-y-1 text-[#F4F7FA]">
                <div>
                  <span className="text-[#93A3B5]">Titular:</span> {sucesso.titular}
                </div>
                <div>
                  <span className="text-[#93A3B5]">Data/Hora (Servidor):</span>{' '}
                  {new Date(sucesso.dataHora).toLocaleString('pt-BR')}
                </div>
                <div className="truncate">
                  <span className="text-[#93A3B5]">Hash SHA-256:</span> {sucesso.hash}
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleFechar}
              className="w-full bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] font-bold text-xs"
            >
              Concluir
            </Button>
          </div>
        ) : (
          <form onSubmit={handleAssinar} className="space-y-4 py-2">
            {/* Informações do Laudo Alvo */}
            <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-[#93A3B5]">
                <FileText className="w-3.5 h-3.5 text-[#12B886]" />
                <span className="font-semibold text-[#F4F7FA]">
                  {relatorio?.titulo || relatorio?.codigo_verificacao || 'Laudo Pericial'}
                </span>
              </div>
              {cnpjCustodia && (
                <div className="text-[11px] text-[#93A3B5]">
                  Certificado vinculador:{' '}
                  <span className="font-mono text-[#F4F7FA]">{cnpjCustodia}</span>{' '}
                  {razaoCustodia && `(${razaoCustodia})`}
                </div>
              )}
            </div>

            {/* Aviso rigoroso de conformidade */}
            <div className="p-3 rounded-xl bg-[#16202B] border border-[#12B886]/30 text-[11px] text-[#93A3B5] leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5" />
              <span>
                A senha do certificado é utilizada exclusivamente em memória no navegador para a
                operação e <strong>nunca é persistida</strong> nem transmitida em texto plano.
              </span>
            </div>

            {erro && (
              <div className="p-3 rounded-xl bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs text-[#F03E54] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="senhaA1Assinatura" className="text-xs text-[#93A3B5]">
                Senha do Certificado A1 (.pfx)
              </Label>
              <Input
                id="senhaA1Assinatura"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite a senha do .pfx"
                autoComplete="current-password"
                disabled={assinando}
                className="bg-[#0A0E12] border-[rgba(244,247,250,0.15)] text-[#F4F7FA] text-xs font-mono"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleFechar}
                disabled={assinando}
                className="text-xs border-[rgba(244,247,250,0.2)] text-[#F4F7FA]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={assinando || !senha}
                className="bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] font-bold text-xs gap-1.5 shadow-emerald-glow"
              >
                {assinando ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Assinando no Navegador...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Assinar com ICP-Brasil</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
