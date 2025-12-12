const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM settings WHERE id = 1', []);
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error('Erro ao buscar configurações:', err);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { expenses_percent, tax_percent, stock_min_days, monthly_ads } = req.body;

    // Atualiza settings (sem RETURNING no SQLite)
    await db.query(
      `
      UPDATE settings
      SET expenses_percent = $1,
          tax_percent = $2,
          stock_min_days = $3,
          monthly_ads = $4
      WHERE id = 1
      `,
      [
        Number(expenses_percent || 0),
        Number(tax_percent || 0),
        Number(stock_min_days || 15),
        Number(monthly_ads || 0)
      ]
    );

    const result = await db.query('SELECT * FROM settings WHERE id = 1', []);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar configurações:', err);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

module.exports = router;
