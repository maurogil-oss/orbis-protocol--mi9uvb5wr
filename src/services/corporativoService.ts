import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface EmpresaDossieCorporativo {
  id: string
  slug: string
  razaoSocial: string
  cnpj: string
  segmento: string
  localidades: string
  auditorCrc: string
  auditorResponsavel: string
  scoreEsg: number
  scoreEsgMax: number
  escopo1Tco2e: number
  escopo2Tco2e: number
  escopo3Tco2e: number
  totalEmissoesTco2e: number
  amostra12NotasFossilTco2e: number
  amostra12NotasBiogenicoTco2e: number
  amostra12NotasInsettingTco2e: number
  hashIntegridade: string
  hashFechamentoCompetencia?: string
  padraoAsseguracao: string
  versaoMetodologia: string
  gwpAr6: { ch4: number; n2o: number }
  duploReporte: {
    localizacaoSinFator: number
    mercadoIrecFator: number
  }
}

export interface NotaFiscalDemonstrativa {
  id: string
  slug: string
  titulo: string
  numeroDocumento: string
  modeloFiscal: string
  modeloFormatado: string
  categoriaOperacional:
    | 'frota'
    | 'frete'
    | 'instalacoes'
    | 'insumos'
    | 'servicos'
    | 'viagens'
    | 'transporte_colab'
    | 'todos'
  cnae: string
  statusSefaz: string
  tierIncerteza: string
  incertezaPct: number
  razaoSocialParceiro: string
  cnpj: string
  dataEmissao: string
  valorBrl: number
  quantidadeDeclarada: string
  escopoAlvo: 'escopo_1' | 'escopo_2' | 'escopo_3'
  fossilKgCo2e: number
  biogenicoKgCo2: number
  insettingKgCo2e: number
  detalhesJson: {
    discriminacao?: string
    fonte_fator?: string
    fator_numerico?: number
    ano_base?: string
    unidade_fator?: string
    combustivel_tipo?: string
    mistura_biodiesel?: string
    biogenico_fator_numerico?: number
    transporte_tkm?: number
    insetting_evitado_kg?: number
    insetting_memoria?: {
      massa_kg: number
      fator_virgem_kgco2e_kg: number
      fator_reciclado_kgco2e_kg: number
      delta_evitado_kgco2e_kg: number
      total_evitado_kgco2e: number
      total_evitado_tco2e: number
      norma_referencia: string
    }
    metodologia_tier?: string
    duplo_reporte?: {
      localizacao_kg: number
      mercado_irec_kg: number
    }
    subcategoria?: string
    ncm?: string
    itens_classificacao_ncm?: Array<{
      descricao: string
      ncm: string
      familia: string
      quantidadeFisica?: number
      unidade: string
      valorBrl: number
      tier: 'Tier 1' | 'Tier 2'
      incertezaPct: number
      fatorAplicado: number
      unidadeFator: string
      emissaoFossilKg: number
      motivoElevacao: string
      declaracaoMetodologica: string
    }>
    classificacao_ncm_resumo?: {
      totalItens: number
      itensElevadosTier2: number
      itensPermanecidosTier1: number
      percentualElevados: number
      incertezaOriginalPct: number
      incertezaResultantePct: number
      reducaoIncertezaPp: number
      declaracaoNormativa: string
    }
  }
}

export interface CorporativoDemoData {
  dossie: EmpresaDossieCorporativo
  notas: NotaFiscalDemonstrativa[]
}

export const DOSSIE_DEFAULT_FALLBACK: EmpresaDossieCorporativo = {
  id: 'demo-dossie',
  slug: 'dossie-industrias-logistica-brasil',
  razaoSocial: 'Indústrias & Logística Integrada Brasil S.A.',
  cnpj: '76.492.108/0001-92',
  segmento: 'Manufatura, Logística & Cadeia de Suprimentos',
  localidades: 'Curitiba - PR & São Paulo - SP',
  auditorCrc: 'CRC PR-048.910/O-4',
  auditorResponsavel: 'Dr. Valmor C. Menezes (Auditor Independente Ibracon/CFC)',
  scoreEsg: 840,
  scoreEsgMax: 1000,
  escopo1Tco2e: 480.2,
  escopo2Tco2e: 310.6,
  escopo3Tco2e: 629.5,
  totalEmissoesTco2e: 1420.3,
  amostra12NotasFossilTco2e: 12.71,
  amostra12NotasBiogenicoTco2e: 2.44,
  amostra12NotasInsettingTco2e: 1.13,
  hashIntegridade: '0x8f4b29a7e3c12948bb92ff78201a0bc45d61e93f91823ab12c',
  hashFechamentoCompetencia: '0x8f4b29a7e3c12948bb92ff78201a0bc45d61e93f91823ab12c98d7ef2049ba12',
  padraoAsseguracao: 'ISAE 3000 / NBC TO 3000 (Asseguração Limitada a Razoável)',
  versaoMetodologia: 'GHG Protocol Brasil v2025.1 / IPCC AR6 (GWP100)',
  gwpAr6: { ch4: 29.8, n2o: 273 },
  duploReporte: {
    localizacaoSinFator: 0.0289,
    mercadoIrecFator: 0.0,
  },
}

