import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Building,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Award,
  Store,
  FileCheck2,
  Percent,
} from 'lucide-react'

export default function BureauACP() {
  const beneficios = [
    'Diagnóstico simplificado e 100% online para empresas paranaenses de comércio e serviços',
    'Condições financeiras subsidiadas exclusivas para associados ativos da Associação Comercial do Paraná (ACP)',
    'Concessão do Selo Oficial de Sustentabilidade ACP/IBESG com QR Code verificável para exibição em lojas e redes sociais',
    'Redução de spread bancário e linhas de crédito verde através de cooperativas regionais parceiras',
    'Adequação preventiva aos requisitos do Novo IVA e rastreabilidade fiscal',
  ]

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <Link
            to="/solucoes"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#93A3B5] hover:text-[#12B886] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Hub de Soluções</span>
          </Link>
        </div>

        {/* Hero Card */}
        <div className="p-8 sm:p-12 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] mb-12 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-xs font-bold tracking-wider uppercase mb-4">
              <Building className="w-3.5 h-3.5" />
              ACP (PARANÁ) + IBESG
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl md:text-5xl text-[#F4F7FA] tracking-wide mb-4">
              BUREAU ACP PARANÁ
            </h1>

            <p className="text-base sm:text-lg text-[#12B886] font-medium mb-4">
              A porta de entrada definitiva da sustentabilidade para o comércio, varejo e serviços
              do Paraná.
            </p>

            <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed mb-8">
              Desenvolvido em parceria institucional entre a Associação Comercial do Paraná (ACP) e
              o Instituto Brasileiro de Governança e Sustentabilidade (IBESG), o Bureau ACP permite
              que micro, pequenas e médias empresas realizem sua auditoria climática preliminar e
              obtenham o Selo Oficial de Sustentabilidade sem complexidade burocrática.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/diagnostico"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
              >
                <span>Iniciar Diagnóstico com Subsídio ACP</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
            <h2 className="font-heading font-bold text-xl text-[#F4F7FA] mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D9B36C]" />
              VANTAGENS PARA ASSOCIADOS ACP
            </h2>
            <div className="space-y-4">
              {beneficios.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-[#93A3B5]">
                  <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] flex flex-col justify-between">
            <div>
              <h2 className="font-heading font-bold text-xl text-[#F4F7FA] mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-[#12B886]" />
                COMO FUNCIONA O SELO NA PRÁTICA
              </h2>
              <p className="text-sm text-[#93A3B5] leading-relaxed mb-4">
                Após preencher o diagnóstico por CNPJ e selecionar o vínculo{' '}
                <strong>Associado ACP</strong>, a organização recebe um protocolo autenticado. Ao
                término da auditoria, é emitido o Selo Digital Orbis + ACP, com QR Code apontando
                diretamente para o Verificador Público de Selos.
              </p>
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] text-xs text-[#93A3B5] space-y-2">
                <div className="flex justify-between">
                  <span>Tempo médio de emissão:</span>
                  <span className="font-semibold text-[#F4F7FA]">Até 48 horas úteis</span>
                </div>
                <div className="flex justify-between">
                  <span>Validade do Selo:</span>
                  <span className="font-semibold text-[#12B886]">24 meses renováveis</span>
                </div>
                <div className="flex justify-between">
                  <span>Abrangência:</span>
                  <span className="font-semibold text-[#D9B36C]">Estadual e Nacional</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                to="/verificador"
                className="text-xs font-semibold text-[#12B886] hover:underline flex items-center gap-1"
              >
                <span>Conferir exemplo de selo ativo no Verificador Público</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
