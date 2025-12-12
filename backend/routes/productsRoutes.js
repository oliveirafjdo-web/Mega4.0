const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const router = express.Router();

// Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, sku, name, avg_cost, current_stock,
              created_at, updated_at
       FROM products
       ORDER BY name`
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
      `SELECT id, sku, name, avg_cost, current_stock,
              created_at, updated_at
       FROM products
       WHERE id = $1`,
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

// Criar produto
router.post('/', async (req, res) => {
  try {
    const { sku, name, avg_cost = 0, current_stock = 0 } = req.body;
    const id = uuidv4();

    const result = await db.query(
      `INSERT INTO products (id, sku, name, avg_cost, current_stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, sku, name, avg_cost, current_stock]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Atualizar produto
router.put('/:id', async (req, res) => {
  try {
    const { name, sku } = req.body;
    const result = await db.query(
      `UPDATE products
       SET name = $1,
           sku = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [name, sku, req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Excluir produto
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao excluir produto:', err);
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

module.exports = router;
