// Ko'p tilli qidiruv: mahsulotlar ruscha yozilgan, lekin foydalanuvchi inglizcha ("hoodie"),
// o'zbekcha ("qora kurtka") yoki ruschani lotinda ("futbolka") yozsa ham topilsin.
//  1) kirill -> lotin transliteratsiya + talaffuzga yaqin "buklash" (kh=x=h, y=i ...)
//  2) inglizcha / o'zbekcha so'zlar lug'ati -> ruscha o'zak

const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  // o'zbek kirill harflari
  ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
}

// "худи" -> "hudi", "hoodie" -> "hudi", "futbolka" == "футболка"
export function fold(text: string): string {
  return [...text.toLowerCase()]
    .map((ch) => CYRILLIC[ch] ?? ch)
    .join('')
    .replace(/['`ʻʼ‘’]/g, '')
    .replace(/sch/g, 'sh')
    .replace(/kh|x/g, 'h')
    .replace(/zh/g, 'j')
    .replace(/ts/g, 's')
    .replace(/ph/g, 'f')
    .replace(/ck|c|q/g, 'k')
    .replace(/w/g, 'v')
    .replace(/oo/g, 'u')
    .replace(/ee|ie/g, 'i')
    .replace(/y([aeou])/g, '$1')
    .replace(/y/g, 'i')
    .replace(/(.)\1+/g, '$1')
}

// [qidiruvdagi so'zlar (en / uz / lotin)], [ruscha o'zaklar — mahsulot matnida qidiriladi]
const DICTIONARY: [string[], string[]][] = [
  [['hoodie', 'hoody', 'kapyushon'], ['худи', 'толстовк']],
  [['tshirt', 't-shirt', 'tee', 'futbolka', 'maika'], ['футболк']],
  [['shirt', 'koylak', 'rubashka'], ['рубашк']],
  [['jacket', 'coat', 'kurtka', 'palto'], ['куртк', 'пальто']],
  [['dress', 'abaya', 'libos'], ['плать', 'абай', 'химар']],
  [['shoes', 'shoe', 'sneakers', 'sneaker', 'trainers', 'poyabzal', 'krossovka', 'tufli'], ['обув', 'кроссовк']],
  [['sweater', 'jumper', 'pullover', 'turtleneck', 'sviter', 'kofta'], ['свитер', 'водолазк']],
  [['pants', 'trousers', 'jeans', 'cargo', 'shim', 'bryuki'], ['брюк', 'карго']],
  [['shorts', 'shortik'], ['шорт']],
  [['accessories', 'accessory', 'aksessuar'], ['аксессуар']],
  [['bag', 'backpack', 'sumka', 'ryukzak'], ['рюкзак', 'сумк']],
  [['wallet', 'pouch', 'hamyon', 'purse'], ['кошел', 'клатч', 'кожан']],
  [['phone', 'case', 'telefon', 'chexol'], ['чехол', 'телефон']],
  [['men', 'male', 'erkak', 'erkaklar'], ['мужск']],
  [['women', 'woman', 'female', 'ayol', 'ayollar'], ['женск']],
  [['kids', 'child', 'bolalar'], ['детск']],
  // ranglar
  [['black', 'qora'], ['черн']],
  [['white', 'oq'], ['бел']],
  [['blue', 'navy', 'kok', 'havorang'], ['син', 'голуб']],
  [['red', 'burgundy', 'qizil'], ['красн', 'бордов']],
  [['green', 'olive', 'yashil'], ['зелен', 'олив']],
  [['brown', 'jigarrang'], ['коричн']],
  [['grey', 'gray', 'kulrang'], ['сер']],
  [['beige', 'bej', 'taupe'], ['беж', 'тауп']],
]

// qisman yozilgan so'z ham ishlaydi: "hoo" -> hoodie (kamida 3 harf)
function translations(token: string): string[] {
  const out: string[] = []
  for (const [keys, targets] of DICTIONARY) {
    const hit = keys.some((key) => {
      const k = key.replace(/-/g, '')
      return k === token || (token.length >= 3 && (k.startsWith(token) || token.startsWith(k)))
    })
    if (hit) out.push(...targets)
  }
  return out
}

// Qidiruv so'rovidan tekshiruvchi funksiya yasaydi: har bir so'z (bo'sh joy bilan ajratilgan)
// matnda qaysidir ko'rinishda uchrashi kerak ("qora kurtka" -> ikkalasi ham)
export function createMatcher(query: string): (text: string) => boolean {
  const tokens = query
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/['‘’ʻ-]/g, '')
    .split(/[\s,]+/)
    .filter(Boolean)
  if (tokens.length === 0) return () => true

  const variants = tokens.map((token) => {
    const set = new Set([token])
    // 1–2 harfli so'zni transliteratsiya qilish juda ko'p keraksiz natija beradi
    if (token.length >= 3) set.add(fold(token))
    for (const t of translations(token)) {
      set.add(t)
      set.add(fold(t))
    }
    return [...set].filter((v) => v.length > 0)
  })

  return (text: string) => {
    const lower = text.toLowerCase().replace(/ё/g, 'е')
    const folded = fold(lower)
    return variants.every((options) => options.some((v) => lower.includes(v) || folded.includes(v)))
  }
}
