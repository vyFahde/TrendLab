import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  name: string;
  email: string;
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

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@trendlab:active_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.warn('Erro ao carregar usuário ativo', error);
      } finally {
        setLoading(false);
      }
    };
    loadStoredUser();
  }, []);

  const registerUser = async (name: string, email: string, password: string) => {
    const newUser = { name, email };
    // Salva o cadastro local
    await AsyncStorage.setItem(`@trendlab:account:${email.toLowerCase()}`, JSON.stringify({ name, email, password }));
    // Define como usuário ativo da sessão
    await AsyncStorage.setItem('@trendlab:active_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const loginUser = async (email: string, password?: string): Promise<boolean> => {
    // Casos especiais das Personas
    if (email.toLowerCase().includes('teresa')) {
      const teresaUser = { name: 'Teresa Tavares', email };
      await AsyncStorage.setItem('@trendlab:active_user', JSON.stringify(teresaUser));
      setUser(teresaUser);
      return true;
    }

    if (email.toLowerCase().includes('gabriel')) {
      const gabrielUser = { name: 'Gabriel Gomes', email };
      await AsyncStorage.setItem('@trendlab:active_user', JSON.stringify(gabrielUser));
      setUser(gabrielUser);
      return true;
    }

    // Busca conta salva no dispositivo
    try {
      const savedAccountStr = await AsyncStorage.getItem(`@trendlab:account:${email.toLowerCase()}`);
      if (savedAccountStr) {
        const savedAccount = JSON.parse(savedAccountStr);
        if (!password || savedAccount.password === password) {
          const loggedUser = { name: savedAccount.name, email: savedAccount.email };
          await AsyncStorage.setItem('@trendlab:active_user', JSON.stringify(loggedUser));
          setUser(loggedUser);
          return true;
        }
      }
    } catch (e) {
      console.warn('Erro ao verificar credenciais', e);
    }

    // Fallback: se for um e-mail válido qualquer digitado pelo usuário
    const fallbackUser = { name: email.split('@')[0], email };
    await AsyncStorage.setItem('@trendlab:active_user', JSON.stringify(fallbackUser));
    setUser(fallbackUser);
    return true;
  };

  const logoutUser = async () => {
    await AsyncStorage.removeItem('@trendlab:active_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, registerUser, loginUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
