/**
 * SERVIÇO DE BASE DEMONSTRATIVA PEDAGÓGICA — ORBIS PROTOCOL
 *
 * Contém os 4 modelos centrais de demonstração pedagógica com CNPJs matematicamente
 * válidos (dígitos verificadores calculados pelo algoritmo oficial da Receita Federal
 * com pesos 5,4,3,2,9,8,7,6,5,4,3,2 e 6,5,4,3,2,9,8,7,6,5,4,3,2 mantendo as mesmas raízes).
 *
 * Configuração exigida:
 * 1) 76.123.456/0001-00: Lucro Presumido
 * 2) 14.882.310/0001-91: Lucro Real
 * 3) 43.904.740/0001-65: Lucro Real
 * 4) 18.394.029/0001-60: Lucro Presumido
 *
 * 2 configurados como Lucro Presumido e 2 como Lucro Real.
 * Razão social pedagógica:
 * - 'Empresa Demonstrativa — Lucro Presumido Ltda.'
 * - 'Empresa Demonstrativa — Lucro Real S.A.'
 * CNAE, regime tributário e enquadramento SBCE coerentes e pré-configurados.
 */

import { cleanCNPJ, isValidCNPJ, DadosEmpresaCNPJ } from './cnpj'

export interface EmpresaModeloDemonstrativa {
  id: string
  cnpj: string
  cnpjLimpo: string
  razao_social: string
  nome_fantasia: string
  regime_tributario: 'Lucro Presumido' | 'Lucro Real'
  cnae_fiscal: string
  cnae_fiscal_descricao: string
  natureza_juridica: string
  porte: string
  municipio: string
  uf: string
  logradouro: string
  numero: string
  bairro: string
  cep: string
  email: string
  whatsapp: string
  responsavel: string
  categoria_profissional: string
  conselho: string
  vinculo_institucional: string
  consumo_energia: string
  frota_propria: 'sim' | 'nao'
  inventario_ghg: 'sim' | 'nao' | 'em_andamento'
  iso_14001: 'sim' | 'nao'
  faixa_emissoes: 'abaixo_10k' | 'entre_10k_25k' | 'acima_25k' | 'nao_sei_calcular'
  enquadramento_sbce: string
  exporta_ue_cbam: 'sim' | 'nao'
  cbam_bens: string
  demonstracao: true
  descricao_pedagogica: string
}

/**
 * Constante central com as 4 empresas-modelo de demonstração pedagógica.
 * Validadas matematicamente pelo algoritmo oficial de DV.
 */
