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
import {
  listarServicosCatalogoComStatus,
  ServicoCatalogoRecord,
} from '@/services/catalogoServicosService'
import { AlertTriangle } from 'lucide-react'

export default function Planos() {
  const { isAuthenticated, user } = useAuth()
  const [cobrancas, setCobrancas] = useState<CobrancaRecord[]>([])
  const [carregandoCobrancas, setCarregandoCobrancas] = useState(false)
  const [catalogo, setCatalogo] = useState<Record<string, ServicoCatalogoRecord>>({})
  const [emContingencia, setEmContingencia] = useState(false)

  useEffect(() => {
    listarServicosCatalogoComStatus()
      .then((res) => {
        const map: Record<string, ServicoCatalogoRecord> = {}
        for (const item of res.itens) {
          map[item.servico_id] = item
        }
        setCatalogo(map)
        setEmContingencia(res.isFallback)
      })
      .catch(() => {
        setEmContingencia(true)
      })
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
      nome: catalogo['diagnostico']?.nome || 'Plano Essencial dMRV',
      servicoTitulo: 'Pegada Contínua Ilimitada',
      indicacao: 'Pequenas e Médias Empresas (PME)',
      valorNumerico: precoEssencial,
      valorFormatado: formatPreco(precoEssencial),
      periodo: 'por CNPJ / anual',
      chamariz:
        'Pegada de carbono contínua ilimitada, laudo pericial e situação tributária contínua.',
      descricao:
        catalogo['diagnostico']?.descricao ||
        'Pegada contínua de carbono ilimitada, laudo com hash SHA-256 e situação tributária da empresa em relação à reforma tributária.',
      destaques: [
        'Pegada de carbono contínua ilimitada por nota e produto',
        'Laudo pericial com hash SHA-256 e chancela probatória',
        'Atestado Orbis Protocol dMRV emitido com validade pública',
        'Situação tributária da empresa em relação à reforma tributária contínua (IBS/CBS)',
        'Passaporte Digital de Produto (DPP) e exportações auditáveis',
        'Radar Semanal disponível como plus regulatório',
      ],
      ctaText: 'Contratar Plano Essencial',
      popular: false,
    },
    {
      id: 'mover',
      servicoId: 'laudo_pericial',
      nome: catalogo['laudo_pericial']?.nome || 'Plano MOVER & CDV',
      servicoTitulo: 'Laudo Pericial com ART / RRT',
      indicacao: 'Exclusivo Segmento Automotivo & CDVs DETRAN',
      valorNumerico: precoMover,
      valorFormatado: formatPreco(precoMover),
      periodo: 'por laudo homologado',
      chamariz:
        'Pegada contínua ilimitada + Laudo pericial com chancela de perito homologado (ART/RRT).',
      descricao:
        catalogo['laudo_pericial']?.descricao ||
        'Laudo Pericial com ART — chancela de perito homologado, DPP automotivo e pegada contínua ilimitada.',
      destaques: [
        'Tudo do plano Essencial incluído com ingestão ilimitada',
        'Chancela de perito homologado com Anotação de Responsabilidade Técnica (ART)',
        'Laudo pericial emitido sob a norma NBC TO 3000 do CFC',
        'Dossiê preparatório para créditos do Programa MOVER (Lei 14.902/2024)',
        'Passaporte Digital de Produto (DPP) para peças e lotes reaproveitados',
        'Situação tributária contínua em relação à reforma tributária',
      ],
      ctaText: 'Contratar Plano Automotivo',
      popular: true,
    },
    {
      id: 'corporativo',
      servicoId: 'assinatura_bureau',
      nome: catalogo['assinatura_bureau']?.nome || 'Plano Corporativo Enterprise',
      servicoTitulo: 'Bureau ACP & Gestão Contínua',
      indicacao: 'Indústrias Reguladas & Grandes Exportadores',
      valorNumerico: precoCorp,
      valorFormatado: formatPreco(precoCorp),
      periodo: 'anual / gestão contínua',
      chamariz:
        'Pegada contínua multi-filiais, laudos periciais e Radar Semanal por faixas de CNPJs.',
      descricao:
        catalogo['assinatura_bureau']?.descricao ||
        'Bureau ACP — gestão contínua de carbono, passaportes, dossiê bancário e Radar Semanal multi-CNPJs.',
      destaques: [
        'Tudo do plano MOVER / Laudo Pericial incluído',
        'Gestão contínua e cockpit completo no Bureau ACP multi-unidades',
        'Passaporte Digital do Fornecedor com revelação seletiva por parceiro',
        'Dossiê contínuo de elegibilidade para linhas BRDE e Fomento Paraná',
        'Situação tributária da empresa em relação à reforma tributária',
        'Radar Semanal incluso com monitoramento de atos e normas',
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

        {/* Aviso de Tabela de Contingência quando ativado */}
        {emContingencia && (
          <div className="mb-8 p-4 rounded-xl bg-[#D9B36C]/10 border-2 border-[#D9B36C] text-xs text-[#D9B36C] flex items-start gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#D9B36C]" />
            <div className="space-y-1">
              <strong className="block font-bold uppercase tracking-wider text-sm">
                Aviso de Contingência de Preços (Parecer CFO):
              </strong>
              <p className="leading-relaxed">
                Preço exibido de tabela de contingência — confirme o valor vigente no Console de
                Gestão antes de liquidar.
              </p>
              <p className="text-[11px] text-[#93A3B5]">
                A leitura direta da coleção{' '}
                <code className="font-mono text-[#D9B36C]">servicos_catalogo</code> está operando em
                regime de proteção. Qualquer divergência entre o valor da contingência e o banco
                será bloqueada na liquidação com justificativa obrigatória.
              </p>
            </div>
          </div>
        )}

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

        {/* Quadro Comparativo de Modelo de Comercialização: Cadastro Gratuito / Trial 15d / Plano Contratado */}
        <div className="mb-14 p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#12B886]">
              MODELO DE COMERCIALIZAÇÃO TRANSPARENTE
            </span>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#F4F7FA] mt-1">
              Como funciona o acesso na plataforma Orbis
            </h2>
            <p className="text-xs text-[#93A3B5] mt-1.5">
              Produto central: <strong>Pegada de carbono por nota/produto</strong>. Plus de atração:{' '}
              <strong>Situação tributária da empresa em relação à reforma tributária</strong> (sem
              promessa de créditos milagrosos). Plus de receita:{' '}
              <strong>Radar Semanal regulatório</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coluna 1: Cadastro Gratuito */}
            <div className="p-5 rounded-xl bg-[#0A0E12] border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase text-[#93A3B5] font-bold">
                  1. Entrada
                </div>
                <h3 className="font-heading font-bold text-base text-[#F4F7FA] mt-0.5">
                  Cadastro Gratuito
                </h3>
                <div className="text-lg font-black text-[#F4F7FA] my-2">R$ 0</div>
                <p className="text-xs text-[#93A3B5] mb-4">
                  Entrega o diagnóstico completo do CNPJ (elegibilidade, protocolos aplicáveis e
                  comparativo regulatório) <strong>sem valores de nota</strong>.
                </p>
                <ul className="text-xs text-[#93A3B5] space-y-2">
                  <li className="flex items-center gap-1.5 text-[#12B886]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Diagnóstico completo do CNPJ</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-[#12B886]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Enquadramento preliminar SBCE/MOVER</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-[#93A3B5]/60">
                    <span className="w-3.5 text-center">✕</span>
                    <span>Sem valores de nota fiscal</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/diagnostico"
                className="mt-6 w-full py-2.5 rounded-lg text-xs font-semibold bg-[#16202B] border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] text-center"
              >
                Fazer Cadastro Gratuito
              </Link>
            </div>

            {/* Coluna 2: Trial 15 dias sem cartão */}
            <div className="p-5 rounded-xl bg-[#0A0E12] border-2 border-[#12B886] flex flex-col justify-between relative shadow-emerald-glow">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#12B886] text-[#0A0E12] font-mono text-[9px] font-bold uppercase tracking-wider">
                TESTE SEM CARTÃO
              </span>
              <div>
                <div className="text-[10px] font-mono uppercase text-[#12B886] font-bold">
                  2. Degustação Real
                </div>
                <h3 className="font-heading font-bold text-base text-[#F4F7FA] mt-0.5">
                  Trial de 15 Dias
                </h3>
                <div className="text-lg font-black text-[#12B886] my-2">
                  15 dias • Limite de 5 notas
                </div>
                <p className="text-xs text-[#93A3B5] mb-4">
                  Exibe a <strong>pegada de carbono por nota/produto</strong> como produto central
                  e, como plus, a{' '}
                  <strong>situação tributária da empresa em relação à reforma tributária</strong>.
                  Sem pedir cartão.
                </p>
                <ul className="text-xs text-[#93A3B5] space-y-2">
                  <li className="flex items-center gap-1.5 text-[#12B886]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Pegada de carbono por nota/produto</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-[#12B886]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Situação em relação à reforma tributária</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-[#12B886]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Bloqueio suave ao expirar (preserva dados)</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/registro"
                className="mt-6 w-full py-2.5 rounded-lg text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] text-center"
              >
                Iniciar Trial (5 notas)
              </Link>
            </div>

            {/* Coluna 3: Plano Contratado */}
            <div className="p-5 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/60 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase text-[#D9B36C] font-bold">
                  3. Produção Ilimitada
                </div>
                <h3 className="font-heading font-bold text-base text-[#F4F7FA] mt-0.5">
                  Plano Contratado
                </h3>
                <div className="text-lg font-black text-[#D9B36C] my-2">Ilimitado + Perícia</div>
                <p className="text-xs text-[#93A3B5] mb-4">
                  Pegada contínua ilimitada, laudo pericial (hash, chancela, DPP, exportações
                  auditáveis), situação tributária contínua e Radar Semanal como plus.
                </p>
                <ul className="text-xs text-[#93A3B5] space-y-2">
                  <li className="flex items-center gap-1.5 text-[#12B886]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Pegada contínua de carbono ilimitada</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-[#12B886]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Laudo pericial probatório (hash, ART/RRT, DPP)</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-[#D9B36C]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Radar Semanal (Plus de Receita)</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/checkout"
                className="mt-6 w-full py-2.5 rounded-lg text-xs font-bold bg-[#D9B36C] text-[#0A0E12] hover:bg-[#C9A25B] text-center"
              >
                Contratar Acesso Ilimitado
              </Link>
            </div>
          </div>

          {/* Plus de Receita: Radar Semanal explicativo com faixas e liberação manual */}
          <div className="mt-8 p-5 rounded-xl bg-[#0E1724] border border-[#D9B36C]/40 text-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#D9B36C]/20 text-[#D9B36C] font-mono text-[10px] font-bold uppercase">
                    PLUS DE RECEITA
                  </span>
                  <span className="font-heading font-bold text-sm text-[#F4F7FA]">
                    Radar Semanal Regulatório (Monitoramento de Atos e Normas)
                  </span>
                </div>
                <p className="text-[#93A3B5] mt-1">
                  Disponível por faixas de CNPJs monitorados: <strong>1 CNPJ = R$ 59/mês</strong> |{' '}
                  <strong>5 CNPJs = R$ 149/mês</strong> | <strong>30 CNPJs = R$ 249/mês</strong>{' '}
                  (acima sob consulta).
                </p>
                <p className="text-[11px] text-[#93A3B5]/80 mt-1 italic">
                  * A liberação do Radar Semanal é realizada de forma manual pela equipe técnica no
                  Console v1 após a validação cadastral.
                </p>
              </div>
              <Link
                to="/central-radar"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#16202B] border border-[#D9B36C]/50 text-[#D9B36C] hover:bg-[#D9B36C] hover:text-[#0A0E12] transition-colors shrink-0 text-center"
              >
                Conhecer o Radar Semanal
              </Link>
            </div>
          </div>
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
                {p.popular ? (
                  /* Única CTA verde primária no plano destacado (MOVER) */
                  <Link
                    to={`/checkout?servico=${p.servicoId}`}
                    className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
                  >
                    <span>Contratar por {p.valorFormatado}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  /* Botões secundários neutros nos demais planos */
                  <Link
                    to={`/checkout?servico=${p.servicoId}`}
                    className="w-full py-3.5 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-[#16202B] border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:bg-[#1F2C3A] hover:border-[rgba(244,247,250,0.35)] transition-all"
                  >
                    <span>Contratar por {p.valorFormatado}</span>
                    <ArrowRight className="w-4 h-4 text-[#93A3B5]" />
                  </Link>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/registro"
                    className="py-2.5 rounded-xl font-medium text-xs text-[#93A3B5] hover:text-[#F4F7FA] bg-[#0A0E12] hover:bg-[#16202B] border border-[rgba(244,247,250,0.1)] flex items-center justify-center gap-1 transition-all"
                  >
                    <span>Criar conta</span>
                  </Link>
                  <Link
                    to="/diagnostico"
                    className="py-2.5 rounded-xl font-medium text-xs text-[#93A3B5] hover:text-[#F4F7FA] border border-[rgba(244,247,250,0.1)] hover:bg-[#16202B] flex items-center justify-center gap-1 transition-all"
                  >
                    <span className="truncate">{p.ctaText}</span>
                  </Link>
                </div>
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
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/diagnostico"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-medium border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:bg-[#16202B] hover:border-[rgba(244,247,250,0.35)] transition-all text-center text-xs sm:text-sm"
            >
              Fazer diagnóstico preliminar
            </Link>
            <Link
              to="/registro"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-medium bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#1F2C3A] transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <span>Criar conta</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>{' '}
        </div>
      </div>
    </div>
  )
}
