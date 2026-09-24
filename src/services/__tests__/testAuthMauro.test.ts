import { describe, it, expect } from 'vitest'

describe('Teste de Autenticação maurog1@hotmail.com', () => {
  it('testa endpoint oficial auth-with-password para maurog1', async () => {
    const url =
      process.env.VITE_POCKETBASE_URL ||
      'https://publicacao-da-plataforma-8c772.shrd00.internal.goskip.dev'

    const res = await fetch(`${url}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: 'maurog1@hotmail.com',
        password: 'OrbisProtocol2026',
      }),
    })

    console.log('STATUS:', res.status)
    const data = await res.json()
    console.log('AUTH RESPONSE STATUS:', res.status)

    expect(res.status).toBe(200)
    expect(data.token).toBeDefined()
    expect(data.record.email).toBe('maurog1@hotmail.com')
    expect(data.record.role).toBe('master')
    expect(data.record.verified).toBe(true)
  })
})
