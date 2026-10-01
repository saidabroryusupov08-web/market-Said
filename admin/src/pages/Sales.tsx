import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Download, ImageIcon, Minus, PackageCheck, Search } from 'lucide-react'
import { categoryLabel, colorLabel, sizeLabel } from '../../../shared/dataLabels'
import { resolveImage } from '../../../shared/images'
import { createMatcher } from '../../../shared/search'
import { useT } from '../i18n'
import { changePercent, money, OTHER_CATEGORY } from '../lib/analytics'
import { useAdminData } from '../lib/data'
import { formatDateTime } from '../lib/format'
import type { Order, OrderStatus } from '../lib/orders'
import Select from '../components/Select'
import { inputClass, secondaryBtn } from '../components/styles'
import { StatusBadge } from './Orders'

// Sotilgan tovarlar — do'kondan chiqib ketganlar: holati "Отправлен" yoki "Доставлен" bo'lgan
// buyurtmalardagi qatorlar. Har bir tovar uchun bir vaqtda 4 davr hisoblanadi (shu oy, o'tgan oy,
// 12 oy, butun vaqt). Tepadagi davr kartochkasi tanlansa — ro'yxat shu davr bo'yicha saralanadi
// va jurnal shu davrni ko'rsatadi. Sana — buyurtma berilgan sana.

const SOLD: OrderStatus[] = ['shipped', 'delivered']
const PERIODS = ['month', 'prevMonth', 'year', 'all'] as const
type Period = (typeof PERIODS)[number]
const STATUS_FILTERS = ['sold', 'shipped', 'delivered'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]
const TABS = ['products', 'log'] as const
type Tab = (typeof TABS)[number]

type Line = {
  key: string
  order: Order
  productKey: string
  name: string
  image: string | null
  category: string
  size: string
  color: string
  quantity: number
  price: number
  sum: number
  periods: Set<Period>
}

type Stat = { units: number; revenue: number; orders: Set<number> }
const emptyStat = (): Stat => ({ units: 0, revenue: 0, orders: new Set() })

type ProductRow = {
  key: string
  name: string
  image: string | null
  category: string
  stats: Record<Period, Stat>
  sizes: Record<Period, Map<string, number>>
}

