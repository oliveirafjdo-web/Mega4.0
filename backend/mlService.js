const axios = require('axios');
const db = require('./db');

const ML_AUTH_URL = 'https://auth.mercadolivre.com.br/authorization';
const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
const ML_API_BASE = 'https://api.mercadolibre.com';

const CLIENT_ID = process.env.ML_CLIENT_ID;
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
const REDIRECT_URI = process.env.ML_REDIRECT_URI;
const SITE_ID = process.env.ML_SITE_ID || 'MLB';

function getAuthUrl() {
  const url = new URL(ML_AUTH_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  return url.toString();
}

async function saveTokenData(data) {
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  const existing = await db.query('SELECT id FROM ml_tokens LIMIT 1');
  if (existing.rows.length) {
    await db.query(
      `UPDATE ml_tokens
         SET access_token = $1,
             refresh_token = $2,
             user_id = $3,
             scope = $4,
             token_type = $5,
             expires_at = $6,
             updated_at = NOW()
       WHERE id = $7`,
      [
        data.access_token,
        data.refresh_token,
        String(data.user_id || ''),
        data.scope || null,
        data.token_type || null,
        expiresAt,
        existing.rows[0].id
      ]
    );
  } else {
    await db.query(
      `INSERT INTO ml_tokens
         (access_token, refresh_token, user_id, scope, token_type, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        data.access_token,
        data.refresh_token,
        String(data.user_id || ''),
        data.scope || null,
        data.token_type || null,
        expiresAt
      ]
    );
  }
}

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);

  const { data } = await axios.post(ML_TOKEN_URL, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  await saveTokenData(data);
  return data;
}

async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('refresh_token', refreshToken);

  const { data } = await axios.post(ML_TOKEN_URL, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  await saveTokenData(data);
  return data;
}

async function getValidToken() {
  const res = await db.query('SELECT * FROM ml_tokens LIMIT 1');
  if (!res.rows.length) {
    throw new Error('Nenhum token Mercado Livre encontrado. Faça a autenticação primeiro.');
  }
  const token = res.rows[0];
  if (token.expires_at && new Date(token.expires_at) <= new Date()) {
    const refreshed = await refreshAccessToken(token.refresh_token);
    return { ...token, access_token: refreshed.access_token };
  }
  return token;
}

async function fetchOrders(dateFrom, dateTo) {
  const token = await getValidToken();
  const from = dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const to = dateTo || new Date().toISOString();

  const url = new URL(`${ML_API_BASE}/orders/search`);
  url.searchParams.set('seller', token.user_id);
  url.searchParams.set('order.date_created.from', from);
  url.searchParams.set('order.date_created.to', to);

  const { data } = await axios.get(url.toString(), {
    headers: {
      Authorization: `Bearer ${token.access_token}`
    }
  });

  return data;
}

module.exports = {
  getAuthUrl,
  exchangeCodeForToken,
  getValidToken,
  fetchOrders
};
