import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  DollarSign,
  Share2,
  Copy,
  CheckCircle2,
  Clock,
  CreditCard,
  Building,
  Save,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Sparkles,
  FileText,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  obterMeuPerfilParceiro,
  atualizarParceiro,
  listarComissoes,
  ParceiroRecord,
  ComissaoRecord,
} from '@/services/parceirosService'
import pb from '@/lib/pocketbase/client'

export default function AreaParceiroPage() {
  const { user, isAuthenticated } = useAuth()
  const [parceiro, setParceiro] = useState<ParceiroRecord | null>(null)
  const [comissoes, setComissoes] = useState<ComissaoRecord[]>([])
  const [vendasIndicadas, setVendasIndicadas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState(false)
  const [salvandoBanco, setSalvandoBanco] = useState(false)
  const [sucessoMsg, setSucessoMsg] = useState('')

  // Formulário de dados bancários e fiscal
  const [banco, setBanco] = useState('')
  const [agencia, setAgencia] = useState('')
  const [conta, setConta] = useState('')
  const [chavePix, setChavePix] = useState('')
  const [tipoDocFiscal, setTipoDocFiscal] = useState<'RPA' | 'NFSe_pj'>('RPA')
  const [docFiscalUrl, setDocFiscalUrl] = useState('')

  const carregarDados = async () => {
    setLoading(true)
    try {
      // 1. Tentar obter perfil de parceiro vinculado ao usuário
      let p = await obterMeuPerfilParceiro()

      // Se o usuário for admin e não tiver registro direto, pegar o primeiro parceiro institucional
      if (!p && user?.role === 'admin') {
        const todos = await pb.collection('parceiros').getFullList<ParceiroRecord>({ limit: 1 })
        if (todos.length > 0) {
          p = todos[0]
        }
      }

      if (p) {
        setParceiro(p)
        setBanco(p.banco || '')
        setAgencia(p.agencia || '')
        setConta(p.conta || '')
        setChavePix(p.chave_pix || '')
        setTipoDocFiscal(p.tipo_documentacao || 'RPA')
        setDocFiscalUrl(p.documento_fiscal_url || '')

        // Carregar comissões deste parceiro
        const coms = await listarComissoes(p.id)
        setComissoes(coms)

        // Carregar vendas indicadas (cobrancas com parceiro_id ou codigo_indicacao)
        try {
          const cobs = await pb.collection('cobrancas').getFullList({
            filter: `parceiro_id = "${p.id}" || codigo_indicacao = "${p.codigo_parceiro}"`,
            sort: '-created',
          })
          setVendasIndicadas(cobs)
        } catch {
          /* intentionally ignored */
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados do parceiro:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      carregarDados()
    }
  }, [isAuthenticated])

  const linkIndicacao = parceiro
    ? `${window.location.origin}/checkout?ref=${parceiro.codigo_parceiro}`
    : ''

  const handleCopiarLink = () => {
    if (!linkIndicacao) return
    navigator.clipboard.writeText(linkIndicacao)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  const handleSalvarDadosBancarios = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parceiro) return
    setSalvandoBanco(true)
    try {
      const atualizado = await atualizarParceiro(parceiro.id, {
        banco,
        agencia,
        conta,
        chave_pix: chavePix,
        tipo_documentacao: tipoDocFiscal,
        documento_fiscal_url: docFiscalUrl,
      })
      setParceiro(atualizado)
      setSucessoMsg('Dados bancários e documentação fiscal atualizados com sucesso!')
      setTimeout(() => setSucessoMsg(''), 4000)
    } catch (err: any) {
      alert('Erro ao salvar dados bancários: ' + err.message)
    } finally {
      setSalvandoBanco(false)
    }
  }

  // Cálculos financeiros
  const totalCalculada = comissoes
    .filter((c) => c.status === 'calculada')
    .reduce((acc, cur) => acc + (Number(cur.valor) || 0), 0)

  const totalPaga = comissoes
    .filter((c) => c.status === 'paga')
    .reduce((acc, cur) => acc + (Number(cur.valor) || 0), 0)

  const totalVendasVolume = vendasIndicadas
    .filter((v) => v.status === 'pago')
    .reduce((acc, cur) => acc + (Number(cur.valor) || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen py-20 bg-[#0A0E12] text-[#F4F7FA] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#12B886] border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-xs text-[#93A3B5]">Carregando Painel do Parceiro...</span>
        </div>
      </div>
    )
  }

  if (!parceiro) {
    return (
      <div className="min-h-screen py-20 bg-[#0A0E12] text-[#F4F7FA]">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D9B36C]/10 border border-[#D9B36C]/30 text-[#D9B36C] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-black text-2xl text-[#F4F7FA]">
            Acesso Restrito ao Programa de Afiliados & Parceiros
          </h1>
          <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
            Sua conta atual ({user?.email}) ainda não possui um código de parceiro homologado
            (ORB-PAR-XXXX) vinculado. Entre em contato com a equipe de novos negócios da Orbis
            Protocol para credenciamento institucional.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Link
              to="/painel"
              className="px-5 py-2.5 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA]"
            >
              Voltar ao Painel do Cliente
            </Link>
            <Link
              to="/planos"
              className="px-5 py-2.5 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs shadow-emerald-glow"
            >
              Conhecer Nossas Soluções
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-10 bg-[#0A0E12] text-[#F4F7FA]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
        {/* Header do Parceiro */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[rgba(244,247,250,0.1)]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30 text-[10px] font-mono uppercase font-bold tracking-wider">
                PROGRAMA DE PARCEIROS & AFILIADOS ORBIS
              </span>
              <span className="text-[11px] font-mono text-[#D9B36C] bg-[#D9B36C]/10 px-2 py-0.5 rounded">
                {parceiro.codigo_parceiro}
              </span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA] tracking-wide">
              {parceiro.nome}
            </h1>
            <p className="text-xs text-[#93A3B5] mt-1">
              CNPJ/CPF: <strong className="font-mono text-[#F4F7FA]">{parceiro.cpf_cnpj}</strong> •
              Comissão contratada:{' '}
              <strong className="text-[#12B886]">
                {parceiro.percentual_comissao}% por venda liquidada
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/painel"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.15)] text-xs text-[#93A3B5] hover:text-[#F4F7FA]"
            >
              <span>Painel Geral</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Mensagem de Feedback */}
        {sucessoMsg && (
          <div className="p-4 rounded-xl bg-[#12B886]/10 border border-[#12B886] text-xs text-[#12B886] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
        )}

        {/* Link de Indicação & Destaque */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#111820] to-[#16202B] border border-[#12B886]/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#12B886]" />
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA]">
                Seu Link Exclusivo de Indicação
              </span>
            </div>
            <span className="text-[10px] text-[#D9B36C] font-mono">
              Comissões nascem somente de cobranças pagas
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={linkIndicacao}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#12B886] font-mono select-all focus:outline-none"
            />
            <button
              onClick={handleCopiarLink}
              className="px-5 py-2.5 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs flex items-center justify-center gap-2 shadow-emerald-glow shrink-0 transition-transform active:scale-95"
            >
              {copiado ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? 'Link Copiado!' : 'Copiar Link'}</span>
            </button>
          </div>
          <p className="text-[11px] text-[#93A3B5]">
            Compartilhe este link com seus clientes. Todas as contratações em{' '}
            <strong>/checkout?ref={parceiro.codigo_parceiro}</strong> vincularão automaticamente{' '}
            {parceiro.percentual_comissao}% de comissão após o pagamento via PIX.
          </p>
        </div>

        {/* 4 Cards de Métricas do Parceiro */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-1">
            <span className="text-xs text-[#93A3B5] uppercase block">Saldo a Receber</span>
            <div className="font-heading font-black text-2xl text-[#D9B36C]">
              R$ {totalCalculada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-[#93A3B5] block">Comissões calculadas pendentes</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-1">
            <span className="text-xs text-[#93A3B5] uppercase block">Total Repassado</span>
            <div className="font-heading font-black text-2xl text-[#12B886]">
              R$ {totalPaga.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-[#93A3B5] block">
              Liquidações efetuadas com sucesso
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-1">
            <span className="text-xs text-[#93A3B5] uppercase block">
              Volume de Vendas Indicadas
            </span>
            <div className="font-heading font-black text-2xl text-[#F4F7FA]">
              R$ {totalVendasVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-[#93A3B5] block">
              {vendasIndicadas.filter((v) => v.status === 'pago').length} contratos faturados
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-1">
            <span className="text-xs text-[#93A3B5] uppercase block">Comissão Contratada</span>
            <div className="font-heading font-black text-2xl text-[#3B82F6]">
              {parceiro.percentual_comissao}%
            </div>
            <span className="text-[10px] text-[#93A3B5] block">
              Percentual congelado na criação
            </span>
          </div>
        </div>

        {/* Grid: 2 Colunas (Vendas Indicadas / Comissões e Edição de Dados Bancários) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna 1 & 2: Vendas Indicadas & Histórico de Comissões */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vendas Indicadas */}
            <div className="space-y-3">
              <h2 className="font-heading font-bold text-base text-[#F4F7FA]">
                Vendas Indicadas ({vendasIndicadas.length})
              </h2>

              <div className="rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0D1217] text-[#93A3B5] uppercase text-[10px] border-b border-[rgba(244,247,250,0.08)]">
                    <tr>
                      <th className="p-3.5">Cliente Tomador</th>
                      <th className="p-3.5">Serviço</th>
                      <th className="p-3.5">Valor</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(244,247,250,0.05)]">
                    {vendasIndicadas.map((v) => (
                      <tr key={v.id} className="hover:bg-[#16202B]/50 transition-colors">
                        <td className="p-3.5">
                          <strong className="text-[#F4F7FA] block">{v.tomador_nome}</strong>
                          <span className="font-mono text-[10px] text-[#93A3B5]">
                            {v.tomador_cpf_cnpj}
                          </span>
                        </td>
                        <td className="p-3.5 text-[#D9B36C]">{v.servico_nome}</td>
                        <td className="p-3.5 font-bold font-heading text-[#12B886]">
                          R$ {Number(v.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              v.status === 'pago'
                                ? 'bg-[#12B886]/20 text-[#12B886]'
                                : 'bg-[#D9B36C]/20 text-[#D9B36C]'
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right text-[10px] text-[#93A3B5]">
                          {new Date(v.created).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                    {vendasIndicadas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-xs text-[#93A3B5]">
                          Nenhuma venda indicada registrada ainda com seu código.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Histórico de Comissões e Repasses */}
            <div className="space-y-3">
              <h2 className="font-heading font-bold text-base text-[#12B886]">
                Histórico de Comissões ({comissoes.length})
              </h2>

              <div className="space-y-2">
                {comissoes.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F4F7FA]">Comissão de Venda</span>
                        <span className="text-[10px] text-[#93A3B5] font-mono">
                          ID: {c.cobranca_id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            c.status === 'paga'
                              ? 'bg-[#12B886]/20 text-[#12B886]'
                              : 'bg-[#D9B36C]/20 text-[#D9B36C]'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#93A3B5] mt-1">
                        Base de cálculo: R$ {Number(c.base_calculo).toLocaleString('pt-BR')} •
                        Percentual aplicado: {c.percentual_aplicado}%
                      </div>
                      {c.comprovante && (
                        <div className="text-[10px] text-[#12B886] mt-0.5">
                          Comprovante: {c.comprovante}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="font-heading font-black text-base text-[#12B886]">
                        R$ {Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-[#93A3B5]">
                        {c.data_pagamento
                          ? `Pago em ${new Date(c.data_pagamento).toLocaleDateString('pt-BR')}`
                          : 'Aguardando liquidação'}
                      </span>
                    </div>
                  </div>
                ))}
                {comissoes.length === 0 && (
                  <div className="p-6 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.08)] text-center text-xs text-[#93A3B5]">
                    Nenhuma comissão apurada ainda. Assim que uma cobrança com seu link for
                    liquidada, o valor aparecerá aqui.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coluna 3: Edição dos Próprios Dados Bancários */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-4">
              <div className="flex items-center gap-2 border-b border-[rgba(244,247,250,0.08)] pb-3">
                <CreditCard className="w-4 h-4 text-[#D9B36C]" />
                <h3 className="font-heading font-bold text-sm text-[#F4F7FA]">
                  Dados Bancários & Documentação Fiscal
                </h3>
              </div>

              <p className="text-[11px] text-[#93A3B5]">
                Mantenha sua chave PIX e documentação fiscal (RPA ou NFS-e) atualizados para
                liberação pontual dos repasses de honorários.
              </p>

              {/* Status de Validação Fiscal do Parceiro */}
              <div
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  parceiro.documento_fiscal_validado
                    ? 'bg-[#12B886]/10 border-[#12B886]/40 text-[#12B886]'
                    : 'bg-[#EF4444]/10 border-[#EF4444]/40 text-[#EF4444]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider">
                  <FileText className="w-4 h-4" />
                  <span>
                    Status Fiscal:{' '}
                    {parceiro.documento_fiscal_validado
                      ? 'Homologado pela Controladoria'
                      : 'Pendente de Documentação'}
                  </span>
                </div>
                {!parceiro.documento_fiscal_validado && (
                  <p className="text-[11px] text-[#93A3B5] leading-relaxed">
                    Repasse bloqueado: anexe RPA (PF) ou NFS-e (PJ) para liberar o pagamento da sua
                    comissão.
                  </p>
                )}
              </div>

              <form onSubmit={handleSalvarDadosBancarios} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#93A3B5] mb-1">Instituição Bancária</label>
                  <input
                    type="text"
                    placeholder="Ex: 001 - Banco do Brasil"
                    value={banco}
                    onChange={(e) => setBanco(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#93A3B5] mb-1">Agência</label>
                    <input
                      type="text"
                      placeholder="Ex: 1234-5"
                      value={agencia}
                      onChange={(e) => setAgencia(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#93A3B5] mb-1">Conta Corrente</label>
                    <input
                      type="text"
                      placeholder="Ex: 98765-4"
                      value={conta}
                      onChange={(e) => setConta(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#93A3B5] mb-1">Chave PIX Preferencial *</label>
                  <input
                    type="text"
                    required
                    placeholder="CNPJ, CPF, E-mail ou Telefone"
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#12B886] font-mono font-bold"
                  />
                </div>

                <div className="pt-2 border-t border-[rgba(244,247,250,0.06)] space-y-2">
                  <span className="font-bold text-[#D9B36C] uppercase text-[10px] block">
                    Comprovação Fiscal (Exigência CFO):
                  </span>
                  <div>
                    <label className="block text-[#93A3B5] mb-1">Tipo de Documento Fiscal *</label>
                    <select
                      value={tipoDocFiscal}
                      onChange={(e) => setTipoDocFiscal(e.target.value as 'RPA' | 'NFSe_pj')}
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA]"
                    >
                      <option value="RPA">
                        RPA — Recibo de Pagamento a Autônomo (Pessoa Física)
                      </option>
                      <option value="NFSe_pj">
                        NFS-e — Nota Fiscal de Serviços (Pessoa Jurídica)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#93A3B5] mb-1">
                      Link / URL do RPA ou NFS-e Anexada
                    </label>
                    <input
                      type="text"
                      placeholder="https://.../meu-rpa-assinado.pdf ou chave de acesso"
                      value={docFiscalUrl}
                      onChange={(e) => setDocFiscalUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] font-mono text-[11px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={salvandoBanco}
                  className="w-full py-2.5 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs flex items-center justify-center gap-1.5 shadow-emerald-glow mt-4"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{salvandoBanco ? 'Salvando...' : 'Salvar Dados Bancários & Fiscal'}</span>
                </button>
              </form>

              <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-[10px] text-[#93A3B5] leading-relaxed">
                🔒 <strong>Privacidade Garantida:</strong> Seus dados bancários são criptografados e
                acessíveis exclusivamente pela tesouraria da Orbis Protocol para liquidação de
                honorários.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
