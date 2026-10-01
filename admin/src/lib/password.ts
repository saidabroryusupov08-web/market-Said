import { tr } from '../i18n'

// Admin paroli uchun talab: kamida 8 belgi, harf va raqam aralash.
// (Supabase'ning o'zida minimal 6 belgi; bu yerda qat'iyroq.)
export function validatePassword(password: string, confirm: string): string | null {
  if (password.length < 8) return tr('password.tooShort')
  if (!/\p{L}/u.test(password) || !/\d/.test(password))
    return tr('password.lettersDigits')
  if (password !== confirm) return tr('password.mismatch')
  return null
}
