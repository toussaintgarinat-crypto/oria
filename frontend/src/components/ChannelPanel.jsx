import { useState } from 'react'
import { api } from '../services/api.js'
import CreateBuildingModal from './CreateBuildingModal.jsx'
import CreateQuartierModal from './CreateQuartierModal.jsx'
import AddRoomModal from './AddRoomModal.jsx'
import EditBuildingModal from './EditBuildingModal.jsx'
import EditRoomModal from './EditRoomModal.jsx'
import EditQuartierModal from './EditQuartierModal.jsx'
import InviteModal from './InviteModal.jsx'

export default function ChannelPanel({
  world, moi, roomActiveIds,
  onEntrerRoom, onWorldMisAJour,
  onOuvrirMembers, onOuvrirDM,
}) {
  const [collapsed, setCollapsed]         = useState({})
  const [creerBuilding, setCreerBuilding] = useState(false)
  const [creerQuartier, setCreerQuartier] = useState(false)
  const [quartierCible, setQuartierCible] = useState(null)
  const [addRoomBuilding, setAddRoomBuilding] = useState(null)
  const [editBuilding, setEditBuilding]   = useState(null)
  const [editRoom, setEditRoom]           = useState(null)
  const [editQuartier, setEditQuartier]   = useState(null)
  const [showInvite, setShowInvite]       = useState(false)

  const estProprietaire = world?.owner_id === moi?.id

  function toggleCollapse(id) {
    setCollapsed(p => ({ ...p, [id]: !p[id] }))
  }

  async function supprimerBuilding(building) {
    if (!confirm(`Supprimer « ${building.nom} » ?`)) return
    await api.del(`/buildings/${building.id}`)
    onWorldMisAJour()
  }

  async function supprimerRoom(room) {
    if (!confirm(`Supprimer « ${room.nom} » ?`)) return
    await api.del(`/buildings/rooms/${room.id}`)
    onWorldMisAJour()
  }

  async function supprimerQuartier(q) {
    if (!confirm(`Supprimer le quartier « ${q.nom} » ?`)) return
    await api.del(`/quartiers/${q.id}`)
    onWorldMisAJour()
  }

  if (!world) return (
    <div className="channel-panel vide">
      <div className="channel-panel-empty">
        <span>🌍</span>
        <p>Sélectionne un monde</p>
      </div>
    </div>
  )

  const buildingsLibres = world.buildings_libres || world.buildings || []
  const quartiers       = world.quartiers || []

  return (
    <div className="channel-panel">
      {/* Header monde */}
      <div className="channel-panel-header" style={{ borderBottom: `2px solid ${world.couleur || '#5865F2'}` }}>
        <div className="channel-panel-world">
          <span className="channel-panel-emoji">{world.emoji}</span>
          <span className="channel-panel-nom">{world.nom}</span>
        </div>
        <div className="channel-panel-header-actions">
          {estProprietaire && (
            <button className="channel-panel-icon-btn" onClick={() => setShowInvite(true)} title="Inviter">✉</button>
          )}
          <button className="channel-panel-icon-btn" onClick={onOuvrirMembers} title="Membres">
            👥 <span>{world.membres?.length || 0}</span>
          </button>
        </div>
      </div>

      {/* Liste des canaux */}
      <div className="channel-panel-body">

        {/* Bâtiments sans quartier */}
        {buildingsLibres.length > 0 && (
          <BuildingSection
            building={null}
            rooms={buildingsLibres.flatMap(b =>
              (b.rooms || []).map(r => ({ ...r, _building: b }))
            )}
            buildings={buildingsLibres}
            roomActiveIds={roomActiveIds}
            onEntrerRoom={onEntrerRoom}
            estProprietaire={estProprietaire}
            onEditerBuilding={b => setEditBuilding(b)}
            onSupprimerBuilding={supprimerBuilding}
            onAjouterRoom={b => setAddRoomBuilding(b)}
            onEditerRoom={r => setEditRoom(r)}
            onSupprimerRoom={supprimerRoom}
            collapsed={collapsed}
            toggleCollapse={toggleCollapse}
          />
        )}

        {/* Quartiers */}
        {quartiers.map(q => (
          <div key={q.id} className="channel-quartier">
            <div className="channel-category-header" onClick={() => toggleCollapse(q.id)}>
              <span className="channel-category-arrow">{collapsed[q.id] ? '▶' : '▼'}</span>
              <span className="channel-category-emoji">{q.emoji}</span>
              <span className="channel-category-nom">{q.nom}</span>
              {estProprietaire && (
                <div className="channel-category-actions" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setQuartierCible(q.id); setCreerBuilding(true) }} title="Ajouter un espace">＋</button>
                  <button onClick={() => setEditQuartier(q)} title="Modifier">✎</button>
                  <button onClick={() => supprimerQuartier(q)} title="Supprimer">✕</button>
                </div>
              )}
            </div>
            {!collapsed[q.id] && q.buildings.map(b => (
              <BuildingSection
                key={b.id}
                building={b}
                rooms={b.rooms || []}
                buildings={null}
                roomActiveIds={roomActiveIds}
                onEntrerRoom={r => onEntrerRoom(r, b)}
                estProprietaire={estProprietaire}
                onEditerBuilding={() => setEditBuilding(b)}
                onSupprimerBuilding={() => supprimerBuilding(b)}
                onAjouterRoom={() => setAddRoomBuilding(b)}
                onEditerRoom={r => setEditRoom(r)}
                onSupprimerRoom={supprimerRoom}
                collapsed={collapsed}
                toggleCollapse={toggleCollapse}
              />
            ))}
          </div>
        ))}

        {/* Boutons admin */}
        {estProprietaire && (
          <div className="channel-panel-admin">
            <button onClick={() => { setQuartierCible(null); setCreerBuilding(true) }}>
              <span>＋</span> Ajouter un espace
            </button>
            <button onClick={() => setCreerQuartier(true)}>
              <span>🏘</span> Ajouter un quartier
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {creerBuilding && (
        <CreateBuildingModal worldId={world.id} quartierId={quartierCible}
          onCree={() => { setCreerBuilding(false); setQuartierCible(null); onWorldMisAJour() }}
          onFermer={() => setCreerBuilding(false)} />
      )}
      {creerQuartier && (
        <CreateQuartierModal worldId={world.id}
          onCree={() => { setCreerQuartier(false); onWorldMisAJour() }}
          onFermer={() => setCreerQuartier(false)} />
      )}
      {addRoomBuilding && (
        <AddRoomModal building={addRoomBuilding}
          onCree={() => { setAddRoomBuilding(null); onWorldMisAJour() }}
          onFermer={() => setAddRoomBuilding(null)} />
      )}
      {editBuilding && (
        <EditBuildingModal building={editBuilding}
          onSave={() => { setEditBuilding(null); onWorldMisAJour() }}
          onFermer={() => setEditBuilding(null)} />
      )}
      {editRoom && (
        <EditRoomModal room={editRoom}
          onSave={() => { setEditRoom(null); onWorldMisAJour() }}
          onFermer={() => setEditRoom(null)} />
      )}
      {editQuartier && (
        <EditQuartierModal quartier={editQuartier}
          onSave={() => { setEditQuartier(null); onWorldMisAJour() }}
          onFermer={() => setEditQuartier(null)} />
      )}
      {showInvite && (
        <InviteModal world={world} onFermer={() => setShowInvite(false)} />
      )}
    </div>
  )
}

