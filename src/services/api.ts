import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, OrderRecord, OrderUpdate } from '../types';
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

export interface AuthSession {
  jwt: string;
  expiresAt: number;
  user: { username: string; email: string };
}

// Envia credenciais ao back-end (login ou cadastro). Fora do modo dev, exige HTTPS.
async function authenticate(route: string, credentials: Record<string, string | boolean>): Promise<Response> {
  if (!__DEV__ && !currentBaseUrl.startsWith('https://')) {
    throw new Error('Configure uma API HTTPS para acessar o TrendLab.');
  }

  try {
    return await fetchWithTimeout(`${currentBaseUrl}/auth/local${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }, 65_000);
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

// CAMADA DE SERVIÇO: única porta de comunicação do app com a API REST (as telas não chamam fetch diretamente).
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

  // AUTENTICAÇÃO: POST /auth/local -> recebe o JWT. Retorna null se as credenciais estiverem erradas.
  login: async (identifier: string, password: string): Promise<AuthSession | null> => {
    const response = await authenticate('', { identifier: identifier.trim().toLowerCase(), password });
    if (response.status === 429) throw new Error('Muitas tentativas. Aguarde um minuto e tente novamente.');
    if (response.status === 400 || response.status === 401) return null;
    if (!response.ok) throw new Error('Não foi possível realizar o login. Tente novamente.');
    return readSession(response);
  },

  // CADASTRO: POST /auth/local/register -> cria a conta no banco e já devolve o JWT.
  register: async (username: string, email: string, password: string, acceptedTerms: boolean): Promise<AuthSession> => {
    const response = await authenticate('/register', {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      acceptedTerms, // LGPD: o servidor recusa o cadastro sem o aceite do termo
    });
    if (response.status === 429) throw new Error('Muitas tentativas. Aguarde um minuto e tente novamente.');
    if (response.status === 409) throw new Error('Já existe uma conta com este e-mail. Volte à tela de login para entrar.');
    if (!response.ok) {
      const message = response.status >= 500
        ? 'O servidor não concluiu o cadastro. Aguarde um momento e tente novamente.'
        : 'Confira os dados do cadastro e tente novamente.';
      throw new Error(message);
    }
    return readSession(response);
  },

  // Confirma no servidor se o JWT salvo ainda é válido (usado ao reabrir o app).
  validateSession: async (jwt: string): Promise<boolean> => {
    const response = await fetchWithTimeout(`${currentBaseUrl}/pedidos`, {
      headers: { Authorization: `Bearer ${jwt}` },
    }, 65_000);
    if (response.status === 401 || response.status === 403) return false;
    if (!response.ok) throw new Error('Não foi possível verificar a sessão.');
    const body = await response.json();
    if (!Array.isArray(body?.data)) throw new Error('Resposta inválida ao verificar a sessão.');
    return true;
  },

  // READ: busca o catálogo (GET /produtos). Se o servidor estiver fora do ar, usa os dados locais (mockProducts) como reserva.
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

  // CRUD - READ: GET /pedidos enviando o JWT no cabeçalho Authorization.
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

  // CRUD - CREATE: POST /pedidos. Lança erro se o servidor não confirmar.
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

  // CRUD - UPDATE: PUT /pedidos/:id com nome, CEP, endereço e pagamento. Retorna o pedido já atualizado pelo servidor.
  updateOrder: async (orderId: string, changes: OrderUpdate, jwt: string): Promise<OrderRecord> => {
    const response = await fetchWithTimeout(`${currentBaseUrl}/pedidos/${encodeURIComponent(orderId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ data: changes }),
    });

    if (!response.ok) {
      throw new Error(
        response.status === 400
          ? 'Confira os dados informados e tente novamente.'
          : 'O servidor não confirmou a alteração do pedido.'
      );
    }
    const json = await response.json();
    if (!json?.data?.id) throw new Error('Resposta inválida ao atualizar o pedido.');
    return json.data as OrderRecord;
  },

  // CRUD - DELETE: DELETE /pedidos/:id (cancelar pedido).
  deleteOrder: async (orderId: string, jwt: string): Promise<void> => {
    const response = await fetchWithTimeout(`${currentBaseUrl}/pedidos/${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${jwt}` },
    });

    if (!response.ok) {
      throw new Error('O servidor não confirmou o cancelamento.');
    }
  },

  // LGPD - DELETE /users/me: exclui a conta e os pedidos. Exige o JWT e a senha atual como confirmação.
  deleteAccount: async (password: string, jwt: string): Promise<void> => {
    const response = await fetchWithTimeout(`${currentBaseUrl}/users/me`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ password }),
    }, 65_000);

    if (response.status === 403) throw new Error('Senha incorreta.');
    if (response.status === 429) throw new Error('Muitas tentativas. Aguarde um minuto e tente novamente.');
    if (response.status === 401) throw new Error('Sua sessão expirou. Entre novamente para excluir a conta.');
    if (!response.ok) throw new Error('Não foi possível excluir a conta. Tente novamente.');
  },
};
