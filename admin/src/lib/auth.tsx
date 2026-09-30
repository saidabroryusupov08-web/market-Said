import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../shared/supabase'

// Kirish Supabase Auth orqali (email + parol). Kirgan odam admin ekani bazadagi
// public.is_admin() funksiyasi bilan tekshiriladi — admins jadvalida bo'lmasa,
// login to'g'ri bo'lsa ham panelga kiritilmaydi. Asl himoya baribir bazadagi RLS'da.

type AuthState =
  | { status: 'loading' }
  | { status: 'not-configured' }
  | { status: 'signed-out' }
  | { status: 'not-admin'; email: string }
  | { status: 'admin'; session: Session }

type AuthContextValue = {
  state: AuthState
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function resolveState(session: Session | null): Promise<AuthState> {
  if (!session) return { status: 'signed-out' }
  const { data, error } = await supabase!.rpc('is_admin')
  if (error || data !== true) return { status: 'not-admin', email: session.user.email ?? '' }
  return { status: 'admin', session }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(
    supabase ? { status: 'loading' } : { status: 'not-configured' },
  )

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    const apply = async (session: Session | null) => {
      const next = await resolveState(session)
      if (!cancelled) setState(next)
    }

    supabase.auth.getSession().then(({ data }) => apply(data.session))
    // boshqa tabda chiqilsa yoki sessiya muddati tugasa ham holat yangilanadi
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Supabase callback ichida boshqa so'rov yuborish tavsiya etilmaydi — keyingi tick'da
        setTimeout(() => apply(session), 0)
      }
    })
    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  // xato bo'lsa foydalanuvchiga ko'rsatiladigan matn qaytadi
  const signIn = async (email: string, password: string) => {
    if (!supabase) return 'Supabase не настроен'
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return null
    if (error.status === 400) return 'Неверный email или пароль'
    if (error.status === 429) return 'Слишком много попыток. Подождите немного и попробуйте снова.'
    return 'Не удалось войти. Проверьте интернет и попробуйте ещё раз.'
  }

  const signOut = async () => {
    await supabase?.auth.signOut()
    setState({ status: 'signed-out' })
  }

  return (
    <AuthContext.Provider value={{ state, signIn, signOut }}>{children}</AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
