import React, { useEffect, useState } from 'react';
import { fetchJson } from '../api';

export default function Settings() {
  const [form, setForm] = useState(null);

  useEffect(() => {
    fetchJson('/api/settings').then(setForm);
  }, []);

  if (!form) return <div>Carregando...</div>;

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const updated = await fetchJson('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(form)
    });
    setForm(updated);
    alert('Configurações salvas!');
  };

  return (
    <div>
      <h2>Configurações</h2>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Percentual de despesas (%)
          <input
            type="number"
            step="0.01"
            name="expenses_percent"
            value={form.expenses_percent}
            onChange={handleChange}
          />
        </label>
        <label>
          Percentual de imposto (%)
          <input
            type="number"
            step="0.01"
            name="tax_percent"
            value={form.tax_percent}
            onChange={handleChange}
          />
        </label>
        <label>
          Estoque mínimo em dias
          <input
            type="number"
            name="stock_min_days"
            value={form.stock_min_days}
            onChange={handleChange}
          />
        </label>
        <button type="submit">Salvar</button>
      </form>
    </div>
  );
}
