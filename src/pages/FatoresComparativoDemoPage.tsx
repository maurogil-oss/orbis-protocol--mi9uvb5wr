import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Scale,
  FileCheck2,
  FileText,
  ExternalLink,
  QrCode,
  ArrowLeft,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Hash,
} from 'lucide-react'
import {
  CATALOGO_FATORES_CO2E,
  FATOR_SIN_MCTI_TCO2E_POR_MWH,
  GWP_IPCC_AR6_OFICIAL,
} from '@/services/catalogoFatoresOficiais'

interface LinhaComparativa {
  material: string
  codigo: string
  fatorOrbis: number
  unidade: string
  fonteOrbis: string
  escopoOrbis: string
  incertezaUfe: string
  statusFonte: string
  referenciaMercado: string
  valorMercado: string
  escopoMercado: string
  razaoDivergencia: string
  tratamentoAuditoria: string
}

export default function FatoresComparativoDemoPage() {
  const [filtroAba, setFiltroAba] = useState<'todos' | 'metais' | 'fluidos_energia'>('todos')
  const [perguntaAberta, setPerguntaAberta] = useState<boolean>(true)

  const linhas: LinhaComparativa[] = [
    {
      material: 'Aço Laminado / Estampado',
      codigo: 'aco',
      fatorOrbis: 2.18,
      unidade: 'kgCO₂e/kg',
      fonteOrbis: 'worldsteel Association (Sustainability Indicators 2025, GHG 2024)',
      escopoOrbis:
        'Escopos 1 + 2 + 3 Cat. 1 (Berço ao portão global ponderado BF-BOF, DRI e scrap-EAF)',
      incertezaUfe: '±3,5% (Tier 3)',
      statusFonte: 'Oficial Confirmado',
      referenciaMercado: 'Gerdau (Rota Scrap/EAF Nacional) ~0,85 kgCO₂e/kg',
      valorMercado: '0,85 a 0,90 kgCO₂e/kg',
      escopoMercado: 'Escopos 1 + 2 específicos da usina secundária',
      razaoDivergencia:
        'Fallback global conservador: o Orbis adota a média mundial ponderada de produção virgem como baseline de emissão evitada quando uma peça é reciclada/reutilizada, garantindo que o lastro seja aceito por qualquer auditor internacional.',
      tratamentoAuditoria:
        'Hierarquia metodológica §7 DM-ORB-001 v1.1: O valor 2,18 é o default conservador citável. Pode ser substituído pela intensidade específica do produtor nacional mediante apresentação de EPD/LCI de usina acompanhado de ART/RRT e rastreabilidade documental.',
    },
    {
      material: 'Alumínio Primário Automotivo',
      codigo: 'aluminio',
      fatorOrbis: 14.4,
      unidade: 'kgCO₂e/kg',
      fonteOrbis: 'International Aluminium Institute (IAI 2024 Data Release)',
      escopoOrbis:
        'Escopos 1 + 2 + 3 Cradle-to-gate global (eletricidade 8,5 + térmico 1,6 + direto 2,4 + transp 0,5 + outros 1,4)',
      incertezaUfe: '±4,0% (Tier 3)',
      statusFonte: 'Oficial Confirmado (Fallback Global)',
      referenciaMercado:
        'Hydro Alumínio Primário Global 14,8 / Alumínio Reciclado Circular ~0,52 kgCO₂e/kg / Matriz BR Hidrelétrica ~10,0',
      valorMercado: '14,80 (global) / ~10,00 (BR) / 0,52 (sucata limpa)',
      escopoMercado: 'Varia conforme matriz energética de eletrólise (carvão vs hidrelétrica)',
      razaoDivergencia:
        'A média global IAI (14,40 tCO₂e/t Al) é adotada como padrão citável. Se a fundição comprovar abastecimento exclusivo hidrelétrico com EPD auditada, o fator pode ser calibrado regionalmente para ~10,00.',
      tratamentoAuditoria:
        'Substituição estritamente condicionada a evidência própria do lote/peça com laudo pericial (EPD ISO 14025 ou LCI regional verificado por terceira parte).',
    },
    {
      material: 'Cobre / Bobinamentos Elétricos',
      codigo: 'cobre',
      fatorOrbis: 4.1,
      unidade: 'kgCO₂e/kg',
      fonteOrbis: 'International Copper Association (ICA 2024 LCI/LCA Global)',
      escopoOrbis: 'Cradle-to-gate cobre primário refinado (média ponderada mina e pirometalurgia)',
      incertezaUfe: '±4,5% (Tier 3)',
      statusFonte: 'Oficial Confirmado',
      referenciaMercado:
        'CopperMark / Estudo Ecoinvent 3.9 (faixa de 3,8 a 5,3 kgCO₂e/kg conforme teor do minério)',
      valorMercado: '3,80 a 5,30 kgCO₂e/kg',
      escopoMercado: 'Cobre cátodo virgem grau A',
      razaoDivergencia:
        'A intensidade varia fortemente pelo teor de minério (stripping ratio) e queima de combustíveis no refino. O fator 4,10 representa a mediana auditada da ICA para o mercado mundial.',
      tratamentoAuditoria:
        'Default defensável perante agências de rating e auditores Big Four. Substituição admissível via certificado de origem mineral rastreada.',
    },
    {
      material: 'Polímeros Automotivos (PP / EPDM / ABS)',
      codigo: 'polimeros',
      fatorOrbis: 1.9,
      unidade: 'kgCO₂e/kg',
      fonteOrbis: 'PlasticsEurope Eco-profiles (PCR ISO 14025, declared unit 1 kg resina at gate)',
      escopoOrbis:
        'Síntese petroquímica de polímeros virgens at gate (menor valor da classe correspondente ao polipropileno PP)',
      incertezaUfe: '±5,0% (Tier 2)',
      statusFonte: 'Pendente de Verificação de Fonte Adicional (Flag Oficial)',
      referenciaMercado: 'PlasticsEurope faixa técnica: 1,91 (PP) a 3,10 (EPDM) e 5,70 (ABS)',
      valorMercado: '1,90 a 5,70 kgCO₂e/kg',
      escopoMercado: 'Resinas termoplásticas virgens berço-ao-portão petroquímico',
      razaoDivergencia:
        'O Orbis adota deliberadamente a ponta inferior mais conservadora (1,90 kgCO₂e/kg) para evitar qualquer superestimação de peças automotivas plásticas de composição mista ou não especificada.',
      tratamentoAuditoria:
        'Mantido com flag [Pendente de verificação de fonte] transparente até consolidação do PCR nacional ABIPLAST. Auditoria externa pode validar por lote.',
    },
    {
      material: 'Gás Refrigerante R-134a (HFC-134a Recuperado)',
      codigo: 'r134a',
      fatorOrbis: 1530.0,
      unidade: 'kgCO₂e/kg',
      fonteOrbis: 'IPCC AR6 WG1 Capítulo 7 Tabela 7.15 (GWP100 com feedbacks de carbono)',
      escopoOrbis:
        'Evitação de emissão fugitiva direta e ciclo de regeneração de fluido halogenado',
      incertezaUfe: '±2,0% (Tier 3)',
      statusFonte: 'Oficial Confirmado IPCC AR6',
      referenciaMercado: 'IPCC AR4 (1.430) vs IPCC AR5 (1.300) vs IPCC AR6 (1.530)',
      valorMercado: '1.430 a 1.530 kgCO₂e/kg',
      escopoMercado: 'GWP 100 anos',
      razaoDivergencia:
        'O Orbis opera integralmente sob o IPCC AR6 (mais recente da ciência climática). Empresas que ainda utilizam o AR4 (Protocolo de Quioto) subdimensionam o impacto do R-134a em ~7%.',
      tratamentoAuditoria:
        'Exige comprovação de drenagem mecânica obrigatória e certificado de destinação CONAMA 267/2000 e 340/2003.',
    },
    {
      material: 'Gás Refrigerante R-1234yf (HFO-1234yf Recuperado)',
      codigo: 'r1234yf',
      fatorOrbis: 0.5,
      unidade: 'kgCO₂e/kg',
      fonteOrbis: 'IPCC AR6 WG1 Capítulo 7 Tabela 7.SM.7 (CF₃CF=CH₂, GWP100 = 0,501)',
      escopoOrbis:
        'Fluido moderno de baixíssimo potencial de aquecimento global (automotivo pós-2017)',
      incertezaUfe: '±2,0% (Tier 3)',
      statusFonte: 'Oficial Confirmado IPCC AR6',
      referenciaMercado: 'IPCC AR5 citava < 1; AR6 formalizou 0,501 com feedbacks climáticos',
      valorMercado: '0,50 kgCO₂e/kg',
      escopoMercado: 'GWP 100 anos',
      razaoDivergencia:
        'Adotado conservadoramente 0,50 kgCO₂e/kg. Demonstra que a plataforma não infla fatores para gerar claims artificiais.',
      tratamentoAuditoria:
        'Validação documental da recuperação sem geração de créditos excedentes.',
    },
    {
      material: 'Eletricidade Rede SIN (Localização MCTI)',
      codigo: 'sin_localizacao',
      fatorOrbis: FATOR_SIN_MCTI_TCO2E_POR_MWH,
      unidade: 'tCO₂e/MWh',
      fonteOrbis: 'MCTI / Sistema Interligado Nacional (Fator Médio Anual de Referência)',
      escopoOrbis: 'Escopo 2 baseado em localização (dual reporting GHG Protocol)',
      incertezaUfe: '±2,0% (Tier 3)',
      statusFonte: 'Oficial MCTI / SIN',
      referenciaMercado:
        'Média mensal ONS/MCTI varia de 0,028 a 0,095 conforme regime de chuvas e despacho térmico',
      valorMercado: '0,040 a 0,095 tCO₂e/MWh',
      escopoMercado: 'Grid nacional interligado',
      razaoDivergencia:
        'O fator canônico oficial de 0,085 tCO₂e/MWh (= 85 kgCO₂e/MWh) representa a referência pericial para balanços energéticos evitados e conversão física de energia renovável.',
      tratamentoAuditoria:
        'Aplicado diretamente em faturas de concessionárias (NF3-e). Para emissão zero, exige cancelamento auditado de certificados I-REC.',
    },
  ]

  const linhasFiltradas = linhas.filter((l) => {
    if (filtroAba === 'metais') return ['aco', 'aluminio', 'cobre', 'polimeros'].includes(l.codigo)
    if (filtroAba === 'fluidos_energia')
      return ['r134a', 'r1234yf', 'sin_localizacao'].includes(l.codigo)
    return true
  })

  return (
    <div className="min-h-screen bg-[#0A0E12] text-[#F4F7FA] pb-24">
      {/* Header Corporativo Demo / Material Interno */}
      <div className="border-b border-[rgba(244,247,250,0.08)] bg-[#0E1A2E]/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/demo"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#93A3B5] hover:text-[#12B886] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à Demonstração</span>
            </Link>
            <span className="text-xs text-[#93A3B5]">•</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#D9B36C]/15 border border-[#D9B36C]/30 text-[#D9B36C] font-mono text-[11px] font-bold uppercase tracking-wider">
              Anexo Técnico Demo • Material Interno & Pericial
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/fatores"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#12B886] hover:underline"
            >
              <span>Ver Catálogo Público DM-ORB-001</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Banner de Apresentação Técnica */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#0E1A2E] via-[#111827] to-[#0A1628] border border-[rgba(244,247,250,0.12)] shadow-2xl relative overflow-hidden space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12B886]/10 border border-[#12B886]/30 text-[#12B886] text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Matriz Comparativa de Rigor Metodológico</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA] tracking-wide">
            Fatores Orbis vs. Mercado Real
          </h1>

          <p className="text-sm text-[#93A3B5] max-w-4xl leading-relaxed">
            Este anexo técnico esclarece por que os fatores de emissão evitada adotados pelo{' '}
            <strong>Orbis Protocol</strong> são rigorosamente conservadores, citáveis perante a
            comunidade científica internacional e como se posicionam diante das intensidades de
            emissão de produtores primários e secundários de mercado (ex.: Gerdau, Hydro,
            CopperMark, PlasticsEurope e IPCC AR6).
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono text-[#D9B36C]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#12B886]" />
              <span>Hierarquia §7 DM-ORB-001 v1.1</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-[#D9B36C]" />
              <span>Evidência Documental com Hash SHA-256</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#12B886]" />
              <span>Substituível por EPD/LCI de Fábrica com ART</span>
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RESPOSTA AO AUDITOR: POR QUE FATOR GLOBAL EM VEZ DA INTENSIDADE DO PRODUTOR */}
        {/* ========================================================================= */}
        <div className="p-6 rounded-2xl bg-[#111820] border-2 border-[#12B886]/40 shadow-xl space-y-4">
          <button
            type="button"
            onClick={() => setPerguntaAberta(!perguntaAberta)}
            className="w-full flex items-center justify-between text-left gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#12B886]/15 text-[#12B886] flex items-center justify-center shrink-0 mt-0.5">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#12B886] block">
                  Defesa Pericial perante VVB / Auditor Externo
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#F4F7FA]">
                  Por que a Orbis utiliza fatores globais médios em vez da intensidade de carbono do
                  produtor nacional?
                </h2>
              </div>
            </div>
            <span className="text-xs font-mono text-[#D9B36C] shrink-0">
              {perguntaAberta ? 'Ocultar resposta' : 'Ver resposta completa'}
            </span>
          </button>

          {perguntaAberta && (
            <div className="pt-4 border-t border-[rgba(244,247,250,0.08)] space-y-3 text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
              <p>
                A resposta técnica funda-se na{' '}
                <strong className="text-[#F4F7FA]">
                  hierarquia metodológica estabelecida na Seção 7 da Diretriz DM-ORB-001 v1.1
                </strong>
                :
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.08)] space-y-1">
                  <div className="font-bold text-[#12B886]">
                    Nível 1 • Default Conservador Citável
                  </div>
                  <p className="text-xs text-[#93A3B5]">
                    Na ausência de laudo específico do fornecedor da peça ou do material reciclado,
                    a plataforma aplica a média global ponderada (worldsteel, IAI, ICA,
                    PlasticsEurope, IPCC AR6). Isso impede qualquer questionamento de inflação de
                    créditos ou superestimação de descarbonização em auditorias internacionais.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0D1217] border border-[#D9B36C]/30 space-y-1">
                  <div className="font-bold text-[#D9B36C]">
                    Nível 2 • Substituição por EPD / LCI com ART
                  </div>
                  <p className="text-xs text-[#93A3B5]">
                    A intensidade específica do produtor nacional (ex.: aço Gerdau a ~0,85 tCO₂e/t
                    via rota EAF, ou alumínio Hydro a ~10,00 tCO₂e/t via matriz hidrelétrica) é{' '}
                    <strong className="text-[#F4F7FA]">plenamente aceita e incentivada</strong>,
                    desde que acompanhada de Declaração Ambiental de Produto (EPD) auditada por
                    terceira parte ou inventário de ciclo de vida (LCI) com ART/RRT vinculada ao
                    lote.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.08)] space-y-1">
                  <div className="font-bold text-[#F4F7FA]">
                    Nível 3 • Incerteza e Não-Cumulatividade
                  </div>
                  <p className="text-xs text-[#93A3B5]">
                    Cada fator carrega sua incerteza analítica relativa u_FE rigorosamente propagada
                    pelo método GUM (ISO/IEC Guide 98-3). Não há dupla contagem: cada kg processado
                    possui chave NF-e/MTR e hash SHA-256 no livro-razão imutável.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SEÇÃO: CO₂e EVITADO NO MERCADO (SCHNEIDER ELECTRIC E EURECICLO)           */}
        {/* ========================================================================= */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#111820] via-[#16202B] to-[#0D1217] border border-[rgba(244,247,250,0.12)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D9B36C]">
            <Info className="w-4 h-4" />
            <span>Contexto de Mercado: Padrão Internacional de Reporte de Emissões Evitadas</span>
          </div>

          <h2 className="font-heading font-black text-xl sm:text-2xl text-[#F4F7FA]">
            CO₂e evitado no mercado: Schneider Electric, eureciclo e a diferença probatória Orbis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
            <div className="space-y-2">
              <p>
                Grandes organizações globais e operadores de logística reversa reportam emissões
                evitadas no mesmo formato matemático adotado pelo Orbis Protocol:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong className="text-[#F4F7FA]">Schneider Electric</strong> divulga
                  trimestralmente seu indicador corporativo de &ldquo;CO₂ avoided by our
                  customers&rdquo; aplicando fatores oficiais de substituição tecnológica
                  berço-ao-portão.
                </li>
                <li>
                  <strong className="text-[#F4F7FA]">eureciclo</strong> no Brasil certifica a
                  compensação de embalagens pós-consumo convertendo toneladas triadas em passivo
                  ambiental evitado através de notas de cooperativas e operadores.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 space-y-2">
              <div className="text-xs font-bold text-[#12B886] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>O Diferencial Crítico da Orbis Protocol</span>
              </div>
              <p className="text-xs text-[#F4F7FA]/90">
                Enquanto o mercado opera predominantemente por{' '}
                <em className="text-[#D9B36C]">
                  amostragem estatística ou certificados agregados por lote trimestral
                </em>
                , o Orbis Protocol fornece{' '}
                <strong className="text-[#12B886]">
                  prova documental unitária com hash criptográfico SHA-256 por peça e por lote
                </strong>
                . Cada quilograma evitado é amarrado a sua NF-e com chave de 44 dígitos, MTR de
                destinação final emitida no SINIR, tíquete de balança aferida e QR Code de
                verificação aberta e pública.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SELETOR DE ABAS E MATRIZ COMPARATIVA DETALHADA                            */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltroAba('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filtroAba === 'todos'
                    ? 'bg-[#12B886] text-[#0A0E12]'
                    : 'bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA]'
                }`}
              >
                Todos os Fatores ({linhas.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroAba('metais')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filtroAba === 'metais'
                    ? 'bg-[#12B886] text-[#0A0E12]'
                    : 'bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA]'
                }`}
              >
                Metais & Polímeros (4)
              </button>
              <button
                type="button"
                onClick={() => setFiltroAba('fluidos_energia')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filtroAba === 'fluidos_energia'
                    ? 'bg-[#12B886] text-[#0A0E12]'
                    : 'bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA]'
                }`}
              >
                Gases Refrigerantes & SIN (3)
              </button>
            </div>

            <span className="text-xs font-mono text-[#93A3B5]">
              Mostrando {linhasFiltradas.length} de {linhas.length} itens canônicos
            </span>
          </div>

          <div className="space-y-4">
            {linhasFiltradas.map((item) => (
              <div
                key={item.codigo}
                className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.08)] hover:border-[#12B886]/40 transition-all space-y-4 shadow-lg"
              >
                {/* Linha 1: Título do Material, Fator Orbis e Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(244,247,250,0.06)] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-black text-lg text-[#F4F7FA]">
                        {item.material}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#16202B] font-mono text-[10px] text-[#D9B36C]">
                        {item.codigo}
                      </span>
                    </div>
                    <div className="text-xs text-[#93A3B5] mt-0.5">{item.escopoOrbis}</div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-[#93A3B5] uppercase font-bold">Fator Orbis</div>
                      <div className="font-mono text-xl font-black text-[#12B886]">
                        {item.fatorOrbis.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}{' '}
                        <span className="text-xs text-[#93A3B5] font-normal">{item.unidade}</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-[#12B886]/10 border border-[#12B886]/30 text-[#12B886] font-mono font-bold text-[10px]">
                      {item.incertezaUfe}
                    </span>
                  </div>
                </div>

                {/* Linha 2: Comparação lado a lado (Orbis vs Mercado) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Lado Orbis */}
                  <div className="p-3.5 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.06)] space-y-1.5">
                    <div className="text-[11px] font-bold text-[#12B886] uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Premissa Canônica Orbis</span>
                    </div>
                    <div className="text-[#F4F7FA] font-medium leading-relaxed">
                      Fonte: {item.fonteOrbis}
                    </div>
                    <div className="text-[11px] text-[#93A3B5]">
                      Status de verificação:{' '}
                      <strong className="text-[#D9B36C]">{item.statusFonte}</strong>
                    </div>
                  </div>

                  {/* Lado Mercado Real */}
                  <div className="p-3.5 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.06)] space-y-1.5">
                    <div className="text-[11px] font-bold text-[#D9B36C] uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" />
                      <span>Referência de Mercado Citada</span>
                    </div>
                    <div className="text-[#F4F7FA] font-medium leading-relaxed">
                      {item.referenciaMercado}
                    </div>
                    <div className="text-[11px] text-[#93A3B5]">
                      Escopo de reporte de terceiros: {item.escopoMercado}
                    </div>
                  </div>
                </div>

                {/* Linha 3: Razão Técnica da Divergência e Tratamento em Auditoria */}
                <div className="p-3.5 rounded-xl bg-[#16202B]/60 border border-[rgba(244,247,250,0.05)] space-y-2 text-xs">
                  <div>
                    <strong className="text-[#F4F7FA] block mb-0.5">
                      Razão da Diferença Conservadora:
                    </strong>
                    <p className="text-[#93A3B5] leading-relaxed">{item.razaoDivergencia}</p>
                  </div>
                  <div className="pt-2 border-t border-[rgba(244,247,250,0.05)]">
                    <strong className="text-[#12B886] block mb-0.5">
                      Procedimento Pericial em Auditoria (§7 DM-ORB-001):
                    </strong>
                    <p className="text-[#93A3B5] leading-relaxed">{item.tratamentoAuditoria}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé do Anexo com Chave Metodológica */}
        <div className="p-6 rounded-2xl bg-[#0D1217] border border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#93A3B5]">
          <div className="space-y-1">
            <div className="font-bold text-[#F4F7FA]">
              Documento Técnico Suplementar DM-ORB-001 Anexo D
            </div>
            <p className="text-[11px]">
              Vigência formal: 2025/2026 • Alinhado a IPCC AR6 WG1, ISO 14064-1/2, ISO 14067 e Lei
              15.042/2024 (SBCE).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/demo"
              className="px-4 py-2 rounded-xl bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] font-bold transition-all shadow-emerald-glow"
            >
              Voltar ao Modo Demonstração
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
