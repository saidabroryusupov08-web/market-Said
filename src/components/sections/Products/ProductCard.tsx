import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useWishlist } from '../../../context/WishlistContext'
import type { Product } from '../../../data/products'
import ProductImage from './ProductImage'
import ProductOptions from './ProductOptions'
import ProductPrice from './ProductPrice'

type ProductCardProps = {
  product: Product
  onQuickView: (product: Product) => void
}

function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { isLiked, toggleLike: toggleWishlist } = useWishlist()
  const liked = isLiked(product.id)
  // layk qaytarib olinganda tugma sichqoncha kartadan chiqquncha yashirin turadi
  const [hideLike, setHideLike] = useState(false)
  // faqat foydalanuvchi bosganda sakraydi, sahifa yuklanganda emas
  const [popped, setPopped] = useState(false)
  const [size, setSize] = useState('')

  const toggleLike = () => {
    if (liked) setHideLike(true)
    setPopped(!liked)
    toggleWishlist(product.id)
  }

  const likeVisibility = liked
    ? ''
    : hideLike
      ? 'lg:pointer-events-none lg:opacity-0'
      : 'lg:-translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-visible:translate-y-0 lg:focus-visible:opacity-100'

  return (
    <article
      className="group flex flex-col rounded-xl border border-gray-200 bg-white transition hover:shadow-lg"
      onMouseLeave={() => setHideLike(false)}
    >
      <div className="relative aspect-square overflow-hidden rounded-t-xl">
        <ProductImage product={product} />
        <button
          type="button"
          aria-label={liked ? 'Убрать из избранного' : 'Добавить в избранное'}
          aria-pressed={liked}
          onClick={toggleLike}
          className={`absolute top-3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-full bg-white shadow-md transition duration-300 hover:scale-110 ${likeVisibility}`}
        >
          <Heart
            className={`size-[18px] transition-colors ${
              liked ? 'fill-[#ff3040] text-[#ff3040]' : 'text-gray-800'
            } ${liked && popped ? 'animate-[heart-pop_600ms_ease-out]' : ''}`}
          />
        </button>
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="absolute inset-x-4 bottom-4 cursor-pointer rounded-md bg-gray-600/80 py-2 text-sm font-semibold text-white backdrop-blur-sm transition duration-300 hover:bg-gray-700/90 lg:translate-y-4 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus:translate-y-0 lg:focus:opacity-100"
        >
          Быстрый просмотр
        </button>
      </div>

      {/* nom uzun-qisqa bo'lsa ham narx va tugmalar hamma kartada bir qatorda turishi uchun pastga suriladi */}
      <div className="flex flex-1 flex-col p-4 sm:p-[18px]">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg text-gray-950">{product.name}</h3>
          <span className="shrink-0 rounded-md border border-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-950">
            {product.category}
          </span>
        </div>
        <div className="mt-auto pt-2">
          <ProductPrice
            product={product}
            size={size}
            className="mb-4 text-xl font-medium text-gray-950"
          />
          <ProductOptions product={product} size={size} onSizeChange={setSize} />
        </div>
      </div>
    </article>
  )
}

export default ProductCard
