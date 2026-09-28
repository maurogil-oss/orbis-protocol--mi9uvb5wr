import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  ArrowLeft,
  Lock,
  FileCheck2,
  AlertTriangle,
  Scale,
  Hash,
  Fingerprint,
} from 'lucide-react'

export default function TermosUsoPage() {
  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[920px] mx-auto px-4 sm:px-6">
        {/* Navegação de retorno */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#93A3B5] hover:text-[#12B886] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Início</span>
          </Link>
        </div>

        {/* Card Principal */}
        <div className="p-8 sm:p-12 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-2xl space-y-8">
          {/* Header */}
          <div className="border-b border-[rgba(244,247,250,0.1)] pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-xs font-bold tracking-wider uppercase mb-3">
              <ShieldCheck className="w-4 h-4 text-[#12B886]" />
              GOVERNANÇA & PROTEÇÃO DOCUMENTAL • LEI Nº 9.610/1998
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA]">
              TERMOS DE USO & PROTEÇÃO DE PROPRIEDADE INTELECTUAL
            </h1>
            <p className="text-xs sm:text-sm text-[#93A3B5] mt-2">
              Última atualização: Março de 2026 • Operadora Técnica: MGM CONSULTORIA EMPRESARIAL
              LTDA (CNPJ 19.598.964/0001-01) • Plataforma Orbis Protocol
            </p>
          </div>

          {/* Destaque Institucional: Posicionamento */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#0A0E12] border-l-4 border-[#12B886] text-xs sm:text-sm text-[#93A3B5] leading-relaxed space-y-2">
            <div className="flex items-center gap-2 text-[#12B886] font-bold uppercase tracking-wider text-xs">
              <Fingerprint className="w-4 h-4 text-[#12B886]" />
              <span>Infraestrutura Tecnológica de Prova Documental</span>
            </div>
            <p>
              O <strong className="text-[#F4F7FA]">Orbis Protocol</strong> é uma plataforma de
              tecnologia para cálculo, auditoria probatória e infraestrutura de prova documental
              digital (dMRV). A plataforma não atua como certificadora governamental independente
              nem emite créditos de carbono; sua missão é assegurar integridade matemática,
              rastreabilidade fiscal e prova imutável via hash SHA-256 e trilha auditável para
              documentos técnicos, laudos periciais e Atestados de Conformidade Orbis (com ART/RRT).
            </p>
          </div>

          {/* Seção 1 */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-[#F4F7FA] flex items-center gap-2">
              <span className="text-[#12B886]">1.</span> Objeto e Aceitação
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
              Estes Termos de Uso regulam o acesso e a utilização dos serviços digitais, ferramentas
              de cálculo, módulos analíticos, relatórios e documentos emitidos pela plataforma{' '}
              <strong className="text-[#F4F7FA]">Orbis Protocol</strong>, acessível em{' '}
              <span className="text-[#12B886] font-mono">www.orbis-protocol.com</span> e seus
              subdomínios, operada pela{' '}
              <strong className="text-[#F4F7FA]">MGM CONSULTORIA EMPRESARIAL LTDA</strong>.
            </p>
            <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
              O cadastro, a navegação ou a recepção de qualquer laudo, dossiê, passaporte digital ou
              Atestado de Conformidade Orbis emitido pela plataforma implica a adesão integral e
              irretratável a estes termos.
            </p>
          </section>

          {/* Seção 2 */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-[#F4F7FA] flex items-center gap-2">
              <span className="text-[#12B886]">2.</span> Propriedade Intelectual sobre Estruturas,
              Documentos e Laudos
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
              Todos os direitos de propriedade intelectual relativos à arquitetura de software,
              interfaces visuais, modelos de dados, algoritmos de cálculo de emissões, matrizes de
              adicionalidade, taxonomia de componentes automotivos e resíduos industriais, formatos
              de relatórios periciais e a estrutura visual e textual dos documentos emitidos
              (incluindo o layout dos laudos dMRV e do Atestado de Conformidade Orbis com ART/RRT)
              pertencem com exclusividade à{' '}
              <strong className="text-[#F4F7FA]">MGM CONSULTORIA EMPRESARIAL LTDA</strong> e seus
              licenciantes, protegidos pela Lei Federal nº 9.610/1998 (Direitos Autorais), Lei
              Federal nº 9.609/1998 (Proteção da Propriedade Intelectual de Programa de Computador)
              e tratados internacionais.
            </p>
          </section>

          {/* Seção 3 */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-[#F4F7FA] flex items-center gap-2">
              <span className="text-[#12B886]">3.</span> Proibição Expressa de Cópia, Reprodução e
              Engenharia Reversa
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
              É expressamente proibido a qualquer usuário, cliente, parceiro, concorrente ou
              terceiro:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-1">
                <span className="text-xs font-bold text-[#F03E54] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Cópia e Clonagem de Estrutura
                </span>
                <p className="text-xs text-[#93A3B5]">
                  Reproduzir, imitar ou clonar layouts, esquemas documentais, modelos de atestados,
                  dossiês periciais ou fluxo visual de passaportes digitais para aplicação em outros
                  sistemas sem prévia autorização por escrito.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-1">
                <span className="text-xs font-bold text-[#F03E54] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Remoção de Elementos de Autenticidade
                </span>
                <p className="text-xs text-[#93A3B5]">
                  Remover, mascarar, recortar ou alterar qualquer marca d&apos;água de proveniência,
                  hash criptográfico SHA-256, identificador de lote ou menção de emissão via Orbis
                  Protocol.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-1">
                <span className="text-xs font-bold text-[#F03E54] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Engenharia Reversa e Extração
                </span>
                <p className="text-xs text-[#93A3B5]">
                  Realizar engenharia reversa, descompilação, varredura automatizada maliciosa ou
                  extração não autorizada das bases de regras e fatores curados da plataforma.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-1">
                <span className="text-xs font-bold text-[#F03E54] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Uso Indevido de Marcas e Nomes
                </span>
                <p className="text-xs text-[#93A3B5]">
                  Utilizar os nomes comerciais, logomarcas ou expressões protegidas do Orbis
                  Protocol para induzir terceiros em erro ou simular emissão de documentos por ente
                  diverso do emissor real.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 4 */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-[#F4F7FA] flex items-center gap-2">
              <span className="text-[#12B886]">4.</span> Prova Documental via Hash SHA-256 e Trilha
              Imutável
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
              Cada laudo pericial, relatório dMRV, passaporte digital e Atestado de Conformidade
              Orbis gerado na plataforma recebe um identificador único e um resumo criptográfico
              canônico calculado sob o algoritmo <strong className="text-[#F4F7FA]">SHA-256</strong>{' '}
              (FIPS PUB 180-4), registrado em trilha imutável auditável.
            </p>
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 space-y-2 text-xs sm:text-sm text-[#93A3B5]">
              <div className="flex items-center gap-2 text-[#D9B36C] font-mono text-xs font-bold">
                <Hash className="w-4 h-4 text-[#D9B36C]" />
                <span>INTEGRIDADE E PROVA DE ANTERIORIDADE</span>
              </div>
              <p>
                O hash SHA-256 e os carimbos de tempo constituem meio de prova técnica de
                anterioridade, integridade do conteúdo e autenticidade da emissão. Qualquer
                adulteração posterior do arquivo ou documento altera irremediavelmente o hash
                computado, evidenciando fraude documental perante o verificador público e instâncias
                periciais.
              </p>
              <p className="text-[11px] text-[#93A3B5]">
                A conferência da autenticidade pode ser realizada a qualquer momento por qualquer
                terceiro interessado por meio da ferramenta pública em{' '}
                <Link to="/verificador" className="text-[#12B886] underline font-medium">
                  orbis-protocol.com/verificador
                </Link>
                .
              </p>
            </div>
          </section>

          {/* Seção 5 */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-[#F4F7FA] flex items-center gap-2">
              <span className="text-[#12B886]">5.</span> Limites de Responsabilidade e Escopo de
              Entrega
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
              Em estrita aderência aos princípios da transparência e veracidade das informações:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#93A3B5] space-y-2 pl-2">
              <li>
                <strong className="text-[#F4F7FA]">Infraestrutura de Prova Documental:</strong> A
                plataforma fornece infraestrutura para apuração e custódia probatória de dados; a
                veracidade primária das informações cadastrais e fiscais inseridas é de exclusiva
                responsabilidade da organização usuária e dos profissionais técnicos declarantes.
              </li>
              <li>
                <strong className="text-[#F4F7FA]">
                  Inexistência de Emissão de Créditos de Carbono:
                </strong>{' '}
                O Orbis Protocol não emite nem comercializa créditos de carbono (incluindo unidades
                de mercados regulados ou padrões privados). Os cálculos de emissões e emissões
                evitadas prestam-se à gestão interna, inventários corporativos (GHG Protocol),
                conformidade com diretrizes setoriais e suporte a questionários de instituições
                financeiras.
              </li>
              <li>
                <strong className="text-[#F4F7FA]">Logística Reversa PNRS:</strong> Módulos e
                funcionalidades voltados a logística reversa e créditos de reciclagem encontram-se{' '}
                <span className="text-[#D9B36C] font-semibold">&ldquo;em estruturação&rdquo;</span>,
                não constituindo compromisso de prazo, produto acabado ou homologação antecipada
                perante órgãos ambientais específicos.
              </li>
              <li>
                <strong className="text-[#F4F7FA]">Responsabilidade Técnica:</strong> A vinculação
                de Anotação de Responsabilidade Técnica (ART/CREA) ou Registro de Responsabilidade
                Técnica (RRT/CAU) depende do credenciamento e da chancela do profissional pericial
                habilitado, sendo de sua exclusiva competência a emissão de parecer técnico
                profissional.
              </li>
            </ul>
          </section>

          {/* Seção 6 */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-[#F4F7FA] flex items-center gap-2">
              <span className="text-[#12B886]">6.</span> Marca d&apos;Água de Proveniência e Uso
              Legítimo
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
              Os documentos gerados pela plataforma incorporam marca d&apos;água de proveniência
              visível em tela e na impressão/exportação para PDF. O cliente possui licença de uso do
              documento emitido para comprovação perante clientes, fornecedores, bancos e órgãos de
              fiscalização, mantida a integridade de todos os elementos originais de autenticidade
              (marca d&apos;água, conta emissora, data/hora e hash de identificação).
            </p>
          </section>

          {/* Seção 7 */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-[#F4F7FA] flex items-center gap-2">
              <span className="text-[#12B886]">7.</span> Legislação Aplicável e Foro de Eleição
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Para
              dirimir quaisquer controvérsias decorrentes destes termos ou do uso da plataforma,
              fica eleito o Foro da Comarca de Curitiba, Estado do Paraná, com renúncia expressa a
              qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          {/* Footer Card de Contato */}
          <div className="pt-6 border-t border-[rgba(244,247,250,0.1)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#93A3B5]">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-[#F4F7FA] font-semibold">
                Dúvidas sobre governança documental ou propriedade intelectual?
              </p>
              <p>Entre em contato com nossa equipe jurídica e técnica.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/privacidade"
                className="px-4 py-2 rounded-lg bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#93A3B5] hover:text-[#12B886] transition-colors"
              >
                Política de Privacidade
              </Link>
              <Link
                to="/titular-dados"
                className="px-4 py-2 rounded-lg bg-[#12B886] text-[#0A0E12] font-semibold hover:bg-[#0CA678] transition-colors"
              >
                Canal LGPD
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
