import React, { useEffect, useState } from 'react';
import { fetchJson } from '../api';
import MetricCard from '../components/MetricCard';
import StockTable from '../components/StockTable';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchJson('/api/dashboard').then(setData);
  }, []);

  if (!data) return <div>Carregando...</div>;

  const c = data.cards;

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="grid">
        <MetricCard title="Faturamento hoje" value={`R$ ${c.revenue_today.toFixed(2)}`} />
        <MetricCard title="Faturamento mês" value={`R$ ${c.revenue_month.toFixed(2)}`} />
        <MetricCard title="Lucro hoje" value={`R$ ${c.profit_today.toFixed(2)}`} />
        <MetricCard title="Lucro mês" value={`R$ ${c.profit_month.toFixed(2)}`} />
        <MetricCard title="Média diária 30d" value={c.avg_daily_30.toFixed(2)} />
        <MetricCard title="Unidades em estoque" value={c.stock_total_units} />
        <MetricCard title="Custo total estoque" value={`R$ ${c.stock_total_cost.toFixed(2)}`} />
        <MetricCard title="Lucro potencial estoque" value={`R$ ${c.stock_potential_profit.toFixed(2)}`} />
      </div>

      <h3>Estoque e Reposição</h3>
      <StockTable items={data.stock} />
    </div>
  );
}
