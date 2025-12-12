const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const router = express.Router();

// Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT id, sku, name, avg_cost, current_stock, updated_at
      FROM products
      ORDER BY name
      `
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

// Buscar um produto específico
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT id, sku, name, avg_cost, current_stock, updated_at
      FROM products
      WHERE id = $1
      `,
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// Criar produto (SQLite: sem RETURNING)
router.post('/', async (req, res) => {
  try {
    const { sku, name, avg_cost = 0, current_stock = 0 } = req.body;

    if (!sku || !String(sku).trim()) {
      return res.status(400).json({ error: 'SKU é obrigatório' });
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const id = uuidv4();

    await db.query(
      `
      INSERT INTO products (id, sku, name, avg_cost, current_stock, updated_at)
      VALUES ($1, $2, $3, $4, $5, datetime('now'))
      `,
      [id, String(sku).trim(), String(name).trim(), Number(avg_cost) || 0, Number(current_stock) || 0]
    );

    const created = await db.query(
      `SELECT id, sku, name, avg_cost, current_stock, updated_at FROM products WHERE id = $1`,
      [id]
    );

    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error('Erro ao criar produto:', err);

    // Erro de SKU duplicado (SQLite)
    if (String(err.message || '').toLowerCase().includes('unique')) {
      return res.status(409).json({ error: 'SKU já existe' });
    }

    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Atualizar produto (SQLite: sem NOW(), sem RETURNING)
router.put('/:id', async (req, res) => {
  try {
    const { name, sku, avg_cost, current_stock } = req.body;

    // Busca atual (para permitir update parcial)
    const current = await db.query(
      `SELECT id, sku, name, avg_cost, current_stock FROM products WHERE id = $1`,
      [req.params.id]
    );
    if (!current.rows.length) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const old = current.rows[0];

    const newName = (name !== undefined ? String(name).trim() : old.name);
    const newSku = (sku !== undefined ? String(sku).trim() : old.sku);
    const newAvgCost = (avg_cost !== undefined ? Number(avg_cost) || 0 : Number(old.avg_cost) || 0);
    const newStock = (current_stock !== undefined ? Number(current_stock) || 0 : Number(old.current_stock) || 0);

    await db.query(
      `
      UPDATE products
      SET name = $1,
          sku = $2,
          avg_cost = $3,
          current_stock = $4,
          updated_at = datetime('now')
      WHERE id = $5
      `,
      [newName, newSku, newAvgCost, newStock, req.params.id]
    );

    const updated = await db.query(
      `SELECT id, sku, name, avg_cost, current_stock, updated_at FROM products WHERE id = $1`,
      [req.params.id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);

    if (String(err.message || '').toLowerCase().includes('unique')) {
      return res.status(409).json({ error: 'SKU já existe' });
    }

    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Excluir produto
router.delete('/:id', async (req, res) => {
  try {
    // SQLite: sem RETURNING
    const exists = await db.query(
      `SELECT id FROM products WHERE id = $1`,
      [req.params.id]
    );
    if (!exists.rows.length) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    await db.query(
      'DELETE FROM products WHERE id = $1',
      [req.params.id]
    );

    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('Erro ao excluir produto:', err);
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

module.exports = router;
