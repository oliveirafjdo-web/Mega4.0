import React, { useEffect, useState } from 'react';
import { fetchJson } from '../api';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [source, setSource] = useState('');

  const loadSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      if (source) params.set('source', source);
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await fetchJson(`/api/sales/list${query}`);
      setSales(data);
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
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
      <h2>Vendas</h2>

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
          <label>
            Origem:
            <select value={source} onChange={e => setSource(e.target.value)}>
              <option value="">Todas</option>
              <option value="manual">Manual</option>
              <option value="mercado_livre">Mercado Livre</option>
            </select>
          </label>
          <button type="submit">Aplicar</button>
        </form>
      </div>

      <div className="box">
        <h3>Lista de vendas</h3>
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
                <th>Taxa ML</th>
                <th>Imposto</th>
                <th>Despesas</th>
                <th>Lucro</th>
                <th>Origem</th>
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
                  <td>R$ {Number(s.ml_fee || 0).toFixed(2)}</td>
                  <td>R$ {Number(s.tax_value || 0).toFixed(2)}</td>
                  <td>R$ {Number(s.expenses_value || 0).toFixed(2)}</td>
                  <td>R$ {Number(s.profit || 0).toFixed(2)}</td>
                  <td>{s.source}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan="10">Nenhuma venda encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
