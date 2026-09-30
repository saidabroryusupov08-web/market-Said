import { useCallback, useMemo, useState } from 'react'
import { SearchX, X } from 'lucide-react'
import { useCatalogFilter } from '../../../context/CatalogFilterContext'
import { useSearch } from '../../../context/SearchContext'
import { categories, products as defaultProducts, type Product } from '../../../data/products'
import { useProducts } from '../../../context/ProductsContext'
import { minPrice } from '../../../utils/price'
import Select from '../../ui/Select'
import ProductCard from './ProductCard'
import QuickViewModal from './QuickViewModal'

// admin qo'shgan mahsulotlar products.ts da yo'q
const defaultIds = new Set(defaultProducts.map((p) => p.id))

const tagLabels: Record<string, string> = {
  new: 'Новинки',
  men: 'Мужчинам',
  women: 'Женщинам',
  kids: 'Детям',
  sale: 'Скидки',
}

const sortOptions = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'name', label: 'По названию' },
  { value: 'price-asc', label: 'Цена: по возрастанию' },
  { value: 'price-desc', label: 'Цена: по убыванию' },
]

function Products() {
  const [category, setCategory] = useState('Все')
  const [sort, setSort] = useState('newest')
  const [quickView, setQuickView] = useState<Product | null>(null)
  const closeQuickView = useCallback(() => setQuickView(null), [])

  const { query, setQuery } = useSearch()
  const { products } = useProducts()
  const { activeTag, setActiveTag } = useCatalogFilter()
  const search = query.trim().toLowerCase()

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      if (category !== 'Все' && product.category !== category) return false
      if (activeTag && !product.tags?.includes(activeTag)) return false
      if (!search) return true
      return [product.name, product.category, product.description, ...product.colors]
        .join(' ')
        .toLowerCase()
        .includes(search)
    })

    return filtered.sort((a, b) => {
      // kartada ko'rinadigan "от" narxi bo'yicha (o'lchamga alohida narx qo'yilgan bo'lishi mumkin)
      if (sort === 'price-asc') return minPrice(a) - minPrice(b)
      if (sort === 'price-desc') return minPrice(b) - minPrice(a)
      if (sort === 'newest') {
        // yangi qo'shilganlar tepada (eng oxirgisi birinchi), qolganlari nom bo'yicha
        const aNew = !defaultIds.has(a.id)
        const bNew = !defaultIds.has(b.id)
        if (aNew && bNew) return b.id - a.id
        if (aNew !== bNew) return aNew ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }, [products, category, sort, search, activeTag])

  return (
    <section id="products" className="bg-white py-16 lg:py-20">
      <div className="mx-auto w-[90%] lg:w-[70%]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-medium text-gray-950">Наши товары</h2>
            <p className="mt-2 text-gray-500">
              Откройте для себя всю коллекцию premium-одежды
            </p>
          </div>
          <Select
            ariaLabel="Сортировка"
            value={sort}
            onChange={setSort}
            options={sortOptions}
            className="w-full sm:w-56"
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition select-none ${
                category === item
                  ? 'bg-gray-950 text-white'
                  : 'bg-gray-100 text-gray-950 hover:bg-gray-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {activeTag && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-500">Фильтр:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-950 py-1 pr-1.5 pl-3 text-xs font-semibold text-white">
              {tagLabels[activeTag] ?? activeTag}
              <button
                type="button"
                aria-label="Сбросить фильтр"
                onClick={() => setActiveTag(null)}
                className="rounded-full p-0.5 transition hover:bg-white/20"
              >
                <X className="size-3.5" />
              </button>
            </span>
          </div>
        )}

        {search && (
          <p className="mt-6 text-sm text-gray-500">
            Найдено: {visibleProducts.length} для{' '}
            <span className="font-semibold text-gray-950">"{query.trim()}"</span>
            {category !== 'Все' && <> в категории «{category}»</>}
            <button
              type="button"
              onClick={() => setQuery('')}
              className="ml-3 cursor-pointer font-semibold text-gray-950 underline-offset-2 hover:underline"
            >
              Очистить поиск
            </button>
          </p>
        )}

        {visibleProducts.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={setQuickView}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center">
            <SearchX className="mb-4 size-12 text-gray-400" strokeWidth={1.5} />
            <p className="text-lg text-gray-950">Товары не найдены</p>
            <p className="mt-1 text-gray-500">Попробуйте другое слово или категорию</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setCategory('Все')
                setActiveTag(null)
              }}
              className="mt-6 cursor-pointer rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Показать все товары
            </button>
          </div>
        )}
      </div>

      <QuickViewModal product={quickView} onClose={closeQuickView} />
    </section>
  )
}

export default Products
