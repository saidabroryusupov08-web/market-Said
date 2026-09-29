import { useEffect } from 'react'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import ProductImage from '../sections/Products/ProductImage'

function CartDrawer() {
  const {
    items,
    count,
    total,
    isOpen: open,
    closeCart: onClose,
    updateQuantity,
    removeItem,
  } = useCart()

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
    >
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-500 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-label="Корзина покупок"
        className={`absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-500 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6">
          <h2 className="flex items-center gap-2 text-xl font-medium text-black">
            <ShoppingBag className="size-5" />
            Корзина покупок ({count})
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

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
            <ShoppingBag className="mb-4 size-16 text-gray-500" strokeWidth={1.75} />
            <p className="text-lg text-black">Ваша корзина пуста</p>
            <p className="mt-1 text-gray-500">Добавьте товары, чтобы начать покупки</p>
            <button
              type="button"
              className="mt-6 rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              onClick={onClose}
            >
              Продолжить покупки
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-gray-200 overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-4">
                  <div className="size-20 shrink-0 overflow-hidden rounded-lg [&_svg]:size-8">
                    <ProductImage product={item.product} />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <p className="font-medium text-gray-950">{item.product.name}</p>
                      <button
                        type="button"
                        aria-label="Удалить"
                        onClick={() => removeItem(item.key)}
                        className="text-gray-400 transition hover:text-red-500"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">
                      {item.size} · {item.color}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-md border border-gray-200">
                        <button
                          type="button"
                          aria-label="Уменьшить"
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          className="p-1.5 transition hover:bg-gray-100"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Увеличить"
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          className="p-1.5 transition hover:bg-gray-100"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <p className="font-medium text-gray-950">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-200 p-6">
              <div className="mb-4 flex justify-between text-lg font-medium text-gray-950">
                <span>Итого</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button
                type="button"
                className="w-full rounded-md bg-gray-950 py-2.5 font-semibold text-white transition hover:bg-gray-800"
              >
                Оформить заказ
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

export default CartDrawer
