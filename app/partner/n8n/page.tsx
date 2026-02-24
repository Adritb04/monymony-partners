'use client'
import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

export default function N8NPage() {
  const { user } = useAuth()
  const [syncStatus, setSyncStatus] = useState<string>('')

  const triggerSync = async () => {
    if (!user) return
    setSyncStatus('⏳ Sincronizando...')
    const { data } = await supabase
      .from('partner_products')
      .select('*, product:products(*)')
      .eq('partner_id', user.id)
      .in('status', ['selected', 'sold'])

    // En producción aquí llamarías al webhook de n8n real
    await new Promise(r => setTimeout(r, 1200))
    setSyncStatus(`✅ ${(data || []).length} productos sincronizados · ${new Date().toLocaleTimeString('es-ES')}`)
  }

  return (
    <AppShell requiredRole="partner" activeHref="/partner/n8n">
      <div className="page-title">Integración con n8n</div>
      <div className="page-sub">Nodo final para conectar tu selección con la base de datos</div>

      <div className="grid2" style={{ gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600, marginBottom: 10 }}>
              Webhook URL de entrada
            </div>
            <div className="code-block" style={{ marginBottom: 10 }}>
              {process.env.NEXT_PUBLIC_APP_URL || 'https://tu-app.vercel.app'}/api/n8n/sync
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
              Configura este endpoint como destino en tu workflow de n8n.
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600, marginBottom: 10 }}>
              📤 Último nodo — HTTP Request
            </div>
            <div className="code-block">
{`{
  "method": "POST",
  "url": "https://tu-app.vercel.app/api/n8n/sync",
  "headers": {
    "x-partner-id": "{{ $json.partnerId }}",
    "Authorization": "Bearer {{ $env.API_KEY }}"
  },
  "body": {
    "partnerId": "{{ $json.partnerId }}",
    "selectedProducts": "{{ $json.products }}",
    "timestamp": "{{ $now }}",
    "action": "{{ $json.action }}"
  }
}`}
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600, marginBottom: 10 }}>
              🗄️ Esquema Supabase (partner_products)
            </div>
            <div className="code-block">
{`create table partner_products (
  id          uuid default gen_random_uuid() primary key,
  partner_id  uuid references users(id),
  product_id  uuid references products(id),
  status      text check (status in
              ('selected','sold','removed')),
  updated_at  timestamptz default now(),
  sold_at     timestamptz,
  price_sold  numeric(10,2),
  unique(partner_id, product_id)
);`}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600, marginBottom: 12 }}>
              ⚡ Flujo del workflow
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              {[
                { label: '1. Webhook recibe el evento', active: false },
                { label: '2. Filter → valida token/partner', active: false },
                { label: '3. Code → transforma datos', active: false },
                { label: '4. IF → distingue select/sold', active: false },
                { label: '5. ▶ HTTP Request → /api/n8n/sync', active: true },
                { label: '6. Respond → confirma a la app', active: false },
              ].map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    background: step.active ? 'rgba(108,99,255,0.1)' : 'var(--surface2)',
                    border: step.active ? '1px solid var(--accent)' : '1px solid transparent',
                    borderRadius: 6,
                    color: step.active ? 'var(--accent)' : 'var(--text)',
                    fontWeight: step.active ? 600 : 400,
                  }}
                >
                  <span>{step.active ? '▶' : '○'}</span>
                  {step.label}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={triggerSync}>▶ Simular sincronización</button>
              {syncStatus && <span style={{ fontSize: 12, color: 'var(--accent3)' }}>{syncStatus}</span>}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
