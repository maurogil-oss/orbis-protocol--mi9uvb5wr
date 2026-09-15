import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react'

export default function Privacidade() {
  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <Link
            to="/diagnostico"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#93A3B5] hover:text-[#12B886] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Diagnóstico</span>
          </Link>
        </div>

        <div className="p-8 sm:p-12 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-2xl space-y-8">
          <div className="border-b border-[rgba(244,247,250,0.1)] pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-xs font-bold tracking-wider uppercase mb-3">
              <ShieldCheck className="w-4 h-4 text-[#12B886]" />
              LGPD • LEI Nº 13.709/2018
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA]">
              POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS
            </h1>
            <p className="text-xs sm:text-sm text-[#93A3B5] mt-2">
              Última atualização: Setembro de 2026 • Operadora: MGM CONSULTORIA EMPRESARIAL LTDA
              (CNPJ 19.598.964/0001-01)
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-[#F4F7FA] flex items-center gap-2">
              <span className="text-[#12B886]">1.</span> Identificação do Controlador e Operador
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
              A plataforma <strong className="text-[#F4F7FA]">ORBIS PROTOCOL</strong> é operada
              tecnicamente por{' '}
              <strong className="text-[#F4F7FA]">MGM CONSULTORIA EMPRESARIAL LTDA</strong>, inscrita
              no CNPJ sob o nº <strong className="text-[#D9B36C]">19.598.964/0001-01</strong>,
              atuando na qualidade de operadora e controladora dos dados cadastrais inseridos pelos
              representantes legais das empresas usuárias.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-[#F4F7FA] flex items-center gap-2">
              <span className="text-[#12B886]">2.</span> Dados Coletados no Diagnóstico
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
              Para a execução do diagnóstico preliminar de elegibilidade tributária e cálculo de
              emissões, coletamos:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#93A3B5] space-y-1.5 pl-2">
              <li>
                <strong className="text-[#F4F7FA]">Dados Empresariais:</strong> CNPJ, Razão Social,
                CNAE, endereço fiscal, regime tributário declarado e faturamento/porte.
              </li>
              <li>
                <strong className="text-[#F4F7FA]">Dados do Responsável/Titular:</strong> Nome
                completo, e-mail corporativo, telefone/WhatsApp de contato e registro em órgão de
                classe profissional (CRC, CREA, OAB, etc.).
              </li>
              <li>
                <strong className="text-[#F4F7FA]">Dados Operacionais e de Emissões:</strong> Perfil
                de consumo energético, existência de frota, inventário GHG Protocol preliminar,
                certificações (ex.: ISO 14001) e exportações sujeitas ao CBAM.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-[#F4F7FA] flex items-center gap-2">
              <span className="text-[#12B886]">3.</span> Finalidade e Base Legal do Tratamento
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
              A coleta e o tratamento dos dados pessoais e corporativos fundamentam-se nas seguintes
              bases da LGPD:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                <span className="text-xs font-bold text-[#12B886] block mb-1">
                  Consentimento do Titular (Art. 7º, I)
                </span>
                <p className="text-xs text-[#93A3B5]">
                  Manifestação livre e informada no formulário de diagnóstico para envio de laudos,
                  propostas e atendimento pericial.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                <span className="text-xs font-bold text-[#12B886] block mb-1">
                  Procedimentos Preliminares a Contrato (Art. 7º, V)
                </span>
                <p className="text-xs text-[#93A3B5]">
                  Qualificação do CNPJ para emissão de dossiês técnicos, perícias e adesão aos
                  planos do ecossistema.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-[#F4F7FA] flex items-center gap-2">
              <span className="text-[#12B886]">4.</span> Compartilhamento e Sigilo dos Dados
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
              O Orbis Protocol adota rígido controle de acesso baseado em papéis (RBAC). Os dados
              dos diagnósticos são restritos ao próprio usuário criador e aos peritos/auditores
              credenciados pela plataforma. Não realizamos venda, aluguel ou cessão comercial de
              bases de dados a terceiros.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-[#F4F7FA] flex items-center gap-2">
              <span className="text-[#12B886]">5.</span> Direitos do Titular de Dados
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
              Em cumprimento ao Art. 18 da LGPD, o titular poderá a qualquer momento requisitar:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#93A3B5] space-y-1 pl-2">
              <li>Confirmação da existência de tratamento e acesso aos dados cadastrados;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>
                Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em
                desconformidade;
              </li>
              <li>Revogação do consentimento concedido.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-[rgba(244,247,250,0.1)] pt-6">
            <h2 className="font-heading font-bold text-lg text-[#F4F7FA] flex items-center gap-2">
              <span className="text-[#12B886]">6.</span> Contato do Encarregado pelo Tratamento
              (DPO)
            </h2>
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 text-xs sm:text-sm space-y-1 text-[#93A3B5]">
              <p>
                <strong className="text-[#F4F7FA]">Encarregado (DPO):</strong> Comitê de Compliance
                e Governança de Dados
              </p>
              <p>
                <strong className="text-[#F4F7FA]">E-mail de Contato:</strong>{' '}
                dpo@mgmconsultoria.com.br
              </p>
              <p>
                <strong className="text-[#F4F7FA]">Entidade Mantenedora:</strong> MGM CONSULTORIA
                EMPRESARIAL LTDA (CNPJ 19.598.964/0001-01)
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
