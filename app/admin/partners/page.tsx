'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase, type Partner } from '@/lib/supabase'

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<(Partner & { selected: number; sold: number; revenue: number })[]>([])
  const [loading, setLoading] = useState(true)
  const COLORS = ['#6c63ff','#ff6584','#43e89e','#ffd166']

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: users }, { data: selections }] = await Promise.all([
      supabase.from('users').select('*').eq('role', 'partner').order('created_at'),
      supabase.from('partner_products').select('*, product:products(price)'),
    ])

    const enriched = (users || []).map((u: any) => {
      const partnerSels = (selections || []).filter((s: any) => s.partner_id === u.id)
      const sold = partnerSels.filter((s: any) => s.status === 'sold')
      const revenue = sold.reduce((a: number, s: any) => a + (s.product?.price || 0), 0)
      return {
        ...u,
        selected: partnerSels.filter((s: any) => s.status === 'selected').length,
        sold: sold.length,
        revenue,
      }
    })
    setPartners(enriched)
    setLoading(false)
  }

  return (
    <AppShell requiredRole="admin" activeHref="/admin/partners">
      <div className="page-title">Rendimiento de Partners</div>
      <div className="page-sub">Métricas de actividad y uso</div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>Cargando...</div>
      ) : (
        <div className="grid2" style={{ gap: 16 }}>
          {partners.map((p, i) => (
            <div key={p.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>@{p.username} · {p.email}</div>
                </div>
                <span className={`pill pill-${p.status === 'active' ? 'active' : p.status === 'pending' ? 'pending' : 'inactive'}`}>
                  {{ active: 'Activo', pending: 'Pendiente', inactive: 'Inactivo' }[p.status]}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'elegidos', value: p.selected, color: 'var(--accent)' },
                  { label: 'vendidos', value: p.sold, color: 'var(--accent3)' },
                  { label: 'comisión', value: `${p.commission}%`, color: 'var(--accent4)' },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center', padding: '10px 0', background: 'var(--surface2)', borderRadius: 8 }}>
                    <div style={{ fontSize: 22, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
                Alta: <span style={{ color: 'var(--text)' }}>{new Date(p.created_at).toLocaleDateString('es-ES')}</span>
              </div>

              <div style={{ padding: '10px 0 0', borderTop: '1px solid var(--border)', fontSize: 13 }}>
                Revenue total:{' '}
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent4)', fontWeight: 600 }}>
                  €{p.revenue.toLocaleString()}
                </span>
                <div style={{ marginTop: 8, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: partners.length > 0 && Math.max(...partners.map(p => p.revenue)) > 0
                      ? `${(p.revenue / Math.max(...partners.map(x => x.revenue)) * 100).toFixed(0)}%`
                      : '0%',
                    background: COLORS[i % 4],
                    borderRadius: 3,
                    transition: 'width .8s ease',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
