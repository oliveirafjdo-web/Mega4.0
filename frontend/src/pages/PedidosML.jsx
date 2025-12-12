import React, { useEffect, useState } from 'react';
import { fetchJson } from '../api';

export default function PedidosML() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await fetchJson(`/api/sales/ml${query}`);
      setSales(data);
    } catch (err) {
      console.error('Erro ao carregar pedidos ML:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    loadSales();
  };

  return (
    <div>
      <h2>Pedidos Mercado Livre</h2>

      <div className="box">
        <h3>Filtro</h3>
        <form className="form-inline" onSubmit={handleSubmit}>
          <label>
            De:
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </label>
          <label>
            Até:
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </label>
          <button type="submit">Aplicar</button>
        </form>
      </div>

      <div className="box">
        <h3>Pedidos importados via Mercado Livre</h3>
        {loading && <div>Carregando...</div>}
        {!loading && (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>SKU</th>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Receita bruta</th>
                <th>Imposto</th>
                <th>Despesas</th>
                <th>Lucro</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id}>
                  <td>{s.sale_date}</td>
                  <td>{s.sku}</td>
                  <td>{s.name}</td>
                  <td>{s.quantity}</td>
                  <td>R$ {Number(s.gross_revenue || 0).toFixed(2)}</td>
                  <td>R$ {Number(s.tax_value || 0).toFixed(2)}</td>
                  <td>R$ {Number(s.expenses_value || 0).toFixed(2)}</td>
                  <td>R$ {Number(s.profit || 0).toFixed(2)}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan="8">Nenhum pedido Mercado Livre encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
