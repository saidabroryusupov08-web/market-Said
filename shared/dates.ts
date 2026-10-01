import { getLang, LOCALES, type Lang } from './i18n'

// Sana matnlari. Rus va ingliz tillari uchun brauzerning Intl'i ishlatiladi; o'zbekcha (lotin)
// ma'lumotlari ko'p brauzerlarda yo'q ("M10 2026" chiqadi), shuning uchun nomlar shu yerda.

const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
const UZ_MONTHS_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']
const UZ_WEEKDAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba']
// o'zbek kirill
const UZC_MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
const UZC_MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const UZC_WEEKDAYS = ['якшанба', 'душанба', 'сешанба', 'чоршанба', 'пайшанба', 'жума', 'шанба']

const isUz = (lang: Lang) => lang === 'uz' || lang === 'uzc'
const months = (lang: Lang) => (lang === 'uzc' ? UZC_MONTHS : UZ_MONTHS)

const capitalize = (s: string, lang: Lang) => s.charAt(0).toLocaleUpperCase(LOCALES[lang]) + s.slice(1)
const pad = (n: number) => String(n).padStart(2, '0')

// 'Сентябрь' / 'September' / 'Sentabr'
export function monthName(date: Date, lang: Lang = getLang()) {
  if (isUz(lang)) return capitalize(months(lang)[date.getMonth()], lang)
  return capitalize(date.toLocaleDateString(LOCALES[lang], { month: 'long' }), lang)
}

// 'сент' / 'Sep' / 'sen' (ruschadagi oxirgi nuqta olib tashlanadi)
export function monthShortName(date: Date, lang: Lang = getLang()) {
  if (isUz(lang)) return (lang === 'uzc' ? UZC_MONTHS_SHORT : UZ_MONTHS_SHORT)[date.getMonth()]
  return date.toLocaleDateString(LOCALES[lang], { month: 'short' }).replace(/\.$/, '')
}

// '1 октября' / 'October 1' / '1-oktabr'
export function dayMonth(date: Date, lang: Lang = getLang()) {
  if (isUz(lang)) return `${date.getDate()}-${months(lang)[date.getMonth()]}`
  return date.toLocaleDateString(LOCALES[lang], { day: 'numeric', month: 'long' })
}

// 'четверг, 1 октября' / 'Thursday, October 1' / 'payshanba, 1-oktabr'
export function weekdayDayMonth(date: Date, lang: Lang = getLang()) {
  if (isUz(lang)) return `${(lang === 'uzc' ? UZC_WEEKDAYS : UZ_WEEKDAYS)[date.getDay()]}, ${dayMonth(date, lang)}`
  return date.toLocaleDateString(LOCALES[lang], { weekday: 'long', day: 'numeric', month: 'long' })
}

// '01.10.2026' / '10/01/2026' (o'zbekchada ham kun.oy.yil)
export function numericDate(date: Date, lang: Lang = getLang()) {
  if (isUz(lang)) return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
  return date.toLocaleDateString(LOCALES[lang])
}

// '01.10.2026, 14:05'
export function numericDateTime(date: Date, lang: Lang = getLang()) {
  if (isUz(lang)) return `${numericDate(date, lang)}, ${pad(date.getHours())}:${pad(date.getMinutes())}`
  return date.toLocaleString(LOCALES[lang], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
