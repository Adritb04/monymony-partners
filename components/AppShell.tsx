'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import type { Role } from '@/lib/supabase'
import styles from './AppShell.module.css'

interface NavItem {
  href: string
  label: string
  icon: string
}

const navItems: Record<Role, NavItem[]> = {
  partner: [
    { href: '/partner', label: 'Catálogo', icon: '🛒' },
    { href: '/partner/elegidos', label: 'Mis Elegidos', icon: '⭐' },
    { href: '/partner/vendidos', label: 'Vendidos', icon: '✅' },
    { href: '/partner/n8n', label: 'Integración n8n', icon: '🔗' },
  ],
  subadmin: [
    { href: '/subadmin', label: 'Revisar Productos', icon: '📦' },
    { href: '/subadmin/partners', label: 'Gestión Partners', icon: '👥' },
    { href: '/subadmin/ventas', label: 'Historial Ventas', icon: '📊' },
  ],
  admin: [
    { href: '/admin', label: 'Dashboard', icon: '📈' },
    { href: '/admin/categorias', label: 'Categorías', icon: '🏷️' },
    { href: '/admin/partners', label: 'Partners', icon: '👥' },
    { href: '/admin/comisiones', label: 'Comisiones', icon: '💰' },
  ],
}

const badgeClass: Record<Role, string> = {
  partner: styles.badgePartner,
  subadmin: styles.badgeSubadmin,
  admin: styles.badgeAdmin,
}
const badgeLabel: Record<Role, string> = {
  partner: 'Partner',
  subadmin: 'SubAdmin',
  admin: 'Admin',
}

export default function AppShell({
  children,
  requiredRole,
  activeHref,
}: {
  children: React.ReactNode
  requiredRole: Role
  activeHref: string
}) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    if (user.role !== requiredRole) {
      const routes = { partner: '/partner', subadmin: '/subadmin', admin: '/admin' }
      router.replace(routes[user.role])
    }
  }, [user, loading, requiredRole, router])

  if (loading || !user) {
    return (
      <div className={styles.loading}>
        <span>cargando...</span>
      </div>
    )
  }

  const items = navItems[user.role]

  return (
    <div className={styles.shell}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <span className={styles.logo}>PartnerSync</span>
        <span className={`${styles.badge} ${badgeClass[user.role]}`}>
          {badgeLabel[user.role]}
        </span>
        <div className={styles.spacer} />
        <span className={styles.userInfo}>
          Sesión como <strong>{user.name}</strong>
        </span>
        <button className={styles.logoutBtn} onClick={() => { logout(); router.replace('/login') }}>
          ← Salir
        </button>
      </header>

      <div className={styles.body}>
        {/* Sidebar */}
        <nav className={styles.sidebar}>
          <div className={styles.navSection}>
            {{ partner: 'Panel Partner', subadmin: 'Panel SubAdmin', admin: 'Administración' }[user.role]}
          </div>
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${activeHref === item.href ? styles.navActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Content */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  )
}
