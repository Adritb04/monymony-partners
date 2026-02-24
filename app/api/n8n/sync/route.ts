import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { partnerId, selectedProducts, action, timestamp } = body

    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId required' }, { status: 400 })
    }

    // Actualizar en Supabase
    if (action === 'sync' && Array.isArray(selectedProducts)) {
      for (const item of selectedProducts) {
        await supabase.from('partner_products').upsert({
          partner_id: partnerId,
          product_id: item.productId,
          status: item.status,
          updated_at: timestamp || new Date().toISOString(),
          sold_at: item.status === 'sold' ? (item.soldAt || new Date().toISOString()) : null,
        }, { onConflict: 'partner_id,product_id' })
      }
    }

    return NextResponse.json({
      ok: true,
      synced: selectedProducts?.length || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET para que n8n pueda hacer polling también
export async function GET(req: NextRequest) {
  const partnerId = req.nextUrl.searchParams.get('partnerId')
  if (!partnerId) return NextResponse.json({ error: 'partnerId required' }, { status: 400 })

  const { data } = await supabase
    .from('partner_products')
    .select('*, product:products(*)')
    .eq('partner_id', partnerId)
    .in('status', ['selected', 'sold'])

  return NextResponse.json({ ok: true, products: data || [] })
}
