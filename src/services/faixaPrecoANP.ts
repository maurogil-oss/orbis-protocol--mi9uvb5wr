/**
 * Referência paramétrica para análise de consistência e plausibilidade de preços
 * unitários implícitos de combustíveis (valor total ÷ quantidade em litros).
 *
 * AVISO METODOLÓGICO:
 * Esta tabela é declarada e mantida como CRITÉRIO INTERNO de triagem e controle
 * de qualidade de dados do protocolo, NÃO constituindo norma legal cogente.
 * Valores de referência informativos calibrados por médias de mercado:
 * - Diesel: média ~R$ 5,95/L (desvio padrão σ ~0,50)
 * - Gasolina: média ~R$ 5,80/L (desvio padrão σ ~0,45)
 * - Etanol: média ~R$ 3,80/L (desvio padrão σ ~0,40)
 *
 * Fora de ±3σ (limiar configurável): sinaliza flag informativa de revisão recomendada.
 * NÃO bloqueia a gravação nem o cálculo de emissões.
 */

export interface ParametroReferenciaANP {
  combustivel: 'diesel' | 'gasolina' | 'etanol'
  nomeExibicao: string
  precoMedio: number // R$/L
  desvioPadrao: number // σ em R$/L
  multiplicadorSigmaPadrao: number // padrão 3.0 (±3σ)
}

export const REFERENCIA_PRECOS_ANP: Record<
  'diesel' | 'gasolina' | 'etanol',
  ParametroReferenciaANP
> = {
  diesel: {
    combustivel: 'diesel',
    nomeExibicao: 'Óleo Diesel (S10 / Comum)',
    precoMedio: 5.95,
    desvioPadrao: 0.5,
    multiplicadorSigmaPadrao: 3.0,
  },
  gasolina: {
    combustivel: 'gasolina',
    nomeExibicao: 'Gasolina Comum / Aditivada',
    precoMedio: 5.8,
    desvioPadrao: 0.45,
    multiplicadorSigmaPadrao: 3.0,
  },
  etanol: {
    combustivel: 'etanol',
    nomeExibicao: 'Etanol Hidratado Combustível',
    precoMedio: 3.8,
    desvioPadrao: 0.4,
    multiplicadorSigmaPadrao: 3.0,
  },
}

export interface ResultadoValidacaoFaixaANP {
  dentroFaixa: boolean
  precoUnitarioImplicito?: number
  precoMedioReferencia?: number
  limiteInferior?: number
  limiteSuperior?: number
  desvioSigmas?: number
  flagsRevisao: string[]
  motivo?: string
}

export const FLAG_DESVIO_ANP_MSG = 'Revisão recomendada — desvio de preço vs. referência ANP'

/**
 * Valida o preço unitário implícito de combustível em relação à faixa de tolerância ±k*σ.
 */
export function validarFaixaPrecoANP(
  combustivel: 'diesel' | 'gasolina' | 'etanol' | string | undefined,
  valorTotal: number,
  litros: number,
  multiplicadorSigma: number = 3.0,
): ResultadoValidacaoFaixaANP {
  if (!combustivel || !valorTotal || !litros || litros <= 0 || valorTotal <= 0) {
    return { dentroFaixa: true, flagsRevisao: [] }
  }

  const tipoNormalizado = combustivel.toLowerCase().trim() as 'diesel' | 'gasolina' | 'etanol'
  const ref = REFERENCIA_PRECOS_ANP[tipoNormalizado]
  if (!ref) {
    return { dentroFaixa: true, flagsRevisao: [] }
  }

  const precoUnitario = valorTotal / litros
  const limiteInferior = Math.max(0.01, ref.precoMedio - multiplicadorSigma * ref.desvioPadrao)
  const limiteSuperior = ref.precoMedio + multiplicadorSigma * ref.desvioPadrao
  const desvioSigmas = Math.abs(precoUnitario - ref.precoMedio) / ref.desvioPadrao

  const fora = precoUnitario < limiteInferior || precoUnitario > limiteSuperior

  if (fora) {
    return {
      dentroFaixa: false,
      precoUnitarioImplicito: Math.round(precoUnitario * 100) / 100,
      precoMedioReferencia: ref.precoMedio,
      limiteInferior: Math.round(limiteInferior * 100) / 100,
      limiteSuperior: Math.round(limiteSuperior * 100) / 100,
      desvioSigmas: Math.round(desvioSigmas * 10) / 10,
      flagsRevisao: [FLAG_DESVIO_ANP_MSG],
      motivo: `Preço implícito de R$ ${precoUnitario.toFixed(2)}/L diverge da faixa de referência interna (${ref.nomeExibicao}: R$ ${limiteInferior.toFixed(2)} a R$ ${limiteSuperior.toFixed(2)}/L com ±${multiplicadorSigma}σ).`,
    }
  }

  return {
    dentroFaixa: true,
    precoUnitarioImplicito: Math.round(precoUnitario * 100) / 100,
    precoMedioReferencia: ref.precoMedio,
    limiteInferior: Math.round(limiteInferior * 100) / 100,
    limiteSuperior: Math.round(limiteSuperior * 100) / 100,
    desvioSigmas: Math.round(desvioSigmas * 10) / 10,
    flagsRevisao: [],
  }
}
