import { useCallback, useMemo, useState } from 'react'
import { SearchX, X } from 'lucide-react'
import { useCatalogFilter } from '../../../context/CatalogFilterContext'
import { useSearch } from '../../../context/SearchContext'
import { categories, type Product } from '../../../data/products'
import { categoryLabel, tagLabel } from '../../../../shared/dataLabels'
import { useT } from '../../../i18n'
import { useProducts } from '../../../context/ProductsContext'
import { minPrice } from '../../../utils/price'
import { createMatcher } from '../../../../shared/search'
import Select from '../../ui/Select'
import ProductCard from './ProductCard'
import QuickViewModal from './QuickViewModal'

const sortOptions = [
  { value: 'newest', label: 'products.sortNewest' },
  { value: 'name', label: 'products.sortName' },
  { value: 'price-asc', label: 'products.sortPriceAsc' },
  { value: 'price-desc', label: 'products.sortPriceDesc' },
] as const

function Products() {
  const [category, setCategory] = useState('Все')
  const [sort, setSort] = useState('newest')
  const [quickView, setQuickView] = useState<Product | null>(null)
  const closeQuickView = useCallback(() => setQuickView(null), [])

  const { query, setQuery } = useSearch()
  const { products, loaded } = useProducts()
  const { activeTag, setActiveTag } = useCatalogFilter()
  const search = query.trim().toLowerCase()
  const { t, lang } = useT()

  const visibleProducts = useMemo(() => {
    // inglizcha/o'zbekcha/lotincha yozilsa ham ruscha nomlar topiladi (shared/search.ts)
    const matches = createMatcher(search)
    const filtered = products.filter((product) => {
      if (category !== 'Все' && product.category !== category) return false
      if (activeTag && !product.tags?.includes(activeTag)) return false
      return matches([product.name, product.category, product.description, ...product.colors].join(' '))
    })

    return filtered.sort((a, b) => {
      // kartada ko'rinadigan "от" narxi bo'yicha (o'lchamga alohida narx qo'yilgan bo'lishi mumkin)
      if (sort === 'price-asc') return minPrice(a) - minPrice(b)
      if (sort === 'price-desc') return minPrice(b) - minPrice(a)
      if (sort === 'newest') {
        // admin eng oxirgi qo'shgani tepada; bir vaqtda qo'shilganlar nom bo'yicha
        const diff = (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
        if (diff !== 0) return diff
      }
      return a.name.localeCompare(b.name)
    })
  }, [products, category, sort, search, activeTag])

  return (
    <section id="products" className="bg-white py-16 lg:py-20">
      <div className="mx-auto w-[90%] lg:w-[70%]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-medium text-gray-950">{t('products.title')}</h2>
            <p className="mt-2 text-gray-500">
              {t('products.subtitle')}
            </p>
          </div>
          <Select
            ariaLabel={t('products.sort')}
            value={sort}
            onChange={setSort}
            options={sortOptions.map((o) => ({ value: o.value, label: t(o.label) }))}
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
              {categoryLabel(lang, item)}
            </button>
          ))}
        </div>

        {activeTag && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-500">{t('products.filter')}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-950 py-1 pr-1.5 pl-3 text-xs font-semibold text-white">
              {tagLabel(lang, activeTag)}
              <button
                type="button"
                aria-label={t('products.resetFilter')}
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
            {t('products.found', { count: visibleProducts.length })}{' '}
            <span className="font-semibold text-gray-950">"{query.trim()}"</span>
            {category !== 'Все' && t('products.inCategory', { category: categoryLabel(lang, category) })}
            <button
              type="button"
              onClick={() => setQuery('')}
              className="ml-3 cursor-pointer font-semibold text-gray-950 underline-offset-2 hover:underline"
            >
              {t('search.clear')}
            </button>
          </p>
        )}

        {!loaded ? (
          <p className="mt-8 py-16 text-center text-gray-400">{t('products.loading')}</p>
        ) : visibleProducts.length > 0 ? (
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
            <p className="text-lg text-gray-950">{t('products.notFound')}</p>
            <p className="mt-1 text-gray-500">{t('products.notFoundHint')}</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setCategory('Все')
                setActiveTag(null)
              }}
              className="mt-6 cursor-pointer rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              {t('products.showAll')}
            </button>
          </div>
        )}
      </div>

      <QuickViewModal product={quickView} onClose={closeQuickView} />
    </section>
  )
}

export default Products
