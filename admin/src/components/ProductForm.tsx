import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ImageIcon, Loader2, Upload, X } from 'lucide-react'
import { resolveImage } from '../../../shared/images'
import { autoSizePrice } from '../../../shared/price'
import { categories, NAV_TAGS, type NavTag, type Product } from '../../../shared/products'
import { categoryLabel, tagLabel } from '../../../shared/dataLabels'
import { useT } from '../i18n'
import { useAdminData, type ProductInput } from '../lib/data'
import Select from './Select'
import { resizeImage } from '../lib/image'
import { useToast } from './ui'
import { glassChip, inputClass, labelClass, primaryBtn, secondaryBtn } from './styles'

// "S, M, L" -> ['S', 'M', 'L']
const splitList = (text: string) =>
  text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

type FormState = {
  name: string
  category: string
  price: string
  description: string
  sizes: string
  colors: string
  image: string
  tags: NavTag[]
  sizePrices: Record<string, string>
  oldPrice: string
  isActive: boolean
}

function toForm(product?: Product): FormState {
  return {
    name: product?.name ?? '',
    category: product?.category ?? categories[1],
    price: product ? String(product.price) : '',
    description: product?.description ?? '',
    sizes: (product?.sizes ?? ['XS', 'S', 'M', 'L', 'XL']).join(', '),
    colors: product?.colors.join(', ') ?? '',
    image: product?.image ?? '',
    tags: product?.tags ?? [],
    sizePrices: Object.fromEntries(
      Object.entries(product?.sizePrices ?? {}).map(([size, price]) => [size, String(price)]),
    ),
    oldPrice: product?.oldPrice ? String(product.oldPrice) : '',
    isActive: product?.isActive !== false,
  }
}

