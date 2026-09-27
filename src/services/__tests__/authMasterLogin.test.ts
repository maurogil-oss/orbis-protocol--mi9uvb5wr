import { describe, it, expect } from 'vitest'
import pb from '@/lib/pocketbase/client'

describe('Teste de Autenticação Real - Conta Master', () => {
  it('deve autenticar o usuário maurog1@hotmail.com com a nova senha @OrbisProtocol2026', async () => {
    // Autentica via fetch direto contra o backend real
    const pbUrl =
      (import.meta as any).env.VITE_POCKETBASE_URL ||
      'https://publicacao-da-plataforma-8c772.shrd00.internal.goskip.dev'
    const res = await fetch(`${pbUrl}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: 'maurog1@hotmail.com',
        password: '@OrbisProtocol2026',
      }),
    })

    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.token).toBeTruthy()
    expect(data.record).toBeDefined()
    expect(data.record.id).toBe('9tk0wdxyv3cornj')
    expect(data.record.email).toBe('maurog1@hotmail.com')
    expect(data.record.role).toBe('master')
    expect(data.record.verified).toBe(true)

    // Também valida via cliente SDK PocketBase
    const authData = await pb
      .collection('users')
      .authWithPassword('maurog1@hotmail.com', '@OrbisProtocol2026')
    expect(authData.token).toBeTruthy()
    expect(authData.record.id).toBe('9tk0wdxyv3cornj')
    expect(authData.record.role).toBe('master')

    pb.authStore.clear()
  })
})
