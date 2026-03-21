const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getHeaders() {
  const token = localStorage.getItem('oria_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

function notifyError(message) {
  window.dispatchEvent(new CustomEvent('oria:error', { detail: message }))
}

async function request(path, options = {}) {
  try {
    const r = await fetch(`${BASE}/api${path}`, { headers: getHeaders(), ...options })
    if (!r.ok) {
      let detail = `Erreur ${r.status}`
      try { const body = await r.json(); detail = body.detail || detail } catch {}
      notifyError(detail)
      return null
    }
    // 204 No Content
    if (r.status === 204) return null
    return await r.json()
  } catch (e) {
    if (e.name === 'TypeError') {
      notifyError('Serveur inaccessible — vérifie ta connexion')
    } else {
      notifyError(e.message || 'Erreur inattendue')
    }
    return null
  }
}

export const api = {
  get:   (path)        => request(path),
  post:  (path, body)  => request(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch: (path, body)  => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del:   (path)        => request(path, { method: 'DELETE' }),
}
