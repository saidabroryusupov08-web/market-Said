import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Boxes, CircleSlash, ImageIcon, PackageX, Search, Wallet } from 'lucide-react'
import { categoryLabel, sizeLabel } from '../../../shared/dataLabels'
import { resolveImage } from '../../../shared/images'
import { getPrice } from '../../../shared/price'
import type { Product } from '../../../shared/products'
import { createMatcher } from '../../../shared/search'
import { LOW_STOCK, stockOf, stockStatus, totalUnits, type StockStatus } from '../../../shared/stock'
import { useT } from '../i18n'
import { money } from '../lib/analytics'
import { useAdminData } from '../lib/data'
import Select from '../components/Select'
import { useToast } from '../components/ui'
import { alertBadge, inputClass, primaryBtn, secondaryBtn } from '../components/styles'

// Ombor: har bir mahsulotning o'lcham bo'yicha qoldig'i. Bo'sh maydon — hisob yuritilmaydi
// (cheklovsiz sotiladi). Buyurtma berilganda qoldiq serverda o'zi kamayadi, bekor qilinsa qaytadi.

const STATUS_STYLE: Record<StockStatus, string> = {
  in: 'bg-green-50 text-green-700 ring-green-200',
  low: 'bg-amber-50 text-amber-700 ring-amber-200',
  out: alertBadge,
  untracked: 'bg-gray-100 text-gray-500 ring-gray-200',
}

function StatusBadge({ status }: { status: StockStatus }) {
  const { t } = useT()
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset ${STATUS_STYLE[status]}`}>
      {t(`stock.status.${status}`)}
    </span>
  )
}

function Thumb({ product }: { product: Product }) {
  const src = resolveImage(product.image)
  return (
    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-300">
      {src ? <img src={src} alt="" loading="lazy" className="size-full object-cover" /> : <ImageIcon className="size-5" />}
    </span>
  )
}

const toDraft = (p: Product) =>
  Object.fromEntries(p.sizes.map((s) => [s, stockOf(p, s)?.toString() ?? '']))

// bitta mahsulot qatori: o'lchamlar bo'yicha maydonlar, o'zgarsa "Сохранить"
function StockRow({ product }: { product: Product }) {
  const { saveStock } = useAdminData()
  const showToast = useToast()
  const { t, lang } = useT()
  const [draft, setDraft] = useState<Record<string, string>>(() => toDraft(product))
  const [saving, setSaving] = useState(false)
  // bazadan yangi qiymat kelsa (buyurtma, yangilash) — tahrirlanmagan qator o'zi yangilanadi
  const [base, setBase] = useState(product)
  if (base !== product) {
    const wasClean = JSON.stringify(draft) === JSON.stringify(toDraft(base))
    setBase(product)
    if (wasClean) setDraft(toDraft(product))
  }

  const original = toDraft(product)
  const dirty = product.sizes.some((s) => (draft[s] ?? '') !== original[s])
  const invalid = product.sizes.filter((s) => draft[s] && !/^\d{1,5}$/.test(draft[s]))

  const preview: Product = {
    ...product,
    stock: Object.fromEntries(product.sizes.filter((s) => /^\d+$/.test(draft[s] ?? '')).map((s) => [s, Number(draft[s])])),
  }

  const save = async () => {
    if (invalid.length > 0) return showToast(t('stock.invalid'), 'error')
    setSaving(true)
    const error = await saveStock(product.id, preview.stock!)
    setSaving(false)
    showToast(error ?? t('stock.saved', { name: product.name }), error ? 'error' : 'success')
  }

  return (
    <li className={`grid gap-3 p-4 transition md:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_90px_130px] md:items-center ${dirty ? 'bg-blue-50/40' : ''}`}>
      <div className="flex min-w-0 items-center gap-3">
        <Thumb product={product} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-950">{product.name}</p>
          <p className="text-xs text-gray-500">{categoryLabel(lang, product.category)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {product.sizes.map((s) => {
          const value = draft[s] ?? ''
          const n = /^\d+$/.test(value) ? Number(value) : null
          const tone =
            invalid.includes(s)
              ? 'border-red-400 bg-red-50'
              : n === 0
                ? 'border-rose-200 bg-rose-50/60 text-rose-700'
                : n !== null && n <= LOW_STOCK
                  ? 'border-amber-200 bg-amber-50/60 text-amber-800'
                  : 'border-gray-200 bg-white'
          return (
            <label key={s} className="flex flex-col items-center gap-1">
              <span className="max-w-24 truncate text-[11px] font-medium text-gray-500">{sizeLabel(lang, s)}</span>
              <input
                inputMode="numeric"
                aria-label={t('stock.sizeAria', { name: product.name, size: sizeLabel(lang, s) })}
                placeholder="—"
                value={value}
                onChange={(e) => setDraft((d) => ({ ...d, [s]: e.target.value.replace(/[^\d]/g, '').slice(0, 5) }))}
                className={`h-9 w-16 rounded-lg border text-center text-sm font-semibold tabular-nums outline-none transition placeholder:font-normal placeholder:text-gray-300 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)] ${tone}`}
              />
            </label>
          )
        })}
      </div>

      <div className="flex items-center gap-2 md:block md:text-right">
        <span className="text-xs text-gray-400 md:hidden">{t('stock.colTotal')}:</span>
        <span className="text-sm font-semibold text-gray-950 tabular-nums">
          {stockStatus(preview) === 'untracked' ? '—' : t('common.pcs', { count: totalUnits(preview) })}
        </span>
      </div>

      <div className="flex items-center gap-2 md:justify-end">
        {dirty ? (
          <>
            <button type="button" onClick={() => setDraft(original)} className={`${secondaryBtn} h-8 px-2.5 text-xs`}>
              {t('common.cancel')}
            </button>
            <button type="button" onClick={save} disabled={saving} className={`${primaryBtn} h-8 px-3 text-xs`}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </>
        ) : (
          <StatusBadge status={stockStatus(product)} />
        )}
      </div>
    </li>
  )
}

function Tile({
  label,
  value,
  hint,
  Icon,
  tone,
  active,
  onClick,
}: {
  label: string
  value: string
  hint: string
  Icon: typeof Boxes
  tone: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border bg-white p-5 text-left transition ${
        active ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-500">{label}</p>
        <span className={`flex size-8 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{hint}</p>
    </button>
  )
}

