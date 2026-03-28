import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types';
import { authService } from '../services/authService';

interface AuthContextValue {
  user: AuthUser | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('authUser');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  const persist = (u: AuthUser) => {
    localStorage.setItem('authUser', JSON.stringify(u));
    setUser(u);
  };

  const login = useCallback(async (data: LoginRequest) => {
    const u = await authService.login(data);
    persist(u);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const u = await authService.register(data);
    persist(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authUser');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
