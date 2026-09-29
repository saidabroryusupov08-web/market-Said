import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { Product } from '../../../data/products'
import ProductImage from './ProductImage'
import ProductOptions from './ProductOptions'

type QuickViewModalProps = {
  product: Product | null
  onClose: () => void
}

function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  useEffect(() => {
    if (!product) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [product, onClose])

  if (!product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-[fade-in_300ms_ease-out] bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label={product.name}
        className="relative grid max-h-[90vh] w-full max-w-3xl animate-[zoom-in_300ms_ease-out] overflow-y-auto rounded-xl bg-white shadow-2xl md:grid-cols-2 md:overflow-visible"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-md bg-white/80 p-1.5 text-gray-700 transition hover:bg-gray-100 hover:text-black"
        >
          <X className="size-4" />
        </button>

        <div className="aspect-square overflow-hidden rounded-t-xl md:rounded-l-xl md:rounded-tr-none">
          <ProductImage product={product} />
        </div>

        <div className="flex flex-col p-6">
          <span className="w-fit rounded-md border border-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-950">
            {product.category}
          </span>
          <h2 className="mt-3 text-2xl text-gray-950">{product.name}</h2>
          <p className="mt-2 text-2xl font-medium text-gray-950">
            ${product.price.toFixed(2)}
          </p>
          <p className="mt-4 mb-6 text-gray-500">{product.description}</p>
          <div className="mt-auto">
            <ProductOptions product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickViewModal
