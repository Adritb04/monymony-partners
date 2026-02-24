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

  useEffect(() => {
    loadData()
  }, [user])

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

  const getSelection = (productId: string) =>
    selections.find(s => s.product_id === productId)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const toggleSelect = async (productId: string) => {
    if (!user) return
    const existing = getSelection(productId)
    if (existing) {
      await supabase.from('partner_products').delete().eq('id', existing.id)
      setSelections(prev => prev.filter(s => s.id !== existing.id))
      showToast('Producto eliminado de tus elegidos')
    } else {
      const { data } = await supabase.from('partner_products').insert({
        partner_id: user.id,
        product_id: productId,
        status: 'selected',
        updated_at: new Date().toISOString(),
      }).select().single()
      if (data) {
        setSelections(prev => [...prev, data])
        showToast('✅ Producto añadido a tus elegidos')
      }
    }
  }

  const toggleSold = async (productId: string) => {
    const existing = getSelection(productId)
    if (!existing) return
    const newStatus = existing.status === 'sold' ? 'selected' : 'sold'
    const { data } = await supabase
      .from('partner_products')
      .update({
        status: newStatus,
        sold_at: newStatus === 'sold' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select().single()
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

  return (
    <AppShell requiredRole="partner" activeHref="/partner">
      <div className="page-title">Catálogo de Productos</div>
      <div className="page-sub">Elige los productos que quieres publicar en tu tienda</div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="🔍 Buscar producto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 220 }}
        />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 180 }}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <div className={styles.counter}>
          {selections.filter(s => s.status === 'selected').length} elegidos ·{' '}
          {selections.filter(s => s.status === 'sold').length} vendidos
        </div>
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
              <div
                key={p.id}
                className={`${styles.productCard} ${isSelected ? styles.selected : ''} ${isSold ? styles.sold : ''}`}
              >
                <div className={styles.productImg}>
                  <span>{p.emoji}</span>
                  {isSelected && !isSold && <span className={`${styles.badge} ${styles.badgeSelected}`}>Elegido</span>}
                  {isSold && <span className={`${styles.badge} ${styles.badgeSold}`}>Vendido</span>}
                </div>
                <div className={styles.productBody}>
                  <div className={styles.productName}>{p.name}</div>
                  <div className={styles.productMeta}>{p.category} · Stock: {p.stock}</div>
                  <div className={styles.productPrice}>€{p.price.toLocaleString()}</div>
                  <div className={styles.actions}>
                    <button
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => toggleSelect(p.id)}
                    >
                      {isSelected ? '✓ Elegido' : '+ Elegir'}
                    </button>
                    {isSelected && (
                      <button
                        className={`btn btn-sm ${isSold ? 'btn-success' : 'btn-ghost'}`}
                        onClick={() => toggleSold(p.id)}
                      >
                        {isSold ? '✓ Vendido' : 'Vender'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: 'var(--text2)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              Sin resultados para esa búsqueda
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className={styles.toast}>{toast}</div>
      )}
    </AppShell>
  )
}
