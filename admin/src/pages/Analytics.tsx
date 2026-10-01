import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Download, Minus } from 'lucide-react'
import BarChart, { CHART_COLOR } from '../components/BarChart'
import Select from '../components/Select'
import { secondaryBtn } from '../components/styles'
import { categoryLabel } from '../../../shared/dataLabels'
import { useT } from '../i18n'
import {
  availableMonths,
  changePercent,
  dailySeries,
  dayLabel,
  monthKeyOf,
  monthLabel,
  monthlySeries,
  monthShort,
  money,
  moneyCompact,
  OTHER_CATEGORY,
  salesByCategory,
  shiftMonth,
  summarize,
  topProducts,
  type MonthSummary,
} from '../lib/analytics'
import { useAdminData } from '../lib/data'

// Savdo hisoboti: 12 oylik aylanma (tepada, filtrga bog'liq emas), so'ng oy tanlash filtri va
// uning ostidagi hamma narsa shu oyga tegishli: ko'rsatkichlar, kunma-kun savdo, top mahsulotlar.

function Delta({ current, previous }: { current: number; previous: number }) {
  const { t } = useT()
  const pct = changePercent(current, previous)
  if (pct === null) return <p className="mt-1 text-xs text-gray-400">{t('analytics.noPrevData')}</p>
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus
  const tone = pct > 0 ? 'text-green-700' : pct < 0 ? 'text-red-600' : 'text-gray-500'
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
      <span className={`inline-flex items-center gap-0.5 font-semibold ${tone}`}>
        <Icon className="size-3.5" />
        {pct > 0 ? '+' : ''}
        {pct}%
      </span>
      {t('analytics.vsPrev')}
    </p>
  )
}

function Tile({ label, value, children, hero = false }: { label: string; value: string; children?: ReactNode; hero?: boolean }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 ${hero ? 'sm:col-span-2' : ''}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 font-semibold tracking-tight text-gray-950 ${hero ? 'text-5xl' : 'text-2xl'}`}>{value}</p>
      {children}
    </div>
  )
}

function Card({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-gray-950">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

// grafikning jadval ko'rinishi (tooltipsiz ham har bir qiymatni o'qish uchun)
function TableToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { t } = useT()
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} className={`${secondaryBtn} h-8 text-xs`}>
      {open ? t('analytics.hideTable') : t('analytics.table')}
    </button>
  )
}

const th = 'px-3 py-2 text-left text-xs font-medium text-gray-500'
const td = 'px-3 py-2 tabular-nums'

function MonthlyTable({ rows, selected, onSelect }: { rows: MonthSummary[]; selected: string; onSelect: (k: string) => void }) {
  const { t } = useT()
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className={th}>{t('analytics.colMonth')}</th>
            <th className={`${th} text-right`}>{t('analytics.colOrders')}</th>
            <th className={`${th} text-right`}>{t('analytics.colRevenue')}</th>
            <th className={`${th} text-right`}>{t('analytics.colAverage')}</th>
            <th className={`${th} text-right`}>{t('analytics.colUnits')}</th>
            <th className={`${th} text-right`}>{t('analytics.colDelivered')}</th>
            <th className={`${th} text-right`}>{t('analytics.colCancelled')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {[...rows].reverse().map((r) => (
            <tr
              key={r.key}
              onClick={() => onSelect(r.key)}
              className={`cursor-pointer transition hover:bg-gray-50 ${r.key === selected ? 'bg-blue-50/60 font-semibold' : ''}`}
            >
              <td className="px-3 py-2 whitespace-nowrap">{monthLabel(r.key)}</td>
              <td className={`${td} text-right`}>{r.orders}</td>
              <td className={`${td} text-right`}>{money(r.revenue)}</td>
              <td className={`${td} text-right`}>{money(r.average)}</td>
              <td className={`${td} text-right`}>{r.units}</td>
              <td className={`${td} text-right`}>{money(r.delivered)}</td>
              <td className={`${td} text-right`}>{r.cancelled}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// gorizontal ro'yxat-ustunlar: qiymat ustun uchida yoziladi (ular kam, hammasini o'qish kerak)
function RankedBars({ rows, empty }: { rows: { key: string; name: string; value: number; note?: string }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-gray-400">{empty}</p>
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-gray-700">{r.name}</span>
            <span className="shrink-0 font-semibold text-gray-950 tabular-nums">
              {money(r.value)}
              {r.note && <span className="ml-1 font-normal text-gray-400">· {r.note}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: CHART_COLOR }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

type TFn = ReturnType<typeof useT>['t']
function toCsv(rows: MonthSummary[], t: TFn) {
  const cell = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`
  const header = (['colMonth', 'colOrders', 'colRevenue', 'colAverage', 'colUnits', 'colDelivered', 'colCancelled'] as const).map((k) => t(`analytics.${k}`))
  const body = [...rows].reverse().map((r) => [monthLabel(r.key), r.orders, r.revenue.toFixed(2), r.average.toFixed(2), r.units, r.delivered.toFixed(2), r.cancelled])
  return '﻿' + [header, ...body].map((row) => row.map(cell).join(';')).join('\r\n')
}

