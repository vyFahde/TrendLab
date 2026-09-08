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
    const cleanEmail = email.trim().toLowerCase();

    // Contas de teste padrão pré-configuradas (requerem a senha correta)
    const defaultAccounts: Record<string, { name: string; password?: string }> = {
      'teresa.tavares@trendlab.com': { name: 'Teresa Tavares', password: '123456' },
      'gabriel.gomes@trendlab.com': { name: 'Gabriel Gomes', password: '123456' },
      'admin@trendlab.com': { name: 'Administrador TrendLab', password: '123456' },
    };

    if (defaultAccounts[cleanEmail]) {
      const defaultAcc = defaultAccounts[cleanEmail];
      if (!password || defaultAcc.password === password) {
        const loggedUser = { name: defaultAcc.name, email: cleanEmail };
        await AsyncStorage.setItem('@trendlab:active_user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        return true;
      }
      return false; // Senha incorreta
    }

    // Busca conta cadastrada pelo usuário no dispositivo
    try {
      const savedAccountStr = await AsyncStorage.getItem(`@trendlab:account:${cleanEmail}`);
      if (savedAccountStr) {
        const savedAccount = JSON.parse(savedAccountStr);
        if (!password || savedAccount.password === password) {
          const loggedUser = { name: savedAccount.name, email: savedAccount.email };
          await AsyncStorage.setItem('@trendlab:active_user', JSON.stringify(loggedUser));
          setUser(loggedUser);
          return true;
        }
        return false; // Senha incorreta
      }
    } catch (e) {
      console.warn('Erro ao verificar credenciais', e);
    }

    // Conta não encontrada no dispositivo
    return false;
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