export const EMPRESAS_MODELO_DEMONSTRACAO: EmpresaModeloDemonstrativa[] = [
  // 1. Modelo Lucro Presumido (Comércio & Distribuição)
  {
    id: 'demo-lp-1',
    cnpj: '76.123.456/0001-00',
    cnpjLimpo: '76123456000100',
    razao_social: 'Empresa Demonstrativa — Lucro Presumido Ltda.',
    nome_fantasia: 'Demonstração Orbis Protocol — Modelo Presumido 1',
    regime_tributario: 'Lucro Presumido',
    cnae_fiscal: '46.39-7-01',
    cnae_fiscal_descricao: 'Comércio atacadista de produtos alimentícios em geral',
    natureza_juridica: '206-2 - Sociedade Empresária Limitada',
    porte: 'DEMAIS (MÉDIO PORTE)',
    municipio: 'Curitiba',
    uf: 'PR',
    logradouro: 'Avenida Cândido de Abreu',
    numero: '500',
    bairro: 'Centro Cívico',
    cep: '80530-000',
    email: 'demonstracao.lp1@orbis-protocol.com',
    whatsapp: '(41) 99123-4567',
    responsavel: 'Carlos Eduardo Silva (Demonstração)',
    categoria_profissional: 'Empresário / Diretor / Gestor da Empresa',
    conselho: 'CRA-PR 12948',
    vinculo_institucional: 'Associado ACP (Paraná)',
    consumo_energia: 'Consumo moderado de refrigeração e logística urbana (baixa tensão comercial)',
    frota_propria: 'sim',
    inventario_ghg: 'nao',
    iso_14001: 'nao',
    faixa_emissoes: 'abaixo_10k',
    enquadramento_sbce: 'Abaixo do limiar de reporte no SBCE (< 10.000 tCO₂e/ano)',
    exporta_ue_cbam: 'nao',
    cbam_bens: '',
    demonstracao: true,
    descricao_pedagogica:
      'Modelo pedagógico Lucro Presumido 1: Demonstra o impacto neutro da Reforma Tributária em empresas atacadistas e elegibilidade voluntária para mitigação de spread bancário.',
  },

  // 2. Modelo Lucro Real (Indústria Metalmecânica)
  {
    id: 'demo-lr-1',
    cnpj: '14.882.310/0001-91',
    cnpjLimpo: '14882310000191',
    razao_social: 'Empresa Demonstrativa — Lucro Real S.A.',
    nome_fantasia: 'Demonstração Orbis Protocol — Modelo Lucro Real 1',
    regime_tributario: 'Lucro Real',
    cnae_fiscal: '25.39-0-01',
    cnae_fiscal_descricao: 'Serviços de usinagem, torneamento e solda',
    natureza_juridica: '205-4 - Sociedade Anônima Fechada',
    porte: 'DEMAIS (GRANDE PORTE)',
    municipio: 'São Paulo',
    uf: 'SP',
    logradouro: 'Avenida das Nações Unidas',
    numero: '12901',
    bairro: 'Brooklin',
    cep: '04578-000',
    email: 'demonstracao.lr1@orbis-protocol.com',
    whatsapp: '(11) 98765-4321',
    responsavel: 'Roberto Antunes Mendes (Demonstração)',
    categoria_profissional: 'Engenheiro Mecânico / Ambiental (CREA - Resp. Técnico)',
    conselho: 'CREA-SP 5061234',
    vinculo_institucional: 'Mercado Nacional (Bahia, SP, Brasil)',
    consumo_energia: 'Alto consumo eletrointensivo industrial (alta tensão 138kV)',
    frota_propria: 'sim',
    inventario_ghg: 'em_andamento',
    iso_14001: 'sim',
    faixa_emissoes: 'entre_10k_25k',
    enquadramento_sbce: 'Sujeito a reporte no SBCE (10.000 a 25.000 tCO₂e/ano)',
    exporta_ue_cbam: 'sim',
    cbam_bens: 'aço e fixadores industriais',
    demonstracao: true,
    descricao_pedagogica:
      'Modelo pedagógico Lucro Real 1: Demonstra o aproveitamento pleno de créditos de IBS/CBS na não cumulatividade e enquadramento obrigatório de reporte SBCE + fronteira CBAM.',
  },

  // 3. Modelo Lucro Real (Logística Pesada & Emissões Severas)
  {
    id: 'demo-lr-2',
    cnpj: '43.904.740/0001-65',
    cnpjLimpo: '43904740000165',
    razao_social: 'Empresa Demonstrativa — Lucro Real S.A.',
    nome_fantasia: 'Demonstração Orbis Protocol — Modelo Lucro Real 2',
    regime_tributario: 'Lucro Real',
    cnae_fiscal: '49.30-2-02',
    cnae_fiscal_descricao: 'Transporte rodoviário de carga interestadual e intermunicipal',
    natureza_juridica: '205-4 - Sociedade Anônima Fechada',
    porte: 'DEMAIS (GRANDE PORTE)',
    municipio: 'Salvador',
    uf: 'BA',
    logradouro: 'Avenida Tancredo Neves',
    numero: '2227',
    bairro: 'Caminho das Árvores',
    cep: '41820-021',
    email: 'demonstracao.lr2@orbis-protocol.com',
    whatsapp: '(71) 99234-8899',
    responsavel: 'Mariana Barreto Costa (Demonstração)',
    categoria_profissional: 'Consultor de Sustentabilidade & Compliance',
    conselho: 'CRBio 04981',
    vinculo_institucional: 'Mercado Nacional (Bahia, SP, Brasil)',
    consumo_energia:
      'Frota pesada de caminhões diesel S-10 e matriz elétrica em galpões logísticos',
    frota_propria: 'sim',
    inventario_ghg: 'sim',
    iso_14001: 'sim',
    faixa_emissoes: 'acima_25k',
    enquadramento_sbce: 'Sujeito a reporte e obrigação de compensação no SBCE (> 25.000 tCO₂e/ano)',
    exporta_ue_cbam: 'nao',
    cbam_bens: '',
    demonstracao: true,
    descricao_pedagogica:
      'Modelo pedagógico Lucro Real 2: Demonstra empresas acima de 25.000 tCO₂e/ano no SBCE, obrigadas a compensação via cotas e CPR Verde, com créditos tributários sobre insumos e combustíveis.',
  },

  // 4. Modelo Lucro Presumido (Desmontagem Veicular CDV / MOVER)
  {
    id: 'demo-lp-2',
    cnpj: '18.394.029/0001-60',
    cnpjLimpo: '18394029000160',
    razao_social: 'Empresa Demonstrativa — Lucro Presumido Ltda.',
    nome_fantasia: 'Demonstração Orbis Protocol — CDV Modelo Presumido',
    regime_tributario: 'Lucro Presumido',
    cnae_fiscal: '45.30-7-04',
    cnae_fiscal_descricao:
      'Comércio a varejo de peças e acessórios usados para veículos automotores',
    natureza_juridica: '206-2 - Sociedade Empresária Limitada',
    porte: 'DEMAIS (MÉDIO PORTE)',
    municipio: 'Campinas',
    uf: 'SP',
    logradouro: 'Rodovia Anhanguera, km 98',
    numero: '1500',
    bairro: 'Distrito Industrial',
    cep: '13064-000',
    email: 'demonstracao.lp2@orbis-protocol.com',
    whatsapp: '(19) 98112-9900',
    responsavel: 'Felipe Nogueira (Demonstração)',
    categoria_profissional: 'Centro de Desmontagem Veicular (CDV / Desmanche Credenciado)',
    conselho: 'DETRAN-SP 0842/2022',
    vinculo_institucional: 'Cadeia Automotiva / CDV (Programa MOVER)',
    consumo_energia:
      'Pátio de desmontagem com energia solar fotovoltaica e compressores trifásicos',
    frota_propria: 'nao',
    inventario_ghg: 'nao',
    iso_14001: 'nao',
    faixa_emissoes: 'abaixo_10k',
    enquadramento_sbce: 'Abaixo do limiar de reporte no SBCE (< 10.000 tCO₂e/ano)',
    exporta_ue_cbam: 'nao',
    cbam_bens: '',
    demonstracao: true,
    descricao_pedagogica:
      'Modelo pedagógico Lucro Presumido 2: Demonstra a operação de um Centro de Desmontagem Veicular (CDV) credenciado no Programa MOVER, gerando lastros de circularidade e emissões evitadas de CO₂.',
  },
]

