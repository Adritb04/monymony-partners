'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase, type Product, type PartnerProduct } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import styles from './partner.module.css'

export default function PartnerCatalogPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [selections, setSelections] = useState<PartnerProduct[]>([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)

  useEffect(() => { loadData() }, [user])

  async function loadData() {
    if (!user) return
    const [{ data: prods }, { data: sels }] = await Promise.all([
      supabase.from('products').select('*').eq('status', 'available').order('name'),
      supabase.from('partner_products').select('*').eq('partner_id', user.id),
    ])
    setProducts(prods || [])
    setSelections(sels || [])
    setLoading(false)
  }

  const getSelection = (productId: string) => selections.find(s => s.product_id === productId)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const toggleSelect = async (productId: string) => {
    if (!user) return
    const existing = getSelection(productId)
    if (existing) {
      await supabase.from('partner_products').delete().eq('id', existing.id)
      setSelections(prev => prev.filter(s => s.id !== existing.id))
      showToast('Producto eliminado de tus elegidos')
    } else {
      const { data } = await supabase.from('partner_products').insert({
        partner_id: user.id, product_id: productId, status: 'selected',
        updated_at: new Date().toISOString(),
      }).select().single()
      if (data) { setSelections(prev => [...prev, data]); showToast('✅ Producto añadido a tus elegidos') }
    }
  }

  const toggleSold = async (productId: string) => {
    const existing = getSelection(productId)
    if (!existing) return
    const newStatus = existing.status === 'sold' ? 'selected' : 'sold'
    const { data } = await supabase.from('partner_products').update({
      status: newStatus,
      sold_at: newStatus === 'sold' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id).select().single()
    if (data) {
      setSelections(prev => prev.map(s => s.id === data.id ? data : s))
      showToast(newStatus === 'sold' ? '🎉 Marcado como vendido' : 'Desmarcado como vendido')
    }
  }

  const categories = [...new Set(products.map(p => p.category))]
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !catFilter || p.category === catFilter
    return matchSearch && matchCat
  })

  const selectedCount = selections.filter(s => s.status === 'selected').length
  const soldCount = selections.filter(s => s.status === 'sold').length

  return (
    <AppShell requiredRole="partner" activeHref="/partner">
      <div className="page-title">Catálogo de Productos</div>
      <div className="page-sub">Elige los productos que quieres publicar en tu tienda</div>

      <div className={styles.statsRow}>
        <div className={styles.statPill} style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
          ⭐ {selectedCount} elegidos
        </div>
        <div className={styles.statPill} style={{ background: 'rgba(16,185,110,0.1)', color: 'var(--accent3)' }}>
          ✅ {soldCount} vendidos
        </div>
        <div className={styles.statPill} style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
          📦 {products.length} productos
        </div>
      </div>

      <div className={styles.filters}>
        <input type="text" placeholder="🔍 Buscar producto..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 180 }}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text2)', padding: 48, textAlign: 'center' }}>Cargando catálogo...</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(p => {
            const sel = getSelection(p.id)
            const isSelected = !!sel
            const isSold = sel?.status === 'sold'
            return (
              <div key={p.id} className={`${styles.productCard} ${isSelected ? styles.selected : ''} ${isSold ? styles.sold : ''}`}>
                {(p as any).image_url ? (
                  <div className={styles.productImg}>
                    <img src={(p as any).image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div className={styles.productImgPlaceholder}>{p.emoji || '📦'}</div>
                )}
                {isSelected && !isSold && <span className={`${styles.badge} ${styles.badgeSelected}`}>Elegido</span>}
                {isSold && <span className={`${styles.badge} ${styles.badgeSold}`}>Vendido</span>}

                <div className={styles.productBody}>
                  <div className={styles.productCat}>{p.category}</div>
                  <div className={styles.productName}>{p.name}</div>
                  {(p as any).condition && (
                    <div className={styles.productCondition}>Estado: {(p as any).condition}</div>
                  )}
                  <div className={styles.productPrice}>€{p.price.toLocaleString()}</div>
                  {(p as any).price_min && (p as any).price_max && (
                    <div className={styles.priceRange}>
                      €{(p as any).price_min} — €{(p as any).price_max}
                    </div>
                  )}
                  <div className={styles.actions}>
                    <button className={`btn btn-sm ${isSelected ? 'btn-danger' : 'btn-blue'}`} onClick={() => toggleSelect(p.id)}>
                      {isSelected ? '✕ Quitar' : '+ Elegir'}
                    </button>
                    {isSelected && (
                      <button className={`btn btn-sm ${isSold ? 'btn-ghost' : 'btn-success'}`} onClick={() => toggleSold(p.id)}>
                        {isSold ? 'Desmarcar' : '✓ Vendido'}
                      </button>
                    )}
                    <button className={`btn btn-sm btn-ghost`} onClick={() => setDetailProduct(p)} title="Ver detalle">👁</button>
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: 'var(--text2)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>Sin resultados
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {detailProduct && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setDetailProduct(null)}>
          <div className="modal">
            <div className="modal-title">{detailProduct.name}</div>
            <div className="modal-sub">{detailProduct.category}</div>
            {(detailProduct as any).image_url && (
              <img src={(detailProduct as any).image_url} alt={detailProduct.name}
                style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
              {[
                ['Precio sugerido', `€${detailProduct.price}`],
                ['Precio mín', (detailProduct as any).price_min ? `€${(detailProduct as any).price_min}` : '—'],
                ['Precio máx', (detailProduct as any).price_max ? `€${(detailProduct as any).price_max}` : '—'],
                ['Estado', (detailProduct as any).condition || '—'],
                ['Talla', (detailProduct as any).size || '—'],
                ['Material', (detailProduct as any).material || '—'],
                ['Dimensiones', (detailProduct as any).dimensions || '—'],
                ['Stock', detailProduct.stock],
              ].map(([label, val]) => (
                <div key={label as string} style={{ padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>
            {detailProduct.description && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8, fontSize: 13 }}>
                <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Descripción</div>
                {detailProduct.description}
              </div>
            )}
            {(detailProduct as any).defects && (
              <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--red-light)', border: '1px solid rgba(232,22,42,0.2)', borderRadius: 8, fontSize: 13 }}>
                <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>⚠ Defectos</div>
                {(detailProduct as any).defects}
              </div>
            )}
            {(detailProduct as any).keywords && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text2)' }}>
                🏷 {(detailProduct as any).keywords}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDetailProduct(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </AppShell>
  )
}
