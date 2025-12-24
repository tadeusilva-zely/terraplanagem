import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Usuario, AuthContextType } from '../types';
import { getUsuarioByPin, initializeStorage } from '../services/storage';

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_KEY = 'terraplenagem_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    // Inicializa storage com dados mock
    initializeStorage();

    // Verifica se há usuário salvo
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved) {
      try {
        setUsuario(JSON.parse(saved));
      } catch {
        localStorage.removeItem(AUTH_KEY);
      }
    }
  }, []);

  const login = (pin: string): boolean => {
    const user = getUsuarioByPin(pin);
    if (user) {
      setUsuario(user);
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem(AUTH_KEY);
  };

  const value: AuthContextType = {
    usuario,
    login,
    logout,
    isAuthenticated: !!usuario,
    isAdmin: usuario?.perfil === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
