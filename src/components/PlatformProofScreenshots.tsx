import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Compass,
  Search,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  QrCode,
  Lock,
  ArrowUpRight,
  Filter,
} from 'lucide-react'

export interface PlatformProofScreenshotsProps {
  className?: string
}

/**
 * PlatformProofScreenshots
 * Seção de prova real da plataforma (Item 2 do pacote aprovado):
 * Mockups interativos fiéis das 3 interfaces reais da plataforma:
 * 1. Central de Radar Regulatório (acervo de normas estruturadas por segmento)
 * 2. Verificador de Selos Oficiais (validação de hash SHA-256 dMRV ao vivo)
 * 3. Passaporte Digital de Produto (DPP lote veicular com peças rastreadas e balanço de massa)
 * Renderizados em molduras refinadas estilo Linear com barra de janela macOS/dark,
 * perspectiva sutil, sombra suave e glow esmeralda/dourado sem fotos de banco de imagens.
 */
export const PlatformProofScreenshots: React.FC<PlatformProofScreenshotsProps> = ({
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'verificador' | 'passaporte'>('radar')

  return (
    <section
      className={`relative py-20 md:py-28 overflow-hidden bg-slate-50 dark:bg-gradient-to-b dark:from-[#0A1628] dark:via-[#0E1A2E] dark:to-[#0A1628] border-y border-slate-200/80 dark:border-slate-800/80 ${className}`}
    >
      {/* Background glow suave em gradiente Linear esmeralda e dourado com transição contínua */}
      <div className="hidden dark:block absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] max-w-full h-[450px] linear-glow-combined pointer-events-none opacity-80" />
      <div className="hidden dark:block absolute -bottom-10 right-10 w-[500px] h-[300px] linear-glow-emerald pointer-events-none opacity-60" />

      {/* Gradiente sutil corporativo no modo claro */}
      <div className="dark:hidden absolute inset-0 bg-radial from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Cabeçalho da seção com tipografia Linear: título curto e pesado, subtítulo espaçado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-[#059669] text-xs font-mono font-semibold uppercase tracking-wider shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-[#059669] animate-pulse" />
              <span>PROVA REAL EM PRODUÇÃO</span>
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              INTERFACES REAIS DO PROTOCOLO
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Explore os módulos operacionais onde os dados são auditados, ancorados e conferidos
              publicamente a cada segundo — sem telas conceituais.
            </p>
          </div>

          {/* Abas de alternância de tela em contêiner discreto estilo Linear */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 self-start md:self-auto overflow-x-auto max-w-full shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('radar')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'radar'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-[#111827] dark:text-[#059669] dark:border-[#059669]/40 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Central de Radar</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('verificador')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'verificador'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-[#111827] dark:text-[#059669] dark:border-[#059669]/40 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Verificador de Selos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('passaporte')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'passaporte'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-[#111827] dark:text-[#059669] dark:border-[#059669]/40 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Passaporte Digital</span>
            </button>
          </div>
        </div>

        {/* Moldura de tela da plataforma no padrão Linear (janela estilizada, barra de ferramentas, perspectiva e sombra — o mockup interno usa paleta navy institucional) */}
        <div className="linear-frame-perspective">
          <div className="rounded-2xl bg-[#0E1A2E] border border-slate-300/80 dark:border-slate-800 linear-card-mockup overflow-hidden shadow-2xl">
            {/* Top Bar da Moldura macOS / App Window */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#0A1628] border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#F03E54]/70 border border-[#F03E54]" />
                <span className="w-3 h-3 rounded-full bg-[#D9B36C]/70 border border-[#D9B36C]" />
                <span className="w-3 h-3 rounded-full bg-[#059669]/70 border border-[#059669]" />
                <div className="h-4 w-px bg-slate-800 mx-2 hidden sm:block" />
                <span className="text-[11px] font-mono text-[#94A3B8] hidden sm:inline">
                  {activeTab === 'radar' && 'https://app.orbis-protocol.com/central-radar'}
                  {activeTab === 'verificador' && 'https://app.orbis-protocol.com/verificador'}
                  {activeTab === 'passaporte' &&
                    'https://app.orbis-protocol.com/passaporte-lote/PR-BX-2026-1240105'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#059669]/10 text-[#059669] text-[10px] font-mono font-bold uppercase border border-[#059669]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                  dMRV v1.4
                </span>
                {activeTab === 'radar' && (
                  <Link
                    to="/central-radar"
                    className="inline-flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#059669] font-medium transition-colors"
                  >
                    <span>Abrir tela</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                )}
                {activeTab === 'verificador' && (
                  <Link
                    to="/verificador"
                    className="inline-flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#059669] font-medium transition-colors"
                  >
                    <span>Abrir tela</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                )}
                {activeTab === 'passaporte' && (
                  <Link
                    to="/passaporte-lote/PR-BX-2026-1240105"
                    className="inline-flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#059669] font-medium transition-colors"
                  >
                    <span>Abrir tela</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>

            {/* Conteúdo Renderizado da Tela Selecionada */}
            <div className="p-5 sm:p-8 md:p-10 min-h-[460px] bg-gradient-to-b from-[#0E1A2E] via-[#0A1628] to-[#0E1A2E]">
              {/* TELA 1: CENTRAL DE RADAR REGULATÓRIO */}
              {activeTab === 'radar' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Compass className="w-4 h-4 text-[#059669]" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#059669]">
                          CENTRAL DO ASSINANTE • RADAR SEMANAL
                        </span>
                      </div>
                      <h3 className="font-heading font-black text-xl sm:text-2xl text-[#F8FAFC]">
                        Acervo de Inteligência Regulatória Executiva
                      </h3>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Filtro ativo: Todos os Segmentos • Prazos da Lei 15.042/2024 e LC 214/2025
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-lg bg-[#111827] border border-slate-800 text-xs text-[#94A3B8] font-mono">
                        Edição nº 42 • Vigência 2026
                      </div>
                    </div>
                  </div>

                  {/* Mockup do Grid de Normas da Central */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-[#111827] border border-[#059669]/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#059669]/10 text-[#059669] border border-[#059669]/30">
                          Carbono / SBCE
                        </span>
                        <span className="text-[10px] font-mono text-[#94A3B8]">
                          Lei 15.042/2024
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-[#F8FAFC]">
                        Limiares Obrigatórios de Relato e Metas de Emissão
                      </h4>
                      <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
                        Obrigatoriedade de inventário GHG Protocol a partir de 10.000 tCO2e/ano e
                        metas de redução sancionadas acima de 25.000 tCO2e/ano.
                      </p>
                      <div className="p-2 rounded-lg bg-[#0A1628] border border-slate-800 text-[11px] text-[#059669] font-mono flex items-center justify-between">
                        <span>Ação imediata:</span>
                        <span className="text-[#F8FAFC]">Apurar Escopos 1 e 2</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#111827] border border-[#D9B36C]/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#D9B36C]/10 text-[#D9B36C] border border-[#D9B36C]/30">
                          Fiscal / Tributário
                        </span>
                        <span className="text-[10px] font-mono text-[#94A3B8]">LC 214/2025</span>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-[#F8FAFC]">
                        Fase-teste do IVA Dual na NF-e (0,1% IBS / 0,9% CBS)
                      </h4>
                      <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
                        Início em 01/08/2026 com campos de validação nos schemas fiscais da SEFAZ
                        para créditos desonerados de insumos descarbonizados.
                      </p>
                      <div className="p-2 rounded-lg bg-[#0A1628] border border-slate-800 text-[11px] text-[#D9B36C] font-mono flex items-center justify-between">
                        <span>Prazo mandatório:</span>
                        <span className="text-[#F8FAFC]">Agosto/2026</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0A1628] text-[#94A3B8] border border-slate-800">
                          Circularidade
                        </span>
                        <span className="text-[10px] font-mono text-[#94A3B8]">
                          Dec. 11.413/2023
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-[#F8FAFC]">
                        Certificados de Reciclagem CCRLR & Manifestos MTR
                      </h4>
                      <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
                        Comprovação física de destinação de frações metálicas e baterias no SINIR
                        com chave de acesso única.
                      </p>
                      <div className="p-2 rounded-lg bg-[#0A1628] border border-slate-800 text-[11px] text-[#94A3B8] font-mono flex items-center justify-between">
                        <span>Status:</span>
                        <span className="text-[#059669]">Balanço Verificado</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-[#94A3B8]">
                    <span>Interface integrada à suíte de assinaturas Orbis</span>
                    <Link
                      to="/central-radar"
                      className="text-[#059669] font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Acessar acervo completo da Central</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* TELA 2: VERIFICADOR DE SELOS OFICIAIS */}
              {activeTab === 'verificador' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-4 h-4 text-[#059669]" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#059669]">
                          VERIFICADOR PÚBLICO dMRV • TRANSPARÊNCIA PERPÉTUA
                        </span>
                      </div>
                      <h3 className="font-heading font-black text-xl sm:text-2xl text-[#F8FAFC]">
                        Conferência Criptográfica de Selos e Laudos
                      </h3>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Hash canônico recalculado no momento da consulta via Web Crypto API
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#059669]/10 text-[#059669] text-xs font-bold border border-[#059669]/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Status: VÁLIDO
                    </span>
                  </div>

                  {/* Card do Selo Auditado */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-[#111827] border border-[#059669]/40 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-[10px] font-mono text-[#D9B36C] uppercase font-bold">
                          Código Oficial Auditado:
                        </span>
                        <div className="font-mono text-lg font-black text-[#F8FAFC]">
                          ORB-2024-0001
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-[#94A3B8] uppercase">
                          Vigência Oficial:
                        </span>
                        <div className="text-xs font-bold text-[#059669]">Ativo até 31/12/2026</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-[#94A3B8] block mb-1">Empresa / Titular:</span>
                        <span className="font-bold text-[#F8FAFC]">
                          Indústria Metalmecânica S.A.
                        </span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] block mb-1">CNPJ Homologado:</span>
                        <span className="font-mono text-[#D9B36C]">19.598.964/0001-01</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] block mb-1">
                          Responsável Técnico / ART:
                        </span>
                        <span className="font-mono text-[#F8FAFC]">CREA-PR 88.412-D</span>
                      </div>
                    </div>

                    {/* Hash SHA-256 canônico */}
                    <div className="p-3.5 rounded-xl bg-[#0A1628] border border-[#059669]/30 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-[#059669]">
                          Hash Canônico SHA-256 Inviolável:
                        </span>
                        <span className="text-[10px] text-[#94A3B8] font-mono">
                          256 bits digest
                        </span>
                      </div>
                      <div className="font-mono text-xs text-[#D9B36C] break-all">
                        e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-[#94A3B8]">
                    <span>
                      Auditoria aberta a qualquer comprador, banco de fomento ou autoridade fiscal
                    </span>
                    <Link
                      to="/verificador"
                      className="text-[#059669] font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Consultar outro código ou CNPJ</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* TELA 3: PASSAPORTE DIGITAL DE PRODUTO (DPP) */}
              {activeTab === 'passaporte' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Cpu className="w-4 h-4 text-[#059669]" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#059669]">
                          PASSAPORTE DIGITAL DE PRODUTO (DPP) • LOTE VEICULAR
                        </span>
                      </div>
                      <h3 className="font-heading font-black text-xl sm:text-2xl text-[#F8FAFC]">
                        Renault Clio Authentique 1.0 16V Hi-Flex
                      </h3>
                      <p className="text-xs font-mono text-[#D9B36C] mt-0.5">
                        Baixa DETRAN: PR-BX-2026-1240105 • Cartela: 12401050711
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#059669]/10 text-[#059669] text-xs font-bold border border-[#059669]/40">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        49 Peças Homologadas
                      </span>
                    </div>
                  </div>

                  {/* Grid de Balanço de Massa e Métricas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 text-center">
                      <span className="text-[10px] text-[#94A3B8] uppercase block font-mono">
                        CO2e Evitado
                      </span>
                      <span className="font-heading font-black text-lg sm:text-xl text-[#059669]">
                        629,40 kg
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 text-center">
                      <span className="text-[10px] text-[#94A3B8] uppercase block font-mono">
                        Massa Circular
                      </span>
                      <span className="font-heading font-black text-lg sm:text-xl text-[#F8FAFC]">
                        684,20 kg
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 text-center">
                      <span className="text-[10px] text-[#94A3B8] uppercase block font-mono">
                        Índice Circularidade
                      </span>
                      <span className="font-heading font-black text-lg sm:text-xl text-[#D9B36C]">
                        74,2%
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 text-center">
                      <span className="text-[10px] text-[#94A3B8] uppercase block font-mono">
                        QR Code Unitário
                      </span>
                      <span className="font-heading font-black text-lg sm:text-xl text-[#F8FAFC]">
                        100% Ativo
                      </span>
                    </div>
                  </div>

                  {/* Amostra da lista de peças catalogadas */}
                  <div className="p-4 rounded-xl bg-[#0A1628] border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono pb-2 border-b border-slate-800">
                      <span>Componente Automotivo</span>
                      <span>Material / Peso</span>
                      <span>CO2e Evitado</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#F8FAFC] font-medium">Motor de Partida 12V</span>
                      <span className="text-[#94A3B8]">Aço/Cobre • 3,80 kg</span>
                      <span className="text-[#059669] font-bold">14,20 kg CO2e</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#F8FAFC] font-medium">Alternador 90A</span>
                      <span className="text-[#94A3B8]">Alumínio/Cobre • 5,40 kg</span>
                      <span className="text-[#059669] font-bold">29,80 kg CO2e</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#F8FAFC] font-medium">Caixa de Direção Mecânica</span>
                      <span className="text-[#94A3B8]">Aço Forjado • 8,20 kg</span>
                      <span className="text-[#059669] font-bold">22,50 kg CO2e</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-[#94A3B8]">
                    <span>Passaporte emitido sob o Decreto Federal 11.413/2023</span>
                    <Link
                      to="/passaporte-lote/PR-BX-2026-1240105"
                      className="text-[#059669] font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Abrir passaporte completo deste lote</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PlatformProofScreenshots
