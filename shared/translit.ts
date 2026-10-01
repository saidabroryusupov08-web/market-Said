// O'zbekcha lotin yozuvidan kirill yozuviga o'girish. Kirill lug'atlari alohida yozilmaydi —
// lotin lug'atidan shu funksiya bilan avtomatik hosil qilinadi (bitta matnni ikki joyda
// yangilash shart emas).
// O'girilmaydi: {name} kabi o'rinlar, email manzillar, brend/texnik so'zlar (Email, 2FA, Gmail...)
// va katta harfli qisqartmalar (QR, CSV, VITE_SUPABASE_URL).

const KEEP =
  /\{\w+\}|[\w.%+-]+@[\w.-]+|cX-shop|\b(?:Email|email|Gmail|Google|Authenticator|Microsoft|Supabase|Vercel|Cookie|px)\b|\b[A-Z0-9_]{2,}\b|https?:\/\/\S+/g

// to'g'ridan-to'g'ri o'girilganda noto'g'ri chiqadigan o'zlashma so'zlar (kichik harfda)
const WORDS: Record<string, string> = {
  kolleksiya: 'коллекция',
  poyabzal: 'пойабзал',
  kolleksiyasi: 'коллекцияси',
  kolleksiyasini: 'коллекциясини',
  kolleksiyasida: 'коллекциясида',
  aksessuarlar: 'аксессуарлар',
  sentabr: 'сентябрь',
  oktabr: 'октябрь',
  noyabr: 'ноябрь',
  dekabr: 'декабрь',
  yanvar: 'январь',
  fevral: 'февраль',
  aprel: 'апрель',
  iyun: 'июнь',
  iyul: 'июль',
}

const SINGLE: Record<string, string> = {
  a: 'а', b: 'б', c: 'с', d: 'д', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л',
  m: 'м', n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в',
  x: 'х', y: 'й', z: 'з',
}

const APOS = /['ʻʼ‘’`]/
const VOWELS = 'aeiouAEIOU'

function convertWord(word: string): string {
  const lower = word.toLowerCase()
  if (WORDS[lower]) return matchCase(word, WORDS[lower])

  let out = ''
  for (let i = 0; i < word.length; i++) {
    const ch = word[i]
    const low = ch.toLowerCase()
    const next = word[i + 1]?.toLowerCase() ?? ''
    const upper = ch !== low
    const put = (cyr: string) => {
      out += upper ? cyr.charAt(0).toUpperCase() + cyr.slice(1) : cyr
    }

    if ((low === 'o' || low === 'g') && next && APOS.test(next)) {
      put(low === 'o' ? 'ў' : 'ғ')
      i++
    } else if (low === 's' && next === 'h') {
      put('ш')
      i++
    } else if (low === 'c' && next === 'h') {
      put('ч')
      i++
    } else if (low === 'y' && next && 'oaue'.includes(next) && !APOS.test(word[i + 2] ?? '')) {
      put({ o: 'ё', a: 'я', u: 'ю', e: 'е' }[next]!)
      i++
    } else if (low === 'e') {
      // so'z boshida va unlidan keyin — э
      put(i === 0 || VOWELS.includes(word[i - 1]) ? 'э' : 'е')
    } else if (APOS.test(ch)) {
      out += 'ъ'
    } else {
      out += SINGLE[low] ? (upper ? SINGLE[low].toUpperCase() : SINGLE[low]) : ch
    }
  }
  return out
}

function matchCase(source: string, cyr: string) {
  if (source === source.toUpperCase()) return cyr.toUpperCase()
  if (source[0] === source[0].toUpperCase()) return cyr.charAt(0).toUpperCase() + cyr.slice(1)
  return cyr
}

// harflar va so'z ichidagi tutuq belgilari bitta so'z deb olinadi
const WORD = /[A-Za-z]+(?:['ʻʼ‘’`][A-Za-z]+)*['ʻʼ‘’`]?/g

function convertPlain(text: string) {
  return text.replace(WORD, convertWord)
}

export function latinToCyrillic(text: string): string {
  let out = ''
  let last = 0
  for (const m of text.matchAll(KEEP)) {
    out += convertPlain(text.slice(last, m.index)) + m[0]
    last = m.index! + m[0].length
  }
  return out + convertPlain(text.slice(last))
}

export function cyrillicDict<D extends Record<string, string>>(dict: D): D {
  return Object.fromEntries(Object.entries(dict).map(([k, v]) => [k, latinToCyrillic(v)])) as D
}
