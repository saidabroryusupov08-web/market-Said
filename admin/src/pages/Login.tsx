import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, MailCheck, ShieldAlert, ShieldCheck } from 'lucide-react'
import { LogoMark } from '../../../shared/Logo'
import { useAuth } from '../lib/auth'
import { validatePassword } from '../lib/password'
import { inputClass, labelClass, primaryBtn, secondaryBtn } from '../components/ui'

// Kirishga oid barcha ekranlar: login, parolni tiklash, 2FA kodi, yangi parol.

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

function Heading({ Icon, title, text }: { Icon: typeof Lock; title: string; text: string }) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
        <Icon className="size-4 text-gray-700" />
      </span>
      <div>
        <h1 className="text-base font-semibold text-gray-950">{title}</h1>
        <p className="text-xs text-gray-500">{text}</p>
      </div>
    </div>
  )
}

const ErrorText = ({ children }: { children: ReactNode }) =>
  children ? (
    <p role="alert" className="mt-2 text-xs text-red-600">
      {children}
    </p>
  ) : null

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  autoFocus,
  invalid,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  autoFocus?: boolean
  invalid?: boolean
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} pr-10 ${invalid ? 'border-red-400' : ''}`}
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
  )
}

// 6 xonali kod (Google Authenticator va h.k.)
export function CodeInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
}) {
  return (
    <input
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus={autoFocus}
      maxLength={6}
      placeholder="000000"
      aria-label="Код из приложения"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      className={`${inputClass} h-12 text-center font-mono text-2xl tracking-[0.5em]`}
    />
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
      <button type="button" onClick={() => signOut()} className={`${secondaryBtn} mt-5 w-full`}>
        Войти под другим аккаунтом
      </button>
    </Shell>
  )
}

function ForgotPassword({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Введите корректный email')
    setBusy(true)
    const problem = await requestPasswordReset(email.trim())
    setBusy(false)
    if (problem) setError(problem)
    else setSent(true)
  }

  return (
    <Shell>
      {sent ? (
        <>
          <Heading Icon={MailCheck} title="Проверьте почту" text="Письмо может прийти через 1–2 минуты" />
          <p className="text-sm text-gray-600">
            Если аккаунт <b className="break-all">{email.trim()}</b> существует, мы отправили на него
            ссылку для смены пароля.
          </p>
        </>
      ) : (
        <form onSubmit={submit} noValidate>
          <Heading Icon={KeyRound} title="Восстановление пароля" text="Пришлём ссылку на email" />
          <label className={labelClass} htmlFor="reset-email">
            Email администратора
          </label>
          <input
            id="reset-email"
            type="email"
            autoFocus
            autoComplete="username"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            className={inputClass}
          />
          <ErrorText>{error}</ErrorText>
          <button type="submit" disabled={busy} className={`${primaryBtn} mt-5 w-full`}>
            {busy ? 'Отправка...' : 'Отправить ссылку'}
          </button>
        </form>
      )}
      <button
        type="button"
        onClick={onBack}
        className="mt-4 inline-flex cursor-pointer items-center gap-1 text-xs text-gray-500 hover:text-gray-950"
      >
        <ArrowLeft className="size-3.5" />
        Назад ко входу
      </button>
    </Shell>
  )
}

function Login({ notice }: { notice?: string }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [forgot, setForgot] = useState(false)

  if (forgot) return <ForgotPassword initialEmail={email} onBack={() => setForgot(false)} />

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
      <Heading Icon={Lock} title="Вход в админ-панель" text="Только для администратора магазина" />

      {notice && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{notice}</p>
      )}

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

        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium text-gray-500" htmlFor="password">
            Пароль
          </label>
          <button
            type="button"
            onClick={() => setForgot(true)}
            className="cursor-pointer text-xs text-gray-500 hover:text-gray-950 hover:underline"
          >
            Забыли пароль?
          </button>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          value={password}
          invalid={!!error}
          onChange={(v) => {
            setPassword(v)
            setError('')
          }}
        />
        <ErrorText>{error}</ErrorText>

        <button type="submit" disabled={busy} className={`${primaryBtn} mt-5 w-full`}>
          {busy ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </Shell>
  )
}

export function MfaChallenge({ email }: { email: string }) {
  const { verifyMfa, signOut } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return setError('Введите 6 цифр из приложения')
    setBusy(true)
    const problem = await verifyMfa(code)
    setBusy(false)
    if (problem) {
      setError(problem)
      setCode('')
    }
  }

  return (
    <Shell>
      <Heading
        Icon={ShieldCheck}
        title="Двухфакторная проверка"
        text="Код из Google Authenticator (или аналога)"
      />
      <p className="mb-4 text-xs text-gray-500">
        Аккаунт: <b className="break-all text-gray-700">{email}</b>
      </p>
      <form onSubmit={submit} noValidate>
        <CodeInput
          autoFocus
          value={code}
          onChange={(v) => {
            setCode(v)
            setError('')
          }}
        />
        <ErrorText>{error}</ErrorText>
        <button type="submit" disabled={busy} className={`${primaryBtn} mt-5 w-full`}>
          {busy ? 'Проверка...' : 'Подтвердить'}
        </button>
      </form>
      <button
        type="button"
        onClick={() => signOut()}
        className="mt-4 inline-flex cursor-pointer items-center gap-1 text-xs text-gray-500 hover:text-gray-950"
      >
        <ArrowLeft className="size-3.5" />
        Войти под другим аккаунтом
      </button>
    </Shell>
  )
}

// parolni tiklash xatidagi havola shu sahifani ochadi
export function ResetPassword({ email }: { email: string }) {
  const { completeRecovery, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const problem = validatePassword(password, confirm)
    if (problem) return setError(problem)
    setBusy(true)
    const failed = await completeRecovery(password)
    setBusy(false)
    if (failed) setError(failed)
  }

  return (
    <Shell>
      <Heading Icon={KeyRound} title="Новый пароль" text={email} />
      <form onSubmit={submit} noValidate>
        <label className={labelClass} htmlFor="new-password">
          Новый пароль (минимум 8 символов, буквы и цифры)
        </label>
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(v) => {
            setPassword(v)
            setError('')
          }}
        />
        <label className={`${labelClass} mt-3`} htmlFor="confirm-password">
          Повторите пароль
        </label>
        <PasswordInput
          id="confirm-password"
          autoComplete="new-password"
          value={confirm}
          onChange={(v) => {
            setConfirm(v)
            setError('')
          }}
        />
        <ErrorText>{error}</ErrorText>
        <button type="submit" disabled={busy} className={`${primaryBtn} mt-5 w-full`}>
          {busy ? 'Сохранение...' : 'Сохранить и войти'}
        </button>
      </form>
      <button
        type="button"
        onClick={() => {
          history.replaceState(null, '', '/')
          signOut()
        }}
        className="mt-4 inline-flex cursor-pointer items-center gap-1 text-xs text-gray-500 hover:text-gray-950"
      >
        <ArrowLeft className="size-3.5" />
        Отмена
      </button>
    </Shell>
  )
}

export default Login
