import { useCallback, useMemo, useState } from 'react'
import { SearchX } from 'lucide-react'
import { useSearch } from '../../../context/SearchContext'
import { categories, products as defaultProducts, type Product } from '../../../data/products'
import { useProducts } from '../../../context/ProductsContext'
import Select from '../../ui/Select'
import ProductCard from './ProductCard'
import QuickViewModal from './QuickViewModal'

// admin qo'shgan mahsulotlar products.ts da yo'q
const defaultIds = new Set(defaultProducts.map((p) => p.id))

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

function Products() {
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('newest')
  const [quickView, setQuickView] = useState<Product | null>(null)
  const closeQuickView = useCallback(() => setQuickView(null), [])

  const { query, setQuery } = useSearch()
  const { products } = useProducts()
  const search = query.trim().toLowerCase()

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      if (category !== 'All' && product.category !== category) return false
      if (!search) return true
      return [product.name, product.category, product.description, ...product.colors]
        .join(' ')
        .toLowerCase()
        .includes(search)
    })

    return filtered.sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'newest') {
        // yangi qo'shilganlar tepada (eng oxirgisi birinchi), qolganlari nom bo'yicha
        const aNew = !defaultIds.has(a.id)
        const bNew = !defaultIds.has(b.id)
        if (aNew && bNew) return b.id - a.id
        if (aNew !== bNew) return aNew ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }, [products, category, sort, search])

  return (
    <section id="products" className="bg-white py-16 lg:py-20">
      <div className="mx-auto w-[90%] lg:w-[70%]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-medium text-gray-950">Our Products</h2>
            <p className="mt-2 text-gray-500">
              Discover our complete collection of premium apparel
            </p>
          </div>
          <Select
            ariaLabel="Sort by"
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
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                category === item
                  ? 'bg-gray-950 text-white'
                  : 'bg-gray-100 text-gray-950 hover:bg-gray-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {search && (
          <p className="mt-6 text-sm text-gray-500">
            {visibleProducts.length} result{visibleProducts.length === 1 ? '' : 's'} for{' '}
            <span className="font-semibold text-gray-950">"{query.trim()}"</span>
            {category !== 'All' && <> in {category}</>}
            <button
              type="button"
              onClick={() => setQuery('')}
              className="ml-3 cursor-pointer font-semibold text-gray-950 underline-offset-2 hover:underline"
            >
              Clear search
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
            <p className="text-lg text-gray-950">No products found</p>
            <p className="mt-1 text-gray-500">Try a different word or category</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setCategory('All')
              }}
              className="mt-6 cursor-pointer rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Show all products
            </button>
          </div>
        )}
      </div>

      <QuickViewModal product={quickView} onClose={closeQuickView} />
    </section>
  )
}

export default Products
