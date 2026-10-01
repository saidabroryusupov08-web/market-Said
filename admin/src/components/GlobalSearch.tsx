import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImageIcon, Mail, Package, Search, ShoppingBag, X } from 'lucide-react'
import { resolveImage } from '../../../shared/images'
import { minPrice } from '../../../shared/price'
import { createMatcher } from '../../../shared/search'
import { numericDate } from '../../../shared/dates'
import { categoryLabel } from '../../../shared/dataLabels'
import { useT } from '../i18n'
import { useAdminData } from '../lib/data'

type Result =
  | { kind: 'product'; id: number; title: string; subtitle: string; image?: string; to: string }
  | { kind: 'order'; id: number; title: string; subtitle: string; to: string }
  | { kind: 'message'; id: number; title: string; subtitle: string; to: string }

const LIMIT = 5

const GROUPS = [
  { kind: 'order', label: 'nav.orders' },
  { kind: 'product', label: 'nav.products' },
  { kind: 'message', label: 'nav.messages' },
] as const

// Admin panelning o'z qidiruvi: buyurtmalar (№, ism, telefon), mahsulotlar (nom, kategoriya,
// rang — inglizcha/o'zbekcha ham) va xabarlar (email) bo'yicha. Ctrl+K (yoki /) bilan ochiladi.
function GlobalSearch() {
  const { products, messages, orders } = useAdminData()
  const { t, lang } = useT()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const q = query.trim().toLowerCase()

  const results = useMemo<Result[]>(() => {
    if (!q) return []
    // inglizcha/o'zbekcha/lotincha so'rov ham ruscha nomlarni topadi (shared/search.ts)
    const matches = createMatcher(q)
    const productHits: Result[] = products
      .filter((p) => matches([p.name, p.category, p.description, ...p.colors].join(' ')))
      .slice(0, LIMIT)
      .map((p) => ({
        kind: 'product',
        id: p.id,
        title: p.name,
        subtitle: `${categoryLabel(lang, p.category)} · $${minPrice(p).toFixed(2)}`,
        image: resolveImage(p.image),
        to: `/products?edit=${p.id}`,
      }))
    const messageHits: Result[] = messages
      .filter((m) => m.email.toLowerCase().includes(q))
      .slice(0, LIMIT)
      .map((m) => ({
        kind: 'message',
        id: m.id,
        title: m.email,
        subtitle: numericDate(new Date(m.created_at), lang),
        to: `/messages?q=${encodeURIComponent(m.email)}`,
      }))
    const idQuery = q.replace(/^#/, '')
    const digits = q.replace(/\D/g, '')
    const orderHits: Result[] = orders
      .filter(
        (o) =>
          String(o.id) === idQuery ||
          (digits.length >= 3 && o.phone.replace(/\D/g, '').includes(digits)) ||
          matches([o.customer_name, o.email ?? '', o.address].join(' ')),
      )
      .slice(0, LIMIT)
      .map((o) => ({
        kind: 'order',
        id: o.id,
        title: `#${o.id} · ${o.customer_name}`,
        subtitle: `${o.phone} · $${Number(o.total).toFixed(2)}`,
        to: `/orders?id=${o.id}`,
      }))
    return [...orderHits, ...productHits, ...messageHits]
  }, [q, products, messages, orders, lang])

  // Ctrl+K yoki "/" — qidiruvga o'tish (yozish maydonida turganda "/" ishlamaydi)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest('input, textarea, [contenteditable]')
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const go = (result: Result) => {
    navigate(result.to)
    setQuery('')
    setOpen(false)
    // ref o'rniga: ro'yxatdagi tugma bosilganda fokus shu yerda bo'ladi
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (results.length === 0) return
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + step + results.length) % results.length)
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault()
      go(results[Math.min(active, results.length - 1)])
    }
  }

  const showPanel = open && q !== ''

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={t('search.placeholder')}
        aria-label={t('search.label')}
        autoComplete="off"
        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pr-16 pl-9 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(59,130,246,0.2)]"
      />
      {query ? (
        <button
          type="button"
          aria-label={t('common.clear')}
          onClick={() => {
            setQuery('')
            inputRef.current?.focus()
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-1 text-gray-400 hover:text-gray-700"
        >
          <X className="size-4" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 sm:block">
          Ctrl K
        </kbd>
      )}

      {showPanel && (
        <div className="absolute top-full right-0 left-0 z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-gray-400">
              {t('search.nothing', { query: query.trim() })}
            </p>
          ) : (
            GROUPS.map(({ kind, label }) => {
              const group = results.filter((r) => r.kind === kind)
              if (group.length === 0) return null
              return (
                <div key={kind} className="py-1">
                  <p className="px-2.5 pb-1 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
                    {t(label)}
                  </p>
                  {group.map((r) => {
                    const index = results.indexOf(r)
                    return (
                      <button
                        key={`${r.kind}-${r.id}`}
                        type="button"
                        onMouseEnter={() => setActive(index)}
                        onClick={() => go(r)}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left ${
                          index === active ? 'bg-gray-100' : ''
                        }`}
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-gray-400">
                          {r.kind === 'product' ? (
                            r.image ? (
                              <img src={r.image} alt="" className="size-full object-cover" />
                            ) : (
                              <ImageIcon className="size-4" />
                            )
                          ) : r.kind === 'order' ? (
                            <ShoppingBag className="size-4" />
                          ) : (
                            <Mail className="size-4" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-950">
                            {r.title}
                          </span>
                          <span className="block truncate text-xs text-gray-500">{r.subtitle}</span>
                        </span>
                        {r.kind === 'product' && (
                          <Package className="ml-auto size-3.5 shrink-0 text-gray-300" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
