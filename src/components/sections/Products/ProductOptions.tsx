import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { useCart } from '../../../context/CartContext'
import type { Product } from '../../../data/products'
import Select from '../../ui/Select'
import { colorLabel, sizeLabel } from '../../../../shared/dataLabels'
import { useT } from '../../../i18n'

type ProductOptionsProps = {
  product: Product
  // o'lcham tashqarida saqlanadi, chunki narx tanlangan o'lchamga qarab o'zgaradi
  size: string
  onSizeChange: (size: string) => void
  onAdded?: () => void
}

function ProductOptions({ product, size: rawSize, onSizeChange, onAdded }: ProductOptionsProps) {
  const { addItem } = useCart()
  const { t, lang } = useT()
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
          ariaLabel={t('products.size')}
          placeholder={t('products.size')}
          value={size}
          onChange={onSizeChange}
          options={product.sizes.map((s) => ({ value: s, label: sizeLabel(lang, s) }))}
          invalid={showHint && !size}
        />
        <Select
          ariaLabel={t('products.color')}
          placeholder={t('products.color')}
          value={color}
          onChange={setColor}
          options={product.colors.map((c) => ({ value: c, label: colorLabel(lang, c) }))}
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
            <Check className="size-4" /> {t('products.added')}
          </>
        ) : showHint ? (
          // maslahat tugmaning o'zida: alohida qator kartaning balandligini o'zgartirib yuborardi
          <span role="alert">
            {!size && !color ? t('products.pickBoth') : !size ? t('products.pickSize') : t('products.pickColor')}
          </span>
        ) : (
          t('products.addToCart')
        )}
      </button>
    </div>
  )
}

export default ProductOptions
