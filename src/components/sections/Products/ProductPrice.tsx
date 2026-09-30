import { discountPercent, type Product } from '../../../data/products'
import { getPrice, hasSizePriceRange, minPrice } from '../../../utils/price'

// o'lcham tanlanmagan bo'lsa "от $..." ko'rinadi, tanlangach o'sha o'lcham narxi.
// Chegirma bo'lsa yonida eski narx ustidan chizilgan holda turadi.
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
  // eski narx asosiy narxga nisbatan berilgan: o'lcham narxiga shu nisbatda ko'chiriladi
  const discount = discountPercent(product)
  const oldPrice = discount > 0 ? (price * product.oldPrice!) / product.price : 0

  return (
    <p className={className}>
      {showFrom && <span className="mr-1 text-base font-normal text-gray-500">от</span>}
      <span className={discount > 0 ? 'text-red-600' : undefined}>${price.toFixed(2)}</span>
      {discount > 0 && (
        <span className="ml-2 text-base font-normal text-gray-400 line-through">
          ${oldPrice.toFixed(2)}
        </span>
      )}
    </p>
  )
}

export default ProductPrice
