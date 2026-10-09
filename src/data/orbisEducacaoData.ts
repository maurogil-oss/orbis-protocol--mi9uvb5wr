/**
 * Conteúdo e Estrutura da Trilha Gamificada Orbis Educação MEI
 * 7 Lições curtas (~5 minutos cada)
 *
 * Diretrizes:
 * - Emissão exclusiva de "Atestado de Participação Orbis"
 * - NUNCA usar "Certificado" ou "Certificação"
 * - NUNCA prometer crédito de carbono ou benefício fiscal ao participante
 * - Ponte de funil ao concluir: diagnóstico gratuito + trial de 5 notas
 */

export interface LicaoEducacaoMEI {
  id: number
  slug: string
  titulo: string
  tempoMinutos: number
  icone: string
  descricao: string
  conteudoTexto: string
  dicaPratica: string
  perguntaQuiz: {
    enunciado: string
    opcoes: string[]
    respostaCorretaIndex: number
    explicacao: string
  }
}

export const LICOES_ORBIS_EDUCACAO_MEI: LicaoEducacaoMEI[] = [
  {
    id: 1,
    slug: 'o-que-e-pegada-carbono-nota',
    titulo: 'O que é a pegada de carbono da sua nota fiscal',
    tempoMinutos: 5,
    icone: 'Receipt',
    descricao:
      'Entenda como os produtos que você compra com NF-e carregam emissões de CO₂e incorporadas.',
    conteudoTexto:
      'Toda mercadoria, insumo ou embalagem comprada pelo pequeno negócio consumiu energia, matéria-prima e transporte para existir. A pegada de carbono por nota fiscal é a quantificação (em kg de CO₂ equivalente) desse impacto, calculada a partir dos códigos NCM e das quantidades descritas no documento fiscal. Conhecer a pegada das suas notas não é burocracia: é a chave para identificar quais fornecedores são mais eficientes e onde o pequeno negócio gasta mais do que precisa.',
    dicaPratica:
      'Exija nota fiscal completa dos fornecedores com a descrição correta e NCM. Notas sem detalhamento impedem a comprovação da sua eficiência.',
    perguntaQuiz: {
      enunciado:
        'Por que a nota fiscal é a base do cálculo da pegada de carbono no Orbis Protocol?',
      opcoes: [
        'Porque a nota fiscal é o documento oficial de transação comercial brasileiro, permitindo auditoria pericial sem achismos.',
        'Porque a nota fiscal garante automaticamente créditos de carbono ao comprador.',
        'Porque substitui a declaração de imposto de renda da pessoa física.',
        'Porque apenas empresas do exterior emitem notas fiscais.',
      ],
      respostaCorretaIndex: 0,
      explicacao:
        'A nota fiscal eletrônica (NF-e/NFC-e) é a prova material e legal das operações, permitindo rastrear insumos e calcular emissões com lastro pericial.',
    },
  },
  {
    id: 2,
    slug: 'o-que-muda-reforma-tributaria',
    titulo: 'O que muda na Reforma Tributária para o pequeno negócio',
    tempoMinutos: 5,
    icone: 'Scale',
    descricao: 'IBS, CBS e Imposto Seletivo: o que o MEI precisa saber sem jargões complicados.',
    conteudoTexto:
      'A Emenda Constitucional 132/2023 unifica tributos em dois pilares: a CBS federal e o IBS estadual/municipal, somados ao Imposto Seletivo ("imposto do pecado"). Para o MEI e optantes do Simples Nacional, o regime especial foi preservado, mas grandes compradores exigirão notas fiscais que gerem créditos ou que comprovem conformidade socioambiental. O Orbis Protocol informa a situação tributária da sua empresa em relação à reforma como um plus de atração e inteligência competitiva.',
    dicaPratica:
      'Empresas maiores que compram do MEI vão priorizar quem mantiver cadastros fiscais ativos e comprovação de integridade documental.',
    perguntaQuiz: {
      enunciado: 'Qual o papel da informação tributária da reforma na plataforma Orbis Protocol?',
      opcoes: [
        'É o produto principal da empresa e substitui o contador.',
        'É um plus complementar ao produto central, que é a pegada de carbono das notas fiscais.',
        'É uma promessa de isenção total de impostos para quem concluir a trilha.',
        'É uma forma de emitir DARF diretamente pelo WhatsApp.',
      ],
      respostaCorretaIndex: 1,
      explicacao:
        'O produto central do Orbis Protocol é a pegada de carbono por nota fiscal; a situação tributária em relação à reforma é um plus de alto valor.',
    },
  },
  {
    id: 3,
    slug: 'economia-circular-no-dia-a-dia',
    titulo: 'Economia circular aplicada ao pequeno negócio',
    tempoMinutos: 5,
    icone: 'RefreshCw',
    descricao: 'Transforme sobras em receita: como reaproveitar materiais e reduzir desperdício.',
    conteudoTexto:
      'Na economia linear tradicional, compramos, usamos e jogamos fora. Na economia circular, resíduos e subprodutos são mantidos no mais alto nível de utilidade pelo maior tempo possível. Para o MEI gastronômico, da moda ou da manutenção, isso significa: separar aparas, encaminhar óleo vegetal usado para saboaria ou biocombustível, e preferir insumos reutilizáveis. O desperdício que vai para a lixeira comum é custo dobrado: você pagou para comprar e paga para descartar.',
    dicaPratica:
      'Mensure durante uma semana o peso ou volume das sobras do seu negócio. O que pode ser reintroduzido na cadeia ou vendido para reciclagem?',
    perguntaQuiz: {
      enunciado: 'O que caracteriza uma prática genuína de economia circular no pequeno negócio?',
      opcoes: [
        'Manter materiais e insumos circulando no ciclo produtivo, evitando o envio prematuro para aterros.',
        'Despejar óleo de cozinha na pia após o uso para não acumular recipientes.',
        'Comprar o dobro de descartáveis plásticos para estocar.',
        'Prometer créditos de carbono sem medição ou laudo pericial.',
      ],
      respostaCorretaIndex: 0,
      explicacao:
        'A economia circular busca prolongar o ciclo de vida dos materiais e minimizar perdas materiais e financeiras.',
    },
  },
  {
    id: 4,
    slug: 'pnrs-e-obrigacoes-pequeno-negocio',
    titulo: 'PNRS e obrigações de logística reversa',
    tempoMinutos: 5,
    icone: 'FileCheck',
    descricao:
      'Política Nacional de Resíduos Sólidos (Lei 12.305/2010): responsabilidade compartilhada.',
    conteudoTexto:
      'A Política Nacional de Resíduos Sólidos estabelece que fabricantes, importadores, distribuidores e comerciantes têm responsabilidade compartilhada pelo ciclo de vida dos produtos e embalagens. Quem comercializa embalagens plásticas, papelão, lâmpadas, pilhas ou óleo deve viabilizar pontos de entrega ou comprovar parcerias com cooperativas e operadores homologados. Cidades e grandes redes já exigem comprovantes rastreáveis de destinação ambientalmente adequada.',
    dicaPratica:
      'Guarde os comprovantes de coleta do óleo vegetal ou de doação de recicláveis para cooperativas locais cadastradas.',
    perguntaQuiz: {
      enunciado:
        'Quem tem responsabilidade compartilhada pelo ciclo de vida das embalagens segundo a PNRS?',
      opcoes: [
        'Apenas os consumidores finais residenciais.',
        'Toda a cadeia: fabricantes, distribuidores, comerciantes e poder público.',
        'Apenas indústrias com faturamento bilionário.',
        'Ninguém, a destinação é voluntária e sem previsão legal.',
      ],
      respostaCorretaIndex: 1,
      explicacao:
        'A Lei 12.305/2010 define a responsabilidade compartilhada pelo ciclo de vida dos produtos por todos os elos da cadeia.',
    },
  },
  {
    id: 5,
    slug: 'troca-embalagem-reducao-custo',
    titulo: 'Como reduzir custos com a troca de embalagens',
    tempoMinutos: 5,
    icone: 'Package',
    descricao:
      'Trocar plástico e isopor por papel kraft ou biodegradáveis: custos reais e valor percebido.',
    conteudoTexto:
      'A troca de embalagens plásticas de uso único por papel reciclado, kraft certificado ou biodegradáveis frequentemente parece mais cara no preço unitário. Contudo, ao considerar o ganho de percepção de valor pelos clientes, a fidelização no delivery, a redução de perdas por vazamento térmico e a isenção de autuações municipais, o custo total de posse frequentemente diminui. Além disso, embalagens recicláveis facilitam o cumprimento das metas de logística reversa.',
    dicaPratica:
      'Faça o teste de trocar um único item (por exemplo, a sacola plástica externa por kraft) e meça a reação e avaliação dos clientes no delivery.',
    perguntaQuiz: {
      enunciado:
        'Qual o impacto econômico e ambiental de adotar embalagens recicláveis no delivery?',
      opcoes: [
        'Aumenta o passivo ambiental e afasta clientes conscientes.',
        'Reduz a pegada de Escopo 3, agrega valor percebido ao produto final e mitiga riscos da PNRS.',
        'Torna a emissão de nota fiscal proibida pelos órgãos municipais.',
        'Gera créditos de carbono instantâneos em dinheiro.',
      ],
      respostaCorretaIndex: 1,
      explicacao:
        'A substituição consciente de embalagens valoriza a marca perante o consumidor e reduz o impacto na cadeia de resíduos pós-consumo.',
    },
  },
  {
    id: 6,
    slug: 'eficiencia-energetica-pequeno-negocio',
    titulo: 'Eficiência energética e redução na conta de luz',
    tempoMinutos: 5,
    icone: 'Zap',
    descricao:
      'Pequenas mudanças no maquinário, refrigeração e cocção que cortam gastos fixos todo mês.',
    conteudoTexto:
      'A conta de energia elétrica e o gás de cozinha (GLP) representam parcelas substanciais do custo fixo do MEI. Manutenção periódica de borrachas de geladeiras e freezers, limpeza de condensadores, uso de iluminação LED e regulagem da queima dos bicos de gás evitam perdas de até 25% na fatura. Menos kWh e menos botijões significam menor emissão de Escopo 1 e Escopo 2, com benefício financeiro direto no caixa.',
    dicaPratica:
      'Faça o teste da folha de papel na borracha do freezer: se a folha deslizar fácil com a porta fechada, a borracha precisa de troca imediata.',
    perguntaQuiz: {
      enunciado:
        'Como a eficiência energética beneficia diretamente o microempreendedor individual?',
      opcoes: [
        'Reduzindo o gasto fixo mensal com eletricidade e gás, enquanto diminui as emissões de carbono da operação.',
        'Apenas se a empresa instalar uma usina hidrelétrica particular.',
        'Não traz nenhum benefício prático até o ano de 2050.',
        'Obriga a empresa a fechar as portas nos horários de pico.',
      ],
      respostaCorretaIndex: 0,
      explicacao:
        'Eficiência energética é corte direto de despesa operacional mensal somado à diminuição da pegada de carbono.',
    },
  },
  {
    id: 7,
    slug: 'prova-documental-e-atestado-orbis',
    titulo: 'Prova documental da sustentabilidade e próximos passos',
    tempoMinutos: 5,
    icone: 'Award',
    descricao:
      'Como emitir seu Atestado de Participação Orbis com hash verificável e acessar o trial de 5 notas.',
    conteudoTexto:
      'Sustentabilidade séria não se faz com propaganda vazia ("greenwashing"), mas com prova documental rastreável. Ao concluir este programa, você recebe o Atestado de Participação Orbis, registrado com código exclusivo e hash SHA-256 verificável publicamente na plataforma. Nunca chamamos este documento de "Certificado" ou "Certificação" e nunca prometemos créditos de carbono ou incentivos fiscais fictícios. É um atestado de aprendizado probatório, que abre as portas para o diagnóstico gratuito do seu CNPJ e o trial de 15 dias com 5 notas fiscais calculadas.',
    dicaPratica:
      'Compartilhe seu Atestado de Participação Orbis com clientes, fornecedores e nas redes sociais para demonstrar compromisso com a conformidade real.',
    perguntaQuiz: {
      enunciado:
        'Qual o nome e o compromisso ético do documento emitido ao concluir o programa Orbis Educação?',
      opcoes: [
        'Certificado Oficial de Isenção Tributária com promessa de créditos de carbono garantidos.',
        'Atestado de Participação Orbis (verificável com hash), sem prometer crédito de carbono ou benefício fiscal fictício.',
        'Diploma Universitário de Engenharia Ambiental Reconhecido pelo MEC.',
        'Selo Ouro de Carbono Zero sem necessidade de comprovação por notas.',
      ],
      respostaCorretaIndex: 1,
      explicacao:
        'O documento é estritamente o Atestado de Participação Orbis, emitido com integridade, hash verificável e honestidade canônica.',
    },
  },
]
