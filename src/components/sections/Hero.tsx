import { useEffect, useState } from 'react'
import { resolveImage } from '../../../shared/images'
import {
  DEFAULT_SITE_SETTINGS,
  settingsFromRow,
  type SiteSettings,
  type SiteSettingsRow,
} from '../../../shared/siteSettings'
import { supabase } from '../../../shared/supabase'
import { useT } from '../../i18n'

function scrollToProducts() {
  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
}

// Sarlavha, matn va rasmni admin paneldan o'zgartirish mumkin (Главная -> «Главная страница сайта»).
// Supabase sozlanmagan bo'lsa yoki ulanib bo'lmasa, standart matn va rasm ko'rsatiladi.
function Hero() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS)
  // bazadan kelguncha matn/rasm ko'rinmaydi: avval standarti chiqib, keyin almashib ketmasligi uchun
  const [ready, setReady] = useState(!supabase)
  const { t } = useT()
  // admin o'zgartirmagan standart matn tanlangan tilda ko'rsatiladi; o'zgartirilgani — qanday yozilgan bo'lsa
  const title = settings.heroTitle === DEFAULT_SITE_SETTINGS.heroTitle ? t('hero.defaultTitle') : settings.heroTitle
  const subtitle =
    settings.heroSubtitle === DEFAULT_SITE_SETTINGS.heroSubtitle ? t('hero.defaultSubtitle') : settings.heroSubtitle

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error) setSettings(settingsFromRow(data as SiteSettingsRow | null))
        setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="py-16 lg:py-24">
      <div
        className={`mx-auto grid w-[90%] items-center gap-12 transition-opacity duration-300 lg:w-[70%] lg:grid-cols-2 lg:gap-16 ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div>
          <h1 className="text-4xl leading-tight font-normal break-words text-gray-950 sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-[460px] text-lg leading-relaxed text-gray-500">
            {subtitle}
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={scrollToProducts}
              className="rounded-md bg-gray-950 px-[21.5px] py-[7.5px] font-semibold text-white transition hover:bg-gray-800"
            >
              {t('hero.shop')}
            </button>
            <button
              type="button"
              onClick={scrollToProducts}
              className="rounded-md border border-gray-200 bg-white px-[21.5px] py-[7.5px] font-semibold text-gray-950 transition hover:bg-gray-100"
            >
              {t('hero.catalog')}
            </button>
          </div>

          <ul className="mt-6 flex flex-wrap gap-8 text-sm text-gray-500">
            <li className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-500" />
              {t('hero.freeShipping')}
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-500" />
              {t('hero.returns')}
            </li>
          </ul>
        </div>

        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-200 lg:-ml-[20px] lg:w-[calc(100%+20px)]">
          <img
            src={resolveImage(settings.heroImage) ?? resolveImage(DEFAULT_SITE_SETTINGS.heroImage)}
            alt={t('hero.imageAlt')}
            className="size-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}

export default Hero
