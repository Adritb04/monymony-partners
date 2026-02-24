'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase, type Partner } from '@/lib/supabase'

export default function SubAdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', commission: '10' })

  useEffect(() => { loadPartners() }, [])

  async function loadPartners() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'partner')
      .order('created_at', { ascending: false })
    setPartners(data || [])
    setLoading(false)
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const toggleStatus = async (partner: Partner) => {
    const newStatus = partner.status === 'active' ? 'inactive' : 'active'
    await supabase.from('users').update({ status: newStatus }).eq('id', partner.id)
    setPartners(prev => prev.map(p => p.id === partner.id ? { ...p, status: newStatus } : p))
    showToast(`Partner ${partner.name} ${newStatus === 'active' ? 'activado' : 'pausado'}`)
  }

  const createPartner = async () => {
    const { error } = await supabase.from('users').insert({
      name: form.name,
      email: form.email,
      username: form.username,
      password_hash: form.password, // en producción hashear con bcrypt
      role: 'partner',
      commission: parseFloat(form.commission) || 10,
      status: 'active',
    })
    if (error) { showToast('Error: ' + error.message); return }
    setShowModal(false)
    setForm({ name: '', email: '', username: '', password: '', commission: '10' })
    showToast('✅ Partner creado correctamente')
    loadPartners()
  }

  return (
    <AppShell requiredRole="subadmin" activeHref="/subadmin/partners">
      <div className="page-title">Gestión de Partners</div>
      <div className="page-sub">Alta y administración de accesos</div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Alta de Partner</button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>Cargando...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Comisión</th>
                  <th>Alta</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {partners.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td><span className="mono accent">{p.username}</span></td>
                    <td style={{ color: 'var(--text2)' }}>{p.email}</td>
                    <td>
                      <span className={`pill pill-${p.status === 'active' ? 'active' : p.status === 'pending' ? 'pending' : 'inactive'}`}>
                        {{ active: 'Activo', pending: 'Pendiente', inactive: 'Inactivo' }[p.status]}
                      </span>
                    </td>
                    <td><span className="mono">{p.commission}%</span></td>
                    <td style={{ color: 'var(--text2)' }}>{new Date(p.created_at).toLocaleDateString('es-ES')}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${p.status === 'active' ? 'btn-ghost' : 'btn-success'}`}
                        onClick={() => toggleStatus(p)}
                      >
                        {p.status === 'active' ? 'Pausar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
                {partners.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text2)' }}>No hay partners aún</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">Alta de Partner</div>
            <div className="modal-sub">Crear acceso para un nuevo partner</div>
            <div className="field"><label>Nombre completo</label>
              <input type="text" placeholder="Ana García" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field"><label>Email</label>
              <input type="email" placeholder="ana@tienda.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field"><label>Usuario</label>
              <input type="text" placeholder="anagarcia" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="field"><label>Contraseña</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="field"><label>Comisión (%)</label>
              <input type="number" min="0" max="100" placeholder="10" value={form.commission} onChange={e => setForm({ ...form, commission: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={createPartner}>Crear Partner</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--surface2)', border: '1px solid var(--accent3)', borderRadius: 10, padding: '12px 18px', fontSize: 13, zIndex: 1000 }}>
          {toast}
        </div>
      )}
    </AppShell>
  )
}
