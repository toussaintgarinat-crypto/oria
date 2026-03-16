import { useState } from 'react'
import { api } from '../services/api.js'

const TYPES = [
  { id: 'maison',   emoji: '🏠', label: 'Maison',   desc: 'Espace personnel, salon, bureau privé' },
  { id: 'site',     emoji: '🌐', label: 'Site',     desc: 'Vitrine publique, portfolio, contact' },
  { id: 'immeuble', emoji: '🏢', label: 'Immeuble', desc: 'Multi-activités avec étages et appartements' },
]

export default function CreateBuildingModal({ worldId, quartierId, onCree, onFermer }) {
  const [type, setType]   = useState('maison')
  const [nom, setNom]     = useState('')
  const [desc, setDesc]   = useState('')
  const [loading, setLoading] = useState(false)

  async function creer(e) {
    e.preventDefault()
    if (!nom.trim()) return
    setLoading(true)
    await api.post('/buildings/', { world_id: worldId, nom, type, description: desc, quartier_id: quartierId || '' })
    setLoading(false)
    onCree()
  }

  return (
    <div className="modal-overlay" onClick={onFermer}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-titre">Ajouter un espace</h2>

        <label>Type d'espace</label>
        <div className="type-picker">
          {TYPES.map(t => (
            <button key={t.id} type="button"
              className={`type-btn ${type === t.id ? 'actif' : ''}`}
              onClick={() => setType(t.id)}
            >
              <span className="type-emoji">{t.emoji}</span>
              <span className="type-label">{t.label}</span>
              <span className="type-desc">{t.desc}</span>
            </button>
          ))}
        </div>

        <form onSubmit={creer}>
          <label>Nom</label>
          <input value={nom} onChange={e => setNom(e.target.value)}
            placeholder={type === 'maison' ? 'Ma maison' : type === 'site' ? 'Mon portfolio' : 'Mon agence'}
            autoFocus />

          <label>Description <span className="optionnel">(optionnel)</span></label>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="À quoi sert cet espace ?" />

          <div className="modal-actions">
            <button type="button" className="btn-annuler" onClick={onFermer}>Annuler</button>
            <button type="submit" className="btn-creer" disabled={loading}>
              {loading ? '...' : 'Créer →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
