import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  FileCheck2,
  Layers,
  Cpu,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import {
  obterNumerosVerificaveis,
  type NumerosVerificaveisData,
} from '@/services/metricasHomeService'

export function NumerosVerificaveisSection() {
  const [metricas, setMetricas] = useState<NumerosVerificaveisData>({
    selosEmitidos: 0,
    lastrosEmitidos: 0,
    manifestosSinir: 0,
    pecasRastreadas: 0,
    consultasDpp: 0,
    carregando: true,
    erro: false,
  })

  useEffect(() => {
    let isMounted = true
    obterNumerosVerificaveis().then((data) => {
      if (isMounted) {
        setMetricas(data)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Lista dos 5 módulos solicitados
  const itens = [
    {
      id: 'selos',
      titulo: 'Selos no Ambiente Demo',
      subtitulo: 'Atestados Orbis com hash canônico, no ambiente demo',
      valor: metricas.selosEmitidos,
      icon: Award,
      link: '/verificador',
      rotuloLink: 'Verificar selo',
      corDestaque: 'text-[#12B886]',
      bordaCor: 'border-[#12B886]/30',
      badgeCor: 'bg-[#12B886]/10 text-[#12B886]',
      badgeRotulo: 'Demo',
    },
    {
      id: 'pecas',
      titulo: 'Peças no Ambiente Demo',
      subtitulo: 'Componentes automotivos catalogados com DPP e CO2e evitado, no ambiente demo',
      valor: metricas.pecasRastreadas,
      icon: Cpu,
      link: '/passaporte-lote/PR-BX-2026-1240105',
      rotuloLink: 'Ver lote demonstrativo',
      corDestaque: 'text-[#12B886]',
      bordaCor: 'border-[#12B886]/30',
      badgeCor: 'bg-[#12B886]/10 text-[#12B886]',
      badgeRotulo: 'Demo',
    },
    {
      id: 'consultas',
      titulo: 'Consultas no Ambiente Demo',
      subtitulo: 'Auditorias públicas e conferências dpp_consultas registradas, no ambiente demo',
      valor: metricas.consultasDpp,
      icon: Search,
      link: '/verificador',
      rotuloLink: 'Consultar registro',
      corDestaque: 'text-[#3B82F6]',
      bordaCor: 'border-[#3B82F6]/30',
      badgeCor: 'bg-[#3B82F6]/10 text-[#3B82F6]',
      badgeRotulo: 'Demo',
    },
    {
      id: 'lastros',
      titulo: 'Lastros de Circularidade',
      subtitulo: 'Certificados emitidos sob o Decreto 11.413/2023',
      valor: metricas.lastrosEmitidos,
      icon: FileCheck2,
      link: '/verificador',
      rotuloLink: 'Conferência de lastro',
      corDestaque: 'text-[#D9B36C]',
      bordaCor: 'border-[#D9B36C]/30',
      badgeCor: 'bg-[#D9B36C]/10 text-[#D9B36C]',
    },
    {
      id: 'manifestos',
      titulo: 'Manifestos MTR-SINIR',
      subtitulo: 'Movimentações prontas para homologação CCRLR',
      valor: metricas.manifestosSinir,
      icon: Layers,
      link: '/login',
      rotuloLink: 'Módulo Sinir / ACP',
      corDestaque: 'text-[#D9B36C]',
      bordaCor: 'border-[#D9B36C]/30',
      badgeCor: 'bg-[#D9B36C]/10 text-[#D9B36C]',
    },
  ]

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-[#0A0E12] via-[#0C1015] to-[#0A0E12] border-y border-[rgba(244,247,250,0.05)] relative overflow-hidden">
      {/* Glow suave integrado */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-[#12B886]/5 blur-[120px] pointer-events-none opacity-70" />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/30 text-[#12B886] text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Transparência Pública e Auditabilidade</span>
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] tracking-wide">
              NÚMEROS VERIFICÁVEIS
            </h2>
            <p className="text-sm sm:text-base text-[#93A3B5] mt-2 max-w-2xl leading-relaxed">
              Números consultáveis em tempo real na infraestrutura PocketBase; registros de
              demonstração identificados.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#93A3B5] bg-[#111820] px-3 py-2 rounded-xl border border-[rgba(244,247,250,0.08)]">
            <span className="w-2 h-2 rounded-full bg-[#12B886] animate-pulse" />
            <span>Consultas primárias em tempo real</span>
          </div>
        </div>

        {/* Grade de 5 cartões com suporte total ao mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {itens.map((item) => {
            const Icon = item.icon
            const temVolumeReal = item.valor > 0
            const rotuloBadge = item.badgeRotulo ?? (temVolumeReal ? 'Ativo' : 'Em homologação')
            const estiloBadge = item.badgeRotulo
              ? item.badgeCor
              : temVolumeReal
                ? item.badgeCor
                : 'text-[#93A3B5] bg-[#16202B]'

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl bg-[#111820] border ${
                  temVolumeReal ? item.bordaCor : 'border-[rgba(244,247,250,0.08)]'
                } flex flex-col justify-between hover:border-[rgba(244,247,250,0.25)] transition-all group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl bg-[#16202B] border border-[rgba(244,247,250,0.1)] flex items-center justify-center ${item.corDestaque} group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${estiloBadge}`}
                    >
                      {rotuloBadge}
                    </span>
                  </div>

                  {/* REGRA CRÍTICA: Se uma contagem for zero, exibir o módulo SEM o número. Nunca inventar ou exibir zero como se fosse volume. */}
                  {metricas.carregando ? (
                    <div className="h-9 w-20 bg-[#16202B] animate-pulse rounded-lg mb-2" />
                  ) : temVolumeReal ? (
                    <div className="mb-2">
                      <span
                        className={`font-heading font-black text-3xl sm:text-4xl tracking-tight ${item.corDestaque}`}
                      >
                        {item.valor.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#93A3B5] px-2.5 py-1 rounded bg-[#16202B]">
                        <CheckCircle2 className="w-3 h-3 text-[#12B886]" />
                        Módulo Integrado
                      </span>
                    </div>
                  )}

                  <h3 className="font-heading font-bold text-sm text-[#F4F7FA] mb-1 leading-snug">
                    {item.titulo}
                  </h3>
                  <p className="text-xs text-[#93A3B5] leading-relaxed mb-4">{item.subtitulo}</p>
                </div>

                <div className="pt-3 border-t border-[rgba(244,247,250,0.06)]">
                  <Link
                    to={item.link}
                    className="inline-flex items-center gap-1.5 text-xs text-[#93A3B5] hover:text-[#F4F7FA] transition-colors group-hover:translate-x-0.5 duration-200"
                  >
                    <span>{item.rotuloLink}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
