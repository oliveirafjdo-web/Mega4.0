CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  expenses_percent NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 3.50,
  stock_min_days INTEGER NOT NULL DEFAULT 15
);

INSERT INTO settings (expenses_percent, tax_percent, stock_min_days)
SELECT 5.00, 3.50, 15
WHERE NOT EXISTS (SELECT 1 FROM settings);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avg_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_entries (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(12,2) NOT NULL,
  total_cost NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  gross_revenue NUMERIC(12,2) NOT NULL,
  ml_fee NUMERIC(12,2) NOT NULL,
  tax_value NUMERIC(12,2) NOT NULL,
  expenses_value NUMERIC(12,2) NOT NULL,
  profit NUMERIC(12,2) NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ml_tokens (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  scope TEXT,
  token_type TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
