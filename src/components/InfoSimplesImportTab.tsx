import React, { useState } from 'react'
import {
  Globe,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  FileKey,
  HelpCircle,
  Loader2,
  FileCode,
} from 'lucide-react'
import {
  consultarNFeInfoSimples,
  salvarConfigCertificadoA1,
  ConsultaInfoSimplesResponse,
} from '@/services/infosimplesService'

interface InfoSimplesImportTabProps {
  usuarioId: string
  onImportSuccess?: () => void
}

export const InfoSimplesImportTab: React.FC<InfoSimplesImportTabProps> = ({
  usuarioId,
  onImportSuccess,
}) => {
  const [chavesInput, setChavesInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resultado, setResultado] = useState<ConsultaInfoSimplesResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Certificado A1 Opcional
  const [mostrarConfigA1, setMostrarConfigA1] = useState(false)
  const [cnpjTitularA1, setCnpjTitularA1] = useState('')
  const [razaoSocialA1, setRazaoSocialA1] = useState('')
  const [senhaA1, setSenhaA1] = useState('')
  const [termoLgpdAceito, setTermoLgpdAceito] = useState(false)
  const [salvandoA1, setSalvandoA1] = useState(false)
  const [statusA1Msg, setStatusA1Msg] = useState<string | null>(null)
  const [usarCertificadoConsulta, setUsarCertificadoConsulta] = useState(false)

  const handleConsultar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setResultado(null)

    // Extrai chaves de 44 dígitos
    const chavesEncontradas = chavesInput
      .split(/[\n,;\s]+/)
      .map((k) => k.replace(/\D/g, '').trim())
      .filter((k) => k.length === 44)

    if (chavesEncontradas.length === 0) {
      setErrorMsg(
        'Nenhuma chave de acesso válida de 44 dígitos encontrada. Verifique se colou os 44 números da NF-e.',
      )
      return
    }

    setIsLoading(true)

    try {
      // Processa a primeira chave (ou itera se múltiplas)
      const chavePrincipal = chavesEncontradas[0]
      const res = await consultarNFeInfoSimples(chavePrincipal, usarCertificadoConsulta)
      setResultado(res)

      if (res.sucesso && onImportSuccess) {
        onImportSuccess()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar consulta via proxy InfoSimples.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSalvarCertificadoA1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusA1Msg(null)

    if (!cnpjTitularA1 || cnpjTitularA1.replace(/\D/g, '').length !== 14) {
      setStatusA1Msg('Informe um CNPJ válido com 14 dígitos para o certificado A1.')
      return
    }

    if (!termoLgpdAceito) {
      setStatusA1Msg('É obrigatório concordar expressamente com o termo LGPD para custódia segura.')
      return
    }

    setSalvandoA1(true)
    try {
      const res = await salvarConfigCertificadoA1({
        cnpj_titular: cnpjTitularA1,
        razao_social: razaoSocialA1,
        senha: senhaA1,
        termo_lgpd_aceito: termoLgpdAceito,
      })
      setStatusA1Msg(res.mensagem || 'Certificado A1 configurado com sucesso!')
      setUsarCertificadoConsulta(true)
    } catch (err: any) {
      setStatusA1Msg(err.message || 'Erro ao salvar certificado A1.')
    } finally {
      setSalvandoA1(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner Informativo do Módulo InfoSimples */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#16202B] via-[#111820] to-[#16202B] border border-[#12B886]/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-bold uppercase tracking-wider mb-2">
              <Globe className="w-3.5 h-3.5" />
              INTEGRAÇÃO OFICIAL INFOSIMPLES • SEFAZ / RECEITA FEDERAL
            </div>
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#F4F7FA]">
              IMPORTAÇÃO DIRETA POR CHAVE DE ACESSO (44 DÍGITOS)
            </h3>
            <p className="text-xs text-[#93A3B5] mt-1">
              Consulte notas fiscais diretamente na Receita Federal via API InfoSimples sem precisar
              fazer download prévio do arquivo XML. O proxy server-side do Orbis Protocol garante
              que o token nunca trafegue pelo navegador.
            </p>
          </div>
        </div>
      </div>

      {/* Formulário de Consulta por Chave */}
      <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
        <form onSubmit={handleConsultar} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold text-[#F4F7FA] mb-2 flex items-center justify-between">
              <span>Chaves de Acesso da NF-e (44 dígitos numéricos)</span>
              <span className="text-[11px] text-[#93A3B5] normal-case">
                Cole uma ou várias chaves separadas por linha
              </span>
            </label>
            <textarea
              rows={3}
              value={chavesInput}
              onChange={(e) => setChavesInput(e.target.value)}
              placeholder="Exemplo: 35240112345678000190550010000001231000001234&#10;35240112345678000190550010000001241000001235"
              className="w-full px-4 py-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-sm font-mono text-[#F4F7FA] focus:outline-none focus:border-[#12B886] transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#93A3B5] flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usarCertificadoConsulta}
                  onChange={(e) => setUsarCertificadoConsulta(e.target.checked)}
                  className="rounded border-[rgba(244,247,250,0.2)] text-[#12B886] focus:ring-[#12B886]"
                />
                <span>Utilizar Certificado Digital A1 cadastrado (para XML completo)</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMostrarConfigA1(!mostrarConfigA1)}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-[rgba(244,247,250,0.2)] text-[#93A3B5] hover:text-[#F4F7FA] hover:border-[#12B886] transition-all flex items-center gap-1.5"
              >
                <FileKey className="w-3.5 h-3.5" />
                <span>
                  {mostrarConfigA1 ? 'Ocultar Certificado A1' : 'Configurar Certificado A1'}
                </span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Consultando API...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Consultar via InfoSimples</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Feedback de erro */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs text-[#F03E54] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Feedback de Modo Degradação ou Sucesso */}
        {resultado && (
          <div className="mt-4">
            {resultado.degradacao ? (
              <div className="p-4 rounded-xl bg-[#D9B36C]/10 border border-[#D9B36C]/40 text-xs text-[#D9B36C]">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-bold text-[#F4F7FA] mb-1">
                      Modo Degradação Elegante Ativo
                    </strong>
                    <p className="leading-relaxed mb-2">{resultado.mensagem}</p>
                    <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[#D9B36C]/20 text-[11px] text-[#93A3B5]">
                      ℹ️ O token <code>INFOSIMPLES_TOKEN</code> pode ser configurado no cofre de
                      segredos do Skip Cloud a qualquer momento. Enquanto isso, o{' '}
                      <strong className="text-[#F4F7FA]">upload manual de arquivos XML</strong>{' '}
                      permanece totalmente operacional alimentando o mesmo balanço tributário e de
                      emissões.
                    </div>
                  </div>
                </div>
              </div>
            ) : resultado.sucesso ? (
              <div className="p-4 rounded-xl bg-[#12B886]/10 border border-[#12B886]/40 text-xs text-[#12B886]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-bold text-[#F4F7FA] mb-1">
                      Nota Fiscal Importada com Sucesso via InfoSimples!
                    </strong>
                    <p className="leading-relaxed">
                      A nota de chave{' '}
                      <span className="font-mono text-[#F4F7FA]">{resultado.chave_acesso}</span> foi
                      ingerida e gravada na sua apuração.
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-[11px] text-[#93A3B5]">
                      <span>
                        Custo da consulta:{' '}
                        <strong className="text-[#12B886]">
                          {resultado.custo_creditos || 0.06} créditos
                        </strong>
                      </span>
                      <span>
                        Código API: <strong className="text-[#F4F7FA]">{resultado.codigo}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs text-[#F03E54] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  A API retornou código {resultado.codigo}: {resultado.mensagem}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Painel Expansível de Certificado Digital A1 */}
      {mostrarConfigA1 && (
        <div className="p-6 rounded-2xl bg-[#111820] border border-[#D9B36C]/30 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#D9B36C]" />
            <h4 className="font-heading font-bold text-base text-[#F4F7FA]">
              CUSTÓDIA SEGURA DE CERTIFICADO DIGITAL A1 (.PFX)
            </h4>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-xs text-[#93A3B5] space-y-2">
            <p>
              <strong className="text-[#D9B36C]">Escopo Regulatório SEFAZ:</strong> A consulta
              resumida por chave de acesso NÃO exige certificado. O download do XML completo com
              todos os itens e tributos exige certificado A1 de participante da nota (emitente ou
              destinatário).
            </p>
            <p className="text-[11px] text-[#12B886]">
              🛡️ <strong>Regra de Participação:</strong> O certificado A1 só consegue buscar notas
              em que o CNPJ do titular seja emitente ou destinatário. Ele não possui acesso a notas
              de terceiros não relacionados.
            </p>
          </div>

          <form onSubmit={handleSalvarCertificadoA1} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-bold text-[#93A3B5] mb-1">
                  CNPJ Titular do Certificado *
                </label>
                <input
                  type="text"
                  value={cnpjTitularA1}
                  onChange={(e) => setCnpjTitularA1(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-[#93A3B5] mb-1">
                  Razão Social / Nome da Entidade
                </label>
                <input
                  type="text"
                  value={razaoSocialA1}
                  onChange={(e) => setRazaoSocialA1(e.target.value)}
                  placeholder="Razão Social Cadastrada"
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-[#93A3B5] mb-1">
                Senha do Certificado A1 (Cifrada no Servidor) *
              </label>
              <input
                type="password"
                value={senhaA1}
                onChange={(e) => setSenhaA1(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA]"
              />
            </div>

            {/* Aviso LGPD Explícito */}
            <div className="p-3.5 rounded-xl bg-[#16202B] border border-[#12B886]/20">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termoLgpdAceito}
                  onChange={(e) => setTermoLgpdAceito(e.target.checked)}
                  className="mt-0.5 rounded border-[rgba(244,247,250,0.2)] text-[#12B886] focus:ring-[#12B886]"
                />
                <span className="text-[11px] text-[#93A3B5] leading-relaxed">
                  <strong className="text-[#F4F7FA]">Consentimento Expresso LGPD:</strong> Autorizo
                  o armazenamento cifrado desta credencial para o propósito exclusivo de consulta e
                  validação fiscal junto aos servidores autorizadores da SEFAZ/Receita Federal. A
                  senha nunca é gravada em texto plano no banco de dados e é protegida por chave
                  criptográfica AES simétrica do ambiente de custódia.
                </span>
              </label>
            </div>

            {statusA1Msg && (
              <div className="p-3 rounded-lg bg-[#12B886]/10 border border-[#12B886]/30 text-xs text-[#12B886]">
                {statusA1Msg}
              </div>
            )}

            <button
              type="submit"
              disabled={salvandoA1}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#D9B36C] text-[#0A0E12] hover:bg-[#C9A25B] transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {salvandoA1 ? 'Cifrando e Salvando...' : 'Salvar Certificado com Criptografia'}
              </span>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
