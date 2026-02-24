'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, type Role } from './supabase'

interface User {
  id: string
  username: string
  name: string
  role: Role
  commission?: number
}

interface AuthCtx {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<string | null>
  logout: () => void
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => null,
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('ps_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password) // en producción usar bcrypt
      .single()

    if (error || !data) return 'Usuario o contraseña incorrectos'
    if (data.status === 'inactive') return 'Cuenta inactiva. Contacta con el administrador.'
    if (data.status === 'pending') return 'Cuenta pendiente de activación.'

    const u: User = {
      id: data.id,
      username: data.username,
      name: data.name,
      role: data.role,
      commission: data.commission,
    }
    setUser(u)
    localStorage.setItem('ps_user', JSON.stringify(u))
    return null
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('ps_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
