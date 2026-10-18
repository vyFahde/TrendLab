import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUsuarioStore } from '../store/usuario-store';
import { api, createClientSideJwt } from '../services/api';

export interface User {
  name: string;
  email: string;
  jwt?: string;
}

interface AuthContextData {
  user: User | null;
  registerUser: (name: string, email: string, password: string) => Promise<void>;
  loginUser: (email: string, password?: string) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setUsuario, hydrateFromStorage } = useUsuarioStore();

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        await hydrateFromStorage();
        const [storedUser, storedJwt] = await Promise.all([
          AsyncStorage.getItem('@trendlab:active_user'),
          AsyncStorage.getItem('@trendlab:jwt_token'),
        ]);
        if (storedUser) {
          const parsed: User = JSON.parse(storedUser);
          const token = storedJwt || parsed.jwt || createClientSideJwt(parsed.email, parsed.name);
          setUser({ ...parsed, jwt: token });
          setUsuario(parsed.email, parsed.name, token);
        }
      } catch (error) {
        console.warn('Erro ao carregar usuário ativo', error);
      } finally {
        setLoading(false);
      }
    };
    loadStoredUser();
  }, [hydrateFromStorage, setUsuario]);

  const registerUser = async (name: string, email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Salva o cadastro local e envia POST /api/auth/local/register ao WebService REST/Strapi
    await AsyncStorage.setItem(
      `@trendlab:account:${cleanEmail}`,
      JSON.stringify({ name: cleanName, email: cleanEmail, password })
    );

    const apiAuth = await api.register(cleanName, cleanEmail, password);
    const newUser: User = {
      name: apiAuth.user.username || cleanName,
      email: apiAuth.user.email || cleanEmail,
      jwt: apiAuth.jwt,
    };

    await Promise.all([
      AsyncStorage.setItem('@trendlab:active_user', JSON.stringify(newUser)),
      AsyncStorage.setItem('@trendlab:jwt_token', apiAuth.jwt),
    ]);

    setUser(newUser);
    setUsuario(newUser.email, newUser.name, apiAuth.jwt);
  };

  const loginUser = async (email: string, password?: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();

    // Autentica via WebService REST/Strapi (POST /api/auth/local) ou validação local com geração de JWT
    const authResult = await api.login(cleanEmail, password);
    if (authResult && authResult.ok) {
      const loggedUser: User = {
        name: authResult.user.username,
        email: authResult.user.email,
        jwt: authResult.jwt,
      };
      await Promise.all([
        AsyncStorage.setItem('@trendlab:active_user', JSON.stringify(loggedUser)),
        AsyncStorage.setItem('@trendlab:jwt_token', authResult.jwt),
      ]);
      setUser(loggedUser);
      setUsuario(loggedUser.email, loggedUser.name, authResult.jwt);
      return true;
    }

    return false;
  };

  const logoutUser = async () => {
    await Promise.all([
      AsyncStorage.removeItem('@trendlab:active_user'),
      AsyncStorage.removeItem('@trendlab:jwt_token'),
    ]);
    setUser(null);
    setUsuario(null, undefined, null);
  };

  return (
    <AuthContext.Provider value={{ user, registerUser, loginUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
