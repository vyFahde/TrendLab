-- ============================================================================
-- TrendLab E-Commerce Acessível — Esquema Relacional SQL (SQLite)
-- ============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produtos (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  original_price REAL,
  rating REAL DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  image_url TEXT NOT NULL,
  fabric TEXT NOT NULL,
  bullet_points_json TEXT NOT NULL,
  available_sizes_json TEXT NOT NULL,
  recommended_size TEXT NOT NULL,
  colors_json TEXT NOT NULL,
  in_stock INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS pedidos (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  total REAL NOT NULL,
  payment_method TEXT NOT NULL,
  address TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  items_count INTEGER NOT NULL DEFAULT 1,
  items_summary_json TEXT NOT NULL,
  user_email TEXT NOT NULL,
  synced_with_backend INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_produtos_category ON produtos(category);
CREATE INDEX IF NOT EXISTS idx_pedidos_user_email ON pedidos(user_email);
