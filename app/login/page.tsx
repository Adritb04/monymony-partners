'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import styles from './login.module.css'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) { setError('Completa todos los campos'); return }
    setLoading(true)
    setError('')
    const err = await login(username, password)
    if (err) { setError(err); setLoading(false) }
    else router.replace('/')
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <div className={styles.logo}>
            Mony<span className={styles.logoRed}>Mony</span>
          </div>
          <div className={styles.tagline}>Sistema de gestión de partners</div>
        </div>
        <div className={styles.divider} />

        <form onSubmit={handleLogin}>
          <div className="field">
            <label>Usuario</label>
            <input type="text" placeholder="nombre de usuario" value={username}
              onChange={e => setUsername(e.target.value)} autoComplete="username" />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <div className={styles.error}>⚠ {error}</div>}
          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>
        </form>

        <div className={styles.hint}>
          El rol se asigna automáticamente según tu cuenta.<br />
          Contacta con el administrador si no tienes acceso.
        </div>
      </div>
    </div>
  )
}
