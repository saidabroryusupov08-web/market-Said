import { ImageIcon } from 'lucide-react'
import type { Product } from '../../../data/products'

function ProductImage({ product }: { product: Product }) {
  if (product.image) {
    return (
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        className="size-full object-cover"
      />
    )
  }

  return (
    <div className="flex size-full items-center justify-center bg-gray-100">
      <ImageIcon className="size-20 text-gray-400" strokeWidth={1.5} />
    </div>
  )
}

export default ProductImage
