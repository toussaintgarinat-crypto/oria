export default function WorldSidebar({ worlds, worldActifId, moi, onSelectWorld, onCreerWorld, onDeconnexion, onNetwork, showNetwork, onSettings }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">🏛</div>
      <div className="sidebar-divider" />

      <div className="sidebar-worlds">
        {worlds.map(w => (
          <button
            key={w.id}
            className={`world-btn ${worldActifId === w.id ? 'actif' : ''}`}
            onClick={() => onSelectWorld(w.id)}
            title={w.nom}
            style={{ '--couleur': w.couleur }}
          >
            <span className="world-btn-emoji">{w.emoji}</span>
            <span className="world-btn-tooltip">{w.nom}</span>
          </button>
        ))}
      </div>

      <button className="world-btn add" onClick={onCreerWorld} title="Créer une commune">
        <span>＋</span>
        <span className="world-btn-tooltip">Nouvelle commune</span>
      </button>

      <button
        className={`world-btn network-btn ${showNetwork ? 'actif' : ''}`}
        onClick={onNetwork}
        title="Intercommunalité"
      >
        <span>🏘</span>
        <span className="world-btn-tooltip">Intercommunalité</span>
      </button>

      <div className="sidebar-bottom">
        <div className="sidebar-divider" />
        <button className="moi-btn" onClick={onSettings} title="Paramètres">
          <span>{moi.avatar_emoji}</span>
        </button>
      </div>
    </div>
  )
}
