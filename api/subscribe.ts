// Vercel serverless funksiyasi: footer'dagi obuna formasi shu yerga yuboradi.
// Xabar ikki joyga ketadi:
//   1) Supabase bazasi -> admin paneldagi "Сообщения" bo'limida ko'rinadi
//      (env: VITE_SUPABASE_URL yoki SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
//   2) Telegram bot -> telefonga bildirishnoma (env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
// Qaysi biri sozlangan bo'lsa, o'sha ishlaydi. Kalitlar faqat serverda turadi,
// brauzerga ham, GitHub'ga ham chiqmaydi.

type CartLine = {
  name: string
  size: string
  color: string
  quantity: number
  price: number
}

type SubscribePayload = {
  email: string
  device: string
  browser: string
  language: string
  screen: string
  cart: CartLine[]
  total: number
}

const MAX_CART_LINES = 50

// src/utils/email.ts dagi asosiy qoida; funksiya alohida yig'ilgani uchun shu yerda takrorlangan
const EMAIL_RE =
  /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

// Telegram HTML rejimida foydalanuvchi matni teg bo'lib ketmasligi uchun
const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const str = (value: unknown, max = 100) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const num = (value: unknown) => {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

// brauzerdan kelgan ma'lumotga ishonilmaydi: turi tekshiriladi va uzunligi cheklanadi
export function parsePayload(body: unknown): SubscribePayload | null {
  if (!body || typeof body !== 'object') return null
  const data = body as Record<string, unknown>
  const email = str(data.email, 254).toLowerCase()
  if (!EMAIL_RE.test(email) || email.includes('..')) return null

  const cart = Array.isArray(data.cart)
    ? data.cart.slice(0, MAX_CART_LINES).flatMap((raw) => {
        if (!raw || typeof raw !== 'object') return []
        const line = raw as Record<string, unknown>
        const name = str(line.name)
        if (!name) return []
        return [
          {
            name,
            size: str(line.size, 30),
            color: str(line.color, 30),
            quantity: Math.min(999, Math.floor(num(line.quantity))),
            price: num(line.price),
          },
        ]
      })
    : []

  return {
    email,
    device: str(data.device, 40),
    browser: str(data.browser, 40),
    language: str(data.language, 20),
    screen: str(data.screen, 20),
    cart,
    total: num(data.total),
  }
}

export function buildMessage(p: SubscribePayload, now = new Date()): string {
  const time = now.toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })
  const unknown = 'неизвестно'
  const lines = [
    '📩 <b>Новый подписчик — cX-shop</b>',
    '',
    `<b>Email:</b> ${escapeHtml(p.email)}`,
    `<b>Время:</b> ${time} (Ташкент)`,
    `<b>Устройство:</b> ${escapeHtml(p.device || unknown)} · ${escapeHtml(p.browser || unknown)}`,
    `<b>Язык:</b> ${escapeHtml(p.language || unknown)} · <b>Экран:</b> ${escapeHtml(p.screen || unknown)}`,
    '',
  ]

  if (p.cart.length === 0) {
    lines.push('🛒 Корзина пуста')
  } else {
    const count = p.cart.reduce((sum, line) => sum + line.quantity, 0)
    lines.push(`🛒 <b>Корзина</b> (${count} шт., $${p.total.toFixed(2)}):`)
    for (const line of p.cart) {
      const options = [line.size, line.color].filter(Boolean).join(', ')
      lines.push(
        `• ${escapeHtml(line.name)}${options ? ` — ${escapeHtml(options)}` : ''} × ${line.quantity} — $${(
          line.price * line.quantity
        ).toFixed(2)}`,
      )
    }
  }

  return lines.join('\n')
}

export async function POST(request: Request): Promise<Response> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  // manzil ochiq, shuning uchun do'kon bilan bir xil VITE_SUPABASE_URL ham ishlaydi
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
  const hasTelegram = !!(token && chatId)
  const hasSupabase = !!(supabaseUrl && supabaseKey)
  if (!hasTelegram && !hasSupabase) {
    console.error('Na Supabase, na Telegram sozlanmagan (Vercel env)')
    return json({ error: 'Сервис временно недоступен' }, 500)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Некорректный запрос' }, 400)
  }

  // yashirin "website" maydoni to'ldirilgan bo'lsa bu bot: hech narsa saqlanmaydi,
  // lekin bot sezmasligi uchun oddiy "ok" qaytariladi
  if (str((body as Record<string, unknown> | null)?.website)) return json({ ok: true }, 200)

  const payload = parsePayload(body)
  if (!payload) return json({ error: 'Некорректный email' }, 400)

  // ikkalasi parallel ketadi; bittasi ishlamasa ham ikkinchisi xabarni yetkazadi
  const [saved, notified] = await Promise.all([
    hasSupabase ? saveToSupabase(supabaseUrl!, supabaseKey!, payload) : Promise.resolve(false),
    hasTelegram ? sendTelegram(token!, chatId!, payload) : Promise.resolve(false),
  ])

  if (!saved && !notified) return json({ error: 'Не удалось отправить' }, 502)
  return json({ ok: true }, 200)
}

async function saveToSupabase(url: string, key: string, p: SubscribePayload): Promise<boolean> {
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ type: 'subscribe', ...p }),
    })
    if (res.ok) return true
    console.error('Supabase xatosi:', res.status, await res.text())
  } catch (err) {
    console.error('Supabase bilan aloqa yo‘q:', err)
  }
  return false
}

async function sendTelegram(token: string, chatId: string, p: SubscribePayload): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage(p),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
    if (res.ok) return true
    // token log'ga yozilmaydi, faqat Telegram javobi
    console.error('Telegram xatosi:', res.status, await res.text())
  } catch (err) {
    console.error('Telegram bilan aloqa yo‘q:', err)
  }
  return false
}
