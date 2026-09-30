# cX-shop

Kiyim do'koni (React + Vite + Tailwind) va unga alohida admin panel. Ma'lumotlar Supabase'da.

```
market-Said/
├── src/            do'kon sayti (mijozlar uchun)          → npm run dev        / build
├── admin/          admin panel (faqat admin uchun)        → npm run dev:admin  / build:admin
├── shared/         ikkalasiga umumiy: mahsulot turi, narx, rasmlar, Supabase, logotip
├── api/            Vercel server funksiyasi: obuna → Supabase + Telegram
└── supabase/       bazaning jadvallari va himoya qoidalari (schema.sql)
```

## Himoya qanday ishlaydi

- Admin panel alohida sayt: do'konda unga havola ham, uning kodi ham yo'q; qidiruv tizimlariga yopiq.
- Kirish — Supabase Auth (email + parol). Ro'yxatdan o'tish yopiq, admin akkauntini faqat egasi yaratadi.
- Asosiy himoya bazada (RLS): mahsulotlarni hamma ko'radi, lekin faqat `admins` jadvalidagi
  foydalanuvchi o'zgartira oladi; xabarlarni faqat admin ko'radi. Admin sayt manzilini bilgan odam ham
  login'siz hech narsa qila olmaydi.
- **Parol:** kodda yo'q — Supabase'da admin akkauntini yaratganda o'zingiz qo'yasiz. Panel ichida
  (pastki chap burchak → «Безопасность») almashtiriladi; unutilsa — login sahifasida «Забыли пароль?».
- **2FA:** «Безопасность» → «Включить 2FA» → Google Authenticator bilan QR skanerlash. Yoqilgandan
  keyin parol o'g'irlansa ham, telefondagi kodsiz na panelga, na bazaga yozishga ruxsat bor.
- 30 daqiqa harakat bo'lmasa, panel avtomatik chiqadi. Rasmlar 2 MB gacha, faqat JPG/PNG/WebP;
  o'chirilgan yoki almashtirilgan mahsulot rasmi Storage'dan ham o'chadi.

## Sozlash (bir marta)

### 1. Supabase
1. [supabase.com](https://supabase.com) → **New project**.
2. **SQL Editor → New query** → `supabase/schema.sql` ichidagini joylab **Run**.
3. **Authentication → Users → Add user**: admin emaili va paroli, "Auto Confirm User" ✔.
4. **Authentication → Sign In / Providers**: "Allow new users to sign up" ni **o'chiring**.
5. SQL Editor'da (emailni o'zingiznikiga almashtiring):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'SIZNING@EMAIL.COM';
   ```
6. **Authentication → URL Configuration → Redirect URLs**: admin manzili + `/reset`
   (masalan `https://cx-shop-admin.vercel.app/reset`) — «Забыли пароль?» xati shu yerga olib keladi.
7. **Project Settings → API**: `Project URL`, `anon` (publishable) kalit va `service_role` kalitni oling.

### 2. Vercel — do'kon (mavjud loyiha)
Settings → Environment Variables:

| Nomi | Qiymati | Maxfiymi |
|---|---|---|
| `VITE_SUPABASE_URL` | Project URL | yo'q |
| `VITE_SUPABASE_ANON_KEY` | anon kalit | yo'q (RLS himoya qiladi) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role kalit | **HA** — hech qayerga yozmang |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | ixtiyoriy | **HA** |

### 3. Vercel — admin panel (yangi loyiha)
Add New → Project → shu GitHub repo'ni tanlang, keyin:
- **Build Command:** `npm run build:admin`
- **Output Directory:** `dist-admin`
- Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, ixtiyoriy `VITE_STORE_URL`
  (do'kon manzili, menyudagi "Открыть магазин" uchun).

Admin panelga birinchi kirganda "Добавить стандартные" tugmasi saytdagi 22 ta mahsulotni bazaga qo'shadi.

## Kompyuterda ishga tushirish

Loyiha ildizida `.env.local` fayl (GitHub'ga tushmaydi):
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
```
```
npm install
npm run dev         # do'kon:  http://localhost:5173
npm run dev:admin   # admin:   http://localhost:5180
```
Supabase sozlanmagan bo'lsa do'kon standart mahsulotlarni ko'rsatadi. Obuna (`/api`) faqat Vercel'da
yoki `npx vercel dev` bilan ishlaydi.

> ⚠️ `service_role` kalit, bot tokeni va parollarni hech qachon kodga yoki GitHub'ga yozmang.
