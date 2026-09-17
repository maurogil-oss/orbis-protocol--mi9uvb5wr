import React from 'react'
import { Link } from 'react-router-dom'
import {
  Car,
  BatteryCharging,
  Recycle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  QrCode,
  FileCheck,
} from 'lucide-react'

export default function CaseCDVerde() {
  const pilaresCase = [
    {
      titulo: 'Desmontagem de Veículos em Fim de Vida (VFV)',
      desc: 'Rastreio do veículo baixado no DETRAN até a separação técnica de carcaça ferrosa, fluidos contaminantes e peças reaproveitáveis.',
    },
    {
      titulo: 'Passaporte Digital de Produto (DPP) & QR Code',
      desc: 'Etiquetagem criptográfica de peças verdes com QR Code exclusivo, vinculando número do chassi de origem, laudo de segurança e nota fiscal.',
    },
    {
      titulo: 'Segunda Vida de Baterias Elétricas & Híbridas',
      desc: 'Protocolo de diagnóstico de degradação das células de tração (SoH), viabilizando reutilização em sistemas estacionários de energia solar.',
    },
    {
      titulo: 'Dossiê Preparatório para Créditos do Programa MOVER',
      desc: 'Geração de atestados preparatórios de reciclabilidade automotiva para instrução de desconto e crédito fiscal de IPI sob a Lei 14.902/2024 para o setor automotivo.',
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
              <Car className="w-3.5 h-3.5" />
              CASE DE SUCESSO • PROGRAMA MOVER & DETRAN
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl md:text-5xl text-[#F4F7FA] tracking-wide mb-4">
              CASE CDVERDE • ECONOMIA CIRCULAR VEICULAR
            </h1>

            <p className="text-base sm:text-lg text-[#12B886] font-medium mb-4">
              A maior rede de comprovação probatória de peças verdes e baterias reaproveitadas do
              Brasil.
            </p>

            <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed mb-8">
              O projeto CDVerde conecta Centros de Desmontagem Veicular (CDVs credenciados),
              seguradoras, frotistas e montadoras ao ecossistema do Orbis Protocol, transformando a
              sucata automotiva em ativos rastreados, peças certificadas e créditos fiscais de
              descarbonização.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap">
              <Link
                to="/diagnostico"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
              >
                <span>Cadastrar CDV / Desmanche Credenciado</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/passaporte/PR-SEAL-2026-991823"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#16202B] border border-[#12B886]/40 text-[#12B886] hover:bg-[#12B886]/10 transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>Passaporte DPP Peça</span>
              </Link>
              <Link
                to="/passaporte-lote/h1dpr8wniludemh"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#16202B] border border-[#D9B36C]/40 text-[#D9B36C] hover:bg-[#D9B36C]/10 transition-all"
              >
                <FileCheck className="w-4 h-4" />
                <span>DPP Consolidado Real (Gol)</span>
              </Link>
              <Link
                to="/passaporte-lote/12401050711"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#16202B] border border-[#60A5FA]/40 text-[#60A5FA] hover:bg-[#60A5FA]/10 transition-all"
              >
                <FileCheck className="w-4 h-4" />
                <span>DPP Lote Demo (Renault Clio • 49 peças)</span>
              </Link>
              <Link
                to="/api-docs-cdv"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#12B886]/15 border border-[#12B886]/50 text-[#12B886] hover:bg-[#12B886]/25 transition-all"
              >
                <FileCheck className="w-4 h-4" />
                <span>Documentação API v1 (CDV)</span>
              </Link>
              <Link
                to="/painel"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold border border-[rgba(244,247,250,0.25)] text-[#F4F7FA] hover:border-[#12B886] transition-all"
              >
                <span>Módulo Operacional & Console CDV</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {pilaresCase.map((p, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] hover:border-[#12B886]/50 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#16202B] border border-[rgba(244,247,250,0.1)] flex items-center justify-center text-[#12B886] mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="font-heading font-bold text-lg text-[#F4F7FA] mb-2">{p.titulo}</h2>
              <p className="text-sm text-[#93A3B5] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
