import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { useProducts } from '../context/ProductsContext'
import { categories } from '../data/products'
import './Admin.css'

// "S, M, L" -> ['S', 'M', 'L']
function splitList(text: string) {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// rasm localStorage'ga sig'ishi uchun kichraytirib, jpeg data URL qilib olinadi
function readImage(file: File, maxSize = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Rasmni o'qib bo'lmadi"))
    }
    img.src = url
  })
}

const emptyForm = {
  name: '',
  category: categories[1],
  price: '',
  description: '',
  sizes: 'XS, S, M, L, XL',
  colors: '',
  image: '',
}

function AddProductForm() {
  const { addProduct } = useProducts()
  const [form, setForm] = useState(emptyForm)
  // file input'ni tozalash uchun key o'zgartiriladi
  const [fileKey, setFileKey] = useState(0)

  const set = (field: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  async function onFile(file?: File) {
    if (!file) return
    try {
      set('image', await readImage(file))
    } catch {
      alert("Rasmni o'qib bo'lmadi")
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const price = Number(form.price)
    const sizes = splitList(form.sizes)
    const colors = splitList(form.colors)
    if (!form.name.trim()) return alert('Nomini yozing')
    if (!(price > 0)) return alert("To'g'ri narx yozing")
    if (sizes.length === 0 || colors.length === 0)
      return alert("Kamida bitta o'lcham va rang yozing")

    addProduct({
      name: form.name.trim(),
      category: form.category,
      price,
      description: form.description.trim(),
      sizes,
      colors,
      image: form.image.trim() || undefined,
    })
    setForm(emptyForm)
    setFileKey((k) => k + 1)
  }

  return (
    <form onSubmit={submit}>
      <h1>Yangi mahsulot</h1>
      <input placeholder="Nomi" value={form.name} onChange={(e) => set('name', e.target.value)} />
      <select value={form.category} onChange={(e) => set('category', e.target.value)}>
        {categories
          .filter((c) => c !== 'All')
          .map((c) => (
            <option key={c}>{c}</option>
          ))}
      </select>
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="Narxi ($)"
        value={form.price}
        onChange={(e) => set('price', e.target.value)}
      />
      <br />
      <input
        placeholder="O'lchamlar (vergul bilan)"
        value={form.sizes}
        onChange={(e) => set('sizes', e.target.value)}
      />
      <input
        placeholder="Ranglar (vergul bilan)"
        value={form.colors}
        onChange={(e) => set('colors', e.target.value)}
      />
      <br />
      <textarea
        placeholder="Tavsif"
        rows={2}
        value={form.description}
        onChange={(e) => set('description', e.target.value)}
      />
      <br />
      <input
        placeholder="Rasm URL (ixtiyoriy)"
        value={form.image.startsWith('data:') ? '' : form.image}
        onChange={(e) => set('image', e.target.value)}
      />
      yoki{' '}
      <input key={fileKey} type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
      {form.image && <img src={form.image} alt="" />}
      <br />
      <button type="submit">Qo'shish</button>
    </form>
  )
}

function Admin() {
  const { products, updateProduct, deleteProduct } = useProducts()
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')

  function save(id: number) {
    const price = Number(editPrice)
    if (!editName.trim() || !(price > 0)) return alert("Nom va to'g'ri narx yozing")
    updateProduct(id, { name: editName.trim(), price })
    setEditId(null)
  }

  return (
    <div className="admin">
      <Link to="/">Saytga qaytish</Link>

      <AddProductForm />

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Surat</th>
            <th>Nomi</th>
            <th>Kategoriya</th>
            <th>Narxi</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const editing = editId === p.id
            return (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.image ? <img src={p.image} alt={p.name} /> : '-'}</td>
                <td>
                  {editing ? <input value={editName} onChange={(e) => setEditName(e.target.value)} /> : p.name}
                </td>
                <td>{p.category}</td>
                <td>
                  {editing ? (
                    <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                  ) : (
                    '$' + p.price.toFixed(2)
                  )}
                </td>
                <td>
                  {editing ? (
                    <>
                      <button onClick={() => save(p.id)}>Saqlash</button>
                      <button onClick={() => setEditId(null)}>Bekor</button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditId(p.id)
                          setEditName(p.name)
                          setEditPrice(String(p.price))
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => confirm("O'chirilsinmi?") && deleteProduct(p.id)}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default Admin
