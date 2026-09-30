// Do'kon (src/) va admin panel (admin/) uchun umumiy mahsulot ma'lumotlari

// navbar'dagi (New Arrivals, Men, Women, Kids, Sale) filtrlar shu teglar bo'yicha ishlaydi
export type NavTag = 'new' | 'men' | 'women' | 'kids' | 'sale'

export const NAV_TAGS: { value: NavTag; label: string }[] = [
  { value: 'new', label: 'Новинки' },
  { value: 'men', label: 'Мужчинам' },
  { value: 'women', label: 'Женщинам' },
  { value: 'kids', label: 'Детям' },
  { value: 'sale', label: 'Скидки' },
]

export type Product = {
  id: number
  name: string
  category: string
  price: number
  description: string
  sizes: string[]
  colors: string[]
  // shared/assets dagi rasm nomi (masalan 'tee-sheep-black') yoki to'liq URL;
  // ko'rsatishda resolveImage() orqali haqiqiy manzilga aylantiriladi
  image?: string
  tags?: NavTag[]
  // o'lcham bo'yicha alohida narx (admin kiritadi); berilmagan o'lcham uchun avtomatik hisoblanadi
  sizePrices?: Record<string, number>
  createdAt?: string
}

export const categories = [
  'Все',
  'Футболки',
  'Куртки',
  'Платья',
  'Обувь',
  'Свитеры',
  'Худи',
  'Брюки',
  'Рубашки',
  'Шорты',
  'Аксессуары',
]

const clothingSizes = ['XS', 'S', 'M', 'L', 'XL']

