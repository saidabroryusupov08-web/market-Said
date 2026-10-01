// Buyurtma turlari va holatlari (admin panel)

export type OrderStatus = 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export const ORDER_STATUSES: { value: OrderStatus; label: string; className: string }[] = [
  { value: 'new', label: 'Новый', className: 'bg-rose-50 text-rose-600 ring-rose-200' },
  { value: 'processing', label: 'В работе', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { value: 'shipped', label: 'Отправлен', className: 'bg-violet-50 text-violet-700 ring-violet-200' },
  { value: 'delivered', label: 'Доставлен', className: 'bg-green-50 text-green-700 ring-green-200' },
  { value: 'cancelled', label: 'Отменён', className: 'bg-gray-100 text-gray-500 ring-gray-200' },
]

export type Order = {
  id: number
  created_at: string
  status: OrderStatus
  customer_name: string
  phone: string
  email: string | null
  address: string
  comment: string | null
  items: {
    productId: number
    name: string
    size: string
    color: string
    quantity: number
    price: number
    image: string | null
  }[]
  total: number | string
  admin_note: string | null
  device: string | null
  browser: string | null
}
