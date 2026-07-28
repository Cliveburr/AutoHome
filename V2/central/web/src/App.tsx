import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, Route, Routes, useParams } from 'react-router-dom';
import {
  getOperationalCommand,
  getOperationalModuleDetail,
  type Command,
  type ModuleDetail,
} from './api/client';
import { AuthProvider, useAuth } from './auth';
import {
  commandStatus,
  deriveOperationControls,
  getRoomModules,
  groupOperationRooms,
  loadOperationInventory,
  operationCommandKey,
  operationInventoryKey,
  operationModuleKey,
  sendOperationCommand,
  type OperationControl,
} from './operation';
import { OperationalRealtime } from './realtime';
import { AdminOrganizationPage } from './AdminOrganizationPage';

function LoadingPage() {
  return (
    <p className="page-status" role="status">
      Carregando…
    </p>
  );
}

function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">AUTOHOME CENTRAL</p>
        <h1 id="auth-title">{title}</h1>
        <p>{description}</p>
        {children}
      </section>
    </main>
  );
}

function PublicOnly() {
  const { isLoading, session } = useAuth();
  if (isLoading) return <LoadingPage />;
  if (session?.user.passwordChangeRequired) return <Navigate to="/change-password" replace />;
  if (session) return <Navigate to="/" replace />;
  return <Outlet />;
}

function RequireAuthenticated() {
  const { isLoading, session } = useAuth();
  if (isLoading) return <LoadingPage />;
  if (!session) return <Navigate to="/login" replace />;
  if (session.user.passwordChangeRequired) return <Navigate to="/change-password" replace />;
  return <Outlet />;
}

function RequireAdministrator() {
  const { isLoading, session } = useAuth();
  if (isLoading) return <LoadingPage />;
  if (!session) return <Navigate to="/login" replace />;
  if (session.user.passwordChangeRequired) return <Navigate to="/change-password" replace />;
  if (session.user.role !== 'administrador') return <Navigate to="/" replace />;
  return <Outlet />;
}

function RequirePasswordChange() {
  const { isLoading, session } = useAuth();
  if (isLoading) return <LoadingPage />;
  if (!session) return <Navigate to="/login" replace />;
  if (!session.user.passwordChangeRequired) return <Navigate to="/" replace />;
  return <Outlet />;
}

function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorReference = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) errorReference.current?.focus();
  }, [error]);

  async function onSubmit(formData: FormData) {
    const username = String(formData.get('username') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    if (!username || !password) {
      setError('Informe seu usuário e sua senha.');
      return;
    }

    setError(undefined);
    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : 'Não foi possível entrar.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="Entrar" description="Use as credenciais da sua Central para continuar.">
      <form action={onSubmit} className="auth-form" noValidate>
        <label htmlFor="username">
          Usuário
          <input id="username" name="username" autoComplete="username" required />
        </label>
        <label htmlFor="password">
          Senha
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        {error ? (
          <p ref={errorReference} role="alert" tabIndex={-1}>
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthCard>
  );
}

function ChangePasswordPage() {
  const { changePassword, logout } = useAuth();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorReference = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) errorReference.current?.focus();
  }, [error]);

  async function onSubmit(formData: FormData) {
    const currentPassword = String(formData.get('currentPassword') ?? '');
    const newPassword = String(formData.get('newPassword') ?? '');
    if (!currentPassword || !newPassword) {
      setError('Informe a senha atual e a nova senha.');
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Não foi possível alterar a senha.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Troca obrigatória de senha"
      description="Defina uma nova senha antes de acessar a Central."
    >
      <form action={onSubmit} className="auth-form" noValidate>
        <label htmlFor="currentPassword">
          Senha atual
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <label htmlFor="newPassword">
          Nova senha
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </label>
        {error ? (
          <p ref={errorReference} role="alert" tabIndex={-1}>
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
      <button className="secondary-button" type="button" onClick={() => void logout()}>
        Sair
      </button>
    </AuthCard>
  );
}

function useOperationalRealtime() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const realtime = new OperationalRealtime(queryClient);
    realtime.start();
    return () => realtime.stop();
  }, [queryClient]);
}

function AuthenticatedShell() {
  const { logout, session } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  useOperationalRealtime();

  async function onLogout() {
    setIsLoggingOut(true);
    await logout();
  }

  return (
    <main className="operation-shell">
      <header className="operation-header">
        <div>
          <p className="eyebrow">AUTOHOME CENTRAL</p>
          <h1>Olá, {session?.user.username}</h1>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => void onLogout()}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Saindo…' : 'Sair'}
        </button>
      </header>
      <nav className="operation-navigation" aria-label="Operação">
        <NavLink to="/" end>
          Cômodos
        </NavLink>
      </nav>
      {session?.user.role === 'administrador' ? (
        <nav className="administration-navigation" aria-label="Administração">
          <NavLink to="/admin/organization">Áreas e cômodos</NavLink>
        </nav>
      ) : null}
      <section className="operation-content">
        <Outlet />
      </section>
    </main>
  );
}

