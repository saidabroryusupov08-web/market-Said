import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, ImageIcon, Mail, MapPin, MessageSquare, Phone, Search, ShoppingBag, Trash2 } from 'lucide-react'
import { resolveImage } from '../../../shared/images'
import { createMatcher } from '../../../shared/search'
import { useAdminData } from '../lib/data'
import { ORDER_STATUSES, type Order, type OrderStatus } from '../lib/orders'
import { colorLabel, sizeLabel } from '../../../shared/dataLabels'
import { useT } from '../i18n'
import { formatDateTime } from '../lib/format'
import { ConfirmDialog, Modal, useToast } from '../components/ui'
import { alertBadge, glassChip, inputClass, labelClass, primaryBtn, secondaryBtn } from '../components/styles'

const statusInfo = (status: OrderStatus) =>
  ORDER_STATUSES.find((s) => s.value === status) ?? ORDER_STATUSES[0]
const statusKey = (status: OrderStatus) => `status.${status}` as const

export function StatusBadge({ status }: { status: OrderStatus }) {
  const info = statusInfo(status)
  const { t } = useT()
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset ${info.className}`}>
      {t(statusKey(status))}
    </span>
  )
}

const itemCount = (o: Order) => o.items.reduce((sum, i) => sum + i.quantity, 0)

// Excel to'g'ri ochishi uchun: ; ajratgich, BOM, qo'shtirnoqlar ikkilanadi
type TFn = ReturnType<typeof useT>['t']
function toCsv(list: Order[], t: TFn) {
  const cell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const header = ['№', t('orders.colDate'), t('orders.colStatus'), t('orders.name'), t('orders.phone'), 'Email', t('orders.address'), t('orders.colItems'), t('orders.colTotal'), t('orders.comment'), t('orders.note')]
  const rows = list.map((o) => [
    o.id,
    formatDateTime(o.created_at),
    t(statusKey(o.status)),
    o.customer_name,
    o.phone,
    o.email,
    o.address,
    o.items.map((i) => `${i.name} (${i.size}, ${i.color}) × ${i.quantity}`).join('; '),
    Number(o.total).toFixed(2),
    o.comment,
    o.admin_note,
  ])
  return '﻿' + [header, ...rows].map((row) => row.map(cell).join(';')).join('\r\n')
}

function OrderDetails({ order, onClose }: { order: Order; onClose: () => void }) {
  const { updateOrder, deleteOrder } = useAdminData()
  const showToast = useToast()
  const { t, lang } = useT()
  const [note, setNote] = useState(order.admin_note ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const setStatus = async (status: OrderStatus) => {
    if (status === order.status || busy) return
    setBusy(true)
    const error = await updateOrder(order.id, { status })
    setBusy(false)
    showToast(error ?? t('orders.statusSet', { status: t(statusKey(status)) }), error ? 'error' : 'success')
  }

  const saveNote = async () => {
    const error = await updateOrder(order.id, { admin_note: note.trim() || null })
    showToast(error ?? t('orders.noteSaved'), error ? 'error' : 'success')
  }

  const remove = async () => {
    setConfirmDelete(false)
    const error = await deleteOrder(order.id)
    if (error) return showToast(error, 'error')
    showToast(t('orders.deleted', { id: order.id }))
    onClose()
  }

  return (
    <Modal title={t('orders.title', { id: order.id })} onClose={onClose}>
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-gray-500">{formatDateTime(order.created_at)}</span>
          <StatusBadge status={order.status} />
        </div>

        <div>
          <span className={labelClass}>{t('orders.orderStatus')}</span>
          <div className="flex flex-wrap gap-1.5">
            {ORDER_STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                aria-pressed={order.status === s.value}
                disabled={busy}
                onClick={() => setStatus(s.value)}
                className={`cursor-pointer rounded-full disabled:cursor-wait disabled:opacity-60 border px-3 py-1 text-xs font-medium transition ${
                  order.status === s.value
                    ? glassChip
                    : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t(statusKey(s.value))}
              </button>
            ))}
          </div>
        </div>

        {/* mijoz ma'lumotini nusxalash mumkin bo'lishi uchun select-text */}
        <div className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-4 text-sm select-text sm:grid-cols-2">
          <p className="font-semibold text-gray-950 sm:col-span-2">{order.customer_name}</p>
          <a href={`tel:${order.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
            <Phone className="size-4 shrink-0 text-gray-400" />
            {order.phone}
          </a>
          {order.email && (
            <a href={`mailto:${order.email}`} className="flex min-w-0 items-center gap-2 text-gray-700 hover:text-blue-600">
              <Mail className="size-4 shrink-0 text-gray-400" />
              <span className="truncate">{order.email}</span>
            </a>
          )}
          <p className="flex items-start gap-2 text-gray-700 sm:col-span-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-gray-400" />
            {order.address}
          </p>
          {order.comment && (
            <p className="flex items-start gap-2 text-gray-700 sm:col-span-2">
              <MessageSquare className="mt-0.5 size-4 shrink-0 text-gray-400" />
              {order.comment}
            </p>
          )}
        </div>

        <div>
          <span className={labelClass}>{t('orders.itemsCount', { count: itemCount(order) })}</span>
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {order.items.map((item, i) => {
              const src = resolveImage(item.image)
              return (
                <li key={i} className="flex items-center gap-3 p-3">
                  <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-gray-300">
                    {src ? <img src={src} alt="" className="size-full object-cover" /> : <ImageIcon className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-950">{item.name}</span>
                    <span className="block text-xs text-gray-500">
                      {sizeLabel(lang, item.size)}, {colorLabel(lang, item.color)} · ${Number(item.price).toFixed(2)} × {item.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-gray-950">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-2 flex justify-between px-1 text-base font-semibold text-gray-950">
            <span>{t('orders.total')}</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="order-note">
            {t('orders.noteLabel')}
          </label>
          <textarea
            id="order-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('orders.notePlaceholder')}
            className={`${inputClass} h-auto py-2`}
          />
          <button
            type="button"
            onClick={saveNote}
            disabled={(order.admin_note ?? '') === note.trim()}
            className={`${secondaryBtn} mt-2`}
          >
            {t('orders.saveNote')}
          </button>
        </div>

        {(order.device || order.browser) && (
          <p className="text-xs text-gray-400">
            {t('orders.device', { device: [order.device, order.browser].filter(Boolean).join(' · ') })}
          </p>
        )}

        <div className="flex justify-between gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className={`${secondaryBtn} h-10 text-red-600 hover:bg-red-50`}
          >
            <Trash2 className="size-4" />
            {t('common.delete')}
          </button>
          <button type="button" onClick={onClose} className={primaryBtn}>
            {t('common.done')}
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          withPassword
          message={t('orders.deleteConfirm', { id: order.id })}
          onConfirm={remove}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </Modal>
  )
}

function Orders() {
  const { orders, ordersLoaded } = useAdminData()
  const { t } = useT()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const statusFilter = (params.get('status') as OrderStatus | null) ?? null
  const openId = Number(params.get('id'))
  const opened = orders.find((o) => o.id === openId)

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const o of orders) map[o.status] = (map[o.status] ?? 0) + 1
    return map
  }, [orders])

  const visible = useMemo(() => {
    const q = search.trim().replace(/^#/, '')
    const matches = createMatcher(q)
    return orders.filter(
      (o) =>
        (!statusFilter || o.status === statusFilter) &&
        (!q ||
          String(o.id) === q ||
          o.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '') || '—') ||
          matches([o.customer_name, o.address, o.email ?? '', o.comment ?? '', ...o.items.map((i) => i.name)].join(' '))),
    )
  }, [orders, search, statusFilter])

  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([toCsv(visible, t)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `cx-shop-zakazy-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const tabs: { value: OrderStatus | null; label: string; count: number }[] = [
    { value: null, label: t('common.all'), count: orders.length },
    ...ORDER_STATUSES.map((s) => ({ value: s.value, label: t(statusKey(s.value)), count: counts[s.value] ?? 0 })),
  ]

  return (
    <div>
      <div className="mb-4 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-gray-200 [scrollbar-width:none]">
        {tabs.map((tab) => (
          <button
            key={tab.value ?? 'all'}
            type="button"
            onClick={() => updateParam('status', tab.value)}
            className={`-mb-px flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
              statusFilter === tab.value
                ? 'border-gray-950 text-gray-950'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold ${
                tab.value === 'new' && tab.count > 0 ? alertBadge : 'bg-gray-100 text-gray-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder={t('orders.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="button" onClick={exportCsv} disabled={visible.length === 0} className={`${secondaryBtn} h-10`}>
          <Download className="size-4" />
          CSV
        </button>
      </div>

      {!ordersLoaded ? (
        <p className="py-16 text-center text-sm text-gray-400">{t('common.loading')}</p>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center">
          <ShoppingBag className="mb-3 size-10 text-gray-300" strokeWidth={1.5} />
          <p className="text-gray-950">{orders.length === 0 ? t('orders.empty') : t('common.nothingFound')}</p>
          {orders.length === 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {t('orders.emptyHint')}
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="hidden w-full text-sm md:table">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3">№</th>
                <th className="px-4 py-3">{t('orders.colDate')}</th>
                <th className="px-4 py-3">{t('orders.colClient')}</th>
                <th className="px-4 py-3">{t('orders.colItems')}</th>
                <th className="px-4 py-3 text-right">{t('orders.colTotal')}</th>
                <th className="px-4 py-3">{t('orders.colStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => updateParam('id', String(o.id))}
                  className={`cursor-pointer transition hover:bg-gray-50 ${o.status === 'new' ? 'bg-rose-50/40' : ''}`}
                >
                  <td className="px-4 py-3 font-semibold text-gray-950">#{o.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatDateTime(o.created_at)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-950">{o.customer_name}</p>
                    <p className="text-xs text-gray-500">{o.phone}</p>
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-xs text-gray-500">
                    <p className="truncate">{o.items.map((i) => i.name).join(', ')}</p>
                    <p>{t('common.pcs', { count: itemCount(o) })}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-gray-950">
                    ${Number(o.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-gray-100 md:hidden">
            {visible.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => updateParam('id', String(o.id))}
                  className="flex w-full cursor-pointer items-start justify-between gap-3 p-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-950">
                      #{o.id} · {o.customer_name}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {formatDateTime(o.created_at)} · {t('common.pcs', { count: itemCount(o) })}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-gray-950">${Number(o.total).toFixed(2)}</span>
                    <StatusBadge status={o.status} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {opened && <OrderDetails key={opened.id} order={opened} onClose={() => updateParam('id', null)} />}
    </div>
  )
}

export default Orders
