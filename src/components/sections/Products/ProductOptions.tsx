import { useState } from 'react'
import { Check } from 'lucide-react'
import { useCart } from '../../../context/CartContext'
import type { Product } from '../../../data/products'
import Select from '../../ui/Select'

type ProductOptionsProps = {
  product: Product
  onAdded?: () => void
}

function ProductOptions({ product, onAdded }: ProductOptionsProps) {
  const { addItem } = useCart()
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [added, setAdded] = useState(false)

  const canAdd = size !== '' && color !== ''

  const handleAdd = () => {
    if (!canAdd) return
    addItem(product, size, color)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    onAdded?.()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Select
          ariaLabel="Size"
          placeholder="Size"
          value={size}
          onChange={setSize}
          options={product.sizes.map((s) => ({ value: s, label: s }))}
        />
        <Select
          ariaLabel="Color"
          placeholder="Color"
          value={color}
          onChange={setColor}
          options={product.colors.map((c) => ({ value: c, label: c }))}
        />
      </div>
      <button
        type="button"
        disabled={!canAdd}
        onClick={handleAdd}
        title={canAdd ? undefined : 'Select size and color'}
        className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-gray-950 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-500"
      >
        {added ? (
          <>
            <Check className="size-4" /> Added
          </>
        ) : (
          'Add to Cart'
        )}
      </button>
    </div>
  )
}

export default ProductOptions