/**
 * Mapeamento rápido de CNPJs limpos para consulta O(1).
 */
const MAPA_MODELOS_CNPJ = new Map<string, EmpresaModeloDemonstrativa>(
  EMPRESAS_MODELO_DEMONSTRACAO.map((m) => [m.cnpjLimpo, m]),
)

/**
 * Verifica se um CNPJ corresponde a um dos 4 modelos pedagógicos de demonstração.
 */
export function isCnpjDemonstracao(cnpjInput: string): boolean {
  const digits = cleanCNPJ(cnpjInput)
  return MAPA_MODELOS_CNPJ.has(digits)
}

/**
 * Retorna o modelo pedagógico correspondente ao CNPJ, se existir.
 */
export function obterModeloDemonstracao(cnpjInput: string): EmpresaModeloDemonstrativa | null {
  const digits = cleanCNPJ(cnpjInput)
  return MAPA_MODELOS_CNPJ.get(digits) || null
}

/**
 * Retorna uma empresa-modelo cuja raiz de 8 ou 12 dígitos coincida com o CNPJ informado.
 * Útil para sugerir correção pedagógica quando o usuário digita DVs antigos ou incorretos
 * mantendo a raiz de um modelo de teste (ex.: raiz 76123456 ou 761234560001).
 */
export function obterModeloDemonstracaoPorRaiz(
  cnpjInput: string,
): EmpresaModeloDemonstrativa | null {
  const digits = cleanCNPJ(cnpjInput)
  if (digits.length < 8) return null
  const raiz8 = digits.slice(0, 8)
  for (const modelo of EMPRESAS_MODELO_DEMONSTRACAO) {
    if (modelo.cnpjLimpo.startsWith(raiz8)) {
      return modelo
    }
  }
  return null
}

/**
 * Converte uma empresa-modelo para a estrutura DadosEmpresaCNPJ usada no funil.
 * Pula a consulta externa à BrasilAPI/Minha Receita mantendo o restante do fluxo idêntico.
 */
export function converterModeloParaDadosCNPJ(modelo: EmpresaModeloDemonstrativa): DadosEmpresaCNPJ {
  return {
    cnpj: modelo.cnpjLimpo,
    razao_social: modelo.razao_social,
    nome_fantasia: modelo.nome_fantasia,
    situacao_cadastral: '2',
    descricao_situacao_cadastral: 'ATIVA (MODELO PEDAGÓGICO)',
    cnae_fiscal: modelo.cnae_fiscal,
    cnae_fiscal_descricao: modelo.cnae_fiscal_descricao,
    logradouro: modelo.logradouro,
    numero: modelo.numero,
    bairro: modelo.bairro,
    municipio: modelo.municipio,
    uf: modelo.uf,
    cep: modelo.cep,
    ddd_telefone: modelo.whatsapp,
    email: modelo.email,
    capital_social: modelo.regime_tributario === 'Lucro Real' ? 5000000 : 500000,
    natureza_juridica: modelo.natureza_juridica,
    porte: modelo.porte,
    regime_tributario_sugerido: modelo.regime_tributario,
    fonte: 'brasilapi',
  }
}

/**
 * Validação de integridade na inicialização: garante que todos os 4 CNPJs são matematicamente válidos.
 */
if (typeof window !== 'undefined' || typeof process !== 'undefined') {
  for (const m of EMPRESAS_MODELO_DEMONSTRACAO) {
    if (!isValidCNPJ(m.cnpjLimpo)) {
      console.error(`[Orbis Demo] CNPJ modelo ${m.cnpj} é matematicamente inválido pelos DVs!`)
    }
  }
}
