import { useEffect, useState } from 'react'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import ProductImage from '../sections/Products/ProductImage'
import CheckoutModal from './CheckoutModal'
import { colorLabel, sizeLabel } from '../../../shared/dataLabels'
import { useT } from '../../i18n'

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
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const { t, lang } = useT()

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
    <>
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
        aria-label={t('cart.title')}
        className={`absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-500 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6">
          <h2 className="flex items-center gap-2 text-xl font-medium text-black">
            <ShoppingBag className="size-5" />
            {t('cart.titleCount', { count })}
          </h2>
          <button
            type="button"
            aria-label={t('common.close')}
            className="rounded-md p-1 text-gray-700 transition hover:bg-gray-100 hover:text-black"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
            <ShoppingBag className="mb-4 size-16 text-gray-500" strokeWidth={1.75} />
            <p className="text-lg text-black">{t('cart.empty')}</p>
            <p className="mt-1 text-gray-500">{t('cart.emptyHint')}</p>
            <button
              type="button"
              className="mt-6 rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              onClick={onClose}
            >
              {t('common.continueShopping')}
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
                        aria-label={t('common.delete')}
                        onClick={() => removeItem(item.key)}
                        className="text-gray-400 transition hover:text-red-500"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">
                      {sizeLabel(lang, item.size)} · {colorLabel(lang, item.color)}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-md border border-gray-200">
                        <button
                          type="button"
                          aria-label={t('cart.decrease')}
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          className="p-1.5 transition hover:bg-gray-100"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={t('cart.increase')}
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          className="p-1.5 transition hover:bg-gray-100"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <p className="font-medium text-gray-950">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-200 p-6">
              <div className="mb-4 flex justify-between text-lg font-medium text-gray-950">
                <span>{t('common.total')}</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  // savat yopiladi (u "inert" bo'lib qoladi), forma alohida oynada ochiladi
                  onClose()
                  setCheckoutOpen(true)
                }}
                className="w-full cursor-pointer rounded-md bg-gray-950 py-2.5 font-semibold text-white transition hover:bg-gray-800"
              >
                {t('cart.checkout')}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
    {checkoutOpen && <CheckoutModal onClose={() => setCheckoutOpen(false)} />}
    </>
  )
}

export default CartDrawer
