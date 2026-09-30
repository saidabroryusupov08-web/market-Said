import type { Product } from '../../../data/products'
import { getPrice, hasSizePriceRange, minPrice } from '../../../utils/price'

// o'lcham tanlanmagan bo'lsa "от $..." ko'rinadi, tanlangach o'sha o'lcham narxi
function ProductPrice({
  product,
  size,
  className,
}: {
  product: Product
  size: string
  className?: string
}) {
  // mahsulotda endi yo'q o'lcham tanlangan bo'lib qolsa, tanlanmagan deb hisoblanadi
  if (!product.sizes.includes(size)) size = ''
  const showFrom = !size && hasSizePriceRange(product)
  const price = size ? getPrice(product, size) : minPrice(product)

  return (
    <p className={className}>
      {showFrom && <span className="mr-1 text-base font-normal text-gray-500">от</span>}$
      {price.toFixed(2)}
    </p>
  )
}

export default ProductPrice
