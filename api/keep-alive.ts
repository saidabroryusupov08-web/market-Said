// Vercel Cron (vercel.json): kuniga bir marta bazaga kichik so'rov yuboradi.
// Supabase'ning bepul tarifi 7 kun hech qanday murojaat bo'lmasa loyihani "uxlatib" qo'yadi —
// shu so'rov tufayli baza doim faol turadi. Faqat 1 ta mahsulot id'si o'qiladi, hech narsa o'zgarmaydi.
// Vercel cron so'rovi "Authorization: Bearer <CRON_SECRET>" bilan keladi (CRON_SECRET berilgan bo'lsa).

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.replace(/\/$/, '')
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return Response.json({ ok: false, reason: 'supabase not configured' }, { status: 503 })

  const res = await fetch(`${url}/rest/v1/products?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  return Response.json({ ok: res.ok, status: res.status, at: new Date().toISOString() }, { status: res.ok ? 200 : 502 })
}
