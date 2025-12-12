const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const router = express.Router();

// Importa um lote de vendas manuais (CSV, planilha, etc.)
// body: { sales: [{ sku, date, quantity, gross_revenue, ml_fee }...] }
router.post('/import', async (req, res) => {
  try {
    const { sales } = req.body;
    if (!Array.isArray(sales) || !sales.length) {
      return res.status(400).json({ error: 'Lista de vendas vazia' });
    }

    const settingsRes = await db.query('SELECT * FROM settings LIMIT 1');
    const settings = settingsRes.rows[0];
    const taxPercent = Number(settings.tax_percent) / 100;
    const expensesPercent = Number(settings.expenses_percent) / 100;

    for (const sale of sales) {
      const { sku, date, quantity, gross_revenue, ml_fee } = sale;

      const prodRes = await db.query(
        'SELECT * FROM products WHERE sku = $1',
        [sku]
      );
      if (!prodRes.rows.length) {
        console.warn('Produto não encontrado para SKU:', sku);
        continue;
      }

      const product = prodRes.rows[0];
      const gross = Number(gross_revenue);
      const mlFee = Number(ml_fee || 0);
      const qty = Number(quantity);

      const taxValue = gross * taxPercent;
      const expensesValue = gross * expensesPercent;
      const costValue = qty * Number(product.avg_cost);

      const profit = gross - mlFee - taxValue - expensesValue - costValue;

      const id = uuidv4();
      await db.query(
        `INSERT INTO sales
           (id, product_id, sale_date, quantity,
            gross_revenue, ml_fee, tax_value, expenses_value, profit, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, product.id, date, qty, gross, mlFee, taxValue, expensesValue, profit, 'manual']
      );

      await db.query(
        `UPDATE products
           SET current_stock = current_stock - $1,
               updated_at = NOW()
         WHERE id = $2`,
        [qty, product.id]
      );
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Erro ao importar vendas:', err);
    res.status(500).json({ error: 'Erro ao importar vendas' });
  }
});

// Listagem de vendas com filtro de data e origem
// query: ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&source=manual|mercado_livre
router.get('/list', async (req, res) => {
  try {
    const { date_from, date_to, source, limit = 300 } = req.query;
    let query = `
      SELECT s.id,
             s.sale_date,
             s.quantity,
             s.gross_revenue,
             s.ml_fee,
             s.tax_value,
             s.expenses_value,
             s.profit,
             s.source,
             s.created_at,
             p.sku,
             p.name
      FROM sales s
      JOIN products p ON p.id = s.product_id
    `;
    const params = [];
    const conditions = [];

    if (date_from) {
      params.push(date_from);
      conditions.push(\`s.sale_date >= $\${params.length}\`);
    }
    if (date_to) {
      params.push(date_to);
      conditions.push(\`s.sale_date <= $\${params.length}\`);
    }
    if (source) {
      params.push(source);
      conditions.push(\`s.source = $\${params.length}\`);
    }

    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    params.push(Number(limit));
    query += \` ORDER BY s.sale_date DESC, s.created_at DESC LIMIT $\${params.length}\`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar vendas:', err);
    res.status(500).json({ error: 'Erro ao listar vendas' });
  }
});

// Vendas filtradas apenas Mercado Livre (atalho)
router.get('/ml', async (req, res) => {
  try {
    const { date_from, date_to, limit = 300 } = req.query;
    let query = `
      SELECT s.id,
             s.sale_date,
             s.quantity,
             s.gross_revenue,
             s.ml_fee,
             s.tax_value,
             s.expenses_value,
             s.profit,
             s.source,
             s.created_at,
             p.sku,
             p.name
      FROM sales s
      JOIN products p ON p.id = s.product_id
      WHERE s.source = 'mercado_livre'
    `;
    const params = [];
    if (date_from) {
      params.push(date_from);
      query += \` AND s.sale_date >= $\${params.length}\`;
    }
    if (date_to) {
      params.push(date_to);
      query += \` AND s.sale_date <= $\${params.length}\`;
    }
    params.push(Number(limit));
    query += \` ORDER BY s.sale_date DESC, s.created_at DESC LIMIT $\${params.length}\`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar vendas Mercado Livre:', err);
    res.status(500).json({ error: 'Erro ao listar vendas Mercado Livre' });
  }
});

// Vendas diárias (para gráficos)
router.get('/daily', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT sale_date,
              SUM(gross_revenue) AS total_revenue,
              SUM(profit) AS total_profit
       FROM sales
       GROUP BY sale_date
       ORDER BY sale_date`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar vendas diárias:', err);
    res.status(500).json({ error: 'Erro ao buscar vendas diárias' });
  }
});

module.exports = router;
