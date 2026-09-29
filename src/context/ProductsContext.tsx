import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Product } from '../data/products'
import { loadProducts, saveProducts } from '../data/productStore'

type ProductsContextValue = {
  products: Product[]
  addProduct: (product: Omit<Product, 'id'>) => void
  updateProduct: (id: number, changes: Partial<Product>) => void
  deleteProduct: (id: number) => void
}

const ProductsContext = createContext<ProductsContextValue | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(loadProducts)

  useEffect(() => {
    saveProducts(products)
  }, [products])

  const addProduct = (product: Omit<Product, 'id'>) => {
    setProducts((prev) => {
      const newId = prev.length > 0 ? Math.max(...prev.map((p) => p.id)) + 1 : 1
      return [{ ...product, id: newId }, ...prev]
    })
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
