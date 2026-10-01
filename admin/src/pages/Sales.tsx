import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Boxes, Download, ImageIcon, PackageCheck, Receipt, Search, Wallet } from 'lucide-react'
import { categoryLabel, colorLabel, sizeLabel } from '../../../shared/dataLabels'
import { resolveImage } from '../../../shared/images'
import { createMatcher } from '../../../shared/search'
import { useT } from '../i18n'
import { money, OTHER_CATEGORY } from '../lib/analytics'
import { useAdminData } from '../lib/data'
import { formatDateTime } from '../lib/format'
import type { Order, OrderStatus } from '../lib/orders'
import Select from '../components/Select'
import { inputClass, secondaryBtn } from '../components/styles'
import { StatusBadge } from './Orders'

// Sotilgan tovarlar: do'kondan chiqib ketganlar — holati "Отправлен" yoki "Доставлен" bo'lgan
// buyurtmalardagi har bir qator. Ikki ko'rinish: tovar bo'yicha jami va har bir sotuv (jurnal).
// Sana — buyurtma berilgan sana.

const SOLD: OrderStatus[] = ['shipped', 'delivered']
const PERIODS = ['30d', 'month', 'prevMonth', '7d', 'all'] as const
type Period = (typeof PERIODS)[number]
const STATUS_FILTERS = ['sold', 'shipped', 'delivered'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]
const VIEWS = ['products', 'log'] as const
type View = (typeof VIEWS)[number]

const DAY = 24 * 60 * 60 * 1000

type Line = {
  key: string
  order: Order
  productId: number
  name: string
  image: string | null
  category: string
  size: string
  color: string
  quantity: number
  price: number
  sum: number
}

type ProductRow = {
  key: string
  name: string
  image: string | null
  category: string
  units: number
  revenue: number
  orders: Set<number>
  sizes: Map<string, number>
  last: string
}

function periodRange(period: Period, now: Date): [number, number] {
  const y = now.getFullYear()
  const m = now.getMonth()
  if (period === '7d') return [now.getTime() - 7 * DAY, Infinity]
  if (period === '30d') return [now.getTime() - 30 * DAY, Infinity]
  if (period === 'month') return [new Date(y, m, 1).getTime(), Infinity]
  if (period === 'prevMonth') return [new Date(y, m - 1, 1).getTime(), new Date(y, m, 1).getTime()]
  return [-Infinity, Infinity]
}

function Thumb({ src }: { src: string | null }) {
  const url = resolveImage(src ?? undefined)
  return (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-300">
      {url ? <img src={url} alt="" loading="lazy" className="size-full object-cover" /> : <ImageIcon className="size-4" />}
    </span>
  )
}

