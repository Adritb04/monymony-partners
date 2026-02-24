import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos principales
export type Role = 'partner' | 'subadmin' | 'admin'

export interface Partner {
  id: string
  name: string
  email: string
  username: string
  role: Role
  commission: number
  status: 'active' | 'pending' | 'inactive'
  created_at: string
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  emoji: string
  description: string
  stock: number
  status: 'available' | 'archived'
  created_at: string
}

export interface PartnerProduct {
  id: string
  partner_id: string
  product_id: string
  status: 'selected' | 'sold' | 'removed'
  sold_at?: string
  price_sold?: number
  updated_at: string
  product?: Product
  partner?: Partner
}
