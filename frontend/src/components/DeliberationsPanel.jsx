import { useState, useEffect } from 'react'
import { api } from '../services/api.js'

const STATUTS = { en_cours: '🔵 En cours', adopte: '✅ Adopté', rejete: '❌ Rejeté', reporte: '⏸ Reporté' }
const STATUT_COLORS = { en_cours: '#4A90D9', adopte: '#43B581', rejete: '#F04747', reporte: '#FAA61A' }

export default function DeliberationsPanel({ world, moi, onFermer }) {
  const [items, setItems] = useState([])
  const [filtre, setFiltre] = useState('')
  const [form, setForm] = useState(null) // null = fermé, {} = création, {...delib} = édition
  const [pdfUploading, setPdfUploading] = useState(null)
  const isAdmin = world?.owner_id === moi?.id // simplified, ideally check member role

  useEffect(() => { charger() }, [world?.id, filtre])

  async function charger() {
    const path = `/deliberations/world/${world.id}${filtre ? `?statut=${filtre}` : ''}`
    const data = await api.get(path)
    if (data) setItems(data)
  }

  async function sauvegarder(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const body = {
      world_id: world.id,
      numero: fd.get('numero'),
      titre: fd.get('titre'),
      date_seance: fd.get('date_seance'),
      statut: fd.get('statut'),
      objet: fd.get('objet'),
      confidentiel: fd.get('confidentiel') === 'on',
    }
    let result
    if (form?.id) {
      result = await api.patch(`/deliberations/${form.id}`, body)
    } else {
      result = await api.post('/deliberations/', body)
    }
    if (result) { setForm(null); charger() }
  }

  async function supprimer(d) {
    if (!confirm(`Supprimer « ${d.titre} » ?`)) return
    await api.del(`/deliberations/${d.id}`)
    charger()
  }

  async function uploadPdf(d, file) {
    setPdfUploading(d.id)
    const fd = new FormData(); fd.append('file', file)
    await api.upload(`/deliberations/${d.id}/pdf`, fd)
    setPdfUploading(null); charger()
  }

  return (
    <div className="mairie-panel">
      <div className="mairie-panel-header">
        <div className="mairie-panel-title">
          <span>📜</span>
          <h2>Délibérations</h2>
        </div>
        <div className="mairie-panel-actions">
          {isAdmin && (
            <button className="mairie-btn-primary" onClick={() => setForm({})}>＋ Nouvelle délibération</button>
          )}
          <button className="mairie-btn-close" onClick={onFermer}>✕</button>
        </div>
      </div>

      <div className="mairie-filters">
        <button className={`mairie-filter-btn ${!filtre ? 'actif' : ''}`} onClick={() => setFiltre('')}>Toutes</button>
        {Object.entries(STATUTS).map(([k, v]) => (
          <button key={k} className={`mairie-filter-btn ${filtre === k ? 'actif' : ''}`} onClick={() => setFiltre(k)}>{v}</button>
        ))}
      </div>

      <div className="mairie-list">
        {items.length === 0 && <div className="mairie-empty">Aucune délibération</div>}
        {items.map(d => (
          <div key={d.id} className="mairie-card">
            <div className="mairie-card-header">
              <span className="mairie-card-numero">{d.numero}</span>
              <span className="mairie-card-statut" style={{ color: STATUT_COLORS[d.statut] }}>{STATUTS[d.statut] || d.statut}</span>
              {d.confidentiel && <span className="mairie-badge-confidentiel">🔒 Confidentiel</span>}
            </div>
            <div className="mairie-card-titre">{d.titre}</div>
            <div className="mairie-card-meta">
              <span>📅 {d.date_seance}</span>
              {d.objet && <span className="mairie-card-objet">{d.objet}</span>}
            </div>
            <div className="mairie-card-footer">
              {d.has_pdf ? (
                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/deliberations/${d.id}/pdf`} target="_blank" rel="noopener noreferrer" className="mairie-btn-pdf">📄 Voir PDF</a>
              ) : isAdmin && (
                <label className="mairie-btn-pdf-upload">
                  {pdfUploading === d.id ? '⏳ Upload...' : '📎 Joindre PDF'}
                  <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => uploadPdf(d, e.target.files[0])} />
                </label>
              )}
              {isAdmin && (
                <div className="mairie-card-admin-btns">
                  <button onClick={() => setForm(d)}>✎</button>
                  <button onClick={() => supprimer(d)}>🗑</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {form !== null && (
        <div className="mairie-modal-overlay">
          <div className="mairie-modal">
            <h3>{form.id ? 'Modifier la délibération' : 'Nouvelle délibération'}</h3>
            <form onSubmit={sauvegarder}>
              <label>Numéro <input name="numero" defaultValue={form.numero || ''} required /></label>
              <label>Titre <input name="titre" defaultValue={form.titre || ''} required /></label>
              <label>Date de séance <input name="date_seance" type="date" defaultValue={form.date_seance || ''} required /></label>
              <label>Statut
                <select name="statut" defaultValue={form.statut || 'en_cours'}>
                  {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label>Objet <textarea name="objet" defaultValue={form.objet || ''} rows={3} /></label>
              <label className="mairie-checkbox-label">
                <input name="confidentiel" type="checkbox" defaultChecked={form.confidentiel} />
                Confidentiel (réservé aux admins)
              </label>
              <div className="mairie-modal-btns">
                <button type="submit" className="mairie-btn-primary">Sauvegarder</button>
                <button type="button" onClick={() => setForm(null)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
