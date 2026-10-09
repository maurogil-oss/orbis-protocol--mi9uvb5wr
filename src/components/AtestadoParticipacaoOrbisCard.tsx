import React, { useRef } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  Award,
  Hash,
  ExternalLink,
  Printer,
  Calendar,
  Building,
  UserCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { RegistroAtestadoParticipacao } from '@/services/orbisEducacaoService'
import { QRCodeSVG } from '@/components/QRCodeSVG'

interface Props {
  atestado: RegistroAtestadoParticipacao
  onImprimir?: () => void
}

export function AtestadoParticipacaoOrbisCard({ atestado, onImprimir }: Props) {
  const atestadoRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (onImprimir) {
      onImprimir()
    } else {
      window.print()
    }
  }

  const urlVerificacao = `${window.location.origin}/verificador?codigo=${encodeURIComponent(
    atestado.codigo_atestado,
  )}`

  return (
    <div className="space-y-4 max-w-2xl mx-auto animate-fade-in text-left">
      {/* Botões de Ação */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs font-semibold text-emerald-600 dark:text-[#12B886] flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          Atestado de Participação Emitido com Sucesso
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#16202B] dark:hover:bg-[#1E2C3D] text-slate-800 dark:text-[#F4F7FA] border border-slate-200 dark:border-[rgba(244,247,250,0.12)] flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir / Salvar PDF
          </button>
          <Link
            to={`/verificador?codigo=${encodeURIComponent(atestado.codigo_atestado)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Verificar Hash
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* DOCUMENTO OFICIAL: Atestado de Participação Orbis */}
      <div
        ref={atestadoRef}
        id="atestado-participacao-print"
        className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] text-slate-900 dark:text-[#F4F7FA] border-2 border-emerald-500/40 shadow-xl relative overflow-hidden"
      >
        {/* Marca d'água sutil */}
        <div className="absolute right-4 -bottom-6 pointer-events-none opacity-5 dark:opacity-5 text-emerald-600 select-none">
          <Award className="w-72 h-72" />
        </div>

        {/* Cabeçalho do Atestado */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-[rgba(244,247,250,0.1)] pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-[#12B886] border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                ORBIS EDUCAÇÃO • PROGRAMA DE FORMAÇÃO
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-[#F4F7FA]">
              ATESTADO DE PARTICIPAÇÃO ORBIS
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#93A3B5] mt-0.5">
              Prova documental de engajamento em sustentabilidade, economia circular e conformidade.
            </p>
          </div>

          <div className="hidden sm:block shrink-0 pl-3">
            <QRCodeSVG value={urlVerificacao} size={72} />
          </div>
        </div>

        {/* Corpo do Atestado */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-[#CBD5E1] leading-relaxed">
          <p>
            Atestamos para os devidos fins de prova documental e registro histórico que{' '}
            <strong className="text-slate-900 dark:text-white text-base font-bold underline decoration-emerald-500 decoration-2">
              {atestado.nome_participante}
            </strong>
            {atestado.documento_identificador && (
              <span>
                {' '}
                (Doc/CNPJ:{' '}
                <span className="font-mono text-emerald-700 dark:text-[#12B886] font-semibold">
                  {atestado.documento_identificador}
                </span>
                )
              </span>
            )}
            , concluiu com aproveitamento a trilha formativa do programa{' '}
            <strong className="text-slate-900 dark:text-white">Orbis Educação</strong>, composta por
            lições aplicadas de pegada de carbono da nota fiscal, transição tributária (reforma
            IBS/CBS), diretrizes da Política Nacional de Resíduos Sólidos (PNRS), economia circular
            e eficiência energética de pequenos negócios e comunidades escolares.
          </p>

          {atestado.escola_nome && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] flex items-center gap-2.5">
              <Building className="w-4 h-4 text-emerald-600 dark:text-[#12B886] shrink-0" />
              <span className="text-xs">
                Unidade Escolar Vinculada:{' '}
                <strong className="text-slate-900 dark:text-white">{atestado.escola_nome}</strong>
                {atestado.turma_grau ? ` • Turma/Grau: ${atestado.turma_grau}` : ''}
              </span>
            </div>
          )}

          {/* Dados Técnicos de Verificação com Hash */}
          <div className="pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1220] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] space-y-2">
              <div className="flex flex-wrap items-center justify-between text-[11px] gap-2">
                <span className="text-slate-500 dark:text-[#93A3B5] flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-[#12B886]" />
                  Código do Atestado:
                </span>
                <span className="font-mono font-bold text-emerald-700 dark:text-[#12B886] text-xs">
                  {atestado.codigo_atestado}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1">
                <span className="text-slate-500 dark:text-[#93A3B5] flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-amber-500" />
                  Hash SHA-256 Verificável:
                </span>
                <span className="font-mono text-[10px] break-all sm:text-right text-slate-800 dark:text-[#D9B36C]">
                  {atestado.hash_sha256}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-[rgba(244,247,250,0.06)]">
                <span className="text-slate-500 dark:text-[#93A3B5] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Data de Emissão (UTC):
                </span>
                <span className="font-mono text-slate-700 dark:text-[#CBD5E1]">
                  {new Date(atestado.data_emissao).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé e Nota Canônica de Honestidade */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-[#93A3B5]">
          <p className="text-center sm:text-left">
            Orbis Protocol • Infraestrutura de Prova Documental da Economia Circular — dMRV.
            <br />
            <span className="italic text-[10px] text-slate-400 dark:text-slate-500">
              Documento probatório de participação educacional. Não constitui título de crédito de
              carbono ou benefício fiscal financeiro.
            </span>
          </p>

          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-[#12B886] font-semibold text-xs shrink-0">
            <UserCheck className="w-4 h-4" />
            <span>Verificável no Portal Orbis</span>
          </div>
        </div>
      </div>
    </div>
  )
}
