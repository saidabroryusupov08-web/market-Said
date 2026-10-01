import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { getClientInfo } from '../../utils/device'
import { colorLabel, sizeLabel } from '../../../shared/dataLabels'
import { tr, useT } from '../../i18n'

// "Оформить заказ": mijoz ma'lumotlari -> api/order.ts -> admin paneldagi "Заказы" (+ Telegram).
// Narx serverda qayta hisoblanadi, bu yerdagi summa faqat ko'rsatish uchun.

type Form = { name: string; phone: string; email: string; address: string; comment: string }
type Errors = Partial<Record<keyof Form, string>>

const empty: Form = { name: '', phone: '+998 ', email: '', address: '', comment: '' }

function validate(f: Form): Errors {
  const errors: Errors = {}
  if (f.name.trim().length < 2) errors.name = tr('checkout.errName')
  const digits = f.phone.replace(/\D/g, '')
  if (digits.length < 9 || digits.length > 15 || !/^[+\d\s()-]+$/.test(f.phone.trim()))
    errors.phone = tr('checkout.errPhone')
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(f.email.trim()))
    errors.email = tr('checkout.errEmail')
  if (f.address.trim().length < 5) errors.address = tr('checkout.errAddress')
  return errors
}

const inputClass =
  'h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.2)]'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

function CheckoutModal({ onClose }: { onClose: () => void }) {
  const { items, total, clearCart } = useCart()
  const { t, lang } = useT()
  const [form, setForm] = useState<Form>(empty)
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState('')
  const [sending, setSending] = useState(false)
  const [orderId, setOrderId] = useState<number | null>(null)
  // spam-bot tuzog'i: odamga ko'rinmaydi
  const [website, setWebsite] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const set = (field: keyof Form) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setServerError('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (sending) return
    const problems = validate(form)
    if (Object.keys(problems).length > 0) return setErrors(problems)

    setSending(true)
    try {
      const { device, browser } = getClientInfo()
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          website,
          device,
          browser,
          items: items.map((i) => ({
            productId: i.product.id,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 409 && data.code === 'out_of_stock')
        throw new Error(
          data.available > 0
            ? t('checkout.lowStock', { name: data.name, size: sizeLabel(lang, data.size), count: data.available })
            : t('checkout.soldOut', { name: data.name, size: sizeLabel(lang, data.size) }),
        )
      if (!res.ok) throw new Error(data.error || t('checkout.failed'))
      setOrderId(data.id)
      clearCart()
    } catch (err) {
      setServerError(
        err instanceof Error && err.message !== 'Failed to fetch'
          ? err.message
          : t('checkout.network'),
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-[fade-in_200ms_ease-out] bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-label={t('checkout.title')}
        className="relative max-h-[92vh] w-full max-w-lg animate-[zoom-in_200ms_ease-out] overflow-y-auto rounded-xl bg-white shadow-2xl"
      >
        <button
          type="button"
          aria-label={t('common.close')}
          onClick={onClose}
          className="absolute top-3 right-3 cursor-pointer rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-black"
        >
          <X className="size-4" />
        </button>

        {orderId !== null ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <CheckCircle2 className="mb-4 size-14 text-green-500" strokeWidth={1.5} />
            <h2 className="text-xl font-medium text-gray-950">{t('checkout.accepted', { id: orderId })}</h2>
            <p className="mt-2 max-w-xs text-sm text-gray-500">
              {t('checkout.willCall').split(/(\{phone\})/).map((part, i) =>
                part === '{phone}' ? <b key={i} className="text-gray-700">{form.phone}</b> : part,
              )}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 h-10 cursor-pointer rounded-md bg-gray-950 px-5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              {t('common.continueShopping')}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-4 p-6">
            <h2 className="text-xl font-medium text-gray-950">{t('checkout.title')}</h2>

            <input
              type="text"
              name="cx_hp_order"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] size-px opacity-0"
            />

            <Field label={t('checkout.name')} error={errors.name}>
              <input
                autoFocus
                autoComplete="name"
                value={form.name}
                onChange={(e) => set('name')(e.target.value)}
                className={`${inputClass} ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('checkout.phone')} error={errors.phone}>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => set('phone')(e.target.value)}
                  className={`${inputClass} ${errors.phone ? 'border-red-400' : 'border-gray-300'}`}
                />
              </Field>
              <Field label={t('checkout.email')} error={errors.email}>
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set('email')(e.target.value)}
                  className={`${inputClass} ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                />
              </Field>
            </div>
            <Field label={t('checkout.address')} error={errors.address}>
              <input
                autoComplete="street-address"
                placeholder={t('checkout.addressPlaceholder')}
                value={form.address}
                onChange={(e) => set('address')(e.target.value)}
                className={`${inputClass} ${errors.address ? 'border-red-400' : 'border-gray-300'}`}
              />
            </Field>
            <Field label={t('checkout.comment')}>
              <textarea
                rows={2}
                value={form.comment}
                onChange={(e) => set('comment')(e.target.value)}
                className={`${inputClass} h-auto border-gray-300 py-2`}
              />
            </Field>

            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <ul className="flex flex-col gap-1 text-gray-600">
                {items.map((i) => (
                  <li key={i.key} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {i.product.name}
                      <span className="text-gray-400">
                        {' '}
                        — {sizeLabel(lang, i.size)}, {colorLabel(lang, i.color)} × {i.quantity}
                      </span>
                    </span>
                    <span className="shrink-0">${(i.price * i.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-medium text-gray-950">
                <span>{t('common.total')}</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {serverError && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              aria-disabled={sending || items.length === 0}
              disabled={items.length === 0}
              className={`h-11 rounded-md text-sm font-semibold text-white transition ${
                sending || items.length === 0
                  ? 'cursor-not-allowed bg-gray-500'
                  : 'cursor-pointer bg-gray-950 hover:bg-gray-800'
              }`}
            >
              {sending ? t('common.sending') : t('checkout.confirm', { total: total.toFixed(2) })}
            </button>
            <p className="text-center text-xs text-gray-400">
              {t('checkout.payment')}
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default CheckoutModal
