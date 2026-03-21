import { useState } from 'react'
import { api } from '../services/api.js'

const AVATARS = ['👤','🧑','👩','🧔','👨‍💻','👩‍💻','🧑‍🎨','👩‍🎤','🧑‍🚀','🦊','🐺','🐸']

export default function SettingsModal({ moi, onSauvegarde, onDeconnexion, onFermer }) {
  const [nom, setNom]         = useState(moi.nom)
  const [avatar, setAvatar]   = useState(moi.avatar_emoji)
  const [chargement, setChargement] = useState(false)

  async function exporterDonnees() {
    const token = localStorage.getItem('oria_token')
    const r = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/me/export`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (r.ok) {
      const data = await r.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'mes-donnees-oria.json'; a.click()
      URL.revokeObjectURL(url)
    }
  }

  async function supprimerCompte() {
    if (!confirm('Supprimer définitivement votre compte ? Cette action est irréversible.')) return
    const token = localStorage.getItem('oria_token')
    const r = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/me`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (r.ok) {
      onDeconnexion()
    }
  }

  async function sauvegarder(e) {
    e.preventDefault()
    if (!nom.trim()) return
    setChargement(true)
    const data = await api.patch('/auth/me', { nom: nom.trim(), avatar_emoji: avatar })
    setChargement(false)
    if (data?.token) {
      localStorage.setItem('oria_token', data.token)
      onSauvegarde(data.user)
    }
  }

  return (
    <div className="modal-overlay" onClick={onFermer}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Paramètres</h2>
          <button className="modal-close" onClick={onFermer}>✕</button>
        </div>

        <form onSubmit={sauvegarder} className="modal-body">
          <label className="modal-label">Avatar</label>
          <div className="avatar-grid">
            {AVATARS.map(a => (
              <button
                key={a} type="button"
                className={`avatar-option ${avatar === a ? 'selected' : ''}`}
                onClick={() => setAvatar(a)}
              >{a}</button>
            ))}
          </div>

          <label className="modal-label" style={{ marginTop: 16 }}>Nom affiché</label>
          <input
            className="modal-input"
            value={nom}
            onChange={e => setNom(e.target.value)}
            maxLength={32}
            required
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button type="submit" className="btn-primary" disabled={chargement || !nom.trim()}>
              {chargement ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
            <button type="button" className="btn-danger" onClick={onDeconnexion}>
              Se déconnecter
            </button>
          </div>

          {/* RGPD */}
          <div style={{ marginTop: 20, borderTop: '1px solid #383a40', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 11, color: '#72767d', margin: '0 0 8px' }}>Données personnelles (RGPD)</p>
            <button type="button" className="btn-secondary" onClick={exporterDonnees}>
              📤 Exporter mes données
            </button>
            <button type="button" className="btn-danger" onClick={supprimerCompte} style={{ fontSize: 12 }}>
              🗑 Supprimer mon compte
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
