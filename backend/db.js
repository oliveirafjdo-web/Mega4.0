const Database = require("better-sqlite3");
const path = require("path");

// Caminho do arquivo SQLite
// Local: backend/data.sqlite
// Render: você pode setar SQLITE_PATH=/app/backend/data.sqlite (opcional)
const dbPath = process.env.SQLITE_PATH || path.join(__dirname, "data.sqlite");
const db = new Database(dbPath);

// Melhor performance em SQLite para uso simples
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

// Cria tabelas (se não existirem) e garante 1 registro de settings
db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY,
  tax_percent REAL DEFAULT 5,
  expenses_percent REAL DEFAULT 3.5,
  monthly_ads REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avg_cost REAL DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  sale_date TEXT NOT NULL,             -- YYYY-MM-DD
  quantity INTEGER NOT NULL,
  gross_revenue REAL DEFAULT 0,
  ml_fee REAL DEFAULT 0,
  tax_value REAL DEFAULT 0,
  expenses_value REAL DEFAULT 0,
  profit REAL DEFAULT 0,
  source TEXT DEFAULT 'manual',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS inventory_entries (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost REAL NOT NULL,
  total_cost REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

-- garante que existe 1 linha de settings
INSERT INTO settings (id, tax_percent, expenses_percent, monthly_ads)
SELECT 1, 5, 3.5, 0
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);
`);

/**
 * Wrapper compatível com seu código atual:
 * db.query(sql, params) -> Promise<{ rows: [...] }>
 *
 * Suporta placeholders no estilo do pg:
 *  $1, $2, $3...
 * O better-sqlite3 usa "?" por padrão, então fazemos a conversão.
 */
function convertPgParamsToSqlite(sql) {
  // Troca $1, $2, ... por ?
  return sql.replace(/\$\d+/g, "?");
}

function query(sql, params = []) {
  const sqliteSql = convertPgParamsToSqlite(sql);
  const stmt = db.prepare(sqliteSql);

  // Detecta SELECT / PRAGMA / WITH
  const isSelect = /^\s*(select|pragma|with)\b/i.test(sqliteSql);

  if (isSelect) {
    const rows = stmt.all(params);
    return Promise.resolve({ rows });
  }

  // INSERT/UPDATE/DELETE
  const info = stmt.run(params);

  // Se quiser simular RETURNING, faça SELECT separado na rota (como já ajustamos)
  return Promise.resolve({
    rowCount: info.changes,
    lastID: info.lastInsertRowid,
    rows: []
  });
}

module.exports = { query };
