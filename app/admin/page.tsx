'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ partners: 0, products: 0, sales: 0, revenue: 0 })
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [topCats, setTopCats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: partners }, { data: products }, { data: sales }] = await Promise.all([
      supabase.from('users').select('id').eq('role', 'partner').eq('status', 'active'),
      supabase.from('products').select('id').eq('status', 'available'),
      supabase.from('partner_products').select('*, product:products(price, category)').eq('status', 'sold'),
    ])

    const revenue = (sales || []).reduce((a: number, s: any) => a + (s.product?.price || 0), 0)
    setStats({
      partners: (partners || []).length,
      products: (products || []).length,
      sales: (sales || []).length,
      revenue,
    })

    // Group sales by month
    const byMonth: Record<number, number> = {}
    ;(sales || []).forEach((s: any) => {
      if (s.sold_at) {
        const m = new Date(s.sold_at).getMonth()
        byMonth[m] = (byMonth[m] || 0) + 1
      }
    })
    setMonthlyData(MONTHS.map((name, i) => ({ name, ventas: byMonth[i] || 0 })))

    // Group by category
    const byCat: Record<string, number> = {}
    ;(sales || []).forEach((s: any) => {
      const cat = s.product?.category || 'Sin categoría'
      byCat[cat] = (byCat[cat] || 0) + 1
    })
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 6)
    setTopCats(cats.map(([name, value]) => ({ name, value })))

    setLoading(false)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
          <div style={{ color: 'var(--text2)' }}>{label}</div>
          <div style={{ color: 'var(--accent)', fontWeight: 600 }}>{payload[0].value} ventas</div>
        </div>
      )
    }
    return null
  }

  return (
    <AppShell requiredRole="admin" activeHref="/admin">
      <div className="page-title">Dashboard General</div>
      <div className="page-sub">Visión global del sistema · {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</div>

      <div className="grid4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Partners Activos</div>
          <div className="stat-value accent">{loading ? '—' : stats.partners}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Productos</div>
          <div className="stat-value">{loading ? '—' : stats.products}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ventas Totales</div>
          <div className="stat-value green">{loading ? '—' : stats.sales}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Facturación</div>
          <div className="stat-value yellow">{loading ? '—' : `€${stats.revenue.toLocaleString()}`}</div>
        </div>
      </div>

      <div className="grid2" style={{ gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600, marginBottom: 16 }}>
            Ventas por mes
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108,99,255,0.05)' }} />
              <Bar dataKey="ventas" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600, marginBottom: 16 }}>
            Top categorías vendidas
          </div>
          {topCats.length === 0 ? (
            <div style={{ color: 'var(--text2)', fontSize: 13, padding: 20, textAlign: 'center' }}>Sin datos aún</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topCats.map((cat, i) => {
                const COLORS = ['#6c63ff', '#ff6584', '#43e89e', '#ffd166', '#38bdf8', '#fb923c']
                const max = topCats[0].value
                return (
                  <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 90, fontSize: 12, color: 'var(--text2)', textAlign: 'right', flexShrink: 0 }}>{cat.name}</div>
                    <div style={{ flex: 1, height: 22, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(cat.value / max * 100).toFixed(0)}%`,
                        background: COLORS[i % 6],
                        borderRadius: 4,
                        display: 'flex', alignItems: 'center', paddingLeft: 8,
                        fontSize: 11, fontWeight: 600, color: '#fff',
                        transition: 'width .8s ease',
                      }}>
                        {cat.value}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
