import { products as defaultProducts, type Product } from './products'
import { loadFromStorage, saveToStorage } from '../utils/storage'

const KEY = 'stylehub-products'

// src/assets dagi rasmlarning yo'li dev va build'da har xil bo'ladi,
// shuning uchun ularni saqlangan joydan emas, products.ts dan olamiz
function isLocalAsset(url?: string) {
  return !!url && (url.startsWith('/src/assets/') || url.startsWith('/assets/'))
}

// eski versiyada narx NaN bo'lib saqlanib qolgan bo'lishi mumkin (JSON'da null bo'ladi),
// shunday buzilgan yozuvlar sahifani yiqitmasligi uchun tuzatiladi
function sanitize(p: Product): Product | null {
  if (!p || typeof p.id !== 'number' || typeof p.name !== 'string') return null
  const price = Number(p.price)
  return {
    ...p,
    price: Number.isFinite(price) && price > 0 ? price : 0,
    category: typeof p.category === 'string' ? p.category : 'T-Shirts',
    description: typeof p.description === 'string' ? p.description : '',
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    colors: Array.isArray(p.colors) ? p.colors : [],
  }
}

export function loadProducts(): Product[] {
  const saved = loadFromStorage<Product[] | null>(KEY, null)
  if (!Array.isArray(saved)) return defaultProducts

  return saved.flatMap((raw) => {
    const p = sanitize(raw)
    if (!p) return []
    const original = defaultProducts.find((d) => d.id === p.id)
    if (original && isLocalAsset(p.image)) {
      return [{ ...p, image: original.image }]
    }
    return [p]
  })
}

export function saveProducts(list: Product[]) {
  saveToStorage(KEY, list)
}
