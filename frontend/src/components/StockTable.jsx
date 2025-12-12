import React from 'react';

export default function StockTable({ items }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>SKU</th>
          <th>Produto</th>
          <th>Estoque</th>
          <th>Média 30d</th>
          <th>Dias de estoque</th>
          <th>Status</th>
          <th>Lucro potencial</th>
        </tr>
      </thead>
      <tbody>
        {items.map(p => (
          <tr key={p.id} className={p.status === 'REPOR' ? 'danger' : ''}>
            <td>{p.sku}</td>
            <td>{p.name}</td>
            <td>{p.current_stock}</td>
            <td>{p.avg_daily_30 ? p.avg_daily_30.toFixed(2) : '-'}</td>
            <td>{p.days_stock ? p.days_stock.toFixed(1) : '-'}</td>
            <td>{p.status}</td>
            <td>R$ {p.potential_profit.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
