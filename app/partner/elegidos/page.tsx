'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase, type Product, type PartnerProduct } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

export default function ElegidosPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<(PartnerProduct & { product: Product })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('partner_products')
      .select('*, product:products(*)')
      .eq('partner_id', user.id)
      .eq('status', 'selected')
      .then(({ data }) => {
        setItems((data as any) || [])
        setLoading(false)
      })
  }, [user])

  return (
    <AppShell requiredRole="partner" activeHref="/partner/elegidos">
      <div className="page-title">Mis Productos Elegidos</div>
      <div className="page-sub">{items.length} producto{items.length !== 1 ? 's' : ''} activos en tu tienda</div>

      {loading ? (
        <div style={{ color: 'var(--text2)', padding: 48, textAlign: 'center' }}>Cargando...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <div>Aún no has elegido productos.</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>Ve al Catálogo para empezar.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 16 }}>
          {items.map(item => (
            <div key={item.id} className="card" style={{ border: '1px solid var(--accent)' }}>
              <div style={{ fontSize: 40, textAlign: 'center', padding: '16px 0', background: 'var(--surface2)', borderRadius: 8, marginBottom: 12 }}>
                {item.product.emoji}
              </div>
              <div style={{ fontWeight: 600 }}>{item.product.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', margin: '4px 0 8px' }}>{item.product.category}</div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', color: 'var(--accent3)', fontSize: 16, fontWeight: 600 }}>
                €{item.product.price.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
