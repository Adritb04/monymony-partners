'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase, type Product } from '@/lib/supabase'

export default function SubAdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('products').update({ status }).eq('id', id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: status as any } : p))
    showToast(status === 'available' ? '✅ Producto aprobado' : '🗑 Producto archivado')
  }

  const pending = products.filter(p => p.status === 'available').length
  const archived = products.filter(p => p.status === 'archived').length

  return (
    <AppShell requiredRole="subadmin" activeHref="/subadmin">
      <div className="page-title">Revisión de Productos</div>
      <div className="page-sub">Gestiona el catálogo de productos disponibles</div>

      <div className="grid3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Productos</div>
          <div className="stat-value">{products.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Disponibles</div>
          <div className="stat-value green">{pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Archivados</div>
          <div className="stat-value" style={{ color: 'var(--text2)' }}>{archived}</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>Cargando...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ marginRight: 8, fontSize: 20 }}>{p.emoji}</span>
                      <strong>{p.name}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{p.description}</div>
                    </td>
                    <td style={{ color: 'var(--text2)' }}>{p.category}</td>
                    <td><span className="mono">€{p.price.toLocaleString()}</span></td>
                    <td>{p.stock}</td>
                    <td>
                      <span className={`pill ${p.status === 'available' ? 'pill-active' : 'pill-inactive'}`}>
                        {p.status === 'available' ? 'Disponible' : 'Archivado'}
                      </span>
                    </td>
                    <td>
                      {p.status === 'available' ? (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => updateStatus(p.id, 'archived')}
                        >
                          Archivar
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => updateStatus(p.id, 'available')}
                        >
                          Publicar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: 'var(--surface2)', border: '1px solid var(--accent3)',
          borderRadius: 10, padding: '12px 18px', fontSize: 13,
          boxShadow: 'var(--shadow)', zIndex: 1000,
        }}>
          {toast}
        </div>
      )}
    </AppShell>
  )
}
