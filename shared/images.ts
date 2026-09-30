// Standart mahsulotlarning rasmlari saytning o'zida (shared/assets) turadi.
// Bazada ular faqat nomi bilan saqlanadi ('tee-sheep-black'), chunki build'dan keyin
// fayl manzili o'zgaradi (hash qo'shiladi). Admin yuklagan rasmlar esa to'liq URL bo'ladi.

const files = import.meta.glob<string>('./assets/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
})

const builtIn: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.replace(/^.*\/|\.png$/g, ''), url]),
)

export function resolveImage(image?: string | null): string | undefined {
  if (!image) return undefined
  if (/^(https?:|data:|blob:|\/)/.test(image)) return image
  return builtIn[image]
}
