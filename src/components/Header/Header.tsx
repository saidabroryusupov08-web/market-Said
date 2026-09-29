import { useState, type FormEvent } from 'react'
import { Heart, History, Menu, Search, Settings, ShoppingBag, User, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useSearch } from '../../context/SearchContext'
import { useWishlist } from '../../context/WishlistContext'
import CartDrawer from './CartDrawer'

function CountBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-950 px-1 text-[10px] font-semibold text-white">
      {count}
    </span>
  )
}

const navLinks = ['New Arrivals', 'Men', 'Women', 'Kids', 'Sale']

function SearchInput({ onSubmit }: { onSubmit?: () => void }) {
  const { query, setQuery, history, addToHistory, removeFromHistory, clearHistory } =
    useSearch()
  const [focused, setFocused] = useState(false)

  const search = (term: string) => {
    setQuery(term)
    addToHistory(term)
    setFocused(false)
    ;(document.activeElement as HTMLElement | null)?.blur()
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
    onSubmit?.()
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    search(query)
  }

  const suggestions = history.filter((term) =>
    term.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const showHistory = focused && suggestions.length > 0

  return (
    <form role="search" onSubmit={handleSubmit} className="relative w-full">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return
          if (showHistory) setFocused(false)
          else setQuery('')
        }}
        placeholder="Search products..."
        aria-label="Search products"
        autoComplete="off"
        className="h-[37px] w-full rounded-lg border border-transparent bg-gray-100 pr-9 pl-10 text-sm outline-none transition focus:border-gray-300 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)]"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setQuery('')}
          className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
        >
          <X className="size-3.5" />
        </button>
      )}

      {showHistory && (
        // onMouseDown preventDefault: bosganda input focus'ni yo'qotib, ro'yxat yopilib qolmasligi uchun
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full right-0 left-0 z-50 mt-1.5 animate-[fade-in_100ms_ease-out] rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        >
          <div className="flex items-center justify-between px-2.5 pt-1.5 pb-1">
            <span className="text-xs font-semibold text-gray-500">Recent searches</span>
            <button
              type="button"
              onClick={clearHistory}
              className="cursor-pointer text-xs text-gray-500 transition hover:text-gray-950"
            >
              Clear all
            </button>
          </div>
          <ul>
            {suggestions.map((term) => (
              <li key={term} className="group/item flex items-center rounded-md hover:bg-gray-100">
                <button
                  type="button"
                  onClick={() => search(term)}
                  className="flex flex-1 cursor-pointer items-center gap-2.5 truncate px-2.5 py-2 text-left text-sm text-gray-950"
                >
                  <History className="size-4 shrink-0 text-gray-400" />
                  <span className="truncate">{term}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${term}`}
                  onClick={() => removeFromHistory(term)}
                  className="mr-1 cursor-pointer rounded-full p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  )
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { count, openCart } = useCart()
  const { count: likedCount, lastLikedAt } = useWishlist()

  const iconBtn =
    'rounded-md p-2 text-gray-800 transition hover:bg-gray-100 hover:text-black'

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <nav className="mx-auto flex h-[70px] w-[90%] items-center justify-between gap-6 lg:w-[70%]">
        <div className="flex items-center gap-2 lg:gap-0">
          <button
            type="button"
            aria-label="Menu"
            className={`${iconBtn} -ml-2 lg:hidden`}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <a href="#" className="text-xl font-semibold text-black">
            StyleHub
          </a>

          <ul className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="whitespace-nowrap text-gray-900 transition hover:text-gray-500"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden max-w-[364px] flex-1 md:block">
          <SearchInput />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/admin" title="Admin">
            <Settings size={20} />
          </Link>
          <Link to="/" aria-label="Account" className={iconBtn}>
            <User className="size-5" />
          </Link>
          <button
            type="button"
            aria-label={`Wishlist (${likedCount})`}
            className={`${iconBtn} relative`}
          >
            {/* key o'zgarganda animatsiya qaytadan boshlanadi */}
            <Heart
              key={lastLikedAt}
              className={`size-5 transition-colors ${
                likedCount > 0 ? 'fill-[#ff3040] text-[#ff3040]' : ''
              } ${lastLikedAt ? 'animate-[heart-pop_600ms_ease-out]' : ''}`}
            />
            {likedCount > 0 && (
              <span
                key={likedCount}
                className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] animate-[badge-pop_300ms_ease-out] items-center justify-center rounded-full bg-[#ff3040] px-1 text-[10px] font-bold text-white ring-2 ring-white"
              >
                {likedCount}
              </span>
            )}
          </button>
          <button
            type="button"
            aria-label="Cart"
            className={`${iconBtn} relative`}
            onClick={openCart}
          >
            <ShoppingBag className="size-5" />
            <CountBadge count={count} />
          </button>
        </div>
      </nav>

      <div
        className={`grid overflow-hidden transition-all duration-300 lg:hidden ${
          menuOpen ? 'grid-rows-[1fr] border-t border-gray-200' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0">
          <div className="mx-auto w-[90%] py-4">
            <div className="mb-3 md:hidden">
              <SearchInput onSubmit={() => setMenuOpen(false)} />
            </div>
            <ul className="flex flex-col">
              {navLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="block rounded-md px-2 py-2.5 text-gray-900 transition hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <CartDrawer />
    </header>
  )
}

export default Header
