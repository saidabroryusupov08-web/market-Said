import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { NavTag, Product } from './products'

// Brauzerda faqat ochiq (anon / publishable) kalit ishlatiladi. Kim nimani o'qiy/yoza olishini
// bazadagi RLS qoidalari hal qiladi (supabase/schema.sql), shuning uchun bu kalit maxfiy emas.
// Env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (Vercel'da yoki .env.local'da)
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export const PRODUCT_IMAGES_BUCKET = 'product-images'

// bazadagi `products` jadvalining qatori (ustun nomlari snake_case)
export type ProductRow = {
  id: number
  created_at: string
  name: string
  category: string
  price: number | string
  description: string
  sizes: string[]
  colors: string[]
  image: string | null
  tags: string[]
  size_prices: Record<string, number> | null
  old_price: number | string | null
  is_active: boolean | null
}

export function fromRow(row: ProductRow): Product {
  const sizePrices = row.size_prices ?? {}
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    category: row.category,
    // numeric ustun katta sonlarda string bo'lib kelishi mumkin
    price: Number(row.price),
    description: row.description ?? '',
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    image: row.image ?? undefined,
    tags: (row.tags ?? []) as NavTag[],
    sizePrices: Object.keys(sizePrices).length > 0 ? sizePrices : undefined,
    oldPrice: row.old_price != null ? Number(row.old_price) : undefined,
    isActive: row.is_active !== false,
  }
}

export function toRow(p: Omit<Product, 'id' | 'createdAt'>) {
  return {
    name: p.name,
    category: p.category,
    price: p.price,
    description: p.description,
    sizes: p.sizes,
    colors: p.colors,
    image: p.image ?? null,
    tags: p.tags ?? [],
    size_prices: p.sizePrices ?? {},
    old_price: p.oldPrice ?? null,
    is_active: p.isActive !== false,
  }
}
