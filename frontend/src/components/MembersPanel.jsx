import { useState, useEffect } from 'react'
import { api } from '../services/api.js'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
const ROLE_LABELS = { proprietaire: '👑 ', admin: '🛡 ', membre: '' }

export default function MembersPanel({ world, moi, onFermer, onOuvrirDM }) {
  const [membres, setMembres] = useState([])
  const [presence, setPresence] = useState({})

  useEffect(() => {
    chargerMembres()
    const ws = new WebSocket(`${WS_URL}/api/presence/ws/${world.id}/${moi.id}`)
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'snapshot') {
        const p = {}
        data.users?.forEach(u => { p[u.user_id] = u })
        setPresence(p)
      } else if (data.type === 'join') {
        setPresence(prev => ({ ...prev, [data.user_id]: data }))
      } else if (data.type === 'leave') {
        setPresence(prev => { const n = { ...prev }; delete n[data.user_id]; return n })
      }
    }
    return () => ws.close()
  }, [world.id])

  async function chargerMembres() {
    const data = await api.get(`/worlds/${world.id}/membres`)
    if (Array.isArray(data)) setMembres(data)
  }

  const enLigne  = membres.filter(m => presence[m.user_id])
  const horsLigne = membres.filter(m => !presence[m.user_id])

  return (
    <div className="members-panel">
      <div className="members-panel-header">
        <span>Membres — {membres.length}</span>
        <button className="btn-quitter-room" onClick={onFermer}>✕</button>
      </div>
      <div className="members-list">
        {enLigne.length > 0 && (
          <>
            <p className="members-section-label">En ligne — {enLigne.length}</p>
            {enLigne.map(m => <MemberRow key={m.user_id} m={m} enligne presence={presence[m.user_id]} moi={moi} onDM={onOuvrirDM} />)}
          </>
        )}
        {horsLigne.length > 0 && (
          <>
            <p className="members-section-label">Hors ligne — {horsLigne.length}</p>
            {horsLigne.map(m => <MemberRow key={m.user_id} m={m} enligne={false} moi={moi} onDM={onOuvrirDM} />)}
          </>
        )}
      </div>
    </div>
  )
}

function MemberRow({ m, enligne, presence, moi, onDM }) {
  const isMoi = m.user_id === moi.id
  return (
    <div className={`member-item ${enligne ? '' : 'offline'}`}>
      <div className="member-avatar-wrap">
        <span className="member-avatar">{m.avatar_emoji}</span>
        <span className={`member-dot ${enligne ? 'online' : ''}`} />
      </div>
      <div className="member-info">
        <span className="member-nom">
          {ROLE_LABELS[m.role]}
          {m.nom}
          {isMoi && <span style={{ color: '#72767d', fontSize: 11 }}> (moi)</span>}
        </span>
        {presence?.room_id && <span className="member-location">Dans une pièce</span>}
      </div>
      {!isMoi && onDM && (
        <button className="btn-dm" onClick={() => onDM(m)} title="Message privé">✉</button>
      )}
    </div>
  )
}
