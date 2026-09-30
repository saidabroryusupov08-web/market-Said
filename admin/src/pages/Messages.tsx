import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CheckCheck,
  Download,
  Mail,
  MailOpen,
  Monitor,
  Search,
  ShoppingBag,
  Trash2,
} from 'lucide-react'
import { formatDateTime } from '../lib/format'
import { useAdminData, type Message } from '../lib/data'
import { ConfirmDialog, useToast } from '../components/ui'
import { iconBtn, inputClass, secondaryBtn } from '../components/styles'

const gmailLink = (email: string) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`

// Excel to'g'ri ochishi uchun: ; ajratgich, BOM, qo'shtirnoqlar ikkilanadi
function toCsv(list: Message[]) {
  const cell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const header = ['Дата', 'Email', 'Устройство', 'Браузер', 'Язык', 'Экран', 'Корзина', 'Сумма', 'Прочитано']
  const rows = list.map((m) => [
    formatDateTime(m.created_at),
    m.email,
    m.device,
    m.browser,
    m.language,
    m.screen,
    m.cart.map((l) => `${l.name} (${l.size}, ${l.color}) × ${l.quantity}`).join('; '),
    Number(m.total).toFixed(2),
    m.is_read ? 'да' : 'нет',
  ])
  return '﻿' + [header, ...rows].map((row) => row.map(cell).join(';')).join('\r\n')
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function MessageCard({
  message: m,
  onToggleRead,
  onDelete,
}: {
  message: Message
  onToggleRead: () => void
  onDelete: () => void
}) {
  const count = m.cart.reduce((sum, line) => sum + line.quantity, 0)

  return (
    <li
      className={`rounded-xl border bg-white p-4 transition sm:p-5 ${
        m.is_read ? 'border-gray-200' : 'border-blue-200 shadow-[0_0_0_3px_rgba(59,130,246,0.08)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {!m.is_read && <span className="size-2 shrink-0 rounded-full bg-blue-500" />}
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
              {m.type === 'subscribe' ? 'Подписка' : m.type}
            </span>
            <span className="text-xs text-gray-400">{formatDateTime(m.created_at)}</span>
          </div>
          <a
            href={gmailLink(m.email)}
            target="_blank"
            rel="noopener noreferrer"
            title="Написать в Gmail"
            className="mt-1.5 block truncate text-base font-semibold text-gray-950 select-text hover:text-blue-600"
          >
            {m.email}
          </a>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onToggleRead}
            aria-label={m.is_read ? 'Отметить как новое' : 'Отметить как прочитанное'}
            title={m.is_read ? 'Отметить как новое' : 'Отметить как прочитанное'}
            className={iconBtn}
          >
            {m.is_read ? <Mail className="size-4" /> : <MailOpen className="size-4" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Удалить"
            title="Удалить"
            className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
        <Monitor className="size-3.5 shrink-0" />
        {[m.device, m.browser, m.language, m.screen].filter(Boolean).join(' · ') ||
          'Устройство неизвестно'}
      </p>

      <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm">
        {m.cart.length === 0 ? (
          <p className="flex items-center gap-1.5 text-gray-400">
            <ShoppingBag className="size-3.5" />
            Корзина пуста
          </p>
        ) : (
          <>
            <p className="mb-1.5 flex items-center gap-1.5 font-medium text-gray-700">
              <ShoppingBag className="size-3.5" />
              Корзина: {count} шт. · ${Number(m.total).toFixed(2)}
            </p>
            <ul className="flex flex-col gap-1 text-gray-600">
              {m.cart.map((line, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {line.name}
                    <span className="text-gray-400">
                      {' '}
                      — {[line.size, line.color].filter(Boolean).join(', ')} × {line.quantity}
                    </span>
                  </span>
                  <span className="shrink-0">${(line.price * line.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </li>
  )
}

function Messages() {
  const { messages, messagesLoaded, unread, setRead, markAllRead, deleteMessage } = useAdminData()
  const showToast = useToast()
  const [params, setParams] = useSearchParams()
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [toDelete, setToDelete] = useState<Message | null>(null)
  // qidiruv manzilda (?q=): global qidiruvdan yoki bosh sahifadan kelganda ham to'ldiriladi
  const search = params.get('q') ?? ''

  const setSearch = (value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set('q', value)
    else next.delete('q')
    setParams(next, { replace: true })
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return messages.filter(
      (m) => (!onlyUnread || !m.is_read) && (!q || m.email.toLowerCase().includes(q)),
    )
  }, [messages, search, onlyUnread])

  const report = (error: string | null) => error && showToast(error, 'error')

  const confirmDelete = async () => {
    if (!toDelete) return
    const id = toDelete.id
    setToDelete(null)
    const error = await deleteMessage(id)
    showToast(error ?? 'Сообщение удалено', error ? 'error' : 'success')
  }

  const exportCsv = () => {
    const date = new Date().toISOString().slice(0, 10)
    download(`cx-shop-podpischiki-${date}.csv`, toCsv(visible))
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Поиск по email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-gray-300 bg-white p-0.5 text-sm">
            {[
              { value: false, label: 'Все' },
              { value: true, label: `Новые${unread ? ` (${unread})` : ''}` },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setOnlyUnread(opt.value)}
                className={`cursor-pointer rounded-md px-3 py-1.5 font-medium transition ${
                  onlyUnread === opt.value ? 'bg-gray-950 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={async () => report(await markAllRead())}
              className={secondaryBtn}
            >
              <CheckCheck className="size-4" />
              Прочитать все
            </button>
          )}
          <button
            type="button"
            onClick={exportCsv}
            disabled={visible.length === 0}
            className={secondaryBtn}
          >
            <Download className="size-4" />
            CSV
          </button>
        </div>
      </div>

      {!messagesLoaded ? (
        <p className="py-16 text-center text-sm text-gray-400">Загрузка...</p>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center">
          <Mail className="mb-3 size-10 text-gray-300" strokeWidth={1.5} />
          <p className="text-gray-950">
            {messages.length === 0 ? 'Сообщений пока нет' : 'Ничего не найдено'}
          </p>
          {messages.length === 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Когда посетитель подпишется в футере сайта, сообщение появится здесь
            </p>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((m) => (
            <MessageCard
              key={m.id}
              message={m}
              onToggleRead={async () => report(await setRead(m.id, !m.is_read))}
              onDelete={() => setToDelete(m)}
            />
          ))}
        </ul>
      )}

      {toDelete && (
        <ConfirmDialog
          withPassword
          message={`Удалить сообщение от ${toDelete.email}?`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}

export default Messages
