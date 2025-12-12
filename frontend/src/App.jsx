import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Sales from './pages/Sales';
import MercadoLivre from './pages/MercadoLivre';
import PedidosML from './pages/PedidosML';
import Charts from './pages/Charts';
import Settings from './pages/Settings';

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Marketplace ERP</h1>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/products">Produtos</NavLink>
          <NavLink to="/stock">Estoque</NavLink>
          <NavLink to="/sales">Vendas</NavLink>
          <NavLink to="/ml">Integração ML</NavLink>
          <NavLink to="/ml-orders">Pedidos ML</NavLink>
          <NavLink to="/charts">Gráficos</NavLink>
          <NavLink to="/settings">Configurações</NavLink>
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/ml" element={<MercadoLivre />} />
          <Route path="/ml-orders" element={<PedidosML />} />
          <Route path="/charts" element={<Charts />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
