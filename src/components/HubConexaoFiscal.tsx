import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Shield,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Lock,
  Globe,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Scale,
  RefreshCw,
  Building,
  KeyRound,
  FileCheck2,
  Award,
  BookOpen,
  Server,
  Key,
  Copy,
  Code2,
} from 'lucide-react'
import {
  TermoCustodiaA1Modal,
  TERMO_CUSTODIA_VERSAO_ATUAL,
} from '@/components/TermoCustodiaA1Modal'
import {
  obterStatusCertificadoA1,
  salvarConfigCertificadoA1,
  revogarCertificadoA1,
  CertificadoA1Status,
} from '@/services/infosimplesService'
import { extrairMetadadosCertificadoPfx } from '@/services/certificadoA1Extractor'
import {
  parseSpedTxt,
  salvarImportacaoSped,
  listarImportacoesSped,
  SpedResumoPeriodo,
} from '@/services/spedService'
import {
  EmpresaApiKeyNfsRecord,
  NfsApiLoteLogRecord,
  obterOuCriarApiKeyNfs,
  regenerarApiKeyNfs,
  revogarApiKeyNfs,
  listarApiKeysNfs,
  listarLogsLotesNfs,
} from '@/services/nfsApiService'
import { formatCurrencyBRL } from '@/services/nfeParser'

interface HubConexaoFiscalProps {
  usuarioId: string
  cnpjEmpresa?: string
  razaoSocial?: string
  onNfeImportada?: () => void
  onNavegarParaAba?: (aba: string) => void
}