const FILTERS = ['all', 'in', 'low', 'out', 'untracked'] as const
type Filter = (typeof FILTERS)[number]

function Stock() {
  const { products, productsLoaded } = useAdminData()
  const { t } = useT()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const filter = (FILTERS as readonly string[]).includes(params.get('status') ?? '') ? (params.get('status') as Filter) : 'all'
  const setFilter = (next: Filter) => {
    const p = new URLSearchParams(params)
    if (next === 'all' || next === filter) p.delete('status')
    else p.set('status', next)
    setParams(p, { replace: true })
  }

  const summary = useMemo(() => {
    let units = 0
    let value = 0
    const count: Record<StockStatus, number> = { in: 0, low: 0, out: 0, untracked: 0 }
    for (const p of products) {
      count[stockStatus(p)]++
      for (const s of p.sizes) {
        const q = stockOf(p, s) ?? 0
        units += q
        value += q * getPrice(p, s)
      }
    }
    return { units, value, count }
  }, [products])

  const visible = useMemo(() => {
    const matches = createMatcher(search)
    return products
      .filter((p) => (filter === 'all' || stockStatus(p) === filter) && matches([p.name, p.category, ...p.colors].join(' ')))
      .sort((a, b) => {
        // muammolilar tepada: tugagan, so'ng kam qolgan
        const rank = { out: 0, low: 1, in: 2, untracked: 3 }
        return rank[stockStatus(a)] - rank[stockStatus(b)] || a.name.localeCompare(b.name)
      })
  }, [products, search, filter])

  const tracked = products.length - summary.count.untracked

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label={t('stock.tileUnits')}
          value={String(summary.units)}
          hint={t('stock.tileUnitsHint', { tracked, total: products.length })}
          Icon={Boxes}
          tone="bg-blue-50 text-blue-700"
        />
        <Tile
          label={t('stock.tileValue')}
          value={money(summary.value)}
          hint={t('stock.tileValueHint')}
          Icon={Wallet}
          tone="bg-gray-100 text-gray-600"
        />
        <Tile
          label={t('stock.tileLow')}
          value={String(summary.count.low)}
          hint={t('stock.tileLowHint', { count: LOW_STOCK })}
          Icon={AlertTriangle}
          tone="bg-amber-50 text-amber-700"
          active={filter === 'low'}
          onClick={() => setFilter('low')}
        />
        <Tile
          label={t('stock.tileOut')}
          value={String(summary.count.out)}
          hint={t('stock.tileOutHint')}
          Icon={PackageX}
          tone="bg-rose-50 text-rose-600"
          active={filter === 'out'}
          onClick={() => setFilter('out')}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder={t('stock.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          ariaLabel={t('stock.filter')}
          className="sm:w-52"
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={FILTERS.map((f) => ({ value: f, label: f === 'all' ? t('stock.all') : t(`stock.status.${f}`) }))}
        />
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-gray-100/70 px-3 py-2.5 text-xs leading-relaxed text-gray-600">
        <CircleSlash className="mt-0.5 size-3.5 shrink-0 text-gray-400" />
        {t('stock.hint')}
      </p>

      {!productsLoaded ? (
        <p className="py-16 text-center text-sm text-gray-400">{t('common.loading')}</p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center text-sm text-gray-500">
          {products.length === 0 ? t('dashboard.noProducts') : t('common.nothingFound')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_90px_130px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500 md:grid">
            <span>{t('products.colProduct')}</span>
            <span>{t('stock.colSizes')}</span>
            <span className="text-right">{t('stock.colTotal')}</span>
            <span className="text-right">{t('stock.colStatus')}</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {visible.map((p) => (
              <StockRow key={p.id} product={p} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Stock
