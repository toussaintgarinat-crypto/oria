import { useState } from 'react'
import { api } from '../services/api.js'

const TYPES = [
  { id: 'texte', emoji: '💬', label: 'Texte',  desc: 'Chat écrit' },
  { id: 'vocal', emoji: '🔊', label: 'Vocal',  desc: 'Voix/vidéo' },
  { id: 'mixte', emoji: '⚡', label: 'Mixte',  desc: 'Chat + voix' },
]
const EMOJIS = ['💬','🔊','⚡','🏠','💼','🍳','🛋','📋','📊','🎮','🎨','🔬','📡','🌡','💡','🔧','📁','🎯','🌿','🚪']

export default function EditRoomModal({ room, onSave, onFermer }) {
  const [nom, setNom]     = useState(room.nom)
  const [type, setType]   = useState(room.type)
  const [emoji, setEmoji] = useState(room.emoji)
  const [loading, setLoading] = useState(false)

  async function sauvegarder(e) {
    e.preventDefault()
    setLoading(true)
    await api.patch(`/buildings/rooms/${room.id}`, { nom, type, emoji })
    setLoading(false)
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={onFermer}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-titre">Modifier la pièce</h2>
        <form onSubmit={sauvegarder}>
          <label>Type</label>
          <div className="type-picker">
            {TYPES.map(t => (
              <button key={t.id} type="button"
                className={`type-btn ${type === t.id ? 'actif' : ''}`}
                onClick={() => setType(t.id)}>
                <span className="type-emoji">{t.emoji}</span>
                <span className="type-label">{t.label}</span>
                <span className="type-desc">{t.desc}</span>
              </button>
            ))}
          </div>
          <label>Icône</label>
          <div className="emoji-picker">
            {EMOJIS.map(e => (
              <button key={e} type="button"
                className={`emoji-btn ${emoji === e ? 'actif' : ''}`}
                onClick={() => setEmoji(e)}>{e}</button>
            ))}
          </div>
          <label>Nom</label>
          <input value={nom} onChange={e => setNom(e.target.value)} autoFocus required />
          <div className="modal-actions">
            <button type="button" className="btn-annuler" onClick={onFermer}>Annuler</button>
            <button type="submit" className="btn-creer" disabled={loading}>
              {loading ? '...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
