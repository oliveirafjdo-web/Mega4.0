const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const router = express.Router();

// Listar entradas de estoque (mais recentes primeiro)
router.get('/entries', async (req, res) => {
  try {
    const product_id = req.query.product_id;
    const limit = Number(req.query.limit || 200);

    let query =
      "SELECT ie.id, ie.product_id, ie.quantity, ie.unit_cost, ie.total_cost, ie.created_at, " +
      "p.sku, p.name " +
      "FROM inventory_entries ie " +
      "JOIN products p ON p.id = ie.product_id";

    const params = [];
    if (product_id) {
      query += " WHERE ie.product_id = $1";
      params.push(product_id);
    }

    // LIMIT sempre por último
    query += " ORDER BY ie.created_at DESC LIMIT $" + (params.length + 1);
    params.push(limit);

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

    if (!product_id) return res.status(400).json({ error: 'product_id é obrigatório' });

    const qty = Number(quantity || 0);
    const uc = Number(unit_cost || 0);

    if (qty <= 0) return res.status(400).json({ error: 'quantity deve ser > 0' });
    if (uc < 0) return res.status(400).json({ error: 'unit_cost deve ser >= 0' });

    const total_cost = qty * uc;
    const id = uuidv4();

    // 1) grava entrada
    await db.query(
      "INSERT INTO inventory_entries (id, product_id, quantity, unit_cost, total_cost, created_at) " +
      "VALUES ($1, $2, $3, $4, $5, datetime('now'))",
      [id, product_id, qty, uc, total_cost]
    );

    // 2) recalcula custo médio ponderado baseado nas entradas
    const sumRes = await db.query(
      "SELECT COALESCE(SUM(quantity),0) AS qty, COALESCE(SUM(total_cost),0) AS total " +
      "FROM inventory_entries WHERE product_id = $1",
      [product_id]
    );

    const totalQty = Number(sumRes.rows[0]?.qty || 0);
    const totalCost = Number(sumRes.rows[0]?.total || 0);
    const avgCost = totalQty > 0 ? (totalCost / totalQty) : 0;

    // 3) calcula estoque atual = entradas - vendido
    const salesRes = await db.query(
      "SELECT COALESCE(SUM(quantity),0) AS sold FROM sales WHERE product_id = $1",
      [product_id]
    );

    const sold = Number(salesRes.rows[0]?.sold || 0);
    const currentStock = totalQty - sold;

    // 4) atualiza produto (SQLite: sem NOW() e sem RETURNING)
    await db.query(
      "UPDATE products SET avg_cost = $1, current_stock = $2, updated_at = datetime('now') WHERE id = $3",
      [avgCost, currentStock, product_id]
    );

    const prodRes = await db.query(
      "SELECT id, sku, name, avg_cost, current_stock, updated_at FROM products WHERE id = $1",
      [product_id]
    );

    res.status(201).json({
      entry_id: id,
      product: prodRes.rows[0] || null
    });
  } catch (err) {
    console.error('Erro ao lançar entrada de estoque:', err);
    res.status(500).json({ error: 'Erro ao lançar entrada de estoque' });
  }
});

module.exports = router;
