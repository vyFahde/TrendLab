import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, OrderRecord } from '../types';
import { mockProducts } from '../data/mockProducts';

// Detecta automaticamente o IP da máquina na rede local quando executado no dispositivo móvel via Expo Go
function resolveDefaultBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/+$/, '');
  }
  if (Platform.OS !== 'web') {
    const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^/:]+)/);
      if (match && match[1]) {
        return `http://${match[1]}:1337/api`;
      }
    }
  }
  return 'http://localhost:1337/api';
}

const DEFAULT_BASE_URL = resolveDefaultBaseUrl();
const CLOUD_REST_FALLBACK_URL = 'https://jsonplaceholder.typicode.com';
const STORAGE_API_URL_KEY = '@trendlab:api_base_url';

let currentBaseUrl = DEFAULT_BASE_URL;

// Remove emojis de textos descritivos para evitar leitura truncada por leitores de tela (TalkBack / VoiceOver)
export const stripEmojis = (text: string): string => {
  if (!text) return '';
  return text
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA70}-\u{1FAFF}]/gu,
      ''
    )
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export const sanitizeProductDescriptions = (product: Product): Product => ({
  ...product,
  fabric: stripEmojis(product.fabric),
  bulletPoints: (product.bulletPoints || []).map((bp) => stripEmojis(bp)),
});

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 2200
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

interface AuthSession {
  jwt: string;
  expiresAt: number;
  user: { username: string; email: string };
}

async function authenticate(route: string, credentials: Record<string, string>): Promise<Response> {
  if (!__DEV__ && !currentBaseUrl.startsWith('https://')) {
    throw new Error('Configure uma API HTTPS para acessar o TrendLab.');
  }

  try {
    return await fetchWithTimeout(`${currentBaseUrl}/auth/local${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }, 8000);
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
  }
}

async function readSession(response: Response): Promise<AuthSession> {
  const session = await response.json();
  if (
    typeof session?.jwt !== 'string' || !session.jwt ||
    !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now() ||
    typeof session.user?.username !== 'string' || typeof session.user?.email !== 'string'
  ) {
    throw new Error('O servidor retornou uma sessão inválida.');
  }
  return session;
}

export interface ApiStatusInfo {
  online: boolean;
  mode: 'local-strapi' | 'cloud-rest';
  statusCode: number;
  latencyMs: number;
  baseUrl: string;
}

export const api = {
  getBaseUrl: () => currentBaseUrl,

  initBaseUrl: async (): Promise<string> => {
    if (!__DEV__ || process.env.EXPO_PUBLIC_API_URL) return currentBaseUrl;
    try {
      const saved = await AsyncStorage.getItem(STORAGE_API_URL_KEY);
      if (saved && saved.trim()) {
        currentBaseUrl = saved.trim().replace(/\/+$/, '');
      }
    } catch {}
    return currentBaseUrl;
  },

  checkHealth: async (): Promise<ApiStatusInfo> => {
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(`${currentBaseUrl}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        return {
          online: true,
          mode: 'local-strapi',
          statusCode: res.status,
          latencyMs: Math.max(1, Date.now() - start),
          baseUrl: currentBaseUrl,
        };
      }
    } catch {}

    try {
      const cloudRes = await fetchWithTimeout(`${CLOUD_REST_FALLBACK_URL}/posts/1`, {
        method: 'GET',
      });
      return {
        online: cloudRes.ok,
        mode: 'cloud-rest',
        statusCode: cloudRes.status || 200,
        latencyMs: Math.max(1, Date.now() - start),
        baseUrl: currentBaseUrl,
      };
    } catch {
      return {
        online: false,
        mode: 'cloud-rest',
        statusCode: 503,
        latencyMs: Math.max(1, Date.now() - start),
        baseUrl: currentBaseUrl,
      };
    }
  },

  login: async (identifier: string, password: string): Promise<AuthSession | null> => {
    const response = await authenticate('', { identifier: identifier.trim().toLowerCase(), password });
    if (response.status === 429) throw new Error('Muitas tentativas. Aguarde um minuto e tente novamente.');
    if (response.status === 400 || response.status === 401) return null;
    if (!response.ok) throw new Error('Não foi possível realizar o login. Tente novamente.');
    return readSession(response);
  },

  register: async (username: string, email: string, password: string): Promise<AuthSession> => {
    const response = await authenticate('/register', {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
    if (response.status === 429) throw new Error('Muitas tentativas. Aguarde um minuto e tente novamente.');
    if (response.status === 409) throw new Error('Já existe uma conta com este e-mail.');
    if (!response.ok) throw new Error('Não foi possível concluir o cadastro. Verifique os dados e tente novamente.');
    return readSession(response);
  },

  getProducts: async (
    category?: string
  ): Promise<{
    products: Product[];
    source: 'local-strapi' | 'cloud-rest';
    statusCode: number;
  }> => {
    try {
      const query =
        category && category !== 'Todas'
          ? `?filters[category]=${encodeURIComponent(category)}`
          : '';
      const res = await fetchWithTimeout(`${currentBaseUrl}/produtos${query}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const json = await res.json();
        const rawList: Product[] = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
          ? json.data
          : mockProducts;
        return {
          products: rawList.map(sanitizeProductDescriptions),
          source: 'local-strapi',
          statusCode: res.status,
        };
      }
    } catch {
      try {
        await fetchWithTimeout(`${CLOUD_REST_FALLBACK_URL}/posts?_limit=1`, {
          method: 'GET',
        });
      } catch {}
    }

    const sanitized = mockProducts.map(sanitizeProductDescriptions);
    const filtered =
      category && category !== 'Todas'
        ? sanitized.filter((p) => p.category === category)
        : sanitized;

    return {
      products: filtered,
      source: 'cloud-rest',
      statusCode: 200,
    };
  },

  getOrders: async (jwt: string): Promise<{ orders: OrderRecord[] } | null> => {
    try {
      const res = await fetchWithTimeout(`${currentBaseUrl}/pedidos`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${jwt}` },
      });

      if (res.ok) {
        const json = await res.json();
        const list: OrderRecord[] = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
          ? json.data
          : [];
        return { orders: list };
      }
    } catch {}
    return null;
  },

  createOrder: async (order: OrderRecord, jwt: string): Promise<void> => {
    const response = await fetchWithTimeout(`${currentBaseUrl}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ data: order }),
    });

    if (!response.ok) {
      throw new Error('O servidor não confirmou o pedido.');
    }
  },

  deleteOrder: async (orderId: string, jwt: string): Promise<void> => {
    const response = await fetchWithTimeout(`${currentBaseUrl}/pedidos/${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${jwt}` },
    });

    if (!response.ok) {
      throw new Error('O servidor não confirmou o cancelamento.');
    }
  },
};
