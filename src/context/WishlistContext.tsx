import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useProducts } from './ProductsContext'
import { loadProducts } from '../data/productStore'
import { loadFromStorage, saveToStorage } from '../utils/storage'

const STORAGE_KEY = 'stylehub-wishlist'

// o'chirilgan mahsulotlarning id'lari saqlanib qolmasligi uchun tekshiriladi
function loadLikedIds(): number[] {
  const saved = loadFromStorage<unknown>(STORAGE_KEY, [])
  if (!Array.isArray(saved)) return []
  const products = loadProducts()
  return saved.filter((id) => products.some((product) => product.id === id))
}

type WishlistContextValue = {
  likedIds: number[]
  count: number
  // oxirgi marta layk qo'shilgan vaqt, header'dagi yurak animatsiyasi uchun (0 = hali bosilmagan)
  lastLikedAt: number
  isLiked: (id: number) => boolean
  toggleLike: (id: number) => void
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [storedIds, setLikedIds] = useState<number[]>(loadLikedIds)
  const { products } = useProducts()

  // admin o'chirgan mahsulotlar sevimlilar sonida ko'rinmasligi uchun
  const likedIds = useMemo(
    () => storedIds.filter((id) => products.some((product) => product.id === id)),
    [storedIds, products],
  )

  useEffect(() => {
    saveToStorage(STORAGE_KEY, likedIds)
  }, [likedIds])

  const [lastLikedAt, setLastLikedAt] = useState(0)

  const toggleLike = (id: number) => {
    if (!likedIds.includes(id)) setLastLikedAt(Date.now())
    setLikedIds((prev) =>
      prev.includes(id) ? prev.filter((likedId) => likedId !== id) : [...prev, id],
    )
  }

  return (
    <WishlistContext.Provider
      value={{
        likedIds,
        count: likedIds.length,
        lastLikedAt,
        isLiked: (id) => likedIds.includes(id),
        toggleLike,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used inside WishlistProvider')
  return context
}
