import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FitProfile, OrderRecord } from '../types';

export interface UsuarioData {
  name: string;
  email: string;
  avatarUri?: string | null;
}

interface UsuarioStore {
  usuario: string | null;
  userData: UsuarioData | null;
  avatarUri: string | null;
  fitProfile: FitProfile;
  orders: OrderRecord[];
  setUsuario: (email: string | null, name?: string) => void;
  setAvatarUri: (uri: string | null) => Promise<void>;
  updateFitProfile: (profile: Partial<FitProfile>) => Promise<void>;
  addOrder: (order: OrderRecord) => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
}

export const calculateRecommendedSizes = (
  heightCmStr: string,
  weightKgStr: string,
  fitPreference: 'justo' | 'regular' | 'solto'
): { letter: string; numeric: string } => {
  const h = parseFloat(heightCmStr) || 170;
  const w = parseFloat(weightKgStr) || 70;
  const bmi = w / Math.pow(h / 100, 2);

  let index = 1; // 0=P/38, 1=M/40, 2=G/42, 3=GG/44, 4=XG/46
  if (bmi < 20 && w < 60) {
    index = 0;
  } else if (bmi < 24 && w < 74) {
    index = 1;
  } else if (bmi < 28 && w < 88) {
    index = 2;
  } else if (bmi < 32 && w < 102) {
    index = 3;
  } else {
    index = 4;
  }

  if (fitPreference === 'justo' && index > 0) {
    index -= 1;
  } else if (fitPreference === 'solto' && index < 4) {
    index += 1;
  }

  const letters = ['P', 'M', 'G', 'GG', 'XG'];
  const numerics = ['38', '40', '42', '44', '46'];

  return {
    letter: letters[index] || 'G',
    numeric: numerics[index] || '42',
  };
};

const defaultFitProfile: FitProfile = {
  heightCm: '170',
  weightKg: '72',
  fitPreference: 'regular',
  recommendedLetterSize: 'G',
  recommendedNumericSize: '42',
  photoUri: null,
};

export const useUsuarioStore = create<UsuarioStore>((set, get) => ({
  usuario: null,
  userData: null,
  avatarUri: null,
  fitProfile: defaultFitProfile,
  orders: [],

  setUsuario: (email, name) =>
    set((state) => ({
      usuario: email,
      userData: email
        ? {
            email,
            name: name || state.userData?.name || email.split('@')[0],
            avatarUri: state.avatarUri,
          }
        : null,
    })),

  setAvatarUri: async (uri) => {
    set((state) => ({
      avatarUri: uri,
      userData: state.userData ? { ...state.userData, avatarUri: uri } : null,
    }));
    try {
      if (uri) {
        await AsyncStorage.setItem('@trendlab:avatar_uri', uri);
      } else {
        await AsyncStorage.removeItem('@trendlab:avatar_uri');
      }
    } catch (e) {
      console.warn('Erro ao salvar avatar no AsyncStorage:', e);
    }
  },

  updateFitProfile: async (partial) => {
    const current = get().fitProfile;
    const nextHeight = partial.heightCm ?? current.heightCm;
    const nextWeight = partial.weightKg ?? current.weightKg;
    const nextPref = partial.fitPreference ?? current.fitPreference;
    const sizes = calculateRecommendedSizes(nextHeight, nextWeight, nextPref);

    const updated: FitProfile = {
      ...current,
      ...partial,
      heightCm: nextHeight,
      weightKg: nextWeight,
      fitPreference: nextPref,
      recommendedLetterSize: partial.recommendedLetterSize ?? sizes.letter,
      recommendedNumericSize: partial.recommendedNumericSize ?? sizes.numeric,
    };

    set({ fitProfile: updated });
    try {
      await AsyncStorage.setItem('@trendlab:fit_profile', JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar perfil do provador:', e);
    }
  },

  addOrder: async (order) => {
    const nextOrders = [order, ...get().orders];
    set({ orders: nextOrders });
    try {
      await AsyncStorage.setItem('@trendlab:orders', JSON.stringify(nextOrders));
    } catch (e) {
      console.warn('Erro ao salvar histórico de pedidos:', e);
    }
  },

  hydrateFromStorage: async () => {
    try {
      const [savedAvatar, savedFit, savedOrders] = await Promise.all([
        AsyncStorage.getItem('@trendlab:avatar_uri'),
        AsyncStorage.getItem('@trendlab:fit_profile'),
        AsyncStorage.getItem('@trendlab:orders'),
      ]);

      set((state) => ({
        avatarUri: savedAvatar || state.avatarUri,
        fitProfile: savedFit ? JSON.parse(savedFit) : state.fitProfile,
        orders: savedOrders ? JSON.parse(savedOrders) : state.orders,
      }));
    } catch (e) {
      console.warn('Erro ao hidratar store Zustand:', e);
    }
  },
}));
