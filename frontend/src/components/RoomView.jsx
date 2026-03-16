import { useState, useEffect, useRef } from 'react'
import { LiveKitRoom } from '@livekit/components-react'
import { api } from '../services/api.js'
import VocalSalon from './VocalSalon.jsx'

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880'
const WS_URL      = import.meta.env.VITE_WS_URL      || 'ws://localhost:8000'
const API_URL     = import.meta.env.VITE_API_URL      || 'http://localhost:8000'

const EMOJIS_REACTION = ['👍','❤️','😂','😮','😢','🔥','🎉','👏']

export default function RoomView({ room, building, world, moi, onQuitter }) {
  const [messages, setMessages]   = useState([])
  const [texte, setTexte]         = useState('')
  const [token, setToken]         = useState(null)
  const [onglet, setOnglet]       = useState(room.type === 'texte' ? 'chat' : 'vocal')
  const [fichiers, setFichiers]   = useState([])
  const [emojiPickerId, setEmojiPickerId] = useState(null)
  const wsRef    = useRef(null)
  const basRef   = useRef(null)
  const fileRef  = useRef(null)

  useEffect(() => {
    chargerMessages()
    chargerFichiers()
    if (room.type !== 'texte') obtenirToken()
    connecterWS()
    return () => wsRef.current?.close()
  }, [room.id])

  async function chargerMessages() {
    const data = await api.get(`/messages/${room.id}`)
    if (Array.isArray(data)) setMessages(data)
  }

  async function chargerFichiers() {
    const data = await api.get(`/files/room/${room.id}`)
    if (Array.isArray(data)) setFichiers(data)
  }

  async function obtenirToken() {
    const data = await api.post('/tokens/', { room_id: room.id, user_id: moi.id, user_nom: moi.nom })
    setToken(data.token)
  }

  function connecterWS() {
    const ws = new WebSocket(`${WS_URL}/api/messages/ws/${room.id}`)
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'delete') {
        setMessages(prev => prev.filter(m => m.id !== data.message_id))
      } else if (data.type === 'reaction') {
        setMessages(prev => prev.map(m =>
          m.id === data.message_id ? { ...m, reactions: data.reactions } : m
        ))
      } else {
        setMessages(prev => [...prev, data])
      }
    }
    wsRef.current = ws
  }

  async function envoyer(e) {
    e.preventDefault()
    if (!texte.trim()) return
    await api.post('/messages/', {
      room_id: room.id,
      author_id: moi.id,
      author_nom: moi.nom,
      author_emoji: moi.avatar_emoji,
      contenu: texte.trim(),
    })
    setTexte('')
  }

  async function supprimerMessage(id) {
    await api.del(`/messages/${id}`)
  }

  async function reagir(messageId, emoji) {
    setEmojiPickerId(null)
    await api.post(`/messages/${messageId}/reactions`, { emoji, user_id: moi.id, user_nom: moi.nom })
  }

  async function uploaderFichier(e) {
    const file = e.target.files[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    form.append('uploaded_by', moi.id)
    form.append('uploader_nom', moi.nom)
    const res = await fetch(`${API_URL}/api/files/upload/${room.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: form,
    })
    if (res.ok) chargerFichiers()
    e.target.value = ''
  }

  async function supprimerFichier(id) {
    await api.del(`/files/${id}`)
    chargerFichiers()
  }

  useEffect(() => { basRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  return (
    <div className="room-view" onClick={() => setEmojiPickerId(null)}>
      <div className="room-header">
        <div className="room-header-info">
          <span>{room.emoji}</span>
          <span className="room-header-nom">{room.nom}</span>
          <span className="room-header-building" style={{ color: building.couleur }}>
            {building.emoji} {building.nom}
          </span>
          {world && (
            <span className="room-header-world" style={{ color: world.couleur }}>
              {world.emoji} {world.nom}
            </span>
          )}
        </div>
        <div className="room-header-actions">
          {room.type === 'mixte' && (
            <div className="room-onglets">
              <button className={onglet === 'chat' ? 'actif' : ''} onClick={() => setOnglet('chat')}>💬</button>
              <button className={onglet === 'vocal' ? 'actif' : ''} onClick={() => setOnglet('vocal')}>🔊</button>
            </div>
          )}
          <button className="btn-quitter-room" onClick={onQuitter}>✕</button>
        </div>
      </div>

      {onglet === 'vocal' && token && (
        <div className="room-vocal">
          <LiveKitRoom
            serverUrl={LIVEKIT_URL}
            token={token}
            connect
            audio={true}
            video={false}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <VocalSalon room={room} moi={moi} onQuitter={onQuitter} />
          </LiveKitRoom>
        </div>
      )}
      {onglet === 'vocal' && !token && (
        <div className="vocal-connecting">Connexion au vocal...</div>
      )}

      {onglet !== 'vocal' && (
        <>
          <div className="room-messages">
            {messages.length === 0 && fichiers.length === 0 && (
              <div className="messages-vide">
                <span>{room.emoji}</span>
                <p>Début de <strong>{room.nom}</strong></p>
              </div>
            )}

            {fichiers.length > 0 && (
              <div className="fichiers-liste">
                {fichiers.map(f => (
                  <div key={f.id} className="fichier-item">
                    <a href={`${API_URL}/api/files/download/${f.id}`} target="_blank" rel="noreferrer" className="fichier-lien">
                      📎 {f.nom}
                      <span className="fichier-taille">({Math.round(f.taille / 1024)} Ko)</span>
                    </a>
                    <span className="fichier-auteur">{f.uploader_nom}</span>
                    {f.uploaded_by === moi.id && (
                      <button className="btn-suppr-fichier" onClick={() => supprimerFichier(f.id)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {messages.map((m, i) => {
              const precedent = messages[i - 1]
              const memeAuteur = precedent?.author_nom === m.author_nom
              const isMoi = m.author_id === moi.id
              return (
                <div key={m.id} className={`message ${memeAuteur ? 'groupe' : ''}`}>
                  {!memeAuteur && (
                    <div className="message-header">
                      <span className="message-avatar">{m.author_emoji}</span>
                      <span className="message-auteur">{m.author_nom}</span>
                      <span className="message-time">{m.created_at?.slice(11, 16)}</span>
                    </div>
                  )}
                  <div className="message-row">
                    <div className="message-contenu">{m.contenu}</div>
                    <div className="message-actions" onClick={e => e.stopPropagation()}>
                      <button
                        className="btn-react"
                        onClick={() => setEmojiPickerId(emojiPickerId === m.id ? null : m.id)}
                        title="Réagir"
                      >😊</button>
                      {isMoi && (
                        <button className="btn-suppr-msg" onClick={() => supprimerMessage(m.id)} title="Supprimer">🗑</button>
                      )}
                    </div>
                  </div>
                  {emojiPickerId === m.id && (
                    <div className="emoji-reaction-picker" onClick={e => e.stopPropagation()}>
                      {EMOJIS_REACTION.map(e => (
                        <button key={e} onClick={() => reagir(m.id, e)}>{e}</button>
                      ))}
                    </div>
                  )}
                  {m.reactions && Object.keys(m.reactions).length > 0 && (
                    <div className="reactions">
                      {Object.entries(m.reactions).map(([emoji, data]) => (
                        <button
                          key={emoji}
                          className={`reaction-btn ${data.users?.includes(moi.id) ? 'moi' : ''}`}
                          onClick={() => reagir(m.id, emoji)}
                          title={data.users?.join(', ')}
                        >
                          {emoji} {data.count}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={basRef} />
          </div>

          <form className="room-input" onSubmit={envoyer}>
            <button type="button" className="btn-upload" onClick={() => fileRef.current?.click()} title="Envoyer un fichier">📎</button>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={uploaderFichier} />
            <input
              value={texte}
              onChange={e => setTexte(e.target.value)}
              placeholder={`Message dans ${room.nom}`}
              autoFocus
            />
            <button type="submit">↑</button>
          </form>
        </>
      )}
    </div>
  )
}
