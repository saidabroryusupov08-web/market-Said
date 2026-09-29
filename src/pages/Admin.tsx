import { createContext, useContext, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  ImageIcon,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useProducts } from '../context/ProductsContext'
import { categories } from '../data/products'
import type { NavTag, Product } from '../data/products'
import { loadFromStorage, saveToStorage } from '../utils/storage'

// navbar'dagi New Arrivals/Men/Women/Kids/Sale filtrlari shu teglar bo'yicha ishlaydi
const NAV_TAG_OPTIONS: { value: NavTag; label: string }[] = [
  { value: 'new', label: 'Новинки' },
  { value: 'men', label: 'Мужчинам' },
  { value: 'women', label: 'Женщинам' },
  { value: 'kids', label: 'Детям' },
  { value: 'sale', label: 'Скидки' },
]

function TagsSelect({ value, onChange }: { value: NavTag[]; onChange: (tags: NavTag[]) => void }) {
  const toggle = (tag: NavTag) => {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag])
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {NAV_TAG_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition select-none ${
            value.includes(opt.value)
              ? 'border-gray-950 bg-gray-950 text-white'
              : 'border-gray-300 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// alert()/confirm() o'rniga saytning o'zida ko'rinadigan xabar
const ToastContext = createContext<(message: string) => void>(() => {})
const useToast = () => useContext(ToastContext)

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2.5 text-red-600">
          <AlertTriangle className="size-5" />
          <h3 className="text-base font-semibold text-gray-950">Подтверждение</h3>
        </div>
        <p className="mb-5 text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Да, удалить
          </button>
        </div>
      </div>
    </div>
  )
}

// "S, M, L" -> ['S', 'M', 'L']
function splitList(text: string) {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// rasm localStorage'ga sig'ishi uchun kichraytirib, jpeg data URL qilib olinadi
function readImage(file: File, maxSize = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Не удалось загрузить изображение'))
    }
    img.src = url
  })
}

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-400 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]'
const labelClass = 'mb-1 block text-xs font-medium text-gray-500'
const iconBtn =
  'flex size-8 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-110'

const emptyForm = {
  name: '',
  category: categories[1],
  price: '',
  description: '',
  sizes: 'XS, S, M, L, XL',
  colors: '',
  image: '',
}

