import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OperationInventory } from './operation';

const api = vi.hoisted(() => ({
  changeSessionPassword: vi.fn(),
  createAdministrativeArea: vi.fn(),
  createAdministrativeRoom: vi.fn(),
  createOperationalCommand: vi.fn(),
  adoptDiscoveredModule: vi.fn(),
  getOperationalCommand: vi.fn(),
  getOperationalModuleDetail: vi.fn(),
  getSession: vi.fn(),
  listAdministrativeAreas: vi.fn(),
  listAdministrativeRooms: vi.fn(),
  listOperationalAreas: vi.fn(),
  listOperationalModules: vi.fn(),
  listOperationalRooms: vi.fn(),
  listDiscoveredModules: vi.fn(),
  setModuleConfiguration: vi.fn(),
  updateModuleOrganization: vi.fn(),
  loginSession: vi.fn(),
  logoutSession: vi.fn(),
  setUnauthenticatedHandler: vi.fn(),
}));

vi.mock('./api/client', () => api);
vi.mock('./realtime', () => ({
  OperationalRealtime: class {
    start() {}
    stop() {}
  },
}));

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

const basicSession = {
  user: {
    ...activeSession.user,
    role: 'basico' as const,
    username: 'morador',
  },
};

const passwordChangeSession = {
  user: {
    ...activeSession.user,
    passwordChangeRequired: true,
  },
};

const inventory: OperationInventory = {
  areas: [{ id: 'area-1', name: 'Social', position: 0 }],
  rooms: [
    { id: 'room-1', name: 'Sala', areaId: 'area-1', position: 0 },
    { id: 'room-2', name: 'Entrada', position: 0 },
  ],
  modules: [
    {
      id: 'module-1',
      protocolId: 'light-1',
      family: 'gen1',
      capabilities: [
        { id: 'light', actions: [{ name: 'set', parameters: [{ key: 'on', type: 'boolean' }] }] },
      ],
      transport: 'simulated',
      status: 'cadastrado',
      availability: 'online',
      discoveredAt: '2026-07-28T00:00:00.000Z',
      lastSeenAt: '2026-07-28T00:00:00.000Z',
      lastObservedAt: '2026-07-28T00:00:00.000Z',
      name: 'Luz principal',
      roomId: 'room-1',
    },
  ],
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
  api.listOperationalAreas.mockResolvedValue(inventory.areas);
  api.listOperationalRooms.mockResolvedValue(inventory.rooms);
  api.listOperationalModules.mockResolvedValue(inventory.modules);
  api.listDiscoveredModules.mockResolvedValue([
    { ...inventory.modules[0], status: 'descoberto', roomId: undefined },
  ]);
  api.adoptDiscoveredModule.mockResolvedValue(inventory.modules[0]);
  api.getOperationalModuleDetail.mockResolvedValue({
    ...inventory.modules[0],
    configurations: [],
    localLinks: [],
    state: { values: { on: false }, observedAt: '2026-07-28T00:00:00.000Z' },
  });
  api.createOperationalCommand.mockResolvedValue({
    commandId: 'command-1',
    protocolId: 'light-1',
    capabilityId: 'light',
    action: 'set',
    parameters: { on: true },
    status: 'enviado',
    createdAt: '2026-07-28T00:00:00.000Z',
  });
  api.getOperationalCommand.mockResolvedValue({ status: 'pendente' });
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

describe('App operation', () => {
  it('groups rooms, keeps unassigned rooms, and hides administration from a basic user', async () => {
    api.getSession.mockResolvedValue(basicSession);
    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Olá, morador' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Social' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sem área' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sala/ })).toBeInTheDocument();
    expect(screen.queryByText('Administração')).not.toBeInTheDocument();
  });

  it('renders declared controls in a room and submits an idempotent command', async () => {
    api.getSession.mockResolvedValue(basicSession);
    const user = userEvent.setup();
    renderApp('/rooms/room-1');

    await user.click(await screen.findByRole('button', { name: /Luz/i }));

    expect(api.createOperationalCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        protocolId: 'light-1',
        capabilityId: 'light',
        action: 'set',
        parameters: { on: true },
      }),
      expect.any(String),
    );
  });

  it('shows a useful empty state when no room is available', async () => {
    api.getSession.mockResolvedValue(basicSession);
    api.listOperationalAreas.mockResolvedValue([]);
    api.listOperationalRooms.mockResolvedValue([]);
    api.listOperationalModules.mockResolvedValue([]);
    renderApp('/');

    expect(
      await screen.findByText('Nenhum cômodo está disponível para operação.'),
    ).toBeInTheDocument();
  });

  it('shows organization administration only to administrators', async () => {
    api.getSession.mockResolvedValue(activeSession);
    api.listAdministrativeAreas.mockResolvedValue(inventory.areas);
    api.listAdministrativeRooms.mockResolvedValue(inventory.rooms);
    renderApp('/admin/organization');

    expect(await screen.findByRole('heading', { name: 'Áreas e cômodos' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nome da área Social' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sala')).toBeInTheDocument();
  });

  it('redirects basic users away from organization administration', async () => {
    api.getSession.mockResolvedValue(basicSession);
    renderApp('/admin/organization');

    expect(await screen.findByRole('heading', { name: 'Olá, morador' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Áreas e cômodos' })).not.toBeInTheDocument();
  });

  it('filters discovered modules and adopts one from administration', async () => {
    api.getSession.mockResolvedValue(activeSession);
    const user = userEvent.setup();
    renderApp('/admin/discovery');

    expect(await screen.findByRole('heading', { name: 'Descoberta' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Identificador'), 'light-1');
    expect(await screen.findByText(/light-1/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Adotar' }));
    expect(api.adoptDiscoveredModule).toHaveBeenCalledWith('light-1', expect.anything());
  });
});
