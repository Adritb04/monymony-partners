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
  const [detailProduct, setDetailProduct] = useState<any | null>(null)

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
      if (data) { setSelections(prev => [...prev, data]); showToast('✅ Añadido a tus elegidos') }
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

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort()
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
            const pp = p as any
            return (
              <div key={p.id} className={`${styles.productCard} ${isSelected ? styles.selected : ''} ${isSold ? styles.sold : ''}`}>
                {/* Imagen */}
                {pp.image_url ? (
                  <div className={styles.productImg}>
                    <img src={pp.image_url} alt={p.name} />
                  </div>
                ) : (
                  <div className={styles.productImgPlaceholder}>{p.emoji || '📦'}</div>
                )}

                {/* Badge estado */}
                {isSelected && !isSold && <span className={`${styles.badge} ${styles.badgeSelected}`}>⭐ Elegido</span>}
                {isSold && <span className={`${styles.badge} ${styles.badgeSold}`}>✓ Vendido</span>}

                <div className={styles.productBody}>
                  {/* Categoría + nombre */}
                  <div className={styles.productTop}>
                    {p.category && <span className={styles.productCat}>{p.category}</span>}
                  </div>
                  <div className={styles.productName}>{p.name}</div>

                  {/* Meta pills: estado, talla, material */}
                  <div className={styles.metaRow}>
                    {pp.condition && <span className={styles.metaPill}>📋 {pp.condition}</span>}
                    {pp.size && <span className={styles.metaPill}>📐 {pp.size}</span>}
                    {pp.material && <span className={styles.metaPill}>🧱 {pp.material}</span>}
                    {pp.defects && <span className={`${styles.metaPill} ${styles.metaPillRed}`}>⚠ Defectos</span>}
                  </div>

                  {/* Descripción */}
                  {p.description && (
                    <div className={styles.productDesc}>{p.description}</div>
                  )}

                  {/* Precios */}
                  <div className={styles.priceBlock}>
                    <div className={styles.productPrice}>€{Number(p.price).toLocaleString('es-ES', { minimumFractionDigits: 0 })}</div>
                    {pp.price_min && pp.price_max && (
                      <div className={styles.priceRange}>
                        Rango: €{Number(pp.price_min).toLocaleString()} — €{Number(pp.price_max).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className={styles.actions}>
                    <button className={`btn btn-sm ${isSelected ? 'btn-danger' : 'btn-blue'}`} onClick={() => toggleSelect(p.id)}>
                      {isSelected ? '✕ Quitar' : '+ Elegir'}
                    </button>
                    {isSelected && (
                      <button className={`btn btn-sm ${isSold ? 'btn-ghost' : 'btn-success'}`} onClick={() => toggleSold(p.id)}>
                        {isSold ? 'Desmarcar' : '✓ Vendido'}
                      </button>
                    )}
                    <button className={`btn btn-sm btn-ghost ${styles.btnDetail}`} onClick={() => setDetailProduct(p)} title="Ver detalle">👁</button>
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 64, color: 'var(--text2)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Sin resultados</div>
              <div style={{ fontSize: 12 }}>Prueba con otros términos de búsqueda</div>
            </div>
          )}
        </div>
      )}

      {/* Modal detalle completo */}
      {detailProduct && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setDetailProduct(null)}>
          <div className="modal" style={{ width: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div className="modal-title">{detailProduct.name}</div>
                <div className="modal-sub">{detailProduct.category}{detailProduct.subcategory ? ` › ${detailProduct.subcategory}` : ''}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetailProduct(null)}>✕</button>
            </div>

            {detailProduct.image_url && (
              <img src={detailProduct.image_url} alt={detailProduct.name} className={styles.modalImg} />
            )}

            {/* Precios destacados */}
            <div className={styles.modalPriceBlock}>
              <div className={`${styles.modalPriceItem} ${styles.modalPriceSugerido}`}>
                <div className={styles.modalPriceLabel}>Sugerido</div>
                <div className={styles.modalPriceValue}>€{Number(detailProduct.price).toLocaleString()}</div>
              </div>
              <div className={`${styles.modalPriceItem} ${styles.modalPriceMin}`}>
                <div className={styles.modalPriceLabel} style={{ color: 'var(--accent3)' }}>Mínimo</div>
                <div className={styles.modalPriceValue} style={{ color: 'var(--accent3)' }}>
                  {detailProduct.price_min ? `€${Number(detailProduct.price_min).toLocaleString()}` : '—'}
                </div>
              </div>
              <div className={`${styles.modalPriceItem} ${styles.modalPriceMax}`}>
                <div className={styles.modalPriceLabel} style={{ color: 'var(--red)' }}>Máximo</div>
                <div className={styles.modalPriceValue} style={{ color: 'var(--red)' }}>
                  {detailProduct.price_max ? `€${Number(detailProduct.price_max).toLocaleString()}` : '—'}
                </div>
              </div>
            </div>

            {/* Datos del producto */}
            <div className={styles.modalGrid}>
              {[
                ['Estado', detailProduct.condition],
                ['Talla', detailProduct.size],
                ['Material', detailProduct.material],
                ['Dimensiones', detailProduct.dimensions],
                ['Marca', detailProduct.brand],
                ['Stock', detailProduct.stock],
              ].filter(([, v]) => v).map(([label, val]) => (
                <div key={label as string} className={styles.modalField}>
                  <div className={styles.modalFieldLabel}>{label}</div>
                  <div className={styles.modalFieldValue}>{val}</div>
                </div>
              ))}
            </div>

            {/* Descripción */}
            {detailProduct.description && (
              <div className={styles.modalSection}>
                <div className={styles.modalSectionLabel}>Descripción</div>
                {detailProduct.description}
              </div>
            )}

            {/* Defectos */}
            {detailProduct.defects && (
              <div className={styles.modalDefects}>
                <div className={styles.modalSectionLabel} style={{ color: 'var(--red)' }}>⚠ Defectos</div>
                {detailProduct.defects}
              </div>
            )}

            {/* Notas */}
            {detailProduct.notes && (
              <div className={styles.modalSection}>
                <div className={styles.modalSectionLabel}>Observaciones</div>
                {detailProduct.notes}
              </div>
            )}

            {/* Keywords */}
            {detailProduct.keywords && (
              <div className={styles.modalKeywords}>🏷 {detailProduct.keywords}</div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDetailProduct(null)}>Cerrar</button>
              {!getSelection(detailProduct.id) ? (
                <button className="btn btn-blue" onClick={() => { toggleSelect(detailProduct.id); setDetailProduct(null) }}>+ Elegir producto</button>
              ) : (
                <button className="btn btn-danger" onClick={() => { toggleSelect(detailProduct.id); setDetailProduct(null) }}>✕ Quitar</button>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </AppShell>
  )
}
