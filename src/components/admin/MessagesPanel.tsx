import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  CheckCheck,
  KeyRound,
  Mail,
  MailOpen,
  Monitor,
  RefreshCw,
  ShoppingBag,
  Trash2,
} from 'lucide-react'
import { loadFromStorage, saveToStorage } from '../../utils/storage'

// Vercel'dagi ADMIN_API_KEY shu brauzerda eslab qolinadi, har safar so'ralmasligi uchun
const API_KEY_STORAGE = 'stylehub-admin-api-key'
const REFRESH_MS = 30_000

export type Message = {
  id: number
  created_at: string
  type: string  
  email: string
  device: string | null
  browser: string | null
  language: string | null
  screen: string | null
  cart: { name: string; size: string; color: string; quantity: number; price: number }[]
  total: number
  is_read: boolean
}

type Status = 'need-key' | 'loading' | 'ready' | 'error'

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const gmailLink = (email: string) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`

function MessagesPanel({ onUnreadChange }: { onUnreadChange: (count: number) => void }) {
  const [apiKey, setApiKey] = useState(() => loadFromStorage<string>(API_KEY_STORAGE, ''))
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<Status>(apiKey ? 'loading' : 'need-key')
  const [error, setError] = useState('')

  const request = useCallback(
    (method: string, body?: unknown) =>
      fetch('/api/messages', {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-key': apiKey },
        body: body ? JSON.stringify(body) : undefined,
      }),
    [apiKey],
  )

  // kalit noto'g'ri bo'lsa u o'chiriladi va qayta so'raladi
  const handleFailure = useCallback((res: Response | null) => {
    if (res?.status === 401) {
      saveToStorage(API_KEY_STORAGE, '')
      setApiKey('')
      setStatus('need-key')
      setError('Неверный ключ доступа')
      return
    }
    setStatus('error')
    setError(
      res?.status === 500
        ? 'Хранилище сообщений не настроено на сервере (Supabase / ADMIN_API_KEY в Vercel).'
        : 'Не удалось загрузить сообщения. Проверьте интернет и попробуйте ещё раз.',
    )
  }, [])

  const load = useCallback(async () => {
    if (!apiKey) return
    try {
      const res = await request('GET')
      if (!res.ok) return handleFailure(res)
      setMessages(await res.json())
      setStatus('ready')
      setError('')
    } catch {
      handleFailure(null)
    }
  }, [apiKey, request, handleFailure])

  useEffect(() => {
    if (!apiKey) return
    // birinchi yuklash ham taymer orqali: effekt ichida to'g'ridan setState chaqirilmaydi
    const first = setTimeout(load, 0)
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [apiKey, load])

  useEffect(() => {
    onUnreadChange(messages.filter((m) => !m.is_read).length)
  }, [messages, onUnreadChange])

  // o'zgarish darhol ko'rsatiladi, server xato bersa ro'yxat qayta yuklanadi
  const mutate = async (method: string, body: unknown, optimistic: (list: Message[]) => Message[]) => {
    setMessages(optimistic)
    try {
      const res = await request(method, body)
      if (!res.ok) {
        handleFailure(res)
        // 401 da kalit allaqachon o'chirildi, eski kalit bilan qayta so'rash befoyda
        if (res.status !== 401) load()
      }
    } catch {
      load()
    }
  }

  const toggleRead = (m: Message) =>
    mutate('PATCH', { id: m.id, is_read: !m.is_read }, (list) =>
      list.map((x) => (x.id === m.id ? { ...x, is_read: !m.is_read } : x)),
    )

  const markAllRead = () =>
    mutate('PATCH', { all: true }, (list) => list.map((x) => ({ ...x, is_read: true })))

  const remove = (id: number) =>
    mutate('DELETE', { id }, (list) => list.filter((x) => x.id !== id))

  const changeKey = () => {
    saveToStorage(API_KEY_STORAGE, '')
    setApiKey('')
    setMessages([])
    setStatus('need-key')
    setError('')
  }

  if (status === 'need-key') {
    return (
      <KeyForm
        error={error}
        onSubmit={(key) => {
          saveToStorage(API_KEY_STORAGE, key)
          setApiKey(key)
          setStatus('loading')
          setError('')
        }}
      />
    )
  }

  const unread = messages.filter((m) => !m.is_read).length

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Всего: {messages.length}
          {unread > 0 && <span className="font-medium text-blue-600"> · новых: {unread}</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          {unread > 0 && (
            <button type="button" onClick={markAllRead} className={toolbarBtn}>
              <CheckCheck className="size-3.5" />
              Прочитать все
            </button>
          )}
          <button type="button" onClick={load} className={toolbarBtn}>
            <RefreshCw className={`size-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
            Обновить
          </button>
          <button type="button" onClick={changeKey} className={toolbarBtn}>
            <KeyRound className="size-3.5" />
            Сменить ключ
          </button>
        </div>
      </div>

      {status === 'error' && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {status === 'loading' && messages.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">Загрузка...</p>
      ) : status === 'ready' && messages.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center">
          <Mail className="mb-3 size-10 text-gray-300" strokeWidth={1.5} />
          <p className="text-gray-950">Сообщений пока нет</p>
          <p className="mt-1 text-sm text-gray-500">
            Когда посетитель подпишется в футере сайта, сообщение появится здесь
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((m) => (
            <MessageCard
              key={m.id}
              message={m}
              onToggleRead={() => toggleRead(m)}
              onDelete={() => remove(m.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

const toolbarBtn =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100'

function MessageCard({
  message: m,
  onToggleRead,
  onDelete,
}: {
  message: Message
  onToggleRead: () => void
  onDelete: () => void
}) {
  // o'chirish ikki bosishda: birinchisi so'raydi, 3 soniyada bekor bo'ladi
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [confirming])

  const count = m.cart.reduce((sum, line) => sum + line.quantity, 0)

  return (
    <li
      className={`rounded-xl border bg-white p-4 transition sm:p-5 ${
        m.is_read ? 'border-gray-200' : 'border-blue-200 shadow-[0_0_0_3px_rgba(59,130,246,0.08)]'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {!m.is_read && <span className="size-2 shrink-0 rounded-full bg-blue-500" />}
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
              {m.type === 'subscribe' ? 'Подписка' : m.type}
            </span>
            <span className="text-xs text-gray-400">{formatTime(m.created_at)}</span>
          </div>
          <a
            href={gmailLink(m.email)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 block truncate text-base font-semibold text-gray-950 select-text hover:text-blue-600"
          >
            {m.email}
          </a>
        </div>

        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={onToggleRead}
            aria-label={m.is_read ? 'Отметить как новое' : 'Отметить как прочитанное'}
            title={m.is_read ? 'Отметить как новое' : 'Отметить как прочитанное'}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-950"
          >
            {m.is_read ? <Mail className="size-4" /> : <MailOpen className="size-4" />}
          </button>
          <button
            type="button"
            onClick={() => (confirming ? onDelete() : setConfirming(true))}
            aria-label="Удалить"
            className={`flex h-8 cursor-pointer items-center justify-center gap-1 rounded-full text-xs font-semibold transition ${
              confirming
                ? 'bg-red-600 px-3 text-white hover:bg-red-700'
                : 'w-8 text-red-500 hover:bg-red-50'
            }`}
          >
            {confirming ? 'Удалить?' : <Trash2 className="size-4" />}
          </button>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
        <Monitor className="size-3.5 shrink-0" />
        {[m.device, m.browser].filter(Boolean).join(' · ') || 'Устройство неизвестно'}
        {m.language && <> · {m.language}</>}
        {m.screen && <> · {m.screen}</>}
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

function KeyForm({ error, onSubmit }: { error: string; onSubmit: (key: string) => void }) {
  const [key, setKey] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (key.trim()) onSubmit(key.trim())
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center"
    >
      <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-gray-100">
        <KeyRound className="size-5 text-gray-700" />
      </span>
      <h2 className="text-base font-semibold text-gray-950">Ключ доступа к сообщениям</h2>
      <p className="mt-1 mb-4 text-sm text-gray-500">
        Введите значение ADMIN_API_KEY из настроек Vercel. Его нужно ввести один раз на этом
        устройстве.
      </p>
      <input
        type="password"
        autoFocus
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="Ключ"
        className={`h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.25)] ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      />
      {error && <p className="mt-2 text-left text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        className="mt-4 h-10 w-full cursor-pointer rounded-lg bg-gray-950 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        Открыть сообщения
      </button>
    </form>
  )
}

export default MessagesPanel
