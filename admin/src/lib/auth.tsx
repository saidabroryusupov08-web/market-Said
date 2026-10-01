import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createClient, type AuthError, type Session } from '@supabase/supabase-js'
import { supabase, supabaseAnonKey, supabaseUrl } from '../../../shared/supabase'

// Kirish Supabase Auth orqali (email + parol, ixtiyoriy 2FA). Kirgan odam admin ekani bazadagi
// public.is_admin() bilan tekshiriladi — admins jadvalida bo'lmasa (yoki 2FA yoqilgan-u kod
// kiritilmagan bo'lsa) panel ochilmaydi. Asl himoya baribir bazadagi RLS'da.

type AuthState =
  | { status: 'loading' }
  | { status: 'not-configured' }
  | { status: 'signed-out'; notice?: string }
  | { status: 'mfa-required'; email: string }
  | { status: 'recovery'; email: string }
  | { status: 'not-admin'; email: string }
  | { status: 'admin'; session: Session; mfaEnabled: boolean }

export type TotpEnrollment = { factorId: string; qrCode: string; secret: string }

type Result = Promise<string | null>

type AuthContextValue = {
  state: AuthState
  signIn: (email: string, password: string) => Result
  signOut: (notice?: string) => Promise<void>
  verifyMfa: (code: string) => Result
  requestPasswordReset: (email: string) => Result
  completeRecovery: (password: string) => Result
  changePassword: (current: string, next: string) => Result
  startTotpEnrollment: () => Promise<TotpEnrollment | { error: string }>
  confirmTotpEnrollment: (factorId: string, code: string) => Result
  disableTotp: () => Result
  // muhim amallardan oldin parolni qayta tekshirish
  verifyPassword: (password: string) => Result
  needsPassword: () => boolean
  updateProfile: (profile: { name: string; avatarUrl: string | null }) => Result
}

// admin ko'rsatadigan ism va rasm (bo'lmasa email)
// eslint-disable-next-line react-refresh/only-export-components
export function profileOf(session: Session) {
  const meta = (session.user.user_metadata ?? {}) as { full_name?: string; avatar_url?: string }
  const email = session.user.email ?? ''
  return {
    email,
    name: meta.full_name?.trim() || '',
    displayName: meta.full_name?.trim() || email,
    avatarUrl: meta.avatar_url || null,
  }
}

// parol to'g'ri kiritilgach, shuncha vaqt ichida muhim amallar uchun qayta so'ralmaydi
const REAUTH_GRACE_MS = 5 * 60 * 1000

const AuthContext = createContext<AuthContextValue | null>(null)

// parolni tiklash xatidagi havola shu manzilga olib keladi (Supabase -> URL Configuration'da ruxsat)
const RESET_PATH = '/reset'
// shuncha vaqt harakat bo'lmasa avtomatik chiqiladi (ochiq qolgan kompyuter uchun)
const IDLE_LIMIT_MS = 30 * 60 * 1000
const ACTIVITY_KEY = 'cx-admin-last-activity'

function readLastActivity() {
  try {
    return Number(localStorage.getItem(ACTIVITY_KEY)) || 0
  } catch {
    return 0
  }
}
function writeLastActivity(time: number) {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(time))
  } catch {
    // saqlab bo'lmasa, taymer faqat shu tab'da ishlaydi
  }
}

// Supabase xatosini admin tushunadigan matnga aylantirish
function describe(error: AuthError | null, fallback: string): string | null {
  if (!error) return null
  console.error(error)
  if (error.status === 429) return 'Слишком много попыток. Подождите немного и попробуйте снова.'
  if (error.code === 'same_password') return 'Новый пароль должен отличаться от текущего'
  if (error.code === 'weak_password') return 'Пароль слишком простой'
  if (/fetch|network/i.test(error.message)) return 'Нет связи с сервером. Проверьте интернет.'
  return fallback
}