export const NOTAS_DEFAULT_FALLBACK: NotaFiscalDemonstrativa[] = [
  {
    id: 'demo-01',
    slug: 'nota-01-copel-nf3e',
    titulo: 'Copel (Energia Elétrica Rede SIN)',
    numeroDocumento: '004.892.102',
    modeloFiscal: '66_nf3e',
    modeloFormatado: 'NF3e (Mod 66)',
    categoriaOperacional: 'instalacoes',
    cnae: '3514-0/00',
    statusSefaz: 'OK (Autorizada SEFAZ-PR)',
    tierIncerteza: 'Tier 3',
    incertezaPct: 4.0,
    razaoSocialParceiro: 'COPEL DISTRIBUIÇÃO S.A.',
    cnpj: '76.483.817/0001-20',
    dataEmissao: '15/07/2026',
    valorBrl: 4850.0,
    quantidadeDeclarada: '6.420 kWh',
    escopoAlvo: 'escopo_2',
    fossilKgCo2e: 185.5,
    biogenicoKgCo2: 0.0,
    insettingKgCo2e: 0.0,
    detalhesJson: {
      discriminacao: 'Energia Elétrica Ativa - Fornecimento Fático Mercado Cativo / TUSD',
      fonte_fator: 'Fator médio SIN – MCTI 2025: 0,0289 kgCO₂e/kWh',
      fator_numerico: 0.0289,
      ano_base: '2025',
      unidade_fator: 'kg CO₂e/kWh',
      duplo_reporte: { localizacao_kg: 185.5, mercado_irec_kg: 0.0 },
      subcategoria: 'Eletricidade de Rede (Geração Externa)',
    },
  },
  {
    id: 'demo-02',
    slug: 'nota-02-diesel-s10-nfe',
    titulo: 'Combustível (Diesel B S10 - Tanque Base)',
    numeroDocumento: '001.204.881',
    modeloFiscal: '55_nfe',
    modeloFormatado: 'NF-e (Mod 55)',
    categoriaOperacional: 'frota',
    cnae: '4731-8/00',
    statusSefaz: 'OK (Autorizada SEFAZ-PR)',
    tierIncerteza: 'Tier 3',
    incertezaPct: 3.5,
    razaoSocialParceiro: 'POSTO REDE PASTO COMBUSTIVEIS LTDA',
    cnpj: '04.112.980/0001-31',
    dataEmissao: '22/07/2026',
    valorBrl: 12400.0,
    quantidadeDeclarada: '2.150 Litros',
    escopoAlvo: 'escopo_1',
    fossilKgCo2e: 5740.5,
    biogenicoKgCo2: 768.0,
    insettingKgCo2e: 0.0,
    detalhesJson: {
      discriminacao: 'Óleo Diesel B S10 - Abastecimento em Base de Frotas Próprias',
      fonte_fator:
        'GHG Protocol BR 2025 (Fator Fóssil 2,670 kgCO₂e/L + Parcela Biodiesel B14: 0,357 kgCO₂/L)',
      fator_numerico: 2.67,
      unidade_fator: 'kg CO₂e/L',
      combustivel_tipo: 'diesel',
      mistura_biodiesel: 'B14',
      biogenico_fator_numerico: 0.357,
      subcategoria: 'Combustão Móvel - Frota Própria Pesada',
      ncm: '2710.19.21',
    },
  },
  {
    id: 'demo-03',
    slug: 'nota-03-gas-natural-nfe',
    titulo: 'Gás Natural Industrial (Canalizado)',
    numeroDocumento: '000.412.900',
    modeloFiscal: '55_nfe',
    modeloFormatado: 'NF-e (Mod 55)',
    categoriaOperacional: 'instalacoes',
    cnae: '3520-4/02',
    statusSefaz: 'OK (Autorizada SEFAZ-PR)',
    tierIncerteza: 'Tier 3',
    incertezaPct: 4.0,
    razaoSocialParceiro: 'COMPAGAS S.A.',
    cnpj: '00.452.190/0001-77',
    dataEmissao: '02/07/2026',
    valorBrl: 3100.0,
    quantidadeDeclarada: '890 m³',
    escopoAlvo: 'escopo_1',
    fossilKgCo2e: 1780.0,
    biogenicoKgCo2: 0.0,
    insettingKgCo2e: 0.0,
    detalhesJson: {
      discriminacao: 'Gás Natural Canalizado Comercial / Industrial para Caldeiras',
      fonte_fator: 'MCTI / ANP / GHG Protocol BR (2,000 kgCO₂e/m³)',
      fator_numerico: 2.0,
      unidade_fator: 'kg CO₂e/m³',
      combustivel_tipo: 'gnv',
      subcategoria: 'Combustão Estacionária Industrial',
      ncm: '2711.21.00',
    },
  },
  {
    id: 'demo-04',
    slug: 'nota-04-klabin-papelao-insetting',
    titulo: 'Insumo Papelão Reciclado (Insetting)',
    numeroDocumento: '009.110.450',
    modeloFiscal: '55_nfe',
    modeloFormatado: 'NF-e (Mod 55)',
    categoriaOperacional: 'insumos',
    cnae: '1733-8/00',
    statusSefaz: 'OK (Autorizada SEFAZ-PR)',
    tierIncerteza: 'Tier 2',
    incertezaPct: 8.5,
    razaoSocialParceiro: 'KLABIN S.A.',
    cnpj: '89.637.490/0001-45',
    dataEmissao: '28/07/2026',
    valorBrl: 18500.0,
    quantidadeDeclarada: '4.500 kg',
    escopoAlvo: 'escopo_3',
    fossilKgCo2e: 1125.0,
    biogenicoKgCo2: 0.0,
    insettingKgCo2e: 1125.0,
    detalhesJson: {
      discriminacao: 'Caixas de Papelão Ondulado Recicláveis com Insetting ISO 14067',
      fonte_fator:
        'ISO 14067:2018 / Ecoinvent 3.10 (0,250 kgCO₂e/kg matéria reciclada vs 0,500 kgCO₂e/kg virgem)',
      fator_numerico: 0.25,
      insetting_evitado_kg: 1125.0,
      unidade_fator: 'kg CO₂e/kg',
      subcategoria: 'Bens e Serviços Comprados (Cadeia Upstream)',
      ncm: '4819.10.00',
      insetting_memoria: {
        massa_kg: 4500,
        fator_virgem_kgco2e_kg: 0.5,
        fator_reciclado_kgco2e_kg: 0.25,
        delta_evitado_kgco2e_kg: 0.25,
        total_evitado_kgco2e: 1125.0,
        total_evitado_tco2e: 1.13,
        norma_referencia: 'ISO 14067:2018 / GHG Protocol Corporate Standard (Scope 3 Upstream)',
      },
      itens_classificacao_ncm: [
        {
          descricao: 'Caixas Papelão Duplo 60x40 (4.500 kg)',
          ncm: '4819.10.00',
          familia: 'Papel e Celulósicos (Cap. 48)',
          quantidadeFisica: 4500,
          unidade: 'kg',
          valorBrl: 18500,
          tier: 'Tier 2',
          incertezaPct: 8.5,
          fatorAplicado: 0.25,
          unidadeFator: 'kg CO₂e/kg',
          emissaoFossilKg: 1125.0,
          motivoElevacao:
            'Elevado de Tier 1 (spend-based, ±18%) para Tier 2 (fator ACV, ±8.5%) por quantidade física de 4.500 kg presente no XML da NF-e.',
          declaracaoMetodologica: 'proxy interno por NCM, validação do Revisor',
        },
      ],
      classificacao_ncm_resumo: {
        totalItens: 1,
        itensElevadosTier2: 1,
        itensPermanecidosTier1: 0,
        percentualElevados: 100,
        incertezaOriginalPct: 18.0,
        incertezaResultantePct: 8.5,
        reducaoIncertezaPp: 9.5,
        declaracaoNormativa: 'proxy interno por NCM, validação do Revisor',
      },
    },
  },
  {
    id: 'demo-04b',
    slug: 'nota-04b-embalagens-filme-pe-nfe',
    titulo: 'Bobinas Filme Stretch PEBD (Insumo Logístico)',
    numeroDocumento: '001.442.100',
    modeloFiscal: '55_nfe',
    modeloFormatado: 'NF-e (Mod 55)',
    categoriaOperacional: 'insumos',
    cnae: '2222-6/00',
    statusSefaz: 'OK (Autorizada SEFAZ-SP)',
    tierIncerteza: 'Tier 2',
    incertezaPct: 9.0,
    razaoSocialParceiro: 'PLASTIPACK INDÚSTRIA DE EMBALAGENS LTDA',
    cnpj: '61.293.440/0001-81',
    dataEmissao: '24/07/2026',
    valorBrl: 14200.0,
    quantidadeDeclarada: '1.200 kg (60 bobinas)',
    escopoAlvo: 'escopo_3',
    fossilKgCo2e: 2580.0,
    biogenicoKgCo2: 0.0,
    insettingKgCo2e: 0.0,
    detalhesJson: {
      discriminacao: 'Filme Stretch Polietileno PEBD para Paletização e Unitização de Carga',
      fonte_fator: 'PlasticsEurope LCA Dataset / Ecoinvent 3.10 (2,150 kgCO₂e/kg polímero)',
      fator_numerico: 2.15,
      unidade_fator: 'kg CO₂e/kg',
      subcategoria: 'Bens e Serviços Comprados (Cat. 1)',
      ncm: '3920.10.99',
      itens_classificacao_ncm: [
        {
          descricao: 'Bobina Filme Stretch PEBD 500mm x 25µm',
          ncm: '3920.10.99',
          familia: 'Polímeros e Plásticos (Cap. 39)',
          quantidadeFisica: 1200,
          unidade: 'kg',
          valorBrl: 14200,
          tier: 'Tier 2',
          incertezaPct: 9.0,
          fatorAplicado: 2.15,
          unidadeFator: 'kg CO₂e/kg',
          emissaoFossilKg: 2580.0,
          motivoElevacao:
            'Elevado de Tier 1 (spend-based, ±18%) para Tier 2 (fator ACV PlasticsEurope, ±9.0%) via massa faturada de 1.200 kg declarada em qCom.',
          declaracaoMetodologica: 'proxy interno por NCM, validação do Revisor',
        },
      ],
      classificacao_ncm_resumo: {
        totalItens: 1,
        itensElevadosTier2: 1,
        itensPermanecidosTier1: 0,
        percentualElevados: 100,
        incertezaOriginalPct: 18.0,
        incertezaResultantePct: 9.0,
        reducaoIncertezaPp: 9.0,
        declaracaoNormativa: 'proxy interno por NCM, validação do Revisor',
      },
    },
  },
  {
    id: 'demo-04c',
    slug: 'nota-04c-estruturas-aco-armazenagem-nfe',
    titulo: 'Estruturas Metálicas Porta-Paletes (Armazém)',
    numeroDocumento: '000.318.905',
    modeloFiscal: '55_nfe',
    modeloFormatado: 'NF-e (Mod 55)',
    categoriaOperacional: 'insumos',
    cnae: '2511-0/00',
    statusSefaz: 'OK (Autorizada SEFAZ-MG)',
    tierIncerteza: 'Tier 2',
    incertezaPct: 7.5,
    razaoSocialParceiro: 'SIDERÚRGICA & ESTRUTURAS METÁLICAS MINAS S.A.',
    cnpj: '17.332.901/0001-14',
    dataEmissao: '26/07/2026',
    valorBrl: 26500.0,
    quantidadeDeclarada: '3.800 kg (Longarinas & Montantes)',
    escopoAlvo: 'escopo_3',
    fossilKgCo2e: 9310.0,
    biogenicoKgCo2: 0.0,
    insettingKgCo2e: 0.0,
    detalhesJson: {
      discriminacao: 'Montantes e Vigas Longarinas em Aço Galvanizado Estrutural',
      fonte_fator: 'WorldSteel Association LCA / Ecoinvent 3.10 (2,450 kgCO₂e/kg aço)',
      fator_numerico: 2.45,
      unidade_fator: 'kg CO₂e/kg',
      subcategoria: 'Bens e Serviços Comprados (Cat. 1)',
      ncm: '7308.90.10',
      itens_classificacao_ncm: [
        {
          descricao: 'Estruturas Metálicas Porta-Paletes em Aço',
          ncm: '7308.90.10',
          familia: 'Metais (Cap. 73 - WorldSteel)',
          quantidadeFisica: 3800,
          unidade: 'kg',
          valorBrl: 26500,
          tier: 'Tier 2',
          incertezaPct: 7.5,
          fatorAplicado: 2.45,
          unidadeFator: 'kg CO₂e/kg',
          emissaoFossilKg: 9310.0,
          motivoElevacao:
            'Elevado de Tier 1 (spend-based, ±18%) para Tier 2 (fator ACV WorldSteel, ±7.5%) por quantidade de 3.800 kg auditada em qCom.',
          declaracaoMetodologica: 'proxy interno por NCM, validação do Revisor',
        },
      ],
      classificacao_ncm_resumo: {
        totalItens: 1,
        itensElevadosTier2: 1,
        itensPermanecidosTier1: 0,
        percentualElevados: 100,
        incertezaOriginalPct: 18.0,
        incertezaResultantePct: 7.5,
        reducaoIncertezaPp: 10.5,
        declaracaoNormativa: 'proxy interno por NCM, validação do Revisor',
      },
    },
  },
  {
    id: 'demo-05',
    slug: 'nota-05-frete-rodoviario-cte',
    titulo: 'Frete Rodoviário Insumos (CT-e Upstream)',
    numeroDocumento: '000.089.312',
    modeloFiscal: '57_cte',
    modeloFormatado: 'CT-e (Mod 57)',
    categoriaOperacional: 'frete',
    cnae: '4930-2/02',
    statusSefaz: 'OK (Autorizada SEFAZ-PR)',
    tierIncerteza: 'Tier 3',
    incertezaPct: 5.0,
    razaoSocialParceiro: 'RODOVIÁRIO SOUZA & CIA LTDA',
    cnpj: '05.340.890/0001-18',
    dataEmissao: '29/07/2026',
    valorBrl: 6200.0,
    quantidadeDeclarada: '16.800 t.km (1.200 km / 14 ton)',
    escopoAlvo: 'escopo_3',
    fossilKgCo2e: 1512.0,
    biogenicoKgCo2: 0.0,
    insettingKgCo2e: 0.0,
    detalhesJson: {
      discriminacao: 'Conhecimento de Transporte Eletrônico (CT-e) - Frete Terceirizado de Insumos',
      fonte_fator: 'GLEC Framework v3.0 / GHG Protocol BR (0,0900 kgCO₂e/t.km)',
      fator_numerico: 0.09,
      unidade_fator: 'kg CO₂e/t.km',
      transporte_tkm: 16800,
      subcategoria: 'Transporte e Distribuição Upstream (Mod. 57)',
    },
  },
  {
    id: 'demo-06',
    slug: 'nota-06-etanol-varejo-nfce',
    titulo: 'Abastecimento Varejo (NFC-e Etanol Frota Leve)',
    numeroDocumento: '003.541.200',
    modeloFiscal: '65_nfce',
    modeloFormatado: 'NFC-e (Mod 65)',
    categoriaOperacional: 'frota',
    cnae: '4731-8/00',
    statusSefaz: 'OK (Autorizada SEFAZ-PR)',
    tierIncerteza: 'Tier 3',
    incertezaPct: 3.0,
    razaoSocialParceiro: 'AUTO POSTO ECOLÓGICO PARANÁ LTDA',
    cnpj: '11.450.982/0001-90',
    dataEmissao: '30/07/2026',
    valorBrl: 4250.0,
    quantidadeDeclarada: '1.100 Litros',
    escopoAlvo: 'escopo_1',
    fossilKgCo2e: 462.0,
    biogenicoKgCo2: 1672.0,
    insettingKgCo2e: 0.0,
    detalhesJson: {
      discriminacao: 'Etanol Hidratado Combustível Comum - Cupom Eletrônico NFC-e Varejo',
      fonte_fator: 'GHG Protocol BR (Fóssil 0,420 kgCO₂e/L | Biogênico 1,520 kgCO₂/L)',
      fator_numerico: 0.42,
      unidade_fator: 'kg CO₂e/L',
      combustivel_tipo: 'etanol',
      subcategoria: 'Combustão Móvel Frota Comercial Flex',
      ncm: '2207.20.19',
    },
  },
  {
    id: 'demo-07',
    slug: 'nota-07-manutencao-industrial-nfse',
    titulo: 'Serviços de Manutenção Industrial (NFS-e Municipal)',
    numeroDocumento: '2026/008412',
    modeloFiscal: 'nfse',
    modeloFormatado: 'NFS-e (Municipal)',
    categoriaOperacional: 'servicos',
    cnae: '7112-0/00',
    statusSefaz: 'OK (Autorizada PMC Curitiba)',
    tierIncerteza: 'Tier 1',
    incertezaPct: 18.0,
    razaoSocialParceiro: 'TECHSERVICES ENGENHARIA & MANUTENCAO LTDA',
    cnpj: '18.990.112/0001-65',
    dataEmissao: '18/07/2026',
    valorBrl: 8400.0,
    quantidadeDeclarada: 'R$ 8.400,00 (Horas Técnicas)',
    escopoAlvo: 'escopo_3',
    fossilKgCo2e: 126.0,
    biogenicoKgCo2: 0.0,
    insettingKgCo2e: 0.0,
    detalhesJson: {
      discriminacao: 'NFS-e de Serviços Técnicos de Calibração e Manutenção Preventiva de Planta',
      fonte_fator: 'DEFRA UK / Ecoinvent 3.10 (0,0150 kgCO₂e por R$ gasto em serviços técnicos)',
      fator_numerico: 0.015,
      unidade_fator: 'kg CO₂e/R$',
      subcategoria: 'Serviços Terceirizados & Manutenção Predial',
      metodologia_tier: 'Tier 1 (spend-based, ±18% - DEFRA/Ecoinvent 3.10)',
      itens_classificacao_ncm: [
        {
          descricao: 'Serviços Técnicos e Peças de Reposição Diversas',
          ncm: '8483.40.90',
          familia: 'Elétricos e Máquinas (Cap. 84)',
          quantidadeFisica: undefined,
          unidade: 'BRL',
          valorBrl: 8400,
          tier: 'Tier 1',
          incertezaPct: 18.0,
          fatorAplicado: 0.015,
          unidadeFator: 'kg CO₂e/R$',
          emissaoFossilKg: 126.0,
          motivoElevacao:
            'Mantido em Tier 1 (spend-based, ±18%): documento fiscal de serviço sem quantidade física (massa/unidade) discriminada nos itens.',
          declaracaoMetodologica: 'proxy interno por NCM, validação do Revisor',
        },
      ],
      classificacao_ncm_resumo: {
        totalItens: 1,
        itensElevadosTier2: 0,
        itensPermanecidosTier1: 1,
        percentualElevados: 0,
        incertezaOriginalPct: 18.0,
        incertezaResultantePct: 18.0,
        reducaoIncertezaPp: 0.0,
        declaracaoNormativa: 'proxy interno por NCM, validação do Revisor',
      },
    },
  },
  {
    id: 'demo-08',
    slug: 'nota-08-viagem-terrestre-bpe',
    titulo: 'Viagens Corporativas Terrestres (BP-e Interestadual)',
    numeroDocumento: '000.142.890',
    modeloFiscal: '63_bpe',
    modeloFormatado: 'BP-e (Mod 63)',
    categoriaOperacional: 'viagens',
    cnae: '4922-1/01',
    statusSefaz: 'OK (Autorizada ANTT/SEFAZ)',
    tierIncerteza: 'Tier 3',
    incertezaPct: 4.5,
    razaoSocialParceiro: 'VIAÇÃO GARCIA SUL LTDA',
    cnpj: '78.583.190/0001-09',
    dataEmissao: '12/07/2026',
    valorBrl: 960.0,
    quantidadeDeclarada: '4.200 p.km (8 passagens)',
    escopoAlvo: 'escopo_3',
    fossilKgCo2e: 159.6,
    biogenicoKgCo2: 0.0,
    insettingKgCo2e: 0.0,
    detalhesJson: {
      discriminacao:
        'Bilhetes de Passagem Eletrônica (BP-e) - Viagens Técnicas Curitiba x Londrina',
      fonte_fator: 'DEFRA UK Passenger Road (0,0380 kgCO₂e/passageiro.km)',
      fator_numerico: 0.038,
      unidade_fator: 'kg CO₂e/p.km',
      subcategoria: 'Viagens a Negócios Terrestres (Business Travel Mod. 63)',
    },
  },
  {
    id: 'demo-09',
    slug: 'nota-09-fretamento-turnos-cte-os',
    titulo: 'Fretamento de Turnos Fabris (CT-e OS Commuting)',
    numeroDocumento: '000.038.411',
    modeloFiscal: '67_cte_os',
    modeloFormatado: 'CT-e OS (Mod 67)',
    categoriaOperacional: 'transporte_colab',
    cnae: '4929-9/02',
    statusSefaz: 'OK (Autorizada SEFAZ-PR)',
    tierIncerteza: 'Tier 3',
    incertezaPct: 5.0,
    razaoSocialParceiro: 'FRETAMENTO PARANÁ TRANSPORTE & TURISMO LTDA',
    cnpj: '03.712.449/0001-52',
    dataEmissao: '31/07/2026',
    valorBrl: 7800.0,
    quantidadeDeclarada: '1.850 km rodados (Linha Fabril)',
    escopoAlvo: 'escopo_3',
    fossilKgCo2e: 1443.0,
    biogenicoKgCo2: 0.0,
    insettingKgCo2e: 0.0,
    detalhesJson: {
      discriminacao: 'CT-e Outros Serviços (Mod 67) - Fretamento Dedicado Diário de Funcionários',
      fonte_fator: 'GHG Protocol BR / GLEC (0,7800 kgCO₂e/km rodado em ônibus fretado)',
      fator_numerico: 0.78,
      unidade_fator: 'kg CO₂e/km',
      subcategoria: 'Deslocamento de Colaboradores (Commuting Mod. 67)',
    },
  },
  {
    id: 'demo-10',
    slug: 'nota-10-sanepar-agua-saneamento',
    titulo: 'Saneamento & Água Industrial (Fatura Concessionária)',
    numeroDocumento: 'MATR-948201',
    modeloFiscal: 'fatura_agua',
    modeloFormatado: 'Água & Saneamento',
    categoriaOperacional: 'instalacoes',
    cnae: '3600-6/01',
    statusSefaz: 'OK (Autorizada Agência Reguladora)',
    tierIncerteza: 'Tier 3',
    incertezaPct: 6.0,
    razaoSocialParceiro: 'SANEPAR - CIA DE SANEAMENTO DO PARANÁ',
    cnpj: '76.484.013/0001-45',
    dataEmissao: '20/07/2026',
    valorBrl: 2940.0,
    quantidadeDeclarada: '420 m³ (Água Tratada & Efluentes)',
    escopoAlvo: 'escopo_3',
    fossilKgCo2e: 144.5,
    biogenicoKgCo2: 0.0,
    insettingKgCo2e: 0.0,
    detalhesJson: {
      discriminacao:
        'Conta Mensal de Utilidade Pública - Água Tratada Industrial e Coleta de Esgoto',
      fonte_fator: 'DEFRA Water Supply and Treatment (0,3440 kgCO₂e/m³ água + efluente)',
      fator_numerico: 0.344,
      unidade_fator: 'kg CO₂e/m³',
      subcategoria: 'Tratamento de Água e Efluentes Operacionais',
    },
  },
  {
    id: 'demo-11',
    slug: 'nota-11-mdfe-consolidacao-cargas',
    titulo: 'Consolidação de Cargas (MDF-e Trilha Anti-Bicontagem)',
    numeroDocumento: '000.012.940',
    modeloFiscal: '58_mdfe',
    modeloFormatado: 'MDF-e (Mod 58)',
    categoriaOperacional: 'frete',
    cnae: '4930-2/02',
    statusSefaz: 'OK (Autorizada SEFAZ-PR/SC)',
    tierIncerteza: 'Tier 3',
    incertezaPct: 3.0,
    razaoSocialParceiro: 'TRANSLOG BRASIL CONSOLIDADORA LTDA',
    cnpj: '08.992.341/0001-70',
    dataEmissao: '25/07/2026',
    valorBrl: 0.0,
    quantidadeDeclarada: 'Percurso PR -> SC (Múltiplos CT-es Vinculados)',
    escopoAlvo: 'escopo_3',
    fossilKgCo2e: 0.0,
    biogenicoKgCo2: 0.0,
    insettingKgCo2e: 0.0,
    detalhesJson: {
      discriminacao:
        'MDF-e Modelo 58 - Documento Fiscal de Rastreabilidade e Auditoria de Percurso Rodoviário',
      fonte_fator:
        'Trilha Probatória dMRV: documento não gera passivo direto para evitar bicontagem',
      fator_numerico: 0.0,
      unidade_fator: 'kg CO₂e/doc',
      subcategoria: 'Auditoria de Trânsito Rodoviário e Custódia de Carga',
    },
  },
  {
    id: 'demo-12',
    slug: 'nota-12-claro-nfcom-telecom',
    titulo: 'Telecomunicações & Nuvem (NFCom Modelo 62)',
    numeroDocumento: '000.892.401',
    modeloFiscal: '62_nfcom',
    modeloFormatado: 'NFCom (Mod 62)',
    categoriaOperacional: 'instalacoes',
    cnae: '6110-8/03',
    statusSefaz: 'OK (Autorizada SEFAZ-SP)',
    tierIncerteza: 'Tier 1',
    incertezaPct: 18.0,
    razaoSocialParceiro: 'CLARO BRASIL S.A. TELECOMUNICAÇÕES',
    cnpj: '40.432.544/0001-47',
    dataEmissao: '10/07/2026',
    valorBrl: 2400.0,
    quantidadeDeclarada: 'Link Dedicado 1 Gbps Fibra',
    escopoAlvo: 'escopo_3',
    fossilKgCo2e: 28.8,
    biogenicoKgCo2: 0.0,
    insettingKgCo2e: 0.0,
    detalhesJson: {
      discriminacao:
        'NFCom Modelo 62 - Conectividade de Fibra Óptica e Telecomunicações Corporativas',
      fonte_fator: 'EPA Climate Leaders / DEFRA Telecom (0,0120 kgCO₂e por R$ serviço telecom)',
      fator_numerico: 0.012,
      unidade_fator: 'kg CO₂e/R$',
      subcategoria: 'Serviços de Telecomunicação Corporativa e Nuvem',
      metodologia_tier: 'Tier 1 (spend-based, ±18% - EPA/DEFRA Telecom)',
      itens_classificacao_ncm: [
        {
          descricao: 'Assinatura Link Dedicado e Tráfego de Dados',
          ncm: '',
          familia: 'Outros Bens e Serviços Comprados',
          quantidadeFisica: undefined,
          unidade: 'BRL',
          valorBrl: 2400,
          tier: 'Tier 1',
          incertezaPct: 18.0,
          fatorAplicado: 0.012,
          unidadeFator: 'kg CO₂e/R$',
          emissaoFossilKg: 28.8,
          motivoElevacao:
            'Mantido em Tier 1 (spend-based, ±18%): fatura de telecomunicação sem métrica de massa física ou NCM fabril específico.',
          declaracaoMetodologica: 'proxy interno por NCM, validação do Revisor',
        },
      ],
      classificacao_ncm_resumo: {
        totalItens: 1,
        itensElevadosTier2: 0,
        itensPermanecidosTier1: 1,
        percentualElevados: 0,
        incertezaOriginalPct: 18.0,
        incertezaResultantePct: 18.0,
        reducaoIncertezaPp: 0.0,
        declaracaoNormativa: 'proxy interno por NCM, validação do Revisor',
      },
    },
  },
]

