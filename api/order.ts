// Vercel serverless funksiyasi: do'kondagi "Оформить заказ" shu yerga yuboradi.
//  - mahsulot va narxlar brauzerdan OLINMAYDI: bazadan o'qib, server o'zi hisoblaydi
//    (aks holda narxni brauzerda o'zgartirib, arzonga buyurtma berish mumkin bo'lardi)
//  - buyurtma Supabase'ga yoziladi (admin paneldagi "Заказы"), Telegram'ga xabar ketadi
// Env: VITE_SUPABASE_URL (yoki SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
//      ixtiyoriy TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID

type ProductRow = {
  id: number
  name: string
  price: number | string
  sizes: string[]
  colors: string[]
  size_prices: Record<string, number> | null
  image: string | null
  is_active: boolean | null
}

type OrderItem = {
  productId: number
  name: string
  size: string
  color: string
  quantity: number
  price: number
  image: string | null
}

const MAX_ITEMS = 50

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const str = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// shared/price.ts dagi getPrice bilan AYNAN bir xil bo'lishi shart (do'kon ko'rsatgan narx =
// server hisoblagan narx). Funksiya alohida yig'ilgani uchun shu yerda takrorlangan.
export function priceFor(row: ProductRow, size: string): number {
  const base = Number(row.price)
  const custom = row.size_prices?.[size]
  if (typeof custom === 'number' && Number.isFinite(custom) && custom > 0) return custom
  const index = row.sizes.indexOf(size)
  if (index <= 0) return base
  return Math.max(base, Math.round(base * (1 + 0.05 * index)) - 0.01)
}

type Customer = {
  name: string
  phone: string
  email: string | null
  address: string
  comment: string | null
}

// xato bo'lsa foydalanuvchiga ko'rsatiladigan matn qaytadi
function parseCustomer(data: Record<string, unknown>): Customer | string {
  const name = str(data.name, 100)
  const phone = str(data.phone, 30)
  const email = str(data.email, 254).toLowerCase()
  const address = str(data.address, 300)
  const comment = str(data.comment, 500)
  if (name.length < 2) return 'Укажите имя'
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 9 || digits.length > 15 || !/^[+\d\s()-]+$/.test(phone))
    return 'Укажите корректный номер телефона'
  if (email && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email)) return 'Некорректный email'
  if (address.length < 5) return 'Укажите адрес доставки'
  return { name, phone, email: email || null, address, comment: comment || null }
}

function parseItems(value: unknown) {
  if (!Array.isArray(value)) return null
  const items = value.slice(0, MAX_ITEMS).flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return []
    const r = raw as Record<string, unknown>
    const productId = Number(r.productId)
    const quantity = Math.floor(Number(r.quantity))
    if (!Number.isSafeInteger(productId) || productId <= 0) return []
    if (!(quantity >= 1 && quantity <= 99)) return []
    return [{ productId, size: str(r.size, 30), color: str(r.color, 30), quantity }]
  })
  return items.length > 0 ? items : null
}

function buildTelegramText(id: number, c: Customer, items: OrderItem[], total: number) {
  const time = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })
  return [
    `🛍 <b>Новый заказ №${id} — cX-shop</b>`,
    '',
    `<b>Имя:</b> ${escapeHtml(c.name)}`,
    `<b>Телефон:</b> ${escapeHtml(c.phone)}`,
    c.email ? `<b>Email:</b> ${escapeHtml(c.email)}` : '',
    `<b>Адрес:</b> ${escapeHtml(c.address)}`,
    c.comment ? `<b>Комментарий:</b> ${escapeHtml(c.comment)}` : '',
    `<b>Время:</b> ${time} (Ташкент)`,
    '',
    ...items.map(
      (i) => `• ${escapeHtml(i.name)} — ${escapeHtml(i.size)}, ${escapeHtml(i.color)} × ${i.quantity} — $${(i.price * i.quantity).toFixed(2)}`,
    ),
    '',
    `<b>Итого: $${total.toFixed(2)}</b>`,
  ]
    .filter((line, index, all) => line !== '' || all[index - 1] !== '')
    .join('\n')
}

