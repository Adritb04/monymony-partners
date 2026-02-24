'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase, type Product, type PartnerProduct } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

export default function VendidosPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<(PartnerProduct & { product: Product })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('partner_products')
      .select('*, product:products(*)')
      .eq('partner_id', user.id)
      .eq('status', 'sold')
      .order('sold_at', { ascending: false })
      .then(({ data }) => {
        setItems((data as any) || [])
        setLoading(false)
      })
  }, [user])

  const revenue = items.reduce((a, i) => a + (i.product?.price || 0), 0)
  const commission = (revenue * ((user?.commission || 0) / 100))

  return (
    <AppShell requiredRole="partner" activeHref="/partner/vendidos">
      <div className="page-title">Productos Vendidos</div>
      <div className="page-sub">Historial de ventas realizadas</div>

      <div className="grid3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Vendidos</div>
          <div className="stat-value green">{items.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ingresos</div>
          <div className="stat-value yellow">€{revenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tu Comisión ({user?.commission}%)</div>
          <div className="stat-value accent">€{commission.toFixed(2)}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text2)', padding: 48, textAlign: 'center' }}>Cargando...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
          Aún no tienes ventas registradas.
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Comisión</th>
                <th>Vendido el</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td><span style={{ marginRight: 8 }}>{item.product.emoji}</span><strong>{item.product.name}</strong></td>
                  <td style={{ color: 'var(--text2)' }}>{item.product.category}</td>
                  <td><span className="mono">€{item.product.price.toLocaleString()}</span></td>
                  <td><span className="mono green">€{(item.product.price * (user?.commission || 0) / 100).toFixed(2)}</span></td>
                  <td style={{ color: 'var(--text2)' }}>
                    {item.sold_at ? new Date(item.sold_at).toLocaleDateString('es-ES') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  )
}
