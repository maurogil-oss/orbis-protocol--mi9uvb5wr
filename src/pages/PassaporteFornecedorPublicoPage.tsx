import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  TrendingDown,
  Building2,
  Calendar,
  Lock,
  ExternalLink,
  Layers,
  Leaf,
  Award,
  ArrowLeft,
  Share2,
  Check,
} from 'lucide-react'
import {
  consultarPassaportePorTokenPublico,
  PassaportePublicoResponse,
} from '@/services/bureauPassaporteService'
import { QRCodeSVG } from '@/components/QRCodeSVG'

export default function PassaporteFornecedorPublicoPage() {
  const { token } = useParams<{ token: string }>()
  const [passaporte, setPassaporte] = useState<PassaportePublicoResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (token) {
      carregarPassaporte(token)
    }
  }, [token])

  const carregarPassaporte = async (t: string) => {
    setIsLoading(true)
    setErro('')
    try {
      const data = await consultarPassaportePorTokenPublico(t)
      setPassaporte(data)
    } catch (err: any) {
      setErro(err.message || 'Passaporte do fornecedor não encontrado ou inativo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopiarLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-24 bg-[#0A0E12] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#12B886] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase font-mono tracking-wider text-[#93A3B5]">
            Carregando Passaporte Digital Verificado...
          </p>
        </div>
      </div>
    )
  }

  if (erro || !passaporte) {
    return (
      <div className="min-h-screen py-24 bg-[#0A0E12] flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-[#F03E54]/10 border border-[#F03E54] flex items-center justify-center text-[#F03E54] mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
            PASSAPORTE NÃO ENCONTRADO OU INATIVO
          </h1>
          <p className="text-xs text-[#93A3B5] leading-relaxed">
            {erro ||
              'O token informado não possui um passaporte público válido ou foi revogado pelo fornecedor.'}
          </p>
          <div className="pt-2">
            <Link
              to="/bureau"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] text-xs uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Conhecer o Bureau ACP</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 space-y-8">
        {/* Topo / Voltar */}
        <div className="flex items-center justify-between">
          <Link
            to="/bureau"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#93A3B5] hover:text-[#12B886] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Bureau ACP & Governança da Cadeia</span>
          </Link>
          <button
            type="button"
            onClick={handleCopiarLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-xs text-[#93A3B5] hover:text-[#F4F7FA]"
          >
            {copiado ? (
              <Check className="w-3.5 h-3.5 text-[#12B886]" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span>{copiado ? 'Link Copiado!' : 'Compartilhar Consulta'}</span>
          </button>
        </div>

        {/* Banner de Confiança Pericial Orbis Protocol */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#12B886]/15 via-[#16202B] to-[#12B886]/15 border border-[#12B886]/50 shadow-emerald-glow flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#12B886] shrink-0" />
            <div>
              <strong className="text-[#F4F7FA] block text-sm">
                {passaporte.banner_confianca}
              </strong>
              <span className="text-[#93A3B5] text-[11px]">
                Visão do Comprador com Revelação Seletiva de Conformidade (Sem exposição de preços
                ou margens)
              </span>
            </div>
          </div>
          <span className="font-mono text-[10px] text-[#D9B36C] bg-[#0A0E12] px-3 py-1 rounded-full border border-[rgba(244,247,250,0.08)]">
            Token: {passaporte.token_consulta}
          </span>
        </div>

        {/* Card Principal do Fornecedor */}
        <div className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#D9B36C]/40 text-[#D9B36C] text-[10px] font-bold tracking-wider uppercase">
                <Award className="w-3.5 h-3.5" />
                PASSAPORTE DO FORNECEDOR CERTIFICADO
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA]">
                {passaporte.empresa_nome}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#93A3B5]">
                <span>
                  CNPJ:{' '}
                  <strong className="font-mono text-[#F4F7FA]">{passaporte.empresa_cnpj}</strong>
                </span>
                {passaporte.setor_atuacao && (
                  <span>
                    Setor: <strong className="text-[#F4F7FA]">{passaporte.setor_atuacao}</strong>
                  </span>
                )}
                {passaporte.data_inventario_origem && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#12B886]" />
                    <span>
                      Inventário:{' '}
                      {new Date(passaporte.data_inventario_origem).toLocaleDateString('pt-BR')}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Score ESG e QR Code */}
            <div className="flex items-center justify-around lg:justify-end gap-6 border-t lg:border-t-0 lg:border-l border-[rgba(244,247,250,0.08)] pt-4 lg:pt-0 lg:pl-6">
              {passaporte.score_esg !== undefined && (
                <div className="text-center">
                  <div className="font-heading font-black text-4xl text-[#12B886]">
                    {passaporte.score_esg}
                    <span className="text-sm font-normal text-[#93A3B5]">/100</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#D9B36C] tracking-wider block mt-1">
                    Score ESG Calculado
                  </span>
                  <span className="text-[9px] text-[#93A3B5]">Auditado dMRV</span>
                </div>
              )}

              <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
                <QRCodeSVG value={window.location.href} size={74} />
              </div>
            </div>
          </div>

          {/* Hash de Integridade */}
          {passaporte.hash_integridade && (
            <div className="mt-6 pt-4 border-t border-[rgba(244,247,250,0.06)] flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-[#93A3B5] gap-2">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#12B886]" />
                <span>Hash Probatório SHA-256:</span>
                <span className="font-mono text-[#D9B36C] truncate max-w-sm">
                  {passaporte.hash_integridade}
                </span>
              </span>
              <span>Consulta pública autenticada via Orbis Protocol</span>
            </div>
          )}
        </div>

        {/* 1. Indicador de Intensidade de Carbono */}
        {passaporte.kg_co2e_por_kg_produzido !== undefined && (
          <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#12B886] block">
                  Intensidade de Carbono de Escopo 1, 2 e 3
                </span>
                <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  DESEMPENHO EMISSIONAL ESPECÍFICO (KG CO₂e / KG PRODUZIDO)
                </h2>
              </div>
              <div className="px-3 py-1 rounded bg-[#12B886]/10 text-[#12B886] font-mono text-xs font-bold">
                Conforme GHG Protocol & ISO 14067
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                <span className="text-[11px] text-[#93A3B5] block mb-1">Fator de Intensidade</span>
                <div className="font-heading font-black text-3xl text-[#12B886]">
                  {passaporte.kg_co2e_por_kg_produzido.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-[#93A3B5]">kg CO₂e/kg</span>
                </div>
                <span className="text-[10px] text-[#D9B36C] mt-1 block">
                  Abaixo da média setorial nacional
                </span>
              </div>

              {passaporte.peso_produzido_kg_ano && (
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                  <span className="text-[11px] text-[#93A3B5] block mb-1">
                    Volume Anual Produzido
                  </span>
                  <div className="font-heading font-black text-2xl text-[#F4F7FA]">
                    {passaporte.peso_produzido_kg_ano.toLocaleString('pt-BR')}{' '}
                    <span className="text-xs font-normal text-[#93A3B5]">kg/ano</span>
                  </div>
                  <span className="text-[10px] text-[#93A3B5] mt-1 block">
                    Base produtiva auditada
                  </span>
                </div>
              )}

              {passaporte.emissoes_totais_tco2e && (
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                  <span className="text-[11px] text-[#93A3B5] block mb-1">
                    Emissões Totais Consolidadas
                  </span>
                  <div className="font-heading font-black text-2xl text-[#D9B36C]">
                    {passaporte.emissoes_totais_tco2e.toLocaleString('pt-BR')}{' '}
                    <span className="text-xs font-normal text-[#93A3B5]">tCO₂e</span>
                  </div>
                  <span className="text-[10px] text-[#12B886] mt-1 block">
                    Totalmente inventariadas
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Curva MAC (Custo Marginal de Abatimento) */}
        {passaporte.curva_mac && passaporte.curva_mac.length > 0 && (
          <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#D9B36C] block">
                  Engenharia Econômico-Climática
                </span>
                <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  CURVA MAC DE DESCARBONIZAÇÃO (MARGINAL ABATEMENT COST)
                </h2>
              </div>
              <span className="text-xs text-[#93A3B5]">
                Custo Líquido (R$/tCO₂e) vs Potencial de Redução (tCO₂e)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {passaporte.curva_mac.map((item, idx) => {
                const isNegativo = item.custo_reais_por_tco2e < 0
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-[#F4F7FA] font-bold text-sm">
                        {item.iniciativa}
                      </strong>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                          isNegativo
                            ? 'bg-[#12B886]/20 text-[#12B886]'
                            : 'bg-[#D9B36C]/20 text-[#D9B36C]'
                        }`}
                      >
                        {item.custo_reais_por_tco2e > 0 ? '+' : ''}
                        {item.custo_reais_por_tco2e} R$/tCO₂e
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#93A3B5] pt-1 border-t border-[rgba(244,247,250,0.05)]">
                      <span>
                        Potencial de Abatimento:{' '}
                        <strong className="text-[#12B886]">
                          {item.potencial_reducao_tco2e} tCO₂e/ano
                        </strong>
                      </span>
                      {item.pay_back_meses && (
                        <span>Payback estimado: {item.pay_back_meses} meses</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 3. Dossiê de Elegibilidade de Crédito Verde (BRDE, Fomento PR, BNDES) */}
        {passaporte.dossie_elegibilidade && (
          <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#12B886] block">
                Alinhamento com Linhas Sustentáveis
              </span>
              <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                DOSSIÊ DE ELEGIBILIDADE GREEN CAPITAL (BRDE / FOMENTO PARANÁ)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {passaporte.dossie_elegibilidade.brde_recupera_sul && (
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#F4F7FA]">BRDE Recupera Sul Verde</strong>
                    <span className="px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-bold text-[10px]">
                      Score {passaporte.dossie_elegibilidade.brde_recupera_sul.pontuacao}/100
                    </span>
                  </div>
                  <ul className="text-[11px] text-[#93A3B5] space-y-1 pt-1">
                    {passaporte.dossie_elegibilidade.brde_recupera_sul.itens_atendidos.map(
                      (it, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#12B886] shrink-0" />
                          <span>{it}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

              {passaporte.dossie_elegibilidade.fomento_parana_verde && (
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#F4F7FA]">Fomento Paraná Verde</strong>
                    <span className="px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-bold text-[10px]">
                      Score {passaporte.dossie_elegibilidade.fomento_parana_verde.pontuacao}/100
                    </span>
                  </div>
                  <ul className="text-[11px] text-[#93A3B5] space-y-1 pt-1">
                    {passaporte.dossie_elegibilidade.fomento_parana_verde.itens_atendidos.map(
                      (it, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#12B886] shrink-0" />
                          <span>{it}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

              {passaporte.dossie_elegibilidade.bndes_clima && (
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#F4F7FA]">BNDES Fundo Clima</strong>
                    <span className="px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-bold text-[10px]">
                      Score {passaporte.dossie_elegibilidade.bndes_clima.pontuacao}/100
                    </span>
                  </div>
                  <ul className="text-[11px] text-[#93A3B5] space-y-1 pt-1">
                    {passaporte.dossie_elegibilidade.bndes_clima.itens_atendidos.map((it, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#12B886] shrink-0" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Certidões Fiscais e Ambientais */}
        {passaporte.certidoes && passaporte.certidoes.length > 0 && (
          <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#D9B36C] block">
                Regularidade Regulatória & Pericial
              </span>
              <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                CERTIDÕES DE REGULARIDADE E CONFORMIDADE
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {passaporte.certidoes.map((c, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <strong className="text-[#F4F7FA] block">{c.nome}</strong>
                    <span className="text-[10px] text-[#93A3B5]">{c.emissor}</span>
                    {c.validade && (
                      <div className="text-[10px] text-[#12B886]">
                        Validade até {new Date(c.validade).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#12B886]/20 text-[#12B886] font-bold text-[10px] uppercase shrink-0">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Matriz GRI Simplificada */}
        {passaporte.matriz_gri && (
          <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#12B886] block">
                Padrão Global de Relato
              </span>
              <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                MATRIZ GRI SIMPLIFICADA (GLOBAL REPORTING INITIATIVE)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dimensão Econômica */}
              {passaporte.matriz_gri.economica && (
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.06)] pb-1.5">
                    <strong className="text-[#F4F7FA]">GRI Econômico</strong>
                    <span className="text-[10px] text-[#12B886] font-bold uppercase">
                      {passaporte.matriz_gri.economica.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {passaporte.matriz_gri.economica.itens.map((it, idx) => (
                      <div key={idx} className="text-[11px] text-[#93A3B5]">
                        <span className="font-mono text-[#D9B36C] font-semibold">{it.codigo}:</span>{' '}
                        {it.nome}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dimensão Ambiental */}
              {passaporte.matriz_gri.ambiental && (
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.06)] pb-1.5">
                    <strong className="text-[#F4F7FA]">GRI Ambiental</strong>
                    <span className="text-[10px] text-[#12B886] font-bold uppercase">
                      {passaporte.matriz_gri.ambiental.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {passaporte.matriz_gri.ambiental.itens.map((it, idx) => (
                      <div key={idx} className="text-[11px] text-[#93A3B5]">
                        <span className="font-mono text-[#12B886] font-semibold">{it.codigo}:</span>{' '}
                        {it.nome}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dimensão Social */}
              {passaporte.matriz_gri.social && (
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.06)] pb-1.5">
                    <strong className="text-[#F4F7FA]">GRI Social</strong>
                    <span className="text-[10px] text-[#12B886] font-bold uppercase">
                      {passaporte.matriz_gri.social.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {passaporte.matriz_gri.social.itens.map((it, idx) => (
                      <div key={idx} className="text-[11px] text-[#93A3B5]">
                        <span className="font-mono text-[#D9B36C] font-semibold">{it.codigo}:</span>{' '}
                        {it.nome}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rodapé Informativo */}
        <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.08)] text-center space-y-2">
          <p className="text-xs text-[#93A3B5]">
            Este documento é emitido pelo Bureau ACP em conjunto com o{' '}
            <strong className="text-[#F4F7FA]">Orbis Protocol</strong>. Garantia de integridade
            técnica conforme normas NBC TO 3000 (CFC) e regulamentos de descarbonização do Programa
            MOVER.
          </p>
          <div className="text-[11px] text-[#93A3B5]/80">
            Deseja verificar outros fornecedores ou emitir o passaporte da sua empresa?{' '}
            <Link to="/bureau" className="text-[#12B886] underline font-semibold">
              Conheça o Cockpit do Bureau ACP
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