/* ── Section bâtiment ── */
function BuildingSection({
  building, rooms, buildings,
  roomActiveIds, onEntrerRoom, estProprietaire,
  onEditerBuilding, onSupprimerBuilding, onAjouterRoom,
  onEditerRoom, onSupprimerRoom,
  collapsed, toggleCollapse,
}) {
  // Si buildings est fourni, on affiche plusieurs bâtiments sans header de quartier
  if (buildings) {
    return buildings.map(b => (
      <BuildingSection
        key={b.id}
        building={b}
        rooms={b.rooms || []}
        buildings={null}
        roomActiveIds={roomActiveIds}
        onEntrerRoom={r => onEntrerRoom(r, b)}
        estProprietaire={estProprietaire}
        onEditerBuilding={() => onEditerBuilding(b)}
        onSupprimerBuilding={() => onSupprimerBuilding(b)}
        onAjouterRoom={() => onAjouterRoom(b)}
        onEditerRoom={onEditerRoom}
        onSupprimerRoom={onSupprimerRoom}
        collapsed={collapsed}
        toggleCollapse={toggleCollapse}
      />
    ))
  }

  const id = building?.id
  const isCollapsed = id ? collapsed[id] : false

  return (
    <div className="channel-building-section">
      {building && (
        <div className="channel-category-header" onClick={() => toggleCollapse(id)}>
          <span className="channel-category-arrow">{isCollapsed ? '▶' : '▼'}</span>
          <span className="channel-category-emoji">{building.emoji}</span>
          <span className="channel-category-nom">{building.nom}</span>
          {estProprietaire && (
            <div className="channel-category-actions" onClick={e => e.stopPropagation()}>
              <button onClick={onAjouterRoom} title="Ajouter une pièce">＋</button>
              <button onClick={onEditerBuilding} title="Modifier">✎</button>
              <button onClick={onSupprimerBuilding} title="Supprimer">✕</button>
            </div>
          )}
        </div>
      )}

      {!isCollapsed && (
        <div className="channel-rooms">
          {rooms.map(room => {
            const icone = room.type === 'vocal' ? '🔊' : room.type === 'texte' ? '💬' : '⚡'
            const actif = roomActiveIds?.has(room.id)
            return (
              <div key={room.id} className={`channel-room-item ${actif ? 'actif' : ''}`}>
                <button className="channel-room-btn" onClick={() => onEntrerRoom(room)}>
                  <span className="channel-room-icone">{icone}</span>
                  <span className="channel-room-nom">{room.nom}</span>
                  {actif && <span className="channel-room-open-dot" />}
                </button>
                {estProprietaire && (
                  <div className="channel-room-actions">
                    <button onClick={() => onEditerRoom(room)} title="Modifier">✎</button>
                    <button onClick={() => onSupprimerRoom(room)} title="Supprimer">✕</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
