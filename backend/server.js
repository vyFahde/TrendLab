/**
 * TrendLab RESTful WebService com Banco de Dados Relacional SQL (SQLite Nativo - node:sqlite)
 * Porta padrão: 1337 (http://localhost:1337/api)
 *
 * Rotas com queries SQL (SELECT, INSERT, UPDATE, DELETE) e Autenticação JWT:
 * - GET    /api/status                  -> Status do servidor e contagem de registros
 * - POST   /api/auth/local              -> Autenticação de usuário (retorna JWT)
 * - POST   /api/auth/local/register     -> Cadastro de novo usuário (retorna JWT)
 * - GET    /api/produtos                -> Lista catálogo de produtos
 * - GET    /api/produtos/:id            -> Busca produto por ID
 * - GET    /api/pedidos                 -> Lista pedidos filtrados por e-mail do usuário
 * - POST   /api/pedidos                 -> Registra novo pedido no banco SQL
 * - PUT    /api/pedidos/:id             -> Atualiza pedido existente
 * - DELETE /api/pedidos/:id             -> Cancela e remove um pedido
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { hashPassword, verifyPassword, migratePasswords, issueSession, verifyJwt } = require('./auth');

const PORT = Number(process.env.PORT || 1337);
const SQLITE_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'trendlab.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_JSON_PATH = path.join(__dirname, 'db.json');
const JWT_SECRET = process.env.JWT_SECRET;

const isHexSecret = /^[a-f0-9]{64}$/i.test(JWT_SECRET || '');
const isBase64Secret = /^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/.test(JWT_SECRET || '');

if (!isHexSecret && !isBase64Secret) {
  throw new Error('Defina JWT_SECRET com 32 bytes aleatórios em hexadecimal ou Base64.');
}

const sqliteDb = new DatabaseSync(SQLITE_PATH, { timeout: 5000 });

async function initSqlDatabase() {
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  sqliteDb.exec(schemaSql);
  await migratePasswords(sqliteDb);

  const prodCountRow = sqliteDb.prepare('SELECT COUNT(*) AS total FROM produtos').get();

  if (fs.existsSync(SEED_JSON_PATH)) {
    const seedData = JSON.parse(fs.readFileSync(SEED_JSON_PATH, 'utf-8'));

    if (prodCountRow.total === 0 && Array.isArray(seedData.produtos)) {
      const insertProd = sqliteDb.prepare(`
        INSERT OR IGNORE INTO produtos (
          id, name, category, price, original_price, rating, review_count,
          image_url, fabric, bullet_points_json, available_sizes_json,
          recommended_size, colors_json, in_stock
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of seedData.produtos) {
        insertProd.run(
          p.id,
          p.name,
          p.category,
          p.price,
          p.originalPrice ?? null,
          p.rating ?? 5.0,
          p.reviewCount ?? 0,
          p.imageUrl,
          p.fabric,
          JSON.stringify(p.bulletPoints || []),
          JSON.stringify(p.availableSizes || []),
          p.recommendedSize || 'M',
          JSON.stringify(p.colors || []),
          p.inStock === false ? 0 : 1
        );
      }
    }

    const orderCountRow = sqliteDb.prepare('SELECT COUNT(*) AS total FROM pedidos').get();
    if (orderCountRow.total === 0 && Array.isArray(seedData.pedidos)) {
      const insertOrder = sqliteDb.prepare(`
        INSERT OR IGNORE INTO pedidos (
          id, date, total, payment_method, address, zip_code,
          receiver_name, items_count, items_summary_json, user_email, synced_with_backend
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const o of seedData.pedidos) {
        insertOrder.run(
          o.id,
          o.date,
          Number(o.total) || 0,
          o.paymentMethod || 'pix',
          o.address || '',
          o.zipCode || '',
          o.receiverName || '',
          Number(o.itemsCount) || 1,
          JSON.stringify(o.itemsSummary || []),
          (o.userEmail || 'teresa.tavares@trendlab.com').toLowerCase(),
          1
        );
      }
    }
  }
}

// Converte uma linha SQL da tabela 'produtos' para o formato JSON esperado pelo App
function mapProductRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    imageUrl: row.image_url,
    fabric: row.fabric,
    bulletPoints: JSON.parse(row.bullet_points_json || '[]'),
    availableSizes: JSON.parse(row.available_sizes_json || '[]'),
    recommendedSize: row.recommended_size,
    colors: JSON.parse(row.colors_json || '[]'),
    inStock: Boolean(row.in_stock),
  };
}

// Converte uma linha SQL da tabela 'pedidos' para o formato JSON esperado pelo App
function mapOrderRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    date: row.date,
    total: Number(row.total),
    paymentMethod: row.payment_method,
    address: row.address,
    zipCode: row.zip_code,
    receiverName: row.receiver_name,
    itemsCount: Number(row.items_count),
    itemsSummary: JSON.parse(row.items_summary_json || '[]'),
    userEmail: row.user_email,
    syncedWithBackend: Boolean(row.synced_with_backend),
  };
}

const maxBodyBytes = 64 * 1024;
const authWindowMs = 60_000;
const maxConcurrentAuth = 4;
const authAttempts = new Map();
let authWindowEndsAt = 0;
let activeAuthRequests = 0;

function reserveAuthAttempt(req, registration) {
  const now = Date.now();
  if (now >= authWindowEndsAt) {
    authAttempts.clear();
    authWindowEndsAt = now + authWindowMs;
  }

  const address = req.socket.remoteAddress || 'unknown';
  if (activeAuthRequests >= maxConcurrentAuth ||
      (!authAttempts.has(address) && authAttempts.size >= 2048)) return false;

  const attempts = authAttempts.get(address) || { login: 0, register: 0 };
  const kind = registration ? 'register' : 'login';
  if (attempts[kind] >= (registration ? 10 : 30)) return false;
  attempts[kind] += 1;
  authAttempts.set(address, attempts);
  return true;
}

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    req.on('error', reject);
    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBodyBytes) {
        chunks.length = 0;
        reject(new RequestError(413, 'Requisição excede o limite de 64 KB.'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (bytes > maxBodyBytes) return;
      if (!bytes) return resolve({});
      try {
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (value && typeof value === 'object' && !Array.isArray(value)) return resolve(value);
      } catch {
        // Responda com o mesmo erro para JSON inválido e tipos não aceitos.
      }
      reject(new RequestError(400, 'Envie um objeto JSON válido.'));
    });
  });
}

function sendJson(res, statusCode, payload, sqlLog) {
  if (sqlLog) {
    res.__sqlLog = sqlLog;
  }
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(payload));
}

async function handleRequest(req, res) {
  const startTime = Date.now();

  res.on('finish', () => {
    if (req.method === 'OPTIONS') return;
    const duration = Date.now() - startTime;
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const hasAuth = req.headers.authorization ? ' [JWT]' : '';
    console.log(
      `[${timestamp}] ${req.method.padEnd(6)} ${req.url.split('?')[0]} -> Status ${res.statusCode} (${duration}ms)${hasAuth}`
    );
    if (res.__sqlLog) {
      console.log(`           SQL    ${res.__sqlLog}`);
    }
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

  // GET /api/status
  if (req.method === 'GET' && (pathname === '/api/status' || pathname === '/api')) {
    const usersCount = sqliteDb.prepare('SELECT COUNT(*) AS c FROM users').get().c;
    const prodCount = sqliteDb.prepare('SELECT COUNT(*) AS c FROM produtos').get().c;
    const pedCount = sqliteDb.prepare('SELECT COUNT(*) AS c FROM pedidos').get().c;

    return sendJson(
      res,
      200,
      {
        status: 'online',
        database: 'SQLite Relational SQL',
        service: 'TrendLab RESTful WebService (Strapi v4 Compatible)',
        timestamp: new Date().toISOString(),
        counts: {
          users: usersCount,
          produtos: prodCount,
          pedidos: pedCount,
        },
      },
      'SELECT COUNT(*) FROM users, produtos, pedidos;'
    );
  }

  const isRegistration = pathname === '/api/auth/local/register';
  if (req.method === 'POST' && (pathname === '/api/auth/local' || isRegistration)) {
    if (!reserveAuthAttempt(req, isRegistration)) {
      req.resume();
      res.setHeader('Retry-After', '60');
      return sendJson(res, 429, { error: { message: 'Muitas tentativas. Aguarde um minuto e tente novamente.' } });
    }

    activeAuthRequests += 1;
    try {
      const body = await parseBody(req);
      return await authenticate(res, body, isRegistration);
    } finally {
      activeAuthRequests -= 1;
    }
  }

  // 4. GET /api/produtos (SELECT * FROM produtos)
  if (req.method === 'GET' && pathname === '/api/produtos') {
    const categoryFilter = parsedUrl.searchParams.get('filters[category]');
    let rows;
    let sqlLog;

    if (categoryFilter && categoryFilter !== 'Todas') {
      rows = sqliteDb
        .prepare('SELECT * FROM produtos WHERE category = ? ORDER BY id ASC')
        .all(categoryFilter);
      sqlLog = `SELECT * FROM produtos WHERE category = '${categoryFilter}' ORDER BY id ASC; (${rows.length} rows)`;
    } else {
      rows = sqliteDb.prepare('SELECT * FROM produtos ORDER BY id ASC').all();
      sqlLog = `SELECT * FROM produtos ORDER BY id ASC; (${rows.length} rows)`;
    }

    const lista = rows.map(mapProductRow);
    return sendJson(
      res,
      200,
      {
        data: lista,
        meta: { pagination: { total: lista.length } },
      },
      sqlLog
    );
  }

  // 5. GET /api/produtos/:id (SELECT * FROM produtos WHERE id = ?)
  if (req.method === 'GET' && pathname.startsWith('/api/produtos/')) {
    const id = pathname.split('/').pop();
    const row = sqliteDb.prepare('SELECT * FROM produtos WHERE id = ?').get(String(id));
    if (!row) {
      return sendJson(
        res,
        404,
        { error: { status: 404, message: 'Produto não encontrado' } },
        `SELECT * FROM produtos WHERE id = '${id}' -> 0 rows`
      );
    }
    return sendJson(
      res,
      200,
      { data: mapProductRow(row) },
      `SELECT * FROM produtos WHERE id = '${id}';`
    );
  }

  if (req.method === 'POST' && pathname === '/api/produtos') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return sendJson(res, 405, { error: { message: 'O catálogo é somente leitura.' } });
  }

  let orderUserEmail;
  if (pathname === '/api/pedidos' || pathname.startsWith('/api/pedidos/')) {
    const userId = verifyJwt(req.headers.authorization, JWT_SECRET);
    const user = userId === null ? undefined : sqliteDb
      .prepare('SELECT email FROM users WHERE id = ?')
      .get(userId);

    if (!user) {
      return sendJson(res, 401, { error: { message: 'Entre novamente para acessar seus pedidos.' } });
    }
    orderUserEmail = user.email.toLowerCase();
  }

  // 7. GET /api/pedidos
  if (req.method === 'GET' && pathname === '/api/pedidos') {
    const rows = sqliteDb
      .prepare('SELECT * FROM pedidos WHERE LOWER(user_email) = ? ORDER BY created_at DESC')
      .all(orderUserEmail);

    const pedidos = rows.map(mapOrderRow);
    return sendJson(
      res,
      200,
      {
        data: pedidos,
        meta: { pagination: { total: pedidos.length } },
      },
      'SELECT * FROM pedidos WHERE LOWER(user_email) = ? ORDER BY created_at DESC;'
    );
  }

  // 8. POST /api/pedidos (INSERT INTO pedidos ...)
  if (req.method === 'POST' && pathname === '/api/pedidos') {
    const body = await parseBody(req);
    const payload = body.data || body;
    const id = payload.id || `TL-${Math.floor(100000 + Math.random() * 900000)}`;
    const date = payload.date || new Date().toLocaleDateString('pt-BR');
    const total = Number(payload.total) || 0;
    const paymentMethod = payload.paymentMethod || 'pix';
    const address = payload.address || '';
    const zipCode = payload.zipCode || '';
    const receiverName = payload.receiverName || '';
    const itemsCount = Number(payload.itemsCount) || 1;
    const itemsSummary = Array.isArray(payload.itemsSummary) ? payload.itemsSummary : [];

    const result = sqliteDb
      .prepare(`
        INSERT INTO pedidos (
          id, date, total, payment_method, address, zip_code,
          receiver_name, items_count, items_summary_json, user_email, synced_with_backend
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(id) DO NOTHING
      `)
      .run(
        id,
        date,
        total,
        paymentMethod,
        address,
        zipCode,
        receiverName,
        itemsCount,
        JSON.stringify(itemsSummary),
        orderUserEmail
      );

    if (result.changes === 0) {
      return sendJson(res, 409, { error: { message: 'Já existe um pedido com este código.' } });
    }

    const createdRow = sqliteDb.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
    return sendJson(
      res,
      201,
      { data: mapOrderRow(createdRow) },
      'INSERT INTO pedidos (...) VALUES (...);'
    );
  }

  // 9. PUT /api/pedidos/:id (UPDATE pedidos SET ... WHERE id = ?)
  if (req.method === 'PUT' && pathname.startsWith('/api/pedidos/')) {
    const id = pathname.split('/').pop();
    const body = await parseBody(req);
    const payload = body.data || body;

    const existing = sqliteDb.prepare('SELECT * FROM pedidos WHERE id = ? AND LOWER(user_email) = ?')
      .get(String(id), orderUserEmail);
    if (!existing) {
      return sendJson(
        res,
        404,
        { error: { status: 404, message: 'Pedido não encontrado' } },
        `SELECT * FROM pedidos WHERE id = '${id}' -> 0 rows`
      );
    }

    const nextAddress = payload.address ?? existing.address;
    const nextPayment = payload.paymentMethod ?? existing.payment_method;

    sqliteDb
      .prepare('UPDATE pedidos SET address = ?, payment_method = ? WHERE id = ? AND LOWER(user_email) = ?')
      .run(nextAddress, nextPayment, String(id), orderUserEmail);

    const updated = sqliteDb.prepare('SELECT * FROM pedidos WHERE id = ?').get(String(id));
    return sendJson(
      res,
      200,
      { data: mapOrderRow(updated) },
      'UPDATE pedidos SET address = ?, payment_method = ? WHERE id = ?;'
    );
  }

  // 10. DELETE /api/pedidos/:id (DELETE FROM pedidos WHERE id = ?)
  if (req.method === 'DELETE' && pathname.startsWith('/api/pedidos/')) {
    const id = pathname.split('/').pop();
    const result = sqliteDb.prepare('DELETE FROM pedidos WHERE id = ? AND LOWER(user_email) = ?')
      .run(String(id), orderUserEmail);

    if (result.changes === 0) {
      return sendJson(
        res,
        404,
        { error: { status: 404, message: 'Pedido não encontrado' } },
        `DELETE FROM pedidos WHERE id = '${id}'; (0 rows affected)`
      );
    }

    return sendJson(
      res,
      200,
      { data: { id, deleted: true } },
      `DELETE FROM pedidos WHERE id = '${id}'; (${result.changes} row deleted)`
    );
  }

  return sendJson(res, 404, {
    error: {
      status: 404,
      name: 'NotFoundError',
      message: `Rota ${req.method} ${pathname} não encontrada no WebService TrendLab.`,
    },
  });
}

async function authenticate(res, body, isRegistration) {
  if (!isRegistration) {
    const rawIdentifier = body.identifier ?? body.email;
    const identifier = typeof rawIdentifier === 'string' ? rawIdentifier.trim().toLowerCase() : '';
    const { password } = body;

    if (!identifier || typeof password !== 'string' || !password || password.length > 256) {
      return sendJson(res, 400, { error: { message: 'Credenciais inválidas.' } });
    }

    const candidates = sqliteDb.prepare(
      'SELECT id, username, email, password_hash FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?'
    ).all(identifier, identifier);

    for (const user of candidates) {
      if (await verifyPassword(password, user.password_hash)) {
        return sendJson(res, 200, issueSession(user, JWT_SECRET));
      }
    }
    if (candidates.length === 0) await verifyPassword(password, '');

    return sendJson(res, 400, { error: { message: 'Credenciais inválidas.' } });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const rawName = body.username ?? body.name;
  const username = typeof rawName === 'string' ? rawName.trim() : email.split('@')[0];
  const { password } = body;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !username ||
      typeof password !== 'string' || password.length < 6 || password.length > 256) {
    return sendJson(res, 400, { error: { message: 'Informe nome, e-mail e uma senha de 6 a 256 caracteres.' } });
  }

  const passwordHash = await hashPassword(password);
  const result = sqliteDb.prepare(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING'
  ).run(username, email, passwordHash);
  if (result.changes === 0) {
    return sendJson(res, 409, { error: { message: 'Já existe uma conta com este e-mail.' } });
  }

  const user = { id: Number(result.lastInsertRowid), username, email };
  return sendJson(res, 201, issueSession(user, JWT_SECRET));
}

const server = http.createServer({ requestTimeout: 15_000, headersTimeout: 10_000 }, (req, res) => {
  handleRequest(req, res).catch((error) => {
    if (res.destroyed) return;
    if (error instanceof RequestError) {
      return sendJson(res, error.status, { error: { message: error.message } });
    }
    console.error('Falha ao processar requisição:', error.name);
    sendJson(res, 500, { error: { message: 'Falha interna ao processar a requisição.' } });
  });
});

initSqlDatabase().then(() => {
  server.listen(PORT, '0.0.0.0', logStartup);
}).catch((error) => {
  console.error('Falha ao inicializar o banco SQLite:', error.message);
  process.exitCode = 1;
});

function logStartup() {
  const usersCount = sqliteDb.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const prodCount = sqliteDb.prepare('SELECT COUNT(*) AS c FROM produtos').get().c;
  const pedCount = sqliteDb.prepare('SELECT COUNT(*) AS c FROM pedidos').get().c;

  console.log(`=============================================================`);
  console.log(`TrendLab REST WebService + Banco SQL (SQLite) ONLINE`);
  console.log(`URL Base   : http://localhost:${PORT}/api`);
  console.log(`Banco SQL  : ${SQLITE_PATH} (${usersCount} users, ${prodCount} produtos, ${pedCount} pedidos)`);
  console.log(`Esquema DDL: backend/schema.sql`);
  console.log(`Aguardando requisicoes HTTP e executando queries SQL...`);
  console.log(`=============================================================`);
}
