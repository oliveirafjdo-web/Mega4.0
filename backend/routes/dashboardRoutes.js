const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const monthStartStr = `${yyyy}-${mm}-01`;

    const [
      settingsRes,
      revTodayRes,
      revMonthRes,
      profitTodayRes,
      profitMonthRes,
      avg30Res,
      stockRes
    ] = await Promise.all([
      db.query('SELECT * FROM settings LIMIT 1'),
      db.query(
        `SELECT COALESCE(SUM(gross_revenue),0) AS value
         FROM sales WHERE sale_date = $1`,
        [todayStr]
      ),
      db.query(
        `SELECT COALESCE(SUM(gross_revenue),0) AS value
         FROM sales WHERE sale_date >= $1`,
        [monthStartStr]
      ),
      db.query(
        `SELECT COALESCE(SUM(profit),0) AS value
         FROM sales WHERE sale_date = $1`,
        [todayStr]
      ),
      db.query(
        `SELECT COALESCE(SUM(profit),0) AS value
         FROM sales WHERE sale_date >= $1`,
        [monthStartStr]
      ),
      db.query(
        `SELECT COALESCE(SUM(quantity),0)/30.0 AS avg_daily
         FROM sales
         WHERE sale_date >= (CURRENT_DATE - INTERVAL '30 days')`
      ),
      db.query(
        `SELECT p.id, p.sku, p.name, p.avg_cost, p.current_stock,
                COALESCE(SUM(s.quantity)
                  FILTER (WHERE s.sale_date >= (CURRENT_DATE - INTERVAL '30 days')),0) / 30.0
                  AS avg_daily_30
         FROM products p
         LEFT JOIN sales s ON s.product_id = p.id
         GROUP BY p.id
         ORDER BY p.name`
      )
    ]);

    const settings = settingsRes.rows[0];
    const avgDaily = Number(avg30Res.rows[0].avg_daily || 0);

    let stockTotalUnits = 0;
    let stockTotalCost = 0;
    let stockPotentialProfit = 0;
    const stockDetails = [];

    for (const row of stockRes.rows) {
      const stock = Number(row.current_stock);
      const avgCost = Number(row.avg_cost);
      const avgDailyProd = Number(row.avg_daily_30 || 0);
      const daysStock =
        avgDailyProd > 0 ? stock / avgDailyProd : null;

      const status =
        daysStock !== null && daysStock < settings.stock_min_days
          ? 'REPOR'
          : 'OK';

      const priceRes = await db.query(
        `SELECT
           COALESCE(SUM(gross_revenue),0) AS rev,
           COALESCE(SUM(quantity),0) AS qty
         FROM sales
         WHERE product_id = $1`,
        [row.id]
      );
      const rev = Number(priceRes.rows[0].rev || 0);
      const qty = Number(priceRes.rows[0].qty || 0);
      const avgPrice = qty > 0 ? rev / qty : 0;
      const unitProfit = avgPrice - avgCost;
      const potentialProfit = unitProfit * stock;

      stockTotalUnits += stock;
      stockTotalCost += stock * avgCost;
      stockPotentialProfit += potentialProfit;

      stockDetails.push({
        id: row.id,
        sku: row.sku,
        name: row.name,
        avg_cost: avgCost,
        current_stock: stock,
        avg_daily_30: avgDailyProd,
        days_stock: daysStock,
        status,
        potential_profit: potentialProfit
      });
    }

    res.json({
      settings,
      cards: {
        revenue_today: Number(revTodayRes.rows[0].value || 0),
        revenue_month: Number(revMonthRes.rows[0].value || 0),
        profit_today: Number(profitTodayRes.rows[0].value || 0),
        profit_month: Number(profitMonthRes.rows[0].value || 0),
        avg_daily_30: avgDaily,
        stock_total_units: stockTotalUnits,
        stock_total_cost: stockTotalCost,
        stock_potential_profit: stockPotentialProfit
      },
      stock: stockDetails
    });
  } catch (err) {
    console.error('Erro no dashboard:', err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

module.exports = router;