function ProductForm({ product, onDone }: { product?: Product; onDone: () => void }) {
  const { createProduct, updateProduct, uploadImage, removeImage } = useAdminData()
  const showToast = useToast()
  const { t, lang } = useT()
  const [form, setForm] = useState<FormState>(() => toForm(product))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Forma ochiq paytida yuklangan, lekin saqlanmay qolgan rasmlar (bekor qilinganda yoki
  // boshqasi bilan almashtirilganda) forma yopilishi bilan Storage'dan o'chiriladi
  const trackerRef = useRef({
    uploaded: [] as string[],
    saved: undefined as string | undefined,
    remove: removeImage,
  })
  useEffect(() => {
    trackerRef.current.remove = removeImage
  })
  useEffect(() => {
    const tracker = trackerRef.current
    return () => {
      tracker.uploaded.filter((url) => url !== tracker.saved).forEach((url) => tracker.remove(url))
      tracker.uploaded = []
    }
  }, [])

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const sizes = splitList(form.sizes)
  const basePrice = Number(form.price)
  const preview = resolveImage(form.image)

  const onFile = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return showToast(t('common.pickImage'), 'error')
    setUploading(true)
    try {
      const result = await uploadImage(await resizeImage(file))
      if ('error' in result) showToast(result.error, 'error')
      else {
        trackerRef.current.uploaded.push(result.url)
        set('image', result.url)
      }
    } catch {
      showToast(t('common.imageUploadFailed'), 'error')
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const colors = splitList(form.colors)
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = t('form.enterName')
    if (!(basePrice > 0)) next.price = t('form.pricePositive')
    if (sizes.length === 0) next.sizes = t('form.needSize')
    if (colors.length === 0) next.colors = t('form.needColor')
    const oldPrice = form.oldPrice.trim() ? Number(form.oldPrice) : undefined
    if (oldPrice !== undefined && !(oldPrice > basePrice))
      next.oldPrice = t('form.oldPriceGreater')
    if (Object.keys(next).length > 0) return setErrors(next)

    const sizePrices = Object.fromEntries(
      sizes
        .map((size) => [size, Number(form.sizePrices[size])] as const)
        .filter(([, price]) => Number.isFinite(price) && price > 0),
    )
    const input: ProductInput = {
      name: form.name.trim(),
      category: form.category,
      price: Math.round(basePrice * 100) / 100,
      description: form.description.trim(),
      sizes,
      colors,
      image: form.image.trim() || undefined,
      tags: form.tags,
      sizePrices: Object.keys(sizePrices).length > 0 ? sizePrices : undefined,
      oldPrice: oldPrice !== undefined ? Math.round(oldPrice * 100) / 100 : undefined,
      isActive: form.isActive,
    }

    setSaving(true)
    const error = product ? await updateProduct(product.id, input) : await createProduct(input)
    setSaving(false)
    if (error) return showToast(error, 'error')
    trackerRef.current.saved = input.image
    showToast(product ? t('form.saved') : t('form.added'))
    onDone()
  }

  const fieldError = (field: keyof FormState) =>
    errors[field] && <p className="mt-1 text-xs text-red-600">{errors[field]}</p>
  const errorBorder = (field: keyof FormState) => (errors[field] ? 'border-red-400' : '')

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 p-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[160px_1fr]">
        {/* rasm */}
        <div>
          <span className={labelClass}>{t('form.photo')}</span>
          <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {preview ? (
              <img src={preview} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-gray-300">
                <ImageIcon className="size-10" strokeWidth={1.5} />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 className="size-6 animate-spin text-gray-500" />
              </div>
            )}
            {preview && !uploading && (
              <button
                type="button"
                aria-label={t('form.removePhoto')}
                onClick={() => set('image', '')}
                className="absolute top-1.5 right-1.5 cursor-pointer rounded-full bg-white/90 p-1 text-gray-600 shadow hover:text-black"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <label className={`${secondaryBtn} mt-2 w-full`}>
            <Upload className="size-3.5" />
            {t('form.upload')}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                onFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
          <input
            className={`${inputClass} mt-2 h-8 text-xs`}
            placeholder={t('form.orUrl')}
            value={/^https?:/.test(form.image) ? form.image : ''}
            onChange={(e) => set('image', e.target.value)}
          />
        </div>

        {/* asosiy ma'lumot */}
        <div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="p-name">
              {t('form.name')}
            </label>
            <input
              id="p-name"
              autoFocus
              className={`${inputClass} ${errorBorder('name')}`}
              placeholder={t('form.namePlaceholder')}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
            {fieldError('name')}
          </div>
          <div>
            <label className={labelClass} htmlFor="p-category">
              {t('form.category')}
            </label>
            <Select
              id="p-category"
              ariaLabel={t('form.category')}
              value={form.category}
              onChange={(v) => set('category', v)}
              options={categories
                .filter((c) => c !== 'Все')
                .map((c) => ({ value: c, label: categoryLabel(lang, c) }))}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="p-price">
              {t('form.price')}
            </label>
            <input
              id="p-price"
              type="number"
              step="0.01"
              min="0"
              className={`${inputClass} ${errorBorder('price')}`}
              placeholder="0.00"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
            />
            {fieldError('price')}
          </div>
          <div>
            <label className={labelClass} htmlFor="p-old-price">
              {t('form.oldPrice')}
            </label>
            <input
              id="p-old-price"
              type="number"
              step="0.01"
              min="0"
              className={`${inputClass} ${errorBorder('oldPrice')}`}
              placeholder={t('form.oldPricePlaceholder')}
              value={form.oldPrice}
              onChange={(e) => set('oldPrice', e.target.value)}
            />
            {fieldError('oldPrice')}
            {!errors.oldPrice && Number(form.oldPrice) > basePrice && basePrice > 0 && (
              <p className="mt-1 text-xs text-red-600">
                {t('form.onSiteDiscount', { percent: Math.round((1 - basePrice / Number(form.oldPrice)) * 100) })}
              </p>
            )}
          </div>
          <div>
            <span className={labelClass}>{t('form.visibility')}</span>
            {/* o'chirilsa mahsulot saytdan yashiriladi, lekin bazada qoladi */}
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => set('isActive', !form.isActive)}
              className="flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg border border-gray-300 bg-white px-3 text-left text-sm"
            >
              <span
                className={`relative h-5 w-9 shrink-0 rounded-full transition ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${form.isActive ? 'left-[18px]' : 'left-0.5'}`}
                />
              </span>
              {form.isActive ? t('form.visible') : t('form.hidden')}
            </button>
          </div>
          <div>
            <label className={labelClass} htmlFor="p-sizes">
              {t('form.sizes')}
            </label>
            <input
              id="p-sizes"
              className={`${inputClass} ${errorBorder('sizes')}`}
              placeholder="XS, S, M, L"
              value={form.sizes}
              onChange={(e) => set('sizes', e.target.value)}
            />
            {fieldError('sizes')}
          </div>
          <div>
            <label className={labelClass} htmlFor="p-colors">
              {t('form.colors')}
            </label>
            <input
              id="p-colors"
              className={`${inputClass} ${errorBorder('colors')}`}
              placeholder={t('form.colorsPlaceholder')}
              value={form.colors}
              onChange={(e) => set('colors', e.target.value)}
            />
            {fieldError('colors')}
          </div>
        </div>
      </div>

      {sizes.length > 1 && (
        <div>
          <span className={labelClass}>{t('form.sizePrices')}</span>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
            {sizes.map((size) => (
              <label key={size} className="flex flex-col gap-0.5">
                <span className="truncate text-[11px] text-gray-500">{size}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`${inputClass} h-9 px-2`}
                  placeholder={
                    basePrice > 0 ? autoSizePrice({ price: basePrice, sizes }, size).toFixed(2) : t('form.auto')
                  }
                  value={form.sizePrices[size] ?? ''}
                  onChange={(e) => set('sizePrices', { ...form.sizePrices, [size]: e.target.value })}
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="p-description">
          {t('form.description')}
        </label>
        <textarea
          id="p-description"
          rows={3}
          className={`${inputClass} h-auto py-2`}
          placeholder={t('form.descriptionPlaceholder')}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>

      <div>
        <span className={labelClass}>{t('form.tags')}</span>
        <div className="flex flex-wrap gap-1.5">
          {NAV_TAGS.map((tag) => {
            const on = form.tags.includes(tag.value)
            return (
              <button
                key={tag.value}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  set('tags', on ? form.tags.filter((x) => x !== tag.value) : [...form.tags, tag.value])
                }
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition ${
                  on
                    ? glassChip
                    : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tagLabel(lang, tag.value)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <button type="button" onClick={onDone} className={`${secondaryBtn} h-10`}>
          {t('common.cancel')}
        </button>
        <button type="submit" disabled={saving || uploading} className={primaryBtn}>
          {saving ? t('common.saving') : product ? t('common.save') : t('products.add')}
        </button>
      </div>
    </form>
  )
}

export default ProductForm
