# Marketplace ERP

Backend: Node.js + Express + PostgreSQL  
Frontend: React + Vite

## Backend (local)

```bash
cd backend
npm install
# configurar DATABASE_URL no .env ou no ambiente
node server.js
```

## Frontend (local)

```bash
cd frontend
npm install
npm run dev
```

No Render, use o Dockerfile na raiz para o backend.


## Integração Mercado Livre

Configure no backend as variáveis de ambiente:

- ML_CLIENT_ID
- ML_CLIENT_SECRET
- ML_REDIRECT_URI  (ex: https://seuapp.onrender.com/api/ml/callback)
- ML_SITE_ID       (para Brasil use MLB)

Fluxo:

1. Acesse `GET /api/ml/auth-url` e abra a URL retornada no navegador.
2. Faça login e autorize o app no Mercado Livre.
3. O Mercado Livre vai chamar `ML_REDIRECT_URI` com `?code=...`.
4. O backend troca o code por tokens em `/api/ml/callback`.
5. Depois, use `POST /api/ml/import-orders` para importar pedidos para o ERP.
