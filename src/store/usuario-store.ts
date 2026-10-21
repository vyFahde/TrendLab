import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FitProfile, OrderRecord, Product } from '../types';
import { mockProducts } from '../data/mockProducts';
import { api, ApiStatusInfo, sanitizeProductDescriptions } from '../services/api';

export interface UsuarioData {
  name: string;
  email: string;
  avatarUri?: string | null;
}

interface UsuarioStore {
  usuario: string | null;
  userData: UsuarioData | null;
  jwtToken: string | null;
  avatarUri: string | null;
  fitProfile: FitProfile;
  orders: OrderRecord[];
  products: Product[];
  apiStatus: ApiStatusInfo | null;
  isSyncingApi: boolean;
  setUsuario: (email: string | null, name?: string, jwt?: string | null) => void;
  setAvatarUri: (uri: string | null) => Promise<void>;
  updateFitProfile: (profile: Partial<FitProfile>) => Promise<void>;
  addOrder: (order: OrderRecord) => Promise<void>;
  removeOrder: (orderId: string) => Promise<void>;
  fetchProductsFromApi: () => Promise<{ count: number; mode: 'local-strapi' | 'cloud-rest' }>;
  syncWithBackend: () => Promise<ApiStatusInfo>;
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

const getOrdersStorageKey = (email: string) =>
  `@trendlab:orders:${email.trim().toLowerCase()}`;

export const useUsuarioStore = create<UsuarioStore>((set, get) => ({
  usuario: null,
  userData: null,
  jwtToken: null,
  avatarUri: null,
  fitProfile: defaultFitProfile,
  orders: [],
  products: mockProducts.map(sanitizeProductDescriptions),
  apiStatus: null,
  isSyncingApi: false,

  setUsuario: (email, name, jwt) => {
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    set((state) => ({
      usuario: cleanEmail,
      jwtToken: jwt !== undefined ? jwt : cleanEmail ? state.jwtToken : null,
      orders: cleanEmail && state.usuario === cleanEmail ? state.orders : [],
      userData: cleanEmail
        ? {
            email: cleanEmail,
            name: name || state.userData?.name || cleanEmail.split('@')[0],
            avatarUri: state.avatarUri,
          }
        : null,
    }));

    if (!cleanEmail) {
      return;
    }

    (async () => {
      try {
        const savedUserOrders = await AsyncStorage.getItem(getOrdersStorageKey(cleanEmail));
        const localOrders: OrderRecord[] = savedUserOrders ? JSON.parse(savedUserOrders) : [];
        const filteredLocal = localOrders.filter(
          (o) => !o.userEmail || o.userEmail.toLowerCase() === cleanEmail
        );
        if (get().usuario === cleanEmail) {
          set({ orders: filteredLocal });
        }
        await get().syncWithBackend();
      } catch (e) {
        console.warn('Erro ao carregar pedidos do usuário:', e);
      }
    })();
  },

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
    const { usuario, jwtToken, orders } = get();
    const cleanEmail = (usuario || order.userEmail || '').trim().toLowerCase();
    const orderWithUser: OrderRecord = {
      ...order,
      userEmail: cleanEmail || undefined,
    };

    await api.createOrder(orderWithUser, cleanEmail, jwtToken);

    const nextOrders = [orderWithUser, ...orders.filter((o) => o.id !== order.id)];
    set({ orders: nextOrders });
    try {
      if (cleanEmail) {
        await AsyncStorage.setItem(getOrdersStorageKey(cleanEmail), JSON.stringify(nextOrders));
      }
    } catch (e) {
      console.warn('Erro ao salvar histórico de pedidos:', e);
    }
  },

  removeOrder: async (orderId) => {
    const { usuario, jwtToken, orders } = get();
    const cleanEmail = (usuario || '').trim().toLowerCase();
    await api.deleteOrder(orderId, jwtToken);

    const nextOrders = orders.filter((o) => o.id !== orderId);
    set({ orders: nextOrders });
    try {
      if (cleanEmail) {
        await AsyncStorage.setItem(getOrdersStorageKey(cleanEmail), JSON.stringify(nextOrders));
      }
    } catch (e) {
      console.warn('Erro ao remover pedido:', e);
    }
  },

  fetchProductsFromApi: async () => {
    set({ isSyncingApi: true });
    try {
      const res = await api.getProducts();
      const health = await api.checkHealth();
      set({
        products: res.products,
        apiStatus: health,
        isSyncingApi: false,
      });
      return { count: res.products.length, mode: res.source };
    } catch {
      set({ isSyncingApi: false });
      return { count: get().products.length, mode: 'cloud-rest' };
    }
  },

  syncWithBackend: async () => {
    set({ isSyncingApi: true });
    try {
      await api.initBaseUrl();
      const activeEmail = get().usuario?.trim().toLowerCase() || null;
      const [health, prodRes, remoteOrders] = await Promise.all([
        api.checkHealth(),
        api.getProducts(),
        activeEmail ? api.getOrders(activeEmail, get().jwtToken) : Promise.resolve(null),
      ]);

      let mergedOrders = activeEmail
        ? get().orders.filter(
            (o) => !o.userEmail || o.userEmail.toLowerCase() === activeEmail
          )
        : [];

      if (activeEmail && remoteOrders) {
        const remoteForUser = remoteOrders.orders.filter(
          (o) => !o.userEmail || o.userEmail.toLowerCase() === activeEmail
        );
        const remoteIds = new Set(remoteForUser.map((o) => o.id));
        const localOnlyForUser = mergedOrders.filter(
          (o) => !remoteIds.has(o.id) && o.userEmail?.toLowerCase() === activeEmail
        );
        mergedOrders = [...remoteForUser, ...localOnlyForUser];
        await AsyncStorage.setItem(
          getOrdersStorageKey(activeEmail),
          JSON.stringify(mergedOrders)
        );
      }

      set({
        apiStatus: health,
        products: prodRes.products,
        orders: mergedOrders,
        isSyncingApi: false,
      });
      return health;
    } catch {
      set({ isSyncingApi: false });
      const fallback: ApiStatusInfo = {
        online: false,
        mode: 'cloud-rest',
        statusCode: 503,
        latencyMs: 0,
        baseUrl: api.getBaseUrl(),
      };
      set({ apiStatus: fallback });
      return fallback;
    }
  },

  hydrateFromStorage: async () => {
    try {
      await api.initBaseUrl();
      await AsyncStorage.removeItem('@trendlab:orders');
      const [savedAvatar, savedFit, savedJwt] = await Promise.all([
        AsyncStorage.getItem('@trendlab:avatar_uri'),
        AsyncStorage.getItem('@trendlab:fit_profile'),
        AsyncStorage.getItem('@trendlab:jwt_token'),
      ]);

      set((state) => ({
        avatarUri: savedAvatar || state.avatarUri,
        fitProfile: savedFit ? JSON.parse(savedFit) : state.fitProfile,
        jwtToken: savedJwt || state.jwtToken,
      }));

      get().syncWithBackend();
    } catch (e) {
      console.warn('Erro ao hidratar store Zustand:', e);
    }
  },
}));
