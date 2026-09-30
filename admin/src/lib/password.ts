// Admin paroli uchun talab: kamida 8 belgi, harf va raqam aralash.
// (Supabase'ning o'zida minimal 6 belgi; bu yerda qat'iyroq.)
export function validatePassword(password: string, confirm: string): string | null {
  if (password.length < 8) return 'Пароль должен быть не короче 8 символов'
  if (!/\p{L}/u.test(password) || !/\d/.test(password))
    return 'Пароль должен содержать буквы и цифры'
  if (password !== confirm) return 'Пароли не совпадают'
  return null
}
