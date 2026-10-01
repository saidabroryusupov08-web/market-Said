import type { Product } from '../../../shared/products'
import { dayMonth, monthName, monthShortName } from '../../../shared/dates'
import type { Order } from './orders'

// kategoriyasi topilmagan mahsulotlar (ko'rsatishda t('analytics.otherCategory'))
export const OTHER_CATEGORY = '__other__'

// Savdo hisoboti: oylik aylanma (oborot), buyurtmalar, o'rtacha chek, sotilgan dona,
// eng ko'p sotilgan mahsulotlar. Bekor qilingan buyurtmalar aylanmaga kirmaydi.
// Oylar brauzer vaqt zonasida (Toshkent) hisoblanadi.

export type MonthKey = string // '2026-09'

export const monthKeyOf = (date: Date): MonthKey =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const parseKey = (key: MonthKey) => {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month: m - 1 }
}

// oy nomlari tanlangan tilda: 'Сентябрь 2026' / 'September 2026' / 'Sentabr 2026'
export const monthLabel = (key: MonthKey) => {
  const { year, month } = parseKey(key)
  return `${monthName(new Date(year, month, 1))} ${year}`
}

export const monthShort = (key: MonthKey) => {
  const { year, month } = parseKey(key)
  return `${monthShortName(new Date(year, month, 1))} ${String(year).slice(2)}`
}

// kun + oy nomi: '1 сентября' / 'September 1' / '1-sentabr'
export const dayLabel = (key: MonthKey, day: number) => {
  const { year, month } = parseKey(key)
  return dayMonth(new Date(year, month, day))
}

export const shiftMonth = (key: MonthKey, delta: number): MonthKey => {
  const { year, month } = parseKey(key)
  return monthKeyOf(new Date(year, month + delta, 1))
}

export const daysInMonth = (key: MonthKey) => {
  const { year, month } = parseKey(key)
  return new Date(year, month + 1, 0).getDate()
}

const counts = (o: Order) => o.status !== 'cancelled'
const units = (o: Order) => o.items.reduce((sum, i) => sum + i.quantity, 0)
const round2 = (n: number) => Math.round(n * 100) / 100

export type MonthSummary = {
  key: MonthKey
  orders: number // bekor qilinmaganlar
  revenue: number // aylanma
  average: number // o'rtacha chek
  units: number // sotilgan dona
  delivered: number // yetkazilganlar summasi
  cancelled: number // bekor qilinganlar soni
}

export function summarize(key: MonthKey, orders: Order[]): MonthSummary {
  const inMonth = orders.filter((o) => monthKeyOf(new Date(o.created_at)) === key)
  const active = inMonth.filter(counts)
  const revenue = round2(active.reduce((sum, o) => sum + Number(o.total), 0))
  return {
    key,
    orders: active.length,
    revenue,
    average: active.length ? round2(revenue / active.length) : 0,
    units: active.reduce((sum, o) => sum + units(o), 0),
    delivered: round2(
      inMonth.filter((o) => o.status === 'delivered').reduce((sum, o) => sum + Number(o.total), 0),
    ),
    cancelled: inMonth.length - active.length,
  }
}

// oxirgi `count` oy (eskisidan yangisiga), joriy oy ham kiradi
export function monthlySeries(orders: Order[], endKey: MonthKey, count = 12): MonthSummary[] {
  return Array.from({ length: count }, (_, i) => summarize(shiftMonth(endKey, i - count + 1), orders))
}

// buyurtmasi bor oylar + joriy oy (tanlash ro'yxati uchun, yangisi tepada)
export function availableMonths(orders: Order[], currentKey: MonthKey): MonthKey[] {
  const keys = new Set<MonthKey>([currentKey, ...orders.map((o) => monthKeyOf(new Date(o.created_at)))])
  return [...keys].sort().reverse()
}

export function dailySeries(key: MonthKey, orders: Order[]) {
  const days = Array.from({ length: daysInMonth(key) }, (_, i) => ({ day: i + 1, revenue: 0, orders: 0 }))
  for (const o of orders) {
    const d = new Date(o.created_at)
    if (monthKeyOf(d) !== key || !counts(o)) continue
    const slot = days[d.getDate() - 1]
    slot.revenue = round2(slot.revenue + Number(o.total))
    slot.orders += 1
  }
  return days
}

export type ProductSales = { key: string; name: string; units: number; revenue: number }

export function topProducts(key: MonthKey, orders: Order[], limit = 5): ProductSales[] {
  const map = new Map<string, ProductSales>()
  for (const o of orders) {
    if (monthKeyOf(new Date(o.created_at)) !== key || !counts(o)) continue
    for (const i of o.items) {
      const k = String(i.productId ?? i.name)
      const row = map.get(k) ?? { key: k, name: i.name, units: 0, revenue: 0 }
      row.units += i.quantity
      row.revenue = round2(row.revenue + i.price * i.quantity)
      map.set(k, row)
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit)
}

export function salesByCategory(key: MonthKey, orders: Order[], products: Product[]) {
  const categoryOf = new Map(products.map((p) => [p.id, p.category]))
  const map = new Map<string, number>()
  for (const o of orders) {
    if (monthKeyOf(new Date(o.created_at)) !== key || !counts(o)) continue
    for (const i of o.items) {
      const cat = categoryOf.get(i.productId) ?? OTHER_CATEGORY
      map.set(cat, round2((map.get(cat) ?? 0) + i.price * i.quantity))
    }
  }
  return [...map.entries()].map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue)
}

// oldingi oyga nisbatan o'zgarish, % (oldingisi 0 bo'lsa — null)
export const changePercent = (current: number, previous: number) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null

export const money = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// o'q (axis) uchun qisqa: $1.2K
export const moneyCompact = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K` : `$${Math.round(n)}`
