import type { Product } from './products'

// Ombor qoidalari (do'kon, admin va testlar uchun bitta joyda).
// stock[size] bo'lmasa — o'sha o'lcham hisobga olinmaydi va cheklovsiz sotiladi.

// shu qoldiq va undan kami "tugayapti" deb belgilanadi
export const LOW_STOCK = 3

// null — hisob yuritilmaydi
export function stockOf(product: Pick<Product, 'stock'>, size: string): number | null {
  const value = product.stock?.[size]
  return typeof value === 'number' ? value : null
}

export const isSoldOut = (product: Pick<Product, 'stock'>, size: string) => stockOf(product, size) === 0

export type StockStatus = 'untracked' | 'out' | 'low' | 'in'

// mahsulotning umumiy holati: biror o'lcham tugagan bo'lsa — "out", kam qolgan bo'lsa — "low"
export function stockStatus(product: Pick<Product, 'stock' | 'sizes'>): StockStatus {
  const tracked = product.sizes.map((s) => stockOf(product, s)).filter((v): v is number => v !== null)
  if (tracked.length === 0) return 'untracked'
  if (tracked.some((v) => v === 0)) return 'out'
  if (tracked.some((v) => v <= LOW_STOCK)) return 'low'
  return 'in'
}

// faqat mahsulotda hozir bor o'lchamlar bo'yicha jami dona
export const totalUnits = (product: Pick<Product, 'stock' | 'sizes'>) =>
  product.sizes.reduce((sum, s) => sum + (stockOf(product, s) ?? 0), 0)
