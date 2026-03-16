const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getHeaders() {
  const token = localStorage.getItem('oria_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export const api = {
  async get(path) {
    const r = await fetch(`${BASE}/api${path}`, { headers: getHeaders() })
    return r.json()
  },
  async post(path, body) {
    const r = await fetch(`${BASE}/api${path}`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(body),
    })
    return r.json()
  },
  async patch(path, body) {
    const r = await fetch(`${BASE}/api${path}`, {
      method: 'PATCH', headers: getHeaders(), body: JSON.stringify(body),
    })
    return r.json()
  },
  async del(path) {
    const r = await fetch(`${BASE}/api${path}`, { method: 'DELETE', headers: getHeaders() })
    return r.json()
  },
}
