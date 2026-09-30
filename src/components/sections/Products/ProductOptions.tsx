import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { useCart } from '../../../context/CartContext'
import type { Product } from '../../../data/products'
import Select from '../../ui/Select'

type ProductOptionsProps = {
  product: Product
  // o'lcham tashqarida saqlanadi, chunki narx tanlangan o'lchamga qarab o'zgaradi
  size: string
  onSizeChange: (size: string) => void
  onAdded?: () => void
}

function ProductOptions({ product, size: rawSize, onSizeChange, onAdded }: ProductOptionsProps) {
  const { addItem } = useCart()
  const [rawColor, setColor] = useState('')
  // admin o'lcham/rangni o'chirib yuborsa, eski tanlov hisobga olinmaydi
  // (aks holda maydonda "Размер" turgan bo'lsa ham tugma faol bo'lib qolardi)
  const size = product.sizes.includes(rawSize) ? rawSize : ''
  const color = product.colors.includes(rawColor) ? rawColor : ''
  const [added, setAdded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  // tugma ustiga kelinganda yoki bosilganda tanlanmagan maydonlar qizil bo'lib ko'rsatiladi
  const [hovering, setHovering] = useState(false)
  const [attempted, setAttempted] = useState(false)

  const canAdd = size !== '' && color !== ''
  const showHint = !canAdd && (hovering || attempted)

  const handleAdd = () => {
    if (!canAdd) return setAttempted(true)
    setAttempted(false)
    addItem(product, size, color)
    setAdded(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 1500)
    onAdded?.()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Select
          ariaLabel="Размер"
          placeholder="Размер"
          value={size}
          onChange={onSizeChange}
          options={product.sizes.map((s) => ({ value: s, label: s }))}
          invalid={showHint && !size}
        />
        <Select
          ariaLabel="Цвет"
          placeholder="Цвет"
          value={color}
          onChange={setColor}
          options={product.colors.map((c) => ({ value: c, label: c }))}
          invalid={showHint && !color}
        />
      </div>
      {/* disabled o'rniga aria-disabled: disabled tugma sichqoncha hodisalarini olmaydi,
          bizga esa hover'da maslahat ko'rsatish kerak */}
      <button
        type="button"
        aria-disabled={!canAdd}
        onClick={handleAdd}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={`flex h-9 items-center justify-center gap-2 rounded-md text-sm font-semibold text-white transition ${
          canAdd
            ? 'cursor-pointer bg-gray-950 hover:bg-gray-800'
            : 'cursor-not-allowed bg-gray-500'
        }`}
      >
        {added ? (
          <>
            <Check className="size-4" /> Добавлено
          </>
        ) : showHint ? (
          // maslahat tugmaning o'zida: alohida qator kartaning balandligini o'zgartirib yuborardi
          <span role="alert">
            {!size && !color ? 'Выберите размер и цвет' : !size ? 'Выберите размер' : 'Выберите цвет'}
          </span>
        ) : (
          'Добавить в корзину'
        )}
      </button>
    </div>
  )
}

export default ProductOptions
