// Admin panel uchun: Supabase'dagi xabarlarni o'qish, "o'qildi" deb belgilash va o'chirish.
// Har bir so'rovda "x-admin-key" sarlavhasi Vercel'dagi ADMIN_API_KEY bilan mos kelishi shart,
// aks holda 401 — shunda xabarlarni faqat kalitni biladigan admin ko'radi.

import { createHash, timingSafeEqual } from 'node:crypto'

const MAX_MESSAGES = 200

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

// kalitlar hash qilinib solishtiriladi: uzunligi farq qilsa ham vaqt bo'yicha sir chiqmaydi
function sameKey(a: string, b: string) {
  const hash = (s: string) => createHash('sha256').update(s).digest()
  return timingSafeEqual(hash(a), hash(b))
}

type Env = { url: string; key: string }

// ok bo'lsa Supabase manzili/kaliti, bo'lmasa tayyor xato javobi qaytadi
function authorize(request: Request): Env | Response {
  const adminKey = process.env.ADMIN_API_KEY
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!adminKey || !url || !key) {
    console.error('ADMIN_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY sozlanmagan')
    return json({ error: 'Хранилище сообщений не настроено' }, 500)
  }
  const given = request.headers.get('x-admin-key') ?? ''
  if (!given || !sameKey(given, adminKey)) return json({ error: 'Неверный ключ' }, 401)
  return { url: url.replace(/\/$/, ''), key }
}

function supabase(env: Env, path: string, init: RequestInit = {}) {
  return fetch(`${env.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}

async function forward(res: Response, okBody?: unknown) {
  if (res.ok) return json(okBody ?? (await res.json()), 200)
  console.error('Supabase xatosi:', res.status, await res.text())
  return json({ error: 'Ошибка базы данных' }, 502)
}

// id faqat musbat butun son bo'lishi kerak (so'rovga boshqa narsa qo'shib bo'lmasligi uchun)
function parseId(value: unknown): number | null {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export async function GET(request: Request): Promise<Response> {
  const env = authorize(request)
  if (env instanceof Response) return env
  try {
    return await forward(
      await supabase(env, `messages?select=*&order=created_at.desc&limit=${MAX_MESSAGES}`),
    )
  } catch (err) {
    console.error('Supabase bilan aloqa yo‘q:', err)
    return json({ error: 'Ошибка базы данных' }, 502)
  }
}

// { id, is_read } — bitta xabarni o'qilgan/o'qilmagan qilish; { all: true } — hammasini o'qilgan qilish
export async function PATCH(request: Request): Promise<Response> {
  const env = authorize(request)
  if (env instanceof Response) return env
  const body = await readBody(request)
  const filter = body.all === true ? 'is_read=eq.false' : `id=eq.${parseId(body.id)}`
  if (body.all !== true && parseId(body.id) === null) return json({ error: 'Некорректный id' }, 400)
  try {
    return await forward(
      await supabase(env, `messages?${filter}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ is_read: body.all === true ? true : body.is_read !== false }),
      }),
      { ok: true },
    )
  } catch (err) {
    console.error('Supabase bilan aloqa yo‘q:', err)
    return json({ error: 'Ошибка базы данных' }, 502)
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const env = authorize(request)
  if (env instanceof Response) return env
  const id = parseId((await readBody(request)).id)
  if (id === null) return json({ error: 'Некорректный id' }, 400)
  try {
    return await forward(
      await supabase(env, `messages?id=eq.${id}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      }),
      { ok: true },
    )
  } catch (err) {
    console.error('Supabase bilan aloqa yo‘q:', err)
    return json({ error: 'Ошибка базы данных' }, 502)
  }
}
