const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Servir frontend (templates) de backend/public
app.use(express.static(path.join(__dirname, 'public')));

// Rotas
const settingsRoutes = require('./routes/settingsRoutes');
const productsRoutes = require('./routes/productsRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Marketplace ERP API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Registro das rotas API
app.use('/api/settings', settingsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ✅ Se acessar /api/* e não existir, retorna 404 JSON
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Rota da API não encontrada',
    path: req.path,
    method: req.method
  });
});

// ✅ Qualquer outra rota sem arquivo estático -> manda pro index.html
// (ajuda se você digitar /products.html, /sales.html etc.)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Porta (Render usa PORT)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
