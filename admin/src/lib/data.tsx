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
import {
  DEFAULT_SITE_SETTINGS,
  settingsFromRow,
  settingsToRow,
  type SiteSettings,
  type SiteSettingsRow,
} from '../../../shared/siteSettings'
import { tr } from '../i18n'
import type { Order } from './orders'

export type { Order, OrderStatus } from './orders'

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
  orders: Order[]
  productsLoaded: boolean
  messagesLoaded: boolean
  ordersLoaded: boolean
  loadError: string
  unread: number
  newOrders: number
  // xato bo'lsa uning matni, hammasi yuklansa null
  reload: () => Promise<string | null>
  createProduct: (input: ProductInput) => Result
  updateProduct: (id: number, input: ProductInput) => Result
  deleteProduct: (id: number) => Result
  importDefaults: () => Result
  uploadImage: (file: Blob) => Promise<{ url: string } | { error: string }>
  removeImage: (url?: string) => Promise<void>
  setRead: (id: number, isRead: boolean) => Result
  markAllRead: () => Result
  deleteMessage: (id: number) => Result
  updateOrder: (id: number, changes: Partial<Pick<Order, 'status' | 'admin_note'>>) => Result
  // ombordagi qoldiqni qo'lda to'g'rilash: faqat o'zgargan o'lchamlar (vals) va hisobdan chiqarilganlar (clear)
  saveStock: (id: number, vals: Record<string, number>, clear: string[]) => Result
  // omborga kelgan tovar: o'lcham -> necha dona qo'shiladi (bazada atomik qo'shiladi)
  addStock: (id: number, amounts: Record<string, number>) => Result
  deleteOrder: (id: number) => Result
  siteSettings: SiteSettings
  saveSiteSettings: (next: SiteSettings) => Result
}

// yangi xabar va buyurtmalar shu oraliqda o'zi tekshiriladi
const MESSAGES_REFRESH_MS = 30_000

const AdminDataContext = createContext<AdminDataValue | null>(null)

// Supabase bir so'rovda ko'pi bilan 1000 qator beradi: hammasi bo'laklab olinadi
// (aks holda buyurtmalar ko'paygach analitika va tushum jimgina kam ko'rsatardi)
const PAGE = 1000
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string; code?: string } | null }>,
) {
  const all: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1)
    if (error) return { data: null, error }
    all.push(...(data ?? []))
    if (!data || data.length < PAGE) return { data: all, error: null }
  }
}