function Tile({ label, value, hint, Icon, tone }: { label: string; value: string; hint: string; Icon: typeof Boxes; tone: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-500">{label}</p>
        <span className={`flex size-8 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{hint}</p>
    </div>
  )
}

// Excel to'g'ri ochishi uchun: ; ajratgich, BOM
function downloadCsv(name: string, rows: (string | number)[][]) {
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const text = '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function Sales() {
  const { orders, products, ordersLoaded } = useAdminData()
  const { t, lang } = useT()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [now] = useState(() => new Date())

  const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T) =>
    (allowed as readonly string[]).includes(params.get(key) ?? '') ? (params.get(key) as T) : fallback
  const period = pick<Period>('period', PERIODS, '30d')
  const statusFilter = pick<StatusFilter>('status', STATUS_FILTERS, 'sold')
  const view = pick<View>('view', VIEWS, 'products')
  const setParam = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(params)
    if (value === fallback) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const categoryOf = useMemo(() => new Map(products.map((p) => [p.id, p.category])), [products])

  // tanlangan davr va holatdagi barcha sotilgan qatorlar (yangisi tepada)
  const lines = useMemo<Line[]>(() => {
    const [from, to] = periodRange(period, now)
    const statuses: OrderStatus[] = statusFilter === 'sold' ? SOLD : [statusFilter]
    const out: Line[] = []
    for (const o of orders) {
      const time = new Date(o.created_at).getTime()
      if (!statuses.includes(o.status) || time < from || time >= to) continue
      o.items.forEach((i, idx) => {
        out.push({
          key: `${o.id}-${idx}`,
          order: o,
          productId: i.productId,
          name: i.name,
          image: i.image,
          category: categoryOf.get(i.productId) ?? OTHER_CATEGORY,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
          price: Number(i.price),
          sum: Math.round(Number(i.price) * i.quantity * 100) / 100,
        })
      })
    }
    return out
  }, [orders, period, statusFilter, now, categoryOf])

  const visibleLines = useMemo(() => {
    const matches = createMatcher(search.trim())
    const q = search.trim().replace(/^#/, '')
    return lines.filter(
      (l) => !q || String(l.order.id) === q || matches([l.name, l.category, l.color, l.size, l.order.customer_name].join(' ')),
    )
  }, [lines, search])

  const byProduct = useMemo(() => {
    const map = new Map<string, ProductRow>()
    for (const l of visibleLines) {
      const k = String(l.productId ?? l.name)
      const row =
        map.get(k) ??
        { key: k, name: l.name, image: l.image, category: l.category, units: 0, revenue: 0, orders: new Set<number>(), sizes: new Map<string, number>(), last: l.order.created_at }
      row.units += l.quantity
      row.revenue = Math.round((row.revenue + l.sum) * 100) / 100
      row.orders.add(l.order.id)
      row.sizes.set(l.size, (row.sizes.get(l.size) ?? 0) + l.quantity)
      if (l.order.created_at > row.last) row.last = l.order.created_at
      map.set(k, row)
    }
    return [...map.values()].sort((a, b) => b.units - a.units || b.revenue - a.revenue)
  }, [visibleLines])

  const units = visibleLines.reduce((s, l) => s + l.quantity, 0)
  const revenue = Math.round(visibleLines.reduce((s, l) => s + l.sum, 0) * 100) / 100
  const orderCount = new Set(visibleLines.map((l) => l.order.id)).size

  const exportCsv = () => {
    const date = new Date().toISOString().slice(0, 10)
    if (view === 'products') {
      downloadCsv(`cx-shop-prodazhi-tovary-${date}.csv`, [
        [t('products.colProduct'), t('form.category'), t('sales.colSizes'), t('sales.colUnits'), t('sales.colOrders'), t('sales.colRevenue'), t('sales.colLast')],
        ...byProduct.map((r) => [
          r.name,
          categoryLabel(lang, r.category),
          [...r.sizes].map(([s, n]) => `${s}×${n}`).join(', '),
          r.units,
          r.orders.size,
          r.revenue.toFixed(2),
          formatDateTime(r.last),
        ]),
      ])
    } else {
      downloadCsv(`cx-shop-prodazhi-zhurnal-${date}.csv`, [
        [t('orders.colDate'), '№', t('products.colProduct'), t('sales.colSize'), t('sales.colColor'), t('sales.colUnits'), t('sales.colPrice'), t('sales.colSum'), t('orders.colClient'), t('orders.colStatus')],
        ...visibleLines.map((l) => [
          formatDateTime(l.order.created_at),
          l.order.id,
          l.name,
          l.size,
          l.color,
          l.quantity,
          l.price.toFixed(2),
          l.sum.toFixed(2),
          l.order.customer_name,
          t(`status.${l.order.status}`),
        ]),
      ])
    }
  }

  if (!ordersLoaded) return <p className="py-16 text-center text-sm text-gray-400">{t('common.loading')}</p>

  const empty = visibleLines.length === 0

  return (
    <div className="flex flex-col gap-5">
      {/* filtrlar: davr, holat */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          ariaLabel={t('sales.period')}
          className="sm:w-52"
          value={period}
          onChange={(v) => setParam('period', v, '30d')}
          options={PERIODS.map((p) => ({ value: p, label: t(`sales.period.${p}`) }))}
        />
        <Select
          ariaLabel={t('orders.colStatus')}
          className="sm:w-56"
          value={statusFilter}
          onChange={(v) => setParam('status', v, 'sold')}
          options={STATUS_FILTERS.map((s) => ({ value: s, label: s === 'sold' ? t('sales.allSold') : t(`status.${s}`) }))}
        />
        <p className="text-xs text-gray-400 sm:ml-auto">{t('sales.hint')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label={t('sales.tileUnits')} value={String(units)} hint={t('sales.tileUnitsHint')} Icon={PackageCheck} tone="bg-green-50 text-green-700" />
        <Tile label={t('sales.tileRevenue')} value={money(revenue)} hint={t('sales.tileRevenueHint')} Icon={Wallet} tone="bg-blue-50 text-blue-700" />
        <Tile label={t('sales.tileOrders')} value={String(orderCount)} hint={t('sales.tileOrdersHint')} Icon={Receipt} tone="bg-gray-100 text-gray-600" />
        <Tile label={t('sales.tileProducts')} value={String(byProduct.length)} hint={t('sales.tileProductsHint')} Icon={Boxes} tone="bg-amber-50 text-amber-700" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder={t('sales.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* ko'rinish: tovar bo'yicha jami / har bir sotuv */}
        <div role="group" className="flex h-10 items-center gap-0.5 rounded-lg bg-gray-100 p-1 text-sm">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setParam('view', v, 'products')}
              className={`flex h-full cursor-pointer items-center rounded-md px-3 font-medium whitespace-nowrap transition ${
                view === v ? 'bg-blue-100 text-blue-800 shadow-sm ring-1 ring-blue-200' : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              {t(`sales.view.${v}`)}
            </button>
          ))}
        </div>
        <button type="button" onClick={exportCsv} disabled={empty} className={`${secondaryBtn} h-10`}>
          <Download className="size-4" />
          CSV
        </button>
      </div>

      {empty ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center">
          <PackageCheck className="mb-3 size-10 text-gray-300" strokeWidth={1.5} />
          <p className="text-gray-950">{lines.length === 0 ? t('sales.empty') : t('common.nothingFound')}</p>
          {lines.length === 0 && <p className="mt-1 max-w-md text-sm text-gray-500">{t('sales.emptyHint')}</p>}
        </div>
      ) : view === 'products' ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_80px_80px_110px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500 md:grid">
            <span>{t('products.colProduct')}</span>
            <span>{t('sales.colSizes')}</span>
            <span className="text-right">{t('sales.colUnits')}</span>
            <span className="text-right">{t('sales.colOrders')}</span>
            <span className="text-right">{t('sales.colRevenue')}</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {byProduct.map((r) => (
              <li key={r.key} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_80px_80px_110px] md:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <Thumb src={r.image} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-950">{r.name}</p>
                    <p className="text-xs text-gray-500">
                      {categoryLabel(lang, r.category === OTHER_CATEGORY ? t('analytics.otherCategory') : r.category)} ·{' '}
                      {t('sales.lastSold', { date: formatDateTime(r.last) })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[...r.sizes].map(([size, n]) => (
                    <span key={size} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 tabular-nums">
                      {sizeLabel(lang, size)} <span className="font-semibold text-gray-950">×{n}</span>
                    </span>
                  ))}
                </div>
                <p className="text-sm font-semibold whitespace-nowrap text-gray-950 tabular-nums md:text-right">
                  <span className="mr-1 text-xs font-normal text-gray-400 md:hidden">{t('sales.colUnits')}:</span>
                  {t('common.pcs', { count: r.units })}
                </p>
                <p className="text-sm whitespace-nowrap text-gray-600 tabular-nums md:text-right">
                  <span className="mr-1 text-xs text-gray-400 md:hidden">{t('sales.colOrders')}:</span>
                  {r.orders.size}
                </p>
                <p className="text-sm font-semibold whitespace-nowrap text-gray-950 tabular-nums md:text-right">{money(r.revenue)}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3">{t('orders.colDate')}</th>
                <th className="px-4 py-3">№</th>
                <th className="px-4 py-3">{t('products.colProduct')}</th>
                <th className="px-4 py-3 text-right">{t('sales.colUnits')}</th>
                <th className="px-4 py-3 text-right">{t('sales.colSum')}</th>
                <th className="px-4 py-3">{t('orders.colClient')}</th>
                <th className="px-4 py-3">{t('orders.colStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleLines.map((l) => (
                <tr key={l.key} className="transition hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatDateTime(l.order.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/orders?id=${l.order.id}`} className="font-semibold text-blue-700 hover:underline">
                      #{l.order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Thumb src={l.image} />
                      <div className="min-w-0">
                        <p className="max-w-[240px] truncate font-medium text-gray-950">{l.name}</p>
                        <p className="text-xs text-gray-500">
                          {sizeLabel(lang, l.size)}, {colorLabel(lang, l.color)} · {money(l.price)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">{t('common.pcs', { count: l.quantity })}</td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">{money(l.sum)}</td>
                  <td className="px-4 py-3">
                    <p className="max-w-[180px] truncate text-gray-950">{l.order.customer_name}</p>
                    <p className="text-xs text-gray-500">{l.order.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Sales
