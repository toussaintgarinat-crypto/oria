import { useState } from 'react'
import { api } from '../services/api.js'

const EMOJIS   = ['🌍','🌎','🌏','🏔','🏝','🌆','🏙','🌌','🎪','🎭','🎨','🚀']
const COULEURS = ['#5865F2','#57F287','#FEE75C','#EB459E','#ED4245','#E67E22','#3498DB','#9B59B6']

export default function CreateWorldModal({ onCree, onFermer }) {
  const [nom, setNom]         = useState('')
  const [desc, setDesc]       = useState('')
  const [emoji, setEmoji]     = useState('🌍')
  const [couleur, setCouleur] = useState('#5865F2')
  const [chargement, setChargement] = useState(false)

  async function creer(e) {
    e.preventDefault()
    if (!nom.trim()) return
    setChargement(true)
    const data = await api.post('/worlds/', { nom, description: desc, emoji, couleur })
    setChargement(false)
    onCree(data)
  }

  return (
    <div className="modal-overlay" onClick={onFermer}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-titre">Créer un monde</h2>

        <form onSubmit={creer}>
          <label>Emoji</label>
          <div className="emoji-picker">
            {EMOJIS.map(e => (
              <button key={e} type="button" className={`emoji-btn ${emoji === e ? 'actif' : ''}`}
                onClick={() => setEmoji(e)}>{e}</button>
            ))}
          </div>

          <label>Couleur</label>
          <div className="couleur-picker">
            {COULEURS.map(c => (
              <button key={c} type="button"
                className={`couleur-btn ${couleur === c ? 'actif' : ''}`}
                style={{ background: c }}
                onClick={() => setCouleur(c)}
              />
            ))}
          </div>

          <label>Nom du monde</label>
          <input value={nom} onChange={e => setNom(e.target.value)}
            placeholder="Mon bureau, Mon agence..." autoFocus />

          <label>Description <span className="optionnel">(optionnel)</span></label>
          <input value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="De quoi parle ce monde ?" />

          <div className="modal-actions">
            <button type="button" className="btn-annuler" onClick={onFermer}>Annuler</button>
            <button type="submit" className="btn-creer" disabled={chargement}>
              {chargement ? '...' : 'Créer →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
