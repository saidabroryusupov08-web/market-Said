import type { BaseLang, Lang } from './i18n'
import { latinToCyrillic } from './translit'
import type { NavTag } from './products'

// Bazadagi qiymatlar (kategoriya, rang, o'lcham, teg) ruscha saqlanadi — bu ularning
// ko'rinadigan tarjimasi. Lug'atda yo'q qiymat (admin o'zi yozgan yangi rang) o'zgarishsiz ko'rinadi.

const CATEGORIES: Record<string, { en: string; uz: string }> = {
  Все: { en: 'All', uz: 'Hammasi' },
  Футболки: { en: 'T-shirts', uz: 'Futbolkalar' },
  Куртки: { en: 'Jackets', uz: 'Kurtkalar' },
  Платья: { en: 'Dresses', uz: "Ayollar ko'ylaklari" },
  Обувь: { en: 'Shoes', uz: 'Poyabzal' },
  Свитеры: { en: 'Sweaters', uz: 'Sviterlar' },
  Худи: { en: 'Hoodies', uz: 'Xudilar' },
  Брюки: { en: 'Trousers', uz: 'Shimlar' },
  Рубашки: { en: 'Shirts', uz: "Ko'ylaklar" },
  Шорты: { en: 'Shorts', uz: 'Shortiklar' },
  Аксессуары: { en: 'Accessories', uz: 'Aksessuarlar' },
}

const COLORS: Record<string, { en: string; uz: string }> = {
  Чёрный: { en: 'Black', uz: 'Qora' },
  Черный: { en: 'Black', uz: 'Qora' },
  Белый: { en: 'White', uz: 'Oq' },
  Бежевый: { en: 'Beige', uz: 'Bej' },
  Бордовый: { en: 'Burgundy', uz: "To'q qizil" },
  Голубой: { en: 'Light blue', uz: 'Havorang' },
  Коричневый: { en: 'Brown', uz: 'Jigarrang' },
  Оливковый: { en: 'Olive', uz: 'Zaytun rang' },
  Серый: { en: 'Grey', uz: 'Kulrang' },
  Тауп: { en: 'Taupe', uz: 'Kulrang-jigarrang' },
  'Тёмно-синий': { en: 'Navy', uz: "To'q ko'k" },
  Синий: { en: 'Blue', uz: "Ko'k" },
  Красный: { en: 'Red', uz: 'Qizil' },
  Зелёный: { en: 'Green', uz: 'Yashil' },
}

const SIZES: Record<string, { en: string; uz: string }> = {
  'Один размер': { en: 'One size', uz: 'Yagona o‘lcham' },
}

const TAGS: Record<NavTag, Record<BaseLang, string>> = {
  new: { ru: 'Новинки', en: 'New in', uz: 'Yangiliklar' },
  men: { ru: 'Мужчинам', en: 'Men', uz: 'Erkaklar' },
  women: { ru: 'Женщинам', en: 'Women', uz: 'Ayollar' },
  kids: { ru: 'Детям', en: 'Kids', uz: 'Bolalar' },
  sale: { ru: 'Скидки', en: 'Sale', uz: 'Chegirmalar' },
}

const pick = (table: Record<string, { en: string; uz: string }>, lang: Lang, value: string) => {
  if (lang === 'ru' || !table[value]) return value
  return lang === 'uzc' ? latinToCyrillic(table[value].uz) : table[value][lang]
}

export const categoryLabel = (lang: Lang, value: string) => pick(CATEGORIES, lang, value)
export const colorLabel = (lang: Lang, value: string) => pick(COLORS, lang, value)
export const sizeLabel = (lang: Lang, value: string) => pick(SIZES, lang, value)
export const tagLabel = (lang: Lang, tag: NavTag) => {
  if (!TAGS[tag]) return tag
  return lang === 'uzc' ? latinToCyrillic(TAGS[tag].uz) : TAGS[tag][lang]
}