function AddProductForm({ onDone }: { onDone: () => void }) {
  const { addProduct } = useProducts()
  const showToast = useToast()
  const [form, setForm] = useState(emptyForm)
  const [tags, setTags] = useState<NavTag[]>([])
  // file input'ni tozalash uchun key o'zgartiriladi
  const [fileKey, setFileKey] = useState(0)

  const set = (field: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  async function onFile(file?: File) {
    if (!file) return
    try {
      set('image', await readImage(file))
    } catch {
      showToast('Не удалось загрузить изображение')
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const price = Number(form.price)
    const sizes = splitList(form.sizes)
    const colors = splitList(form.colors)
    if (!form.name.trim()) return showToast('Введите название')
    if (!(price > 0)) return showToast('Введите корректную цену')
    if (sizes.length === 0 || colors.length === 0)
      return showToast('Укажите хотя бы один размер и цвет')

    addProduct({
      name: form.name.trim(),
      category: form.category,
      price,
      description: form.description.trim(),
      sizes,
      colors,
      image: form.image.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    })
    setForm(emptyForm)
    setTags([])
    setFileKey((k) => k + 1)
    onDone()
  }

  return (
    <form onSubmit={submit} className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-950">Добавить новый товар</h2>
        <button
          type="button"
          aria-label="Закрыть"
          onClick={onDone}
          className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Название</label>
          <input
            className={inputClass}
            placeholder="Например: Классическая белая футболка"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Категория</label>
          <select
            className={inputClass}
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          >
            {categories
              .filter((c) => c !== 'Все')
              .map((c) => (
                <option key={c}>{c}</option>
              ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Цена ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
            placeholder="0.00"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Размеры</label>
          <input
            className={inputClass}
            placeholder="XS, S, M, L"
            value={form.sizes}
            onChange={(e) => set('sizes', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Цвета</label>
          <input
            className={inputClass}
            placeholder="Чёрный, Белый"
            value={form.colors}
            onChange={(e) => set('colors', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <label className={labelClass}>Описание</label>
          <textarea
            className={inputClass}
            rows={2}
            placeholder="Краткое описание товара"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <label className={labelClass}>Теги (для фильтров навбара, необязательно)</label>
          <TagsSelect value={tags} onChange={setTags} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className={`${inputClass} flex-1`}
            placeholder="URL изображения (необязательно)"
            value={form.image.startsWith('data:') ? '' : form.image}
            onChange={(e) => set('image', e.target.value)}
          />
          <span className="text-center text-xs text-gray-400 sm:px-1">или</span>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 transition hover:border-gray-400 hover:text-gray-700">
            <ImageIcon className="size-4" />
            Выбрать файл
            <input
              key={fileKey}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
        </div>

        {form.image && (
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-gray-200">
            <img src={form.image} alt="" className="size-full object-cover" />
            <button
              type="button"
              aria-label="Удалить изображение"
              onClick={() => set('image', '')}
              className="absolute top-0.5 right-0.5 rounded-full bg-white/90 p-0.5 text-gray-600 hover:text-black"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          <Plus className="size-4" />
          Добавить
        </button>
      </div>
    </form>
  )
}

type EditFormState = {
  name: string
  category: string
  price: string
  colors: string
  image: string
}

function toEditForm(product: Product): EditFormState {
  return {
    name: product.name,
    category: product.category,
    price: String(product.price),
    colors: product.colors.join(', '),
    image: product.image ?? '',
  }
}

function AdminProductCard({ product }: { product: Product }) {
  const { updateProduct, deleteProduct } = useProducts()
  const showToast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<EditFormState>(() => toEditForm(product))
  const [tags, setTags] = useState<NavTag[]>(() => product.tags ?? [])
  const [fileKey, setFileKey] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (field: keyof EditFormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const startEdit = () => {
    setForm(toEditForm(product))
    setTags(product.tags ?? [])
    setIsEditing(true)
  }

  async function onFile(file?: File) {
    if (!file) return
    try {
      set('image', await readImage(file))
    } catch {
      showToast('Не удалось загрузить изображение')
    }
  }

  function save() {
    const price = Number(form.price)
    const colors = splitList(form.colors)
    if (!form.name.trim()) return showToast('Введите название')
    if (!(price > 0)) return showToast('Введите корректную цену')
    if (colors.length === 0) return showToast('Укажите хотя бы один цвет')

    updateProduct(product.id, {
      name: form.name.trim(),
      category: form.category,
      price,
      colors,
      image: form.image.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    })
    setIsEditing(false)
  }

  return (
    <article className="group rounded-xl border border-gray-200 bg-white transition hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100">
        {(isEditing ? form.image : product.image) ? (
          <img
            src={isEditing ? form.image : product.image}
            alt={product.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-16 text-gray-400" strokeWidth={1.5} />
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                aria-label="Сохранить"
                onClick={save}
                className={`${iconBtn} text-gray-950`}
              >
                <Check className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Отмена"
                onClick={() => setIsEditing(false)}
                className={`${iconBtn} text-gray-500`}
              >
                <X className="size-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                aria-label="Редактировать"
                onClick={startEdit}
                className={`${iconBtn} text-gray-700 lg:opacity-0 lg:group-hover:opacity-100`}
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Удалить"
                onClick={() => setConfirmDelete(true)}
                className={`${iconBtn} text-red-600 lg:opacity-0 lg:group-hover:opacity-100`}
              >
                <Trash2 className="size-4" />
              </button>
            </>
          )}
        </div>

        {confirmDelete && (
          <ConfirmDialog
            message={`Удалить «${product.name}»? Это действие нельзя отменить.`}
            onConfirm={() => {
              deleteProduct(product.id)
              setConfirmDelete(false)
            }}
            onCancel={() => setConfirmDelete(false)}
          />
        )}

        {isEditing && (
          <label className="absolute inset-x-3 bottom-3 flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-white/95 py-1.5 text-xs font-medium text-gray-700 shadow-md backdrop-blur-sm hover:bg-white">
            <ImageIcon className="size-3.5" />
            Заменить изображение
            <input
              key={fileKey}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                onFile(e.target.files?.[0])
                setFileKey((k) => k + 1)
              }}
            />
          </label>
        )}
      </div>

      <div className="p-4 sm:p-[18px]">
        {isEditing ? (
          <div className="space-y-2.5">
            <input
              className={inputClass}
              placeholder="Название"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
            <div className="flex gap-2">
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                {categories
                  .filter((c) => c !== 'Все')
                  .map((c) => (
                    <option key={c}>{c}</option>
                  ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`${inputClass} w-24 shrink-0`}
                placeholder="Цена"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
              />
            </div>
            <input
              className={inputClass}
              placeholder="Цвета: Чёрный, Белый"
              value={form.colors}
              onChange={(e) => set('colors', e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="URL изображения"
              value={form.image.startsWith('data:') ? '' : form.image}
              onChange={(e) => set('image', e.target.value)}
            />
            <TagsSelect value={tags} onChange={setTags} />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg text-gray-950">{product.name}</h3>
              <span className="shrink-0 rounded-md border border-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-950">
                {product.category}
              </span>
            </div>
            <p className="mt-2 mb-2 text-xl font-medium text-gray-950">
              ${product.price.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">{product.colors.join(', ')}</p>
          </>
        )}
      </div>
    </article>
  )
}

function AddProductTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 text-gray-400 transition hover:border-gray-400 hover:bg-gray-50 hover:text-gray-600"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-white shadow-sm transition group-hover:scale-110">
        <Plus className="size-5" />
      </span>
      <span className="text-sm font-medium">Новый товар</span>
    </button>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4">
      <div className="animate-[fade-in_150ms_ease-out] rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
        {message}
      </div>
    </div>
  )
}

const ADMIN_PASSWORD_KEY = 'stylehub-admin-password'

type PasswordType = 'text' | 'number'
type StoredPassword = { value: string; type: PasswordType }

function loadStoredPassword(): StoredPassword | null {
  return loadFromStorage<StoredPassword | null>(ADMIN_PASSWORD_KEY, null)
}

function savePassword(p: StoredPassword) {
  saveToStorage(ADMIN_PASSWORD_KEY, p)
}

// parol tanlangan turga mos ekanini tekshiradi: raqam turi faqat 0-9,
// matn turi esa harf va belgilarni (-, _, !, @ va h.k.) qabul qiladi, faqat raqamsiz
function matchesType(value: string, type: PasswordType) {
  if (type === 'number') return /^[0-9]+$/.test(value)
  return /^[^0-9]+$/.test(value)
}

function PasswordField({
  value,
  onChange,
  placeholder,
  error,
  autoFocus,
  maxLength,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  error?: boolean
  autoFocus?: boolean
  maxLength?: number
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        autoFocus={autoFocus}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm outline-none transition focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] ${
          error
            ? 'border-red-400 focus:border-red-400'
            : 'border-gray-300 focus:border-gray-400'
        }`}
      />
      <button
        type="button"
        aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

function PasswordTypeSelect({
  value,
  onChange,
}: {
  value: PasswordType
  onChange: (type: PasswordType) => void
}) {
  const optionClass = (active: boolean) =>
    `rounded-lg border px-3 py-2 text-sm font-medium transition select-none ${
      active
        ? 'border-gray-950 bg-gray-950 text-white'
        : 'border-gray-300 text-gray-600 hover:bg-gray-100'
    }`

  return (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => onChange('text')} className={optionClass(value === 'text')}>
        Буквы/символы (a-z, !-_)
      </button>
      <button
        type="button"
        onClick={() => onChange('number')}
        className={optionClass(value === 'number')}
      >
        Цифры (0-9)
      </button>
    </div>
  )
}

// parol o'rnatish/o'zgartirish formasidagi umumiy mantiq (setup va change uchun bir xil)
function usePasswordForm(onValid: (password: StoredPassword) => void) {
  const [type, setType] = useState<PasswordType>('text')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const clearError = () => setError('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (type === 'number' && password.length !== 4)
      return setError('Цифровой пароль должен состоять ровно из 4 цифр')
    if (type === 'text' && password.length < 4)
      return setError('Пароль должен содержать не менее 4 символов')
    if (!matchesType(password, type))
      return setError(
        type === 'number'
          ? 'Пароль должен состоять только из цифр (0-9)'
          : 'В пароле не должно быть цифр (используйте буквы и символы)',
      )
    if (password !== confirm) return setError('Пароли не совпадают')
    onValid({ value: password, type })
  }

  return {
    type,
    setType: (t: PasswordType) => {
      setType(t)
      clearError()
    },
    password,
    setPassword: (v: string) => {
      setPassword(v)
      clearError()
    },
    confirm,
    setConfirm: (v: string) => {
      setConfirm(v)
      clearError()
    },
    error,
    submit,
  }
}

function AdminSetup({ onDone }: { onDone: (password: StoredPassword) => void }) {
  const form = usePasswordForm((password) => {
    savePassword(password)
    onDone(password)
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={form.submit}
        className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-5 flex flex-col items-center text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-gray-100">
            <Lock className="size-5 text-gray-700" />
          </span>
          <h1 className="text-lg font-semibold text-gray-950">Установите пароль администратора</h1>
          <p className="mt-1 text-sm text-gray-500">
            Этот экран появляется только при первом входе
          </p>
        </div>

        <label className={labelClass}>Тип пароля</label>
        <div className="mb-3">
          <PasswordTypeSelect value={form.type} onChange={form.setType} />
        </div>

        <label className={labelClass}>Новый пароль</label>
        <div className="mb-3">
          <PasswordField
            autoFocus
            value={form.password}
            onChange={form.setPassword}
            placeholder={form.type === 'number' ? 'Например: 2024' : 'Например: мой_пароль'}
            error={!!form.error}
            maxLength={form.type === 'number' ? 4 : undefined}
          />
        </div>

        <label className={labelClass}>Подтвердите пароль</label>
        <PasswordField
          value={form.confirm}
          onChange={form.setConfirm}
          placeholder="Введите ещё раз"
          error={!!form.error}
          maxLength={form.type === 'number' ? 4 : undefined}
        />

        {form.error && <p className="mt-2 text-xs text-red-600">{form.error}</p>}

        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-gray-950 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Сохранить и войти
        </button>
      </form>
    </div>
  )
}

function AdminLogin({
  stored,
  onSuccess,
}: {
  stored: StoredPassword
  onSuccess: () => void
}) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (password === stored.value) {
      onSuccess()
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-5 flex flex-col items-center text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-gray-100">
            <Lock className="size-5 text-gray-700" />
          </span>
          <h1 className="text-lg font-semibold text-gray-950">Админ-панель</h1>
          <p className="mt-1 text-sm text-gray-500">Введите пароль, чтобы продолжить</p>
        </div>

        <PasswordField
          autoFocus
          value={password}
          onChange={(v) => {
            setPassword(v)
            setError(false)
          }}
          placeholder="Пароль"
          error={error}
        />
        {error && <p className="mt-2 text-xs text-red-600">Неверный пароль</p>}

        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-gray-950 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Войти
        </button>

        <Link
          to="/"
          className="mt-3 block text-center text-xs text-gray-400 transition hover:text-gray-700"
        >
          Вернуться на сайт
        </Link>
      </form>
    </div>
  )
}

function ChangePasswordModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: (password: StoredPassword) => void
}) {
  const form = usePasswordForm((password) => {
    savePassword(password)
    onSaved(password)
  })

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={form.submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-950">Изменить пароль</h2>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <label className={labelClass}>Тип пароля</label>
        <div className="mb-3">
          <PasswordTypeSelect value={form.type} onChange={form.setType} />
        </div>

        <label className={labelClass}>Новый пароль</label>
        <div className="mb-3">
          <PasswordField
            autoFocus
            value={form.password}
            onChange={form.setPassword}
            placeholder={form.type === 'number' ? 'Например: 2024' : 'Например: мой_пароль'}
            error={!!form.error}
            maxLength={form.type === 'number' ? 4 : undefined}
          />
        </div>

        <label className={labelClass}>Подтвердите пароль</label>
        <PasswordField
          value={form.confirm}
          onChange={form.setConfirm}
          placeholder="Введите ещё раз"
          error={!!form.error}
          maxLength={form.type === 'number' ? 4 : undefined}
        />

        {form.error && <p className="mt-2 text-xs text-red-600">{form.error}</p>}

        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-gray-950 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Сохранить
        </button>
      </form>
    </div>
  )
}

function AdminDashboard({ onPasswordChanged }: { onPasswordChanged: () => void }) {
  const { products } = useProducts()
  const [isAdding, setIsAdding] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)

  const showToast = (message: string) => setToast({ id: Date.now(), message })

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={showToast}>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto w-[92%] max-w-6xl py-8">
          <div className="mb-4 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-950"
            >
              <ArrowLeft className="size-4" />
              Вернуться на сайт
            </Link>
            <button
              type="button"
              onClick={() => setIsChangingPassword(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
            >
              <KeyRound className="size-3.5" />
              Изменить пароль
            </button>
          </div>

          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-950">Админ-панель</h1>
              <p className="mt-1 text-sm text-gray-500">Товаров: {products.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AddProductTile onClick={() => setIsAdding(true)} />
            {products.map((product) => (
              <AdminProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {isAdding && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setIsAdding(false)}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <AddProductForm onDone={() => setIsAdding(false)} />
            </div>
          </div>
        )}

        {isChangingPassword && (
          <ChangePasswordModal
            onClose={() => setIsChangingPassword(false)}
            onSaved={() => {
              setIsChangingPassword(false)
              showToast('Пароль обновлён')
              onPasswordChanged()
            }}
          />
        )}

        {toast && <Toast key={toast.id} message={toast.message} />}
      </div>
    </ToastContext.Provider>
  )
}

function Admin() {
  const [stored, setStored] = useState<StoredPassword | null>(loadStoredPassword)
  // sahifa yangilansa (refresh), parol yana so'ralishi uchun bu holat hech qayerda saqlanmaydi
  const [authed, setAuthed] = useState(false)

  if (!stored) {
    return (
      <AdminSetup
        onDone={(password) => {
          setStored(password)
          setAuthed(true)
        }}
      />
    )
  }

  if (!authed) {
    return <AdminLogin stored={stored} onSuccess={() => setAuthed(true)} />
  }

  return <AdminDashboard onPasswordChanged={() => setStored(loadStoredPassword())} />
}

export default Admin