function Analytics() {
  const { orders, products, ordersLoaded } = useAdminData()
  const { t, lang } = useT()
  const [params, setParams] = useSearchParams()
  const [now] = useState(() => new Date())
  const currentKey = monthKeyOf(now)
  // ?month=abc yoki kelajak oy kiritilsa — sahifa buzilmasin, joriy oy ko'rsatiladi
  const requested = params.get('month') ?? ''
  const selected = /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) && requested <= currentKey ? requested : currentKey
  const [showMonthlyTable, setShowMonthlyTable] = useState(false)
  const [showDailyTable, setShowDailyTable] = useState(false)

  const select = (key: string) => {
    const next = new URLSearchParams(params)
    if (key === currentKey) next.delete('month')
    else next.set('month', key)
    setParams(next, { replace: true })
  }

  const monthly = useMemo(() => monthlySeries(orders, currentKey, 12), [orders, currentKey])
  const months = useMemo(() => availableMonths(orders, currentKey), [orders, currentKey])
  const summary = useMemo(() => summarize(selected, orders), [selected, orders])
  const previous = useMemo(() => summarize(shiftMonth(selected, -1), orders), [selected, orders])
  const daily = useMemo(() => dailySeries(selected, orders), [selected, orders])
  const top = useMemo(() => topProducts(selected, orders, 6), [selected, orders])
  const categories = useMemo(() => salesByCategory(selected, orders, products), [selected, orders, products])
  const yearRevenue = monthly.reduce((s, m) => s + m.revenue, 0)

  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([toCsv(monthly, t)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `cx-shop-oborot-${currentKey}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!ordersLoaded) return <p className="py-16 text-center text-sm text-gray-400">{t('common.loading')}</p>

  return (
    <div className="flex flex-col gap-6">
      <Card
        title={t('analytics.monthlyTitle')}
        subtitle={t('analytics.monthlySubtitle', { total: money(yearRevenue) })}
        action={
          <div className="flex gap-2">
            <TableToggle open={showMonthlyTable} onToggle={() => setShowMonthlyTable((v) => !v)} />
            <button type="button" onClick={exportCsv} className={`${secondaryBtn} h-8 text-xs`}>
              <Download className="size-3.5" />
              CSV
            </button>
          </div>
        }
      >
        <BarChart
          ariaLabel={t('analytics.monthlyTitle')}
          bars={monthly.map((m) => ({
            key: m.key,
            label: monthShort(m.key),
            value: m.revenue,
            title: monthLabel(m.key),
            details: t('analytics.monthDetails', { orders: m.orders, average: money(m.average) }),
          }))}
          selectedKey={selected}
          onSelect={select}
          formatValue={money}
          formatTick={moneyCompact}
        />
        {showMonthlyTable && <MonthlyTable rows={monthly} selected={selected} onSelect={select} />}
      </Card>

      {/* filtr: pastdagi hamma narsa shu oyga tegishli */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label={t('analytics.prevMonth')}
          onClick={() => select(shiftMonth(selected, -1))}
          className={`${secondaryBtn} h-10 w-10 px-0`}
        >
          <ChevronLeft className="size-4" />
        </button>
        <Select
          ariaLabel={t('analytics.month')}
          className="w-56"
          value={selected}
          onChange={select}
          options={(months.includes(selected) ? months : [selected, ...months]).map((k) => ({
            value: k,
            label: monthLabel(k) + (k === currentKey ? ` (${t('analytics.current')})` : ''),
          }))}
        />
        <button
          type="button"
          aria-label={t('analytics.nextMonth')}
          disabled={selected >= currentKey}
          onClick={() => select(shiftMonth(selected, 1))}
          className={`${secondaryBtn} h-10 w-10 px-0`}
        >
          <ChevronRight className="size-4" />
        </button>
        <p className="ml-1 text-sm text-gray-500">{t('analytics.reportFor', { month: lang === 'ru' ? monthLabel(selected).toLowerCase() : monthLabel(selected) })}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label={t('analytics.tileRevenue')} value={money(summary.revenue)} hero>
          <Delta current={summary.revenue} previous={previous.revenue} />
        </Tile>
        <Tile label={t('analytics.colOrders')} value={String(summary.orders)}>
          <Delta current={summary.orders} previous={previous.orders} />
        </Tile>
        <Tile label={t('analytics.colAverage')} value={money(summary.average)}>
          <Delta current={summary.average} previous={previous.average} />
        </Tile>
        <Tile label={t('analytics.tileUnits')} value={t('common.pcs', { count: summary.units })}>
          <Delta current={summary.units} previous={previous.units} />
        </Tile>
        <Tile label={t('analytics.tileDelivered')} value={money(summary.delivered)}>
          <p className="mt-1 text-xs text-gray-400">
            {summary.revenue > 0 ? t('analytics.ofRevenue', { pct: Math.round((summary.delivered / summary.revenue) * 100) }) : '—'}
          </p>
        </Tile>
        <Tile label={t('analytics.tileCancelled')} value={String(summary.cancelled)}>
          <p className="mt-1 text-xs text-gray-400">{t('analytics.notInRevenue')}</p>
        </Tile>
      </div>

      <Card
        title={t('analytics.dailyTitle')}
        subtitle={t('analytics.dailySubtitle', { month: monthLabel(selected) })}
        action={<TableToggle open={showDailyTable} onToggle={() => setShowDailyTable((v) => !v)} />}
      >
        {summary.orders === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">{t('analytics.noSalesMonth')}</p>
        ) : (
          <BarChart
            ariaLabel={`${t('analytics.dailyTitle')}, ${monthLabel(selected)}`}
            height={200}
            labelEvery={5}
            bars={daily.map((d) => ({
              key: String(d.day),
              label: String(d.day),
              value: d.revenue,
              title: dayLabel(selected, d.day),
              details: t('analytics.ordersCount', { count: d.orders }),
            }))}
            formatValue={money}
            formatTick={moneyCompact}
          />
        )}
        {showDailyTable && (
          <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className={th}>{t('analytics.colDay')}</th>
                  <th className={`${th} text-right`}>{t('analytics.colOrders')}</th>
                  <th className={`${th} text-right`}>{t('analytics.colRevenue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {daily.filter((d) => d.orders > 0).map((d) => (
                  <tr key={d.day}>
                    <td className="px-3 py-2">{d.day}</td>
                    <td className={`${td} text-right`}>{d.orders}</td>
                    <td className={`${td} text-right`}>{money(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title={t('analytics.topTitle')} subtitle={t('analytics.topSubtitle', { month: monthLabel(selected) })}>
          <RankedBars
            rows={top.map((p) => ({ key: p.key, name: p.name, value: p.revenue, note: t('common.pcs', { count: p.units }) }))}
            empty={t('analytics.noSales')}
          />
        </Card>
        <Card title={t('analytics.categoryTitle')} subtitle={monthLabel(selected)}>
          <RankedBars
            rows={categories.map((c) => ({
              key: c.name,
              name: c.name === OTHER_CATEGORY ? t('analytics.otherCategory') : categoryLabel(lang, c.name),
              value: c.revenue,
            }))}
            empty={t('analytics.noSales')}
          />
        </Card>
      </div>
    </div>
  )
}

export default Analytics
