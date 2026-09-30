// Do'kon bosh sahifasining admin o'zgartira oladigan qismi (Supabase: site_settings, bitta qator).
// Bo'sh maydon -> standart qiymat ishlatiladi.

export type SiteSettings = {
  heroTitle: string
  heroSubtitle: string
  // shared/assets dagi rasm nomi ('hero-store') yoki yuklangan rasm URL'i
  heroImage: string
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  heroTitle: 'Новая коллекция «Лето 2026»',
  heroSubtitle:
    'Откройте для себя последние тенденции моды в нашей подборке premium-одежды. Качество и стиль в каждой вещи.',
  heroImage: 'hero-store',
}

export const HERO_TITLE_MAX = 80
export const HERO_SUBTITLE_MAX = 240

export type SiteSettingsRow = {
  id: number
  hero_title: string | null
  hero_subtitle: string | null
  hero_image: string | null
  updated_at?: string
}

export function settingsFromRow(row: SiteSettingsRow | null | undefined): SiteSettings {
  return {
    heroTitle: row?.hero_title?.trim() || DEFAULT_SITE_SETTINGS.heroTitle,
    heroSubtitle: row?.hero_subtitle?.trim() || DEFAULT_SITE_SETTINGS.heroSubtitle,
    heroImage: row?.hero_image?.trim() || DEFAULT_SITE_SETTINGS.heroImage,
  }
}

// standart qiymat bazaga null bo'lib yoziladi: keyin standart o'zgarsa, sayt ham yangilanadi
export function settingsToRow(s: SiteSettings) {
  const orNull = (value: string, fallback: string) => (value.trim() && value.trim() !== fallback ? value.trim() : null)
  return {
    hero_title: orNull(s.heroTitle, DEFAULT_SITE_SETTINGS.heroTitle),
    hero_subtitle: orNull(s.heroSubtitle, DEFAULT_SITE_SETTINGS.heroSubtitle),
    hero_image: orNull(s.heroImage, DEFAULT_SITE_SETTINGS.heroImage),
    updated_at: new Date().toISOString(),
  }
}
