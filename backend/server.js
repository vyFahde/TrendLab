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
 * - POST   /api/produtos                -> Cadastra novo produto
 * - GET    /api/pedidos                 -> Lista pedidos filtrados por e-mail do usuário
 * - POST   /api/pedidos                 -> Registra novo pedido no banco SQL
 * - PUT    /api/pedidos/:id             -> Atualiza pedido existente
 * - DELETE /api/pedidos/:id             -> Cancela e remove um pedido
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 1337;
const SQLITE_PATH = path.join(__dirname, 'trendlab.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_JSON_PATH = path.join(__dirname, 'db.json');
const JWT_SECRET = 'trendlab-secret-key';

const sqliteDb = new DatabaseSync(SQLITE_PATH);

function initSqlDatabase() {
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  sqliteDb.exec(schemaSql);

  // Verifica se o banco SQL já possui dados; se estiver vazio, importa a carga inicial de db.json
  const userCountRow = sqliteDb.prepare('SELECT COUNT(*) AS total FROM users').get();
  const prodCountRow = sqliteDb.prepare('SELECT COUNT(*) AS total FROM produtos').get();

  if (fs.existsSync(SEED_JSON_PATH)) {
    const seedData = JSON.parse(fs.readFileSync(SEED_JSON_PATH, 'utf-8'));

    if (userCountRow.total === 0 && Array.isArray(seedData.users)) {
      const insertUser = sqliteDb.prepare(
        'INSERT OR IGNORE INTO users (id, username, email, password) VALUES (?, ?, ?, ?)'
      );
      for (const u of seedData.users) {
        insertUser.run(u.id, u.username, u.email.toLowerCase(), u.password);
      }
    }

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

initSqlDatabase();

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

// Gera Token JWT assinado com HMAC-SHA256 (Header.Payload.Signature)
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

function sendJson(res, statusCode, payload, sqlLog) {
  if (sqlLog) {
    res.__sqlLog = sqlLog;
  }
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
        database: 'SQLite Relational SQL (backend/trendlab.sqlite)',
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

  // POST /api/auth/local
  if (req.method === 'POST' && pathname === '/api/auth/local') {
    const body = await parseBody(req);
    const identifier = (body.identifier || body.email || '').trim().toLowerCase();
    const password = body.password || '';

    const foundUser = sqliteDb
      .prepare(
        'SELECT id, username, email, password FROM users WHERE (LOWER(email) = ? OR LOWER(username) = ?) AND password = ?'
      )
      .get(identifier, identifier, password);

    if (!foundUser) {
      return sendJson(
        res,
        400,
        {
          data: null,
          error: {
            status: 400,
            name: 'ValidationError',
            message: 'Credenciais inválidas (identifier ou password incorretos).',
          },
        },
        `SELECT * FROM users WHERE email = '${identifier}' AND password = '***' -> 0 rows`
      );
    }

    const jwt = generateJwt(foundUser);
    return sendJson(
      res,
      200,
      {
        jwt,
        user: {
          id: foundUser.id,
          username: foundUser.username,
          email: foundUser.email,
        },
      },
      `SELECT id, username, email FROM users WHERE email = '${identifier}' -> User #${foundUser.id}`
    );
  }

  // POST /api/auth/local/register
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

    let existingUser = sqliteDb
      .prepare('SELECT id, username, email FROM users WHERE LOWER(email) = ?')
      .get(email);

    let sqlLog = `SELECT id, username, email FROM users WHERE email = '${email}'`;

    if (!existingUser) {
      const result = sqliteDb
        .prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)')
        .run(username, email, password);

      existingUser = {
        id: Number(result.lastInsertRowid),
        username,
        email,
      };
      sqlLog = `INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '***') -> ID ${existingUser.id}`;
    }

    const jwt = generateJwt(existingUser);
    return sendJson(
      res,
      201,
      {
        jwt,
        user: {
          id: existingUser.id,
          username: existingUser.username,
          email: existingUser.email,
        },
      },
      sqlLog
    );
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

  // 6. POST /api/produtos (INSERT INTO produtos ...)
  if (req.method === 'POST' && pathname === '/api/produtos') {
    const body = await parseBody(req);
    const payload = body.data || body;
    const id = payload.id || `prod-${Date.now()}`;

    sqliteDb
      .prepare(`
        INSERT INTO produtos (
          id, name, category, price, original_price, rating, review_count,
          image_url, fabric, bullet_points_json, available_sizes_json,
          recommended_size, colors_json, in_stock
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        id,
        payload.name || 'Novo Produto',
        payload.category || 'Camisetas',
        Number(payload.price) || 99.9,
        payload.originalPrice ?? null,
        Number(payload.rating) || 5.0,
        Number(payload.reviewCount) || 1,
        payload.imageUrl || '',
        payload.fabric || '',
        JSON.stringify(payload.bulletPoints || []),
        JSON.stringify(payload.availableSizes || ['P', 'M', 'G']),
        payload.recommendedSize || 'M',
        JSON.stringify(payload.colors || []),
        1
      );

    const created = sqliteDb.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
    return sendJson(
      res,
      201,
      { data: mapProductRow(created) },
      `INSERT INTO produtos (id, name, category, price, ...) VALUES ('${id}', '${payload.name}', ...);`
    );
  }

  // 7. GET /api/pedidos (SELECT * FROM pedidos WHERE user_email = ?)
  if (req.method === 'GET' && pathname === '/api/pedidos') {
    const userFilter = parsedUrl.searchParams.get('filters[usuario]');
    let rows;
    let sqlLog;

    if (userFilter) {
      rows = sqliteDb
        .prepare('SELECT * FROM pedidos WHERE LOWER(user_email) = ? ORDER BY created_at DESC')
        .all(userFilter.toLowerCase());
      sqlLog = `SELECT * FROM pedidos WHERE user_email = '${userFilter.toLowerCase()}' ORDER BY created_at DESC; (${rows.length} rows)`;
    } else {
      rows = sqliteDb.prepare('SELECT * FROM pedidos ORDER BY created_at DESC').all();
      sqlLog = `SELECT * FROM pedidos ORDER BY created_at DESC; (${rows.length} rows)`;
    }

    const pedidos = rows.map(mapOrderRow);
    return sendJson(
      res,
      200,
      {
        data: pedidos,
        meta: { pagination: { total: pedidos.length } },
      },
      sqlLog
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
    const userEmail = (payload.userEmail || 'teresa.tavares@trendlab.com').toLowerCase();

    sqliteDb
      .prepare(`
        INSERT OR REPLACE INTO pedidos (
          id, date, total, payment_method, address, zip_code,
          receiver_name, items_count, items_summary_json, user_email, synced_with_backend
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
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
        userEmail
      );

    const createdRow = sqliteDb.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
    return sendJson(
      res,
      201,
      { data: mapOrderRow(createdRow) },
      `INSERT INTO pedidos (id, total, payment_method, address, user_email) VALUES ('${id}', ${total}, '${paymentMethod}', '${address}', '${userEmail}');`
    );
  }

  // 9. PUT /api/pedidos/:id (UPDATE pedidos SET ... WHERE id = ?)
  if (req.method === 'PUT' && pathname.startsWith('/api/pedidos/')) {
    const id = pathname.split('/').pop();
    const body = await parseBody(req);
    const payload = body.data || body;

    const existing = sqliteDb.prepare('SELECT * FROM pedidos WHERE id = ?').get(String(id));
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
      .prepare('UPDATE pedidos SET address = ?, payment_method = ? WHERE id = ?')
      .run(nextAddress, nextPayment, String(id));

    const updated = sqliteDb.prepare('SELECT * FROM pedidos WHERE id = ?').get(String(id));
    return sendJson(
      res,
      200,
      { data: mapOrderRow(updated) },
      `UPDATE pedidos SET address = '${nextAddress}', payment_method = '${nextPayment}' WHERE id = '${id}';`
    );
  }

  // 10. DELETE /api/pedidos/:id (DELETE FROM pedidos WHERE id = ?)
  if (req.method === 'DELETE' && pathname.startsWith('/api/pedidos/')) {
    const id = pathname.split('/').pop();
    const result = sqliteDb.prepare('DELETE FROM pedidos WHERE id = ?').run(String(id));

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
});

server.listen(PORT, '0.0.0.0', () => {
  const usersCount = sqliteDb.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const prodCount = sqliteDb.prepare('SELECT COUNT(*) AS c FROM produtos').get().c;
  const pedCount = sqliteDb.prepare('SELECT COUNT(*) AS c FROM pedidos').get().c;

  console.log(`=============================================================`);
  console.log(`TrendLab REST WebService + Banco SQL (SQLite) ONLINE`);
  console.log(`URL Base   : http://localhost:${PORT}/api`);
  console.log(`Banco SQL  : backend/trendlab.sqlite (${usersCount} users, ${prodCount} produtos, ${pedCount} pedidos)`);
  console.log(`Esquema DDL: backend/schema.sql`);
  console.log(`Aguardando requisicoes HTTP e executando queries SQL...`);
  console.log(`=============================================================`);
});
