const Database = require("better-sqlite3");
const path = require("path");

// arquivo do banco (persistente no ambiente local; no Render free pode resetar em redeploy)
const dbPath = process.env.SQLITE_PATH || path.join(__dirname, "data.sqlite");
const db = new Database(dbPath);

// cria tabelas básicas (se não existirem)
db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tax_percent REAL DEFAULT 5,
  expenses_percent REAL DEFAULT 3.5,
  monthly_ads REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE,
  name TEXT,
  avg_cost REAL DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  sale_date TEXT,
  quantity INTEGER,
  gross_revenue REAL,
  ml_fee REAL,
  tax_value REAL,
  expenses_value REAL,
  profit REAL,
  source TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

-- cria settings inicial (1 registro)
INSERT INTO settings (id, tax_percent, expenses_percent, monthly_ads)
SELECT 1, 5, 3.5, 0
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);
`);

function query(sql, params = []) {
  const stmt = db.prepare(sql);

  // SELECT
  if (/^\s*select/i.test(sql)) {
    const rows = stmt.all(params);
    return Promise.resolve({ rows });
  }

  // INSERT/UPDATE/DELETE
  const info = stmt.run(params);
  return Promise.resolve({
    rowCount: info.changes,
    lastID: info.lastInsertRowid,
    rows: []
  });
}

module.exports = { query };
