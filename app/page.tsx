'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
    } else {
      const routes = { partner: '/partner', subadmin: '/subadmin', admin: '/admin' }
      router.replace(routes[user.role])
    }
  }, [user, loading, router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ color: 'var(--text2)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
        cargando...
      </div>
    </div>
  )
}
