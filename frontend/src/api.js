const API_URL = import.meta.env.VITE_API_URL || '';

export async function fetchJson(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return res.json();
}
