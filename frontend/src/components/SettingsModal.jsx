import { useState } from 'react'
import { api } from '../services/api.js'

const AVATARS = ['👤','🧑','👩','🧔','👨‍💻','👩‍💻','🧑‍🎨','👩‍🎤','🧑‍🚀','🦊','🐺','🐸']

export default function SettingsModal({ moi, onSauvegarde, onDeconnexion, onFermer }) {
  const [nom, setNom]         = useState(moi.nom)
  const [avatar, setAvatar]   = useState(moi.avatar_emoji)
  const [chargement, setChargement] = useState(false)

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
        </form>
      </div>
    </div>
  )
}
