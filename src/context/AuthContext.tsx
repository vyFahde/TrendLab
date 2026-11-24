import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useUsuarioStore } from '../store/usuario-store';
import { api, AuthSession } from '../services/api';

export interface User {
  name: string;
  email: string;
}

interface AuthContextData {
  user: User | null;
  registerUser: (name: string, email: string, password: string, acceptedTerms: boolean) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  loading: boolean;
}

// O JWT é guardado no SecureStore (Keychain/Keystore), armazenamento criptografado do aparelho, e não no AsyncStorage comum.
const sessionKey = 'trendlab.session';
const secureOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const setUsuario = useUsuarioStore((state) => state.setUsuario);
  const hydrateFromStorage = useUsuarioStore((state) => state.hydrateFromStorage);

  useEffect(() => {
    let cancelled = false;
    // Ao abrir o app: restaura a sessão salva e valida o token no servidor; se expirou ou é inválido, volta para o login.
    const initialize = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const legacyAccounts = keys.filter((key) => key.startsWith('@trendlab:account:'));
        await AsyncStorage.multiRemove(['@trendlab:active_user', '@trendlab:jwt_token', ...legacyAccounts]);
      } catch {
        console.warn('Não foi possível limpar as credenciais antigas do aparelho.');
      }

      try {
        await hydrateFromStorage();
        if (!(await SecureStore.isAvailableAsync())) return;

        const raw = await SecureStore.getItemAsync(sessionKey, secureOptions);
        if (!raw) return;

        const saved = JSON.parse(raw) as AuthSession & { baseUrl?: string };
        if (saved.baseUrl !== api.getBaseUrl() || !api.getBaseUrl().startsWith('https://') ||
            typeof saved.jwt !== 'string' || !saved.jwt ||
            !Number.isFinite(saved.expiresAt) || saved.expiresAt <= Date.now() ||
            typeof saved.user?.email !== 'string' || typeof saved.user?.username !== 'string') {
          if (!cancelled) await SecureStore.deleteItemAsync(sessionKey, secureOptions);
          return;
        }

        const valid = await api.validateSession(saved.jwt);
        if (cancelled) return;
        if (!valid || saved.expiresAt <= Date.now()) {
          await SecureStore.deleteItemAsync(sessionKey, secureOptions);
          return;
        }

        await setUsuario(saved.user.email, saved.user.username, saved.jwt);
        if (!cancelled) setSession(saved);
      } catch {
        console.warn('Não foi possível restaurar a sessão do TrendLab.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void initialize();
    return () => { cancelled = true; };
  }, [hydrateFromStorage, setUsuario]);

  useEffect(() => {
    if (!session) return;
    const timeout = setTimeout(() => {
      setSession(null);
      void setUsuario(null);
    }, Math.max(0, session.expiresAt - Date.now()));
    return () => clearTimeout(timeout);
  }, [session, setUsuario]);

  // Após login/cadastro: guarda o JWT e atualiza o estado global (Zustand) com o usuário logado.
  const openSession = async (auth: AuthSession) => {
    const baseUrl = api.getBaseUrl();
    try {
      if (baseUrl.startsWith('https://') && await SecureStore.isAvailableAsync()) {
        await SecureStore.setItemAsync(sessionKey, JSON.stringify({
          jwt: auth.jwt,
          expiresAt: auth.expiresAt,
          user: { username: auth.user.username, email: auth.user.email },
          baseUrl,
        }), secureOptions);
      }
    } catch {
      console.warn('A sessão está disponível apenas enquanto o aplicativo estiver aberto.');
    }
    await setUsuario(auth.user.email, auth.user.username, auth.jwt);
    if (useUsuarioStore.getState().jwtToken === auth.jwt) setSession(auth);
  };

  const registerUser = async (name: string, email: string, password: string, acceptedTerms: boolean) => {
    await openSession(await api.register(name, email, password, acceptedTerms));
  };

  const loginUser = async (email: string, password: string) => {
    const auth = await api.login(email, password);
    if (!auth) return false;
    await openSession(auth);
    return true;
  };

  // Logout: apaga o token do SecureStore e limpa o estado do usuário.
  const logoutUser = async () => {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync(sessionKey, secureOptions);
    }
    setSession(null);
    await setUsuario(null);
  };

  // LGPD - excluir conta: apaga no servidor (conta + pedidos), limpa os dados do aparelho e encerra a sessão.
  const deleteAccount = async (password: string) => {
    await useUsuarioStore.getState().deleteAccount(password);
    await logoutUser();
  };

  const user = session ? { name: session.user.username, email: session.user.email } : null;
  return (
    <AuthContext.Provider value={{ user, registerUser, loginUser, logoutUser, deleteAccount, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
