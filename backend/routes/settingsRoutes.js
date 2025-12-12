const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM settings LIMIT 1');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar configurações:', err);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { expenses_percent, tax_percent, stock_min_days } = req.body;

    const result = await db.query(
      `UPDATE settings
       SET expenses_percent = $1,
           tax_percent = $2,
           stock_min_days = $3
       WHERE id = (SELECT id FROM settings LIMIT 1)
       RETURNING *`,
      [expenses_percent, tax_percent, stock_min_days]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar configurações:', err);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

module.exports = router;
