-- cX-shop: foydalanuvchilardan keladigan xabarlar (hozircha obunalar).
-- Supabase -> SQL Editor -> New query -> shu faylni joylab "Run" bosing.

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type text not null default 'subscribe',
  email text not null,
  device text,
  browser text,
  language text,
  screen text,
  cart jsonb not null default '[]'::jsonb,
  total numeric(10, 2) not null default 0,
  is_read boolean not null default false
);

create index if not exists messages_created_at_idx on public.messages (created_at desc);

-- RLS yoqiladi va hech qanday policy qo'shilmaydi: brauzerdan (anon kalit bilan)
-- jadvalni o'qib ham, yozib ham bo'lmaydi. Faqat Vercel funksiyalari
-- service_role kaliti bilan ishlaydi.
alter table public.messages enable row level security;
