import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, KeyRound, Lock, MailCheck, ShieldAlert, ShieldCheck } from 'lucide-react'
import { LanguageSwitcher } from '../../../shared/i18n'
import { LogoMark } from '../../../shared/Logo'
import { useT } from '../i18n'
import { useAuth } from '../lib/auth'
import { validatePassword } from '../lib/password'
import PasswordInput from '../components/PasswordInput'
import { glassBadge, inputClass, labelClass, primaryBtn, secondaryBtn } from '../components/styles'


// Kirishga oid barcha ekranlar: login, parolni tiklash, 2FA kodi, yangi parol.

// tarjimadagi {email} kabi joylarga element qo'yadi (qalin email, <code> va h.k.)
function rich(text: string, parts: Record<string, ReactNode>) {
  return text.split(/(\{\w+\})/).map((piece, i) => {
    const key = piece.match(/^\{(\w+)\}$/)?.[1]
    return <span key={i}>{key && key in parts ? parts[key] : piece}</span>
  })
}

function Shell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useT()
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 p-4">
      {/* alohida burchak konteyneri: tugmaning ichki "relative" klassi "absolute"ni bosib qo'ymasin
          (aks holda telefonda u kartochka yonida, ekran chetida qolib ketardi) */}
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-10">
        <LanguageSwitcher lang={lang} setLang={setLang} label={t('common.language')} />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark className="size-16" />
          <p className="mt-3 text-lg font-extrabold tracking-tight">
            <span className="bg-gradient-to-br from-blue-700 to-rose-600 bg-clip-text text-transparent">
              cX
            </span>
            <span className="font-semibold text-slate-500">-shop</span>
            <span className={`ml-2 rounded-md px-1.5 py-0.5 align-middle text-[10px] font-bold tracking-wide uppercase ${glassBadge}`}>
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
  const { t } = useT()
  return (
    <input
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus={autoFocus}
      maxLength={6}
      placeholder="000000"
      aria-label={t('login.codeLabel')}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      className={`${inputClass} h-12 text-center font-mono text-2xl tracking-[0.5em]`}
    />
  )
}

// Supabase kalitlari hali qo'yilmagan bo'lsa — nima qilish kerakligi ko'rsatiladi
export function NotConfigured() {
  const { t } = useT()
  const code = (text: string) => <code className="rounded bg-gray-100 px-1">{text}</code>
  // internetda tashrifchiga texnik yo'riqnoma emas, oddiy xabar ko'rsatiladi
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname))
    return (
      <Shell>
        <ShieldAlert className="mb-3 size-6 text-amber-500" />
        <h1 className="text-base font-semibold text-gray-950">{t('login.notReadyTitle')}</h1>
        <p className="mt-2 text-sm text-gray-600">{t('login.notReadyText')}</p>
      </Shell>
    )
  return (
    <Shell>
      <ShieldAlert className="mb-3 size-6 text-amber-500" />
      <h1 className="text-base font-semibold text-gray-950">{t('auth.notConfigured')}</h1>
      <p className="mt-2 text-sm text-gray-600">
        {rich(t('login.notConfiguredText'), {
          url: code('VITE_SUPABASE_URL'),
          key: code('VITE_SUPABASE_ANON_KEY'),
          file: code('.env.local'),
        })}
      </p>
    </Shell>
  )
}

export function NotAdmin({ email }: { email: string }) {
  const { signOut } = useAuth()
  const { t } = useT()
  return (
    <Shell>
      <ShieldAlert className="mb-3 size-6 text-red-500" />
      <h1 className="text-base font-semibold text-gray-950">{t('auth.noAccess')}</h1>
      <p className="mt-2 text-sm text-gray-600">
        {rich(t('login.notAdmin'), { email: <b className="break-all">{email}</b> })}
      </p>
      <button type="button" onClick={() => signOut()} className={`${secondaryBtn} mt-5 w-full`}>
        {t('login.otherAccount')}
      </button>
    </Shell>
  )
}

function ForgotPassword({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const { requestPasswordReset } = useAuth()
  const { t } = useT()
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('login.invalidEmail'))
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
          <Heading Icon={MailCheck} title={t('login.checkMail')} text={t('login.checkMailHint')} />
          <p className="text-sm text-gray-600">
            {rich(t('login.resetSent'), { email: <b className="break-all">{email.trim()}</b> })}
          </p>
        </>
      ) : (
        <form onSubmit={submit} noValidate>
          <Heading Icon={KeyRound} title={t('login.resetTitle')} text={t('login.resetHint')} />
          <label className={labelClass} htmlFor="reset-email">
            {t('login.adminEmail')}
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
            {busy ? t('common.sending') : t('login.sendLink')}
          </button>
        </form>
      )}
      <button
        type="button"
        onClick={onBack}
        className="mt-4 inline-flex cursor-pointer items-center gap-1 text-xs text-gray-500 hover:text-gray-950"
      >
        <ArrowLeft className="size-3.5" />
        {t('login.backToLogin')}
      </button>
    </Shell>
  )
}

function Login({ notice }: { notice?: string }) {
  const { signIn } = useAuth()
  const { t } = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [forgot, setForgot] = useState(false)

  if (forgot) return <ForgotPassword initialEmail={email} onBack={() => setForgot(false)} />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!email.trim() || !password) return setError(t('login.enterEmailPassword'))
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
      <Heading Icon={Lock} title={t('login.title')} text={t('login.subtitle')} />

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
            {t('login.password')}
          </label>
          <button
            type="button"
            onClick={() => setForgot(true)}
            className="cursor-pointer text-xs text-gray-500 hover:text-gray-950 hover:underline"
          >
            {t('login.forgot')}
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
          {busy ? t('login.signingIn') : t('login.signIn')}
        </button>
      </form>
    </Shell>
  )
}

export function MfaChallenge({ email }: { email: string }) {
  const { verifyMfa, signOut } = useAuth()
  const { t } = useT()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (code.length !== 6) return setError(t('login.enterCode'))
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
        title={t('login.mfaTitle')}
        text={t('login.mfaHint')}
      />
      <p className="mb-4 text-xs text-gray-500">
        {rich(t('login.account'), { email: <b className="break-all text-gray-700">{email}</b> })}
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
          {busy ? t('common.checking') : t('common.confirm')}
        </button>
      </form>
      <button
        type="button"
        onClick={() => signOut()}
        className="mt-4 inline-flex cursor-pointer items-center gap-1 text-xs text-gray-500 hover:text-gray-950"
      >
        <ArrowLeft className="size-3.5" />
        {t('login.otherAccount')}
      </button>
    </Shell>
  )
}

// parolni tiklash xatidagi havola shu sahifani ochadi
export function ResetPassword({ email }: { email: string }) {
  const { completeRecovery, signOut } = useAuth()
  const { t } = useT()
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
      <Heading Icon={KeyRound} title={t('login.newPassword')} text={email} />
      <form onSubmit={submit} noValidate>
        <label className={labelClass} htmlFor="new-password">
          {t('login.newPasswordRule')}
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
          {t('login.repeatPassword')}
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
          {busy ? t('common.saving') : t('login.saveAndEnter')}
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
        {t('common.cancel')}
      </button>
    </Shell>
  )
}

export default Login
