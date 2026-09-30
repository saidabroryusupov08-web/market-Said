import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useProducts } from './ProductsContext'
import type { Product } from '../data/products'
import { loadProducts } from '../data/productStore'
import { getPrice } from '../utils/price'
import { loadFromStorage, saveToStorage } from '../utils/storage'

const STORAGE_KEY = 'stylehub-cart'

// Saqlashda faqat id yoziladi, mahsulot ma'lumoti (narx, rasm) mahsulotlar ro'yxatidan olinadi
type StoredCartItem = {
  productId: number
  size: string
  color: string
  quantity: number
}

// narx saqlanmaydi, har safar mahsulot va o'lchamdan hisoblanadi
type CartEntry = Omit<CartItem, 'price'>

function loadCart(): CartEntry[] {
  const saved = loadFromStorage<unknown>(STORAGE_KEY, [])
  if (!Array.isArray(saved)) return []
  return saved.flatMap((item: StoredCartItem) => {
    const product = loadProducts().find((p) => p.id === item?.productId)
    if (!product || !(item.quantity > 0)) return []
    return [
      {
        key: `${product.id}-${item.size}-${item.color}`,
        product,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      },
    ]
  })
}

export type CartItem = {
  key: string
  product: Product
  size: string
  color: string
  quantity: number
  // tanlangan o'lchamning bitta dona narxi
  price: number
}

type CartContextValue = {
  items: CartItem[]
  count: number
  total: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (product: Product, size: string, color: string) => void
  updateQuantity: (key: string, quantity: number) => void
  removeItem: (key: string) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [storedItems, setItems] = useState<CartEntry[]>(loadCart)
  const { products } = useProducts()

  // admin narxni o'zgartirsa yoki mahsulotni o'chirsa, savat darhol yangilanadi
  const items = useMemo(
    () =>
      storedItems.flatMap((item) => {
        const product = products.find((p) => p.id === item.product.id)
        return product ? [{ ...item, product, price: getPrice(product, item.size) }] : []
      }),
    [storedItems, products],
  )

  useEffect(() => {
    const stored: StoredCartItem[] = items.map(({ product, size, color, quantity }) => ({
      productId: product.id,
      size,
      color,
      quantity,
    }))
    saveToStorage(STORAGE_KEY, stored)
  }, [items])
  const [isOpen, setIsOpen] = useState(false)
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const addItem = (product: Product, size: string, color: string) => {
    const key = `${product.id}-${size}-${color}`
    setItems((prev) => {
      const existing = prev.find((item) => item.key === key)
      if (existing) {
        return prev.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...prev, { key, product, size, color, quantity: 1 }]
    })
  }

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity < 1) return removeItem(key)
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, quantity } : item)),
    )
  }

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key))
  }

  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        total,
        isOpen,
        openCart,
        closeCart,
        addItem,
        updateQuantity,
        removeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
