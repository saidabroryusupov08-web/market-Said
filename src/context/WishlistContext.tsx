import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useProducts } from './ProductsContext'
import { loadFromStorage, saveToStorage } from '../utils/storage'

const STORAGE_KEY = 'stylehub-wishlist'

// mahsulotlar hali bazadan kelmagan bo'lishi mumkin: bu yerda faqat raqamlar olinadi,
// o'chirilgan mahsulotlar keyinroq (likedIds'da) chiqarib tashlanadi
function loadLikedIds(): number[] {
  const saved = loadFromStorage<unknown>(STORAGE_KEY, [])
  return Array.isArray(saved) ? saved.filter((id): id is number => typeof id === 'number') : []
}

type WishlistContextValue = {
  likedIds: number[]
  count: number
  // oxirgi marta layk qo'shilgan vaqt, header'dagi yurak animatsiyasi uchun (0 = hali bosilmagan)
  lastLikedAt: number
  isLiked: (id: number) => boolean
  toggleLike: (id: number) => void
  isOpen: boolean
  openWishlist: () => void
  closeWishlist: () => void
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [storedIds, setLikedIds] = useState<number[]>(loadLikedIds)
  const { products, loaded } = useProducts()

  // admin o'chirgan mahsulotlar sevimlilar sonida ko'rinmasligi uchun
  const likedIds = useMemo(
    () => storedIds.filter((id) => products.some((product) => product.id === id)),
    [storedIds, products],
  )

  useEffect(() => {
    // mahsulotlar bazadan kelmaguncha saqlanmaydi, aks holda ro'yxat bo'sh deb yozilib qolardi
    if (loaded) saveToStorage(STORAGE_KEY, likedIds)
  }, [likedIds, loaded])

  const [lastLikedAt, setLastLikedAt] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

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
        isOpen,
        openWishlist: () => setIsOpen(true),
        closeWishlist: () => setIsOpen(false),
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
