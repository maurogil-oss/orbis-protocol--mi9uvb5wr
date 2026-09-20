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
    if (!existingCode || existingCode.trim() === '') {
      const role = e.record.getString('role')
      const randSuffix = Math.floor(1000 + Math.random() * 9000)
      if (role === 'cliente_acp') {
        e.record.set('cliente_codigo', 'ORB-ACP-' + randSuffix)
      } else {
        e.record.set('cliente_codigo', 'ORB-CLI-' + randSuffix)
      }
    }
  } catch (err) {
    console.log('Erro ao atribuir cliente_codigo no hook user_codigo_gerador:', err)
  }

  e.next()
}, 'users')
