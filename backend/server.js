/**
 * TrendLab RESTful WebService (Compatível com o padrão Strapi / REST das aulas PM-14 e PM-15)
 * Porta padrão: 1337 (http://localhost:1337/api)
 *
 * Rotas implementadas (Nível 2/3 de Maturidade de Richardson + Autenticação JWT):
 * - GET    /api/status                  -> Status do servidor WebService
 * - POST   /api/auth/local              -> Login (retorna { jwt, user })
 * - POST   /api/auth/local/register     -> Cadastro de Usuário (retorna { jwt, user })
 * - GET    /api/produtos                -> Lista catálogo de produtos (suporta filtros)
 * - GET    /api/produtos/:id            -> Busca produto por ID
 * - POST   /api/produtos                -> Cadastra novo produto
 * - GET    /api/pedidos                 -> Lista pedidos do usuário (JWT)
 * - POST   /api/pedidos                 -> Registra novo pedido no banco (JWT)
 * - PUT    /api/pedidos/:id             -> Atualiza status/endereço de um pedido
 * - DELETE /api/pedidos/:id             -> Cancela/remove um pedido do histórico
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 1337;
const DB_PATH = path.join(__dirname, 'db.json');
const JWT_SECRET = 'trendlab-secret-key-pm14';

function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { users: [], produtos: [], pedidos: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar db.json:', err);
  }
}

// Geração de Token JWT real em 3 partes (Header.Payload.Signature) conforme Slide PM-14
function generateJwt(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: String(user.id),
      id: user.id,
      email: user.email,
      name: user.username,
      iat: Math.floor(Date.now() / 1000),
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  const startTime = Date.now();

  res.on('finish', () => {
    if (req.method === 'OPTIONS') return;
    const duration = Date.now() - startTime;
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const hasAuth = req.headers.authorization ? ' [JWT]' : '';
    console.log(
      `[${timestamp}] ${req.method.padEnd(6)} ${decodeURIComponent(req.url)} -> Status ${res.statusCode} (${duration}ms)${hasAuth}`
    );
  });

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname.replace(/\/+$/, '');
  const db = readDb();

  // 1. Healthcheck / Status
  if (req.method === 'GET' && (pathname === '/api/status' || pathname === '/api')) {
    return sendJson(res, 200, {
      status: 'online',
      service: 'TrendLab RESTful WebService (Strapi v4 Compatible)',
      timestamp: new Date().toISOString(),
      counts: {
        users: db.users.length,
        produtos: db.produtos.length,
        pedidos: db.pedidos.length,
      },
      _links: {
        self: `http://localhost:${PORT}/api/status`,
        produtos: `http://localhost:${PORT}/api/produtos`,
        pedidos: `http://localhost:${PORT}/api/pedidos`,
        login: `http://localhost:${PORT}/api/auth/local`,
        register: `http://localhost:${PORT}/api/auth/local/register`,
      },
    });
  }

  // 2. Autenticação JWT - Login (Slide PM-15: POST /api/auth/local)
  if (req.method === 'POST' && pathname === '/api/auth/local') {
    const body = await parseBody(req);
    const identifier = (body.identifier || body.email || '').trim().toLowerCase();
    const password = body.password || '';

    const foundUser = db.users.find(
      (u) =>
        (u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier) &&
        u.password === password
    );

    if (!foundUser) {
      return sendJson(res, 400, {
        data: null,
        error: {
          status: 400,
          name: 'ValidationError',
          message: 'Credenciais inválidas (identifier ou password incorretos).',
        },
      });
    }

    const jwt = generateJwt(foundUser);
    return sendJson(res, 200, {
      jwt,
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
      },
    });
  }

  // 3. Autenticação JWT - Cadastro (Slide PM-15: POST /api/auth/local/register)
  if (req.method === 'POST' && pathname === '/api/auth/local/register') {
    const body = await parseBody(req);
    const email = (body.email || '').trim().toLowerCase();
    const username = (body.username || body.name || email.split('@')[0]).trim();
    const password = body.password || '123456';

    if (!email) {
      return sendJson(res, 400, {
        error: { status: 400, message: 'O campo email é obrigatório.' },
      });
    }

    let existingUser = db.users.find((u) => u.email.toLowerCase() === email);
    if (!existingUser) {
      existingUser = {
        id: db.users.length + 1,
        username,
        email,
        password,
      };
      db.users.push(existingUser);
      writeDb(db);
    }

    const jwt = generateJwt(existingUser);
    return sendJson(res, 201, {
      jwt,
      user: {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
      },
    });
  }

  // 4. GET /api/produtos (Lista todos os produtos ou filtra por categoria)
  if (req.method === 'GET' && pathname === '/api/produtos') {
    const categoryFilter = parsedUrl.searchParams.get('filters[category]');
    let lista = db.produtos;
    if (categoryFilter && categoryFilter !== 'Todas') {
      lista = lista.filter((p) => p.category === categoryFilter);
    }
    return sendJson(res, 200, {
      data: lista,
      meta: { pagination: { total: lista.length } },
    });
  }

  // 5. GET /api/produtos/:id
  if (req.method === 'GET' && pathname.startsWith('/api/produtos/')) {
    const id = pathname.split('/').pop();
    const prod = db.produtos.find((p) => String(p.id) === String(id));
    if (!prod) {
      return sendJson(res, 404, { error: { status: 404, message: 'Produto não encontrado' } });
    }
    return sendJson(res, 200, { data: prod });
  }

  // 6. POST /api/produtos
  if (req.method === 'POST' && pathname === '/api/produtos') {
    const body = await parseBody(req);
    const payload = body.data || body;
    const newProd = {
      id: payload.id || `prod-${Date.now()}`,
      ...payload,
    };
    db.produtos.push(newProd);
    writeDb(db);
    return sendJson(res, 201, { data: newProd });
  }

  // 7. GET /api/pedidos
  if (req.method === 'GET' && pathname === '/api/pedidos') {
    const userFilter = parsedUrl.searchParams.get('filters[usuario]');
    let pedidos = db.pedidos;
    if (userFilter) {
      pedidos = pedidos.filter(
        (p) => (p.userEmail || '').toLowerCase() === userFilter.toLowerCase()
      );
    }
    return sendJson(res, 200, {
      data: pedidos,
      meta: { pagination: { total: pedidos.length } },
    });
  }

  // 8. POST /api/pedidos (Cria pedido enviado pelo Checkout)
  if (req.method === 'POST' && pathname === '/api/pedidos') {
    const body = await parseBody(req);
    const payload = body.data || body;
    const newOrder = {
      id: payload.id || `TL-${Math.floor(100000 + Math.random() * 900000)}`,
      date: payload.date || new Date().toLocaleDateString('pt-BR'),
      total: Number(payload.total) || 0,
      paymentMethod: payload.paymentMethod || 'pix',
      address: payload.address || '',
      zipCode: payload.zipCode || '',
      receiverName: payload.receiverName || '',
      itemsCount: Number(payload.itemsCount) || 1,
      itemsSummary: Array.isArray(payload.itemsSummary) ? payload.itemsSummary : [],
      userEmail: payload.userEmail || 'teresa.tavares@trendlab.com',
      syncedWithBackend: true,
    };
    db.pedidos.unshift(newOrder);
    writeDb(db);
    return sendJson(res, 201, { data: newOrder });
  }

  // 9. PUT /api/pedidos/:id (Atualiza pedido existente)
  if (req.method === 'PUT' && pathname.startsWith('/api/pedidos/')) {
    const id = pathname.split('/').pop();
    const body = await parseBody(req);
    const payload = body.data || body;
    const idx = db.pedidos.findIndex((p) => String(p.id) === String(id));
    if (idx === -1) {
      return sendJson(res, 404, { error: { status: 404, message: 'Pedido não encontrado' } });
    }
    db.pedidos[idx] = { ...db.pedidos[idx], ...payload };
    writeDb(db);
    return sendJson(res, 200, { data: db.pedidos[idx] });
  }

  // 10. DELETE /api/pedidos/:id (Remove pedido do banco)
  if (req.method === 'DELETE' && pathname.startsWith('/api/pedidos/')) {
    const id = pathname.split('/').pop();
    const initialLen = db.pedidos.length;
    db.pedidos = db.pedidos.filter((p) => String(p.id) !== String(id));
    if (db.pedidos.length === initialLen) {
      return sendJson(res, 404, { error: { status: 404, message: 'Pedido não encontrado' } });
    }
    writeDb(db);
    return sendJson(res, 200, { data: { id, deleted: true } });
  }

  return sendJson(res, 404, {
    error: {
      status: 404,
      name: 'NotFoundError',
      message: `Rota ${req.method} ${pathname} não encontrada no WebService TrendLab.`,
    },
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=====================================================`);
  console.log(`TrendLab REST WebService (Strapi Compatible) ONLINE`);
  console.log(`URL Base: http://localhost:${PORT}/api`);
  console.log(`Rotas: /api/status | /api/auth/local | /api/produtos | /api/pedidos`);
  console.log(`Aguardando requisicoes HTTP do aplicativo...`);
  console.log(`=====================================================`);
});
