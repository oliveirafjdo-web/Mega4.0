import React, { useEffect, useState } from 'react';
import { fetchJson } from '../api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id: null, sku: '', name: '', avg_cost: 0, current_stock: 0 });
  const [mode, setMode] = useState('create');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchJson('/api/products');
      setProducts(data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ id: null, sku: '', name: '', avg_cost: 0, current_stock: 0 });
    setMode('create');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        sku: form.sku,
        name: form.name,
        avg_cost: Number(form.avg_cost),
        current_stock: Number(form.current_stock)
      };
      if (mode === 'create') {
        await fetchJson('/api/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } else if (mode === 'edit' && form.id) {
        await fetchJson(`/api/products/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({ sku: form.sku, name: form.name })
        });
      }
      await loadProducts();
      resetForm();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      alert('Erro ao salvar produto.');
    }
  };

  const handleEdit = (prod) => {
    setForm({
      id: prod.id,
      sku: prod.sku,
      name: prod.name,
      avg_cost: prod.avg_cost,
      current_stock: prod.current_stock
    });
    setMode('edit');
  };

  const handleDelete = async (prod) => {
    if (!window.confirm(`Excluir produto ${prod.name}?`)) return;
    try {
      await fetchJson(`/api/products/${prod.id}`, { method: 'DELETE' });
      await loadProducts();
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      alert('Erro ao excluir produto.');
    }
  };

  return (
    <div>
      <h2>Produtos</h2>
      <div className="box">
        <h3>{mode === 'create' ? 'Cadastrar produto' : 'Editar produto'}</h3>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            SKU
            <input
              type="text"
              name="sku"
              value={form.sku}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Nome
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>
          {mode === 'create' && (
            <>
              <label>
                Custo médio inicial
                <input
                  type="number"
                  step="0.01"
                  name="avg_cost"
                  value={form.avg_cost}
                  onChange={handleChange}
                />
              </label>
              <label>
                Estoque inicial
                <input
                  type="number"
                  name="current_stock"
                  value={form.current_stock}
                  onChange={handleChange}
                />
              </label>
            </>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit">
              {mode === 'create' ? 'Cadastrar' : 'Salvar alterações'}
            </button>
            {mode === 'edit' && (
              <button type="button" onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="box">
        <h3>Lista de produtos</h3>
        {loading && <div>Carregando...</div>}
        {!loading && (
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nome</th>
                <th>Custo médio</th>
                <th>Estoque</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>R$ {Number(p.avg_cost || 0).toFixed(2)}</td>
                  <td>{p.current_stock}</td>
                  <td>
                    <button onClick={() => handleEdit(p)}>Editar</button>{' '}
                    <button onClick={() => handleDelete(p)}>Excluir</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="5">Nenhum produto cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
