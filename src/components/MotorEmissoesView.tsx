import React from 'react'
import {
  Factory,
  Zap,
  Truck,
  Leaf,
  Layers,
  AlertTriangle,
  Info,
  CheckCircle2,
  BookmarkCheck,
} from 'lucide-react'
import { InventarioEmissoesResultado } from '@/services/motorEmissoes'

interface MotorEmissoesViewProps {
  inventario: InventarioEmissoesResultado
  onToggleIREC?: (possui: boolean) => void
  possuiIREC?: boolean
  onSalvarInventario?: () => void
  isSalvando?: boolean
}

export const MotorEmissoesView: React.FC<MotorEmissoesViewProps> = ({
  inventario,
  onToggleIREC,
  possuiIREC = false,
  onSalvarInventario,
  isSalvando = false,
}) => {
  const { enquadramentoSBCE } = inventario

  return (
    <div className="space-y-6">
      {/* 1. Header do Laudo Pericial de Emissões */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#16202B] via-[#111820] to-[#16202B] border border-[#12B886]/40 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/50 text-[#12B886] text-xs font-bold uppercase tracking-wider mb-2">
              <Leaf className="w-3.5 h-3.5" />
              LAUDO PERICIAL dMRV • LEI FEDERAL 15.042/2024 (SBCE)
            </div>
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#F4F7FA]">
              BALANÇO PERICIAL DE EMISSÕES OPERACIONAIS (GHG PROTOCOL)
            </h3>
            <p className="text-xs text-[#93A3B5] mt-1">
              Metodologia: {inventario.versaoMetodologia} • Potenciais GWP IPCC AR6 (100 anos)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onSalvarInventario && (
              <button
                type="button"
                onClick={onSalvarInventario}
                disabled={isSalvando}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all flex items-center gap-2 shadow-emerald-glow disabled:opacity-50"
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>{isSalvando ? 'Gravando Laudo...' : 'Salvar Laudo no Banco'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Grid de Escopos: Escopo 1, Escopo 2 (Duplo Reporte), Escopo 3 e Insetting */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Escopo 1 */}
        <div className="p-5 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#93A3B5] flex items-center gap-1.5">
                <Factory className="w-4 h-4 text-[#F59E0B]" />
                Escopo 1 (Direto)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] font-semibold">
                Tier 2
              </span>
            </div>
            <div className="text-2xl font-heading font-black text-[#F4F7FA]">
              {inventario.escopo1TotalTCO2e.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}{' '}
              <span className="text-xs font-normal text-[#93A3B5]">tCO₂e</span>
            </div>
            <p className="text-[11px] text-[#93A3B5] mt-1">
              Combustíveis fósseis (diesel, gasolina, GLP, GNV) em frotas próprias ou processos.
            </p>
          </div>
          <div className="pt-3 border-t border-[rgba(244,247,250,0.06)] mt-3 text-[10px] text-[#93A3B5] flex justify-between">
            <span>Bio (separado):</span>
            <span className="text-[#12B886] font-mono font-semibold">
              {inventario.emissoesBiogenicasTotalTCO2e.toFixed(3)} tCO₂bio
            </span>
          </div>
        </div>

        {/* Escopo 2 - Duplo Reporte */}
        <div className="p-5 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#93A3B5] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#3B82F6]" />
                Escopo 2 (Eletricidade)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6] font-semibold">
                Duplo Reporte
              </span>
            </div>
            <div className="text-2xl font-heading font-black text-[#F4F7FA]">
              {(possuiIREC
                ? inventario.escopo2MercadoTCO2e
                : inventario.escopo2LocalizacaoTCO2e
              ).toLocaleString('pt-BR', { minimumFractionDigits: 3 })}{' '}
              <span className="text-xs font-normal text-[#93A3B5]">tCO₂e</span>
            </div>
            <div className="mt-2 text-[11px] space-y-1">
              <div className="flex justify-between text-[#93A3B5]">
                <span>Localização (SIN/MCTI):</span>
                <span className="font-mono text-[#F4F7FA]">
                  {inventario.escopo2LocalizacaoTCO2e.toFixed(3)} tCO₂e
                </span>
              </div>
              <div className="flex justify-between text-[#93A3B5]">
                <span>Mercado (c/ I-REC):</span>
                <span className="font-mono text-[#12B886]">
                  {inventario.escopo2MercadoTCO2e.toFixed(3)} tCO₂e
                </span>
              </div>
            </div>
          </div>
          {onToggleIREC && (
            <div className="pt-3 border-t border-[rgba(244,247,250,0.06)] mt-3 flex items-center justify-between">
              <label className="text-[10px] text-[#93A3B5] flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={possuiIREC}
                  onChange={(e) => onToggleIREC(e.target.checked)}
                  className="rounded border-[rgba(244,247,250,0.2)] text-[#12B886] focus:ring-[#12B886]"
                />
                Possui I-REC / PPA Verde
              </label>
            </div>
          )}
        </div>

        {/* Escopo 3 */}
        <div className="p-5 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#93A3B5] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#8B5CF6]" />
                Escopo 3 (Cadeia)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#8B5CF6]/10 text-[#8B5CF6] font-semibold">
                GLEC / DEFRA
              </span>
            </div>
            <div className="text-2xl font-heading font-black text-[#F4F7FA]">
              {inventario.escopo3TotalTCO2e.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}{' '}
              <span className="text-xs font-normal text-[#93A3B5]">tCO₂e</span>
            </div>
            <p className="text-[11px] text-[#93A3B5] mt-1">
              Transporte de terceiros (CT-e/MDF-e), saneamento, água, efluentes e telecom.
            </p>
          </div>
          <div className="pt-3 border-t border-[rgba(244,247,250,0.06)] mt-3 text-[10px] text-[#93A3B5] flex justify-between">
            <span>Incerteza Padrão:</span>
            <span className="text-[#D9B36C] font-mono">±12% (Tier 1/2)</span>
          </div>
        </div>

        {/* Insetting Circular ISO 14067 (CDV / MOVER) */}
        <div className="p-5 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#12B886] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#12B886]" />
                Insetting ISO 14067
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-semibold">
                Evitação
              </span>
            </div>
            <div className="text-2xl font-heading font-black text-[#12B886]">
              -
              {inventario.insettingTotalTCO2e.toLocaleString('pt-BR', {
                minimumFractionDigits: 3,
              })}{' '}
              <span className="text-xs font-normal text-[#93A3B5]">tCO₂e</span>
            </div>
            <p className="text-[11px] text-[#93A3B5] mt-1">
              Crédito circular por reaproveitamento de componentes e peças em CDVs credenciados.
            </p>
          </div>
          <div className="pt-3 border-t border-[rgba(244,247,250,0.06)] mt-3 text-[10px] text-[#93A3B5] flex justify-between">
            <span>Norma:</span>
            <span className="text-[#12B886] font-semibold">ISO 14067 / MOVER</span>
          </div>
        </div>
      </div>

      {/* 3. Limiares SBCE (Lei 15.042/2024): 10.000 tCO2e e 25.000 tCO2e */}
      <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#D9B36C]" />
              <h4 className="font-heading font-bold text-base text-[#F4F7FA]">
                ENQUADRAMENTO SBCE (LEI FEDERAL 15.042/2024)
              </h4>
            </div>
            <p className="text-xs text-[#93A3B5] mt-0.5">{enquadramentoSBCE.titulo}</p>
          </div>

          <div className="text-right">
            <span className="text-xs uppercase font-bold text-[#93A3B5] block">
              Emissões Fósseis Totais
            </span>
            <span className="text-2xl font-heading font-black text-[#F4F7FA]">
              {inventario.emissoesTotaisFosseisTCO2e.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}{' '}
              <span className="text-xs text-[#93A3B5]">tCO₂e/ano</span>
            </span>
          </div>
        </div>

        {/* Barras de progresso dos limiares regulatórios */}
        <div className="space-y-4 pt-2">
          {/* Limiar 1: 10.000 tCO2e (Reporte e Monitoramento) */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[#93A3B5] flex items-center gap-1.5">
                <span>Limiar 1: Reporte Obrigatório (10.000 tCO₂e/ano)</span>
                {inventario.emissoesTotaisFosseisTCO2e >= 10000 && (
                  <span className="px-1.5 py-0.2 rounded bg-[#D9B36C]/20 text-[#D9B36C] text-[10px] font-bold">
                    ATINGIDO
                  </span>
                )}
              </span>
              <span className="font-mono text-[#F4F7FA] font-semibold">
                {inventario.emissoesTotaisFosseisTCO2e.toFixed(1)} / 10.000 tCO₂e (
                {enquadramentoSBCE.limiar10kPct}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#0A0E12] overflow-hidden border border-[rgba(244,247,250,0.08)]">
              <div
                className={`h-full transition-all rounded-full ${
                  enquadramentoSBCE.limiar10kPct >= 100
                    ? 'bg-[#D9B36C]'
                    : 'bg-gradient-to-r from-[#12B886] to-[#0CA678]'
                }`}
                style={{ width: `${Math.min(100, enquadramentoSBCE.limiar10kPct)}%` }}
              />
            </div>
          </div>

          {/* Limiar 2: 25.000 tCO2e (Compensação e Metas Obrigatórias) */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[#93A3B5] flex items-center gap-1.5">
                <span>Limiar 2: Compensação & Alocação de Cotas (25.000 tCO₂e/ano)</span>
                {inventario.emissoesTotaisFosseisTCO2e >= 25000 && (
                  <span className="px-1.5 py-0.2 rounded bg-[#F03E54]/20 text-[#F03E54] text-[10px] font-bold">
                    EXCEDIDO
                  </span>
                )}
              </span>
              <span className="font-mono text-[#F4F7FA] font-semibold">
                {inventario.emissoesTotaisFosseisTCO2e.toFixed(1)} / 25.000 tCO₂e (
                {enquadramentoSBCE.limiar25kPct}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#0A0E12] overflow-hidden border border-[rgba(244,247,250,0.08)]">
              <div
                className={`h-full transition-all rounded-full ${
                  enquadramentoSBCE.limiar25kPct >= 100
                    ? 'bg-[#F03E54]'
                    : 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]'
                }`}
                style={{ width: `${Math.min(100, enquadramentoSBCE.limiar25kPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Parecer Pericial Explicativo */}
        <div className="mt-4 p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-xs text-[#93A3B5] leading-relaxed flex items-start gap-3">
          <Info className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#F4F7FA] block mb-0.5">Parecer Pericial dMRV:</strong>
            {enquadramentoSBCE.explicacao}
          </div>
        </div>
      </div>

      {/* 4. Rastreabilidade Detalhada dos Fatores Oficiais Utilizados */}
      <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-heading font-bold text-base text-[#F4F7FA]">
              MEMÓRIA DE CÁLCULO & RASTREABILIDADE METODOLÓGICA
            </h4>
            <p className="text-xs text-[#93A3B5]">
              Cada linha do laudo possui indicação de fonte oficial (MCTI/SIN, GHG Protocol Brasil,
              IPCC AR6).
            </p>
          </div>
          <span className="text-xs font-mono text-[#12B886] bg-[#12B886]/10 px-2.5 py-1 rounded-full border border-[#12B886]/20">
            Incerteza Ponderada: ±{inventario.incertezaConsolidadaPct}%
          </span>
        </div>

        {inventario.itensDetalhados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[rgba(244,247,250,0.1)] text-[#93A3B5] uppercase font-semibold">
                <tr>
                  <th className="py-2 px-3">Escopo / Descrição</th>
                  <th className="py-2 px-3">Qtd / Insumo</th>
                  <th className="py-2 px-3">Fator & Fonte Oficial</th>
                  <th className="py-2 px-3">Tier / Incerteza</th>
                  <th className="py-2 px-3 text-right">tCO₂e Fóssil</th>
                  <th className="py-2 px-3 text-right">tCO₂ Bio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA]">
                {inventario.itensDetalhados.map((item) => (
                  <tr key={item.id} className="hover:bg-[#16202B]/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[#F4F7FA]">{item.descricaoItem}</div>
                      <div className="text-[10px] text-[#93A3B5]">
                        {item.categoria} • {item.subcategoria}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {item.quantidade.toLocaleString('pt-BR')} {item.unidade}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-[#93A3B5]">
                      <div className="text-[#12B886]">{item.fonteFator}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-[#16202B] text-[10px] font-mono text-[#D9B36C]">
                        {item.tierIncerteza} (±{item.incertezaPct}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#F4F7FA]">
                      {item.fossilTCO2e.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#12B886]">
                      {item.biogenicoTCO2e > 0 ? item.biogenicoTCO2e.toFixed(3) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-[#93A3B5]">
            Nenhum dado de nota fiscal associado para gerar a memória pericial.
          </div>
        )}
      </div>
    </div>
  )
}