export const HubConexaoFiscal: React.FC<HubConexaoFiscalProps> = ({
  usuarioId,
  cnpjEmpresa,
  razaoSocial,
  onNfeImportada,
  onNavegarParaAba,
}) => {
  // Modelo selecionado na interface: agora inclui o Modelo 4 (API de NFs)
  const [modeloAtivo, setModeloAtivo] = useState<'modelo1' | 'modelo2' | 'modelo3' | 'modelo4'>(
    'modelo1',
  )

  // Estado do Certificado A1 (Modelo 3)
  const [statusA1, setStatusA1] = useState<CertificadoA1Status | null>(null)
  const [isCarregandoA1, setIsCarregandoA1] = useState(false)
  const [modalTermoAberto, setModalTermoAberto] = useState(false)
  const [cnpjA1, setCnpjA1] = useState(cnpjEmpresa || '')
  const [razaoA1, setRazaoA1] = useState(razaoSocial || '')
  const [senhaA1, setSenhaA1] = useState('')
  const [arquivoPfxNome, setArquivoPfxNome] = useState<string | null>(null)
  const [arquivoPfxBase64, setArquivoPfxBase64] = useState<string | null>(null)
  const [arquivoPfxTamanho, setArquivoPfxTamanho] = useState<number | null>(null)
  const [termoAceitoDireto, setTermoAceitoDireto] = useState(false)
  const [salvandoA1, setSalvandoA1] = useState(false)
  const [revogandoA1, setRevogandoA1] = useState(false)
  const [mensagemA1, setMensagemA1] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const pfxInputRef = useRef<HTMLInputElement | null>(null)

  // Estado da Importação SPED (Modelo 2)
  const [arquivoSpedSelecionado, setArquivoSpedSelecionado] = useState<File | null>(null)
  const [isProcessandoSped, setIsProcessandoSped] = useState(false)
  const [resumoSpedAtual, setResumoSpedAtual] = useState<SpedResumoPeriodo | null>(null)
  const [historicoSped, setHistoricoSped] = useState<any[]>([])
  const [mensagemSped, setMensagemSped] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(
    null,
  )
  const spedInputRef = useRef<HTMLInputElement | null>(null)

  // Estado específico da API de NFs (Modelo 4)
  const [apiKeyNfsAtiva, setApiKeyNfsAtiva] = useState<EmpresaApiKeyNfsRecord | null>(null)
  const [chaveNfsRecemCriada, setChaveNfsRecemCriada] = useState<string | null>(null)
  const [chaveCopiada, setChaveCopiada] = useState(false)
  const [isGerandoApiKeyNfs, setIsGerandoApiKeyNfs] = useState(false)
  const [isRevogandoApiKeyNfs, setIsRevogandoApiKeyNfs] = useState(false)
  const [mensagemNfsApi, setMensagemNfsApi] = useState<{
    tipo: 'ok' | 'erro'
    texto: string
  } | null>(null)
  const [logsLotesNfs, setLogsLotesNfs] = useState<NfsApiLoteLogRecord[]>([])

  // Carrega status A1, histórico SPED e chaves da API de NFs
  const recarregarDados = async () => {
    setIsCarregandoA1(true)
    try {
      if (usuarioId) {
        const st = await obterStatusCertificadoA1(usuarioId)
        setStatusA1(st)
        if (st?.cnpj_titular) setCnpjA1(st.cnpj_titular)
        if (st?.razao_social) setRazaoA1(st.razao_social)
        if (st?.termo_lgpd_aceito) setTermoAceitoDireto(true)

        const speds = await listarImportacoesSped(usuarioId)
        setHistoricoSped(speds)
      }

      // Carregar chaves de API de NFs para o CNPJ
      const cleanCnpj = (cnpjEmpresa || cnpjA1 || '').replace(/\D/g, '')
      if (cleanCnpj) {
        const keys = await listarApiKeysNfs(cleanCnpj)
        const ativa = keys.find((k) => k.ativa) || null
        setApiKeyNfsAtiva(ativa)

        const logs = await listarLogsLotesNfs(cleanCnpj, 10)
        setLogsLotesNfs(logs)
      }
    } catch {
      /* ignore */
    } finally {
      setIsCarregandoA1(false)
    }
  }

  // Gerar chave de API de NFs
  const handleGerarOuVerApiKeyNfs = async () => {
    const cleanCnpj = (cnpjEmpresa || cnpjA1 || '').replace(/\D/g, '')
    if (!cleanCnpj) {
      setMensagemNfsApi({
        tipo: 'erro',
        texto:
          'CNPJ da empresa não identificado. Certifique-se de que a empresa está selecionada no painel.',
      })
      return
    }

    setIsGerandoApiKeyNfs(true)
    setMensagemNfsApi(null)
    try {
      const res = await obterOuCriarApiKeyNfs({
        empresaNome: razaoSocial || razaoA1 || 'Empresa Emissora',
        cnpj: cleanCnpj,
        usuarioId: usuarioId,
      })
      setApiKeyNfsAtiva(res.record)
      if (res.chaveCompleta) {
        setChaveNfsRecemCriada(res.chaveCompleta)
        setMensagemNfsApi({
          tipo: 'ok',
          texto:
            'Chave de API gerada com sucesso! Copie e armazene com segurança — ela não será exibida novamente.',
        })
      } else {
        setMensagemNfsApi({
          tipo: 'ok',
          texto:
            'Chave de API ativa identificada. Para gerar uma nova chave, clique em "Regenerar Chave".',
        })
      }
      await recarregarDados()
    } catch (err: any) {
      setMensagemNfsApi({
        tipo: 'erro',
        texto: err.message || 'Erro ao gerar chave de API de NFs.',
      })
    } finally {
      setIsGerandoApiKeyNfs(false)
    }
  }

  // Regenerar chave de API de NFs
  const handleRegenerarApiKeyNfs = async () => {
    const cleanCnpj = (cnpjEmpresa || cnpjA1 || '').replace(/\D/g, '')
    if (!cleanCnpj) return

    const confirmou = window.confirm(
      'ATENÇÃO: Deseja realmente regenerar a Chave de API de NFs?\n\nA chave anterior será imediatamente desativada e qualquer ERP ou automação configurada com a chave antiga deixará de se autenticar até que seja atualizada.',
    )
    if (!confirmou) return

    setIsGerandoApiKeyNfs(true)
    setMensagemNfsApi(null)
    try {
      const res = await regenerarApiKeyNfs({
        empresaNome: razaoSocial || razaoA1 || 'Empresa Emissora',
        cnpj: cleanCnpj,
        usuarioId: usuarioId,
      })
      setApiKeyNfsAtiva(res.record)
      setChaveNfsRecemCriada(res.novaChave)
      setMensagemNfsApi({
        tipo: 'ok',
        texto:
          'Nova Chave de API gerada com sucesso! Copie agora e atualize seu ERP imediatamente.',
      })
      await recarregarDados()
    } catch (err: any) {
      setMensagemNfsApi({
        tipo: 'erro',
        texto: err.message || 'Erro ao regenerar chave de API.',
      })
    } finally {
      setIsGerandoApiKeyNfs(false)
    }
  }

  // Revogar chave de API de NFs
  const handleRevogarApiKeyNfs = async () => {
    if (!apiKeyNfsAtiva) return

    const confirmou = window.confirm(
      'ATENÇÃO: Deseja revogar a Chave de API de NFs desta empresa?\n\nQualquer envio de XMLs pelo ERP utilizando esta chave será rejeitado imediatamente com status 401 Unauthorized.',
    )
    if (!confirmou) return

    setIsRevogandoApiKeyNfs(true)
    setMensagemNfsApi(null)
    try {
      await revogarApiKeyNfs(
        apiKeyNfsAtiva.id,
        'Revogação manual solicitada pelo administrador no Hub Fiscal',
      )
      setApiKeyNfsAtiva(null)
      setChaveNfsRecemCriada(null)
      setMensagemNfsApi({
        tipo: 'ok',
        texto:
          'Chave de API revogada com sucesso. Nenhuma nova requisição será aceita com a chave revogada.',
      })
      await recarregarDados()
    } catch (err: any) {
      setMensagemNfsApi({
        tipo: 'erro',
        texto: err.message || 'Erro ao revogar chave de API.',
      })
    } finally {
      setIsRevogandoApiKeyNfs(false)
    }
  }

  const handleCopiarChave = () => {
    if (!chaveNfsRecemCriada) return
    navigator.clipboard.writeText(chaveNfsRecemCriada)
    setChaveCopiada(true)
    setTimeout(() => setChaveCopiada(false), 3000)
  }

  // Tratamento de seleção de arquivo .pfx / .p12
  const handleArquivoPfxSelecionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setMensagemA1(null)

    const nome = file.name.toLowerCase()
    if (!nome.endsWith('.pfx') && !nome.endsWith('.p12')) {
      setMensagemA1({
        tipo: 'erro',
        texto:
          'Formato inválido. O arquivo do certificado ICP-Brasil deve ter extensão .pfx ou .p12.',
      })
      if (pfxInputRef.current) pfxInputRef.current.value = ''
      return
    }

    // Limite de 5 MB
    const limiteBytes = 5 * 1024 * 1024
    if (file.size > limiteBytes) {
      setMensagemA1({
        tipo: 'erro',
        texto: `O arquivo selecionado (${(file.size / 1024 / 1024).toFixed(2)} MB) excede o limite máximo permitido de 5 MB.`,
      })
      if (pfxInputRef.current) pfxInputRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const b64 = reader.result as string
      setArquivoPfxBase64(b64)
      setArquivoPfxNome(file.name)
      setArquivoPfxTamanho(file.size)
    }
    reader.onerror = () => {
      setMensagemA1({
        tipo: 'erro',
        texto: 'Erro ao ler arquivo selecionado.',
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoverArquivoPfx = () => {
    setArquivoPfxBase64(null)
    setArquivoPfxNome(null)
    setArquivoPfxTamanho(null)
    if (pfxInputRef.current) pfxInputRef.current.value = ''
  }

  useEffect(() => {
    recarregarDados()
  }, [usuarioId])

  // Ação de salvar Certificado A1 (exige termo aceito)
  const handleSalvarCertificadoA1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensagemA1(null)

    if (!cnpjA1 || cnpjA1.replace(/\D/g, '').length !== 14) {
      setMensagemA1({ tipo: 'erro', texto: 'Informe um CNPJ válido com 14 dígitos.' })
      return
    }

    if (!senhaA1) {
      setMensagemA1({ tipo: 'erro', texto: 'A senha do arquivo .pfx é obrigatória para cifragem.' })
      return
    }

    // Aceite pode vir do modal prévio OU da marcação direta no checkbox
    const termoEfetivoAceito = Boolean(statusA1?.termo_lgpd_aceito || termoAceitoDireto)
    if (!termoEfetivoAceito) {
      setMensagemA1({
        tipo: 'erro',
        texto:
          'É obrigatório marcar o aceite do Termo de Custódia e Responsabilidade antes de prosseguir.',
      })
      return
    }

    setSalvandoA1(true)
    try {
      // Tarefa 1: Extração client-side da validade do certificado X.509 em memória antes do envio
      let validadeExtraidaPb: string | undefined = undefined
      if (arquivoPfxBase64 && senhaA1) {
        try {
          const resultadoExtracao = extrairMetadadosCertificadoPfx(arquivoPfxBase64, senhaA1)
          if (resultadoExtracao.sucesso && resultadoExtracao.validadePocketBase) {
            validadeExtraidaPb = resultadoExtracao.validadePocketBase
            console.log(
              `[HubConexaoFiscal] Validade extraída client-side com sucesso: ${validadeExtraidaPb}`,
            )
          } else {
            console.warn(
              '[HubConexaoFiscal] Extração client-side de validade não obteve data:',
              resultadoExtracao.erro,
            )
          }
        } catch (extracaoErr) {
          console.warn(
            '[HubConexaoFiscal] Erro na rotina de extração client-side de validade (prosseguindo sem bloquear):',
            extracaoErr,
          )
        }
      }

      const res = await salvarConfigCertificadoA1({
        cnpj_titular: cnpjA1,
        razao_social: razaoA1,
        senha: senhaA1,
        termo_lgpd_aceito: true,
        termo_versao: statusA1?.termo_versao || TERMO_CUSTODIA_VERSAO_ATUAL,
        arquivo_base64: arquivoPfxBase64 || undefined,
        arquivo_nome: arquivoPfxNome || undefined,
        validade_certificado: validadeExtraidaPb,
      })
      setMensagemA1({ tipo: 'ok', texto: res.mensagem })
      setSenhaA1('')
      setArquivoPfxBase64(null)
      setArquivoPfxNome(null)
      setArquivoPfxTamanho(null)
      if (pfxInputRef.current) pfxInputRef.current.value = ''
      await recarregarDados()
    } catch (err: any) {
      setMensagemA1({ tipo: 'erro', texto: err.message || 'Erro ao registrar credencial A1.' })
    } finally {
      setSalvandoA1(false)
    }
  }

  // Revogação instantânea com confirmação explícita
  const handleRevogarCustodia = async () => {
    const confirmou = window.confirm(
      'ATENÇÃO: Deseja realmente revogar a custódia do Certificado Digital A1?\n\nEsta operação executará imediatamente o "zeramento de chave" criptográfica e a exclusão definitiva do arquivo nos servidores do Orbis Protocol / ACP.',
    )
    if (!confirmou) return

    setRevogandoA1(true)
    setMensagemA1(null)
    try {
      const res = await revogarCertificadoA1('Revogação voluntária pelo titular via Hub Fiscal')
      setMensagemA1({ tipo: 'ok', texto: res.mensagem })
      await recarregarDados()
    } catch (err: any) {
      setMensagemA1({ tipo: 'erro', texto: err.message || 'Erro ao revogar custódia.' })
    } finally {
      setRevogandoA1(false)
    }
  }

  // Processamento de arquivo SPED (.txt)
  const handleSpedSelecionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArquivoSpedSelecionado(file)
    setMensagemSped(null)
    setIsProcessandoSped(true)

    try {
      const texto = await file.text()
      const resumo = parseSpedTxt(texto, file.name)
      setResumoSpedAtual(resumo)

      // Persiste no banco PocketBase
      const gravado = await salvarImportacaoSped(usuarioId, resumo, file.name, true)
      setMensagemSped({
        tipo: 'ok',
        texto: `Arquivo SPED (${resumo.tipoSped.toUpperCase()}) importado com sucesso! ${resumo.totalDocumentos} documentos consolidados (${gravado.documentosInseridos} alimentados na visão unificada).`,
      })
      await recarregarDados()
      if (onNfeImportada) onNfeImportada()
    } catch (err: any) {
      setMensagemSped({
        tipo: 'erro',
        texto:
          err.message ||
          'Erro ao processar arquivo SPED. Certifique-se de ser um arquivo .txt no leiaute SPED Fiscal/Contribuições.',
      })
    } finally {
      setIsProcessandoSped(false)
      if (spedInputRef.current) spedInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-8">
      {/* Banner Superior do Hub de Conexão Fiscal ACP */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#16202B] via-[#111820] to-[#16202B] border border-[#12B886]/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/50 text-[#12B886] text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              HUB DE CONEXÃO FISCAL ACP • 4 ROTAS DE INTEGRAÇÃO
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#F4F7FA]">
              INTEGRAÇÃO & CUSTÓDIA FISCAL HOMOLOGADA
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] max-w-3xl mt-2 leading-relaxed">
              O Bureau ACP disponibiliza{' '}
              <strong className="text-[#F4F7FA]">4 rotas soberanas de conexão fiscal</strong> para
              garantir conformidade total com a LGPD e o sigilo bancário-fiscal (LC 105/2001).
              Escolha a rota que melhor atende à política de compliance, infraestrutura de ERP e
              segurança da sua organização.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <span className="px-3 py-2 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 text-[#12B886] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Modo Somente Leitura (Read-Only)</span>
            </span>
          </div>
        </div>
      </div>

      {/* COMPARATIVO DAS 4 ROTAS DE CONEXÃO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* MODELO 4: API de NFs - Integração Direta com ERP (NOVO) */}
        <div
          onClick={() => setModeloAtivo('modelo4')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all flex flex-col justify-between relative ${
            modeloAtivo === 'modelo4'
              ? 'bg-[#16202B] border-[#12B886] shadow-emerald-glow ring-1 ring-[#12B886]'
              : 'bg-[#111820] border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/50'
          }`}
        >
          <div className="absolute -top-3 left-4">
            <span className="px-2.5 py-0.5 rounded-full bg-[#12B886] text-[#0A0E12] font-heading font-extrabold text-[10px] uppercase tracking-wider shadow-md flex items-center gap-1">
              <Server className="w-3 h-3" /> NOVO • MODELO 4
            </span>
          </div>

          <div className="pt-2">
            <div className="w-9 h-9 rounded-xl bg-[#12B886]/10 border border-[#12B886]/40 flex items-center justify-center mb-3">
              <Server className="w-5 h-5 text-[#12B886]" />
            </div>

            <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
              API de NFs (ERP Direto)
            </h3>
            <p className="text-xs text-[#12B886] font-semibold mt-0.5">
              Envio Contínuo de XMLs via HTTP/REST
            </p>

            <p className="text-xs text-[#93A3B5] mt-2.5 leading-relaxed">
              O ERP da empresa empurra XMLs de NF-e em lote diretamente para a plataforma sem upload
              manual e com autenticação por chave de API.
            </p>

            <div className="mt-3 p-2.5 rounded-xl bg-[#12B886]/10 border border-[#12B886]/30 text-[11px] text-[#F4F7FA] space-y-1">
              <strong className="block text-[#12B886] uppercase font-bold text-[10px]">
                ⚡ Ingestão Automatizada:
              </strong>
              <span>
                Recepção direta dos XMLs próprios da sua empresa com processamento instantâneo no
                motor fiscal.
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between">
            <span className="text-[11px] text-[#93A3B5]">
              {apiKeyNfsAtiva ? 'Chave Ativa' : 'Sem Chave'}
            </span>
            <button
              type="button"
              className="text-xs font-bold text-[#12B886] hover:underline flex items-center gap-1"
            >
              <span>Configurar API</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {/* MODELO 1: RECOMENDADA - Procuração Eletrônica e-CAC / Gov.br */}
        <div
          onClick={() => setModeloAtivo('modelo1')}
          className={`cursor-pointer p-6 rounded-2xl border transition-all flex flex-col justify-between relative ${
            modeloAtivo === 'modelo1'
              ? 'bg-[#16202B] border-[#12B886] shadow-emerald-glow ring-1 ring-[#12B886]'
              : 'bg-[#111820] border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/50'
          }`}
        >
          {/* Badge Recomendada */}
          <div className="absolute -top-3 left-6">
            <span className="px-3 py-1 rounded-full bg-[#12B886] text-[#0A0E12] font-heading font-extrabold text-[10px] uppercase tracking-wider shadow-md flex items-center gap-1">
              <Award className="w-3 h-3" />★ MODELO 1 • RECOMENDADO
            </span>
          </div>

          <div className="pt-2">
            <div className="w-10 h-10 rounded-xl bg-[#12B886]/10 border border-[#12B886]/40 flex items-center justify-center mb-3">
              <Building className="w-5 h-5 text-[#12B886]" />
            </div>

            <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
              Procuração Eletrônica e-CAC / Gov.br
            </h3>
            <p className="text-xs text-[#12B886] font-semibold mt-0.5">
              100% Nativa do Governo Federal • Sem transferência de certificado
            </p>

            <p className="text-xs text-[#93A3B5] mt-3 leading-relaxed">
              A empresa outorga procuração restrita exclusiva para consulta de DF-e à ACP sem
              entregar o arquivo do certificado.
            </p>

            {/* Destaque educativo de segurança */}
            <div className="mt-4 p-3 rounded-xl bg-[#12B886]/10 border border-[#12B886]/30 text-[11px] text-[#F4F7FA] space-y-1">
              <strong className="block text-[#12B886] uppercase font-bold text-[10px]">
                🛡️ Se houver qualquer receio em enviar o A1:
              </strong>
              <span>
                Utilize o Modelo 1! O seu certificado nunca sai da sua empresa e a autorização é
                concedida dentro do portal e-CAC da Receita Federal.
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between">
            <span className="text-[11px] text-[#93A3B5]">Complexidade: Baixa</span>
            <button
              type="button"
              className="text-xs font-bold text-[#12B886] hover:underline flex items-center gap-1"
            >
              <span>Ver Instruções</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* MODELO 2: Portal do Contador (Importação SPED) */}
        <div
          onClick={() => setModeloAtivo('modelo2')}
          className={`cursor-pointer p-6 rounded-2xl border transition-all flex flex-col justify-between ${
            modeloAtivo === 'modelo2'
              ? 'bg-[#16202B] border-[#3B82F6] shadow-lg ring-1 ring-[#3B82F6]'
              : 'bg-[#111820] border-[rgba(244,247,250,0.1)] hover:border-[#3B82F6]/50'
          }`}
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/40 flex items-center justify-center mb-3">
              <FileCode className="w-5 h-5 text-[#3B82F6]" />
            </div>

            <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
              Portal do Contador (SPED Fiscal)
            </h3>
            <p className="text-xs text-[#3B82F6] font-semibold mt-0.5">
              Importação Direta de EFD ICMS/IPI e Contribuições
            </p>

            <p className="text-xs text-[#93A3B5] mt-3 leading-relaxed">
              O contador envia o espelho fiscal ou arquivo SPED mensal (.txt) sem expor senhas nem
              chaves criptográficas privadas.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[11px] text-[#93A3B5] space-y-1">
              <strong className="block text-[#3B82F6] uppercase font-bold text-[10px]">
                📊 Ingestão dos Registros C100 / C170:
              </strong>
              <span>
                Consolidação contábil por período com apuração de créditos de PIS, COFINS, ICMS e
                IPI.
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between">
            <span className="text-[11px] text-[#93A3B5]">Complexidade: Imediata</span>
            <button
              type="button"
              className="text-xs font-bold text-[#3B82F6] hover:underline flex items-center gap-1"
            >
              <span>Importar SPED</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* MODELO 3: Certificado A1 Direto / Gateway Seguro */}
        <div
          onClick={() => setModeloAtivo('modelo3')}
          className={`cursor-pointer p-6 rounded-2xl border transition-all flex flex-col justify-between ${
            modeloAtivo === 'modelo3'
              ? 'bg-[#16202B] border-[#D9B36C] shadow-lg ring-1 ring-[#D9B36C]'
              : 'bg-[#111820] border-[rgba(244,247,250,0.1)] hover:border-[#D9B36C]/50'
          }`}
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#D9B36C]/10 border border-[#D9B36C]/40 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5 text-[#D9B36C]" />
            </div>

            <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
              Certificado A1 Direto / Gateway DF-e
            </h3>
            <p className="text-xs text-[#D9B36C] font-semibold mt-0.5">
              Cofre Criptografado AES-256 • Sincronização em Tempo Real
            </p>

            <p className="text-xs text-[#93A3B5] mt-3 leading-relaxed">
              Upload do arquivo .pfx e senha com custódia estrita Read-Only precedida
              obrigatoriamente do Termo Formal de Sigilo e Revogação Instantânea.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-[#D9B36C]/10 border border-[#D9B36C]/30 text-[11px] text-[#93A3B5] space-y-1">
              <strong className="block text-[#D9B36C] uppercase font-bold text-[10px]">
                🛡️ Garantias Técnicas Vinculadas:
              </strong>
              <span>
                Termo versionado v2026-01, vedação absoluta de emissão e botão de zeramento de
                chave.
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between">
            <span className="text-[11px] text-[#93A3B5]">
              {statusA1?.ativo ? 'Status: Ativo' : 'Status: Não configurado'}
            </span>
            <button
              type="button"
              className="text-xs font-bold text-[#D9B36C] hover:underline flex items-center gap-1"
            >
              <span>Gerenciar Custódia</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA DE EXECUÇÃO DETALHADA DO MODELO SELECIONADO */}

      {/* DETALHES DO MODELO 4: API DE NFS - INTEGRAÇÃO DIRETA COM ERP */}
      {modeloAtivo === 'modelo4' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[#12B886]/40 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(244,247,250,0.1)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#12B886]/10 border border-[#12B886]/40 flex items-center justify-center">
                <Server className="w-5 h-5 text-[#12B886]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#12B886]/20 text-[#12B886] border border-[#12B886]/40">
                  MODELO 4 • INTEGRAÇÃO ERP REST / HTTP
                </span>
                <h3 className="font-heading font-extrabold text-xl text-[#F4F7FA] mt-1">
                  API de NFs — Integração Direta com o ERP da Empresa
                </h3>
              </div>
            </div>

            <Link
              to="/api-docs-nfs"
              target="_blank"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#16202B] border border-[#12B886]/50 text-[#12B886] hover:bg-[#12B886]/10 transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Documentação Completa da API</span>
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-xs text-[#93A3B5] leading-relaxed">
            <strong className="text-[#F4F7FA] block mb-1">
              Como funciona a integração contínua:
            </strong>
            A empresa conecta seu ERP ou sistema fiscal diretamente à plataforma Orbis Protocol e os
            arquivos XML das Notas Fiscais Eletrônicas (NF-e modelo 55 / NFC-e modelo 65) chegam de
            forma contínua, sem necessidade de upload manual. Cada documento recebido é
            automaticamente processado pelo motor fiscal, apurando créditos tributários (PIS,
            COFINS, ICMS, IPI e IBS/CBS da Reforma Tributária) e consumo energético/combustíveis de
            forma soberana e auditável.
          </div>

          {/* Feedback de mensagens da API */}
          {mensagemNfsApi && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                mensagemNfsApi.tipo === 'ok'
                  ? 'bg-[#12B886]/10 border border-[#12B886]/30 text-[#12B886]'
                  : 'bg-[#F03E54]/10 border border-[#F03E54]/30 text-[#F03E54]'
              }`}
            >
              {mensagemNfsApi.tipo === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{mensagemNfsApi.texto}</span>
            </div>
          )}

          {/* GESTÃO DA CHAVE DE API DA EMPRESA */}
          <div className="p-6 rounded-2xl bg-[#0A0E12] border border-[#12B886]/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#12B886]/10 border border-[#12B886]/30 flex items-center justify-center">
                  <Key className="w-4 h-4 text-[#12B886]" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-[#F4F7FA]">
                    Credencial de Acesso da Empresa (X-API-Key)
                  </h4>
                  <p className="text-xs text-[#93A3B5]">
                    CNPJ Vinculado:{' '}
                    <strong className="text-[#F4F7FA] font-mono">
                      {cnpjEmpresa || cnpjA1 || 'CNPJ da Conta'}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Status da Chave */}
              <div>
                {apiKeyNfsAtiva ? (
                  <span className="px-3 py-1 rounded-full bg-[#12B886]/20 border border-[#12B886]/40 text-[#12B886] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Chave Ativa
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-[#F03E54]/20 border border-[#F03E54]/40 text-[#F03E54] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Nenhuma Chave Ativa
                  </span>
                )}
              </div>
            </div>

            {/* Exibição da chave recém-criada (uma única vez com aviso em destaque) */}
            {chaveNfsRecemCriada && (
              <div className="p-4 rounded-xl bg-[#16202B] border-2 border-[#12B886] space-y-3">
                <div className="flex items-center gap-2 text-[#12B886] text-xs font-bold uppercase">
                  <Sparkles className="w-4 h-4" />
                  <span>Chave de API Gerada — Guarde com Segurança</span>
                </div>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  ⚠️ <strong className="text-[#F4F7FA]">Atenção:</strong> Por motivos estritos de
                  segurança, esta chave de API será exibida <strong>apenas uma vez</strong>. Copie e
                  cole no cofre do seu ERP ou arquivo de variáveis de ambiente do seu sistema agora.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0A0E12] border border-[#12B886]/50 font-mono text-xs text-[#12B886] break-all select-all font-bold">
                    {chaveNfsRecemCriada}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopiarChave}
                    className="px-4 py-2.5 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs uppercase tracking-wider hover:bg-[#0CA678] transition-all flex items-center justify-center gap-2 shadow-emerald-glow shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{chaveCopiada ? 'Copiado!' : 'Copiar Chave'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Chave Mascarada e Metadados */}
            {apiKeyNfsAtiva && !chaveNfsRecemCriada && (
              <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.08)] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] block">
                    Chave Ativa
                  </span>
                  <span className="font-mono text-[#F4F7FA] font-bold">
                    {apiKeyNfsAtiva.chave_mascarada || 'orb_nfs_live_...******'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] block">
                    Criada em
                  </span>
                  <span className="text-[#93A3B5] font-mono">
                    {apiKeyNfsAtiva.created ? apiKeyNfsAtiva.created.slice(0, 10) : 'Ativa'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] block">
                    Último Uso
                  </span>
                  <span className="text-[#12B886] font-mono">
                    {apiKeyNfsAtiva.ultimo_uso
                      ? apiKeyNfsAtiva.ultimo_uso.slice(0, 19).replace('T', ' ')
                      : 'Aguardando 1º lote'}
                  </span>
                </div>
              </div>
            )}

            {/* Ações de Chave: Gerar / Regenerar / Revogar */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {!apiKeyNfsAtiva ? (
                <button
                  type="button"
                  disabled={isGerandoApiKeyNfs}
                  onClick={handleGerarOuVerApiKeyNfs}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all flex items-center gap-2 shadow-emerald-glow disabled:opacity-50"
                >
                  <Key className="w-4 h-4" />
                  <span>
                    {isGerandoApiKeyNfs ? 'Gerando Chave...' : 'Gerar Chave de API de NFs'}
                  </span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isGerandoApiKeyNfs}
                    onClick={handleRegenerarApiKeyNfs}
                    className="px-4 py-2 rounded-xl font-semibold text-xs bg-[#16202B] border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-[#12B886] ${isGerandoApiKeyNfs ? 'animate-spin' : ''}`}
                    />
                    <span>Regenerar Chave</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRevogandoApiKeyNfs}
                    onClick={handleRevogarApiKeyNfs}
                    className="px-4 py-2 rounded-xl font-semibold text-xs bg-[#F03E54]/10 border border-[#F03E54]/30 text-[#F03E54] hover:bg-[#F03E54]/20 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isRevogandoApiKeyNfs ? 'Revogando...' : 'Revogar Chave'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* EXEMPLO MÍNIMO DE CHAMADA (CURL / FETCH) */}
          <div className="p-6 rounded-2xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-sm text-[#F4F7FA] flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#12B886]" />
                Exemplo Mínimo de Chamada (cURL / HTTP)
              </h4>
              <span className="text-[11px] font-mono text-[#93A3B5]">
                POST /backend/v1/nfs/lotes
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)] overflow-x-auto">
              <pre className="text-xs text-[#12B886] font-mono leading-relaxed select-all">
                {`curl -X POST "https://www.orbis-protocol.com/backend/v1/nfs/lotes" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${chaveNfsRecemCriada || apiKeyNfsAtiva?.chave_mascarada || 'orb_nfs_live_SEU_TOKEN_AQUI'}" \\
  -d '{
    "documentos": [
      {
        "nome_arquivo": "NF_000123.xml",
        "xml": "<nfeProc xmlns=\\"http://www.portalfiscal.inf.br/nfe\\"><NFe><infNFe Id=\\"NFe35240212345678000190550010000001231000001234\\">...</infNFe></NFe></nfeProc>"
      }
    ]
  }'`}
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#93A3B5]">
              <div className="p-3 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.06)]">
                <strong className="text-[#F4F7FA] block mb-1">Rate Limit</strong>
                Até 60 requisições em lote por minuto por chave de API ativa.
              </div>
              <div className="p-3 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.06)]">
                <strong className="text-[#F4F7FA] block mb-1">Tamanho Máximo</strong>
                Até 100 XMLs de NF-e por requisição (ou 10 MB totais de payload).
              </div>
              <div className="p-3 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.06)]">
                <strong className="text-[#F4F7FA] block mb-1">Sigilo Fiscal Obrigatório</strong>
                O CNPJ da chave deve coincidir com o emitente ou destinatário da nota.
              </div>
            </div>
          </div>

          {/* HISTÓRICO DE LOTES INGERIDOS VIA API */}
          {logsLotesNfs.length > 0 && (
            <div className="space-y-3">
              <h5 className="font-bold text-xs uppercase tracking-wider text-[#93A3B5]">
                Últimos Lotes Recebidos via API ({logsLotesNfs.length})
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[rgba(244,247,250,0.1)] text-[#93A3B5] uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Data/Hora</th>
                      <th className="py-2 px-3">CNPJ</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3 text-right">Recebidos</th>
                      <th className="py-2 px-3 text-right">Aceitos</th>
                      <th className="py-2 px-3 text-right">Rejeitados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA]">
                    {logsLotesNfs.map((item) => (
                      <tr key={item.id} className="hover:bg-[#16202B]/40">
                        <td className="py-2 px-3 text-[#93A3B5] font-mono">
                          {item.created ? item.created.slice(0, 19).replace('T', ' ') : '-'}
                        </td>
                        <td className="py-2 px-3 font-mono text-[#F4F7FA]">
                          {item.cnpj_vinculado}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === 'processado'
                                ? 'bg-[#12B886]/20 text-[#12B886]'
                                : item.status === 'parcial'
                                  ? 'bg-[#D9B36C]/20 text-[#D9B36C]'
                                  : 'bg-[#F03E54]/20 text-[#F03E54]'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {item.total_recebidos}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[#12B886] font-bold">
                          {item.total_aceitos}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[#F03E54]">
                          {item.total_rejeitados}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETALHES DO MODELO 1: PROCURAÇÃO ELETRÔNICA E-CAC */}
      {modeloAtivo === 'modelo1' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[#12B886]/40 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(244,247,250,0.1)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#12B886]/10 border border-[#12B886]/40 flex items-center justify-center">
                <Building className="w-5 h-5 text-[#12B886]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#12B886]/20 text-[#12B886] border border-[#12B886]/40">
                  ROTA RECOMENDADA • MÁXIMA SEGURANÇA
                </span>
                <h3 className="font-heading font-extrabold text-xl text-[#F4F7FA] mt-1">
                  Passo a Passo: Procuração Eletrônica e-CAC / Receita Federal
                </h3>
              </div>
            </div>

            <a
              href="https://cav.receita.fazenda.gov.br/autenticacao/login"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all flex items-center justify-center gap-2 shadow-emerald-glow"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Acessar Portal e-CAC Oficial</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
              <div className="w-6 h-6 rounded-full bg-[#12B886]/20 text-[#12B886] font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="font-bold text-[#F4F7FA] text-xs">Acesse o e-CAC</h4>
              <p className="text-[11px] text-[#93A3B5] leading-relaxed">
                Entre no Portal e-CAC da Receita Federal com o certificado digital da sua empresa ou
                conta Gov.br (Prata/Ouro).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
              <div className="w-6 h-6 rounded-full bg-[#12B886]/20 text-[#12B886] font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="font-bold text-[#F4F7FA] text-xs">Cadastre a Procuração</h4>
              <p className="text-[11px] text-[#93A3B5] leading-relaxed">
                Vá no menu <strong className="text-[#F4F7FA]">"Senhas e Procurações"</strong> &gt;{' '}
                <strong className="text-[#F4F7FA]">"Cadastro de Procuração Eletrônica"</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
              <div className="w-6 h-6 rounded-full bg-[#12B886]/20 text-[#12B886] font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="font-bold text-[#F4F7FA] text-xs">Dados do Outorgado</h4>
              <p className="text-[11px] text-[#93A3B5] leading-relaxed">
                Informe o CNPJ do Bureau ACP:{' '}
                <strong className="text-[#12B886] font-mono block mt-1">
                  76.123.456/0001-00
                </strong>{' '}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
              <div className="w-6 h-6 rounded-full bg-[#12B886]/20 text-[#12B886] font-bold text-xs flex items-center justify-center">
                4
              </div>
              <h4 className="font-bold text-[#F4F7FA] text-xs">Serviço Restrito</h4>
              <p className="text-[11px] text-[#93A3B5] leading-relaxed">
                Marque apenas o serviço{' '}
                <strong className="text-[#F4F7FA]">"Consulta DF-e / SPED Fiscal"</strong>. Não
                marque poderes gerais.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#16202B] border border-[#12B886]/30 flex items-start gap-3 text-xs text-[#93A3B5]">
            <CheckCircle2 className="w-5 h-5 text-[#12B886] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#F4F7FA] block mb-1">
                Conexão Pronta e Auditoria Transparente
              </strong>
              <span>
                Assim que a procuração for cadastrada no e-CAC, o Bureau ACP fará a leitura
                periódica dos seus documentos fiscais. Nenhum arquivo ou senha precisa ser enviado a
                nós!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DETALHES DO MODELO 2: PORTAL DO CONTADOR / IMPORTAÇÃO SPED */}
      {modeloAtivo === 'modelo2' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[#3B82F6]/40 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(244,247,250,0.1)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/40 flex items-center justify-center">
                <FileCode className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40">
                  MODELO 2 • ESPELHO FISCAL SEM CHAVES
                </span>
                <h3 className="font-heading font-extrabold text-xl text-[#F4F7FA] mt-1">
                  Importação de Arquivo SPED Fiscal / Contribuições (.txt)
                </h3>
              </div>
            </div>

            {/* Input escondido para arquivo SPED */}
            <input
              type="file"
              ref={spedInputRef}
              onChange={handleSpedSelecionado}
              accept=".txt,text/plain"
              className="hidden"
            />
            <button
              type="button"
              disabled={isProcessandoSped}
              onClick={() => spedInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                {isProcessandoSped ? 'Processando SPED...' : 'Selecionar Arquivo SPED (.txt)'}
              </span>
            </button>
          </div>

          {/* Feedback de mensagem SPED */}
          {mensagemSped && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                mensagemSped.tipo === 'ok'
                  ? 'bg-[#12B886]/10 border border-[#12B886]/30 text-[#12B886]'
                  : 'bg-[#F03E54]/10 border border-[#F03E54]/30 text-[#F03E54]'
              }`}
            >
              {mensagemSped.tipo === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{mensagemSped.texto}</span>
            </div>
          )}

          {/* Resumo da Importação Atual */}
          {resumoSpedAtual && (
            <div className="p-6 rounded-xl bg-[#0A0E12] border border-[#3B82F6]/30 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-heading font-bold text-sm text-[#F4F7FA] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#12B886]" />
                  Resumo Apurado do SPED: {resumoSpedAtual.razaoSocial} ({resumoSpedAtual.cnpj})
                </h4>
                <span className="text-xs px-2.5 py-0.5 rounded bg-[#3B82F6]/20 text-[#3B82F6] font-mono font-bold">
                  Período: {resumoSpedAtual.periodoApuracao}
                </span>
              </div>

              {/* Cards de Totais Tributários do SPED */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.08)]">
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] block mb-0.5">
                    Docs C100
                  </span>
                  <span className="text-lg font-heading font-black text-[#F4F7FA]">
                    {resumoSpedAtual.totalDocumentos}
                  </span>
                  <span className="text-[10px] text-[#93A3B5] block">
                    {resumoSpedAtual.totalEntradas} ent. / {resumoSpedAtual.totalSaidas} saí.
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.08)]">
                  <span className="text-[10px] uppercase font-bold text-[#F4F7FA] block mb-0.5">
                    Total Faturado
                  </span>
                  <span className="text-lg font-heading font-black text-[#F4F7FA]">
                    {formatCurrencyBRL(resumoSpedAtual.valorTotalDocumentos)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.08)]">
                  <span className="text-[10px] uppercase font-bold text-[#12B886] block mb-0.5">
                    PIS + COFINS
                  </span>
                  <span className="text-lg font-heading font-black text-[#12B886]">
                    {formatCurrencyBRL(
                      resumoSpedAtual.valorPisDestacado + resumoSpedAtual.valorCofinsDestacado,
                    )}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.08)]">
                  <span className="text-[10px] uppercase font-bold text-[#D9B36C] block mb-0.5">
                    ICMS Destacado
                  </span>
                  <span className="text-lg font-heading font-black text-[#D9B36C]">
                    {formatCurrencyBRL(resumoSpedAtual.valorIcmsDestacado)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.08)]">
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] block mb-0.5">
                    IPI Destacado
                  </span>
                  <span className="text-lg font-heading font-black text-[#F4F7FA]">
                    {formatCurrencyBRL(resumoSpedAtual.valorIpiDestacado)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Histórico de SPEDs Anteriores */}
          {historicoSped.length > 0 && (
            <div className="space-y-3">
              <h5 className="font-bold text-xs uppercase tracking-wider text-[#93A3B5]">
                Arquivos SPED Ingeridos Anteriormente ({historicoSped.length})
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[rgba(244,247,250,0.1)] text-[#93A3B5] uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Data Envio</th>
                      <th className="py-2 px-3">Período</th>
                      <th className="py-2 px-3">Tipo SPED</th>
                      <th className="py-2 px-3">Docs</th>
                      <th className="py-2 px-3 text-right">Valor Total</th>
                      <th className="py-2 px-3 text-right">ICMS Destacado</th>
                      <th className="py-2 px-3 text-right">PIS/COFINS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA]">
                    {historicoSped.map((item) => (
                      <tr key={item.id} className="hover:bg-[#16202B]/40">
                        <td className="py-2 px-3 text-[#93A3B5]">
                          {item.created ? item.created.slice(0, 10) : '-'}
                        </td>
                        <td className="py-2 px-3 font-semibold text-[#12B886]">
                          {item.periodo_apuracao}
                        </td>
                        <td className="py-2 px-3 uppercase text-[10px]">{item.tipo_sped}</td>
                        <td className="py-2 px-3 font-mono">{item.total_documentos}</td>
                        <td className="py-2 px-3 text-right font-mono">
                          {formatCurrencyBRL(item.valor_total_documentos || 0)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[#D9B36C]">
                          {formatCurrencyBRL(item.valor_icms_destacado || 0)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[#12B886]">
                          {formatCurrencyBRL(
                            (item.valor_pis_destacado || 0) + (item.valor_cofins_destacado || 0),
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-xs text-[#93A3B5] leading-relaxed">
            💡 <strong>Instrução ao Contador:</strong> O arquivo aceito é o arquivo texto plano
            (.txt) gerado pelo PVA da Receita Federal (EFD ICMS/IPI ou EFD Contribuições). Ao
            importar, os créditos tributários reais são calculados e incorporados ao laudo pericial
            da empresa.
          </div>
        </div>
      )}

      {/* DETALHES DO MODELO 3: CERTIFICADO A1 DIRETO COM TERMO E REVOGAÇÃO */}
      {modeloAtivo === 'modelo3' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[#D9B36C]/40 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(244,247,250,0.1)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D9B36C]/10 border border-[#D9B36C]/40 flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#D9B36C]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D9B36C]/20 text-[#D9B36C] border border-[#D9B36C]/40">
                    MODELO 3 • GATEWAY DF-E / COFRE AES-256
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30">
                    Modo somente leitura (Read-Only)
                  </span>
                </div>
                <h3 className="font-heading font-extrabold text-xl text-[#F4F7FA] mt-1">
                  Custódia Segura de Certificado A1 (.pfx) & Sigilo Fiscal
                </h3>
              </div>
            </div>

            {/* Ações do Topo */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalTermoAberto(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#16202B] border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] flex items-center gap-1.5"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-[#12B886]" />
                <span>Termo de Custódia ({TERMO_CUSTODIA_VERSAO_ATUAL})</span>
              </button>
            </div>
          </div>

          {/* Feedback de mensagens */}
          {mensagemA1 && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                mensagemA1.tipo === 'ok'
                  ? 'bg-[#12B886]/10 border border-[#12B886]/30 text-[#12B886]'
                  : 'bg-[#F03E54]/10 border border-[#F03E54]/30 text-[#F03E54]'
              }`}
            >
              {mensagemA1.tipo === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{mensagemA1.texto}</span>
            </div>
          )}

          {/* CARD DE STATUS DA CUSTÓDIA ATUAL (COM BOTÃO DE REVOGAÇÃO INSTANTÂNEA) */}
          {statusA1 && statusA1.ativo ? (
            <div className="p-6 rounded-2xl bg-[#12B886]/10 border border-[#12B886]/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-[#12B886]">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <h4 className="font-heading font-bold text-base text-[#F4F7FA]">
                      Certificado A1 Ativo sob Custódia Criptografada AES-256
                    </h4>
                    <p className="text-xs text-[#93A3B5]">
                      Operando estritamente em modo Read-Only perante SEFAZ e Receita Federal.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#0A0E12] border border-[#12B886]/30 text-[11px] font-mono text-[#12B886]">
                    Termo: {statusA1.termo_versao || TERMO_CUSTODIA_VERSAO_ATUAL}
                  </span>
                </div>
              </div>

              {/* Trilha de Consentimento e Auditoria */}
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] block">
                    CNPJ Titular
                  </span>
                  <span className="font-mono text-[#F4F7FA] font-bold">
                    {statusA1.cnpj_titular}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] block">
                    Razão Social
                  </span>
                  <span className="text-[#F4F7FA] truncate block">
                    {statusA1.razao_social || 'Cadastrada'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] block">
                    Data/Hora Aceite (UTC)
                  </span>
                  <span className="text-[#F4F7FA] font-mono text-[11px]">
                    {statusA1.consentimento_data_hora
                      ? statusA1.consentimento_data_hora.slice(0, 19).replace('T', ' ')
                      : 'Auditado'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] block">
                    IP Capturado (Server)
                  </span>
                  <span className="text-[#12B886] font-mono font-bold">
                    {statusA1.consentimento_ip || '127.0.0.1'}
                  </span>
                </div>
              </div>

              {/* Card de Metadados do Certificado: Validade e Arquivo */}
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Validade do Certificado */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] block mb-1">
                    Validade do Certificado ICP-Brasil
                  </span>
                  {(() => {
                    const validadeStr = statusA1.validade_certificado
                    if (!validadeStr) {
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#D9B36C] font-semibold">
                            Data de validade a confirmar
                          </span>
                        </div>
                      )
                    }

                    const dataValidade = new Date(validadeStr)
                    const hoje = new Date()
                    const diffMs = dataValidade.getTime() - hoje.getTime()
                    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                    const expirado = diffDias < 0
                    const critico90d = !expirado && diffDias <= 90

                    // Formata data DD/MM/AAAA
                    const dia = String(dataValidade.getUTCDate()).padStart(2, '0')
                    const mes = String(dataValidade.getUTCMonth() + 1).padStart(2, '0')
                    const ano = dataValidade.getUTCFullYear()
                    const dataFormatada = `${dia}/${mes}/${ano}`

                    return (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold text-sm ${
                              expirado
                                ? 'text-[#F03E54]'
                                : critico90d
                                  ? 'text-[#D9B36C]'
                                  : 'text-[#12B886]'
                            }`}
                          >
                            Válido até {dataFormatada}
                          </span>
                          {critico90d && (
                            <span className="px-2 py-0.5 rounded-full bg-[#D9B36C]/20 border border-[#D9B36C]/40 text-[#D9B36C] text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Vence em {diffDias} dias
                            </span>
                          )}
                          {expirado && (
                            <span className="px-2 py-0.5 rounded-full bg-[#F03E54]/20 border border-[#F03E54]/40 text-[#F03E54] text-[10px] font-bold uppercase tracking-wide">
                              Expirado
                            </span>
                          )}
                        </div>
                        {critico90d && (
                          <span className="text-[11px] text-[#D9B36C] block leading-relaxed">
                            ⚠️ Atenção: Certificado próximo do vencimento (menos de 90 dias).
                            Providencie a renovação junto à sua Autoridade Certificadora.
                          </span>
                        )}
                      </div>
                    )
                  })()}
                </div>

                {/* Arquivo .pfx Custodiado */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] block mb-1">
                    Arquivo .pfx em Custódia
                  </span>
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-[#12B886]" />
                    <span className="font-mono text-xs text-[#F4F7FA] truncate">
                      {statusA1.arquivo_pfx || 'Arquivo .pfx custodiado e protegido'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#93A3B5] mt-1 block">
                    Cofre seguro com criptografia AES-256 e acesso restrito Read-Only.
                  </span>
                </div>
              </div>

              {/* Botão de Revogação Instantânea com Zeramento de Chave */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[rgba(244,247,250,0.08)]">
                <div className="text-[11px] text-[#93A3B5]">
                  ⚠️ O acionamento imediato zera as chaves criptográficas em disco/memória e remove
                  os arquivos.
                </div>

                <button
                  type="button"
                  disabled={revogandoA1}
                  onClick={handleRevogarCustodia}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F03E54] text-white hover:bg-[#D63347] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {revogandoA1
                      ? 'Zerando Chave nos Servidores...'
                      : 'Revogar Custódia Instantaneamente'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* Formulário de Upload e Criptografia do Certificado A1 */
            <form onSubmit={handleSalvarCertificadoA1} className="space-y-4">
              {statusA1?.status_custodia === 'revogado' && (
                <div className="p-3.5 rounded-xl bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs text-[#F03E54] flex items-center justify-between gap-2">
                  <span>
                    Custódia anterior revogada pelo titular em{' '}
                    <strong>{statusA1.data_revogacao?.slice(0, 10)}</strong> com zeramento de chave.
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#F03E54]/20 font-bold uppercase text-[10px]">
                    Revogado
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-[#93A3B5] mb-1">
                    CNPJ Titular do Certificado *
                  </label>
                  <input
                    type="text"
                    value={cnpjA1}
                    onChange={(e) => setCnpjA1(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-[#93A3B5] mb-1">
                    Razão Social da Entidade
                  </label>
                  <input
                    type="text"
                    value={razaoA1}
                    onChange={(e) => setRazaoA1(e.target.value)}
                    placeholder="Razão Social Cadastrada"
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-[#93A3B5] mb-1">
                  Senha do Arquivo de Certificado A1 (.pfx) *
                </label>
                <input
                  type="password"
                  value={senhaA1}
                  onChange={(e) => setSenhaA1(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA]"
                />
                <span className="text-[11px] text-[#93A3B5] mt-1 block">
                  A senha é cifrada pelo servidor com algoritmo AES-256 no momento do recebimento e
                  nunca é gravada em texto plano.
                </span>
              </div>

              {/* Upload do Arquivo .pfx / .p12 */}
              <div className="space-y-2">
                <label className="block text-xs uppercase font-bold text-[#93A3B5]">
                  Arquivo do Certificado Digital A1 (.pfx ou .p12)
                </label>

                <input
                  type="file"
                  ref={pfxInputRef}
                  onChange={handleArquivoPfxSelecionado}
                  accept=".pfx,.p12,application/x-pkcs12"
                  className="hidden"
                />

                {!arquivoPfxNome ? (
                  <div
                    onClick={() => pfxInputRef.current?.click()}
                    className="p-5 rounded-xl bg-[#0A0E12] border-2 border-dashed border-[rgba(244,247,250,0.15)] hover:border-[#D9B36C]/60 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#D9B36C]/10 border border-[#D9B36C]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-5 h-5 text-[#D9B36C]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#F4F7FA] block">
                        Clique para selecionar o arquivo .pfx ou .p12
                      </span>
                      <span className="text-[11px] text-[#93A3B5] mt-0.5 block">
                        Padrão ICP-Brasil (e-CNPJ ou e-PJ) • Limite máximo de 5 MB
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#12B886]/10 border border-[#12B886]/40 flex items-center justify-center shrink-0">
                        <FileCheck2 className="w-5 h-5 text-[#12B886]" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-bold text-[#F4F7FA] truncate block">
                          {arquivoPfxNome}
                        </span>
                        <span className="text-[11px] text-[#12B886] block">
                          ✓ Arquivo carregado (
                          {arquivoPfxTamanho ? (arquivoPfxTamanho / 1024).toFixed(1) + ' KB' : 'OK'}
                          ) • Pronto para envio seguro
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoverArquivoPfx}
                      className="px-2.5 py-1 text-[11px] font-bold text-[#F03E54] hover:bg-[#F03E54]/10 rounded border border-[#F03E54]/30 shrink-0"
                    >
                      Remover
                    </button>
                  </div>
                )}
                <span className="text-[11px] text-[#93A3B5] block">
                  O arquivo será gravado no campo seguro <code>arquivo_pfx</code> do cofre da sua
                  conta sob guarda estrita.
                </span>
              </div>

              {/* Termo de Custódia Obrigatório */}
              <div className="p-4 rounded-xl bg-[#16202B] border border-[#12B886]/30 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#F4F7FA]">
                    Termo de Responsabilidade e Custódia do Certificado A1 (
                    {TERMO_CUSTODIA_VERSAO_ATUAL})
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalTermoAberto(true)}
                    className="text-xs text-[#12B886] underline font-semibold hover:text-[#0CA678] flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Ler Termo Completo no Modal</span>
                  </button>
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(statusA1?.termo_lgpd_aceito || termoAceitoDireto)}
                    onChange={(e) => {
                      setTermoAceitoDireto(e.target.checked)
                    }}
                    className="mt-0.5 rounded border-[rgba(244,247,250,0.2)] text-[#12B886] focus:ring-[#12B886] cursor-pointer"
                  />
                  <span className="text-[11px] text-[#93A3B5] leading-relaxed select-none">
                    Declaro ciência e concordância integral com as cláusulas de{' '}
                    <strong className="text-[#F4F7FA]">Objeto Exclusivo</strong>,{' '}
                    <strong className="text-[#12B886]">Modo Estrito Read-Only</strong>, cofre
                    criptográfico e direito de{' '}
                    <strong className="text-[#F4F7FA]">Revogação Instantânea</strong> (MP nº
                    2.200-2/2001, LC nº 105/2001 e Lei 13.709/2018).
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={salvandoA1}
                className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#D9B36C] text-[#0A0E12] hover:bg-[#C9A25B] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {salvandoA1
                    ? 'Cifrando e Salvando...'
                    : 'Assinar Termo e Iniciar Custódia Segura'}
                </span>
              </button>
            </form>
          )}

          {/* Destaque Legal e Normativo */}
          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-[#93A3B5]">
            <div>
              <strong className="text-[#F4F7FA] block mb-0.5">MP nº 2.200-2/2001</strong>
              Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil).
            </div>
            <div>
              <strong className="text-[#F4F7FA] block mb-0.5">LC nº 105/2001</strong>
              Sigilo das operações de instituições financeiras e fiscais.
            </div>
            <div>
              <strong className="text-[#F4F7FA] block mb-0.5">LGPD (Art. 6º, I)</strong>
              Finalidade legítima, específica e explícita informada ao titular.
            </div>
          </div>
        </div>
      )}

      {/* Modal Formal do Termo de Custódia Versionado */}
      <TermoCustodiaA1Modal
        isOpen={modalTermoAberto}
        onClose={() => setModalTermoAberto(false)}
        cnpjEmpresa={cnpjA1 || cnpjEmpresa}
        razaoSocial={razaoA1 || razaoSocial}
        onAceitar={async (versao) => {
          setModalTermoAberto(false)
          setTermoAceitoDireto(true)
          // Se já houver senha preenchida, salva automaticamente
          if (senhaA1 && cnpjA1) {
            setSalvandoA1(true)
            try {
              let validadeExtraidaPb: string | undefined = undefined
              if (arquivoPfxBase64 && senhaA1) {
                try {
                  const resultadoExtracao = extrairMetadadosCertificadoPfx(
                    arquivoPfxBase64,
                    senhaA1,
                  )
                  if (resultadoExtracao.sucesso && resultadoExtracao.validadePocketBase) {
                    validadeExtraidaPb = resultadoExtracao.validadePocketBase
                  }
                } catch (extracaoErr) {
                  console.warn(
                    '[HubConexaoFiscal] Erro na extração client-side via modal (prosseguindo):',
                    extracaoErr,
                  )
                }
              }

              const res = await salvarConfigCertificadoA1({
                cnpj_titular: cnpjA1,
                razao_social: razaoA1,
                senha: senhaA1,
                termo_lgpd_aceito: true,
                termo_versao: versao,
                arquivo_base64: arquivoPfxBase64 || undefined,
                arquivo_nome: arquivoPfxNome || undefined,
                validade_certificado: validadeExtraidaPb,
              })
              setMensagemA1({ tipo: 'ok', texto: res.mensagem })
              setSenhaA1('')
              setArquivoPfxBase64(null)
              setArquivoPfxNome(null)
              setArquivoPfxTamanho(null)
              if (pfxInputRef.current) pfxInputRef.current.value = ''
              await recarregarDados()
            } catch (err: any) {
              setMensagemA1({ tipo: 'erro', texto: err.message || 'Erro ao registrar credencial.' })
            } finally {
              setSalvandoA1(false)
            }
          } else {
            // Apenas atualiza o estado de aceite local
            setStatusA1({
              id: statusA1?.id || '',
              cnpj_titular: cnpjA1,
              razao_social: razaoA1,
              ativo: false,
              termo_lgpd_aceito: true,
              termo_versao: versao,
              consentimento_data_hora: new Date().toISOString(),
              consentimento_ip: 'Capturado pelo servidor no envio',
            })
            setMensagemA1({
              tipo: 'ok',
              texto: `Termo de Custódia (${versao}) aceito com sucesso! Preencha a senha e selecione o arquivo .pfx caso ainda não o tenha feito.`,
            })
          }
        }}
      />
    </div>
  )
}