// Supabase xatosini admin tushunadigan matnga aylantirish
function describe(error: { message: string; code?: string } | null): string | null {
  if (!error) return null
  console.error(error)
  if (error.code === '42501' || /row-level security|permission/i.test(error.message))
    return tr('error.noRights')
  if (/fetch|network/i.test(error.message)) return tr('error.network')
  return tr('error.generic', { message: error.message })
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const db = supabase!
  const [products, setProducts] = useState<Product[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [productsLoaded, setProductsLoaded] = useState(false)
  const [messagesLoaded, setMessagesLoaded] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoaded, setOrdersLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS)

  const fail = useCallback((error: Parameters<typeof describe>[0]) => {
    const text = describe(error) ?? tr('error.unknown')
    setLoadError(text)
    return text
  }, [])

  const loadProducts = useCallback(async () => {
    const { data, error } = await fetchAll<ProductRow>((from, to) =>
      db.from('products').select('*').order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, to),
    )
    if (error) return fail(error)
    setProducts(data!.map(fromRow))
    setProductsLoaded(true)
    return null
  }, [db, fail])

  const loadMessages = useCallback(async () => {
    const { data, error } = await fetchAll<Message>((from, to) =>
      db.from('messages').select('*').order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, to),
    )
    if (error) return fail(error)
    setMessages(data!)
    setMessagesLoaded(true)
    return null
  }, [db, fail])

  const loadOrders = useCallback(async () => {
    const { data, error } = await fetchAll<Order>((from, to) =>
      db.from('orders').select('*').order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, to),
    )
    if (error) return fail(error)
    setOrders(data!)
    setOrdersLoaded(true)
    return null
  }, [db, fail])

  const loadSettings = useCallback(async () => {
    const { data, error } = await db.from('site_settings').select('*').eq('id', 1).maybeSingle()
    if (!error) setSiteSettings(settingsFromRow(data as SiteSettingsRow | null))
  }, [db])

  // xato yozuvi faqat hammasi muvaffaqiyatli yuklangandan keyin olinadi
  // (oldin bir ro'yxat kelishi boshqasining xatosini yashirib yuborardi)
  const reload = useCallback(async () => {
    const results = await Promise.all([loadProducts(), loadMessages(), loadOrders(), loadSettings()])
    const error = results.find((r) => typeof r === 'string') ?? null
    if (!error) setLoadError('')
    return error
  }, [loadProducts, loadMessages, loadOrders, loadSettings])

  useEffect(() => {
    // effekt ichida to'g'ridan setState chaqirilmasligi uchun taymer orqali
    const first = setTimeout(reload, 0)
    const timer = setInterval(async () => {
      const results = await Promise.all([loadMessages(), loadOrders()])
      // aloqa tiklansa, eski "aloqa yo'q" yozuvi o'zi yo'qoladi
      if (results.every((r) => r === null)) setLoadError('')
    }, MESSAGES_REFRESH_MS)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [reload, loadMessages, loadOrders])

  // ----- mahsulotlar -----
  const createProduct = async (input: ProductInput) => {
    const { data, error } = await db.from('products').insert(toRow({ ...input, stock: undefined })).select().single()
    if (error) return describe(error)
    setProducts((prev) => [fromRow(data as ProductRow), ...prev])
    return null
  }

  const updateProduct = async (id: number, input: ProductInput) => {
    const oldImage = products.find((p) => p.id === id)?.image
    const { data, error } = await db
      .from('products')
      // stock faqat ombor funksiyalari orqali o'zgaradi: bu yerda eski nusxa yozilib ketmasin
      .update(toRow({ ...input, stock: undefined }))
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
    if (error) return { error: describe(error) ?? tr('error.upload') }
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

  // ----- buyurtmalar -----
  // Buyurtma bekor qilinsa — mahsulotlar omborga qaytadi; bekor qilish ortga olinsa — qayta band
  // qilinadi (omborda yetmasa, holat o'zgarmaydi). Hisob yuritilmagan o'lchamlarga tegilmaydi.
  const updateOrder = async (id: number, changes: Partial<Pick<Order, 'status' | 'admin_note'>>) => {
    const order = orders.find((o) => o.id === id)
    const wasCancelled = order?.status === 'cancelled'
    const stockMove =
      order && changes.status && wasCancelled !== (changes.status === 'cancelled')
        ? order.items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity }))
        : null

    if (stockMove && wasCancelled) {
      const { data, error } = await db.rpc('reserve_stock', { items: stockMove })
      if (error) return describe(error)
      const shortage = data as { name: string; size: string; available: number } | null
      if (shortage) return tr('stock.cannotRestore', { name: shortage.name, size: shortage.size, count: shortage.available })
    }

    const previous = orders
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, ...changes } : o)))
    const { error } = await db.from('orders').update(changes).eq('id', id)
    if (error) {
      setOrders(previous)
      if (stockMove && wasCancelled) await db.rpc('release_stock', { items: stockMove })
      return describe(error)
    }
    if (stockMove && !wasCancelled) {
      const { error: releaseError } = await db.rpc('release_stock', { items: stockMove })
      if (releaseError) return describe(releaseError)
    }
    if (stockMove) await loadProducts()
    return null
  }

  const saveStock = async (id: number, vals: Record<string, number>, clear: string[]) => {
    const { data, error } = await db.rpc('set_stock', { product_id: id, vals, clear })
    if (error) return describe(error)
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: (data as Record<string, number>) ?? p.stock } : p)))
    return null
  }

  const addStock = async (id: number, amounts: Record<string, number>) => {
    const { data, error } = await db.rpc('add_stock', { product_id: id, amounts })
    if (error) return describe(error)
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: (data as Record<string, number>) ?? p.stock } : p)))
    return null
  }

  // ----- sayt bosh sahifasi -----
  const saveSiteSettings = async (next: SiteSettings) => {
    const { error } = await db.from('site_settings').update(settingsToRow(next)).eq('id', 1)
    if (error) return describe(error)
    const old = siteSettings.heroImage
    setSiteSettings(settingsFromRow({ id: 1, ...settingsToRow(next) }))
    // eski yuklangan rasm Storage'da keraksiz qolmasin
    if (old !== next.heroImage) await removeImage(old)
    return null
  }

  // Hali jo'natilmagan (yangi / jarayonda) buyurtma o'chirilsa, uning mahsuloti omborga qaytadi.
  // Jo'natilgan/yetkazilgan — tovar allaqachon chiqib ketgan; bekor qilingan — qaytarilgan.
  const deleteOrder = async (id: number) => {
    const order = orders.find((o) => o.id === id)
    const { error } = await db.from('orders').delete().eq('id', id)
    if (error) return describe(error)
    setOrders((list) => list.filter((o) => o.id !== id))
    if (order && (order.status === 'new' || order.status === 'processing')) {
      const items = order.items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity }))
      const { error: releaseError } = await db.rpc('release_stock', { items })
      if (releaseError) return describe(releaseError)
      await loadProducts()
    }
    return null
  }

  return (
    <AdminDataContext.Provider
      value={{
        products,
        messages,
        orders,
        productsLoaded,
        messagesLoaded,
        ordersLoaded,
        loadError,
        unread: messages.filter((m) => !m.is_read).length,
        newOrders: orders.filter((o) => o.status === 'new').length,
        updateOrder,
        saveStock,
        addStock,
        siteSettings,
        saveSiteSettings,
        deleteOrder,
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
