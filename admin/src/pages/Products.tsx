import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ImageIcon, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { resolveImage } from '../../../shared/images'
import { hasSizePriceRange, minPrice } from '../../../shared/price'
import { categoryLabel, tagLabel } from '../../../shared/dataLabels'
import { categories, discountPercent, type Product } from '../../../shared/products'
import { createMatcher } from '../../../shared/search'
import Tooltip from '../../../shared/Tooltip'
import { useT } from '../i18n'
import { useAdminData, type ProductInput } from '../lib/data'
import Select from '../components/Select'
import ProductForm from '../components/ProductForm'
import { ConfirmDialog, Modal, useToast } from '../components/ui'
import { iconBtn, inputClass, primaryBtn } from '../components/styles'


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

// "от $29.99" — prefix tarjimada
const priceLabel = (p: Product, from: string) =>
  `${hasSizePriceRange(p) ? from + ' ' : ''}$${minPrice(p).toFixed(2)}`

function Products() {
  const { products, productsLoaded, deleteProduct, updateProduct } = useAdminData()
  const showToast = useToast()
  const { t, lang } = useT()
  const price = (p: Product) => priceLabel(p, t('common.from'))
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
      error ?? (input.isActive ? t('products.shownAgain', { name: p.name }) : t('products.hiddenNow', { name: p.name })),
      error ? 'error' : 'success',
    )
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    const product = toDelete
    setToDelete(null)
    const error = await deleteProduct(product.id)
    showToast(error ?? t('products.deleted', { name: product.name }), error ? 'error' : 'success')
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder={t('products.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          ariaLabel={t('form.category')}
          className="sm:w-48"
          value={category}
          onChange={(v) => updateParam('category', v === 'Все' ? null : v)}
          options={categories.map((c) => ({
            value: c,
            label: c === 'Все' ? t('products.allCategories') : categoryLabel(lang, c),
          }))}
        />
        <Select
          ariaLabel={t('form.visibility')}
          className="sm:w-44"
          value={visibility}
          onChange={(v) => updateParam('visibility', v === 'all' ? null : v)}
          options={[
            { value: 'all', label: t('products.allProducts') },
            { value: 'active', label: t('products.onSite') },
            { value: 'hidden', label: t('products.hiddenFilter') },
          ]}
        />
        <button type="button" onClick={() => setAdding(true)} className={primaryBtn}>
          <Plus className="size-4" />
          {t('products.add')}
        </button>
      </div>

      <p className="mb-3 text-sm text-gray-500">
        {productsLoaded ? t('products.shown', { visible: visible.length, total: products.length }) : t('common.loading')}
      </p>

      {productsLoaded && visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center text-sm text-gray-500">
          {products.length === 0 ? t('products.emptyAll') : t('common.nothingFound')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* kompyuterda jadval */}
          <table className="hidden w-full text-sm md:table">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3">{t('products.colProduct')}</th>
                <th className="px-4 py-3">{t('form.category')}</th>
                <th className="px-4 py-3">{t('products.colPrice')}</th>
                <th className="px-4 py-3">{t('products.colSizes')}</th>
                <th className="px-4 py-3 text-right">{t('products.colActions')}</th>
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
                                {t('products.hiddenBadge')}
                              </span>
                            )}
                            {p.tags?.map((tg) => (
                              <span
                                key={tg}
                                className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                              >
                                {tagLabel(lang, tg)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{categoryLabel(lang, p.category)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-gray-950">{price(p)}</p>
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
                      <Tooltip label={p.isActive === false ? t('products.show') : t('products.hide')}>
                        <button
                          type="button"
                          aria-label={p.isActive === false ? t('products.showAria', { name: p.name }) : t('products.hideAria', { name: p.name })}
                          onClick={() => toggleVisibility(p)}
                          className={iconBtn}
                        >
                          {p.isActive === false ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </Tooltip>
                      <Tooltip label={t('common.edit')}>
                        <button
                          type="button"
                          aria-label={t('products.editAria', { name: p.name })}
                          onClick={() => updateParam('edit', String(p.id))}
                          className={iconBtn}
                        >
                          <Pencil className="size-4" />
                        </button>
                      </Tooltip>
                      <Tooltip label={t('common.delete')}>
                        <button
                          type="button"
                          aria-label={t('products.deleteAria', { name: p.name })}
                          onClick={() => setToDelete(p)}
                          className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </Tooltip>
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
                    {categoryLabel(lang, p.category)} · {price(p)}
                    {discountPercent(p) > 0 && <span className="ml-1 text-red-600">−{discountPercent(p)}%</span>}
                    {p.isActive === false && <span className="ml-1 font-semibold text-gray-900">· {t('products.hiddenLower')}</span>}
                  </p>
                </button>
                <button
                  type="button"
                  aria-label={t('products.deleteAria', { name: p.name })}
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
        <Modal title={t('products.newTitle')} onClose={() => setAdding(false)}>
          <ProductForm onDone={() => setAdding(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title={t('products.editTitle')} onClose={() => updateParam('edit', null)}>
          <ProductForm key={editing.id} product={editing} onDone={() => updateParam('edit', null)} />
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          withPassword
          message={t('products.deleteConfirm', { name: toDelete.name })}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}

export default Products
