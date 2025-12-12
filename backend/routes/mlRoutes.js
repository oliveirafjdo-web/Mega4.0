const express = require('express');
const db = require('../db');
const mlService = require('../mlService');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Retorna URL para o usuário autorizar o app no Mercado Livre
router.get('/auth-url', (req, res) => {
  try {
    const url = mlService.getAuthUrl();
    res.json({ url });
  } catch (err) {
    console.error('Erro ao gerar URL de auth ML:', err);
    res.status(500).json({ error: 'Erro ao gerar URL de autenticação' });
  }
});

// Status da integração Mercado Livre (se tem token salvo, quando expira etc.)
router.get('/status', async (req, res) => {
  try {
    const result = await db.query('SELECT user_id, expires_at, created_at, updated_at FROM ml_tokens LIMIT 1');
    if (!result.rows.length) {
      return res.json({ connected: false });
    }
    const row = result.rows[0];
    const now = new Date();
    const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
    res.json({
      connected: true,
      user_id: row.user_id,
      expires_at: row.expires_at,
      expired: expiresAt ? expiresAt <= now : null
    });
  } catch (err) {
    console.error('Erro ao buscar status ML:', err);
    res.status(500).json({ error: 'Erro ao buscar status da integração Mercado Livre' });
  }
});

// Callback do Mercado Livre: recebe ?code= e troca por tokens
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Code não informado' });
    }

    const data = await mlService.exchangeCodeForToken(code);
    res.json({
      message: 'Autenticação Mercado Livre concluída com sucesso',
      user_id: data.user_id,
      scope: data.scope
    });
  } catch (err) {
    console.error('Erro no callback Mercado Livre:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao processar callback do Mercado Livre' });
  }
});

// Importa pedidos do Mercado Livre e grava como vendas
// body: { date_from?, date_to? }
router.post('/import-orders', async (req, res) => {
  try {
    const { date_from, date_to } = req.body || {};

    const ordersData = await mlService.fetchOrders(date_from, date_to);

    const settingsRes = await db.query('SELECT * FROM settings LIMIT 1');
    const settings = settingsRes.rows[0];
    const taxPercent = Number(settings.tax_percent) / 100;
    const expensesPercent = Number(settings.expenses_percent) / 100;

    let imported = 0;

    for (const order of ordersData.results || []) {
      const date = order.date_created?.substring(0, 10);
      const gross_revenue = Number(order.total_amount || 0);

      for (const item of order.order_items || []) {
        const sku = item.item?.seller_sku || item.item?.id;
        const quantity = Number(item.quantity || 0);
        if (!sku || !quantity) continue;

        const prodRes = await db.query(
          'SELECT * FROM products WHERE sku = $1',
          [sku]
        );
        if (!prodRes.rows.length) {
          console.warn('Produto não encontrado para SKU (ML):', sku);
          continue;
        }
        const product = prodRes.rows[0];

        const gross = gross_revenue; // simplificado: valor bruto por pedido
        const mlFee = 0; // pode ser ajustado depois com base nas tarifas ML
        const taxValue = gross * taxPercent;
        const expensesValue = gross * expensesPercent;
        const costValue = quantity * Number(product.avg_cost);
        const profit = gross - mlFee - taxValue - expensesValue - costValue;

        const id = uuidv4();

        await db.query(
          `INSERT INTO sales
             (id, product_id, sale_date, quantity,
              gross_revenue, ml_fee, tax_value, expenses_value, profit)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [id, product.id, date, quantity, gross, mlFee, taxValue, expensesValue, profit]
        );

        await db.query(
          `UPDATE products
             SET current_stock = current_stock - $1,
                 updated_at = NOW()
           WHERE id = $2`,
          [quantity, product.id]
        );

        imported++;
      }
    }

    res.json({ status: 'ok', imported });
  } catch (err) {
    console.error('Erro ao importar pedidos do Mercado Livre:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao importar pedidos do Mercado Livre' });
  }
});

module.exports = router;
