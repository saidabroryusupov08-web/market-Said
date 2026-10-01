/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Check, Globe } from 'lucide-react'
import { cyrillicDict } from './translit'
import Tooltip from './Tooltip'

// Uch tilli interfeys (do'kon va admin uchun umumiy mexanizm). Har bir ilova o'z lug'atini
// beradi: rus tili — asos, ingliz va o'zbek (lotin) lug'atlari TypeScript orqali to'liqligi
// tekshiriladi (birorta kalit tushib qolsa, build o'tmaydi).
// Tanlangan til brauzerda eslab qolinadi; sana va raqam formatlari ham tilga moslashadi.

export type Lang = 'ru' | 'en' | 'uz' | 'uzc'
// qo'lda yoziladigan lug'atlar; o'zbek kirill (uzc) lotinchadan avtomatik hosil qilinadi
export type BaseLang = Exclude<Lang, 'uzc'>

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'uz', label: "O'zbekcha (lotin)", short: 'UZ' },
  { code: 'uzc', label: 'Ўзбекча (кирилл)', short: 'ЎЗ' },
]

// sana/raqam formati uchun
export const LOCALES: Record<Lang, string> = { ru: 'ru-RU', en: 'en-US', uz: 'uz-Latn-UZ', uzc: 'uz-Cyrl-UZ' }

const STORAGE_KEY = 'cx-lang'

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'ru' || saved === 'en' || saved === 'uz' || saved === 'uzc') return saved
  } catch {
    // localStorage bloklangan bo'lsa — standart til
  }
  return 'ru'
}

// React'dan tashqaridagi kod (xato matnlari, formatlash) uchun joriy til
let currentLang: Lang = initialLang()
export const getLang = () => currentLang
export const getLocale = () => LOCALES[currentLang]

export type Vars = Record<string, string | number>

const fill = (text: string, vars?: Vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : text

export function createI18n<D extends Record<string, string>>(base: Record<BaseLang, D>) {
  type Key = keyof D & string
  const dicts: Record<Lang, D> = { ...base, uzc: cyrillicDict(base.uz) }

  const translate = (lang: Lang, key: Key, vars?: Vars) => fill(dicts[lang][key] ?? dicts.ru[key] ?? key, vars)

  // kalit lug'atda bo'lmasa (masalan admin yangi kategoriya qo'shgan) — asl matn qaytadi
  const translateOptional = (lang: Lang, key: string, fallback: string) =>
    (dicts[lang] as Record<string, string>)[key] ?? fallback

  type Ctx = {
    lang: Lang
    locale: string
    setLang: (lang: Lang) => void
    t: (key: Key, vars?: Vars) => string
    // ma'lumotlardagi qiymatlar: kategoriya, rang, teg ("cat:Футболки" kabi kalitlar)
    tOpt: (key: string, fallback: string) => string
  }

  const I18nContext = createContext<Ctx | null>(null)

  function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>(currentLang)

    useEffect(() => {
      document.documentElement.lang = lang === 'uz' ? 'uz-Latn' : lang === 'uzc' ? 'uz-Cyrl' : lang
    }, [lang])

    const setLang = useCallback((next: Lang) => {
      currentLang = next
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // saqlab bo'lmasa, faqat shu sahifada amal qiladi
      }
      setLangState(next)
    }, [])

    const t = useCallback((key: Key, vars?: Vars) => translate(lang, key, vars), [lang])
    const tOpt = useCallback((key: string, fallback: string) => translateOptional(lang, key, fallback), [lang])

    return (
      <I18nContext.Provider value={{ lang, locale: LOCALES[lang], setLang, t, tOpt }}>
        {children}
      </I18nContext.Provider>
    )
  }

  function useT() {
    const ctx = useContext(I18nContext)
    if (!ctx) throw new Error('useT must be used inside I18nProvider')
    return ctx
  }

  // React komponentidan tashqarida (lib/ fayllar) — joriy til bilan
  const tr = (key: Key, vars?: Vars) => translate(currentLang, key, vars)

  return { I18nProvider, useT, tr }
}

// Til tanlash tugmasi: globus + "RU", bosilganda uch tilli ro'yxat
export function LanguageSwitcher({
  lang,
  setLang,
  label,
  className = '',
}: {
  lang: Lang
  setLang: (lang: Lang) => void
  label: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0]

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <Tooltip label={label} hidden={open}>
        <button
          type="button"
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
        >
          <Globe className="size-4" />
          {current.short}
        </button>
      </Tooltip>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute top-full right-0 z-50 mt-1.5 w-40 animate-[fade-in_120ms_ease-out] rounded-xl border border-gray-200 bg-white/90 p-1 shadow-lg backdrop-blur-md"
        >
          {LANGS.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                type="button"
                onClick={() => {
                  setLang(l.code)
                  setOpen(false)
                }}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                  l.code === lang ? 'bg-gray-100 font-semibold text-gray-950' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="w-6 text-xs font-bold text-gray-400">{l.short}</span>
                <span className="flex-1">{l.label}</span>
                {l.code === lang && <Check className="size-4 text-gray-950" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
