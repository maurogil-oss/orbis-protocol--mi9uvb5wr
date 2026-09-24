import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ModalAlterarSenha } from '../ModalAlterarSenha'
import pb from '@/lib/pocketbase/client'
import * as auditService from '@/services/auditService'

const mockUser = {
  id: 'usr-teste-123',
  email: 'usuario@exemplo.com',
  name: 'Usuário Teste',
  role: 'cliente',
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isMaster: false,
    isAdmin: false,
  }),
}))

vi.mock('@/lib/pocketbase/client', () => {
  const collectionMock = {
    update: vi.fn(),
  }
  return {
    default: {
      collection: vi.fn(() => collectionMock),
    },
  }
})

vi.mock('@/services/auditService', () => ({
  registrarEventoAudit: vi.fn().mockResolvedValue({ id: 'audit-123' }),
}))

describe('ModalAlterarSenha', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não renderiza se aberto === false', () => {
    const { container } = render(<ModalAlterarSenha aberto={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renderiza os campos corretamente quando aberto', () => {
    render(<ModalAlterarSenha aberto={true} onClose={() => {}} />)
    expect(screen.getByText('Alterar Minha Senha')).toBeDefined()
    expect(screen.getByPlaceholderText('Informe sua senha atual')).toBeDefined()
    expect(screen.getByPlaceholderText('Crie uma nova senha forte')).toBeDefined()
    expect(screen.getByPlaceholderText('Repita a nova senha')).toBeDefined()
    expect(screen.getByText('Mínimo 10 caracteres')).toBeDefined()
  })

  it('bloqueia envio e exibe erro se nova senha não obedecer à política de senha forte', async () => {
    render(<ModalAlterarSenha aberto={true} onClose={() => {}} />)

    fireEvent.change(screen.getByPlaceholderText('Informe sua senha atual'), {
      target: { value: 'SenhaAtual123' },
    })
    fireEvent.change(screen.getByPlaceholderText('Crie uma nova senha forte'), {
      target: { value: 'fraca' }, // < 10 caracteres
    })
    fireEvent.change(screen.getByPlaceholderText('Repita a nova senha'), {
      target: { value: 'fraca' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Atualizar Senha/i }))

    await waitFor(() => {
      expect(screen.getByText(/A senha deve ter pelo menos 10 caracteres/i)).toBeDefined()
    })

    // Garante que pb.collection('users').update NÃO foi chamado
    expect(pb.collection('users').update).not.toHaveBeenCalled()
  })

  it('bloqueia envio se confirmação for divergente', async () => {
    render(<ModalAlterarSenha aberto={true} onClose={() => {}} />)

    fireEvent.change(screen.getByPlaceholderText('Informe sua senha atual'), {
      target: { value: 'SenhaAtual123' },
    })
    fireEvent.change(screen.getByPlaceholderText('Crie uma nova senha forte'), {
      target: { value: 'NovaSenhaForte123' },
    })
    fireEvent.change(screen.getByPlaceholderText('Repita a nova senha'), {
      target: { value: 'OutraSenha456' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Atualizar Senha/i }))

    await waitFor(() => {
      expect(screen.getByText(/A confirmação da nova senha não confere/i)).toBeDefined()
    })
    expect(pb.collection('users').update).not.toHaveBeenCalled()
  })

  it('chama pb.collection("users").update e registra auditoria SEM logar senha ou hash no sucesso', async () => {
    const updateMock = vi.fn().mockResolvedValue({ id: mockUser.id })
    vi.mocked(pb.collection).mockReturnValue({ update: updateMock } as any)

    render(<ModalAlterarSenha aberto={true} onClose={() => {}} />)

    fireEvent.change(screen.getByPlaceholderText('Informe sua senha atual'), {
      target: { value: 'SenhaAntiga123' },
    })
    fireEvent.change(screen.getByPlaceholderText('Crie uma nova senha forte'), {
      target: { value: 'NovaSenhaSegura2025' },
    })
    fireEvent.change(screen.getByPlaceholderText('Repita a nova senha'), {
      target: { value: 'NovaSenhaSegura2025' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Atualizar Senha/i }))

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith(mockUser.id, {
        oldPassword: 'SenhaAntiga123',
        password: 'NovaSenhaSegura2025',
        passwordConfirm: 'NovaSenhaSegura2025',
      })
    })

    // Verifica auditoria
    await waitFor(() => {
      expect(auditService.registrarEventoAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'usuario_alterou_propria_senha',
          entidade: 'users',
          entidade_id: mockUser.id,
          detalhes: expect.not.objectContaining({
            oldPassword: expect.anything(),
            password: expect.anything(),
            passwordConfirm: expect.anything(),
            hash: expect.anything(),
          }),
        }),
      )
    })

    expect(screen.getByText(/Senha alterada com sucesso!/i)).toBeDefined()
  })
})
