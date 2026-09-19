import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Receipt,
  Lock,
} from 'lucide-react'
import { listarMinhasCobrancas, CobrancaRecord } from '@/services/cobrancaService'
import { listarServicosCatalogo, ServicoCatalogoRecord } from '@/services/catalogoServicosService'

export default function Planos() {
  const { isAuthenticated, user } = useAuth()
  const [cobrancas, setCobrancas] = useState<CobrancaRecord[]>([])
  const [carregandoCobrancas, setCarregandoCobrancas] = useState(false)
  const [catalogo, setCatalogo] = useState<Record<string, ServicoCatalogoRecord>>({})

  useEffect(() => {
    listarServicosCatalogo()
      .then((items) => {
        const map: Record<string, ServicoCatalogoRecord> = {}
        for (const item of items) {
          map[item.servico_id] = item
        }
        setCatalogo(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      setCarregandoCobrancas(true)
      listarMinhasCobrancas()
        .then((lista) => setCobrancas(lista))
        .catch(() => {})
        .finally(() => setCarregandoCobrancas(false))
    }
  }, [isAuthenticated])

  const formatPreco = (preco?: number) => {
    if (preco === undefined) return ''
    return `R$ ${preco.toLocaleString('pt-BR')}`
  }

  const precoEssencial = catalogo['diagnostico']?.preco ?? 490
  const precoMover = catalogo['laudo_pericial']?.preco ?? 2850
  const precoCorp = catalogo['assinatura_bureau']?.preco ?? 7800

  const planos = [
    {
      id: 'essencial',
      servicoId: 'diagnostico',
      nome: catalogo['diagnostico']?.nome || 'Plano Essencial',
      servicoTitulo: 'Diagnóstico Orbis',
      indicacao: 'Pequenas e Médias Empresas (PME)',
      valorNumerico: precoEssencial,
      valorFormatado: formatPreco(precoEssencial),
      periodo: 'pagamento único / por CNPJ',
      chamariz: 'Primeiro resultado prévio validado, com Hash de integridade criptográfica.',
      descricao:
        catalogo['diagnostico']?.descricao ||
        'Diagnóstico Orbis — primeiro resultado prévio validado, com Hash e demais entregas.',
      destaques: [
        'Diagnóstico anual preliminar validado por CNPJ',
        'Hash de integridade criptográfica dMRV',
        'Emissão do Selo Oficial Orbis Protocol dMRV',
        'Atestado preparatório para exigências ESG bancárias (Res. BCB 4.945/2021)',
        'Ingestão real de XML NF-e (Mod. 55/65) com apuração de créditos tributários ativos',
        'Suporte técnico via canal oficial',
      ],
      ctaText: 'Fazer Diagnóstico Preliminar',
      popular: false,
    },
    {
      id: 'mover',
      servicoId: 'laudo_pericial',
      nome: catalogo['laudo_pericial']?.nome || 'Plano MOVER',
      servicoTitulo: 'Laudo Pericial com ART',
      indicacao: 'Exclusivo Segmento Automotivo & CDVs DETRAN',
      valorNumerico: precoMover,
      valorFormatado: formatPreco(precoMover),
      periodo: 'por laudo homologado',
      chamariz: 'Chancela de perito homologado com Anotação de Responsabilidade Técnica (ART).',
      descricao:
        catalogo['laudo_pericial']?.descricao ||
        'Laudo Pericial com ART — chancela de perito homologado.',
      destaques: [
        'Tudo do plano Essencial incluído',
        'Chancela de perito homologado com ART/RRT acoplada',
        'Laudo pericial emitido sob a norma NBC TO 3000 do CFC',
        'Dossiê preparatório para créditos do Programa MOVER (Lei 14.902/2024)',
        'Passaporte Digital de Produto (DPP) para peças reaproveitadas',
        'Ingestão ilimitada de NF-e e conciliação de créditos PIS/Cofins, ICMS e IPI',
      ],
      ctaText: 'Diagnóstico para Setor Automotivo',
      popular: true,
    },
    {
      id: 'corporativo',
      servicoId: 'assinatura_bureau',
      nome: catalogo['assinatura_bureau']?.nome || 'Plano Corporativo',
      servicoTitulo: 'Bureau ACP',
      indicacao: 'Indústrias Reguladas & Grandes Exportadores',
      valorNumerico: precoCorp,
      valorFormatado: formatPreco(precoCorp),
      periodo: 'anual / gestão contínua',
      chamariz: 'Gestão contínua com passaportes do fornecedor e dossiê BRDE/fomento.',
      descricao:
        catalogo['assinatura_bureau']?.descricao ||
        'Bureau ACP — gestão contínua, passaportes, dossiê BRDE/fomento.',
      destaques: [
        'Tudo do plano MOVER / Laudo Pericial incluído',
        'Gestão contínua e cockpit completo no Bureau ACP',
        'Passaporte Digital do Fornecedor com revelação seletiva por parceiro',
        'Dossiê contínuo de elegibilidade para linhas BRDE e Fomento Paraná',
        'Curva MAC personalizada (Custo Marginal de Abatimento)',
        'Preparação para SBCE (Lei 15.042/2024) e reporte IFRS S1/S2',
      ],
      ctaText: 'Solicitar Diagnóstico Corporativo',
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-4">
            <ShieldCheck className="w-4 h-4 text-[#12B886]" />
            SOLUÇÕES & PLANOS CORPORATIVOS
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl md:text-5xl text-[#F4F7FA] tracking-wide mb-4">
            PLANOS DE ADESÃO & CERTIFICAÇÃO
          </h1>
          <p className="text-base sm:text-lg text-[#93A3B5] leading-relaxed">
            Conheça as modalidades de certificação pericial dMRV da plataforma Orbis Protocol.
            Inicie pelo diagnóstico gratuito do seu CNPJ para receber uma proposta técnica sob
            medida.
          </p>
        </div>

        {/* Informative Checkout Notice */}
        <div className="mb-10 p-4 rounded-xl bg-[#16202B] border border-[rgba(244,247,250,0.1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#93A3B5]">
            <Sparkles className="w-4 h-4 text-[#12B886] shrink-0" />
            <span>
              Contratação direta com ativação instantânea via{' '}
              <strong className="text-[#F4F7FA]">PIX Dinâmico</strong> e emissão automatizada de
              NFS-e probatória.
            </span>
          </div>
          <Link
            to="/checkout"
            className="text-[#12B886] hover:underline font-semibold shrink-0 flex items-center gap-1"
          >
            <span>Ir para Checkout PIX</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {planos.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl p-8 flex flex-col justify-between transition-all relative ${
                p.popular
                  ? 'bg-gradient-to-b from-[#111820] to-[#16202B] border-2 border-[#12B886] shadow-emerald-glow'
                  : 'bg-[#111820] border border-[rgba(244,247,250,0.12)] hover:border-[rgba(244,247,250,0.25)]'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#12B886] text-[#0A0E12] text-[10px] font-bold uppercase tracking-wider">
                  SETOR AUTOMOTIVO & CDVs
                </span>
              )}

              <div>
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-[#D9B36C] uppercase tracking-wider block mb-1">
                    {p.indicacao}
                  </span>
                  <h3 className="font-heading font-extrabold text-xl text-[#F4F7FA]">{p.nome}</h3>
                  <div className="mt-1">
                    <span className="inline-block text-xs font-semibold text-[#12B886]">
                      {p.servicoTitulo}
                    </span>
                  </div>
                  <p className="text-xs text-[#93A3B5] mt-2 leading-relaxed">{p.descricao}</p>
                </div>

                {/* Preço em destaque */}
                <div className="py-4 border-y border-[rgba(244,247,250,0.08)] mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-heading font-black text-3xl sm:text-4xl text-[#12B886]">
                      {p.valorFormatado}
                    </span>
                    <span className="text-xs text-[#93A3B5] font-medium">{p.periodo}</span>
                  </div>
                  <span className="text-[11px] text-[#D9B36C] block mt-1.5 font-medium leading-tight">
                    {p.chamariz}
                  </span>
                </div>

                <div className="space-y-3 mb-8">
                  <span className="text-xs font-semibold text-[#F4F7FA] uppercase tracking-wider block">
                    O que está incluído:
                  </span>
                  {p.destaques.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#93A3B5]">
                      <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  to={`/checkout?servico=${p.servicoId}`}
                  className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
                >
                  <span>Contratar por {p.valorFormatado}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/diagnostico"
                  className="w-full py-2.5 rounded-xl font-semibold text-xs text-[#93A3B5] hover:text-[#F4F7FA] border border-[rgba(244,247,250,0.12)] hover:border-[#12B886]/40 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>{p.ctaText}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Histórico de Faturas & Cobranças para Usuários Autenticados */}
        <div className="mb-16 p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#D9B36C]" />
              <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                HISTÓRICO DE FATURAS & NOTAS FISCAIS (NFS-E)
              </h3>
            </div>
            {!isAuthenticated && (
              <span className="inline-flex items-center gap-1 text-xs text-[#D9B36C]">
                <Lock className="w-3.5 h-3.5" />
                Requer Autenticação
              </span>
            )}
          </div>

          {isAuthenticated ? (
            carregandoCobrancas ? (
              <div className="p-6 text-center text-xs text-[#93A3B5]">
                Carregando histórico de cobranças...
              </div>
            ) : cobrancas.length > 0 ? (
              <div className="space-y-3">
                {cobrancas.map((cob) => (
                  <div
                    key={cob.id}
                    className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#D9B36C] font-bold">
                          {cob.servico_nome}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            cob.status === 'pago'
                              ? 'bg-[#12B886]/20 text-[#12B886]'
                              : 'bg-[#D9B36C]/20 text-[#D9B36C]'
                          }`}
                        >
                          {cob.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#93A3B5]">
                        TXID: <span className="font-mono text-[#F4F7FA]">{cob.txid}</span> • Criado
                        em {new Date(cob.created).toLocaleDateString('pt-BR')}
                      </div>
                      {cob.nfse_numero && (
                        <div className="text-[11px] text-[#12B886]">
                          NFS-e Nº: <strong className="font-mono">{cob.nfse_numero}</strong> (Série{' '}
                          {cob.nfse_serie || 'E'}) • Cód: {cob.nfse_verificacao}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-heading font-black text-base text-[#12B886] block">
                          R$ {cob.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <Link
                        to={`/checkout/${cob.id}`}
                        className="px-4 py-2 rounded-lg bg-[#16202B] border border-[#12B886]/40 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors font-semibold"
                      >
                        Ver Detalhes
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-[rgba(244,247,250,0.15)] rounded-xl bg-[#0A0E12] space-y-3">
                <Receipt className="w-8 h-8 text-[#93A3B5] mx-auto opacity-50" />
                <p className="text-xs text-[#93A3B5]">
                  Nenhuma cobrança registrada ainda para a conta de{' '}
                  <strong className="text-[#F4F7FA]">{user?.email}</strong>.
                </p>
                <div>
                  <Link
                    to="/checkout"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] shadow-emerald-glow"
                  >
                    <span>Contratar via PIX Agora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          ) : (
            <div className="p-6 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[#93A3B5]">
                Faça login para consultar suas notas fiscais de serviço e recibos de liquidação de
                honorários periciais.
              </p>
              <Link
                to="/login"
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#16202B] border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886]"
              >
                Fazer Login
              </Link>
            </div>
          )}
        </div>

        {/* Bottom CTA Banner */}
        <div className="p-8 sm:p-10 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#F4F7FA]">
              Dúvidas sobre o enquadramento tributário da sua empresa?
            </h3>
            <p className="text-xs sm:text-sm text-[#93A3B5] max-w-xl">
              Nossa equipe técnica analisa seu CNAE, faturamento e cadeia de valor para indicar a
              trilha regulatória preparatória mais eficiente para o SBCE ou Programa MOVER.
            </p>
          </div>
          <Link
            to="/diagnostico"
            className="px-8 py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center gap-2 shrink-0 text-xs sm:text-sm uppercase tracking-wider"
          >
            <span>Fazer Diagnóstico Gratuito</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
