const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Totais gerais
    const totalsRes = await db.query(
      `
      SELECT
        COALESCE(SUM(gross_revenue), 0) AS total_revenue,
        COALESCE(SUM(profit), 0) AS total_profit,
        COALESCE(SUM(quantity), 0) AS total_quantity
      FROM sales
      `
    );

    // Vendas diárias (últimos 30 dias)
    const dailyRes = await db.query(
      `
      SELECT
        sale_date,
        COALESCE(SUM(gross_revenue), 0) AS revenue,
        COALESCE(SUM(profit), 0) AS profit
      FROM sales
      GROUP BY sale_date
      ORDER BY sale_date DESC
      LIMIT 30
      `
    );

    // Top produtos
    const topProductsRes = await db.query(
      `
      SELECT
        p.sku,
        COALESCE(SUM(s.quantity), 0) AS quantity,
        COALESCE(SUM(s.gross_revenue), 0) AS revenue,
        COALESCE(SUM(s.profit), 0) AS profit
      FROM sales s
      JOIN products p ON p.id = s.product_id
      GROUP BY p.sku
      ORDER BY revenue DESC
      LIMIT 10
      `
    );

    res.json({
      totals: totalsRes.rows[0],
      daily: dailyRes.rows.reverse(), // ordem cronológica
      top_products: topProductsRes.rows
    });

  } catch (err) {
    console.error('Erro dashboard:', err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

module.exports = router;
