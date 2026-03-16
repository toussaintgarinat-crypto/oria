import { useState } from 'react'
import LoginScreen from './components/LoginScreen.jsx'
import MainLayout from './components/MainLayout.jsx'

// Décode le payload JWT (base64) sans vérification côté client
function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return { id: decoded.sub, nom: decoded.nom, avatar_emoji: decoded.avatar_emoji }
  } catch {
    return null
  }
}

export default function App() {
  const [moi, setMoi] = useState(() => {
    const token = localStorage.getItem('oria_token')
    if (!token) return null
    return decodeToken(token)
  })

  function connecter({ token, user }) {
    localStorage.setItem('oria_token', token)
    setMoi(user)
  }

  function deconnecter() {
    localStorage.removeItem('oria_token')
    setMoi(null)
  }

  if (!moi) return <LoginScreen onConnexion={connecter} />
  return <MainLayout moi={moi} onDeconnexion={deconnecter} />
}
