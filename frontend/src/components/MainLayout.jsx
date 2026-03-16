import { useState, useEffect, useRef, useCallback } from 'react'
import WorldSidebar from './WorldSidebar.jsx'
import ChannelPanel from './ChannelPanel.jsx'
import RoomView from './RoomView.jsx'
import MembersPanel from './MembersPanel.jsx'
import DMPanel from './DMPanel.jsx'
import NetworkView from './NetworkView.jsx'
import CreateWorldModal from './CreateWorldModal.jsx'
import { api } from '../services/api.js'

export default function MainLayout({ moi, onDeconnexion }) {
  const [worlds, setWorlds]                 = useState([])
  const [worldActif, setWorldActif]         = useState(null)
  const [roomsOuvertes, setRoomsOuvertes]   = useState([])   // [{ room, building }]
  const [largeurs, setLargeurs]             = useState([])   // flex values
  const [creerWorld, setCreerWorld]         = useState(false)
  const [showMembers, setShowMembers]       = useState(false)
  const [dmDestinataire, setDmDestinataire] = useState(null)
  const [showNetwork, setShowNetwork]       = useState(false)

  const resizeRef = useRef(null) // { index, startX, startWidths, containerWidth }

  useEffect(() => { chargerWorlds(); gererInvitation() }, [])

  async function gererInvitation() {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('invite')
    if (!token) return
    await api.post(`/invitations/${token}/rejoindre`, { user_id: moi.id })
    window.history.replaceState({}, '', '/')
    chargerWorlds()
  }

  async function chargerWorlds() {
    const data = await api.get('/worlds')
    if (Array.isArray(data)) {
      setWorlds(data)
      if (data.length > 0 && !worldActif) chargerWorldComplet(data[0].id)
    }
  }

  async function chargerWorldComplet(id) {
    const data = await api.get(`/worlds/${id}`)
    setWorldActif(data)
    // On ne ferme PAS les panneaux ouverts d'autres mondes
    setShowMembers(false)
    setDmDestinataire(null)
    setShowNetwork(false)
  }

  function entrerRoom(room, building) {
    setShowMembers(false)
    setDmDestinataire(null)
    setRoomsOuvertes(prev => {
      if (prev.find(r => r.room.id === room.id)) return prev
      const next = [...prev, { room, building, world: worldActif }]
      setLargeurs(next.map(() => 1))
      return next
    })
  }

  function quitterRoom(roomId) {
    setRoomsOuvertes(prev => {
      const next = prev.filter(r => r.room.id !== roomId)
      setLargeurs(next.map(() => 1))
      return next
    })
  }

  function ouvrirMembers() {
    setShowMembers(true)
    setDmDestinataire(null)
  }

  function ouvrirDM(membre) {
    setDmDestinataire(membre)
    setShowMembers(false)
  }

  function basculerNetwork() {
    setShowNetwork(v => !v)
    if (!showNetwork) {
      setShowMembers(false)
      setDmDestinataire(null)
    }
  }

  async function onWorldCree(world) {
    await chargerWorlds()
    chargerWorldComplet(world.id)
    setCreerWorld(false)
  }

  // ── Redimensionnement ──────────────────────────────────────────
  const startResize = useCallback((index, e) => {
    e.preventDefault()
    const container = e.currentTarget.parentElement
    resizeRef.current = {
      index,
      startX: e.clientX,
      startLargeurs: [...largeurs],
      containerW: container.getBoundingClientRect().width,
    }

    function onMove(e) {
      const { index, startX, startLargeurs, containerW } = resizeRef.current
      const delta = e.clientX - startX
      // Convertir delta en unités flex
      const totalFlex = startLargeurs.reduce((a, b) => a + b, 0)
      const flexPerPx = totalFlex / containerW
      const deltaFlex = delta * flexPerPx

      const next = [...startLargeurs]
      next[index]     = Math.max(0.15, startLargeurs[index] + deltaFlex)
      next[index + 1] = Math.max(0.15, startLargeurs[index + 1] - deltaFlex)
      setLargeurs(next)
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      resizeRef.current = null
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [largeurs])

  // ── Zone principale ────────────────────────────────────────────
  const roomIds = new Set(roomsOuvertes.map(r => r.room.id))

  let contenuPrincipal
  if (showNetwork) {
    contenuPrincipal = (
      <NetworkView moi={moi} onOuvrirWorld={w => { setShowNetwork(false); chargerWorldComplet(w.id) }} />
    )
  } else if (dmDestinataire) {
    contenuPrincipal = (
      <DMPanel world={worldActif} moi={moi} destinataire={dmDestinataire} onFermer={() => setDmDestinataire(null)} />
    )
  } else if (showMembers) {
    contenuPrincipal = (
      <MembersPanel world={worldActif} moi={moi} onFermer={() => setShowMembers(false)} onOuvrirDM={ouvrirDM} />
    )
  } else if (roomsOuvertes.length > 0) {
    contenuPrincipal = (
      <div className="multiview">
        {roomsOuvertes.map((ra, i) => (
          <div key={ra.room.id} className="multiview-wrapper" style={{ flex: largeurs[i] ?? 1 }}>
            <RoomView
              room={ra.room}
              building={ra.building}
              world={ra.world}
              moi={moi}
              onQuitter={() => quitterRoom(ra.room.id)}
            />
            {i < roomsOuvertes.length - 1 && (
              <div
                className="resize-handle"
                onMouseDown={e => startResize(i, e)}
                title="Glisser pour redimensionner"
              />
            )}
          </div>
        ))}
      </div>
    )
  } else {
    contenuPrincipal = (
      <div className="main-welcome">
        {worldActif ? (
          <>
            <span className="main-welcome-emoji">{worldActif.emoji}</span>
            <h2>{worldActif.nom}</h2>
            <p>Sélectionne un salon dans le panel de gauche</p>
          </>
        ) : (
          <>
            <span className="main-welcome-emoji">🌍</span>
            <p>Crée ou rejoins un monde pour commencer</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="layout">
      <WorldSidebar
        worlds={worlds}
        worldActifId={worldActif?.id}
        moi={moi}
        onSelectWorld={id => { setShowNetwork(false); chargerWorldComplet(id) }}
        onCreerWorld={() => setCreerWorld(true)}
        onDeconnexion={onDeconnexion}
        onNetwork={basculerNetwork}
        showNetwork={showNetwork}
      />

      {!showNetwork && (
        <ChannelPanel
          world={worldActif}
          moi={moi}
          roomActiveIds={roomIds}
          onEntrerRoom={entrerRoom}
          onWorldMisAJour={() => chargerWorldComplet(worldActif?.id)}
          onOuvrirMembers={ouvrirMembers}
          onOuvrirDM={ouvrirDM}
        />
      )}

      <div className="main-content">
        {contenuPrincipal}
      </div>

      {creerWorld && (
        <CreateWorldModal onCree={onWorldCree} onFermer={() => setCreerWorld(false)} />
      )}
    </div>
  )
}
