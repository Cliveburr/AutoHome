import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';

function LoadingPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6" aria-live="polite">
      <p className="text-slate-600">Verificando sua sessão…</p>
    </main>
  );
}

function AuthCard({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <main className="grid min-h-screen place-items-center p-4 sm:p-8">
      <section
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        aria-labelledby="page-title"
      >
        <p className="mb-3 text-sm font-semibold tracking-wide text-brand-700">AUTOHOME CENTRAL</p>
        <h1 id="page-title" className="text-2xl font-bold text-brand-950">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6">{children}</div>
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
      <form action={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-slate-800" htmlFor="username">
            Usuário
          </label>
          <input
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2"
            id="username"
            name="username"
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-800" htmlFor="password">
            Senha
          </label>
          <input
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {error ? (
          <p ref={errorReference} className="text-sm text-red-700" role="alert" tabIndex={-1}>
            {error}
          </p>
        ) : null}
        <button
          className="w-full rounded-lg bg-brand-700 px-4 py-2.5 font-semibold text-white disabled:cursor-wait disabled:opacity-70"
          type="submit"
          disabled={isSubmitting}
        >
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
    if (currentPassword === newPassword) {
      setError('A nova senha deve ser diferente da atual.');
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
      <form action={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-slate-800" htmlFor="currentPassword">
            Senha atual
          </label>
          <input
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2"
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-800" htmlFor="newPassword">
            Nova senha
          </label>
          <input
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2"
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>
        {error ? (
          <p ref={errorReference} className="text-sm text-red-700" role="alert" tabIndex={-1}>
            {error}
          </p>
        ) : null}
        <button
          className="w-full rounded-lg bg-brand-700 px-4 py-2.5 font-semibold text-white disabled:cursor-wait disabled:opacity-70"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
      <button
        className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        type="button"
        onClick={() => void logout()}
      >
        Sair
      </button>
    </AuthCard>
  );
}

function AuthenticatedShell() {
  const { logout, session } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function onLogout() {
    setIsLoggingOut(true);
    await logout();
  }

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <section className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wide text-brand-700">AUTOHOME CENTRAL</p>
            <h1 className="mt-1 text-2xl font-bold text-brand-950">
              Olá, {session?.user.username}
            </h1>
          </div>
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-800 disabled:opacity-70"
            type="button"
            onClick={() => void onLogout()}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Saindo…' : 'Sair'}
          </button>
        </header>
        <section className="pt-8" aria-labelledby="foundation-title">
          <h2 id="foundation-title" className="text-lg font-semibold text-slate-900">
            Central pronta
          </h2>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">
            Sua sessão está protegida. As telas operacionais serão disponibilizadas nas próximas
            etapas.
          </p>
        </section>
      </section>
    </main>
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
          <Route path="/" element={<AuthenticatedShell />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
