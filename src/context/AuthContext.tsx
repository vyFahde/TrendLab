import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUsuarioStore } from '../store/usuario-store';
import { api } from '../services/api';

export interface User {
  name: string;
  email: string;
}

interface AuthContextData {
  user: User | null;
  registerUser: (name: string, email: string, password: string) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<boolean>;
  logoutUser: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<{ user: User; expiresAt: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const setUsuario = useUsuarioStore((state) => state.setUsuario);
  const hydrateFromStorage = useUsuarioStore((state) => state.hydrateFromStorage);

  useEffect(() => {
    const initialize = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const legacyAccounts = keys.filter((key) => key.startsWith('@trendlab:account:'));
        await AsyncStorage.multiRemove(['@trendlab:active_user', '@trendlab:jwt_token', ...legacyAccounts]);
      } catch {
        console.warn('Não foi possível limpar as credenciais antigas do aparelho.');
      } finally {
        await hydrateFromStorage();
        setLoading(false);
      }
    };
    initialize();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!session) return;
    const timeout = setTimeout(() => {
      setSession(null);
      void setUsuario(null);
    }, Math.max(0, session.expiresAt - Date.now()));
    return () => clearTimeout(timeout);
  }, [session, setUsuario]);

  const openSession = async (auth: Awaited<ReturnType<typeof api.register>>) => {
    const user = { name: auth.user.username, email: auth.user.email };
    await setUsuario(user.email, user.name, auth.jwt);
    if (useUsuarioStore.getState().jwtToken !== auth.jwt) return;
    setSession({ user, expiresAt: auth.expiresAt });
  };

  const registerUser = async (name: string, email: string, password: string) => {
    await openSession(await api.register(name, email, password));
  };

  const loginUser = async (email: string, password: string) => {
    const auth = await api.login(email, password);
    if (!auth) return false;

    await openSession(auth);
    return true;
  };

  const logoutUser = () => {
    setSession(null);
    void setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, registerUser, loginUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
