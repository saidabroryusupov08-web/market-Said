// Email formatini tekshirish. Brauzerning type="email" tekshiruvi "a@b" kabi
// manzillarni ham o'tkazib yuboradi, shuning uchun qat'iyroq qoidalar ishlatiladi.
// Eslatma: backend'siz pochta qutisi haqiqatda borligini bilib bo'lmaydi.

const EMAIL_RE =
  /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/

// vaqtinchalik va namuna uchun ishlatiladigan domenlar
const FAKE_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'test.ru',
  'mailinator.com',
  'yopmail.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'trashmail.com',
])

// ko'p uchraydigan xatolar: noto'g'ri yozilgan domen -> to'g'risi
const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gnail.com': 'gmail.com',
  'mail.r': 'mail.ru',
  'mail.ry': 'mail.ru',
  'yandex.r': 'yandex.ru',
  'yandex.con': 'yandex.com',
  'yahoo.co': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'outlook.co': 'outlook.com',
  'icloud.co': 'icloud.com',
}

// xato bo'lsa foydalanuvchiga ko'rsatiladigan matn, to'g'ri bo'lsa null
export function validateEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase()
  if (!email) return 'Введите email'
  if (/\s/.test(email)) return 'Email не должен содержать пробелов'
  if (!email.includes('@')) return 'В email должен быть символ «@»'
  if (email.includes('..')) return 'Email не может содержать две точки подряд'
  if (email.length > 254) return 'Email слишком длинный'

  const [local, domain] = email.split('@')
  if (!EMAIL_RE.test(email) || local.length > 64)
    return 'Некорректный email. Пример: name@gmail.com'

  const suggestion = DOMAIN_TYPOS[domain]
  if (suggestion) return `Возможно, вы имели в виду ${local}@${suggestion}?`

  if (FAKE_DOMAINS.has(domain)) return 'Укажите ваш настоящий email'

  return null
}
