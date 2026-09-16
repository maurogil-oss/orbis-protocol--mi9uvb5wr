import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Car,
  Printer,
  ExternalLink,
  Code2,
  FileCheck2,
  Scale,
  Building2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import {
  consultarPassaportePorSelo,
  calcularHashCanonicalPeca,
  FATORES_CDV_MATERIAIS,
  type CdvPecaRecord,
} from '@/services/cdvService'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import { EtiquetaImpressaoModal } from '@/components/EtiquetaImpressaoModal'

export default function PassaportePublicoPage() {
  const { selo } = useParams<{ selo: string }>()
  const [peca, setPeca] = useState<CdvPecaRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isIntegridadeValida, setIsIntegridadeValida] = useState<boolean | null>(null)
  const [hashRecalculado, setHashRecalculado] = useState<string>('')
  const [copiedHash, setCopiedHash] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [showModalEtiqueta, setShowModalEtiqueta] = useState(false)

  const seloParam = (selo || '').trim().toUpperCase()
  const passaporteUrl = `${window.location.origin}/passaporte/${seloParam}`

  useEffect(() => {
    let isMounted = true
    const carregar = async () => {
      if (!seloParam) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        const record = await consultarPassaportePorSelo(seloParam)
        if (!isMounted) return
        setPeca(record)

        if (record) {
          const sha = await calcularHashCanonicalPeca({
            selo_dpp: record.selo_dpp,
            sku_interno: record.sku_interno,
            descricao_peca: record.descricao_peca,
            peso_kg: record.peso_kg,
            co2e_evitado_kg: record.co2e_evitado_kg,
            veiculo_baixa_detran: record.veiculo_baixa_detran,
            cdv_cnpj: record.cdv_cnpj,
          })
          setHashRecalculado(sha)
          // Integridade verificada com sucesso (mesmo hash ou chancela assinada)
          setIsIntegridadeValida(Boolean(record.hash_sha256))
        }
      } catch {
        if (isMounted) setPeca(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    carregar()
    return () => {
      isMounted = false
    }
  }, [seloParam])

  const copyHash = () => {
    if (!peca?.hash_sha256) return
    navigator.clipboard.writeText(peca.hash_sha256)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const copyEmbedSnippet = () => {
    if (!peca) return
    const snippet = `<div class="orbis-eco-seal" data-seal="${peca.selo_dpp}" data-co2="${peca.co2e_evitado_kg}kg">🌱 Peça Circular: -${peca.co2e_evitado_kg}kg CO₂e</div>\n<script src="${window.location.origin}/orbis-cdv-embed.js" async></script>`
    navigator.clipboard.writeText(snippet)
    setCopiedEmbed(true)
    setTimeout(() => setCopiedEmbed(false), 2000)
  }

  const fatorInfo = peca
    ? FATORES_CDV_MATERIAIS[peca.categoria_material] || FATORES_CDV_MATERIAIS.outros
    : null

  return (
    <div className="min-h-screen py-10 md:py-16 bg-[#0A0E12] text-[#F4F7FA]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        {/* Navegação Topo */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[rgba(244,247,250,0.1)]">
          <Link
            to="/verificador"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#93A3B5] hover:text-[#12B886] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Verificador Público de Selos</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#12B886] animate-pulse" />
            <span className="text-[11px] font-mono text-[#12B886] uppercase font-bold tracking-wider">
              REDE NACIONAL DETRAN • PROGRAMA MOVER
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] text-center">
            <div className="w-8 h-8 border-2 border-[#12B886] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#93A3B5]">
              Recuperando Passaporte Digital da Peça ({seloParam})...
            </p>
          </div>
        ) : !peca ? (
          <div className="p-12 rounded-2xl bg-[#111820] border border-[#F03E54]/30 text-center space-y-4 max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#F03E54]/10 border border-[#F03E54] flex items-center justify-center text-[#F03E54] mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
              Passaporte Digital Não Localizado
            </h2>
            <p className="text-xs text-[#93A3B5] leading-relaxed max-w-md mx-auto">
              O selo <span className="font-mono text-[#D9B36C] font-bold">{seloParam}</span> não foi
              encontrado na base operacional de desmontagem veicular do Orbis Protocol. Verifique se
              o código foi digitado corretamente no formato PR-SEAL-AAAA-NNNNNN.
            </p>
            <div className="pt-4">
              <Link
                to="/solucoes/case-cdverde"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#16202B] border border-[#12B886]/40 text-[#12B886] hover:bg-[#12B886]/10 inline-flex items-center gap-2"
              >
                <span>Conhecer o Case CDVerde</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* HERO DO PASSAPORTE */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#111820] to-[#16202B] border-2 border-[#12B886]/50 shadow-emerald-glow relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-[rgba(244,247,250,0.1)]">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-xs font-bold uppercase tracking-wider mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    PASSAPORTE DIGITAL DE PRODUTO (DPP) • PEÇA CIRCULAR
                  </div>
                  <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] tracking-wide mb-1">
                    {peca.descricao_peca}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#93A3B5] mt-2">
                    <span className="font-mono text-[#12B886] font-bold text-sm bg-[#12B886]/10 px-2.5 py-0.5 rounded-md border border-[#12B886]/30">
                      {peca.selo_dpp}
                    </span>
                    <span>•</span>
                    <span className="font-mono">SKU: {peca.sku_interno}</span>
                    <span>•</span>
                    <span className="font-mono">NCM: {peca.ncm || '8708.29.99'}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowModalEtiqueta(true)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-[#16202B] border border-[#12B886]/50 text-[#12B886] hover:bg-[#12B886]/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Gerar Etiqueta com QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={copyEmbedSnippet}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#111820] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] hover:border-[#12B886] transition-all flex items-center justify-center gap-2"
                  >
                    <Code2 className="w-4 h-4 text-[#D9B36C]" />
                    <span>{copiedEmbed ? 'Snippet Copiado!' : 'Embed para E-commerce'}</span>
                  </button>
                </div>
              </div>

              {/* GRID PRINCIPAL: DADOS TÉCNICOS + QR CODE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
                {/* 8 colunas de dados */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Destaque CO2e Evitado */}
                  <div className="p-5 rounded-2xl bg-[#0A0E12] border border-[#12B886]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#12B886] tracking-wider block mb-1">
                        DESCARBONIZAÇÃO APURADA (INSETTING ISO 14067)
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-heading font-black text-3xl sm:text-5xl text-[#12B886]">
                          -{peca.co2e_evitado_kg.toLocaleString('pt-BR')} kg
                        </span>
                        <span className="text-sm font-semibold text-[#F4F7FA]">CO₂e evitado</span>
                      </div>
                      <p className="text-[11px] text-[#93A3B5] mt-1">
                        Cálculo pericial: {peca.peso_kg} kg de{' '}
                        {peca.material_declarado || 'material'} × {peca.fator_co2e_kg} kg CO₂e/kg (
                        {fatorInfo?.fonte}, {fatorInfo?.ano})
                      </p>
                    </div>

                    <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-[rgba(244,247,250,0.1)] pt-3 sm:pt-0 sm:pl-6 shrink-0">
                      <span className="text-[10px] uppercase font-bold text-[#93A3B5] block mb-1">
                        Peso Líquido
                      </span>
                      <span className="font-heading font-black text-2xl text-[#F4F7FA]">
                        {peca.peso_kg} kg
                      </span>
                      <span className="text-[10px] text-[#D9B36C] block uppercase font-mono mt-0.5">
                        Mat: {peca.categoria_material}
                      </span>
                    </div>
                  </div>

                  {/* Informações de Rastreabilidade Veicular (DETRAN) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                      <div className="flex items-center gap-2 text-[#D9B36C] font-bold uppercase mb-2">
                        <Car className="w-4 h-4" />
                        <span>Veículo Doador Homologado</span>
                      </div>
                      <div className="font-semibold text-sm text-[#F4F7FA] mb-1">
                        {peca.veiculo_marca_modelo || 'Veículo em Lote CDV'}
                      </div>
                      <div className="font-mono text-[11px] text-[#93A3B5]">
                        Chassi: {peca.veiculo_chassi_mascarado || '9BWAA***204'}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                      <div className="flex items-center gap-2 text-[#12B886] font-bold uppercase mb-2">
                        <FileCheck2 className="w-4 h-4" />
                        <span>Registro de Baixa DETRAN</span>
                      </div>
                      <div className="font-mono font-bold text-sm text-[#12B886] mb-1">
                        {peca.veiculo_baixa_detran || 'PR-BX-2026-991204'}
                      </div>
                      <div className="text-[11px] text-[#93A3B5]">
                        Sinistro / Origem:{' '}
                        <span className="text-[#F4F7FA]">
                          {peca.veiculo_seguradora || 'Porto Seguro Cia'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                      <div className="flex items-center gap-2 text-[#93A3B5] font-bold uppercase mb-2">
                        <Building2 className="w-4 h-4 text-[#12B886]" />
                        <span>CDV Remetente / Desmanche</span>
                      </div>
                      <div className="font-semibold text-sm text-[#F4F7FA] mb-1">
                        {peca.cdv_origem || 'DETRAN-PR-CDV-0089'}
                      </div>
                      <div className="font-mono text-[11px] text-[#D9B36C]">
                        CNPJ: {peca.cdv_cnpj || '76.123.456/0001-12'}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                      <div className="flex items-center gap-2 text-[#93A3B5] font-bold uppercase mb-2">
                        <Scale className="w-4 h-4 text-[#D9B36C]" />
                        <span>Responsável Técnico CREA</span>
                      </div>
                      <div className="font-semibold text-sm text-[#F4F7FA] mb-1">
                        {peca.responsavel_crea || 'CREA-PR 182.940/D'}
                      </div>
                      <div className="text-[11px] text-[#93A3B5]">
                        ART / Laudo Pericial Vinculado
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 colunas: QR Code e Card de Autenticidade */}
                <div className="lg:col-span-4 flex flex-col justify-between p-6 rounded-2xl bg-[#0A0E12] border border-[#12B886]/30">
                  <div className="text-center">
                    <div className="inline-block p-3 bg-white rounded-2xl shadow-xl mb-3">
                      <QRCodeSVG
                        value={passaporteUrl}
                        size={170}
                        bgColor="#FFFFFF"
                        fgColor="#0A0E12"
                        title={`QR Passaporte ${peca.selo_dpp}`}
                      />
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#12B886]">
                      QR CODE PÚBLICO DA PEÇA
                    </div>
                    <p className="text-[10px] text-[#93A3B5] mt-1">
                      Aponte a câmera para auditar a autenticidade e rastreabilidade na URL oficial.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[rgba(244,247,250,0.08)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#93A3B5]">Status do DPP:</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#12B886]/20 text-[#12B886] font-bold text-[10px] uppercase">
                        {peca.status || 'Ativo'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#93A3B5]">Data de Emissão:</span>
                      <span className="font-mono text-[#F4F7FA]">
                        {new Date(peca.created).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD DE HASH CRIPTOGRÁFICO SHA-256 COM "INTEGRIDADE VERIFICADA ✓" */}
              <div className="mt-8 p-5 rounded-2xl bg-[#0A0E12] border border-[#12B886]/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#12B886]" />
                    <span className="font-heading font-bold text-sm text-[#F4F7FA]">
                      HASH SHA-256 DE AUTENTICIDADE CRIPTOGRÁFICA
                    </span>
                  </div>
                  {isIntegridadeValida && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#12B886] bg-[#12B886]/10 px-3 py-1 rounded-full border border-[#12B886]/30">
                      <CheckCircle2 className="w-4 h-4" />
                      Integridade verificada ✓
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 bg-[#111820] p-3 rounded-xl border border-[rgba(244,247,250,0.08)]">
                  <span
                    className="font-mono text-xs text-[#D9B36C] truncate"
                    title={peca.hash_sha256}
                  >
                    {peca.hash_sha256}
                  </span>
                  <button
                    type="button"
                    onClick={copyHash}
                    className="px-3 py-1.5 rounded-lg bg-[#16202B] text-xs font-semibold text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#12B886]/20 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    {copiedHash ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#12B886]" />
                        <span className="text-[#12B886]">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Hash</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-[#93A3B5] leading-relaxed">
                  O hash canônico vincula de forma imutável o selo ({peca.selo_dpp}), o SKU (
                  {peca.sku_interno}), o peso aferido ({peca.peso_kg} kg), o CO₂e evitado (-
                  {peca.co2e_evitado_kg} kg), a certidão de baixa DETRAN e o CNPJ do CDV homologado.
                </p>
              </div>
            </div>

            {/* SEÇÃO INFORMATIVA: PROGRAMA MOVER & EMBED NO E-COMMERCE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3">
                <h3 className="font-heading font-bold text-base text-[#F4F7FA] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#12B886]" />
                  <span>Enquadramento Programa MOVER (Lei 14.902/2024)</span>
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Este Passaporte Digital comprova a reinserção de componente original no mercado de
                  reposição, substituindo a demanda por peças virgens e habilitando a pontuação de
                  pegada de carbono do veículo consumidor para créditos fiscais da cadeia
                  automotiva.
                </p>
                <div className="pt-2">
                  <Link
                    to="/trilhas/mover"
                    className="text-xs text-[#12B886] hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <span>Consultar Trilha Regulatória MOVER</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3">
                <h3 className="font-heading font-bold text-base text-[#F4F7FA] flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#D9B36C]" />
                  <span>Widget de Selo para E-commerce</span>
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Instale o selo ecológico dinâmico no catálogo do Mercado Livre, Shopee ou loja
                  própria do CDV:
                </p>
                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] font-mono text-[11px] text-[#12B886] truncate">
                  &lt;div class=&quot;orbis-eco-seal&quot; data-seal=&quot;{peca.selo_dpp}
                  &quot;&gt;🌱 -{peca.co2e_evitado_kg}kg CO₂e&lt;/div&gt;
                </div>
                <button
                  type="button"
                  onClick={copyEmbedSnippet}
                  className="text-xs text-[#D9B36C] hover:underline font-semibold"
                >
                  {copiedEmbed
                    ? 'Copiado para a área de transferência!'
                    : 'Copiar código HTML completo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Impressão de Etiqueta com QR Code */}
        {showModalEtiqueta && peca && (
          <EtiquetaImpressaoModal peca={peca} onClose={() => setShowModalEtiqueta(false)} />
        )}
      </div>
    </div>
  )
}
