import React, { useRef } from 'react'
import { QRCodeSVG } from './QRCodeSVG'
import { Printer, ShieldCheck, Leaf } from 'lucide-react'
import type { CdvPecaRecord } from '@/services/cdvService'

interface EtiquetaImpressaoModalProps {
  peca: CdvPecaRecord
  onClose: () => void
}

export function EtiquetaImpressaoModal({ peca, onClose }: EtiquetaImpressaoModalProps) {
  const printAreaRef = useRef<HTMLDivElement | null>(null)
  const passaporteUrl = `${window.location.origin}/passaporte/${peca.selo_dpp}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111820] border border-[rgba(244,247,250,0.15)] rounded-2xl max-w-lg w-full p-6 text-[#F4F7FA] shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(244,247,250,0.1)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#12B886]" />
            <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
              ETIQUETA TÉCNICA DPP (PADRÃO CDV / DETRAN)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#93A3B5] hover:text-[#F4F7FA] px-2 py-1"
          >
            Fechar ✕
          </button>
        </div>

        {/* ÁREA DA ETIQUETA IMPRIMÍVEL (DESIGN FOCADO EM IMPRESSORA TÉRMICA / CORTE 10x7cm) */}
        <div
          className="my-6 p-4 bg-white text-black rounded-xl border border-gray-300 shadow-inner print:m-0 print:border-none print:shadow-none"
          ref={printAreaRef}
        >
          <div className="flex items-start justify-between border-b-2 border-black pb-2 mb-2">
            <div>
              <div className="flex items-center gap-1 font-black text-xs tracking-wider uppercase text-black">
                <Leaf className="w-3.5 h-3.5 text-emerald-700" />
                <span>ORBIS PROTOCOL • CDVERDE</span>
              </div>
              <div className="text-[10px] text-gray-700 font-semibold">
                Passaporte Digital de Peça Automotiva (DPP)
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold uppercase bg-black text-white px-1.5 py-0.5 rounded">
                MOVER 2026
              </span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-8 space-y-1 text-[11px]">
              <div>
                <span className="text-[9px] text-gray-500 uppercase font-bold block">
                  Selo DPP:
                </span>
                <span className="font-mono font-black text-sm text-black block tracking-tight">
                  {peca.selo_dpp}
                </span>
              </div>

              <div>
                <span className="text-[9px] text-gray-500 uppercase font-bold block">Peça:</span>
                <span className="font-bold text-black line-clamp-2 leading-tight">
                  {peca.descricao_peca}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 pt-1">
                <div>
                  <span className="text-[9px] text-gray-500 block">SKU / Ref:</span>
                  <span className="font-mono font-bold text-[10px] text-gray-900">
                    {peca.sku_interno}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 block">NCM:</span>
                  <span className="font-mono font-bold text-[10px] text-gray-900">
                    {peca.ncm || '—'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1 pt-1 border-t border-gray-200">
                <div>
                  <span className="text-[9px] text-gray-500 block">Peso Aferido:</span>
                  <span className="font-bold text-gray-900">{peca.peso_kg} kg</span>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-800 font-bold block">CO₂e Evitado:</span>
                  <span className="font-black text-emerald-800 text-xs">
                    -{peca.co2e_evitado_kg} kg
                  </span>
                </div>
              </div>

              <div className="text-[9px] text-gray-600 pt-1">
                <span>Baixa DETRAN: </span>
                <strong className="text-black font-mono">
                  {peca.veiculo_baixa_detran || 'PR-BX-2026'}
                </strong>
              </div>
            </div>

            <div className="col-span-4 flex flex-col items-center justify-center p-1 bg-gray-50 rounded-lg border border-gray-200">
              <QRCodeSVG
                value={passaporteUrl}
                size={95}
                bgColor="#F9FAFB"
                fgColor="#000000"
                title={`QR Code ${peca.selo_dpp}`}
              />
              <span className="text-[8px] font-mono text-gray-600 mt-1 uppercase tracking-tighter">
                Escanear DPP
              </span>
            </div>
          </div>

          <div className="border-t border-black/30 mt-2 pt-1.5 flex items-center justify-between text-[8px] text-gray-600 font-mono">
            <span>CDV: {peca.cdv_origem || 'DETRAN-PR-CDV-0089'}</span>
            <span className="truncate max-w-[170px]" title={peca.hash_sha256}>
              SHA-256: {peca.hash_sha256.slice(0, 16)}...
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA]"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all flex items-center gap-1.5 shadow-emerald-glow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Etiqueta</span>
          </button>
        </div>
      </div>
    </div>
  )
}
