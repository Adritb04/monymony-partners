'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

export default function SubAdminSalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('partner_products')
      .select('*, product:products(*), partner:users!partner_id(name, commission)')
      .eq('status', 'sold')
      .order('sold_at', { ascending: false })
      .then(({ data }) => {
        setSales(data || [])
        setLoading(false)
      })
  }, [])

  const totalRevenue = sales.reduce((a, s) => a + (s.product?.price || 0), 0)
  const totalCommissions = sales.reduce((a, s) => a + ((s.product?.price || 0) * (s.partner?.commission || 0) / 100), 0)

  return (
    <AppShell requiredRole="subadmin" activeHref="/subadmin/ventas">
      <div className="page-title">Historial de Ventas</div>
      <div className="page-sub">Registro completo de transacciones</div>

      <div className="grid3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Ventas</div>
          <div className="stat-value green">{sales.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Facturación</div>
          <div className="stat-value yellow">€{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Comisiones</div>
          <div className="stat-value accent">€{totalCommissions.toFixed(2)}</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>Cargando...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th>Fecha</th><th>Producto</th><th>Partner</th><th>Precio</th><th>Comisión</th></tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text2)' }}>
                      {s.sold_at ? new Date(s.sold_at).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td><span style={{ marginRight: 8 }}>{s.product?.emoji}</span><strong>{s.product?.name}</strong></td>
                    <td>{s.partner?.name}</td>
                    <td><span className="mono">€{s.product?.price?.toLocaleString()}</span></td>
                    <td><span className="mono green">€{((s.product?.price || 0) * (s.partner?.commission || 0) / 100).toFixed(2)}</span></td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text2)' }}>No hay ventas registradas aún</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
