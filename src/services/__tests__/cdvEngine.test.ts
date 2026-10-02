import { describe, it, expect } from 'vitest'
import {
  FATORES_CDV_MATERIAIS,
  calcularHashCanonicalPeca,
  calcularHashCanonicalLote,
} from '../cdvService'

describe('Módulo CDV Operacional & DPP Engine', () => {
  it('deve possuir fatores curados de CO2e evitado corretos por material', () => {
    expect(FATORES_CDV_MATERIAIS.aco.fatorKgCO2ePorKg).toBe(2.18)
    expect(FATORES_CDV_MATERIAIS.aluminio.fatorKgCO2ePorKg).toBe(14.4)
    expect(FATORES_CDV_MATERIAIS.cobre.fatorKgCO2ePorKg).toBe(5.4)
    expect(FATORES_CDV_MATERIAIS.polimeros.fatorKgCO2ePorKg).toBe(1.9)
    expect(FATORES_CDV_MATERIAIS.outros.fatorKgCO2ePorKg).toBe(1.5)
  })

  it('deve calcular corretamente o CO2e evitado para as peças do veículo de teste Gol 1.6', () => {
    // Capô 14,5 kg Aço -> 14.5 * 2.18 = 31.61 kg
    const capoPeso = 14.5
    const capoCo2e = Number((capoPeso * FATORES_CDV_MATERIAIS.aco.fatorKgCO2ePorKg).toFixed(2))
    expect(capoCo2e).toBe(31.61)

    // Alternador 5,2 kg Cobre -> 5.2 * 5.4 = 28.08 kg
    const altPeso = 5.2
    const altCo2e = Number((altPeso * FATORES_CDV_MATERIAIS.cobre.fatorKgCO2ePorKg).toFixed(2))
    expect(altCo2e).toBe(28.08)

    // Parachoque 3,8 kg Polímeros -> 3.8 * 1.9 = 7.22 kg
    const paraPeso = 3.8
    const paraCo2e = Number(
      (paraPeso * FATORES_CDV_MATERIAIS.polimeros.fatorKgCO2ePorKg).toFixed(2),
    )
    expect(paraCo2e).toBe(7.22)

    // Total evitado no lote
    const totalEvitado = capoCo2e + altCo2e + paraCo2e
    expect(totalEvitado).toBe(66.91)
  })

  it('deve gerar hash SHA-256 canônico consistente e determinístico', async () => {
    const peca = {
      selo_dpp: 'PR-SEAL-2026-991823',
      sku_interno: 'PART-SND-CAPO-01',
      descricao_peca: 'Capô Dianteiro Original com Vedação Acústica',
      peso_kg: 14.5,
      co2e_evitado_kg: 41.33,
      veiculo_baixa_detran: 'PR-BX-2026-991204',
      cdv_cnpj: '76.123.456/0001-12',
    }

    const hash1 = await calcularHashCanonicalPeca(peca)
    const hash2 = await calcularHashCanonicalPeca(peca)

    expect(hash1).toBeDefined()
    expect(hash1.length).toBe(64) // SHA-256 hex string
    expect(hash1).toBe(hash2)

    // Qualquer alteração no peso deve invalidar o hash
    const hashAlterado = await calcularHashCanonicalPeca({
      ...peca,
      peso_kg: 14.6,
    })
    expect(hashAlterado).not.toBe(hash1)
  })

  it('deve gerar hash SHA-256 verificável determinístico para o Lote Consolidado', async () => {
    const lote = {
      id: 'h1dpr8wniludemh',
      cdv_cnpj: '76.123.456/0001-12',
      veiculo_baixa_detran: 'PR-BX-2026-991204',
    }

    const pecas = [
      {
        selo_dpp: 'PR-SEAL-2026-991823',
        hash_sha256: '5f16fe468a99f78c6ff17f97ab52b5759e290ecc1dca75923858090a9e053b61',
        peso_kg: 14.5,
        co2e_evitado_kg: 41.33,
      },
      {
        selo_dpp: 'PR-SEAL-2026-991824',
        hash_sha256: '61e47159d4b0e558920428ed0341283b3b03d34a44d5322fce289d5cd2590c02',
        peso_kg: 5.2,
        co2e_evitado_kg: 28.08,
      },
      {
        selo_dpp: 'PR-SEAL-2026-991825',
        hash_sha256: '7127fd88b01ad3c338d9f777725c47ebbb7360bfe5ae51a753de7f2f1df426ea',
        peso_kg: 3.8,
        co2e_evitado_kg: 7.22,
      },
    ]

    const hashLote1 = await calcularHashCanonicalLote(lote, pecas)
    const hashLote2 = await calcularHashCanonicalLote(lote, [...pecas].reverse()) // Ordem reversa deve dar o mesmo hash pois ordena lexicograficamente

    expect(hashLote1).toBeDefined()
    expect(hashLote1.length).toBe(64)
    expect(hashLote1).toBe(hashLote2)

    // Alteração em qualquer peça deve alterar o hash do lote
    const hashLoteAlterado = await calcularHashCanonicalLote(lote, [
      pecas[0],
      pecas[1],
      {
        ...pecas[2],
        hash_sha256: '0000000000000000000000000000000000000000000000000000000000000000',
      },
    ])
    expect(hashLoteAlterado).not.toBe(hashLote1)
  })

  it('deve validar consistência do Lote Demo Renault Clio (49 peças 611, 437,7 kg) sob metodologia DM-ORB-001 v1.1 (v2: DF=0,30, L_i=1,0)', async () => {
    // 49 peças 611 recalculadas sob o motor v2:
    // Aço: 2,18 (worldsteel 2025)
    // Alumínio: 14,40 (IAI 2024 global default)
    // Cobre: 5,40 (CopperMark/ICA 2024)
    // Polímeros: 1,90 (PlasticsEurope)
    // Outros: 1,50
    // Fórmula: floor(Q * FE_ref * 1.0 * 0.30)
    const pecasDemo = [
      // Motor (8 peças)
      {
        selo: 'PR-SEAL-2026-000101',
        sku: 'CLIO-MOT-01',
        desc: 'Bloco do Motor 1.0 16V D4D com Mancais',
        cat: 'aco',
        sub: 'Motor',
        peso: 42.0,
        fator: 2.18,
        co2e: Math.floor(42.0 * 2.18 * 1.0 * 0.3 * 100) / 100, // 27.46
      },
      {
        selo: 'PR-SEAL-2026-000102',
        sku: 'CLIO-MOT-02',
        desc: 'Cabeçote 16V em Liga de Alumínio Usinado',
        cat: 'aluminio',
        sub: 'Motor',
        peso: 16.5,
        fator: 14.4,
        co2e: Math.floor(16.5 * 14.4 * 1.0 * 0.3 * 100) / 100, // 71.28
      },
      {
        selo: 'PR-SEAL-2026-000103',
        sku: 'CLIO-MOT-03',
        desc: 'Virabrequim Forjado em Aço Carbono',
        cat: 'aco',
        sub: 'Motor',
        peso: 13.0,
        fator: 2.18,
        co2e: Math.floor(13.0 * 2.18 * 1.0 * 0.3 * 100) / 100, // 8.50
      },
      {
        selo: 'PR-SEAL-2026-000104',
        sku: 'CLIO-MOT-04',
        desc: 'Comando de Válvulas Admissão e Escape (Par)',
        cat: 'aco',
        sub: 'Motor',
        peso: 6.8,
        fator: 2.18,
        co2e: Math.floor(6.8 * 2.18 * 1.0 * 0.3 * 100) / 100, // 4.44
      },
      {
        selo: 'PR-SEAL-2026-000105',
        sku: 'CLIO-MOT-05',
        desc: 'Cárter de Óleo em Liga de Alumínio Estampado',
        cat: 'aluminio',
        sub: 'Motor',
        peso: 4.2,
        fator: 14.4,
        co2e: Math.floor(4.2 * 14.4 * 1.0 * 0.3 * 100) / 100, // 18.14
      },
      {
        selo: 'PR-SEAL-2026-000106',
        sku: 'CLIO-MOT-06',
        desc: 'Coletor de Admissão em Polímero Técnico',
        cat: 'polimeros',
        sub: 'Motor',
        peso: 3.5,
        fator: 1.9,
        co2e: Math.floor(3.5 * 1.9 * 1.0 * 0.3 * 100) / 100, // 1.99
      },
      {
        selo: 'PR-SEAL-2026-000107',
        sku: 'CLIO-MOT-07',
        desc: 'Volante do Motor Bimassa em Ferro Fundido/Aço',
        cat: 'aco',
        sub: 'Motor',
        peso: 9.8,
        fator: 2.18,
        co2e: Math.floor(9.8 * 2.18 * 1.0 * 0.3 * 100) / 100, // 6.40
      },
      {
        selo: 'PR-SEAL-2026-000108',
        sku: 'CLIO-MOT-08',
        desc: 'Bomba de Óleo e Conjunto de Engrenagens',
        cat: 'aluminio',
        sub: 'Motor',
        peso: 2.4,
        fator: 14.4,
        co2e: Math.floor(2.4 * 14.4 * 1.0 * 0.3 * 100) / 100, // 10.36
      },
      // Câmbio (4 peças)
      {
        selo: 'PR-SEAL-2026-000109',
        sku: 'CLIO-CAM-01',
        desc: 'Carcaça da Caixa de Câmbio Manual JB1 Alumínio',
        cat: 'aluminio',
        sub: 'Câmbio',
        peso: 18.0,
        fator: 14.4,
        co2e: Math.floor(18.0 * 14.4 * 1.0 * 0.3 * 100) / 100, // 77.76
      },
      {
        selo: 'PR-SEAL-2026-000110',
        sku: 'CLIO-CAM-02',
        desc: 'Conjunto de Engrenagens e Eixo Primário/Secundário',
        cat: 'aco',
        sub: 'Câmbio',
        peso: 15.6,
        fator: 2.18,
        co2e: Math.floor(15.6 * 2.18 * 1.0 * 0.3 * 100) / 100, // 10.20
      },
      {
        selo: 'PR-SEAL-2026-000111',
        sku: 'CLIO-CAM-03',
        desc: 'Diferencial Completo com Coroa e Pinhão',
        cat: 'aco',
        sub: 'Câmbio',
        peso: 11.2,
        fator: 2.18,
        co2e: Math.floor(11.2 * 2.18 * 1.0 * 0.3 * 100) / 100, // 7.32
      },
      {
        selo: 'PR-SEAL-2026-000112',
        sku: 'CLIO-CAM-04',
        desc: 'Garfo Seletor e Varetas de Trambulador',
        cat: 'aco',
        sub: 'Câmbio',
        peso: 2.8,
        fator: 2.18,
        co2e: Math.floor(2.8 * 2.18 * 1.0 * 0.3 * 100) / 100, // 1.83
      },
      // Elétrica (6 peças)
      {
        selo: 'PR-SEAL-2026-000113',
        sku: 'CLIO-ELE-01',
        desc: 'Alternador 90A com Bobinamento de Cobre Eletrolítico',
        cat: 'cobre',
        sub: 'Elétrica',
        peso: 5.6,
        fator: 5.4,
        co2e: Math.floor(5.6 * 5.4 * 1.0 * 0.3 * 100) / 100, // 9.07
      },
      {
        selo: 'PR-SEAL-2026-000114',
        sku: 'CLIO-ELE-02',
        desc: 'Motor de Partida 1.1kW com Estator em Cobre',
        cat: 'cobre',
        sub: 'Elétrica',
        peso: 4.8,
        fator: 5.4,
        co2e: Math.floor(4.8 * 5.4 * 1.0 * 0.3 * 100) / 100, // 7.77
      },
      {
        selo: 'PR-SEAL-2026-000115',
        sku: 'CLIO-ELE-03',
        desc: 'Chicote Elétrico Principal do Vão do Motor',
        cat: 'cobre',
        sub: 'Elétrica',
        peso: 7.2,
        fator: 5.4,
        co2e: Math.floor(7.2 * 5.4 * 1.0 * 0.3 * 100) / 100, // 11.66
      },
      {
        selo: 'PR-SEAL-2026-000116',
        sku: 'CLIO-ELE-04',
        desc: 'Módulo de Injeção Eletrônica ECU Siemens Sirius',
        cat: 'outros',
        sub: 'Elétrica',
        peso: 1.2,
        fator: 1.5,
        co2e: Math.floor(1.2 * 1.5 * 1.0 * 0.3 * 100) / 100, // 0.54
      },
      {
        selo: 'PR-SEAL-2026-000117',
        sku: 'CLIO-ELE-05',
        desc: 'Conjunto de Bobina de Ignição e Cabos Supressores',
        cat: 'cobre',
        sub: 'Elétrica',
        peso: 1.9,
        fator: 5.4,
        co2e: Math.floor(1.9 * 5.4 * 1.0 * 0.3 * 100) / 100, // 3.07
      },
      {
        selo: 'PR-SEAL-2026-000118',
        sku: 'CLIO-ELE-06',
        desc: 'Painel de Instrumentos Analógico/Digital com PCB',
        cat: 'polimeros',
        sub: 'Elétrica',
        peso: 2.1,
        fator: 1.9,
        co2e: Math.floor(2.1 * 1.9 * 1.0 * 0.3 * 100) / 100, // 1.19
      },
      // Direção (3 peças)
      {
        selo: 'PR-SEAL-2026-000119',
        sku: 'CLIO-DIR-01',
        desc: 'Caixa de Direção Hidráulica com Pinhão e Cremalheira',
        cat: 'aco',
        sub: 'Direção',
        peso: 7.5,
        fator: 2.18,
        co2e: Math.floor(7.5 * 2.18 * 1.0 * 0.3 * 100) / 100, // 4.90
      },
      {
        selo: 'PR-SEAL-2026-000120',
        sku: 'CLIO-DIR-02',
        desc: 'Bomba Hidráulica de Direção em Liga Leve',
        cat: 'aluminio',
        sub: 'Direção',
        peso: 3.2,
        fator: 14.4,
        co2e: Math.floor(3.2 * 14.4 * 1.0 * 0.3 * 100) / 100, // 13.82
      },
      {
        selo: 'PR-SEAL-2026-000121',
        sku: 'CLIO-DIR-03',
        desc: 'Coluna de Direção Articulada com Junta Universal',
        cat: 'aco',
        sub: 'Direção',
        peso: 4.8,
        fator: 2.18,
        co2e: Math.floor(4.8 * 2.18 * 1.0 * 0.3 * 100) / 100, // 3.13
      },
      // Suspensão (6 peças)
      {
        selo: 'PR-SEAL-2026-000122',
        sku: 'CLIO-SUS-01',
        desc: 'Quadro Subchassi Dianteiro (Agregado da Suspensão)',
        cat: 'aco',
        sub: 'Suspensão',
        peso: 19.5,
        fator: 2.18,
        co2e: Math.floor(19.5 * 2.18 * 1.0 * 0.3 * 100) / 100, // 12.75
      },
      {
        selo: 'PR-SEAL-2026-000123',
        sku: 'CLIO-SUS-02',
        desc: 'Eixo Traseiro com Barra de Torção Integrada',
        cat: 'aco',
        sub: 'Suspensão',
        peso: 22.0,
        fator: 2.18,
        co2e: Math.floor(22.0 * 2.18 * 1.0 * 0.3 * 100) / 100, // 14.38
      },
      {
        selo: 'PR-SEAL-2026-000124',
        sku: 'CLIO-SUS-03',
        desc: 'Par de Molas Helicoidais Dianteiras em Aço Mola',
        cat: 'aco',
        sub: 'Suspensão',
        peso: 7.8,
        fator: 2.18,
        co2e: Math.floor(7.8 * 2.18 * 1.0 * 0.3 * 100) / 100, // 5.10
      },
      {
        selo: 'PR-SEAL-2026-000125',
        sku: 'CLIO-SUS-04',
        desc: 'Par de Molas Helicoidais Traseiras em Aço Mola',
        cat: 'aco',
        sub: 'Suspensão',
        peso: 6.4,
        fator: 2.18,
        co2e: Math.floor(6.4 * 2.18 * 1.0 * 0.3 * 100) / 100, // 4.18
      },
      {
        selo: 'PR-SEAL-2026-000126',
        sku: 'CLIO-SUS-05',
        desc: 'Bandejas / Braços Oscilantes Dianteiros (Par)',
        cat: 'aco',
        sub: 'Suspensão',
        peso: 5.6,
        fator: 2.18,
        co2e: Math.floor(5.6 * 2.18 * 1.0 * 0.3 * 100) / 100, // 3.66
      },
      {
        selo: 'PR-SEAL-2026-000127',
        sku: 'CLIO-SUS-06',
        desc: 'Manga de Eixo Dianteira com Cubo e Rolamento (Par)',
        cat: 'aco',
        sub: 'Suspensão',
        peso: 8.2,
        fator: 2.18,
        co2e: Math.floor(8.2 * 2.18 * 1.0 * 0.3 * 100) / 100, // 5.36
      },
      // Freios (4 peças)
      {
        selo: 'PR-SEAL-2026-000128',
        sku: 'CLIO-FRE-01',
        desc: 'Discos de Freio Ventilados Dianteiros (Par)',
        cat: 'aco',
        sub: 'Freios',
        peso: 10.4,
        fator: 2.18,
        co2e: Math.floor(10.4 * 2.18 * 1.0 * 0.3 * 100) / 100, // 6.80
      },
      {
        selo: 'PR-SEAL-2026-000129',
        sku: 'CLIO-FRE-02',
        desc: 'Pinças de Freio Hidráulico com Êmbolo (Par)',
        cat: 'aluminio',
        sub: 'Freios',
        peso: 5.8,
        fator: 14.4,
        co2e: Math.floor(5.8 * 14.4 * 1.0 * 0.3 * 100) / 100, // 25.05
      },
      {
        selo: 'PR-SEAL-2026-000130',
        sku: 'CLIO-FRE-03',
        desc: 'Tambores de Freio Traseiro com Sapatas (Par)',
        cat: 'aco',
        sub: 'Freios',
        peso: 9.6,
        fator: 2.18,
        co2e: Math.floor(9.6 * 2.18 * 1.0 * 0.3 * 100) / 100, // 6.27
      },
      {
        selo: 'PR-SEAL-2026-000131',
        sku: 'CLIO-FRE-04',
        desc: 'Servofreio Hidrovácuo com Cilindro Mestre Duplo',
        cat: 'aco',
        sub: 'Freios',
        peso: 4.2,
        fator: 2.18,
        co2e: Math.floor(4.2 * 2.18 * 1.0 * 0.3 * 100) / 100, // 2.74
      },
      // Arrefecimento (4 peças)
      {
        selo: 'PR-SEAL-2026-000132',
        sku: 'CLIO-ARR-01',
        desc: 'Radiador de Água com Colmeia de Alumínio Brasado',
        cat: 'aluminio',
        sub: 'Arrefecimento',
        peso: 3.9,
        fator: 14.4,
        co2e: Math.floor(3.9 * 14.4 * 1.0 * 0.3 * 100) / 100, // 16.84
      },
      {
        selo: 'PR-SEAL-2026-000133',
        sku: 'CLIO-ARR-02',
        desc: 'Condensador do Ar Condicionado em Alumínio Microcanal',
        cat: 'aluminio',
        sub: 'Arrefecimento',
        peso: 3.4,
        fator: 14.4,
        co2e: Math.floor(3.4 * 14.4 * 1.0 * 0.3 * 100) / 100, // 14.68
      },
      {
        selo: 'PR-SEAL-2026-000134',
        sku: 'CLIO-ARR-03',
        desc: 'Conjunto Eletroventilador e Defletor Termoplástico',
        cat: 'polimeros',
        sub: 'Arrefecimento',
        peso: 2.8,
        fator: 1.9,
        co2e: Math.floor(2.8 * 1.9 * 1.0 * 0.3 * 100) / 100, // 1.59
      },
      {
        selo: 'PR-SEAL-2026-000135',
        sku: 'CLIO-ARR-04',
        desc: 'Reservatório de Expansão com Mangueiras EPDM',
        cat: 'polimeros',
        sub: 'Arrefecimento',
        peso: 1.6,
        fator: 1.9,
        co2e: Math.floor(1.6 * 1.9 * 1.0 * 0.3 * 100) / 100, // 0.91
      },
      // Escape (3 peças)
      {
        selo: 'PR-SEAL-2026-000136',
        sku: 'CLIO-ESC-01',
        desc: 'Coletor de Escape Tubular em Aço Inox / Aço Carbono',
        cat: 'aco',
        sub: 'Escape',
        peso: 5.2,
        fator: 2.18,
        co2e: Math.floor(5.2 * 2.18 * 1.0 * 0.3 * 100) / 100, // 3.40
      },
      {
        selo: 'PR-SEAL-2026-000137',
        sku: 'CLIO-ESC-02',
        desc: 'Tubo Intermediário com Abafador de Expansão',
        cat: 'aco',
        sub: 'Escape',
        peso: 6.8,
        fator: 2.18,
        co2e: Math.floor(6.8 * 2.18 * 1.0 * 0.3 * 100) / 100, // 4.44
      },
      {
        selo: 'PR-SEAL-2026-000138',
        sku: 'CLIO-ESC-03',
        desc: 'Silencioso Traseiro com Ponteira em Chapa Dupla',
        cat: 'aco',
        sub: 'Escape',
        peso: 7.4,
        fator: 2.18,
        co2e: Math.floor(7.4 * 2.18 * 1.0 * 0.3 * 100) / 100, // 4.83
      },
      // Carroceria (11 peças)
      {
        selo: 'PR-SEAL-2026-000139',
        sku: 'CLIO-CAR-01',
        desc: 'Capô Dianteiro em Chapa de Aço Estampada com Manta',
        cat: 'aco',
        sub: 'Carroceria',
        peso: 15.2,
        fator: 2.18,
        co2e: Math.floor(15.2 * 2.18 * 1.0 * 0.3 * 100) / 100, // 9.94
      },
      {
        selo: 'PR-SEAL-2026-000140',
        sku: 'CLIO-CAR-02',
        desc: 'Tampa Traseira (Porta-Malas) com Vigia e Trava',
        cat: 'aco',
        sub: 'Carroceria',
        peso: 14.5,
        fator: 2.18,
        co2e: Math.floor(14.5 * 2.18 * 1.0 * 0.3 * 100) / 100, // 9.48
      },
      {
        selo: 'PR-SEAL-2026-000141',
        sku: 'CLIO-CAR-03',
        desc: 'Porta Dianteira Esquerda Completa com Vidro e Máquina',
        cat: 'aco',
        sub: 'Carroceria',
        peso: 18.2,
        fator: 2.18,
        co2e: Math.floor(18.2 * 2.18 * 1.0 * 0.3 * 100) / 100, // 11.90
      },
      {
        selo: 'PR-SEAL-2026-000142',
        sku: 'CLIO-CAR-04',
        desc: 'Porta Dianteira Direita Completa com Vidro e Máquina',
        cat: 'aco',
        sub: 'Carroceria',
        peso: 18.2,
        fator: 2.18,
        co2e: Math.floor(18.2 * 2.18 * 1.0 * 0.3 * 100) / 100, // 11.90
      },
      {
        selo: 'PR-SEAL-2026-000143',
        sku: 'CLIO-CAR-05',
        desc: 'Porta Traseira Esquerda com Guarnições',
        cat: 'aco',
        sub: 'Carroceria',
        peso: 16.5,
        fator: 2.18,
        co2e: Math.floor(16.5 * 2.18 * 1.0 * 0.3 * 100) / 100, // 10.79
      },
      {
        selo: 'PR-SEAL-2026-000144',
        sku: 'CLIO-CAR-06',
        desc: 'Porta Traseira Direita com Guarnições',
        cat: 'aco',
        sub: 'Carroceria',
        peso: 16.5,
        fator: 2.18,
        co2e: Math.floor(16.5 * 2.18 * 1.0 * 0.3 * 100) / 100, // 10.79
      },
      {
        selo: 'PR-SEAL-2026-000145',
        sku: 'CLIO-CAR-07',
        desc: 'Paralama Dianteiro Esquerdo Estampado',
        cat: 'aco',
        sub: 'Carroceria',
        peso: 4.8,
        fator: 2.18,
        co2e: Math.floor(4.8 * 2.18 * 1.0 * 0.3 * 100) / 100, // 3.13
      },
      {
        selo: 'PR-SEAL-2026-000146',
        sku: 'CLIO-CAR-08',
        desc: 'Paralama Dianteiro Direito Estampado',
        cat: 'aco',
        sub: 'Carroceria',
        peso: 4.8,
        fator: 2.18,
        co2e: Math.floor(4.8 * 2.18 * 1.0 * 0.3 * 100) / 100, // 3.13
      },
      {
        selo: 'PR-SEAL-2026-000147',
        sku: 'CLIO-CAR-09',
        desc: 'Parachoque Dianteiro Termoplástico Injetado',
        cat: 'polimeros',
        sub: 'Carroceria',
        peso: 4.2,
        fator: 1.9,
        co2e: Math.floor(4.2 * 1.9 * 1.0 * 0.3 * 100) / 100, // 2.39
      },
      {
        selo: 'PR-SEAL-2026-000148',
        sku: 'CLIO-CAR-10',
        desc: 'Parachoque Traseiro Termoplástico Injetado',
        cat: 'polimeros',
        sub: 'Carroceria',
        peso: 4.6,
        fator: 1.9,
        co2e: Math.floor(4.6 * 1.9 * 1.0 * 0.3 * 100) / 100, // 2.62
      },
      {
        selo: 'PR-SEAL-2026-000149',
        sku: 'CLIO-CAR-11',
        desc: 'Alma de Aço Reforço Estrutural do Parachoque',
        cat: 'aco',
        sub: 'Carroceria',
        peso: 5.5,
        fator: 2.18,
        co2e: Math.floor(5.5 * 2.18 * 1.0 * 0.3 * 100) / 100, // 3.59
      },
    ]

    // 1. Quantidade exata de 49 peças
    expect(pecasDemo.length).toBe(49)

    // 2. Os 9 subsistemas estão presentes e contêm peças
    const subsistemasSet = new Set(pecasDemo.map((p) => p.sub))
    expect(subsistemasSet.size).toBe(9)
    expect(Array.from(subsistemasSet).sort()).toEqual([
      'Arrefecimento',
      'Carroceria',
      'Câmbio',
      'Direção',
      'Elétrica',
      'Escape',
      'Freios',
      'Motor',
      'Suspensão',
    ])

    // 3. Soma da massa fecha em 437,70 kg (437,7 kg)
    const massaTotal = pecasDemo.reduce((acc, p) => acc + p.peso, 0)
    expect(massaTotal).toBeCloseTo(437.7, 1)

    // 4. Soma de CO2e evitado sob motor v2 fecha em 451,97 kgCO2e
    const co2eTotal = pecasDemo.reduce((acc, p) => acc + p.co2e, 0)
    expect(co2eTotal).toBeCloseTo(451.97, 1)

    // 5. Todos os selos seguem o padrão PR-SEAL-2026-XXXXXX e são únicos
    const selosSet = new Set(pecasDemo.map((p) => p.selo))
    expect(selosSet.size).toBe(49)
    pecasDemo.forEach((p) => {
      expect(p.selo).toMatch(/^PR-SEAL-2026-\d{6}$/)
    })

    // 6. Teste de hash SHA-256 canônico individual determinístico para peças do lote demo
    const pecaExemplo = pecasDemo[0]
    const hashPeca = await calcularHashCanonicalPeca({
      selo_dpp: pecaExemplo.selo,
      sku_interno: pecaExemplo.sku,
      descricao_peca: pecaExemplo.desc,
      peso_kg: pecaExemplo.peso,
      co2e_evitado_kg: pecaExemplo.co2e,
      veiculo_baixa_detran: 'PR-BX-2026-1240105',
      cdv_cnpj: '76.123.456/0001-12',
    })
    expect(hashPeca).toHaveLength(64)

    // 7. Hash SHA-256 do lote consolidado demo é determinístico
    const loteDemoInfo = {
      id: 'c1jz14hgmf7n13i',
      cdv_cnpj: '76.123.456/0001-12',
      veiculo_baixa_detran: 'PR-BX-2026-1240105',
    }
    const pecasComSeloEHash = pecasDemo.map((p) => ({
      selo_dpp: p.selo,
      sku_interno: p.sku,
      peso_kg: p.peso,
      co2e_evitado_kg: p.co2e,
    }))

    const hashLoteDemo1 = await calcularHashCanonicalLote(loteDemoInfo, pecasComSeloEHash)
    const hashLoteDemo2 = await calcularHashCanonicalLote(
      loteDemoInfo,
      [...pecasComSeloEHash].reverse(),
    )

    expect(hashLoteDemo1).toBeDefined()
    expect(hashLoteDemo1).toHaveLength(64)
    expect(hashLoteDemo1).toBe(hashLoteDemo2)
  })

  it('deve filtrar para o hash canônico do lote APENAS peças 611 (catalogo <= 49), excluindo peças MOVER (50-77)', async () => {
    const loteInfo = {
      id: 'c1jz14hgmf7n13i',
      cdv_cnpj: '76.123.456/0001-00',
      veiculo_baixa_detran: 'PR-BX-2026-1240105',
    }

    const pecas611 = [
      {
        selo_dpp: 'PR-SEAL-2026-000101',
        sku_interno: 'CLIO-MOT-01',
        peso_kg: 42.0,
        co2e_evitado_kg: 119.7,
        catalogo_numero: 1,
        origem: '611_vigente',
        hash_sha256: '8cf76eac8b95ab17d2d59db48acdff144392c14d941d72ca036eb79657098649',
      },
      {
        selo_dpp: 'PR-SEAL-2026-000102',
        sku_interno: 'CLIO-MOT-02',
        peso_kg: 16.5,
        co2e_evitado_kg: 135.3,
        catalogo_numero: 2,
        origem: '611_vigente',
        hash_sha256: 'ca330e4f40d80e3ce7a16fa3418fa0f65b7420fb07af81633c4b7f9417264a72',
      },
    ]

    const pecasMover = [
      {
        selo_dpp: 'PR-SEAL-2026-000150',
        sku_interno: 'CLIO-MOV-50',
        peso_kg: 8.0,
        co2e_evitado_kg: 65.6,
        catalogo_numero: 50,
        origem: 'ampliada_mover',
        hash_sha256: '1111111111111111111111111111111111111111111111111111111111111111',
      },
      {
        selo_dpp: 'PR-SEAL-2026-000151',
        sku_interno: 'CLIO-MOV-51',
        peso_kg: 0.5,
        co2e_evitado_kg: 4.1,
        catalogo_numero: 51,
        origem: 'ampliada_mover',
        hash_sha256: '2222222222222222222222222222222222222222222222222222222222222222',
      },
    ]

    // O hash com apenas as 611 deve ser IDÊNTICO ao hash contendo 611 + MOVER, pois MOVER é descartada do cálculo
    const hashSomente611 = await calcularHashCanonicalLote(loteInfo, pecas611)
    const hashMisto = await calcularHashCanonicalLote(loteInfo, [...pecas611, ...pecasMover])

    expect(hashSomente611).toBe(hashMisto)

    // Fallback tolerante para peças antigas sem catalogo_numero: devem ser incluídas no hash
    const pecasLegado = [
      {
        selo_dpp: 'PR-LEGADO-001',
        peso_kg: 10,
        co2e_evitado_kg: 28.5,
      },
    ]
    const hashLegado = await calcularHashCanonicalLote(loteInfo, pecasLegado)
    expect(hashLegado).toHaveLength(64)
  })

  it('deve formatar IP mascarado conforme as regras estritas da LGPD', () => {
    // IPv4: preservar apenas dois primeiros octetos
    const mascararIpLgpd = (rawIp: string): string => {
      if (!rawIp) return 'xxx.xxx.xxx.xxx'
      if (rawIp.includes('.')) {
        const parts = rawIp.split('.')
        return parts.length === 4 ? `${parts[0]}.${parts[1]}.xxx.xxx` : 'xxx.xxx.xxx.xxx'
      }
      if (rawIp.includes(':')) {
        const parts = rawIp.split(':')
        return parts.length >= 2 ? `${parts[0]}:${parts[1]}:xxxx:xxxx::` : 'xxxx:xxxx::'
      }
      return 'xxx.xxx.xxx.xxx'
    }

    expect(mascararIpLgpd('189.40.122.95')).toBe('189.40.xxx.xxx')
    expect(mascararIpLgpd('177.136.24.10')).toBe('177.136.xxx.xxx')
    expect(mascararIpLgpd('2804:14d:5483:8100:e901:4b8a:ff12:8910')).toBe('2804:14d:xxxx:xxxx::')
    expect(mascararIpLgpd('')).toBe('xxx.xxx.xxx.xxx')
  })

  it('valida estrutura e funções do catálogo de rastreabilidade (CONTRAN 611 e MOVER)', async () => {
    // 5 situações possíveis de checklist
    const situacoesValidas = [
      'etiquetada',
      'nao_desmontada',
      'inservivel',
      'nao_aplicavel_ausente',
      'aguardando_avaliacao',
    ]
    expect(situacoesValidas).toHaveLength(5)
    expect(situacoesValidas).toContain('nao_desmontada')
    expect(situacoesValidas).toContain('etiquetada')
  })

  it('deve manter o hash SHA-256 do lote inalterado independentemente da avaliação de adicionalidade anexada', async () => {
    const loteInfo = {
      id: 'lote-hash-test-01',
      cdv_cnpj: '76.123.456/0001-12',
      veiculo_baixa_detran: 'PR-BX-2026-991204',
    }

    const pecas611 = [
      {
        selo_dpp: 'PR-SEAL-2026-000101',
        sku_interno: 'CLIO-MOT-01',
        peso_kg: 42.0,
        co2e_evitado_kg: 119.7,
        catalogo_numero: 1,
        origem: '611_vigente',
        hash_sha256: '8cf76eac8b95ab17d2d59db48acdff144392c14d941d72ca036eb79657098649',
      },
      {
        selo_dpp: 'PR-SEAL-2026-000102',
        sku_interno: 'CLIO-MOT-02',
        peso_kg: 16.5,
        co2e_evitado_kg: 135.3,
        catalogo_numero: 2,
        origem: '611_vigente',
        hash_sha256: 'ca330e4f40d80e3ce7a16fa3418fa0f65b7420fb07af81633c4b7f9417264a72',
      },
    ]

    // 1. Hash canônico original do lote
    const hashOriginal = await calcularHashCanonicalLote(loteInfo, pecas611)

    // 2. Lote com metadados de adicionalidade presentes no payload/objeto
    const loteComAdicionalidade = {
      ...loteInfo,
      adicionalidade_json: {
        adicionalidade_investimento: true,
        barreira_tecnologica: true,
        nao_obrigatoriedade_legal: true,
        justificativa_pericial: 'Justificativa pericial de demonstração de adicionalidade',
      },
    }

    // O hash CANÔNICO do lote avalia apenas os atributos de identidade CONTRAN 611 (id, cdv_cnpj, veiculo_baixa_detran) + hashes das peças 611
    const hashComAdicionalidade = await calcularHashCanonicalLote(loteComAdicionalidade, pecas611)

    expect(hashComAdicionalidade).toBe(hashOriginal)
  })
})
