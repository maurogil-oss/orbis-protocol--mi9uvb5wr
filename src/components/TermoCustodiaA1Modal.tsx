import React, { useState } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  FileCheck2,
  X,
  AlertTriangle,
  Scale,
  ScrollText,
  KeyRound,
  EyeOff,
  CheckCircle2,
} from 'lucide-react'

export const TERMO_CUSTODIA_VERSAO_ATUAL = 'v2026-01'

interface TermoCustodiaA1ModalProps {
  isOpen: boolean
  onClose: () => void
  onAceitar: (versao: string) => void
  cnpjEmpresa?: string
  razaoSocial?: string
}

export const TermoCustodiaA1Modal: React.FC<TermoCustodiaA1ModalProps> = ({
  isOpen,
  onClose,
  onAceitar,
  cnpjEmpresa,
  razaoSocial,
}) => {
  const [leuAteOFim, setLeuAteOFim] = useState(false)
  const [concordoObjeto, setConcordoObjeto] = useState(false)
  const [concordoReadOnly, setConcordoReadOnly] = useState(false)
  const [concordoCriptografia, setConcordoCriptografia] = useState(false)
  const [concordoRevogacao, setConcordoRevogacao] = useState(false)

  if (!isOpen) return null

  const todosConcordados =
    concordoObjeto && concordoReadOnly && concordoCriptografia && concordoRevogacao

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      setLeuAteOFim(true)
    }
  }

  const handleConfirmar = () => {
    if (!todosConcordados) return
    onAceitar(TERMO_CUSTODIA_VERSAO_ATUAL)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0E141B] border border-[#12B886]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="p-5 sm:p-6 border-b border-[rgba(244,247,250,0.1)] bg-[#111820] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#12B886]/10 border border-[#12B886]/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#12B886]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#12B886]/20 text-[#12B886] border border-[#12B886]/40">
                  Documento Jurídico Vinculante • {TERMO_CUSTODIA_VERSAO_ATUAL}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40">
                  Modo Somente Leitura (Read-Only)
                </span>
              </div>
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#F4F7FA] mt-1">
                TERMO DE RESPONSABILIDADE, SIGILO FISCAL E CUSTÓDIA DO CERTIFICADO DIGITAL A1
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Rolagem e Cláusulas Legais Formais */}
        <div
          onScroll={handleScroll}
          className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-[#93A3B5] leading-relaxed font-sans"
        >
          {/* Identificação das Partes */}
          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
            <h4 className="font-bold text-[#F4F7FA] text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-[#12B886]" />
              Identificação das Partes
            </h4>
            <p>
              Pelo presente instrumento particular, de um lado a empresa titular cadastrada{' '}
              <strong className="text-[#F4F7FA]">{razaoSocial || 'ORGANIZAÇÃO TITULAR'}</strong>,
              inscrita no CNPJ sob o nº{' '}
              <strong className="text-[#12B886] font-mono">
                {cnpjEmpresa || '00.000.000/0000-00'}
              </strong>{' '}
              (doravante denominada tão-somente <strong>"TITULAR"</strong>), e de outro lado o{' '}
              <strong className="text-[#F4F7FA]">
                ORBIS PROTOCOL / BUREAU DE INTELIGÊNCIA & COMPLIANCE FISCAL ACP
              </strong>{' '}
              (doravante denominado <strong>"CUSTODIANTE"</strong>), celebram o presente Termo sob
              as cláusulas e condições seguintes:
            </p>
          </div>

          {/* Cláusula 1: Objeto e Finalidade Exclusiva */}
          <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.08)] space-y-2">
            <h4 className="font-bold text-[#F4F7FA] text-xs uppercase flex items-center gap-2 text-[#12B886]">
              <FileCheck2 className="w-4 h-4" />
              Cláusula 1ª — Do Objeto e Finalidade Exclusiva
            </h4>
            <p>
              O TITULAR outorga autorização restrita e vinculada ao CUSTODIANTE para a utilização
              técnica do Certificado Digital padrão ICP-Brasil (Modelo A1 - .pfx) para a{' '}
              <strong className="text-[#F4F7FA]">
                exclusiva finalidade de consulta, sincronização e download de Documentos Fiscais
                Eletrônicos (DF-e)
              </strong>
              , compreendendo estritamente: NF-e (Modelo 55), NFC-e (Modelo 65), CT-e (Modelo 57),
              MDF-e (Modelo 58), NFS-e e eventos associados, junto aos Web Services da Secretaria da
              Fazenda (SEFAZ), Receita Federal do Brasil (RFB) e Ambientes Nacionais Autorizadores.
            </p>
            <p className="text-[11px] text-[#93A3B5]/80">
              § Único: A guarda e o processamento restringem-se à apuração de créditos tributários
              reais (IBS, CBS, PIS, COFINS, ICMS, IPI) e à alimentação do Motor Pericial de Emissões
              de Gases de Efeito Estufa (Escopos 1, 2 e 3) e Passaportes ESG.
            </p>
          </div>

          {/* Cláusula 2: Vedação Absoluta de Emissão (Read-Only) */}
          <div className="p-4 rounded-xl bg-[#F03E54]/5 border border-[#F03E54]/30 space-y-2">
            <h4 className="font-bold text-[#F03E54] text-xs uppercase flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Cláusula 2ª — Da Vedação Absoluta de Emissão (Modo Estrito Read-Only)
            </h4>
            <p className="text-[#F4F7FA]">
              O CUSTODIANTE declara de maneira irrevogável, irretratável e auditável que sua
              infraestrutura tecnológica opera{' '}
              <strong className="text-[#12B886] underline">
                EXCLUSIVAMENTE EM MODO DE SOMENTE LEITURA (READ-ONLY)
              </strong>
              .
            </p>
            <p>
              É <strong>terminantemente e tecnicamente vedada</strong> a utilização da chave privada
              do certificado para:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-[#93A3B5]">
              <li>Emissão ou assinatura de novas notas fiscais ou faturas de qualquer natureza;</li>
              <li>Cancelamento ou carta de correção de documentos emitidos por terceiros;</li>
              <li>Alteração de dados cadastrais perante quaisquer órgãos públicos;</li>
              <li>
                Transação bancária, financeira, cambial ou movimentação de valores patrimoniais;
              </li>
              <li>
                Assinatura de contratos ou assunção de quaisquer obrigações em nome do TITULAR.
              </li>
            </ul>
          </div>

          {/* Cláusula 3: Armazenamento e Criptografia */}
          <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.08)] space-y-2">
            <h4 className="font-bold text-[#F4F7FA] text-xs uppercase flex items-center gap-2 text-[#D9B36C]">
              <Lock className="w-4 h-4" />
              Cláusula 3ª — Do Armazenamento em Cofre e Criptografia Segura
            </h4>
            <p>
              O arquivo de certificado digital e sua respectiva senha de abertura são armazenados em
              cofre digital de segurança criptográfica no servidor com padrão de algoritmo{' '}
              <strong className="text-[#F4F7FA]">AES-256 (Advanced Encryption Standard)</strong>.
            </p>
            <p>
              Garante-se a{' '}
              <strong className="text-[#F4F7FA]">segregação lógica estrita de credenciais</strong>{' '}
              por organização/CNPJ. É expressamente vedado qualquer tipo de acesso visual ou humano
              à senha em texto claro por parte de peritos, engenheiros, operadores de suporte ou
              administradores do sistema.
            </p>
          </div>

          {/* Cláusula 4: Revogação e Exclusão Instantânea */}
          <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.08)] space-y-2">
            <h4 className="font-bold text-[#F4F7FA] text-xs uppercase flex items-center gap-2 text-[#3B82F6]">
              <KeyRound className="w-4 h-4" />
              Cláusula 4ª — Do Direito de Revogação e "Zeramento de Chave" Instantâneo
            </h4>
            <p>
              O TITULAR tem a prerrogativa soberana de rescindir a custódia a qualquer instante,
              mediante acionamento do botão <strong>"Revogar Custódia"</strong> disponível no painel
              autenticado.
            </p>
            <p>
              O comando deflagra a rotina imediata de{' '}
              <strong className="text-[#F4F7FA]">zeramento de chave criptográfica</strong>{' '}
              (sobrescrita de memória e exclusão permanente do arquivo .pfx e da credencial nos
              bancos de dados do servidor), além do registro com protocolo rastreável de auditoria
              na Trilha de Conformidade LGPD.
            </p>
          </div>

          {/* Fundamentação Legal e Rodapé */}
          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] text-[11px] text-[#93A3B5] space-y-1">
            <div className="flex items-center gap-2 font-bold text-[#F4F7FA] uppercase tracking-wider mb-1">
              <Scale className="w-3.5 h-3.5 text-[#12B886]" />
              Base Legal & Normas de Conformidade
            </div>
            <p>
              • <strong>Medida Provisória nº 2.200-2/2001:</strong> Institui a Infraestrutura de
              Chaves Públicas Brasileira (ICP-Brasil).
            </p>
            <p>
              • <strong>Lei Complementar nº 105/2001:</strong> Dispõe sobre o sigilo das operações
              de instituições e dever de confidencialidade fiscal.
            </p>
            <p>
              • <strong>Lei Federal nº 13.709/2018 (LGPD - Art. 6º, I e Art. 7º, V):</strong>{' '}
              Princípios de finalidade estrita, adequação, necessidade e segurança da informação.
            </p>
          </div>

          {/* Checkboxes Obrigatórios de Consentimento */}
          <div className="space-y-3 pt-2">
            <h5 className="font-bold text-[#F4F7FA] text-xs uppercase tracking-wider">
              Declarações Expressas do Titular (Marque para Prosseguir)
            </h5>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)] cursor-pointer hover:border-[#12B886]/40 transition-colors">
              <input
                type="checkbox"
                checked={concordoObjeto}
                onChange={(e) => setConcordoObjeto(e.target.checked)}
                className="mt-0.5 rounded border-[rgba(244,247,250,0.2)] text-[#12B886] focus:ring-[#12B886]"
              />
              <span className="text-[11px] text-[#F4F7FA]">
                Autorizo estritamente a consulta e o download de documentos fiscais eletrônicos
                (NF-e/NFC-e/CT-e/NFS-e) para apuração de créditos tributários e inventário pericial
                de emissões (Cláusula 1ª).
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)] cursor-pointer hover:border-[#12B886]/40 transition-colors">
              <input
                type="checkbox"
                checked={concordoReadOnly}
                onChange={(e) => setConcordoReadOnly(e.target.checked)}
                className="mt-0.5 rounded border-[rgba(244,247,250,0.2)] text-[#12B886] focus:ring-[#12B886]"
              />
              <span className="text-[11px] text-[#F4F7FA]">
                Estou ciente de que o sistema opera em modo{' '}
                <strong>Read-Only (somente leitura)</strong>, sendo tecnicamente impedido de emitir
                notas, alterar cadastros ou transacionar valores (Cláusula 2ª).
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)] cursor-pointer hover:border-[#12B886]/40 transition-colors">
              <input
                type="checkbox"
                checked={concordoCriptografia}
                onChange={(e) => setConcordoCriptografia(e.target.checked)}
                className="mt-0.5 rounded border-[rgba(244,247,250,0.2)] text-[#12B886] focus:ring-[#12B886]"
              />
              <span className="text-[11px] text-[#F4F7FA]">
                Concordo com o armazenamento da credencial em cofre criptografado AES-256 com
                segregação lógica e vedação de acesso visual humano à senha (Cláusula 3ª).
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)] cursor-pointer hover:border-[#12B886]/40 transition-colors">
              <input
                type="checkbox"
                checked={concordoRevogacao}
                onChange={(e) => setConcordoRevogacao(e.target.checked)}
                className="mt-0.5 rounded border-[rgba(244,247,250,0.2)] text-[#12B886] focus:ring-[#12B886]"
              />
              <span className="text-[11px] text-[#F4F7FA]">
                Estou ciente de que posso acionar o botão de revogação instantânea com "zeramento de
                chave" a qualquer momento no painel (Cláusula 4ª).
              </span>
            </label>
          </div>
        </div>

        {/* Rodapé de Ação */}
        <div className="p-4 sm:p-5 border-t border-[rgba(244,247,250,0.1)] bg-[#111820] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-[#93A3B5]">
            Registro de Aceite: Data/Hora UTC e IP capturados server-side para a trilha oficial de
            conformidade.
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!todosConcordados}
              onClick={handleConfirmar}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aceitar Termo e Prosseguir ({TERMO_CUSTODIA_VERSAO_ATUAL})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
