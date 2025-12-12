const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
const settingsRoutes = require('./routes/settingsRoutes');
const productsRoutes = require('./routes/productsRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Healthcheck (Render / monitoramento)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Marketplace ERP API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Registro das rotas
app.use('/api/settings', settingsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rota raiz opcional (não quebra front)
app.get('/', (req, res) => {
  res.json({
    status: 'API online',
    health: '/api/health',
    version: '1.0.0'
  });
});

// 404 padrão
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// Porta (Render usa PORT)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
