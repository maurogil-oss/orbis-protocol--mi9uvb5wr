import React, { useState } from 'react'
import {
  School,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Send,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  cadastrarEscola,
  cadastrarEscolasEmLote,
  CadastrarEscolaInput,
  EscolaRecord,
  PerfilModalidadeEscola,
  RedeEscolar,
} from '@/services/escolasService'

export default function CadastroEscolasPage() {
  const navigate = useNavigate()

  // Modo: 'individual' | 'lote'
  const [modoCadastro, setModoCadastro] = useState<'individual' | 'lote'>('individual')

  // Form Individual
  const [formData, setFormData] = useState<CadastrarEscolaInput>({
    nome: '',
    cnpj_inep: '',
    municipio: '',
    uf: 'BA',
    rede: 'municipal',
    perfil_modalidade: 'publica_patrocinada',
    alunos_educacao_infantil: 0,
    alunos_fundamental_1: 0,
    alunos_fundamental_2: 0,
    alunos_ensino_medio: 0,
    graus_turmas_atendidas: '',
    responsavel_pedagogico_nome: '',
    responsavel_pedagogico_email: '',
    responsavel_pedagogico_telefone: '',
    secretaria_ou_patrocinador: '',
    faixa_preco_comercial: 'Faixa até 500 alunos [Placeholder piloto municipal]',
    status_adesao: 'inscrita',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sucessoMsg, setSucessoMsg] = useState('')
  const [erroMsg, setErroMsg] = useState('')

  // Form Lote
  const [secretariaLote, setSecretariaLote] = useState('')
  const [textoLoteCSV, setTextoLoteCSV] = useState(
    `Nome da Escola;CNPJ/INEP;Município;UF;Rede;Total Alunos;Responsável;Email
Escola Municipal Jorge Amado;29.111.222/0001-10;Salvador;BA;municipal;420;Profª Helena;helena@salvador.ba.gov.br
Escola Municipal Maria Quitéria;29.333.444/0001-20;Feira de Santana;BA;municipal;580;Prof. Roberto;roberto@feiradesantana.ba.gov.br
Colégio Estadual Rui Barbosa;15.555.666/0001-30;Curitiba;PR;estadual;810;Profª Luciana;luciana@seed.pr.gov.br`,
  )
  const [loteResultado, setLoteResultado] = useState<{ criadas: number; erros: number } | null>(
    null,
  )

  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome || !formData.cnpj_inep || !formData.municipio) {
      setErroMsg('Preencha os campos obrigatórios (Nome da escola, CNPJ/INEP e Município).')
      return
    }

    setIsSubmitting(true)
    setErroMsg('')
    setSucessoMsg('')

    try {
      const reg = await cadastrarEscola(formData)
      setSucessoMsg(`Escola "${reg.nome}" cadastrada com sucesso na plataforma!`)
      setTimeout(() => {
        navigate('/escolas/painel')
      }, 1500)
    } catch (err) {
      setErroMsg('Erro ao cadastrar escola. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!secretariaLote.trim()) {
      setErroMsg('Informe o nome da Secretaria de Educação ou Órgão Responsável.')
      return
    }

    setIsSubmitting(true)
    setErroMsg('')

    try {
      // Parser básico CSV
      const linhas = textoLoteCSV.trim().split('\n')
      const registrosParaCriar: Array<CadastrarEscolaInput> = []

      // Pula header se houver
      for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i].trim()
        if (!linha) continue
        const colunas = linha.split(';').map((c) => c.trim())
        if (colunas.length < 3) continue

        const [nome, inep, munic, uf, redeStr, alunosStr, respNome, respEmail] = colunas
        const total = Number(alunosStr) || 200
        const f1 = Math.round(total * 0.5)
        const f2 = Math.round(total * 0.5)

        const redeParsed: RedeEscolar =
          redeStr &&
          (redeStr.toLowerCase() === 'estadual' || redeStr.toLowerCase() === 'particular')
            ? (redeStr.toLowerCase() as RedeEscolar)
            : 'municipal'

        registrosParaCriar.push({
          nome: nome || `Escola Municipal ${i}`,
          cnpj_inep: inep || `INEP_${i}`,
          municipio: munic || 'Salvador',
          uf: uf || 'BA',
          rede: redeParsed,
          perfil_modalidade:
            redeParsed === 'particular' ? 'particular_compradora' : 'publica_patrocinada',
          alunos_educacao_infantil: 0,
          alunos_fundamental_1: f1,
          alunos_fundamental_2: f2,
          alunos_ensino_medio: 0,
          total_alunos: total,
          graus_turmas_atendidas: 'Ensino Fundamental',
          responsavel_pedagogico_nome: respNome || 'Coordenação Pedagógica',
          responsavel_pedagogico_email: respEmail || 'contato@escola.gov.br',
          secretaria_ou_patrocinador: secretariaLote,
          status_adesao: 'inscrita',
        })
      }

      const res = await cadastrarEscolasEmLote(registrosParaCriar, secretariaLote)
      setLoteResultado({ criadas: res.criadas, erros: res.erros })
      setSucessoMsg(`Lote processado com sucesso: ${res.criadas} escolas cadastradas!`)
      setTimeout(() => {
        navigate('/escolas/painel')
      }, 2000)
    } catch (err) {
      setErroMsg('Erro ao processar arquivo em lote.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen py-10 md:py-16 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F4F7FA] w-full max-w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-600 dark:text-[#12B886] uppercase tracking-wider">
            <School className="w-4 h-4" />
            <span>ORBIS EDUCAÇÃO • ENTIDADE ESCOLAR</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-[#F4F7FA]">
            Cadastro de Unidades Escolares
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] mt-1">
            Cadastre instituições de ensino públicas (patrocinadas) ou particulares (compradoras
            diretas) para participação no programa Orbis Educação.
          </p>
        </div>

        {/* Tab Toggle: Individual vs Lote */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-[rgba(244,247,250,0.1)] pb-3">
          <button
            type="button"
            onClick={() => setModoCadastro('individual')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              modoCadastro === 'individual'
                ? 'bg-emerald-600 text-white shadow-emerald-glow'
                : 'bg-white dark:bg-[#0E1A2E] text-slate-600 dark:text-[#93A3B5] border border-slate-200 dark:border-[rgba(244,247,250,0.08)]'
            }`}
          >
            Cadastro Individual de Escola
          </button>
          <button
            type="button"
            onClick={() => setModoCadastro('lote')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              modoCadastro === 'lote'
                ? 'bg-emerald-600 text-white shadow-emerald-glow'
                : 'bg-white dark:bg-[#0E1A2E] text-slate-600 dark:text-[#93A3B5] border border-slate-200 dark:border-[rgba(244,247,250,0.08)]'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Inscrição em Lote (Secretarias de Educação)</span>
          </button>
        </div>

        {/* Mensagens de Sucesso / Erro */}
        {sucessoMsg && (
          <div className="p-4 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-[#12B886] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
        )}

        {erroMsg && (
          <div className="p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erroMsg}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* FORMULÁRIO INDIVIDUAL */}
        {/* ========================================================= */}
        {modoCadastro === 'individual' && (
          <form
            onSubmit={handleIndividualSubmit}
            className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-xl space-y-6 animate-fade-in"
          >
            {/* Perfil e Modalidade */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#93A3B5] mb-2">
                Modalidade de Participação *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() =>
                    setFormData({
                      ...formData,
                      perfil_modalidade: 'publica_patrocinada',
                      rede: formData.rede === 'particular' ? 'municipal' : formData.rede,
                    })
                  }
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    formData.perfil_modalidade === 'publica_patrocinada'
                      ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white font-medium'
                      : 'bg-slate-50 dark:bg-[#0A1220] border-slate-200 dark:border-[rgba(244,247,250,0.1)] text-slate-600 dark:text-[#93A3B5]'
                  }`}
                >
                  <span className="font-bold block mb-0.5">(a) Escola Pública Participante</span>
                  <span className="text-[11px] leading-tight block">
                    Inscrita via Secretaria de Educação ou Patrocinador B2B2C. Gratuito para a
                    escola.
                  </span>
                </label>

                <label
                  onClick={() =>
                    setFormData({
                      ...formData,
                      perfil_modalidade: 'particular_compradora',
                      rede: 'particular',
                    })
                  }
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    formData.perfil_modalidade === 'particular_compradora'
                      ? 'bg-blue-500/10 border-blue-500 text-slate-900 dark:text-white font-medium'
                      : 'bg-slate-50 dark:bg-[#0A1220] border-slate-200 dark:border-[rgba(244,247,250,0.1)] text-slate-600 dark:text-[#93A3B5]'
                  }`}
                >
                  <span className="font-bold block mb-0.5">
                    (b) Escola Particular Compradora Direta
                  </span>
                  <span className="text-[11px] leading-tight block">
                    Aquisição institucional com camada comercial por faixa de alunos.
                  </span>
                </label>
              </div>
            </div>

            {/* Identificação Geral */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F4F7FA] border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] pb-2">
                1. Identificação e Localização
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                    Nome Oficial da Escola *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex.: Escola Municipal Professor Paulo Freire"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                    CNPJ ou Código INEP *
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj_inep}
                    onChange={(e) => setFormData({ ...formData, cnpj_inep: e.target.value })}
                    placeholder="00.000.000/0000-00 ou 8 dígitos INEP"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                    Rede de Ensino *
                  </label>
                  <select
                    value={formData.rede}
                    onChange={(e) =>
                      setFormData({ ...formData, rede: e.target.value as RedeEscolar })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                  >
                    <option value="municipal">Rede Municipal de Ensino</option>
                    <option value="estadual">Rede Estadual de Ensino</option>
                    <option value="particular">Rede Particular / Privada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                    Município *
                  </label>
                  <input
                    type="text"
                    value={formData.municipio}
                    onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                    placeholder="Ex.: Salvador ou Curitiba"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                    UF *
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.uf}
                    onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                    placeholder="BA"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white uppercase"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Alunos por Etapa */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F4F7FA] border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] pb-2">
                2. Número de Alunos por Etapa de Ensino
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                    Educação Infantil
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.alunos_educacao_infantil}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alunos_educacao_infantil: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                    Fundamental I (1º-5º)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.alunos_fundamental_1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alunos_fundamental_1: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                    Fundamental II (6º-9º)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.alunos_fundamental_2}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alunos_fundamental_2: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                    Ensino Médio
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.alunos_ensino_medio}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alunos_ensino_medio: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#0A1220] text-xs flex justify-between items-center font-semibold">
                <span className="text-slate-600 dark:text-[#93A3B5]">
                  Total Estimado de Alunos:
                </span>
                <span className="text-emerald-700 dark:text-[#12B886] font-mono text-sm">
                  {Number(formData.alunos_educacao_infantil) +
                    Number(formData.alunos_fundamental_1) +
                    Number(formData.alunos_fundamental_2) +
                    Number(formData.alunos_ensino_medio)}{' '}
                  alunos
                </span>
              </div>
            </div>

            {/* Turmas e Responsável Pedagógico */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F4F7FA] border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] pb-2">
                3. Turmas Atendidas e Responsável Pedagógico
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                  Graus / Turmas Atendidas
                </label>
                <input
                  type="text"
                  value={formData.graus_turmas_atendidas}
                  onChange={(e) =>
                    setFormData({ ...formData, graus_turmas_atendidas: e.target.value })
                  }
                  placeholder="Ex.: 6º ao 9º Ano do Fundamental II (8 turmas matutinas e vespertinas)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                    Nome do Responsável Pedagógico *
                  </label>
                  <input
                    type="text"
                    value={formData.responsavel_pedagogico_nome}
                    onChange={(e) =>
                      setFormData({ ...formData, responsavel_pedagogico_nome: e.target.value })
                    }
                    placeholder="Diretor ou coordenador"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                    E-mail do Responsável *
                  </label>
                  <input
                    type="email"
                    value={formData.responsavel_pedagogico_email}
                    onChange={(e) =>
                      setFormData({ ...formData, responsavel_pedagogico_email: e.target.value })
                    }
                    placeholder="pedagogico@escola.com.br"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                    Telefone de Contato
                  </label>
                  <input
                    type="text"
                    value={formData.responsavel_pedagogico_telefone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        responsavel_pedagogico_telefone: e.target.value,
                      })
                    }
                    placeholder="(00) 0000-0000"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {formData.perfil_modalidade === 'publica_patrocinada' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                    Secretaria de Educação ou Patrocinador Mantenedor *
                  </label>
                  <input
                    type="text"
                    value={formData.secretaria_ou_patrocinador}
                    onChange={(e) =>
                      setFormData({ ...formData, secretaria_ou_patrocinador: e.target.value })
                    }
                    placeholder="Ex.: Secretaria Municipal de Educação (SMED) ou Empresa Patrocinadora B2B2C"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Escola pública participante: custo zero para a unidade e estudantes, financiada
                    via convênio ou cota de responsabilidade socioambiental.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                      Faixa de Alunos & Camada Comercial (Escola Particular) *
                    </label>
                    <select
                      value={formData.faixa_preco_comercial}
                      onChange={(e) =>
                        setFormData({ ...formData, faixa_preco_comercial: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                    >
                      <option value="Faixa até 300 alunos [Placeholder piloto municipal]">
                        Até 300 alunos — [Placeholder piloto municipal • Sob consulta]
                      </option>
                      <option value="Faixa 301 a 700 alunos [Placeholder piloto municipal]">
                        301 a 700 alunos — [Placeholder piloto municipal • Sob consulta]
                      </option>
                      <option value="Faixa 701 a 1500 alunos [Placeholder piloto municipal]">
                        701 a 1.500 alunos — [Placeholder piloto municipal • Sob consulta]
                      </option>
                      <option value="Faixa acima de 1500 alunos [Placeholder piloto municipal]">
                        Acima de 1.500 alunos (Rede Completa) — [Placeholder piloto municipal • Sob
                        consulta]
                      </option>
                    </select>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-[#D9B36C] text-xs">
                    <strong>Camada Comercial Particular (Honestidade Canônica):</strong> As faixas
                    de preço para escolas particulares ficam como <em>placeholders</em> para
                    fechamento oficial após a conclusão do piloto municipal. Nenhum valor de
                    faturamento antecipado é prometido.
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs uppercase tracking-wider transition-all shadow-emerald-glow flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Salvando Escola...' : 'Concluir Cadastro da Escola'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* INSCRIÇÃO EM LOTE */}
        {/* ========================================================= */}
        {modoCadastro === 'lote' && (
          <form
            onSubmit={handleLoteSubmit}
            className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-xl space-y-6 animate-fade-in"
          >
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-slate-700 dark:text-[#CBD5E1] space-y-1">
              <strong className="text-blue-700 dark:text-blue-300 block">
                Inscrição em Lote para Redes Municipais e Estaduais
              </strong>
              <p>
                Permite que secretarias de educação e patrocinadores cadastrem dezenas de escolas de
                uma só vez utilizando dados estruturados (CSV com separador ponto e vírgula
                &quot;;&quot;).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5] mb-1">
                Nome do Órgão / Secretaria de Educação Mantenedora *
              </label>
              <input
                type="text"
                value={secretariaLote}
                onChange={(e) => setSecretariaLote(e.target.value)}
                placeholder="Ex.: Secretaria Municipal de Educação de Salvador (SMED)"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#93A3B5]">
                  Dados das Escolas (Formato CSV) *
                </label>
                <span className="text-[11px] text-slate-500">Separador ponto e vírgula (;)</span>
              </div>
              <textarea
                rows={8}
                value={textoLoteCSV}
                onChange={(e) => setTextoLoteCSV(e.target.value)}
                className="w-full font-mono text-[11px] p-3 rounded-xl bg-slate-50 dark:bg-[#0A1220] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs uppercase tracking-wider transition-all shadow-emerald-glow flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isSubmitting ? 'Processando Lote...' : 'Cadastrar Escolas do Lote'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
