import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Download,
  ExternalLink,
  Inbox,
  Package,
  Pencil,
  ShoppingBag,
  Wallet,
} from 'lucide-react'
import { resolveImage } from '../../../shared/images'
import { profileOf, useAuth } from '../lib/auth'
import { money } from '../lib/analytics'
import { formatDateTime } from '../lib/format'
import { weekdayDayMonth } from '../../../shared/dates'
import { categoryLabel } from '../../../shared/dataLabels'
import { useT } from '../i18n'
import { useAdminData } from '../lib/data'
import { StatusBadge } from './Orders'
import Avatar from '../components/Avatar'
import HeroEditor from '../components/HeroEditor'
import OpenStoreButton from '../components/OpenStoreButton'
import { useToast } from '../components/ui'
import { primaryBtn, secondaryBtn } from '../components/styles'

const DAY = 24 * 60 * 60 * 1000

function StatCard({
  label,
  value,
  hint,
  Icon,
  to,
  accent = false,
}: {
  label: string
  value: number | string
  hint?: string
  Icon: typeof Package
  to: string
  accent?: boolean
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <span
          className={`flex size-8 items-center justify-center rounded-lg ${
            accent ? 'bg-rose-50 text-rose-500' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </Link>
  )
}


function greetingKey(hour: number) {
  if (hour < 5) return 'dashboard.night' as const
  if (hour < 12) return 'dashboard.morning' as const
  if (hour < 18) return 'dashboard.day' as const
  return 'dashboard.evening' as const
}

// do'kon bosh sahifasi: hozir saytda nima turgani + tahrirlash tugmasi
function SiteHeroCard() {
  const { siteSettings } = useAdminData()
  const [editing, setEditing] = useState(false)
  const { t } = useT()
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center">
      <img
        src={resolveImage(siteSettings.heroImage)}
        alt=""
        className="size-20 shrink-0 rounded-lg bg-gray-100 object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-400">{t('hero.title')}</p>
        <p className="truncate font-semibold text-gray-950">{siteSettings.heroTitle}</p>
        <p className="line-clamp-2 text-sm text-gray-500">{siteSettings.heroSubtitle}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <OpenStoreButton className={secondaryBtn}>
          <ExternalLink className="size-4" />
          {t('dashboard.open')}
        </OpenStoreButton>
        <button type="button" onClick={() => setEditing(true)} className={primaryBtn}>
          <Pencil className="size-4" />
          {t('dashboard.editHero')}
        </button>
      </div>
      {editing && <HeroEditor onClose={() => setEditing(false)} />}
    </section>
  )
}

function Dashboard() {
  const { products, messages, orders, productsLoaded, unread, newOrders, importDefaults } =
    useAdminData()
  const { state } = useAuth()
  const profile = state.status === 'admin' ? profileOf(state.session) : null
  const showToast = useToast()
  const { t, lang } = useT()
  const [importing, setImporting] = useState(false)

  // sahifa ochilgan vaqt (render paytida Date.now() chaqirilmasligi uchun)
  const [now] = useState(() => Date.now())
  const lastWeek = messages.filter((m) => now - new Date(m.created_at).getTime() < 7 * DAY)
  const uniqueEmails = new Set(messages.map((m) => m.email.toLowerCase())).size
  const hiddenProducts = products.filter((p) => p.isActive === false).length

  // tushum: oxirgi 30 kun, bekor qilinganlarsiz
  const monthOrders = orders.filter(
    (o) => o.status !== 'cancelled' && now - new Date(o.created_at).getTime() < 30 * DAY,
  )
  const revenue = monthOrders.reduce((sum, o) => sum + Number(o.total), 0)
  const averageCheck = monthOrders.length > 0 ? revenue / monthOrders.length : 0

  // kategoriya bo'yicha nechta mahsulot borligi (eng ko'pi tepada)
  const byCategory = Object.entries(
    products.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1
      return acc
    }, {}),
  ).sort((a, b) => b[1] - a[1])
  const maxInCategory = Math.max(1, ...byCategory.map(([, n]) => n))

  const runImport = async () => {
    setImporting(true)
    const error = await importDefaults()
    setImporting(false)
    showToast(error ?? t('dashboard.importDone'), error ? 'error' : 'success')
  }

  return (
    <div className="flex flex-col gap-6">
      {profile && (
        <div className="flex items-center gap-3">
          <Avatar src={profile.avatarUrl} name={profile.displayName} className="size-12 text-lg" />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-gray-950">
              {t('dashboard.greeting', { hello: t(greetingKey(new Date(now).getHours())), name: profile.name || t('dashboard.adminFallback') })}
            </h2>
            <p className="text-sm text-gray-500">
              {weekdayDayMonth(new Date(now), lang)}
            </p>
          </div>
        </div>
      )}

      <SiteHeroCard />

      {productsLoaded && products.length === 0 && (
        <div className="flex flex-col gap-4 rounded-xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-blue-950">{t('dashboard.emptyTitle')}</p>
            <p className="mt-1 text-sm text-blue-900/70">
              {t('dashboard.emptyText')}
            </p>
          </div>
          <button type="button" onClick={runImport} disabled={importing} className={primaryBtn}>
            <Download className="size-4" />
            {importing ? t('dashboard.importing') : t('dashboard.import')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('dashboard.newOrders')}
          value={newOrders}
          hint={newOrders > 0 ? t('dashboard.awaiting') : t('dashboard.allHandled')}
          Icon={ShoppingBag}
          to="/orders?status=new"
          accent={newOrders > 0}
        />
        <StatCard
          label={t('dashboard.revenue30')}
          value={money(revenue)}
          hint={t('dashboard.revenueHint', { count: monthOrders.length, avg: money(averageCheck) })}
          Icon={Wallet}
          to="/orders"
        />
        <StatCard
          label={t('dashboard.products')}
          value={products.length}
          hint={hiddenProducts > 0 ? t('dashboard.hiddenCount', { count: hiddenProducts }) : t('dashboard.allVisible')}
          Icon={Package}
          to="/products"
        />
        <StatCard
          label={t('dashboard.newMessages')}
          value={unread}
          hint={t('dashboard.messagesHint', { subscribers: uniqueEmails, week: lastWeek.length })}
          Icon={Inbox}
          to="/messages"
          accent={unread > 0}
        />
      </div>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-950">{t('dashboard.recentOrders')}</h2>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-950"
          >
            {t('common.all')} <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">
            {t('dashboard.noOrders')}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link
                  to={`/orders?id=${o.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition hover:bg-gray-50"
                >
                  <span className="w-12 shrink-0 text-sm font-semibold text-gray-950">#{o.id}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-950">
                      {o.customer_name}
                    </span>
                    <span className="block text-xs text-gray-400">{formatDateTime(o.created_at)}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-gray-950">
                    ${Number(o.total).toFixed(2)}
                  </span>
                  <StatusBadge status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="rounded-xl border border-gray-200 bg-white lg:col-span-3">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-950">{t('dashboard.recentMessages')}</h2>
            <Link
              to="/messages"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-950"
            >
              {t('common.all')} <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {messages.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">{t('messages.empty')}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {messages.slice(0, 6).map((m) => (
                <li key={m.id}>
                  <Link
                    to={`/messages?q=${encodeURIComponent(m.email)}`}
                    className="flex items-center gap-3 px-5 py-3 transition hover:bg-gray-50"
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${m.is_read ? 'bg-transparent' : 'bg-rose-400'}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-950">
                        {m.email}
                      </span>
                      <span className="block text-xs text-gray-400">
                        {formatDateTime(m.created_at)}
                      </span>
                    </span>
                    {m.cart.length > 0 && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        <ShoppingBag className="size-3" />${Number(m.total).toFixed(2)}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-950">{t('dashboard.byCategory')}</h2>
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-950"
            >
              {t('common.all')} <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {byCategory.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">{t('dashboard.noProducts')}</p>
          ) : (
            <ul className="flex flex-col gap-3 px-5 py-4">
              {byCategory.map(([category, count]) => (
                <li key={category}>
                  <Link to={`/products?category=${encodeURIComponent(category)}`} className="block">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-gray-700">{categoryLabel(lang, category)}</span>
                      <span className="font-medium text-gray-950">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gray-950"
                        style={{ width: `${(count / maxInCategory) * 100}%` }}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default Dashboard