export async function POST(request: Request): Promise<Response> {
  const url = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL)?.replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Supabase sozlanmagan: buyurtmalarni saqlab bo‘lmaydi')
    return json({ error: 'Заказы временно не принимаются. Попробуйте позже.' }, 503)
  }

  let body: Record<string, unknown>
  try {
    const parsed = await request.json()
    if (!parsed || typeof parsed !== 'object') throw new Error()
    body = parsed as Record<string, unknown>
  } catch {
    return json({ error: 'Некорректный запрос' }, 400)
  }

  // spam-bot tuzog'i (footer'dagi obuna formasi bilan bir xil)
  if (str(body.website, 200)) return json({ ok: true, id: 0 }, 200)

  const customer = parseCustomer(body)
  if (typeof customer === 'string') return json({ error: customer }, 400)
  const requested = parseItems(body.items)
  if (!requested) return json({ error: 'Корзина пуста' }, 400)

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  try {
    // mahsulotlar bazadan: narx, mavjudligi, o'lcham/rang to'g'riligi shu yerda tekshiriladi
    const ids = [...new Set(requested.map((i) => i.productId))].join(',')
    const res = await fetch(`${url}/rest/v1/products?select=*&id=in.(${ids})`, { headers })
    if (!res.ok) throw new Error(`products ${res.status}: ${await res.text()}`)
    const rows = (await res.json()) as ProductRow[]

    const items: OrderItem[] = []
    for (const r of requested) {
      const row = rows.find((p) => p.id === r.productId)
      if (!row || row.is_active === false)
        return json({ error: 'Некоторые товары больше недоступны. Обновите корзину.' }, 409)
      if (!row.sizes.includes(r.size) || !row.colors.includes(r.color))
        return json({ error: `«${row.name}»: выбранный размер или цвет больше недоступен` }, 409)
      items.push({
        productId: row.id,
        name: row.name,
        size: r.size,
        color: r.color,
        quantity: r.quantity,
        price: priceFor(row, r.size),
        image: row.image,
      })
    }
    const total = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100

    // ombor: qoldiq bazada bitta tranzaksiyada tekshiriladi va kamaytiriladi (schema.sql: reserve_stock)
    const stockItems = items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity }))
    const reserve = await fetch(`${url}/rest/v1/rpc/reserve_stock`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ items: stockItems }),
    })
    if (!reserve.ok) throw new Error(`reserve_stock ${reserve.status}: ${await reserve.text()}`)
    const shortage = (await reserve.json()) as { name: string; size: string; available: number } | null
    if (shortage)
      return json(
        {
          error:
            shortage.available > 0
              ? `«${shortage.name}» (${shortage.size}): на складе осталось только ${shortage.available} шт.`
              : `«${shortage.name}» (${shortage.size}) закончился на складе`,
          code: 'out_of_stock',
          ...shortage,
        },
        409,
      )
    // buyurtma saqlanmasa, band qilingan qoldiq omborga qaytariladi
    const release = () =>
      fetch(`${url}/rest/v1/rpc/release_stock`, { method: 'POST', headers, body: JSON.stringify({ items: stockItems }) }).catch(
        (err) => console.error('release_stock:', err),
      )

    const insert = await fetch(`${url}/rest/v1/orders`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation', Accept: 'application/vnd.pgrst.object+json' },
      body: JSON.stringify({
        customer_name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        comment: customer.comment,
        items,
        total,
        device: str(body.device, 40) || null,
        browser: str(body.browser, 40) || null,
      }),
    })
    if (!insert.ok) {
      await release()
      throw new Error(`orders ${insert.status}: ${await insert.text()}`)
    }
    const order = (await insert.json()) as { id: number }

    // Telegram — ixtiyoriy; ishlamasa ham buyurtma saqlangan
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (token && chatId) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: buildTelegramText(order.id, customer, items, total),
          parse_mode: 'HTML',
        }),
      }).catch((err) => console.error('Telegram:', err))
    }

    return json({ ok: true, id: order.id, total }, 200)
  } catch (err) {
    console.error('Buyurtma xatosi:', err)
    return json({ error: 'Не удалось оформить заказ. Попробуйте ещё раз.' }, 502)
  }
}