// Rasmi yo'q mahsulot qo'shilsa, kulrang placeholder ko'rinadi
export const products: Product[] = [
  {
    id: 9,
    name: 'Футболка «Горный баран»',
    category: 'Футболки',
    price: 32.99,
    description: 'Чёрная хлопковая футболка с фотопринтом горного пейзажа.',
    sizes: clothingSizes,
    colors: ['Чёрный'],
    image: 'tee-sheep-black',
    tags: ['men', 'sale'],
  },
  {
    id: 10,
    name: 'Футболка «Речной каньон»',
    category: 'Футболки',
    price: 34.99,
    description: 'Чёрная футболка с рисованной иллюстрацией речного каньона.',
    sizes: clothingSizes,
    colors: ['Чёрный'],
    image: 'tee-canyon-black',
    tags: ['men'],
  },
  {
    id: 11,
    name: 'Футболка «Лазурный берег»',
    category: 'Футболки',
    price: 36.99,
    description: 'Оверсайз чёрная футболка с винтажным принтом спортивного клуба Ривьеры.',
    sizes: clothingSizes,
    colors: ['Чёрный', 'Белый'],
    image: 'tee-cote-dazur-black',
    tags: ['men', 'new'],
  },
  {
    id: 12,
    name: 'Футболка «Кавказское наследие»',
    category: 'Футболки',
    price: 36.99,
    description: 'Белая хлопковая футболка с ярким принтом кавказского горного села.',
    sizes: clothingSizes,
    colors: ['Белый'],
    image: 'tee-caucasus-white',
    tags: ['women'],
  },
  {
    id: 13,
    name: 'Футболка «Минимал Гора»',
    category: 'Футболки',
    price: 29.99,
    description: 'Чёрная футболка с минималистичным изображением горы в треугольнике.',
    sizes: clothingSizes,
    colors: ['Чёрный'],
    image: 'tee-mountain-black',
    tags: ['men'],
  },
  {
    id: 14,
    name: 'Футболка «Искусство Ренессанса»',
    category: 'Футболки',
    price: 38.99,
    description: 'Чёрная футболка с современной интерпретацией классической картины эпохи Ренессанса.',
    sizes: clothingSizes,
    colors: ['Чёрный'],
    image: 'tee-renaissance-black',
    tags: ['women', 'new'],
  },
  {
    id: 15,
    name: 'Оверсайз футболка «Классический автомобиль»',
    category: 'Футболки',
    price: 39.99,
    description: 'Оверсайз чёрная футболка с кинематографичным фотопринтом винтажного автомобиля.',
    sizes: clothingSizes,
    colors: ['Чёрный'],
    image: 'tee-classic-car-black',
    tags: ['men'],
  },
  {
    id: 16,
    name: 'Кожаный чехол-кошелёк для телефона',
    category: 'Аксессуары',
    price: 79.99,
    description:
      'Премиальный кожаный чехол-книжка для телефона с отделениями для карт и съёмным магнитным кошельком.',
    sizes: ['Один размер'],
    colors: ['Коричневый'],
    image: 'acc-phone-case-wallet',
    tags: ['sale'],
  },
  {
    id: 17,
    name: 'Городской рюкзак',
    category: 'Аксессуары',
    price: 129.99,
    description: 'Водоотталкивающий рюкзак из прорезиненной ткани с мягким отделением для ноутбука.',
    sizes: ['Один размер'],
    colors: ['Тёмно-синий'],
    image: 'acc-backpack-navy',
    tags: ['new'],
  },
  {
    id: 18,
    name: 'Кожаная сумочка на кнопке',
    category: 'Аксессуары',
    price: 24.99,
    description: 'Компактная сумочка из искусственной кожи с пружинной застёжкой для повседневных мелочей.',
    sizes: ['Один размер'],
    colors: ['Чёрный'],
    image: 'acc-leather-pouch',
    tags: ['sale'],
  },
  {
    id: 1,
    name: 'Нейлоновые шорты на кулиске',
    category: 'Шорты',
    price: 34.99,
    description:
      'Лёгкие шорты из мятого нейлона с эластичным поясом на кулиске и карманами на молнии.',
    sizes: clothingSizes,
    colors: ['Тёмно-синий'],
    image: 'shorts-nylon-navy',
    tags: ['men', 'sale'],
  },
  {
    id: 22,
    name: 'Шорты карго',
    category: 'Шорты',
    price: 39.99,
    description: 'Свободные хлопковые шорты карго с накладным карманом сбоку.',
    sizes: clothingSizes,
    colors: ['Оливковый'],
    image: 'shorts-cargo-olive',
    tags: ['men'],
  },
  {
    id: 2,
    name: 'Брюки карго с ремнём',
    category: 'Брюки',
    price: 89.99,
    description:
      'Хлопковые брюки карго широкого кроя со складками, накладными карманами и ремнём в комплекте.',
    sizes: clothingSizes,
    colors: ['Оливковый'],
    image: 'pants-cargo-olive',
    tags: ['men'],
  },
  {
    id: 3,
    name: 'Классическая белая футболка',
    category: 'Футболки',
    price: 29.99,
    description: 'Вневременная белая хлопковая футболка с традиционным принтом танцоров.',
    sizes: clothingSizes,
    colors: ['Белый', 'Чёрный', 'Серый'],
    image: 'tee-dancers-white',
    tags: ['women', 'sale'],
  },
  {
    id: 4,
    name: 'Замшевая куртка',
    category: 'Куртки',
    price: 189.99,
    description: 'Мягкая замшевая куртка со стойкой-воротником, застёжкой на кнопки и эластичным низом.',
    sizes: clothingSizes,
    colors: ['Коричневый'],
    image: 'jacket-suede-brown',
    tags: ['men'],
  },
  {
    id: 5,
    name: 'Многослойная хлопковая рубашка',
    category: 'Рубашки',
    price: 119.99,
    description:
      'Хрустящая хлопковая рубашка из поплина с многослойной планкой, белым воротником и манжетами.',
    sizes: clothingSizes,
    colors: ['Голубой'],
    image: 'shirt-layered-blue',
    tags: ['men'],
  },
  {
    id: 6,
    name: 'Замшевые кроссовки на овчине',
    category: 'Обувь',
    price: 149.99,
    description: 'Замшевые кроссовки с уютной подкладкой из овчины на прозрачной резиновой подошве.',
    sizes: ['37', '38', '39', '40', '41', '42'],
    colors: ['Бежевый'],
    image: 'shoes-suede-sneakers',
    tags: ['women'],
  },
  {
    id: 7,
    name: 'Комплект «Химар и абая»',
    category: 'Платья',
    price: 99.99,
    description: 'Длинный развевающийся химар в комплекте с классической чёрной абаей.',
    sizes: ['S/M', 'L/XL'],
    colors: ['Тауп', 'Чёрный'],
    image: 'dress-khimar-abaya',
    tags: ['women'],
  },
  {
    id: 8,
    name: 'Шерстяная водолазка',
    category: 'Свитеры',
    price: 129.99,
    description: 'Свободная шерстяная водолазка с широкими рукавами и трикотажной отделкой.',
    sizes: clothingSizes,
    colors: ['Серый'],
    image: 'sweater-turtleneck-grey',
    tags: ['women'],
  },
  {
    id: 21,
    name: 'Вязаный свитер с короткой молнией',
    category: 'Свитеры',
    price: 139.99,
    description: 'Трикотажный свитер в резинку с отложным воротником и молнией на горловине.',
    sizes: clothingSizes,
    colors: ['Тауп'],
    image: 'sweater-half-zip-taupe',
    tags: ['men', 'new'],
  },
  {
    id: 19,
    name: 'Худи на молнии',
    category: 'Худи',
    price: 89.99,
    description: 'Оверсайз флисовое худи на молнии во всю длину с кожаным брелоком на бегунке.',
    sizes: clothingSizes,
    colors: ['Бордовый'],
    image: 'hoodie-zip-burgundy',
    tags: ['men', 'sale'],
  },
  {
    id: 20,
    name: 'Худи из кашемировой смеси',
    category: 'Худи',
    price: 159.99,
    description: 'Мягкое худи из кашемировой смеси с молнией золотистого цвета и наконечниками на шнурке.',
    sizes: clothingSizes,
    colors: ['Тёмно-синий'],
    image: 'hoodie-zip-navy',
    tags: ['women', 'new'],
  },
]
