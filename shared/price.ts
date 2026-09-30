import type { Product } from './products'

// har bir keyingi o'lcham asosiy narxdan 5% qimmatroq (masalan XS -> S -> M ...)
const SIZE_STEP = 0.05

// admin narx kiritmagan o'lcham uchun avtomatik narx, .99 bilan tugaydi
export function autoSizePrice(product: Pick<Product, 'price' | 'sizes'>, size: string): number {
  const index = product.sizes.indexOf(size)
  if (index <= 0) return product.price
  return Math.max(product.price, Math.round(product.price * (1 + SIZE_STEP * index)) - 0.01)
}

// tanlangan o'lchamning narxi; o'lcham tanlanmagan bo'lsa asosiy narx
export function getPrice(product: Product, size?: string): number {
  if (!size) return product.price
  const custom = product.sizePrices?.[size]
  if (typeof custom === 'number' && Number.isFinite(custom) && custom > 0) return custom
  return autoSizePrice(product, size)
}

// eng arzon o'lcham narxi ("от $..." uchun)
export function minPrice(product: Product): number {
  if (product.sizes.length === 0) return product.price
  return Math.min(...product.sizes.map((size) => getPrice(product, size)))
}

export function hasSizePriceRange(product: Product): boolean {
  const prices = new Set(product.sizes.map((size) => getPrice(product, size)))
  return prices.size > 1
}
