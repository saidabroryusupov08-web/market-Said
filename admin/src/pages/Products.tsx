import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ImageIcon, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { resolveImage } from '../../../shared/images'
import { hasSizePriceRange, minPrice } from '../../../shared/price'
import { categories, discountPercent, NAV_TAGS, type Product } from '../../../shared/products'
import { createMatcher } from '../../../shared/search'
import { useAdminData, type ProductInput } from '../lib/data'
import ProductForm from '../components/ProductForm'
import { ConfirmDialog, iconBtn, inputClass, Modal, primaryBtn, useToast } from '../components/ui'

const tagLabel = Object.fromEntries(NAV_TAGS.map((t) => [t.value, t.label]))

function Thumb({ product }: { product: Product }) {
  const src = resolveImage(product.image)
  return (
    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-300">
      {src ? (
        <img src={src} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <ImageIcon className="size-5" />
      )}
    </span>
  )
}

const priceLabel = (p: Product) =>
  `${hasSizePriceRange(p) ? 'от ' : ''}$${minPrice(p).toFixed(2)}`

function Products() {
  const { products, productsLoaded, deleteProduct, updateProduct } = useAdminData()
  const showToast = useToast()
  // qidiruv, filtr va ochiq forma manzilda turadi: global qidiruvdan kelganda ham ishlaydi
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [toDelete, setToDelete] = useState<Product | null>(null)

  const category = params.get('category') ?? 'Все'
  const visibility = params.get('visibility') ?? 'all'
  const editId = Number(params.get('edit'))
  const editing = products.find((p) => p.id === editId)

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const visible = useMemo(() => {
    // "hoodie", "qora", "futbolka" ham ruscha nomlarni topadi (shared/search.ts)
    const matches = createMatcher(search)
    return products.filter(
      (p) =>
        (category === 'Все' || p.category === category) &&
        (visibility === 'all' || (visibility === 'hidden') === (p.isActive === false)) &&
        matches([p.name, p.category, p.description, ...p.colors].join(' ')),
    )
  }, [products, search, category, visibility])

  // saytdan tezda yashirish / qaytarish (mahsulot bazada qoladi)
  const toggleVisibility = async (p: Product) => {
    const input: ProductInput = { ...p, isActive: p.isActive === false }
    const error = await updateProduct(p.id, input)
    showToast(
      error ?? (input.isActive ? `«${p.name}» снова на сайте` : `«${p.name}» скрыт с сайта`),
      error ? 'error' : 'success',
    )
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    const product = toDelete
    setToDelete(null)
    const error = await deleteProduct(product.id)
    showToast(error ?? `«${product.name}» удалён`, error ? 'error' : 'success')
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Поиск по названию, цвету, описанию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Категория"
          className={`${inputClass} cursor-pointer sm:w-48`}
          value={category}
          onChange={(e) => updateParam('category', e.target.value === 'Все' ? null : e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'Все' ? 'Все категории' : c}
            </option>
          ))}
        </select>
        <select
          aria-label="Видимость"
          className={`${inputClass} cursor-pointer sm:w-40`}
          value={visibility}
          onChange={(e) => updateParam('visibility', e.target.value === 'all' ? null : e.target.value)}
        >
          <option value="all">Все товары</option>
          <option value="active">На сайте</option>
          <option value="hidden">Скрытые</option>
        </select>
        <button type="button" onClick={() => setAdding(true)} className={primaryBtn}>
          <Plus className="size-4" />
          Добавить товар
        </button>
      </div>

      <p className="mb-3 text-sm text-gray-500">
        {productsLoaded ? `Показано: ${visible.length} из ${products.length}` : 'Загрузка...'}
      </p>

      {productsLoaded && visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center text-sm text-gray-500">
          {products.length === 0 ? 'Товаров пока нет — добавьте первый.' : 'Ничего не найдено.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* kompyuterda jadval */}
          <table className="hidden w-full text-sm md:table">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3">Товар</th>
                <th className="px-4 py-3">Категория</th>
                <th className="px-4 py-3">Цена</th>
                <th className="px-4 py-3">Размеры / цвета</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((p) => (
                <tr key={p.id} className="transition hover:bg-gray-50/70">
                  <td className="px-4 py-3">
                    <div className={`flex items-center gap-3 ${p.isActive === false ? 'opacity-50' : ''}`}>
                      <Thumb product={p} />
                      <div className="min-w-0">
                        <p className="max-w-xs truncate font-medium text-gray-950">{p.name}</p>
                        {(p.isActive === false || (p.tags && p.tags.length > 0)) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.isActive === false && (
                              <span className="rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                Скрыт
                              </span>
                            )}
                            {p.tags?.map((t) => (
                              <span
                                key={t}
                                className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                              >
                                {tagLabel[t] ?? t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-gray-950">{priceLabel(p)}</p>
                    {discountPercent(p) > 0 && (
                      <p className="text-xs">
                        <span className="text-gray-400 line-through">${p.oldPrice!.toFixed(2)}</span>
                        <span className="ml-1.5 font-semibold text-red-600">−{discountPercent(p)}%</span>
                      </p>
                    )}
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-xs text-gray-500">
                    <p className="truncate">{p.sizes.join(', ')}</p>
                    <p className="truncate">{p.colors.join(', ')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        aria-label={p.isActive === false ? `Показать ${p.name} на сайте` : `Скрыть ${p.name} с сайта`}
                        title={p.isActive === false ? 'Показать на сайте' : 'Скрыть с сайта'}
                        onClick={() => toggleVisibility(p)}
                        className={iconBtn}
                      >
                        {p.isActive === false ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                      <button
                        type="button"
                        aria-label={`Редактировать ${p.name}`}
                        title="Редактировать"
                        onClick={() => updateParam('edit', String(p.id))}
                        className={iconBtn}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Удалить ${p.name}`}
                        title="Удалить"
                        onClick={() => setToDelete(p)}
                        className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* telefonda ro'yxat */}
          <ul className="divide-y divide-gray-100 md:hidden">
            {visible.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <Thumb product={p} />
                <button
                  type="button"
                  onClick={() => updateParam('edit', String(p.id))}
                  className="min-w-0 flex-1 cursor-pointer text-left"
                >
                  <p className="truncate text-sm font-medium text-gray-950">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.category} · {priceLabel(p)}
                    {discountPercent(p) > 0 && <span className="ml-1 text-red-600">−{discountPercent(p)}%</span>}
                    {p.isActive === false && <span className="ml-1 font-semibold text-gray-900">· скрыт</span>}
                  </p>
                </button>
                <button
                  type="button"
                  aria-label={`Удалить ${p.name}`}
                  onClick={() => setToDelete(p)}
                  className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {adding && (
        <Modal title="Новый товар" onClose={() => setAdding(false)}>
          <ProductForm onDone={() => setAdding(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Редактирование товара" onClose={() => updateParam('edit', null)}>
          <ProductForm key={editing.id} product={editing} onDone={() => updateParam('edit', null)} />
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          message={`Удалить «${toDelete.name}»? Товар исчезнет с сайта. Это действие нельзя отменить.`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}

export default Products
