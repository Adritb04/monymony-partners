'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

export default function AdminCategoriesPage() {
  const [data, setData] = useState<{ cat: string; count: number; sold: number }[]>([])
  const [loading, setLoading] = useState(true)
  const COLORS = ['#6c63ff','#ff6584','#43e89e','#ffd166','#38bdf8','#fb923c']

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('category'),
      supabase.from('partner_products').select('product:products(category)').eq('status', 'sold'),
    ]).then(([{ data: prods }, { data: sales }]) => {
      const catCount: Record<string, number> = {}
      const catSold: Record<string, number> = {}
      ;(prods || []).forEach((p: any) => { catCount[p.category] = (catCount[p.category] || 0) + 1 })
      ;(sales || []).forEach((s: any) => {
        const c = s.product?.category
        if (c) catSold[c] = (catSold[c] || 0) + 1
      })
      const cats = Object.keys(catCount).map(cat => ({ cat, count: catCount[cat], sold: catSold[cat] || 0 }))
        .sort((a, b) => b.count - a.count)
      setData(cats)
      setLoading(false)
    })
  }, [])

  const maxCount = data.length > 0 ? Math.max(...data.map(d => d.count)) : 1

  return (
    <AppShell requiredRole="admin" activeHref="/admin/categorias">
      <div className="page-title">Análisis por Categorías</div>
      <div className="page-sub">Distribución y rendimiento de cada categoría</div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>Cargando...</div>
      ) : (
        <div className="grid2" style={{ gap: 16 }}>
          <div className="card">
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600, marginBottom: 16 }}>
              Productos por categoría
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.map((d, i) => (
                <div key={d.cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 100, fontSize: 12, color: 'var(--text2)', textAlign: 'right', flexShrink: 0 }}>{d.cat}</div>
                  <div style={{ flex: 1, height: 22, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      width: `${(d.count / maxCount * 100).toFixed(0)}%`,
                      background: COLORS[i % 6],
                      display: 'flex', alignItems: 'center', paddingLeft: 8,
                      fontSize: 11, fontWeight: 600, color: '#fff',
                      transition: 'width .8s ease',
                    }}>
                      {d.count} prod.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600, marginBottom: 12 }}>
              Resumen
            </div>
            <table>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Productos</th>
                  <th>Ventas</th>
                  <th>Conv.</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d, i) => (
                  <tr key={d.cat}>
                    <td>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: COLORS[i % 6], marginRight: 8 }} />
                      {d.cat}
                    </td>
                    <td className="mono">{d.count}</td>
                    <td className="mono green">{d.sold}</td>
                    <td>
                      <div style={{ width: 60, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${d.count > 0 ? (d.sold/d.count*100).toFixed(0) : 0}%`, background: COLORS[i%6], borderRadius: 3 }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  )
}
