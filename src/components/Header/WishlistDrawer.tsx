import { useEffect } from 'react'
import { Heart, X } from 'lucide-react'
import { useWishlist } from '../../context/WishlistContext'
import { useProducts } from '../../context/ProductsContext'
import ProductImage from '../sections/Products/ProductImage'
import ProductPrice from '../sections/Products/ProductPrice'

function WishlistDrawer() {
  const { likedIds, count, isOpen: open, closeWishlist: onClose, toggleLike } = useWishlist()
  const { products } = useProducts()

  const likedProducts = likedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p) => p !== undefined)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
      // yopiq panel ichidagi tugmalarga Tab bilan o'tib bo'lmasligi uchun
      inert={!open}
    >
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-500 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-label="Избранное"
        className={`absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-500 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6">
          <h2 className="flex items-center gap-2 text-xl font-medium text-black">
            <Heart className="size-5" />
            Избранное ({count})
          </h2>
          <button
            type="button"
            aria-label="Закрыть"
            className="rounded-md p-1 text-gray-700 transition hover:bg-gray-100 hover:text-black"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        {likedProducts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
            <Heart className="mb-4 size-16 text-gray-500" strokeWidth={1.75} />
            <p className="text-lg text-black">Список избранного пуст</p>
            <p className="mt-1 text-gray-500">
              Нажмите на сердечко у товара, чтобы сохранить его здесь
            </p>
            <button
              type="button"
              className="mt-6 rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              onClick={onClose}
            >
              Продолжить покупки
            </button>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-gray-200 overflow-y-auto px-6">
            {likedProducts.map((product) => (
              <li key={product.id} className="flex gap-4 py-4">
                <div className="size-20 shrink-0 overflow-hidden rounded-lg [&_svg]:size-8">
                  <ProductImage product={product} />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium text-gray-950">{product.name}</p>
                    <button
                      type="button"
                      aria-label="Убрать из избранного"
                      onClick={() => toggleLike(product.id)}
                      className="text-gray-400 transition hover:text-red-500"
                    >
                      <Heart className="size-4 fill-current" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">{product.category}</p>
                  <ProductPrice
                    product={product}
                    size=""
                    className="mt-auto font-medium text-gray-950"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}

export default WishlistDrawer
