import { useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RefreshCw,
  ShoppingBag,
  ShieldCheck,
  X,
} from 'lucide-react'
import Logo from '../../../shared/Logo'
import { useAuth } from '../lib/auth'
import { useAdminData } from '../lib/data'
import GlobalSearch from './GlobalSearch'
import SecurityModal from './SecurityModal'
import { iconBtn } from './ui'

// do'kon manzili (Vercel env: VITE_STORE_URL), menyudagi "Открыть магазин" uchun
const STORE_URL = (import.meta.env.VITE_STORE_URL as string | undefined) || ''

function Sidebar({
  onNavigate,
  onOpenSecurity,
}: {
  onNavigate?: () => void
  onOpenSecurity: () => void
}) {
  const { state, signOut } = useAuth()
  const { products, unread, newOrders } = useAdminData()
  const email = state.status === 'admin' ? (state.session.user.email ?? '') : ''
  const mfaEnabled = state.status === 'admin' && state.mfaEnabled

  const links = [
    { to: '/', label: 'Главная', Icon: LayoutDashboard, badge: null },
    { to: '/orders', label: 'Заказы', Icon: ShoppingBag, badge: newOrders || null, highlight: true },
    { to: '/products', label: 'Товары', Icon: Package, badge: products.length || null },
    { to: '/messages', label: 'Сообщения', Icon: Inbox, badge: unread || null, highlight: true },
    { to: '/analytics', label: 'Аналитика', Icon: BarChart3, badge: null },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <Logo />
        <span className="rounded-md bg-gray-950 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
          Admin
        </span>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="flex flex-col gap-0.5">
          {links.map(({ to, label, Icon, badge, highlight }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-gray-950 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="size-4" />
                    {label}
                    {badge !== null && (
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 text-[11px] leading-none font-semibold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : highlight
                              ? 'bg-blue-600 text-white'
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

        {STORE_URL && (
          <a
            href={STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-950"
          >
            <ExternalLink className="size-4" />
            Открыть магазин
          </a>
        )}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-1">
          {/* profil: parol va 2FA sozlamalari */}
          <button
            type="button"
            onClick={() => {
              onNavigate?.()
              onOpenSecurity()
            }}
            title="Безопасность: пароль и 2FA"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-gray-100"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-950 text-xs font-semibold text-white uppercase">
              {email.charAt(0) || 'A'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-gray-950">{email}</span>
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <ShieldCheck className={`size-3 ${mfaEnabled ? 'text-green-600' : ''}`} />
                {mfaEnabled ? '2FA включена' : 'Безопасность'}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => signOut()}
            aria-label="Выйти"
            title="Выйти"
            className={iconBtn}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

const titles: Record<string, string> = {
  '/': 'Главная',
  '/orders': 'Заказы',
  '/products': 'Товары',
  '/messages': 'Сообщения',
  '/analytics': 'Аналитика',
}

function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [securityOpen, setSecurityOpen] = useState(false)
  const { pathname } = useLocation()
  const { reload, loadError } = useAdminData()
  const [reloading, setReloading] = useState(false)

  const refresh = async () => {
    setReloading(true)
    await reload()
    setReloading(false)
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
              aria-label="Закрыть меню"
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
          aria-label="Меню"
          onClick={() => setMenuOpen(true)}
          className={`${iconBtn} lg:hidden`}
        >
          <Menu className="size-5" />
        </button>
        <h1 className="hidden shrink-0 text-lg font-semibold text-gray-950 md:block md:w-40">
          {titles[pathname] ?? ''}
        </h1>
        <div className="flex flex-1 justify-center">
          <GlobalSearch />
        </div>
        <button
          type="button"
          onClick={refresh}
          aria-label="Обновить данные"
          title="Обновить данные"
          className={iconBtn}
        >
          <RefreshCw className={`size-4 ${reloading ? 'animate-spin' : ''}`} />
        </button>
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
