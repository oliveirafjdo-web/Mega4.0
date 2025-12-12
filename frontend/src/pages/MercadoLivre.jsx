import React, { useEffect, useState } from 'react';
import { fetchJson } from '../api';

export default function MercadoLivre() {
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [lastResult, setLastResult] = useState(null);

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await fetchJson('/api/ml/status');
      setStatus(data);
    } catch (err) {
      console.error('Erro ao carregar status ML:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleConnect = async () => {
    try {
      const data = await fetchJson('/api/ml/auth-url');
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('URL de autenticação não retornada.');
      }
    } catch (err) {
      console.error('Erro ao obter URL de autenticação:', err);
      alert('Erro ao obter URL de autenticação Mercado Livre.');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setImporting(true);
    setLastResult(null);
    try {
      const body = {};
      if (dateFrom) body.date_from = new Date(dateFrom).toISOString();
      if (dateTo) body.date_to = new Date(dateTo).toISOString();

      const result = await fetchJson('/api/ml/import-orders', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setLastResult(result);
      alert(`Importação concluída. Pedidos importados: ${result.imported ?? 0}`);
    } catch (err) {
      console.error('Erro ao importar pedidos ML:', err);
      alert('Erro ao importar pedidos do Mercado Livre.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <h2>Integração Mercado Livre</h2>

      <section className="box">
        <h3>Status da integração</h3>
        {loadingStatus && <div>Carregando status...</div>}
        {!loadingStatus && status && (
          <div className="ml-status">
            {status.connected ? (
              <>
                <p><strong>Conectado</strong></p>
                <p>Usuário (seller_id): {status.user_id}</p>
                <p>Token expira em: {status.expires_at ? new Date(status.expires_at).toLocaleString() : '-'}</p>
                {status.expired && <p className="warning">Token expirado. Refaça a autenticação.</p>}
              </>
            ) : (
              <p>Não conectado ao Mercado Livre.</p>
            )}
            <button onClick={handleConnect}>
              {status?.connected ? 'Reautenticar Mercado Livre' : 'Conectar Mercado Livre'}
            </button>
          </div>
        )}
      </section>

      <section className="box" style={{ marginTop: 24 }}>
        <h3>Importar pedidos do Mercado Livre</h3>
        <p>Opcionalmente, escolha um intervalo de datas. Se deixar em branco, serão considerados os últimos 7 dias.</p>
        <form onSubmit={handleImport} className="form-inline">
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
          <button type="submit" disabled={importing}>
            {importing ? 'Importando...' : 'Importar pedidos'}
          </button>
        </form>
        {lastResult && (
          <div className="import-result">
            <p>Status: {lastResult.status}</p>
            <p>Pedidos importados: {lastResult.imported ?? 0}</p>
          </div>
        )}
      </section>
    </div>
  );
}
