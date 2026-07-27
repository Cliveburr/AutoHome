import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  changeSessionPassword: vi.fn(),
  getSession: vi.fn(),
  loginSession: vi.fn(),
  logoutSession: vi.fn(),
  setUnauthenticatedHandler: vi.fn(),
}));

vi.mock('./api/client', () => api);

import { App } from './App';

const activeSession = {
  user: {
    active: true,
    id: 'user-1',
    passwordChangeRequired: false,
    role: 'administrador' as const,
    username: 'admin',
  },
};

const passwordChangeSession = {
  user: {
    ...activeSession.user,
    passwordChangeRequired: true,
  },
};

function renderApp(initialEntry = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getSession.mockRejectedValue(
    Object.assign(new Error('Autenticação obrigatória.'), { status: 401 }),
  );
});

describe('App', () => {
  it('blocks protected routes when the current session is expired', async () => {
    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByText('Central pronta')).not.toBeInTheDocument();
  });

  it('recovers a persisted session from /me', async () => {
    api.getSession.mockResolvedValue(activeSession);
    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Olá, admin' })).toBeInTheDocument();
  });

  it('sends a signed-in user to mandatory password change without showing the shell', async () => {
    api.getSession.mockResolvedValue(passwordChangeSession);
    renderApp('/');

    expect(
      await screen.findByRole('heading', { name: 'Troca obrigatória de senha' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Central pronta')).not.toBeInTheDocument();
  });

  it('revalidates /me and unlocks the shell after changing the required password', async () => {
    api.getSession
      .mockResolvedValueOnce(passwordChangeSession)
      .mockResolvedValueOnce(activeSession);
    api.changeSessionPassword.mockResolvedValue(activeSession);
    const user = userEvent.setup();
    renderApp('/');

    await screen.findByRole('heading', { name: 'Troca obrigatória de senha' });
    await user.type(screen.getByLabelText('Senha atual'), 'senha-antiga');
    await user.type(screen.getByLabelText('Nova senha'), 'senha-nova');
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }));

    expect(await screen.findByRole('heading', { name: 'Olá, admin' })).toBeInTheDocument();
    expect(api.changeSessionPassword).toHaveBeenCalledWith({
      currentPassword: 'senha-antiga',
      newPassword: 'senha-nova',
    });
    expect(api.getSession).toHaveBeenCalledTimes(2);
  });

  it('logs in through the session layer and leaves no credential in the UI state', async () => {
    api.loginSession.mockResolvedValue(activeSession);
    const user = userEvent.setup();
    renderApp('/login');

    await screen.findByRole('heading', { name: 'Entrar' });
    await user.type(screen.getByLabelText('Usuário'), 'admin');
    await user.type(screen.getByLabelText('Senha'), 'senha-secreta');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Olá, admin' })).toBeInTheDocument();
    expect(api.loginSession).toHaveBeenCalledWith({ username: 'admin', password: 'senha-secreta' });
  });

  it('clears the cached session on logout and redirects to login', async () => {
    api.getSession.mockResolvedValue(activeSession);
    api.logoutSession.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderApp('/');

    await screen.findByRole('heading', { name: 'Olá, admin' });
    await user.click(screen.getByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(api.logoutSession).toHaveBeenCalledTimes(1);
  });
});
