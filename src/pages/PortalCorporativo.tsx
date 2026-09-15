import React from 'react'
import { Link } from 'react-router-dom'
import {
  FileSpreadsheet,
  Database,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Server,
  Cpu,
  BarChart4,
  Lock,
} from 'lucide-react'

export default function PortalCorporativo() {
  const recursos = [
    {
      titulo: 'Ingestão Automatizada de SPED / XML NF-e',
      desc: 'Processamento em massa de notas fiscais de entrada e saída. Classificação automática de insumos por CFOP e NCM para cálculo de fatores de emissão oficiais MCTI/IPCC.',
    },
    {
      titulo: 'Integração Nativa com ERPs Enterprise',
      desc: 'Conectores prontos para SAP S/4HANA, Totvs Protheus, Senior e Oracle Cloud via REST API e webhook seguro.',
    },
    {
      titulo: 'Relatórios Prontos para IFRS S2 e CVM 244',
      desc: 'Exportação padronizada de demonstrativos climáticos auditáveis para o mercado de capitais e comitês de auditoria estatutários.',
    },
    {
      titulo: 'Rastreabilidade de Escopos 1, 2 e 3 em Tempo Real',
      desc: 'Painel executivo com dashboards consolidados por planta industrial, centro de custo, linha de produção ou unidade de negócio.',
    },
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
              <Server className="w-3.5 h-3.5" />
              PORTAL ENTERPRISE • IFRS S2 & SPED
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl md:text-5xl text-[#F4F7FA] tracking-wide mb-4">
              PORTAL CORPORATIVO ORBIS
            </h1>

            <p className="text-base sm:text-lg text-[#12B886] font-medium mb-4">
              Infraestrutura de dados de auditoria climática em larga escala para indústrias e
              holdings.
            </p>

            <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed mb-8">
              Desenvolvido para atender aos departamentos fiscais, de controladoria e de
              sustentabilidade de grandes corporações, o Portal Corporativo substitui planilhas
              manuais vulneráveis por uma esteira contínua de ingestão de documentos fiscais e
              emissão de atestados de conformidade.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/diagnostico"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
              >
                <span>Cadastrar Empresa no Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold border border-[rgba(244,247,250,0.25)] text-[#F4F7FA] hover:border-[#12B886] transition-all"
              >
                <span>Acesso Gestor Corporativo</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {recursos.map((rec, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] hover:border-[#12B886]/50 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#16202B] border border-[rgba(244,247,250,0.1)] flex items-center justify-center text-[#12B886] mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="font-heading font-bold text-lg text-[#F4F7FA] mb-2">{rec.titulo}</h2>
              <p className="text-sm text-[#93A3B5] leading-relaxed">{rec.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
