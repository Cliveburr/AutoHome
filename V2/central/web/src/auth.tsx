import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext, useEffect, useMemo } from 'react';
import {
  changeSessionPassword,
  getSession,
  loginSession,
  logoutSession,
  setUnauthenticatedHandler,
  type SessionResponse,
} from './api/client';

const sessionQueryKey = ['current-session'] as const;

interface SessionContextValue {
  session: SessionResponse | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: sessionQueryKey,
    queryFn: getSession,
    retry: false,
  });

  useEffect(() => {
    setUnauthenticatedHandler(() => {
      queryClient.setQueryData(sessionQueryKey, null);
    });

    return () => setUnauthenticatedHandler(undefined);
  }, [queryClient]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session: sessionQuery.data ?? null,
      isLoading: sessionQuery.isLoading,
      login: async (username, password) => {
        const session = await loginSession({ username, password });
        queryClient.setQueryData(sessionQueryKey, session);
      },
      changePassword: async (currentPassword, newPassword) => {
        await changeSessionPassword({ currentPassword, newPassword });
        await queryClient.fetchQuery({
          queryKey: sessionQueryKey,
          queryFn: getSession,
          staleTime: 0,
        });
      },
      logout: async () => {
        try {
          await logoutSession();
        } finally {
          queryClient.setQueryData(sessionQueryKey, null);
        }
      },
    }),
    [queryClient, sessionQuery.data, sessionQuery.isLoading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// This hook is intentionally exported with the provider for route components.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return context;
}
