import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, Scale, Lock, Info } from 'lucide-react'
import { useSeo } from '@/hooks/useSeo'
import {
  VERSAO_DOCUMENTO_LGPD_ATUAL,
  DATA_VIGENCIA_LGPD_ATUAL,
  CONTATO_CONTROLADOR_LGPD,
} from '@/services/termoConsentimentoService'

export default function TermosUsoPage() {
  useSeo({
    title: 'Termos de Uso e Condições Gerais — Orbis Protocol',
    description:
      'Termos de uso, condições gerais da plataforma probatória dMRV, diretrizes da Opção B de confidencialidade de fatores e responsabilidade técnica.',
  })

  return (
    <div className="min-h-screen py-12 md:py-20 bg-slate-50 dark:bg-[#0A0E12] text-slate-800 dark:text-[#F4F7FA]">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#93A3B5] hover:text-emerald-600 dark:hover:text-[#12B886] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Início</span>
          </Link>

          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-200 dark:bg-[#16202B] text-slate-600 dark:text-[#93A3B5]">
            Versão {VERSAO_DOCUMENTO_LGPD_ATUAL}
          </span>
        </div>

        <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.12)] shadow-xl space-y-8">
          {/* Cabeçalho */}
          <div className="border-b border-slate-200 dark:border-[rgba(244,247,250,0.1)] pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#16202B] border border-emerald-500/30 text-emerald-700 dark:text-[#12B886] text-xs font-bold tracking-wider uppercase mb-3">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-[#12B886]" />
              CONDICIONANTES CONTRATUAIS • PROVA DOCUMENTAL dMRV
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 dark:text-[#F4F7FA]">
              TERMOS DE USO E CONDIÇÕES GERAIS DA PLATAFORMA
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#93A3B5] mt-2">
              Vigência: {DATA_VIGENCIA_LGPD_ATUAL} • Versão documental:{' '}
              <strong className="text-slate-800 dark:text-slate-200">{VERSAO_DOCUMENTO_LGPD_ATUAL}</strong> •
              Operadora Técnica: {CONTATO_CONTROLADOR_LGPD.razaoSocial} (CNPJ {CONTATO_CONTROLADOR_LGPD.cnpj})
            </p>
          </div>

          {/* Destaque Institucional: Rótulos e Opção B */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border-l-4 border-emerald-500 text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-[#12B886] font-bold uppercase tracking-wider text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Natureza Probatória e Limites dos Atestados Orbis</span>
            </div>
            <p>
              Estes Termos regulam o acesso e a utilização dos serviços e recursos oferecidos pelo{' '}
              <strong className="text-slate-900 dark:text-[#F4F7FA]">ORBIS PROTOCOL</strong>. Os documentos gerados pela
              plataforma denominam-se formalmente <strong className="text-slate-900 dark:text-[#F4F7FA]">Atestados Orbis</strong>{' '}
              ou Laudos Técnicos Periciais. A plataforma não emite nem comercializa títulos de carbono voláteis (S3U)
              sem lastro, tampouco utiliza rótulos proibidos como &quot;Certificação Oficial&quot; ou &quot;Selo Governamental&quot;.
              Toda prova baseia-se na imutabilidade de notas fiscais eletrônicas e no rigor pericial normativo.
            </p>
          </div>

          {/* 1. Objeto */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F4F7FA] flex items-center gap-2">
              <span className="text-emerald-600 dark:text-[#12B886]">1.</span> Objeto e Escopo de Serviços
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              O Orbis Protocol disponibiliza infraestrutura de tecnologia para:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] space-y-1.5 pl-2">
              <li>Ingestão, leitura estruturada e verificação de integridade criptográfica de XMLs de NF-e/NFS-e/CT-e;</li>
              <li>Cálculo automatizado de emissões de CO₂e evitadas segundo metodologia dMRV e Norma Técnica DM-ORB-001;</li>
              <li>Emissão de Passaportes Digitais e Atestados Orbis com hash SHA-256 e QR Code pericial;</li>
              <li>Plataforma de cooperação no âmbito do piloto com a Associação Comercial do Paraná (ACP);</li>
              <li>Módulos de conformidade regulatória (MTR, SINIR, PNRS, SBCE e Lei 15.042/2024 quando aplicáveis).</li>
            </ul>
          </section>

          {/* 2. Aceite e Cadastro */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F4F7FA] flex items-center gap-2">
              <span className="text-emerald-600 dark:text-[#12B886]">2.</span> Aceite Eletrônico Obrigatório e Cadastro
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              O acesso aos módulos operacionais depende da criação de conta com preenchimento verídico dos dados da
              empresa e do seu preposto. A manifestação de concordância é efetuada mediante checkbox obrigatório no ato
              do cadastro. Para fins de auditoria e segurança jurídica, o sistema registra em base imutável a versão
              documental aceita, carimbo de data/hora UTC e IP de conexão.
            </p>
          </section>

          {/* 3. Blindagem de Fatores (Opção B) */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F4F7FA] flex items-center gap-2">
              <span className="text-emerald-600 dark:text-[#12B886]">3.</span> Sigilo Metodológico e Propriedade Intelectual (Opção B)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              Os algoritmos de conversão, matrizes de cálculo e parametrizações técnicas do Orbis Protocol constituem
              segredo de negócio e propriedade intelectual exclusiva da MGM Consultoria Empresarial Ltda. A plataforma adota
              estritamente a <strong className="text-slate-900 dark:text-[#F4F7FA]">Opção B de Confidencialidade</strong>:{' '}
              valores numéricos de fatores de emissão não são exportados abertamente em massa e estão vinculados
              exclusivamente à conferência documental do Passaporte ou Verificador oficial. É vedada qualquer tentativa de
              engenharia reversa, raspagem automatizada (scraping) ou reprodução não autorizada.
            </p>
          </section>

          {/* 4. Responsabilidade das Partes */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F4F7FA] flex items-center gap-2">
              <span className="text-emerald-600 dark:text-[#12B886]">4.</span> Responsabilidade sobre Documentos Inseridos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] space-y-1.5">
                <span className="text-xs font-bold text-emerald-700 dark:text-[#12B886] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Responsabilidade da Empresa Usuária
                </span>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
                  A veracidade, autenticidade e validade fiscal das notas, chaves e manifestos inseridos é de
                  responsabilidade exclusiva da organização emissora. Tentativas de duplicidade intencional ou envio
                  de notas canceladas ensejam anulação do Atestado e notificação aos órgãos periciais.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] space-y-1.5">
                <span className="text-xs font-bold text-amber-700 dark:text-[#D9B36C] flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  Responsabilidade do Orbis Protocol
                </span>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
                  A infraestrutura garante a fidelidade do processamento numérico, a imutabilidade do hash criptográfico
                  e a disponibilidade do verificador público de conformidade pericial pelo prazo de retenção probatória contratado.
                </p>
              </div>
            </div>
          </section>

          {/* 5. Suspensão e Cancelamento */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F4F7FA] flex items-center gap-2">
              <span className="text-emerald-600 dark:text-[#12B886]">5.</span> Suspensão e Encerramento de Acesso
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              O Orbis Protocol reserva-se o direito de suspender cautelarmente o acesso de contas que apresentem:
              (i) violação flagrante da LGPD ou destes Termos; (ii) tentativa de burla a regras de controle de acesso ou
              taxas de cobrança; (iii) inserção deliberada de dados falsificados em desacordo com as diretrizes da ACP e
              da perícia independente.
            </p>
          </section>

          {/* 6. Foro e Disposições Finais */}
          <section className="space-y-4 border-t border-slate-200 dark:border-[rgba(244,247,250,0.1)] pt-6">
            <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F4F7FA] flex items-center gap-2">
              <span className="text-emerald-600 dark:text-[#12B886]">6.</span> Legislação Aplicável e Foro de Eleição
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial a Lei Federal nº 13.709/2018
              (LGPD), a Lei Federal nº 12.965/2014 (Marco Civil da Internet) e o Código Civil Brasileiro. Fica eleito o Foro
              Central da Comarca de Curitiba, Estado do Paraná, com expressa renúncia a qualquer outro, por mais privilegiado
              que seja, para dirimir quaisquer controvérsias decorrentes destes Termos.
            </p>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] text-xs text-slate-600 dark:text-[#93A3B5] space-y-1">
              <span className="font-bold text-slate-900 dark:text-[#F4F7FA] block">Dúvidas sobre estes Termos?</span>
              <p>
                Entre em contato com nossa equipe institucional pelo e-mail{' '}
                <a
                  href={`mailto:${CONTATO_CONTROLADOR_LGPD.emailContato}`}
                  className="text-emerald-600 dark:text-[#12B886] underline font-semibold"
                >
                  {CONTATO_CONTROLADOR_LGPD.emailContato}
                </a>
                .
              </p>
            </div>
          </section>

          {/* Rodapé interno */}
          <div className="pt-6 border-t border-slate-200 dark:border-[rgba(244,247,250,0.1)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-[#93A3B5]">
            <p>Documento auditável. Alterações são registradas em histórico formal de governança.</p>
            <div className="flex items-center gap-3">
              <Link
                to="/politica-privacidade"
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#16202B] border border-slate-200 dark:border-[rgba(244,247,250,0.15)] text-slate-700 dark:text-[#93A3B5] hover:text-emerald-600 dark:hover:text-[#12B886] transition-colors"
              >
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
