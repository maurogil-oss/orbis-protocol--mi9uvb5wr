/**
 * ROTA SEGURA PARA REGISTRAR ASSINATURA DIGITAL ICP-BRASIL EM LAUDOS EXPORTADOS
 * Atualiza o registro em relatorios_exportados e emite auditoria no audit_log
 */

routerAdd(
  'POST',
  '/backend/v1/laudos/assinar-icp-brasil',
  (e) => {
    try {
      const auth = e.auth
      if (!auth) {
        return e.json(401, { sucesso: false, erro: 'Autenticação necessária.' })
      }

      const body = e.requestInfo().body || {}
      const relatorioId = String(body.relatorio_id || '').trim()
      const hashSha256Assinado = String(body.hash_sha256 || '').trim()
      const titularNome = String(body.titular_nome || '').trim()
      const cnpjTitular = String(body.cnpj_titular || '').replace(/\D/g, '')
      const certificadoId = String(body.certificado_id || '').trim()
      const dataAssinaturaServidor = new Date().toISOString()
      const arquivoPdfBase64 = String(body.arquivo_pdf_base64 || '').trim()

      if (!relatorioId) {
        return e.badRequestError('ID do relatório exportado é obrigatório.')
      }
      if (!hashSha256Assinado) {
        return e.badRequestError('Hash SHA-256 do documento assinado é obrigatório.')
      }
      if (!cnpjTitular) {
        return e.badRequestError('CNPJ do titular do certificado é obrigatório.')
      }

      const relCol = $app.findCollectionByNameOrId('relatorios_exportados')
      const relRec = $app.findRecordById('relatorios_exportados', relatorioId)

      // Validação de permissão: usuário dono ou perfil administrativo
      const donoId = relRec.getString('usuario')
      const userRole = auth.getString('role')
      const isOwner = donoId === auth.id
      const isAdminOrMaster =
        userRole === 'admin' || userRole === 'master' || userRole === 'controller'

      if (!isOwner && !isAdminOrMaster) {
        return e.json(403, { sucesso: false, erro: 'Sem permissão para assinar este laudo.' })
      }

      // Se enviou o PDF assinado em base64, converte para arquivo
      if (
        arquivoPdfBase64 &&
        typeof $filesystem !== 'undefined' &&
        typeof $filesystem.fileFromBytes === 'function'
      ) {
        try {
          let cleanB64 = arquivoPdfBase64
          const commaIdx = cleanB64.indexOf(',')
          if (commaIdx !== -1) cleanB64 = cleanB64.substring(commaIdx + 1)
          cleanB64 = cleanB64.replace(/\s+/g, '')

          const b64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
          const b64WithoutPad = cleanB64.replace(/=/g, '')
          let paddedB64 = b64WithoutPad
          while (paddedB64.length % 4 !== 0) paddedB64 += 'A'

          const bytes = []
          let charIdx = 0
          while (charIdx < paddedB64.length) {
            const c1 = b64Chars.indexOf(paddedB64.charAt(charIdx++))
            const c2 = b64Chars.indexOf(paddedB64.charAt(charIdx++))
            const c3 = b64Chars.indexOf(paddedB64.charAt(charIdx++))
            const c4 = b64Chars.indexOf(paddedB64.charAt(charIdx++))
            if (c1 === -1 || c2 === -1 || c3 === -1 || c4 === -1) break
            const bits24 = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4
            bytes.push((bits24 >> 16) & 0xff)
            if (charIdx - 2 < b64WithoutPad.length) bytes.push((bits24 >> 8) & 0xff)
            if (charIdx - 1 < b64WithoutPad.length) bytes.push(bits24 & 0xff)
          }

          if (bytes.length > 0) {
            const nomeArquivoPdf = `laudo_assinado_${relRec.getString('codigo_verificacao') || relatorioId}.pdf`
            const pdfFile = $filesystem.fileFromBytes(bytes, nomeArquivoPdf)
            relRec.set('arquivo_assinado_pdf', pdfFile)
          }
        } catch (fileErr) {
          console.warn(
            '[assinar-icp-brasil] Erro ao converter PDF assinado:',
            fileErr ? fileErr.message : fileErr,
          )
        }
      }

      const assinaturaInfo = {
        padrao: 'ICP-Brasil e-CNPJ A1',
        tipo_assinatura: 'PAdES / CAdES Prova Criptográfica SHA-256',
        titular_nome: titularNome || relRec.getString('razao_social'),
        cnpj_titular: cnpjTitular,
        hash_sha256: hashSha256Assinado,
        timestamp_servidor: dataAssinaturaServidor,
        certificado_id: certificadoId,
        declaracao_conformidade:
          'Documento com assinatura digital baseada em certificado ICP-Brasil e-CNPJ A1 sob custódia do titular e prova criptográfica SHA-256',
      }

      relRec.set('assinado_icp_brasil', true)
      relRec.set('assinatura_digital_json', assinaturaInfo)
      // Atualiza o hash caso o documento assinado tenha novo digest
      relRec.set('hash_sha256', hashSha256Assinado)

      $app.save(relRec)

      // Trilha de auditoria no audit_log conforme especificação:
      // acao: "laudo_assinado_icp_brasil", entidade, entidade_id e detalhes {hash_sha256, cnpj_titular, timestamp}
      const clientIp =
        e.requestInfo().headers['x-forwarded-for'] ||
        e.requestInfo().headers['x-real-ip'] ||
        e.requestInfo().remoteIP ||
        '127.0.0.1'

      try {
        const auditCol = $app.findCollectionByNameOrId('audit_log')
        const log = new Record(auditCol)
        log.set('acao', 'laudo_assinado_icp_brasil')
        log.set('entidade', 'relatorios_exportados')
        log.set('entidade_id', relRec.id)
        log.set('ator_id', auth.id)
        log.set('ator_email', auth.getString('email'))
        log.set('papel', auth.getString('role'))
        log.set('ip', String(clientIp).split(',')[0].trim())
        log.set('detalhes', {
          hash_sha256: hashSha256Assinado,
          cnpj_titular: cnpjTitular,
          titular_nome: titularNome,
          timestamp: dataAssinaturaServidor,
          codigo_verificacao: relRec.getString('codigo_verificacao'),
          tipo_relatorio: relRec.getString('tipo_relatorio'),
        })
        $app.save(log)
      } catch (auditErr) {
        console.warn(
          '[assinar-icp-brasil] Falha ao gravar audit_log:',
          auditErr ? auditErr.message : auditErr,
        )
      }

      return e.json(200, {
        sucesso: true,
        mensagem:
          'Documento com assinatura digital baseada em certificado ICP-Brasil e-CNPJ A1 sob custódia do titular e prova criptográfica SHA-256 registrado com sucesso.',
        relatorio_id: relRec.id,
        hash_sha256: hashSha256Assinado,
        timestamp_servidor: dataAssinaturaServidor,
        titular_nome: titularNome,
        cnpj_titular: cnpjTitular,
        assinatura: assinaturaInfo,
      })
    } catch (err) {
      console.error('[assinar-icp-brasil] Erro:', err ? err.message : err)
      return e.json(500, {
        sucesso: false,
        erro: err && err.message ? err.message : 'Erro ao processar assinatura digital ICP-Brasil.',
      })
    }
  },
  $apis.requireAuth(),
)
