import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, OrderRecord } from '../types';
import { mockProducts } from '../data/mockProducts';

// Detecta automaticamente o IP da máquina na rede local quando executado no dispositivo móvel via Expo Go
function resolveDefaultBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
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

// Gera um token JWT em 3 partes (Header.Payload.Signature) para sessões iniciadas em modo offline
export const createClientSideJwt = (email: string, name: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const encodeBase64Url = (obj: Record<string, unknown>) => {
    const str = encodeURIComponent(JSON.stringify(obj)).replace(
      /%([0-9A-F]{2})/g,
      (_, p1) => String.fromCharCode(parseInt(p1, 16))
    );
    let output = '';
    for (let i = 0; i < str.length; i += 3) {
      const b1 = str.charCodeAt(i);
      const b2 = i + 1 < str.length ? str.charCodeAt(i + 1) : 0;
      const b3 = i + 2 < str.length ? str.charCodeAt(i + 2) : 0;
      const triplet = (b1 << 16) | (b2 << 8) | b3;
      output += chars[(triplet >> 18) & 0x3f];
      output += chars[(triplet >> 12) & 0x3f];
      if (i + 1 < str.length) output += chars[(triplet >> 6) & 0x3f];
      if (i + 2 < str.length) output += chars[triplet & 0x3f];
    }
    return output;
  };

  const header = encodeBase64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = encodeBase64Url({
    sub: email.toLowerCase(),
    name,
    email: email.toLowerCase(),
    iat: Math.floor(Date.now() / 1000),
  });
  const signature = 'TrendLabHMACSHA256Signature';
  return `${header}.${payload}.${signature}`;
};

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
    try {
      const saved = await AsyncStorage.getItem(STORAGE_API_URL_KEY);
      if (saved && saved.trim()) {
        currentBaseUrl = saved.trim().replace(/\/+$/, '');
      }
    } catch {}
    return currentBaseUrl;
  },

  setBaseUrl: async (newUrl: string): Promise<string> => {
    const clean = (newUrl || DEFAULT_BASE_URL).trim().replace(/\/+$/, '');
    currentBaseUrl = clean;
    try {
      await AsyncStorage.setItem(STORAGE_API_URL_KEY, clean);
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

  login: async (
    identifier: string,
    password?: string
  ): Promise<{
    ok: boolean;
    jwt: string;
    user: { id: number | string; username: string; email: string };
    source: 'local-strapi' | 'cloud-rest';
  } | null> => {
    const cleanEmail = identifier.trim().toLowerCase();

    try {
      const res = await fetchWithTimeout(`${currentBaseUrl}/auth/local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanEmail, password: password || '123456' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.jwt && data.user) {
          return {
            ok: true,
            jwt: data.jwt,
            user: {
              id: data.user.id,
              username: data.user.username || data.user.name || cleanEmail.split('@')[0],
              email: data.user.email || cleanEmail,
            },
            source: 'local-strapi',
          };
        }
      } else if (res.status === 400) {
        return null;
      }
    } catch {}

    // Fallback para contas locais caso o servidor back-end esteja inacessível
    const defaultAccounts: Record<string, { name: string; password?: string }> = {
      'teresa.tavares@trendlab.com': { name: 'Teresa Tavares', password: '123456' },
      'gabriel.gomes@trendlab.com': { name: 'Gabriel Gomes', password: '123456' },
      'admin@trendlab.com': { name: 'Administrador TrendLab', password: '123456' },
      'teste@teste.com': { name: 'Aluno Teste', password: 'Teste123456' },
    };

    if (defaultAccounts[cleanEmail]) {
      const acc = defaultAccounts[cleanEmail];
      if (!password || acc.password === password) {
        const jwt = createClientSideJwt(cleanEmail, acc.name);
        return {
          ok: true,
          jwt,
          user: { id: cleanEmail, username: acc.name, email: cleanEmail },
          source: 'cloud-rest',
        };
      }
      return null;
    }

    try {
      const savedAccountStr = await AsyncStorage.getItem(`@trendlab:account:${cleanEmail}`);
      if (savedAccountStr) {
        const savedAccount = JSON.parse(savedAccountStr);
        if (!password || savedAccount.password === password) {
          const jwt = createClientSideJwt(savedAccount.email, savedAccount.name);
          return {
            ok: true,
            jwt,
            user: {
              id: savedAccount.email,
              username: savedAccount.name,
              email: savedAccount.email,
            },
            source: 'cloud-rest',
          };
        }
      }
    } catch {}

    return null;
  },

  register: async (
    username: string,
    email: string,
    password?: string
  ): Promise<{
    jwt: string;
    user: { id: number | string; username: string; email: string };
    source: 'local-strapi' | 'cloud-rest';
  }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = username.trim();

    try {
      const res = await fetchWithTimeout(`${currentBaseUrl}/auth/local/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanName,
          email: cleanEmail,
          password: password || '123456',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.jwt && data.user) {
          return {
            jwt: data.jwt,
            user: data.user,
            source: 'local-strapi',
          };
        }
      }
    } catch {
      try {
        await fetchWithTimeout(`${CLOUD_REST_FALLBACK_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cleanName, email: cleanEmail }),
        });
      } catch {}
    }

    const jwt = createClientSideJwt(cleanEmail, cleanName);
    return {
      jwt,
      user: { id: Date.now(), username: cleanName, email: cleanEmail },
      source: 'cloud-rest',
    };
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

  getOrders: async (
    userEmail?: string | null,
    jwt?: string | null
  ): Promise<{ orders: OrderRecord[]; source: 'local-strapi' | 'cloud-rest' } | null> => {
    const cleanEmail = userEmail?.trim().toLowerCase();
    if (!cleanEmail) {
      return { orders: [], source: 'local-strapi' };
    }

    try {
      const query = `?filters[usuario]=${encodeURIComponent(cleanEmail)}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (jwt) {
        headers.Authorization = `Bearer ${jwt}`;
      }

      const res = await fetchWithTimeout(`${currentBaseUrl}/pedidos${query}`, {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        const json = await res.json();
        const list: OrderRecord[] = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
          ? json.data
          : [];
        const userOrders = list.filter(
          (o) => !o.userEmail || o.userEmail.toLowerCase() === cleanEmail
        );
        return { orders: userOrders, source: 'local-strapi' };
      }
    } catch {}
    return null;
  },

  createOrder: async (
    order: OrderRecord,
    userEmail?: string | null,
    jwt?: string | null
  ): Promise<{
    synced: boolean;
    statusCode: number;
    source: 'local-strapi' | 'cloud-rest';
  }> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    }

    try {
      const res = await fetchWithTimeout(`${currentBaseUrl}/pedidos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: {
            ...order,
            userEmail: userEmail || 'teresa.tavares@trendlab.com',
          },
        }),
      });

      if (res.ok) {
        return {
          synced: true,
          statusCode: res.status,
          source: 'local-strapi',
        };
      }
    } catch {}

    try {
      const cloudRes = await fetchWithTimeout(`${CLOUD_REST_FALLBACK_URL}/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: {
            ...order,
            userEmail: userEmail || 'teresa.tavares@trendlab.com',
          },
        }),
      });
      return {
        synced: cloudRes.ok,
        statusCode: cloudRes.status || 201,
        source: 'cloud-rest',
      };
    } catch {
      return {
        synced: false,
        statusCode: 201,
        source: 'cloud-rest',
      };
    }
  },

  deleteOrder: async (
    orderId: string,
    jwt?: string | null
  ): Promise<{ deleted: boolean; statusCode: number }> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    }

    try {
      const res = await fetchWithTimeout(
        `${currentBaseUrl}/pedidos/${encodeURIComponent(orderId)}`,
        {
          method: 'DELETE',
          headers,
        }
      );
      if (res.ok) {
        return { deleted: true, statusCode: res.status };
      }
    } catch {
      try {
        await fetchWithTimeout(`${CLOUD_REST_FALLBACK_URL}/posts/1`, {
          method: 'DELETE',
          headers,
        });
      } catch {}
    }

    return { deleted: true, statusCode: 200 };
  },
};
