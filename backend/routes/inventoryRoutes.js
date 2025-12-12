const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const router = express.Router();

// Listar entradas de estoque (mais recentes primeiro)
router.get('/entries', async (req, res) => {
  try {
    const { product_id, limit = 200 } = req.query;

    let query = `
      SELECT ie.id,
             ie.product_id,
             ie.quantity,
             ie.unit_cost,
             ie.total_cost,
             ie.created_at,
             p.sku,
             p.name
      FROM inventory_entries ie
      JOIN products p ON p.id = ie.product_id
    `;
    const params = [];
    if (product_id) {
      params.push(product_id);
      query += ` WHERE ie.product_id = $${params.length}`;
    }
    params.push(Number(limit));
    query += ` ORDER BY ie.created_at DESC LIMIT $${params.length}`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar entradas de estoque:', err);
    res.status(500).json({ error: 'Erro ao listar entradas de estoque' });
  }
});

// Lançar entrada de estoque com recálculo de custo médio e saldo
router.post('/entries', async (req, res) => {
  try {
    const { product_id, quantity, unit_cost } = req.body;
    const total_cost = quantity * unit_cost;
    const id = uuidv4();

    await db.query(
      `INSERT INTO inventory_entries
         (id, product_id, quantity, unit_cost, total_cost)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, product_id, quantity, unit_cost, total_cost]
    );

    const sumRes = await db.query(
      `SELECT COALESCE(SUM(quantity),0) AS qty,
              COALESCE(SUM(total_cost),0) AS total
       FROM inventory_entries
       WHERE product_id = $1`,
      [product_id]
    );

    const totalQty = Number(sumRes.rows[0].qty);
    const totalCost = Number(sumRes.rows[0].total);
    const avgCost = totalQty > 0 ? totalCost / totalQty : 0;

    const salesRes = await db.query(
      `SELECT COALESCE(SUM(quantity),0) AS sold
       FROM sales
       WHERE product_id = $1`,
      [product_id]
    );
    const sold = Number(salesRes.rows[0].sold);
    const currentStock = totalQty - sold;

    const prodRes = await db.query(
      `UPDATE products
         SET avg_cost = $1,
             current_stock = $2,
             updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [avgCost, currentStock, product_id]
    );

    res.status(201).json({
      entry_id: id,
      product: prodRes.rows[0]
    });
  } catch (err) {
    console.error('Erro ao lançar entrada de estoque:', err);
    res.status(500).json({ error: 'Erro ao lançar entrada de estoque' });
  }
});

module.exports = router;
