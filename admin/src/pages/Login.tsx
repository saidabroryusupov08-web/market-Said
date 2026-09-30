import { useState, type FormEvent, type ReactNode } from 'react'
import { Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react'
import { LogoMark } from '../../../shared/Logo'
import { useAuth } from '../lib/auth'
import { inputClass, labelClass, primaryBtn, secondaryBtn } from '../components/ui'

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark className="size-12 text-gray-950" />
          <p className="mt-3 text-lg font-bold tracking-tight text-gray-950">
            cX<span className="font-medium text-gray-500">-shop</span>
            <span className="ml-2 rounded-md bg-gray-950 px-1.5 py-0.5 align-middle text-[10px] font-bold tracking-wide text-white uppercase">
              Admin
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">{children}</div>
      </div>
    </div>
  )
}

// Supabase kalitlari hali qo'yilmagan bo'lsa — nima qilish kerakligi ko'rsatiladi
export function NotConfigured() {
  return (
    <Shell>
      <ShieldAlert className="mb-3 size-6 text-amber-500" />
      <h1 className="text-base font-semibold text-gray-950">Supabase не настроен</h1>
      <p className="mt-2 text-sm text-gray-600">
        Добавьте переменные <code className="rounded bg-gray-100 px-1">VITE_SUPABASE_URL</code> и{' '}
        <code className="rounded bg-gray-100 px-1">VITE_SUPABASE_ANON_KEY</code> в настройки Vercel
        (или в файл <code className="rounded bg-gray-100 px-1">.env.local</code>) и перезапустите.
      </p>
    </Shell>
  )
}

export function NotAdmin({ email }: { email: string }) {
  const { signOut } = useAuth()
  return (
    <Shell>
      <ShieldAlert className="mb-3 size-6 text-red-500" />
      <h1 className="text-base font-semibold text-gray-950">Нет доступа</h1>
      <p className="mt-2 text-sm text-gray-600">
        У аккаунта <b className="break-all">{email}</b> нет прав администратора.
      </p>
      <button type="button" onClick={signOut} className={`${secondaryBtn} mt-5 w-full`}>
        Войти под другим аккаунтом
      </button>
    </Shell>
  )
}

function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!email.trim() || !password) return setError('Введите email и пароль')
    setBusy(true)
    const problem = await signIn(email.trim(), password)
    setBusy(false)
    if (problem) {
      setError(problem)
      setPassword('')
    }
  }

  return (
    <Shell>
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-full bg-gray-100">
          <Lock className="size-4 text-gray-700" />
        </span>
        <div>
          <h1 className="text-base font-semibold text-gray-950">Вход в админ-панель</h1>
          <p className="text-xs text-gray-500">Только для администратора магазина</p>
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoFocus
          autoComplete="username"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
          className={`${inputClass} mb-3`}
        />

        <label className={labelClass} htmlFor="password">
          Пароль
        </label>
        <div className="relative">
          <input
            id="password"
            type={visible ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            className={`${inputClass} pr-10 ${error ? 'border-red-400' : ''}`}
          />
          <button
            type="button"
            aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
            onClick={() => setVisible((v) => !v)}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-700"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={`${primaryBtn} mt-5 w-full`}>
          {busy ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </Shell>
  )
}

export default Login
