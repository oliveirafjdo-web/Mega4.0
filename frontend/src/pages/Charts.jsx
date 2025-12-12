import React, { useEffect, useState } from 'react';
import { fetchJson } from '../api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function Charts() {
  const [daily, setDaily] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchJson('/api/sales/daily');
        const formatted = data.map(d => ({
          date: d.sale_date,
          revenue: Number(d.total_revenue || 0),
          profit: Number(d.total_profit || 0)
        }));
        setDaily(formatted);
      } catch (err) {
        console.error('Erro ao carregar dados de gráficos:', err);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h2>Gráficos</h2>

      <div className="box" style={{ height: 320 }}>
        <h3>Faturamento e lucro diário</h3>
        {daily.length === 0 && <div>Sem dados suficientes.</div>}
        {daily.length > 0 && (
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Faturamento" />
              <Line type="monotone" dataKey="profit" name="Lucro" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="box" style={{ height: 320, marginTop: 24 }}>
        <h3>Faturamento por dia (barras)</h3>
        {daily.length > 0 && (
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" name="Faturamento" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
