import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { products as defaultProducts, type Product } from '../../../shared/products'
import {
  fromRow,
  PRODUCT_IMAGES_BUCKET,
  supabase,
  toRow,
  type ProductRow,
} from '../../../shared/supabase'

// Admin paneldagi barcha ma'lumotlar bitta joyda: bosh sahifa, jadvallar, qidiruv va
// menyudagi "yangi xabarlar" soni bir xil ro'yxatni ko'radi.
// Har bir amal xato matnini qaytaradi (null = muvaffaqiyatli), UI uni toast'da ko'rsatadi.

export type Message = {
  id: number
  created_at: string
  type: string
  email: string
  device: string | null
  browser: string | null
  language: string | null
  screen: string | null
  cart: { name: string; size: string; color: string; quantity: number; price: number }[]
  total: number | string
  is_read: boolean
}

export type ProductInput = Omit<Product, 'id' | 'createdAt'>

type Result = Promise<string | null>

type AdminDataValue = {
  products: Product[]
  messages: Message[]
  productsLoaded: boolean
  messagesLoaded: boolean
  loadError: string
  unread: number
  reload: () => Promise<void>
  createProduct: (input: ProductInput) => Result
  updateProduct: (id: number, input: ProductInput) => Result
  deleteProduct: (id: number) => Result
  importDefaults: () => Result
  uploadImage: (file: Blob) => Promise<{ url: string } | { error: string }>
  removeImage: (url?: string) => Promise<void>
  setRead: (id: number, isRead: boolean) => Result
  markAllRead: () => Result
  deleteMessage: (id: number) => Result
}

const MESSAGES_REFRESH_MS = 30_000

const AdminDataContext = createContext<AdminDataValue | null>(null)

// Supabase xatosini admin tushunadigan matnga aylantirish
function describe(error: { message: string; code?: string } | null): string | null {
  if (!error) return null
  console.error(error)
  if (error.code === '42501' || /row-level security|permission/i.test(error.message))
    return 'Нет прав. Войдите заново под аккаунтом администратора.'
  if (/fetch|network/i.test(error.message)) return 'Нет связи с сервером. Проверьте интернет.'
  return `Ошибка: ${error.message}`
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const db = supabase!
  const [products, setProducts] = useState<Product[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [productsLoaded, setProductsLoaded] = useState(false)
  const [messagesLoaded, setMessagesLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')

  const loadProducts = useCallback(async () => {
    const { data, error } = await db
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return setLoadError(describe(error) ?? '')
    setProducts((data as ProductRow[]).map(fromRow))
    setProductsLoaded(true)
  }, [db])

  const loadMessages = useCallback(async () => {
    const { data, error } = await db
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) return setLoadError(describe(error) ?? '')
    setMessages(data as Message[])
    setMessagesLoaded(true)
    setLoadError('')
  }, [db])

  const reload = useCallback(async () => {
    await Promise.all([loadProducts(), loadMessages()])
  }, [loadProducts, loadMessages])

  useEffect(() => {
    // effekt ichida to'g'ridan setState chaqirilmasligi uchun taymer orqali
    const first = setTimeout(reload, 0)
    const timer = setInterval(loadMessages, MESSAGES_REFRESH_MS)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [reload, loadMessages])

  // ----- mahsulotlar -----
  const createProduct = async (input: ProductInput) => {
    const { data, error } = await db.from('products').insert(toRow(input)).select().single()
    if (error) return describe(error)
    setProducts((prev) => [fromRow(data as ProductRow), ...prev])
    return null
  }

  const updateProduct = async (id: number, input: ProductInput) => {
    const oldImage = products.find((p) => p.id === id)?.image
    const { data, error } = await db
      .from('products')
      .update(toRow(input))
      .eq('id', id)
      .select()
      .single()
    if (error) return describe(error)
    setProducts((prev) => prev.map((p) => (p.id === id ? fromRow(data as ProductRow) : p)))
    // rasm almashtirilgan bo'lsa, eskisi Storage'da keraksiz qolmasin
    if (oldImage !== input.image) await removeImage(oldImage)
    return null
  }

  const deleteProduct = async (id: number) => {
    const image = products.find((p) => p.id === id)?.image
    const { error } = await db.from('products').delete().eq('id', id)
    if (error) return describe(error)
    setProducts((prev) => prev.filter((p) => p.id !== id))
    await removeImage(image)
    return null
  }

  // birinchi marta: saytdagi standart 22 ta mahsulot bazaga yoziladi
  const importDefaults = async () => {
    // toRow id'ni olmaydi: baza yangi id beradi
    const { error } = await db.from('products').insert(defaultProducts.map((p) => toRow(p)))
    if (error) return describe(error)
    await loadProducts()
    return null
  }

  const uploadImage = async (file: Blob) => {
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
    const { error } = await db.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, file, { contentType: 'image/jpeg', cacheControl: '31536000' })
    if (error) return { error: describe(error) ?? 'Ошибка загрузки' }
    return { url: db.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl }
  }

  // faqat bizning bucket'dagi rasm o'chiriladi (standart rasmlar va tashqi URL'lar emas).
  // Boshqa mahsulot ham shu rasmni ishlatsa, o'chirilmaydi. Xato bo'lsa jim: asosiy amal buzilmaydi.
  const removeImage = async (url?: string) => {
    const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`
    if (!url || !url.includes(marker)) return
    const stillUsed = products.filter((p) => p.image === url).length > 1
    if (stillUsed) return
    const path = decodeURIComponent(url.split(marker)[1].split('?')[0])
    const { error } = await db.storage.from(PRODUCT_IMAGES_BUCKET).remove([path])
    if (error) console.warn('Eski rasmni o‘chirib bo‘lmadi:', error.message)
  }

  // ----- xabarlar (o'zgarish darhol ko'rsatiladi, xato bo'lsa ro'yxat qayta yuklanadi) -----
  const mutateMessages = async (
    optimistic: (list: Message[]) => Message[],
    run: () => PromiseLike<{ error: { message: string; code?: string } | null }>,
  ) => {
    setMessages(optimistic)
    const { error } = await run()
    if (error) await loadMessages()
    return describe(error)
  }

  const setRead = (id: number, isRead: boolean) =>
    mutateMessages(
      (list) => list.map((m) => (m.id === id ? { ...m, is_read: isRead } : m)),
      () => db.from('messages').update({ is_read: isRead }).eq('id', id),
    )

  const markAllRead = () =>
    mutateMessages(
      (list) => list.map((m) => ({ ...m, is_read: true })),
      () => db.from('messages').update({ is_read: true }).eq('is_read', false),
    )

  const deleteMessage = (id: number) =>
    mutateMessages(
      (list) => list.filter((m) => m.id !== id),
      () => db.from('messages').delete().eq('id', id),
    )

  return (
    <AdminDataContext.Provider
      value={{
        products,
        messages,
        productsLoaded,
        messagesLoaded,
        loadError,
        unread: messages.filter((m) => !m.is_read).length,
        reload,
        createProduct,
        updateProduct,
        deleteProduct,
        importDefaults,
        uploadImage,
        removeImage,
        setRead,
        markAllRead,
        deleteMessage,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminData() {
  const context = useContext(AdminDataContext)
  if (!context) throw new Error('useAdminData must be used inside AdminDataProvider')
  return context
}