function formatarNomeModelo(mod: string): string {
  switch (mod) {
    case '55_nfe':
      return 'NF-e (Mod 55)'
    case '65_nfce':
      return 'NFC-e (Mod 65)'
    case 'nfse':
      return 'NFS-e (Municipal)'
    case '57_cte':
      return 'CT-e (Mod 57)'
    case '58_mdfe':
      return 'MDF-e (Mod 58)'
    case '66_nf3e':
      return 'NF3e (Mod 66)'
    case '62_nfcom':
      return 'NFCom (Mod 62)'
    case '63_bpe':
      return 'BP-e (Mod 63)'
    case '67_cte_os':
      return 'CT-e OS (Mod 67)'
    case 'fatura_agua':
      return 'Água & Saneamento'
    default:
      return mod || 'Documento Fiscal'
  }
}

/**
 * Consulta os dados reais da demonstração corporativa a partir do PocketBase.
 * Se houver oscilação de rede, retorna com segurança os dados homologados.
 */
export async function carregarDadosCorporativoDemo(): Promise<CorporativoDemoData> {
  try {
    const records = await pb.collection('corporativo_demo').getFullList<RecordModel>({
      sort: 'slug',
    })

    if (!records || records.length === 0) {
      return {
        dossie: DOSSIE_DEFAULT_FALLBACK,
        notas: NOTAS_DEFAULT_FALLBACK,
      }
    }

    const dossieRec = records.find((r) => r.tipo === 'empresa_dossie')
    const notasRecs = records.filter((r) => r.tipo === 'nota_fiscal')

    let dossie: EmpresaDossieCorporativo = DOSSIE_DEFAULT_FALLBACK
    if (dossieRec) {
      const dj = dossieRec.detalhes_json || {}
      dossie = {
        id: dossieRec.id,
        slug: dossieRec.slug,
        razaoSocial: dossieRec.titulo || DOSSIE_DEFAULT_FALLBACK.razaoSocial,
        cnpj: dossieRec.cnpj || DOSSIE_DEFAULT_FALLBACK.cnpj,
        segmento: dj.segmento || DOSSIE_DEFAULT_FALLBACK.segmento,
        localidades: dj.localidades || DOSSIE_DEFAULT_FALLBACK.localidades,
        auditorCrc: dj.auditor_crc || DOSSIE_DEFAULT_FALLBACK.auditorCrc,
        auditorResponsavel: dj.auditor_responsavel || DOSSIE_DEFAULT_FALLBACK.auditorResponsavel,
        scoreEsg: dj.score_esg || 840,
        scoreEsgMax: dj.score_esg_max || 1000,
        escopo1Tco2e: dj.escopo1_tco2e || 480.2,
        escopo2Tco2e: dj.escopo2_tco2e ?? 310.6,
        escopo3Tco2e: dj.escopo3_tco2e || 629.5,
        totalEmissoesTco2e: dj.total_emissoes_tco2e || 1420.3,
        amostra12NotasFossilTco2e: dj.amostra_12_notas_fossil_tco2e || 12.71,
        amostra12NotasBiogenicoTco2e: dj.amostra_12_notas_biogenico_tco2e || 2.44,
        amostra12NotasInsettingTco2e: dj.amostra_12_notas_insetting_tco2e || 1.13,
        hashIntegridade: dj.hash_integridade || DOSSIE_DEFAULT_FALLBACK.hashIntegridade,
        padraoAsseguracao: dj.padrao_asseguracao || DOSSIE_DEFAULT_FALLBACK.padraoAsseguracao,
        versaoMetodologia: dj.versao_metodologia || DOSSIE_DEFAULT_FALLBACK.versaoMetodologia,
        gwpAr6: dj.gwp_ar6 || DOSSIE_DEFAULT_FALLBACK.gwpAr6,
        duploReporte: dj.duplo_reporte || DOSSIE_DEFAULT_FALLBACK.duploReporte,
      }
    }

    const notas: NotaFiscalDemonstrativa[] =
      notasRecs.length > 0
        ? notasRecs.map((r) => ({
            id: r.id,
            slug: r.slug,
            titulo: r.titulo,
            numeroDocumento: r.numero_documento,
            modeloFiscal: r.modelo_fiscal,
            modeloFormatado: formatarNomeModelo(r.modelo_fiscal),
            categoriaOperacional: (r.categoria_operacional as any) || 'instalacoes',
            cnae: r.cnae || '',
            statusSefaz: r.status_sefaz || 'OK',
            tierIncerteza: r.tier_incerteza || 'Tier 3',
            incertezaPct: r.incerteza_pct || 4.5,
            razaoSocialParceiro: r.razao_social_parceiro || '',
            cnpj: r.cnpj || '',
            dataEmissao: r.data_emissao || '',
            valorBrl: r.valor_brl || 0,
            quantidadeDeclarada: r.quantidade_declarada || '',
            escopoAlvo: (r.escopo_alvo as any) || 'escopo_1',
            fossilKgCo2e: r.fossil_kg_co2e || 0,
            biogenicoKgCo2: r.biogenico_kg_co2 || 0,
            insettingKgCo2e: r.insetting_kg_co2e || 0,
            detalhesJson: r.detalhes_json || {},
          }))
        : NOTAS_DEFAULT_FALLBACK

    return { dossie, notas }
  } catch (err) {
    console.warn('[CorporativoService] Usando fallback local estruturado:', err)
    return {
      dossie: DOSSIE_DEFAULT_FALLBACK,
      notas: NOTAS_DEFAULT_FALLBACK,
    }
  }
}
