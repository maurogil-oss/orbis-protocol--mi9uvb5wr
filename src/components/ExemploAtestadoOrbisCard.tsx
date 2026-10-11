import React from 'react'
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Lock,
  QrCode,
  FileCheck,
  Sparkles,
} from 'lucide-react'

export interface ExemploAtestadoOrbisCardProps {
  className?: string
}

/**
 * Card com reprodução simplificada de um Atestado Orbis (com ART/RRT) montado a partir de NF-e.
 * Regras:
 * - Marcado VISIVELMENTE com os selos "Exemplo" e "Documento ilustrativo"
 * - Termo oficial: "Atestado Orbis (com ART/RRT)"
 * - PROIBIDO: "Certificado", "Certificação", "Selo Oficial"
 * - Sem dados reais de cliente sensíveis; referenciando a estrutura do lote VERTEC-IW29-2022
 * - Tipografia mínima >= 12px e contraste >= 4.5:1
 */
export function ExemploAtestadoOrbisCard({ className = '' }: ExemploAtestadoOrbisCardProps) {
  return (
    <div
      aria-label="Exemplo de Atestado Orbis montado a partir de NF-e"
      className={`relative rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm hover:border-emerald-600/40 dark:hover:border-[#059669]/50 transition-all ${className}`}
    >
      {/* Faixa de Destaque Superior: Marcado visivelmente com selos Exemplo e Documento ilustrativo */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-xs">
            <span
              className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400"
              aria-hidden="true"
            />
            Exemplo
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
            Documento ilustrativo
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-700 dark:text-[#059669] font-semibold">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Estrutura NF-e → dMRV</span>
        </div>
      </div>

      {/* Cabeçalho do Atestado */}
      <div className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#94A3B8] block mb-1">
              Registro Documental Oficial
            </span>
            <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-[#F8FAFC] leading-snug">
              Atestado Orbis (com ART/RRT)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Verificação pericial de descarbonização e conformidade de lastro baseada em NF-e
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#059669]/15 border border-emerald-200 dark:border-[#059669]/40 flex items-center justify-center text-emerald-700 dark:text-[#059669] shrink-0 shadow-xs">
            <FileCheck className="w-6 h-6 stroke-[1.8]" />
          </div>
        </div>

        {/* Metadados Técnicos do Exemplo (baseado no lote VERTEC-IW29-2022 sem dados sensíveis) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono text-slate-500 dark:text-[#94A3B8] uppercase block mb-1">
              Lote de Referência dMRV
            </span>
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-[#F8FAFC] block">
              VERTEC-IW29-2022
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 block">
              NF-e modelo 55 • Painel sanduíche termoacústico
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono text-slate-500 dark:text-[#94A3B8] uppercase block mb-1">
              Anotação de Responsabilidade
            </span>
            <span className="font-mono font-bold text-sm text-emerald-700 dark:text-[#059669] block">
              ART/RRT Homologada
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 block">
              Engenharia / Perícia técnica credenciada
            </span>
          </div>
        </div>

        {/* Métricas Auditadas */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-[#94A3B8] pb-2 border-b border-slate-200 dark:border-slate-800">
            <span>MÉTRICAS APURADAS DO LOTE</span>
            <span className="text-emerald-700 dark:text-[#059669] font-bold">100% AUDITÁVEL</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-[#94A3B8] block mb-1">
                CO₂e Evitado
              </span>
              <span className="font-heading font-black text-sm sm:text-base text-emerald-700 dark:text-[#059669] block">
                1.223,22 kg
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-[#94A3B8] block mb-1">
                Massa Circular
              </span>
              <span className="font-heading font-black text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC] block">
                2.134,08 kg
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-[#94A3B8] block mb-1">
                Intensidade
              </span>
              <span className="font-heading font-black text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC] block">
                0,040 kg/R$
              </span>
            </div>
          </div>
        </div>

        {/* Hash Criptográfico e Chave Canônica */}
        <div className="space-y-2 pt-1">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 dark:text-[#D9B36C] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-0.5">
                Hash SHA-256 Canônico do Atestado
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-[#94A3B8] break-all block">
                sha256:7f9c2d1b84e03a56...c4e92a11b084df9e
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé do Exemplo com Aviso Probatório */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0" />
            <span>Verificável via QR Code dinâmico no Verificador Orbis</span>
          </div>
          <span className="text-xs font-medium text-amber-700 dark:text-[#D9B36C]">
            Reprodução para fins de demonstração técnica
          </span>
        </div>
      </div>
    </div>
  )
}

export default ExemploAtestadoOrbisCard