function RoomsPage() {
  const inventory = useQuery({ queryKey: operationInventoryKey, queryFn: loadOperationInventory });
  if (inventory.isLoading) return <LoadingPage />;
  if (inventory.isError)
    return (
      <p className="page-status" role="alert">
        Não foi possível carregar os cômodos.
      </p>
    );
  if (!inventory.data)
    return (
      <p className="page-status" role="alert">
        Não foi possível carregar os cômodos.
      </p>
    );

  const groups = groupOperationRooms(inventory.data);
  if (!groups.length) {
    return (
      <section className="empty-state">
        <h2>Cômodos</h2>
        <p>Nenhum cômodo está disponível para operação.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="rooms-title">
      <h2 id="rooms-title">Cômodos</h2>
      {groups.map((group) => (
        <section className="room-group" key={group.id} aria-labelledby={`group-${group.id}`}>
          <h3 id={`group-${group.id}`}>{group.name}</h3>
          <div className="room-grid">
            {group.rooms.map(({ room, modules, capabilitySummary, unavailableModules }) => (
              <Link className="room-card" key={room.id} to={`/rooms/${room.id}`}>
                <h4>{room.name}</h4>
                <p>{capabilitySummary}</p>
                <small>
                  {modules.length
                    ? `${modules.length} módulo${modules.length === 1 ? '' : 's'}`
                    : 'Sem módulos vinculados'}
                </small>
                {unavailableModules ? (
                  <span className="status indisponivel">{unavailableModules} indisponível</span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}

function RoomPage() {
  const { roomId } = useParams();
  const inventory = useQuery({ queryKey: operationInventoryKey, queryFn: loadOperationInventory });
  const room = inventory.data?.rooms.find((candidate) => candidate.id === roomId);
  const modules = inventory.data && roomId ? getRoomModules(inventory.data, roomId) : [];
  const details = useQueries({
    queries: modules.map((module) => ({
      queryKey: operationModuleKey(module.protocolId),
      queryFn: () => getOperationalModuleDetail(module.protocolId),
    })),
  });

  if (inventory.isLoading) return <LoadingPage />;
  if (inventory.isError)
    return (
      <p className="page-status" role="alert">
        Não foi possível carregar o cômodo.
      </p>
    );
  if (!room)
    return (
      <p className="page-status" role="alert">
        Cômodo não encontrado.
      </p>
    );

  return (
    <section aria-labelledby="room-title">
      <Link className="back-link" to="/">
        Voltar para cômodos
      </Link>
      <h2 id="room-title">{room.name}</h2>
      {!modules.length ? (
        <p className="empty-state">Não há módulos vinculados a este cômodo.</p>
      ) : null}
      {details.some((detail) => detail.isLoading) ? <LoadingPage /> : null}
      {details.map((detail, index) =>
        detail.data ? (
          <ModuleControls key={detail.data.protocolId} module={detail.data} moduleIndex={index} />
        ) : null,
      )}
    </section>
  );
}

function ModuleControls({ module, moduleIndex }: { module: ModuleDetail; moduleIndex: number }) {
  const queryClient = useQueryClient();
  const controls = deriveOperationControls(module, moduleIndex);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [commandIds, setCommandIds] = useState<Record<string, string>>({});
  const [failures, setFailures] = useState<Record<string, 'falhou' | 'indisponivel'>>({});
  const tracked = Object.entries(commandIds);
  const commands = useQueries({
    queries: tracked.map(([, commandId]) => ({
      queryKey: operationCommandKey(commandId),
      queryFn: () => getOperationalCommand(commandId),
      staleTime: Infinity,
    })),
  });
  const statusByControl = useMemo(() => {
    const statuses = new Map<string, ReturnType<typeof commandStatus>>();
    tracked.forEach(([controlId], index) => {
      const command = commands[index]?.data as Command | undefined;
      if (command) statuses.set(controlId, commandStatus(command));
    });
    return statuses;
  }, [commands, tracked]);

  async function activate(control: OperationControl) {
    setPending((current) => ({ ...current, [control.id]: true }));
    setFailures((current) => {
      const next = { ...current };
      delete next[control.id];
      return next;
    });
    try {
      const command = await sendOperationCommand(module, control);
      queryClient.setQueryData(operationCommandKey(command.commandId), command);
      setCommandIds((current) => ({ ...current, [control.id]: command.commandId }));
    } catch (error) {
      const unavailable = error instanceof Error && /indisponível|unavailable/i.test(error.message);
      setFailures((current) => ({
        ...current,
        [control.id]: unavailable ? 'indisponivel' : 'falhou',
      }));
    } finally {
      setPending((current) => ({ ...current, [control.id]: false }));
    }
  }

  const moduleName = module.name ?? `Módulo ${moduleIndex + 1}`;
  return (
    <section className="module-controls" aria-label={moduleName}>
      <h3>{moduleName}</h3>
      {module.availability !== 'online' ? (
        <p className="status indisponivel">Módulo indisponível</p>
      ) : null}
      {!controls.length && module.availability === 'online' ? (
        <p>Não há controles disponíveis.</p>
      ) : null}
      <div className="control-grid">
        {controls.map((control) => {
          const status = pending[control.id]
            ? 'pendente'
            : (statusByControl.get(control.id) ?? failures[control.id]);
          return (
            <div className="control-card" key={control.id}>
              <button
                className="operation-control"
                type="button"
                onClick={() => void activate(control)}
                disabled={Boolean(pending[control.id])}
              >
                <span>{control.label}</span>
                {control.kind === 'boolean' ? (
                  <strong>{control.active ? 'Ligado' : 'Desligado'}</strong>
                ) : null}
              </button>
              {status ? <p className={`status ${status}`}>Comando {status}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<RequirePasswordChange />}>
          <Route path="/change-password" element={<ChangePasswordPage />} />
        </Route>
        <Route element={<RequireAuthenticated />}>
          <Route path="/" element={<AuthenticatedShell />}>
            <Route index element={<RoomsPage />} />
            <Route path="rooms/:roomId" element={<RoomPage />} />
            <Route element={<RequireAdministrator />}>
              <Route path="admin/organization" element={<AdminOrganizationPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
