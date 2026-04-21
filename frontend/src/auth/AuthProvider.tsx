import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { fetchAuthStatus, login as apiLogin, logout as apiLogout, setupChief } from "../api/auth";
import { AuthContext } from "./AuthContext";
import type { AuthContextValue, AuthState } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loading: true,
    setupComplete: false,
    authenticated: false,
  });

  const refresh = useCallback(async () => {
    try {
      const status = await fetchAuthStatus();
      setState({
        loading: false,
        setupComplete: status.setup_complete,
        authenticated: status.authenticated,
      });
    } catch {
      setState({ loading: false, setupComplete: false, authenticated: false });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value: AuthContextValue = {
    ...state,
    refresh,
    login: async (username, password) => {
      await apiLogin(username, password);
      await refresh();
    },
    logout: async () => {
      await apiLogout();
      await refresh();
    },
    setup: async (username, password) => {
      await setupChief(username, password);
      await refresh();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