// har bir davrning boshlanish/tugash vaqti
function ranges(now: Date): Record<Period, [number, number]> {
  const y = now.getFullYear()
  const m = now.getMonth()
  return {
    month: [new Date(y, m, 1).getTime(), Infinity],
    prevMonth: [new Date(y, m - 1, 1).getTime(), new Date(y, m, 1).getTime()],
    // oxirgi 12 oy: shu oy + oldingi 11 oy
    year: [new Date(y, m - 11, 1).getTime(), Infinity],
    all: [-Infinity, Infinity],
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100

function Thumb({ src }: { src: string | null }) {
  const url = resolveImage(src ?? undefined)
  return (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-300">
      {url ? <img src={url} alt="" loading="lazy" className="size-full object-cover" /> : <ImageIcon className="size-4" />}
    </span>
  )
}

function Delta({ current, previous }: { current: number; previous: number }) {
  const { t } = useT()
  const pct = changePercent(current, previous)
  if (pct === null) return null
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus
  const tone = pct > 0 ? 'text-green-700' : pct < 0 ? 'text-red-600' : 'text-gray-500'
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-400">
      <span className={`inline-flex items-center font-semibold ${tone}`}>
        <Icon className="size-3" />
        {pct > 0 ? '+' : ''}
        {pct}%
      </span>
      {t('sales.vsPrev')}
    </span>
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
  const period = pick<Period>('period', PERIODS, 'year')
  const statusFilter = pick<StatusFilter>('status', STATUS_FILTERS, 'sold')
  const tab = pick<Tab>('tab', TABS, 'products')
  const setParam = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(params)
    if (value === fallback) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const categoryOf = useMemo(() => new Map(products.map((p) => [p.id, p.category])), [products])

  // barcha sotilgan qatorlar; har biri qaysi davrlarga tushishi belgilanadi
  const lines = useMemo<Line[]>(() => {
    const r = ranges(now)
    const statuses: OrderStatus[] = statusFilter === 'sold' ? SOLD : [statusFilter]
    const out: Line[] = []
    for (const o of orders) {
      if (!statuses.includes(o.status)) continue
      const time = new Date(o.created_at).getTime()
      const periods = new Set(PERIODS.filter((p) => time >= r[p][0] && time < r[p][1]))
      o.items.forEach((i, idx) => {
        out.push({
          key: `${o.id}-${idx}`,
          order: o,
          productKey: String(i.productId ?? i.name),
          name: i.name,
          image: i.image,
          category: categoryOf.get(i.productId) ?? OTHER_CATEGORY,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
          price: Number(i.price),
          sum: round2(Number(i.price) * i.quantity),
          periods,
        })
      })
    }
    return out
  }, [orders, statusFilter, now, categoryOf])

  const matches = useMemo(() => createMatcher(search.trim()), [search])
  const q = search.trim().replace(/^#/, '')
  const found = useMemo(
    () => lines.filter((l) => !q || String(l.order.id) === q || matches([l.name, l.category, l.color, l.size, l.order.customer_name].join(' '))),
    [lines, q, matches],
  )

  // davrlar bo'yicha umumiy (tepadagi kartochkalar)
  const totals = useMemo(() => {
    const res = Object.fromEntries(PERIODS.map((p) => [p, emptyStat()])) as Record<Period, Stat>
    for (const l of found)
      for (const p of l.periods) {
        res[p].units += l.quantity
        res[p].revenue = round2(res[p].revenue + l.sum)
        res[p].orders.add(l.order.id)
      }
    return res
  }, [found])

  // har bir tovar: 4 davr bo'yicha soni va tushumi
  const rows = useMemo(() => {
    const map = new Map<string, ProductRow>()
    for (const l of found) {
      const row =
        map.get(l.productKey) ??
        ({
          key: l.productKey,
          name: l.name,
          image: l.image,
          category: l.category,
          stats: Object.fromEntries(PERIODS.map((p) => [p, emptyStat()])),
          sizes: Object.fromEntries(PERIODS.map((p) => [p, new Map()])),
        } as ProductRow)
      for (const p of l.periods) {
        row.stats[p].units += l.quantity
        row.stats[p].revenue = round2(row.stats[p].revenue + l.sum)
        row.stats[p].orders.add(l.order.id)
        row.sizes[p].set(l.size, (row.sizes[p].get(l.size) ?? 0) + l.quantity)
      }
      map.set(l.productKey, row)
    }
    // tanlangan davrda ko'p sotilgani tepada; teng bo'lsa — butun vaqt bo'yicha
    return [...map.values()].sort(
      (a, b) =>
        b.stats[period].units - a.stats[period].units ||
        b.stats[period].revenue - a.stats[period].revenue ||
        b.stats.all.units - a.stats.all.units,
    )
  }, [found, period])

  const topUnits = Math.max(1, ...rows.map((r) => r.stats[period].units))
  const logLines = found.filter((l) => l.periods.has(period))

  const exportCsv = () => {
    const date = new Date().toISOString().slice(0, 10)
    if (tab === 'products') {
      downloadCsv(`cx-shop-prodazhi-${date}.csv`, [
        [
          t('products.colProduct'),
          t('form.category'),
          ...PERIODS.flatMap((p) => [`${t(`sales.period.${p}`)}, ${t('sales.pcsShort')}`, `${t(`sales.period.${p}`)}, $`]),
          t('sales.colSizes'),
        ],
        ...rows.map((r) => [
          r.name,
          categoryLabel(lang, r.category === OTHER_CATEGORY ? t('analytics.otherCategory') : r.category),
          ...PERIODS.flatMap((p) => [r.stats[p].units, r.stats[p].revenue.toFixed(2)]),
          [...r.sizes[period]].map(([s, n]) => `${s}×${n}`).join(', '),
        ]),
      ])
    } else {
      downloadCsv(`cx-shop-prodazhi-zhurnal-${date}.csv`, [
        [t('orders.colDate'), '№', t('products.colProduct'), t('sales.colSize'), t('sales.colColor'), t('sales.colUnits'), t('sales.colPrice'), t('sales.colSum'), t('orders.colClient'), t('orders.colStatus')],
        ...logLines.map((l) => [
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

  const nothingSold = lines.length === 0

  return (
    <div className="flex flex-col gap-5">
      {/* davrlar: bitta lenta, har biri tanlanadi (ro'yxat va jurnal shu davr bo'yicha) */}
      <div role="radiogroup" aria-label={t('sales.period')} className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 lg:grid-cols-4">
        {PERIODS.map((p) => {
          const s = totals[p]
          const active = period === p
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setParam('period', p, 'year')}
              className={`relative cursor-pointer p-4 text-left transition sm:p-5 ${active ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
            >
              {active && <span className="absolute inset-x-0 top-0 h-0.5 bg-blue-600" />}
              <p className={`text-xs font-medium ${active ? 'text-blue-800' : 'text-gray-500'}`}>{t(`sales.period.${p}`)}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-950 tabular-nums">
                {s.units}
                <span className="ml-1 text-sm font-normal text-gray-400">{t('sales.pcsShort')}</span>
              </p>
              <p className="text-sm font-medium text-gray-700 tabular-nums">{money(s.revenue)}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-gray-400">
                {t('sales.ordersCount', { count: s.orders.size })}
                {p === 'month' && <Delta current={s.units} previous={totals.prevMonth.units} />}
              </p>
            </button>
          )
        })}
      </div>

      {/* bo'limlar (tagi chizilgan) + qidiruv va filtr */}
      <div className="flex flex-col gap-3 border-b border-gray-200 lg:flex-row lg:items-end lg:justify-between">
        <div className="-mb-px flex gap-1">
          {TABS.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={tab === v}
              onClick={() => setParam('tab', v, 'products')}
              className={`flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
                tab === v ? 'border-gray-950 text-gray-950' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t(`sales.view.${v}`)}
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-gray-500">
                {v === 'products' ? rows.length : logLines.length}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
            <input
              className={`${inputClass} h-9 pl-9`}
              placeholder={t('sales.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            ariaLabel={t('orders.colStatus')}
            className="sm:w-48"
            value={statusFilter}
            onChange={(v) => setParam('status', v, 'sold')}
            options={STATUS_FILTERS.map((s) => ({ value: s, label: s === 'sold' ? t('sales.allSold') : t(`status.${s}`) }))}
          />
          <button type="button" onClick={exportCsv} disabled={tab === 'products' ? rows.length === 0 : logLines.length === 0} className={`${secondaryBtn} h-10`}>
            <Download className="size-4" />
            CSV
          </button>
        </div>
      </div>

      <p className="-mt-2 text-xs text-gray-400">{t('sales.hint')}</p>

      {nothingSold || (tab === 'products' ? rows.length === 0 : logLines.length === 0) ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center">
          <PackageCheck className="mb-3 size-10 text-gray-300" strokeWidth={1.5} />
          <p className="text-gray-950">{nothingSold ? t('sales.empty') : search ? t('common.nothingFound') : t('sales.emptyPeriod')}</p>
          {nothingSold && <p className="mt-1 max-w-md text-sm text-gray-500">{t('sales.emptyHint')}</p>}
        </div>
      ) : tab === 'products' ? (
        // tovar x davr jadvali: qaysi tovar qachon qancha sotilgani bir qarashda
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="w-10 px-3 py-3 text-center">#</th>
                <th className="px-3 py-3 text-left">{t('products.colProduct')}</th>
                {PERIODS.map((p) => (
                  <th
                    key={p}
                    className={`w-[132px] px-3 py-3 text-right whitespace-nowrap ${period === p ? 'bg-blue-50 text-blue-800' : ''}`}
                  >
                    {t(`sales.period.${p}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, idx) => {
                const cur = r.stats[period]
                return (
                  <tr key={r.key} className="align-top transition hover:bg-gray-50/70">
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                          cur.units > 0 && idx < 3 ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Thumb src={r.image} />
                        <div className="min-w-0 flex-1">
                          <p className="max-w-[300px] truncate font-medium text-gray-950">{r.name}</p>
                          <p className="text-xs text-gray-500">
                            {categoryLabel(lang, r.category === OTHER_CATEGORY ? t('analytics.otherCategory') : r.category)}
                          </p>
                          {/* tanlangan davrdagi ulush va o'lchamlar */}
                          <div className="mt-1.5 h-1 max-w-[300px] rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${(cur.units / topUnits) * 100}%` }} />
                          </div>
                          {r.sizes[period].size > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {[...r.sizes[period]].map(([size, n]) => (
                                <span key={size} className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600 tabular-nums">
                                  {sizeLabel(lang, size)} <b className="text-gray-950">×{n}</b>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {PERIODS.map((p) => {
                      const s = r.stats[p]
                      return (
                        <td key={p} className={`px-3 py-3 text-right whitespace-nowrap tabular-nums ${period === p ? 'bg-blue-50/50' : ''}`}>
                          {s.units > 0 ? (
                            <>
                              <p className="font-semibold text-gray-950">{t('common.pcs', { count: s.units })}</p>
                              <p className="text-xs text-gray-500">{money(s.revenue)}</p>
                            </>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
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
              {logLines.map((l) => (
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
