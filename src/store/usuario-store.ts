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
  setUsuario: (email: string | null, name?: string, jwt?: string | null) => Promise<void>;
  setAvatarUri: (uri: string | null, sessionToken: string | null) => Promise<void>;
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

const avatarStorageKey = (email: string) => '@trendlab:avatar_uri:' + email;
const fitStorageKey = (email: string) => '@trendlab:fit_profile:' + email;

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

  setUsuario: async (email, name, jwt) => {
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    const sessionToken = cleanEmail ? jwt ?? null : null;

    set({
      usuario: cleanEmail,
      jwtToken: sessionToken,
      orders: [],
      avatarUri: null,
      fitProfile: defaultFitProfile,
      userData: cleanEmail
        ? {
            email: cleanEmail,
            name: name || cleanEmail.split('@')[0],
            avatarUri: null,
          }
        : null,
    });

    if (!cleanEmail || !sessionToken) {
      return;
    }

    try {
      const [savedAvatar, savedFit] = await Promise.all([
        AsyncStorage.getItem(avatarStorageKey(cleanEmail)),
        AsyncStorage.getItem(fitStorageKey(cleanEmail)),
      ]);
      if (get().usuario !== cleanEmail || get().jwtToken !== sessionToken) return;
      const fitProfile = savedFit ? { ...defaultFitProfile, ...JSON.parse(savedFit) } : defaultFitProfile;
      set(state => ({
        avatarUri: savedAvatar,
        fitProfile,
        userData: state.userData && { ...state.userData, avatarUri: savedAvatar },
      }));
    } catch (error) {
      console.warn('Erro ao carregar o perfil do usuário:', error);
    }

    void (async () => {
      try {
        const savedUserOrders = await AsyncStorage.getItem(getOrdersStorageKey(cleanEmail));
        const localOrders: OrderRecord[] = savedUserOrders ? JSON.parse(savedUserOrders) : [];
        const filteredLocal = localOrders.filter(
          (o) => !o.userEmail || o.userEmail.toLowerCase() === cleanEmail
        );
        if (get().usuario === cleanEmail && get().jwtToken === jwt) {
          set({ orders: filteredLocal });
          await get().syncWithBackend();
        }
      } catch (e) {
        console.warn('Erro ao carregar pedidos do usuário:', e);
      }
    })();
  },

  setAvatarUri: async (uri, sessionToken) => {
    const { usuario, jwtToken } = get();
    if (!usuario || !sessionToken || sessionToken !== jwtToken) return;

    set((state) => ({
      avatarUri: uri,
      userData: state.userData ? { ...state.userData, avatarUri: uri } : null,
    }));
    try {
      if (uri) {
        await AsyncStorage.setItem(avatarStorageKey(usuario), uri);
      } else {
        await AsyncStorage.removeItem(avatarStorageKey(usuario));
      }
    } catch (e) {
      console.warn('Erro ao salvar avatar no AsyncStorage:', e);
    }
  },

  updateFitProfile: async (partial) => {
    const { usuario, jwtToken, fitProfile: current } = get();
    if (!usuario || !jwtToken) return;
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
      await AsyncStorage.setItem(fitStorageKey(usuario), JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar perfil do provador:', e);
    }
  },

  addOrder: async (order) => {
    const { usuario, jwtToken } = get();
    if (!usuario || !jwtToken) throw new Error('Entre novamente para enviar o pedido.');
    const cleanEmail = usuario;
    const orderWithUser: OrderRecord = {
      ...order,
      userEmail: cleanEmail,
    };

    await api.createOrder(orderWithUser, jwtToken);
    if (get().jwtToken !== jwtToken) return;

    const nextOrders = [orderWithUser, ...get().orders.filter((o) => o.id !== order.id)];
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
    const { usuario: cleanEmail, jwtToken } = get();
    if (!cleanEmail || !jwtToken) throw new Error('Entre novamente para cancelar o pedido.');

    await api.deleteOrder(orderId, jwtToken);
    if (get().jwtToken !== jwtToken) return;

    const nextOrders = get().orders.filter((o) => o.id !== orderId);
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
      const activeToken = get().jwtToken;
      const [health, prodRes, remoteOrders] = await Promise.all([
        api.checkHealth(),
        api.getProducts(),
        activeEmail && activeToken ? api.getOrders(activeToken) : Promise.resolve(null),
      ]);

      let mergedOrders = activeEmail && get().jwtToken === activeToken
        ? get().orders.filter(
            (o) => !o.userEmail || o.userEmail.toLowerCase() === activeEmail
          )
        : [];

      if (activeEmail && remoteOrders && get().jwtToken === activeToken) {
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
        orders: get().jwtToken === activeToken ? mergedOrders : get().orders,
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
      await AsyncStorage.multiRemove(['@trendlab:orders', '@trendlab:avatar_uri', '@trendlab:fit_profile']);
    } catch (e) {
      console.warn('Erro ao hidratar store Zustand:', e);
    }
  },
}));