async function resolveState(session: Session | null): Promise<AuthState> {
  const db = supabase!
  if (!session) return { status: 'signed-out' }
  const email = session.user.email ?? ''

  // 2FA yoqilgan, lekin shu sessiyada kod hali kiritilmagan. Parolni tiklash havolasi ham
  // 2FA'ni chetlab o'tmaydi (Supabase ham aal2'siz parol o'zgartirishga ruxsat bermaydi)
  const { data: aal } = await db.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') return { status: 'mfa-required', email }

  if (location.pathname.startsWith(RESET_PATH)) return { status: 'recovery', email }

  const { data, error } = await db.rpc('is_admin')
  if (error || data !== true) return { status: 'not-admin', email }
  // sessiya darajasi (aal2) 2FA o'chirilgandan keyin ham qolishi mumkin, shuning uchun
  // "yoqilganmi" degan savolga tasdiqlangan faktor bor-yo'qligi javob beradi (serverdan yangi)
  const { data: factors } = await db.auth.mfa.listFactors()
  return { status: 'admin', session, mfaEnabled: (factors?.totp.length ?? 0) > 0 }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(
    supabase ? { status: 'loading' } : { status: 'not-configured' },
  )
  const noticeRef = useRef<string | undefined>(undefined)
  // parol to'g'ri kiritilgan vaqt (muhim amallar uchun 5 daqiqalik "ishonch")
  const lastVerifiedRef = useRef(0)

  const refresh = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.auth.getSession()
    const next = await resolveState(data.session)
    const notice = noticeRef.current
    noticeRef.current = undefined
    // boshqa tabda chiqilgan yoki sessiya tugagan bo'lsa ham "ishonch" bekor bo'ladi
    if (next.status !== 'admin') lastVerifiedRef.current = 0
    setState((prev) => {
      if (next.status !== 'signed-out') return next
      // chiqish sababi ("сессия истекла") keyingi hodisalarda yo'qolib qolmasligi uchun
      if (notice) return { status: 'signed-out', notice }
      return prev.status === 'signed-out' ? prev : next
    })
  }, [])

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    const apply = () => {
      if (!cancelled) refresh()
    }

    // sahifa uzoq yopiq turib qayta ochilsa ham harakatsizlik muddati hisobga olinadi
    const last = readLastActivity()
    if (last && Date.now() - last > IDLE_LIMIT_MS && !location.pathname.startsWith(RESET_PATH)) {
      noticeRef.current = 'Сессия завершена из-за бездействия. Войдите снова.'
      supabase.auth.signOut({ scope: 'local' }).then(apply)
    } else {
      apply()
    }

    // boshqa tabda chiqilsa, sessiya yangilansa, 2FA tasdiqlansa — holat qayta hisoblanadi
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION') return
      // Supabase callback ichida boshqa so'rov yuborish tavsiya etilmaydi — keyingi tick'da
      setTimeout(apply, 0)
    })
    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [refresh])

  const signOut = useCallback(async (notice?: string) => {
    // chiqqanda "ishonch" bekor bo'ladi: keyingi kirgan odamdan parol yana so'raladi
    lastVerifiedRef.current = 0
    // scope 'local': faqat shu brauzerdan chiqiladi
    await supabase?.auth.signOut({ scope: 'local' })
    setState({ status: 'signed-out', notice })
  }, [])

  // ----- harakatsizlikda avtomatik chiqish -----
  const isAdmin = state.status === 'admin'
  useEffect(() => {
    if (!isAdmin) return
    let last = Date.now()
    let lastWritten = last
    writeLastActivity(last)
    const onActivity = () => {
      const now = Date.now()
      last = now
      // localStorage'ga har harakatda emas, oxirgi YOZUVDAN 15 soniya o'tgach yoziladi
      // (oxirgi harakatdan emas: aks holda uzluksiz ishlaganda hech qachon yozilmay,
      // sahifa yangilanganda faol admin "harakatsiz" deb chiqarib yuborilardi)
      if (now - lastWritten > 15_000) {
        writeLastActivity(now)
        lastWritten = now
      }
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))
    const timer = setInterval(() => {
      // boshqa tabdagi harakat ham hisobga olinadi
      const latest = Math.max(last, readLastActivity())
      if (Date.now() - latest > IDLE_LIMIT_MS)
        signOut('Сессия завершена из-за бездействия. Войдите снова.')
    }, 30_000)
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity))
      clearInterval(timer)
    }
  }, [isAdmin, signOut])

  // ----- kirish -----
  const signIn = async (email: string, password: string) => {
    if (!supabase) return 'Supabase не настроен'
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      writeLastActivity(Date.now())
      lastVerifiedRef.current = 0
      return null
    }
    if (error.status === 400) return 'Неверный email или пароль'
    return describe(error, 'Не удалось войти. Проверьте интернет и попробуйте ещё раз.')
  }

  const verifyMfa = async (code: string) => {
    const db = supabase!
    const { data } = await db.auth.mfa.listFactors()
    const factor = data?.totp.find((f) => f.status === 'verified')
    if (!factor) return 'Двухфакторная защита не найдена'
    const { error } = await db.auth.mfa.challengeAndVerify({ factorId: factor.id, code })
    if (error) return error.status === 429 ? describe(error, '') : 'Неверный код. Попробуйте ещё раз.'
    await refresh()
    return null
  }

  // ----- parolni tiklash (xat orqali) -----
  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}${RESET_PATH}`,
    })
    // email bazada bor-yo'qligi oshkor qilinmaydi: xato faqat tarmoq/limit bo'lsa ko'rsatiladi
    return error && (error.status === 429 || /fetch|network/i.test(error.message))
      ? describe(error, '')
      : null
  }

  const completeRecovery = async (password: string) => {
    const { error } = await supabase!.auth.updateUser({ password })
    if (error) return describe(error, 'Не удалось сохранить пароль. Ссылка могла устареть.')
    history.replaceState(null, '', '/')
    await refresh()
    return null
  }

  // ----- parolni qayta tekshirish (muhim amallardan oldin) -----
  // Parol alohida, vaqtinchalik ulanish orqali tekshiriladi: asosiy sessiya (va uning 2FA
  // darajasi) o'zgarmaydi. To'g'ri kiritilsa, keyingi REAUTH_GRACE_MS davomida qayta so'ralmaydi.
  const verifyPassword = async (password: string) => {
    if (state.status !== 'admin') return 'Нет доступа'
    const verifier = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: false, autoRefreshToken: false, storageKey: 'cx-admin-verify' },
    })
    const { error } = await verifier.auth.signInWithPassword({
      email: state.session.user.email ?? '',
      password,
    })
    if (error) return error.status === 400 ? 'Неверный пароль' : describe(error, 'Ошибка проверки')
    await verifier.auth.signOut({ scope: 'local' })
    lastVerifiedRef.current = Date.now()
    return null
  }
  const needsPassword = () => Date.now() - lastVerifiedRef.current > REAUTH_GRACE_MS

  // ----- parolni almashtirish (panel ichidan) -----
  const changePassword = async (current: string, next: string) => {
    const wrong = await verifyPassword(current)
    if (wrong) return wrong === 'Неверный пароль' ? 'Текущий пароль указан неверно' : wrong
    const { error } = await supabase!.auth.updateUser({ password: next })
    return describe(error, 'Не удалось изменить пароль')
  }

  // ----- profil: ism va rasm (Supabase foydalanuvchi ma'lumotida saqlanadi) -----
  const updateProfile = async (profile: { name: string; avatarUrl: string | null }) => {
    const { error } = await supabase!.auth.updateUser({
      data: { full_name: profile.name.trim() || null, avatar_url: profile.avatarUrl },
    })
    if (error) return describe(error, 'Не удалось сохранить профиль')
    await refresh()
    return null
  }

  // ----- 2FA (Google Authenticator va shu kabi ilovalar) -----
  const startTotpEnrollment = async () => {
    const db = supabase!
    // oldin boshlanib, tasdiqlanmay qolgan urinishlar tozalanadi
    const { data: existing } = await db.auth.mfa.listFactors()
    for (const f of existing?.all ?? []) {
      if (f.status !== 'verified') await db.auth.mfa.unenroll({ factorId: f.id })
    }
    const { data, error } = await db.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `cX-shop admin ${new Date().toLocaleDateString('ru-RU')}`,
    })
    if (error || !data) return { error: describe(error, 'Не удалось включить 2FA') ?? 'Ошибка' }
    // supabase-js SVG'ni kodlamasdan data-URL'ga qo'yadi; SVG ichidagi '#' (rang) manzilni
    // kesib yuboradi va rasm ochilmaydi — shuning uchun qayta kodlanadi
    const svg = data.totp.qr_code.replace(/^data:image\/svg\+xml;utf-8,/, '')
    const qrCode = svg.startsWith('<')
      ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
      : data.totp.qr_code
    return { factorId: data.id, qrCode, secret: data.totp.secret }
  }

  const confirmTotpEnrollment = async (factorId: string, code: string) => {
    const { error } = await supabase!.auth.mfa.challengeAndVerify({ factorId, code })
    if (error) return 'Неверный код. Проверьте время на телефоне и попробуйте ещё раз.'
    await refresh()
    return null
  }

  const disableTotp = async () => {
    const db = supabase!
    const { data } = await db.auth.mfa.listFactors()
    for (const f of data?.all ?? []) {
      const { error } = await db.auth.mfa.unenroll({ factorId: f.id })
      if (error) return describe(error, 'Не удалось отключить 2FA')
    }
    // sessiya darajasi yangilanishi uchun
    await db.auth.refreshSession()
    await refresh()
    return null
  }

  return (
    <AuthContext.Provider
      value={{
        state,
        signIn,
        signOut,
        verifyMfa,
        requestPasswordReset,
        completeRecovery,
        changePassword,
        startTotpEnrollment,
        confirmTotpEnrollment,
        disableTotp,
        verifyPassword,
        needsPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
