import React from 'react';

export default function MetricCard({ title, value, subtitle }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-value">{value}</div>
      {subtitle && <div className="card-sub">{subtitle}</div>}
    </div>
  );
}
