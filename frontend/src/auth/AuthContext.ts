import { createContext } from "react";

export interface AuthState {
  loading: boolean;
  setupComplete: boolean;
  authenticated: boolean;
}

export interface AuthContextValue extends AuthState {
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setup: (username: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
