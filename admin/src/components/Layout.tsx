import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PackageCheck,
  QrCode,
  RefreshCw,
  ShoppingBag,
  ShieldCheck,
  Warehouse,
  X,
} from 'lucide-react'
import { stockStatus } from '../../../shared/stock'
import { LanguageSwitcher } from '../../../shared/i18n'
import Logo from '../../../shared/Logo'
import Tooltip from '../../../shared/Tooltip'
import { useT } from '../i18n'
import { profileOf, useAuth } from '../lib/auth'
import { useAdminData } from '../lib/data'
import Avatar from './Avatar'
import GlobalSearch from './GlobalSearch'
import OpenStoreButton from './OpenStoreButton'
import SecurityModal from './SecurityModal'
import { useToast } from './ui'
import { alertBadge, glassBadge, iconBtn } from './styles'


function Sidebar({
  onNavigate,
  onOpenSecurity,
}: {
  onNavigate?: () => void
  onOpenSecurity: () => void
}) {
  const { state, signOut } = useAuth()
  const { products, unread, newOrders } = useAdminData()
  const outOfStock = products.filter((p) => stockStatus(p) === 'out').length
  const email = state.status === 'admin' ? (state.session.user.email ?? '') : ''
  const profile = state.status === 'admin' ? profileOf(state.session) : null
  const mfaEnabled = state.status === 'admin' && state.mfaEnabled
  const { t } = useT()
  const { pathname } = useLocation()

  // Faol bo'lim ostidagi shisha (blur) fon: bitta element, bo'lim almashganda yangi joyga
  // silliq siljiydi. O'rni faol havoladan o'lchab olinadi.
  const listRef = useRef<HTMLUListElement>(null)
  const [pill, setPill] = useState<{ top: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const active = list.querySelector<HTMLElement>('a[aria-current="page"]')
      setPill(active ? { top: active.offsetTop, height: active.offsetHeight } : null)
    }
    const frame = requestAnimationFrame(measure)
    const observer = new ResizeObserver(() => measure())
    observer.observe(list)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [pathname, t])

  const links = [
    { to: '/', label: t('nav.dashboard'), Icon: LayoutDashboard, badge: null },
    { to: '/orders', label: t('nav.orders'), Icon: ShoppingBag, badge: newOrders || null, highlight: true },
    { to: '/products', label: t('nav.products'), Icon: Package, badge: products.length || null },
    { to: '/messages', label: t('nav.messages'), Icon: Inbox, badge: unread || null, highlight: true },
    // do'kondan chiqib ketgan (jo'natilgan / yetkazilgan) tovarlar
    { to: '/sales', label: t('nav.sales'), Icon: PackageCheck, badge: null },
    { to: '/analytics', label: t('nav.analytics'), Icon: BarChart3, badge: null },
    // omborda tugagan mahsulotlar soni — qizil (e'tibor talab qiladi)
    { to: '/stock', label: t('nav.stock'), Icon: Warehouse, badge: outOfStock || null, highlight: true },
    // do'kon va admin manzillari uchun QR kodlar
    { to: '/qr', label: t('nav.qr'), Icon: QrCode, badge: null },
  ]

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* shisha ortidagi yumshoq rangli dog'lar — blur orqali ko'rinib turadi */}
      <span aria-hidden="true" className="pointer-events-none absolute top-20 -left-12 size-40 rounded-full bg-blue-400/25 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute top-60 -right-14 size-36 rounded-full bg-rose-400/20 blur-3xl" />
      <div className="relative flex h-16 items-center gap-2 px-5">
        <Logo />
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${glassBadge}`}>
          Admin
        </span>
      </div>

      <nav className="relative flex-1 px-3 py-2">
        <ul ref={listRef} className="relative isolate flex flex-col gap-0.5">
          {pill && (
            <li
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 -z-10 transition-[transform,height] duration-300 ease-out motion-reduce:transition-none"
              style={{ transform: `translateY(${pill.top}px)`, height: pill.height }}
            >
              <span
                data-glass-pill
                className="relative block size-full overflow-hidden rounded-xl bg-white/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-8px_14px_-10px_rgba(37,99,235,0.35),0_10px_24px_-12px_rgba(30,64,175,0.45),0_2px_6px_-3px_rgba(15,23,42,0.18)] ring-1 ring-white/80 backdrop-blur-xl backdrop-saturate-150 ring-inset"
              >
                {/* yuqoridagi yaltiroq chiziq — shisha qirrasi */}
                <span className="absolute inset-x-3 top-px h-1/2 rounded-full bg-gradient-to-b from-white/90 to-white/0" />
              </span>
            </li>
          )}
          {links.map(({ to, label, Icon, badge, highlight }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-gray-950' : 'text-gray-600 hover:bg-gray-900/[0.04] hover:text-gray-950'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`size-4 ${isActive ? 'text-blue-700' : ''}`} />
                    {label}
                    {badge !== null && (
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 text-[11px] leading-none font-semibold ${
                          // yangi buyurtma/xabar soni doim qizil — bo'lim ochiq bo'lsa ham
                          highlight
                            ? alertBadge
                            : isActive
                              ? 'bg-white/70 text-blue-800'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <OpenStoreButton className="mt-4 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-950">
          <ExternalLink className="size-4" />
          {t('nav.openStore')}
        </OpenStoreButton>
      </nav>

      <div className="relative border-t border-gray-200/80 p-3">
        <div className="flex items-center gap-1">
          {/* profil: parol va 2FA sozlamalari */}
          <Tooltip label={t('nav.profileTitle')} side="top" align="start" className="min-w-0 flex-1">
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => {
                onNavigate?.()
                onOpenSecurity()
              }}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-gray-100"
            >
              <Avatar src={profile?.avatarUrl ?? null} name={profile?.displayName ?? email} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-gray-950">
                  {profile?.displayName ?? email}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <ShieldCheck className={`size-3 ${mfaEnabled ? 'text-green-600' : ''}`} />
                  {mfaEnabled ? t('nav.mfaOn') : t('nav.security')}
                </span>
              </span>
            </button>
          </Tooltip>
          <Tooltip label={t('nav.signOut')} side="top">
            <button
              type="button"
              onClick={() => signOut()}
              aria-label={t('nav.signOut')}
              className={iconBtn}
            >
              <LogOut className="size-4" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

const titles = {
  '/': 'nav.dashboard',
  '/orders': 'nav.orders',
  '/products': 'nav.products',
  '/messages': 'nav.messages',
  '/sales': 'nav.sales',
  '/analytics': 'nav.analytics',
  '/stock': 'nav.stock',
  '/qr': 'nav.qr',
} as const

function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [securityOpen, setSecurityOpen] = useState(false)
  const { pathname } = useLocation()
  const { reload, loadError } = useAdminData()
  const [reloading, setReloading] = useState(false)
  const { t, lang, setLang } = useT()
  const titleKey = titles[pathname as keyof typeof titles]

  const showToast = useToast()

  // brauzer tabida bo'lim nomi tanlangan tilda ("Склад — cX-shop admin")
  const pageTitle = titleKey ? t(titleKey) : ''
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} — cX-shop admin` : 'cX-shop admin'
  }, [pageTitle])

  // telefondagi menyu Esc bilan ham yopiladi
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // ma'lumot kelishi bilan tugaydi (sun'iy kutish yo'q), natija xabar bilan aytiladi
  const refresh = async () => {
    if (reloading) return
    setReloading(true)
    const error = await reload()
    setReloading(false)
    showToast(error ?? t('nav.refreshed'), error ? 'error' : 'success')
  }

  return (
    <div className="min-h-screen lg:pl-60">
      {/* kompyuterda doim ko'rinadigan chap menyu */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-gray-200 bg-white lg:block">
        <Sidebar onOpenSecurity={() => setSecurityOpen(true)} />
      </aside>

      {/* telefonda: tugma bilan ochiladigan menyu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 animate-[fade-in_150ms_ease-out] bg-white shadow-xl">
            <button
              type="button"
              aria-label={t('nav.closeMenu')}
              onClick={() => setMenuOpen(false)}
              className={`${iconBtn} absolute top-4 right-3`}
            >
              <X className="size-4" />
            </button>
            <Sidebar
              onNavigate={() => setMenuOpen(false)}
              onOpenSecurity={() => setSecurityOpen(true)}
            />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-6">
        <button
          type="button"
          aria-label={t('nav.menu')}
          onClick={() => setMenuOpen(true)}
          className={`${iconBtn} lg:hidden`}
        >
          <Menu className="size-5" />
        </button>
        <h1 className="hidden shrink-0 text-lg font-semibold text-gray-950 md:block md:w-40">
          {titleKey ? t(titleKey) : ''}
        </h1>
        <div className="flex flex-1 justify-center">
          <GlobalSearch />
        </div>
        <Tooltip label={t('nav.refresh')}>
          <button
            type="button"
            onClick={refresh}
            aria-busy={reloading}
            aria-label={t('nav.refresh')}
            className={`${iconBtn} ${reloading ? 'text-blue-600' : ''}`}
          >
            <RefreshCw className={`size-4 ${reloading ? 'animate-spin' : ''}`} />
          </button>
        </Tooltip>
        <LanguageSwitcher lang={lang} setLang={setLang} label={t('common.language')} />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        {loadError && (
          <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </p>
        )}
        {children}
      </main>

      {securityOpen && <SecurityModal onClose={() => setSecurityOpen(false)} />}
    </div>
  )
}

export default Layout
