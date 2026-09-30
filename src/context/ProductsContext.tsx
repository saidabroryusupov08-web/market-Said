import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fromRow, supabase, type ProductRow } from '../../shared/supabase'
import { products as defaultProducts, type Product } from '../data/products'

// Mahsulotlar Supabase bazasidan o'qiladi (ularni admin panel boshqaradi).
// Supabase sozlanmagan bo'lsa yoki bazaga ulanib bo'lmasa, standart ro'yxat ko'rsatiladi.

type ProductsContextValue = {
  products: Product[]
  // true bo'lgunicha mahsulotlar hali kelmagan: savat va sevimlilar bu paytda tozalanmasligi kerak
  loaded: boolean
}

const ProductsContext = createContext<ProductsContextValue | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(supabase ? [] : defaultProducts)
  const [loaded, setLoaded] = useState(!supabase)

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Mahsulotlarni yuklab bo‘lmadi:', error.message)
          setProducts(defaultProducts)
        } else {
          // yashirilgan mahsulotlarni baza (RLS) o'zi bermaydi; bu — qo'shimcha ehtiyot
          setProducts((data as ProductRow[]).map(fromRow).filter((p) => p.isActive !== false))
        }
        setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <ProductsContext.Provider value={{ products, loaded }}>{children}</ProductsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProducts() {
  const context = useContext(ProductsContext)
  if (!context) throw new Error('useProducts must be used inside ProductsProvider')
  return context
}
