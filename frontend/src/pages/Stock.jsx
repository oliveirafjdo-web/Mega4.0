import React, { useEffect, useState } from 'react';
import { fetchJson } from '../api';

export default function Stock() {
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ product_id: '', quantity: '', unit_cost: '' });

  const loadProducts = async () => {
    try {
      const data = await fetchJson('/api/products');
      setProducts(data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await fetchJson('/api/inventory/entries');
      setEntries(data);
    } catch (err) {
      console.error('Erro ao carregar entradas de estoque:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadEntries();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchJson('/api/inventory/entries', {
        method: 'POST',
        body: JSON.stringify({
          product_id: form.product_id,
          quantity: Number(form.quantity),
          unit_cost: Number(form.unit_cost)
        })
      });
      setForm({ product_id: '', quantity: '', unit_cost: '' });
      await loadEntries();
      await loadProducts(); // atualiza estoque e custo médio na listagem
    } catch (err) {
      console.error('Erro ao lançar entrada:', err);
      alert('Erro ao lançar entrada de estoque.');
    }
  };

  return (
    <div>
      <h2>Estoque</h2>

      <div className="box">
        <h3>Lançar entrada de estoque</h3>
        <form className="form-inline" onSubmit={handleSubmit}>
          <label>
            Produto
            <select
              name="product_id"
              value={form.product_id}
              onChange={handleChange}
              required
            >
              <option value="">Selecione...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.sku} - {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantidade
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Custo unitário
            <input
              type="number"
              step="0.01"
              name="unit_cost"
              value={form.unit_cost}
              onChange={handleChange}
              required
            />
          </label>
          <button type="submit">Lançar entrada</button>
        </form>
      </div>

      <div className="box">
        <h3>Entradas recentes</h3>
        {loading && <div>Carregando...</div>}
        {!loading && (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>SKU</th>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Custo unitário</th>
                <th>Custo total</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td>{new Date(e.created_at).toLocaleString()}</td>
                  <td>{e.sku}</td>
                  <td>{e.name}</td>
                  <td>{e.quantity}</td>
                  <td>R$ {Number(e.unit_cost || 0).toFixed(2)}</td>
                  <td>R$ {Number(e.total_cost || 0).toFixed(2)}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan="6">Nenhuma entrada registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
