/**
 * Hook onRecordCreate para a coleção users.
 * Atribui cliente_codigo automaticamente caso não esteja preenchido:
 * - Se role === 'cliente_acp' -> prefixo ORB-ACP-XXXX
 * - Se role === 'cliente' (ou outro) -> prefixo ORB-CLI-XXXX
 * - Preserva estritamente contas existentes (onRecordCreate só roda em novos registros).
 */

onRecordCreate((e) => {
  try {
    const existingCode = e.record.getString('cliente_codigo')
    const role = e.record.getString('role')
    const randSuffix = Math.floor(1000 + Math.random() * 9000)

    if (!existingCode || existingCode.trim() === '') {
      if (role === 'parceiro') {
        e.record.set('cliente_codigo', 'ORB-PAR-' + randSuffix)
      } else if (role === 'cliente_acp') {
        e.record.set('cliente_codigo', 'ORB-ACP-' + randSuffix)
      } else {
        e.record.set('cliente_codigo', 'ORB-CLI-' + randSuffix)
      }
    }

    // Se o novo usuário for parceiro, inicializa parceiro_acesso_status como 'pendente' caso não informado
    if (role === 'parceiro') {
      const acessoStatus = e.record.getString('parceiro_acesso_status')
      if (!acessoStatus || acessoStatus.trim() === '') {
        e.record.set('parceiro_acesso_status', 'pendente')
      }
    }
  } catch (err) {
    console.log('Erro ao atribuir cliente_codigo no hook user_codigo_gerador:', err)
  }

  e.next()
}, 'users')

// Após a criação do usuário com sucesso, se for parceiro vincula automaticamente à coleção parceiros
onRecordAfterCreateSuccess((e) => {
  try {
    const rec = e.record
    if (rec.getString('role') === 'parceiro') {
      const parceirosCol = $app.findCollectionByNameOrId('parceiros')
      const userCode =
        rec.getString('cliente_codigo') || 'ORB-PAR-' + Math.floor(1000 + Math.random() * 9000)
      const userName = rec.getString('name') || rec.getString('email')
      const userEmail = rec.getString('email')
      const userCnpj = rec.getString('cnpj') || 'Pendente de preenchimento'

      // Verifica se já existe parceiro vinculado a esse usuário
      let jaExiste = false
      try {
        const existente = $app.findFirstRecordByData('parceiros', 'usuario', rec.id)
        if (existente) jaExiste = true
      } catch (_) {}

      if (!jaExiste) {
        const novoParceiro = new Record(parceirosCol)
        novoParceiro.set('codigo_parceiro', userCode)
        novoParceiro.set('nome', userName)
        novoParceiro.set('cpf_cnpj', userCnpj)
        novoParceiro.set('contato', userEmail)

        let comissaoInicial = 10
        try {
          const bRecs = $app.findRecordsByFilter('business_settings', 'id != ""', '-created', 1, 0)
          if (bRecs && bRecs.length > 0) {
            const pVal = bRecs[0].getFloat('comissao_parceiro_percent')
            if (typeof pVal === 'number' && pVal > 0) comissaoInicial = pVal
          }
        } catch (_) {}

        novoParceiro.set('percentual_comissao', comissaoInicial)
        novoParceiro.set('banco', '')
        novoParceiro.set('agencia', '')
        novoParceiro.set('conta', '')
        novoParceiro.set('chave_pix', userEmail)
        novoParceiro.set('status', 'inativo') // Aguarda homologação/liberação
        novoParceiro.set('usuario', rec.id)
        novoParceiro.set('tipo_documentacao', 'RPA')
        novoParceiro.set('documento_fiscal_url', '')
        novoParceiro.set('documento_fiscal_validado', false)
        $app.save(novoParceiro)
      }
    }
  } catch (err) {
    console.log('Erro ao vincular automaticamente novo parceiro:', err)
  }
}, 'users')
