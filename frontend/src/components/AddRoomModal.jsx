import { useState } from 'react'
import { api } from '../services/api.js'

const TYPES = [
  { id: 'texte',  emoji: '💬', label: 'Texte',  desc: 'Chat écrit en temps réel' },
  { id: 'vocal',  emoji: '🔊', label: 'Vocal',  desc: 'Appel voix/vidéo' },
  { id: 'mixte',  emoji: '⚡', label: 'Mixte',  desc: 'Chat + voix dans la même pièce' },
]

const EMOJIS = ['💬','🔊','⚡','🏠','💼','🍳','🛋','📋','📊','🎮','🎨','🔬','📡','🌡','💡','🔧','📁','🎯','🌿','🚪']

export default function AddRoomModal({ building, onCree, onFermer }) {
  const [nom, setNom]     = useState('')
  const [type, setType]   = useState('mixte')
  const [emoji, setEmoji] = useState('💬')
  const [etage, setEtage] = useState(0)
  const [loading, setLoading] = useState(false)

  const etagesExistants = building.type === 'immeuble'
    ? [...new Set((building.rooms || []).map(r => r.etage))].sort()
    : null

  async function creer(e) {
    e.preventDefault()
    if (!nom.trim()) return
    setLoading(true)
    await api.post('/buildings/rooms', {
      building_id: building.id,
      nom: nom.trim(),
      type,
      emoji,
      etage: building.type === 'immeuble' ? etage : 0,
    })
    setLoading(false)
    onCree()
  }

  return (
    <div className="modal-overlay" onClick={onFermer}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-titre">
          Ajouter une pièce
          <span className="modal-sous-titre"> dans {building.emoji} {building.nom}</span>
        </h2>

        <form onSubmit={creer}>
          <label>Type de pièce</label>
          <div className="type-picker">
            {TYPES.map(t => (
              <button key={t.id} type="button"
                className={`type-btn ${type === t.id ? 'actif' : ''}`}
                onClick={() => { setType(t.id); setEmoji(t.emoji) }}
              >
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
                onClick={() => setEmoji(e)}>{e}
              </button>
            ))}
          </div>

          <label>Nom de la pièce</label>
          <input value={nom} onChange={e => setNom(e.target.value)}
            placeholder="Domotique, Archives, Studio..." autoFocus required />

          {building.type === 'immeuble' && (
            <>
              <label>Étage</label>
              <select
                className="input-select"
                value={etage}
                onChange={e => setEtage(Number(e.target.value))}
              >
                {(etagesExistants?.length ? etagesExistants : [0]).map(n => (
                  <option key={n} value={n}>{n === 0 ? 'RDC' : `Étage ${n}`}</option>
                ))}
                <option value={(etagesExistants?.at(-1) ?? 0) + 1}>
                  Nouvel étage ({(etagesExistants?.at(-1) ?? 0) + 1})
                </option>
              </select>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-annuler" onClick={onFermer}>Annuler</button>
            <button type="submit" className="btn-creer" disabled={loading}>
              {loading ? '...' : 'Ajouter →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
