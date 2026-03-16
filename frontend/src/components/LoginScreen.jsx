import { useState } from 'react'
import { api } from '../services/api.js'

const AVATARS = ['👤','🧑','👩','🧔','👨‍💻','👩‍💻','🧑‍🎨','👩‍🎤','🧑‍🚀','🦊','🐺','🐸']

export default function LoginScreen({ onConnexion }) {
  const [onglet, setOnglet]     = useState('connexion') // 'connexion' | 'inscription'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [nom, setNom]           = useState('')
  const [avatar, setAvatar]     = useState('👤')
  const [erreur, setErreur]     = useState('')
  const [chargement, setChargement] = useState(false)

  function changerOnglet(o) {
    setOnglet(o)
    setErreur('')
  }

  async function connexion(e) {
    e.preventDefault()
    setErreur('')
    setChargement(true)
    const data = await api.post('/auth/login', { email, password })
    setChargement(false)
    if (data.detail) return setErreur(data.detail)
    onConnexion(data)
  }

  async function inscription(e) {
    e.preventDefault()
    setErreur('')
    setChargement(true)
    const data = await api.post('/auth/register', { email, nom, avatar_emoji: avatar, password })
    setChargement(false)
    if (data.detail) return setErreur(data.detail)
    onConnexion(data)
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🌍</div>
        <h1 className="login-titre">Oria</h1>
        <p className="login-sub">Ton bureau digital</p>

        <div className="login-onglets">
          <button
            className={`onglet-btn ${onglet === 'connexion' ? 'actif' : ''}`}
            onClick={() => changerOnglet('connexion')}
          >
            Connexion
          </button>
          <button
            className={`onglet-btn ${onglet === 'inscription' ? 'actif' : ''}`}
            onClick={() => changerOnglet('inscription')}
          >
            Inscription
          </button>
        </div>

        {onglet === 'connexion' ? (
          <form onSubmit={connexion}>
            <input
              className="input-nom"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              required
            />
            <input
              className="input-nom"
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {erreur && <p className="login-erreur">{erreur}</p>}
            <button className="btn-entrer" type="submit" disabled={chargement}>
              {chargement ? '...' : 'Se connecter →'}
            </button>
          </form>
        ) : (
          <form onSubmit={inscription}>
            <div className="avatar-picker">
              {AVATARS.map(a => (
                <button key={a} type="button"
                  className={`avatar-btn ${avatar === a ? 'actif' : ''}`}
                  onClick={() => setAvatar(a)}>{a}
                </button>
              ))}
            </div>
            <input
              className="input-nom"
              type="text"
              placeholder="Ton prénom ou pseudo"
              value={nom}
              onChange={e => setNom(e.target.value)}
              autoFocus
              required
            />
            <input
              className="input-nom"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="input-nom"
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {erreur && <p className="login-erreur">{erreur}</p>}
            <button className="btn-entrer" type="submit" disabled={chargement}>
              {chargement ? '...' : 'Créer mon compte →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
