import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { products as defaultProducts, type Product } from '../data/products'
import { loadProducts, saveProducts } from '../data/productStore'
import { loadFromStorage, saveToStorage } from '../utils/storage'

const NEXT_ID_KEY = 'stylehub-products-next-id'

type ProductsContextValue = {
  products: Product[]
  addProduct: (product: Omit<Product, 'id'>) => void
  updateProduct: (id: number, changes: Partial<Product>) => void
  deleteProduct: (id: number) => void
}

const ProductsContext = createContext<ProductsContextValue | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(loadProducts)

  // o'chirilgan mahsulotning ID'si qayta ishlatilmasligi uchun alohida, faqat o'sib boradigan hisoblagich
  const [nextId, setNextId] = useState<number>(() =>
    loadFromStorage<number>(
      NEXT_ID_KEY,
      Math.max(0, ...products.map((p) => p.id), ...defaultProducts.map((p) => p.id)) + 1,
    ),
  )

  useEffect(() => {
    saveProducts(products)
  }, [products])

  useEffect(() => {
    saveToStorage(NEXT_ID_KEY, nextId)
  }, [nextId])

  const addProduct = (product: Omit<Product, 'id'>) => {
    const id = nextId
    setNextId((n) => n + 1)
    setProducts((prev) => [{ ...product, id }, ...prev])
  }

  const updateProduct = (id: number, changes: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    )
  }

  const deleteProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <ProductsContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProducts() {
  const context = useContext(ProductsContext)
  if (!context) throw new Error('useProducts must be used inside ProductsProvider')
  return context
}
