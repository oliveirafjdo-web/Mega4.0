const express = require('express');
const db = require('../db');
const router = express.Router();

/**
 * GET /api/dashboard
 * Retorna:
 * - totals: total_revenue, total_profit, total_quantity
 * - daily: [{ sale_date, quantity, revenue, profit }] (últimos 30 dias)
 * - top_products: [{ sku, quantity, revenue, profit }] (top 10 por receita)
 */
router.get('/', async (req, res) => {
  try {
    // 1) Totais gerais
    const totalsRes = await db.query(
      `
      SELECT
        COALESCE(SUM(gross_revenue), 0) AS total_revenue,
        COALESCE(SUM(profit), 0)        AS total_profit,
        COALESCE(SUM(quantity), 0)      AS total_quantity
      FROM sales
      `,
      []
    );

    const totals = totalsRes.rows && totalsRes.rows[0]
      ? totalsRes.rows[0]
      : { total_revenue: 0, total_profit: 0, total_quantity: 0 };

    // normaliza para número (SQLite pode retornar number; se vier string, converte)
    totals.total_revenue = Number(totals.total_revenue || 0);
    totals.total_profit = Number(totals.total_profit || 0);
    totals.total_quantity = Number(totals.total_quantity || 0);

    // 2) Diário (últimos 30 dias)
    const dailyRes = await db.query(
      `
      SELECT
        sale_date,
        COALESCE(SUM(quantity), 0)      AS quantity,
        COALESCE(SUM(gross_revenue), 0) AS revenue,
        COALESCE(SUM(profit), 0)        AS profit
      FROM sales
      GROUP BY sale_date
      ORDER BY sale_date DESC
      LIMIT 30
      `,
      []
    );

    // deixa em ordem cronológica (mais antigo -> mais novo)
    const daily = Array.isArray(dailyRes.rows) ? dailyRes.rows.slice().reverse() : [];
    for (const d of daily) {
      d.quantity = Number(d.quantity || 0);
      d.revenue = Number(d.revenue || 0);
      d.profit = Number(d.profit || 0);
      // sale_date fica como string YYYY-MM-DD (como você grava no import)
    }

    // 3) Top produtos por receita (top 10)
    const topRes = await db.query(
      `
      SELECT
        p.sku                               AS sku,
        COALESCE(SUM(s.quantity), 0)        AS quantity,
        COALESCE(SUM(s.gross_revenue), 0)   AS revenue,
        COALESCE(SUM(s.profit), 0)          AS profit
      FROM sales s
      JOIN products p ON p.id = s.product_id
      GROUP BY p.sku
      ORDER BY revenue DESC
      LIMIT 10
      `,
      []
    );

    const top_products = Array.isArray(topRes.rows) ? topRes.rows : [];
    for (const p of top_products) {
      p.quantity = Number(p.quantity || 0);
      p.revenue = Number(p.revenue || 0);
      p.profit = Number(p.profit || 0);
    }

    res.json({ totals, daily, top_products });
  } catch (err) {
    console.error('Erro dashboard:', err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

module.exports = router;
