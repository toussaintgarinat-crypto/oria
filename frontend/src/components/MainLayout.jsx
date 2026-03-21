import { useState, useEffect, useRef, useCallback } from 'react'
import WorldSidebar from './WorldSidebar.jsx'
import ChannelPanel from './ChannelPanel.jsx'
import RoomView from './RoomView.jsx'
import MembersPanel from './MembersPanel.jsx'
import DMPanel from './DMPanel.jsx'
import NetworkView from './NetworkView.jsx'
import CreateWorldModal from './CreateWorldModal.jsx'
import { api } from '../services/api.js'
import Toast from './Toast.jsx'
import SyncStatus from './SyncStatus.jsx'
import SettingsModal from './SettingsModal.jsx'
import DocumentsPanel from './DocumentsPanel.jsx'
import DeliberationsPanel from './DeliberationsPanel.jsx'
import ArretesPanel from './ArretesPanel.jsx'
import ConseilPanel from './ConseilPanel.jsx'
import AnnuairePanel from './AnnuairePanel.jsx'
import TicketsPanel from './TicketsPanel.jsx'
import AuditPanel from './AuditPanel.jsx'
import TableauBordMaire from './TableauBordMaire.jsx'
import { useUnreadCounts } from '../hooks/useUnreadCounts.js'
import { useUnreadDMCounts } from '../hooks/useUnreadDMCounts.js'

export default function MainLayout({ moi, onMoiUpdate, onDeconnexion }) {
  const [worlds, setWorlds]                 = useState([])
  const [worldActif, setWorldActif]         = useState(null)
  const [roomsOuvertes, setRoomsOuvertes]   = useState([])   // [{ room, building }]
  const [largeurs, setLargeurs]             = useState([])   // flex values
  const [creerWorld, setCreerWorld]         = useState(false)
  const [showMembers, setShowMembers]       = useState(false)
  const [dmDestinataire, setDmDestinataire] = useState(null)
  const [showNetwork, setShowNetwork]       = useState(false)
  const [showSettings, setShowSettings]     = useState(false)
  const [docsScope, setDocsScope]           = useState(null) // { type, id, nom }
  const [outilActif, setOutilActif]         = useState(null) // 'deliberations' | 'arretes' | 'conseil' | 'annuaire' | 'tickets' | 'audit' | 'tableau'

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
    setDocsScope(null)
    setOutilActif(null)
    markAsRead(room.matrix_room_id)
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

  function ouvrirOutil(outil) {
    setOutilActif(outil)
    setShowMembers(false)
    setDmDestinataire(null)
    setDocsScope(null)
  }

  function ouvrirDM(membre) {
    setDmDestinataire(membre)
    setShowMembers(false)
    markDMAsRead(membre.matrix_user_id)
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

  // ── Messages non lus ───────────────────────────────────────────
  const activeMatrixRoomIds = new Set(
    roomsOuvertes.map(r => r.room.matrix_room_id).filter(Boolean)
  )
  const { counts: unreadCounts, markAsRead } = useUnreadCounts(activeMatrixRoomIds)
  const { total: dmUnreadTotal, byMxid: dmUnreadByMxid, markDMAsRead } = useUnreadDMCounts(
    dmDestinataire?.matrix_user_id || null
  )

  // ── Zone principale ────────────────────────────────────────────
  const roomIds = new Set(roomsOuvertes.map(r => r.room.id))

  let contenuPrincipal
  if (showNetwork) {
    contenuPrincipal = (
      <NetworkView moi={moi} onOuvrirWorld={w => { setShowNetwork(false); chargerWorldComplet(w.id) }} />
    )
  } else if (docsScope) {
    contenuPrincipal = (
      <DocumentsPanel
        scope={docsScope.type}
        scopeId={docsScope.id}
        scopeNom={docsScope.nom}
        moi={moi}
        onFermer={() => setDocsScope(null)}
      />
    )
  } else if (outilActif === 'deliberations') {
    contenuPrincipal = <DeliberationsPanel world={worldActif} moi={moi} onFermer={() => setOutilActif(null)} />
  } else if (outilActif === 'arretes') {
    contenuPrincipal = <ArretesPanel world={worldActif} moi={moi} onFermer={() => setOutilActif(null)} />
  } else if (outilActif === 'conseil') {
    contenuPrincipal = <ConseilPanel world={worldActif} moi={moi} onFermer={() => setOutilActif(null)} />
  } else if (outilActif === 'annuaire') {
    contenuPrincipal = <AnnuairePanel world={worldActif} moi={moi} onFermer={() => setOutilActif(null)} />
  } else if (outilActif === 'tickets') {
    contenuPrincipal = <TicketsPanel world={worldActif} moi={moi} onFermer={() => setOutilActif(null)} />
  } else if (outilActif === 'audit') {
    contenuPrincipal = <AuditPanel world={worldActif} moi={moi} onFermer={() => setOutilActif(null)} />
  } else if (outilActif === 'tableau') {
    contenuPrincipal = <TableauBordMaire world={worldActif} moi={moi} onFermer={() => setOutilActif(null)} />
  } else if (dmDestinataire) {
    contenuPrincipal = (
      <DMPanel world={worldActif} moi={moi} destinataire={dmDestinataire} onFermer={() => setDmDestinataire(null)} />
    )
  } else if (showMembers) {
    contenuPrincipal = (
      <MembersPanel world={worldActif} moi={moi} onFermer={() => setShowMembers(false)} onOuvrirDM={ouvrirDM} dmUnreadByMxid={dmUnreadByMxid} />
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
            <p>Sélectionne une salle dans le panel de gauche</p>
          </>
        ) : (
          <>
            <span className="main-welcome-emoji">🌍</span>
            <p>Crée ou rejoins une commune pour commencer</p>
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
        onSettings={() => setShowSettings(true)}
      />

      {!showNetwork && (
        <ChannelPanel
          world={worldActif}
          moi={moi}
          roomActiveIds={roomIds}
          unreadCounts={unreadCounts}
          dmUnreadTotal={dmUnreadTotal}
          onEntrerRoom={entrerRoom}
          onWorldMisAJour={() => chargerWorldComplet(worldActif?.id)}
          onOuvrirMembers={ouvrirMembers}
          onOuvrirDM={ouvrirDM}
          onOuvrirDocs={(type, id, nom) => {
            setDocsScope({ type, id, nom })
            setShowMembers(false)
            setDmDestinataire(null)
          }}
          onOuvrirOutil={ouvrirOutil}
        />
      )}

      <div className="main-content">
        {contenuPrincipal}
      </div>

      {creerWorld && (
        <CreateWorldModal onCree={onWorldCree} onFermer={() => setCreerWorld(false)} />
      )}

      {showSettings && (
        <SettingsModal
          moi={moi}
          onSauvegarde={user => { onMoiUpdate(user); setShowSettings(false) }}
          onDeconnexion={onDeconnexion}
          onFermer={() => setShowSettings(false)}
        />
      )}

      <Toast />
      <SyncStatus />
    </div>
  )
}
