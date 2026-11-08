import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Lock,
  FileText,
  Info,
  Building2,
  Mail,
} from 'lucide-react'
import { useSeo } from '@/hooks/useSeo'
import {
  VERSAO_DOCUMENTO_LGPD_ATUAL,
  DATA_VIGENCIA_LGPD_ATUAL,
  CONTATO_CONTROLADOR_LGPD,
} from '@/services/termoConsentimentoService'

export default function Privacidade() {
  useSeo({
    title: 'Política de Privacidade e Proteção de Dados LGPD — Orbis Protocol',
    description:
      'Política de privacidade, proteção de dados pessoais (Lei 13.709/2018), bases legais, ciclo de retenção probatória dMRV e canal oficial do titular.',
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
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#12B886]" />
              LGPD • LEI Nº 13.709/2018 • CONFORMIDADE PERICIAL
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 dark:text-[#F4F7FA]">
              POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#93A3B5] mt-2">
              Vigência: {DATA_VIGENCIA_LGPD_ATUAL} • Versão documental:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {VERSAO_DOCUMENTO_LGPD_ATUAL}
              </strong>{' '}
              • Operadora Técnica: {CONTATO_CONTROLADOR_LGPD.razaoSocial} (CNPJ{' '}
              {CONTATO_CONTROLADOR_LGPD.cnpj})
            </p>
          </div>

          {/* Destaque Institucional: Prova Documental */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border-l-4 border-emerald-500 text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-[#12B886] font-bold uppercase tracking-wider text-xs">
              <Info className="w-4 h-4" />
              <span>Finalidade Probatória e Limites Institucionais</span>
            </div>
            <p>
              O <strong className="text-slate-900 dark:text-[#F4F7FA]">Orbis Protocol</strong> é uma
              plataforma de infraestrutura tecnológica para cálculo, auditoria probatória e prova
              documental digital (dMRV) voltada à economia circular e descarbonização de cadeias de
              suprimentos. Tratamos dados estritamente para finalidades legítimas de prova
              documental, auditoria de notas fiscais, verificação pericial e emissão de Atestados de
              Conformidade Orbis (com ART/RRT). Não comercializamos nem cedemos bases de dados a
              terceiros.
            </p>
          </div>

          {/* Seção 1 */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F4F7FA] flex items-center gap-2">
              <span className="text-emerald-600 dark:text-[#12B886]">1.</span> Identificação do
              Controlador e Operador
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              A plataforma{' '}
              <strong className="text-slate-900 dark:text-[#F4F7FA]">ORBIS PROTOCOL</strong> é
              operada tecnicamente por{' '}
              <strong className="text-slate-900 dark:text-[#F4F7FA]">
                {CONTATO_CONTROLADOR_LGPD.razaoSocial}
              </strong>
              , inscrita no CNPJ sob o nº{' '}
              <strong className="text-amber-700 dark:text-[#D9B36C]">
                {CONTATO_CONTROLADOR_LGPD.cnpj}
              </strong>
              , atuando na qualidade de controladora dos dados cadastrais e operadora dos dados
              fiscais e periciais inseridos pelos representantes legais das empresas e peritos
              credenciados.
            </p>
          </section>

          {/* Seção 2 */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F4F7FA] flex items-center gap-2">
              <span className="text-emerald-600 dark:text-[#12B886]">2.</span> Dados Tratados e
              Categorias de Titulares
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              Tratamos categorias mínimas e necessárias de dados pessoais e corporativos:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] space-y-2 pl-2">
              <li>
                <strong className="text-slate-800 dark:text-[#F4F7FA]">
                  Dados Cadastrais da Conta:
                </strong>{' '}
                Nome do representante legal ou operador autorizado, e-mail corporativo, telefone de
                contato, papel no sistema (cliente, cliente_acp, perito, parceiro) e credencial de
                acesso cifrada em padrão bcrypt.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-[#F4F7FA]">Dados Empresariais:</strong>{' '}
                CNPJ, Razão Social, Nome Fantasia, CNAE principal/secundário, regime tributário
                informado e endereço fiscal.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-[#F4F7FA]">
                  Dados Fiscais e Operacionais (dMRV):
                </strong>{' '}
                XMLs de notas fiscais eletrônicas (NF-e/NFS-e/CT-e), chaves de acesso de 44 dígitos,
                itens de insumo/sucata, quantidades em massa (kg/t), manifestos MTR/SINIR e fatores
                de emissão referenciados.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-[#F4F7FA]">
                  Dados do Perito Credenciado:
                </strong>{' '}
                Nome completo, CPF (para emissão e validação pericial), registro em órgão de classe
                profissional (CREA, CRC, OAB, etc.), número de ART/RRT e declarações técnicas
                vinculadas.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-[#F4F7FA]">
                  Registros de Conexão e Consentimento:
                </strong>{' '}
                Endereço IP mascarado (retenção estrita de dois octetos), data/hora UTC e versão dos
                termos aceitos.
              </li>
            </ul>
          </section>

          {/* Seção 3 */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F4F7FA] flex items-center gap-2">
              <span className="text-emerald-600 dark:text-[#12B886]">3.</span> Finalidade e Bases
              Legais do Tratamento
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              O tratamento de dados pessoais no ecossistema Orbis Protocol apoia-se nas seguintes
              bases legais do Art. 7º da LGPD:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)]">
                <span className="text-xs font-bold text-emerald-700 dark:text-[#12B886] block mb-1">
                  Consentimento do Titular (Art. 7º, I)
                </span>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
                  Manifestação livre, informada e inequívoca mediante checkbox obrigatório no
                  momento do cadastro, com registro auditável de versão e carimbo de data/hora.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)]">
                <span className="text-xs font-bold text-emerald-700 dark:text-[#12B886] block mb-1">
                  Execução de Contrato (Art. 7º, V)
                </span>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
                  Prestação dos serviços contratados de cálculo de pegada de carbono, diagnósticos,
                  gestão de trial, cobrança e acesso à infraestrutura do piloto ACP.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)]">
                <span className="text-xs font-bold text-amber-700 dark:text-[#D9B36C] block mb-1">
                  Cumprimento de Obrigação Legal (Art. 7º, II)
                </span>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
                  Guarda de logs de conexão nos termos do Marco Civil da Internet (Lei 12.965/2014)
                  e guarda probatória de documentação fiscal e pericial pelo prazo de 5 anos (Art.
                  173 do CTN).
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)]">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 block mb-1">
                  Exercício Regular de Direitos (Art. 7º, VI)
                </span>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
                  Constituição de prova documental imutável via hash SHA-256 e trilha pericial em
                  processos judiciais, arbitrais ou administrativos.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 4 */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F4F7FA] flex items-center gap-2">
              <span className="text-emerald-600 dark:text-[#12B886]">4.</span> Compartilhamento e
              Sigilo dos Dados
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              O Orbis Protocol adota controle rígido de acesso baseado em papéis (RBAC). Os dados
              fiscais e cadastrais são restritos à organização usuária titular e aos peritos
              credenciados formalmente designados. No piloto ACP, relatórios agregados e indicadores
              operam sob regra estrita anti-dedução (mínimo de 3 empresas ativas), sem
              identificadores individuais ou quebra de sigilo empresarial.
            </p>
          </section>

          {/* Seção 5 */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F4F7FA] flex items-center gap-2">
              <span className="text-emerald-600 dark:text-[#12B886]">5.</span> Direitos do Titular
              de Dados
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              Em cumprimento ao Art. 18 da LGPD, o titular poderá a qualquer momento requisitar:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] space-y-1.5 pl-2">
              <li>Confirmação da existência de tratamento e acesso aos dados cadastrados;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>
                Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em
                desconformidade;
              </li>
              <li>Portabilidade dos dados a outro fornecedor de serviços quando aplicável;</li>
              <li>
                Revogação do consentimento concedido, respeitados os prazos legais de guarda
                probatória fiscal.
              </li>
            </ul>
          </section>

          {/* Seção 6: Retenção */}
          <section className="space-y-4 border-t border-slate-200 dark:border-[rgba(244,247,250,0.1)] pt-6">
            <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F4F7FA] flex items-center gap-2">
              <span className="text-emerald-600 dark:text-[#12B886]">6.</span> Política de Retenção
              e Descarte Probatório
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              Prazos de retenção formalmente aplicados na infraestrutura:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] space-y-1">
                <span className="font-bold text-emerald-700 dark:text-[#12B886] block">
                  Documentos Fiscais & Emissões dMRV: 60 Meses (5 Anos)
                </span>
                <p className="text-slate-600 dark:text-[#93A3B5]">
                  Obrigação legal e probatória (Art. 173 do Código Tributário Nacional, NBC TO 3000
                  do CFC e Art. 7º, II da LGPD).
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] space-y-1">
                <span className="font-bold text-amber-700 dark:text-[#D9B36C] block">
                  Atestados Orbis e Passaportes Digitais: 60 Meses
                </span>
                <p className="text-slate-600 dark:text-[#93A3B5]">
                  Rastreabilidade pública para comprovação perante cadeias de valor, compradores,
                  bancos e auditorias externas.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] space-y-1">
                <span className="font-bold text-emerald-700 dark:text-[#12B886] block">
                  Protocolos do Titular (Art. 18): 60 Meses
                </span>
                <p className="text-slate-600 dark:text-[#93A3B5]">
                  Evidência de atendimento tempestivo perante a Autoridade Nacional de Proteção de
                  Dados (ANPD).
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] space-y-1">
                <span className="font-bold text-slate-700 dark:text-[#93A3B5] block">
                  Logs de Conexão e Acesso: 12 Meses
                </span>
                <p className="text-slate-600 dark:text-[#93A3B5]">
                  Art. 15 da Lei 12.965/2014 (Marco Civil da Internet), com descarte cíclico
                  automatizado.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 7: Contato do Controlador e DPO */}
          <section className="space-y-4 border-t border-slate-200 dark:border-[rgba(244,247,250,0.1)] pt-6">
            <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F4F7FA] flex items-center gap-2">
              <span className="text-emerald-600 dark:text-[#12B886]">7.</span> Contato do
              Controlador e Canal do Encarregado (DPO)
            </h2>
            <div className="p-5 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border border-emerald-500/30 text-xs sm:text-sm space-y-3 text-slate-600 dark:text-[#93A3B5]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-[#D9B36C] block">
                    Controladora dos Dados
                  </span>
                  <strong className="text-slate-900 dark:text-[#F4F7FA] text-base">
                    {CONTATO_CONTROLADOR_LGPD.razaoSocial}
                  </strong>
                </div>
                <div className="text-xs font-mono text-amber-700 dark:text-[#D9B36C]">
                  CNPJ: {CONTATO_CONTROLADOR_LGPD.cnpj}
                </div>
              </div>

              {/* Nota honesta sobre DPO sem dados inventados */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-[#16202B] border border-amber-300 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Designação Formal de DPO / Encarregado:
                </span>
                <p>
                  O atendimento aos titulares e às autoridades é conduzido interinamente pelo Comitê
                  Institucional de Privacidade da Operadora. A designação nominal definitiva de DPO
                  pessoa física perante a ANPD encontra-se catalogada como pendência de governança e
                  será atualizada nesta página quando chancelada.
                </p>
              </div>

              <div className="space-y-2">
                <p>
                  <strong className="text-slate-900 dark:text-[#F4F7FA]">
                    Canal Direto do Titular (Art. 18):
                  </strong>{' '}
                  Utilize nosso formulário oficial com prazo legal de resposta de{' '}
                  {CONTATO_CONTROLADOR_LGPD.prazoRespostaDias} dias úteis:
                </p>
                <div className="pt-1 flex flex-wrap gap-3">
                  <Link
                    to="/titular-dados"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 dark:bg-[#12B886] text-white dark:text-[#0A0E12] hover:bg-emerald-700 dark:hover:bg-[#0CA678] transition-all"
                  >
                    <span>Acessar Canal do Titular (Art. 18 da LGPD)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <a
                    href={`mailto:${CONTATO_CONTROLADOR_LGPD.emailContato}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-[#16202B] text-slate-800 dark:text-[#F4F7FA] hover:bg-slate-300 dark:hover:bg-[#1F2C3A] transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{CONTATO_CONTROLADOR_LGPD.emailContato}</span>
                  </a>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-[#93A3B5]/90 pt-2 border-t border-slate-200 dark:border-[rgba(244,247,250,0.05)]">
                Canal suplementar do Encarregado:{' '}
                <a
                  href={`mailto:${CONTATO_CONTROLADOR_LGPD.canalDpo}`}
                  className="text-emerald-600 dark:text-[#12B886] underline font-semibold"
                >
                  {CONTATO_CONTROLADOR_LGPD.canalDpo}
                </a>{' '}
                • Sede operacional: Curitiba / PR • Atendimento em dias úteis das 09h às 18h.
              </p>
            </div>
          </section>

          {/* Rodapé interno com link cruzado */}
          <div className="pt-6 border-t border-slate-200 dark:border-[rgba(244,247,250,0.1)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-[#93A3B5]">
            <p>
              Documento auditável. Alterações são registradas em histórico formal de governança.
            </p>
            <div className="flex items-center gap-3">
              <Link
                to="/termos"
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#16202B] border border-slate-200 dark:border-[rgba(244,247,250,0.15)] text-slate-700 dark:text-[#93A3B5] hover:text-emerald-600 dark:hover:text-[#12B886] transition-colors font-medium"
              >
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
