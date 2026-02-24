'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

export default function AdminCommissionsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const COLORS = ['#6c63ff','#ff6584','#43e89e','#ffd166']

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: users }, { data: sales }] = await Promise.all([
      supabase.from('users').select('*').eq('role', 'partner'),
      supabase.from('partner_products').select('partner_id, product:products(price)').eq('status', 'sold'),
    ])

    const data = (users || []).map((u: any) => {
      const partnerSales = (sales || []).filter((s: any) => s.partner_id === u.id)
      const revenue = partnerSales.reduce((a: number, s: any) => a + (s.product?.price || 0), 0)
      const commission = revenue * u.commission / 100
      const net = revenue - commission
      return { ...u, revenue, commission, net }
    })
    setRows(data)
    setLoading(false)
  }

  const totalRevenue = rows.reduce((a, r) => a + r.revenue, 0)
  const totalCommissions = rows.reduce((a, r) => a + r.commission, 0)
  const totalNet = rows.reduce((a, r) => a + r.net, 0)

  return (
    <AppShell requiredRole="admin" activeHref="/admin/comisiones">
      <div className="page-title">Comisiones y Pagos</div>
      <div className="page-sub">Resumen financiero por partner</div>

      <div className="grid3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Revenue Total</div>
          <div className="stat-value yellow">€{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Comisiones</div>
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>€{totalCommissions.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Margen Neto</div>
          <div className="stat-value green">€{totalNet.toFixed(2)}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>Cargando...</div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600, marginBottom: 12 }}>
              Desglose por partner
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Partner</th>
                    <th>Revenue</th>
                    <th>Tasa</th>
                    <th>Comisión</th>
                    <th>Neto</th>
                    <th>% del Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const pct = totalRevenue > 0 ? (r.revenue / totalRevenue * 100).toFixed(1) : 0
                    return (
                      <tr key={r.id}>
                        <td><strong>{r.name}</strong></td>
                        <td><span className="mono">€{r.revenue.toLocaleString()}</span></td>
                        <td>{r.commission_rate || r.commission_pct || r.commission}%</td>
                        <td><span className="mono" style={{ color: 'var(--accent2)' }}>€{r.commission.toFixed(2)}</span></td>
                        <td><span className="mono green">€{r.net.toFixed(2)}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden', minWidth: 80 }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600, marginBottom: 12 }}>
              Revenue por partner
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rows.map((r, i) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 110, fontSize: 12, color: 'var(--text2)', textAlign: 'right', flexShrink: 0 }}>
                    {r.name.split(' ')[0]}
                  </div>
                  <div style={{ flex: 1, height: 24, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: totalRevenue > 0 ? `${(r.revenue / totalRevenue * 100).toFixed(0)}%` : '0%',
                      background: COLORS[i % 4],
                      borderRadius: 4,
                      display: 'flex', alignItems: 'center', paddingLeft: 10,
                      fontSize: 12, fontWeight: 600, color: '#fff',
                      transition: 'width .8s ease',
                    }}>
                      €{r.revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}
