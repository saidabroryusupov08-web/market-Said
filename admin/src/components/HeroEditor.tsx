import { useEffect, useState, type FormEvent } from 'react'
import { ImageIcon, RotateCcw, Upload } from 'lucide-react'
import { resolveImage } from '../../../shared/images'
import {
  DEFAULT_SITE_SETTINGS,
  HERO_SUBTITLE_MAX,
  HERO_TITLE_MAX,
} from '../../../shared/siteSettings'
import { useAdminData } from '../lib/data'
import { resizeImage } from '../lib/image'
import { inputClass, labelClass, primaryBtn, secondaryBtn } from './styles'
import { Modal, useToast } from './ui'

// Do'kon bosh sahifasining sarlavhasi, matni va katta rasmi. Saqlash bosilgunicha hech narsa
// yuklanmaydi; o'ngda saytda qanday ko'rinishi darhol ko'rsatiladi.
function HeroEditor({ onClose }: { onClose: () => void }) {
  const { siteSettings, saveSiteSettings, uploadImage } = useAdminData()
  const showToast = useToast()
  const [title, setTitle] = useState(siteSettings.heroTitle)
  const [subtitle, setSubtitle] = useState(siteSettings.heroSubtitle)
  // undefined — o'zgarmagan, 'default' — standart rasmga qaytarish, Blob — yangi rasm
  const [image, setImage] = useState<Blob | 'default' | undefined>(undefined)
  const [preview, setPreview] = useState(resolveImage(siteSettings.heroImage))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const pick = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return showToast('Выберите файл изображения', 'error')
    try {
      const blob = await resizeImage(file, 1400)
      setImage(blob)
      setPreview(URL.createObjectURL(blob))
    } catch {
      showToast('Не удалось прочитать изображение', 'error')
    }
  }

  const resetImage = () => {
    setImage('default')
    setPreview(resolveImage(DEFAULT_SITE_SETTINGS.heroImage))
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return showToast('Введите заголовок', 'error')
    setSaving(true)
    let heroImage = siteSettings.heroImage
    if (image instanceof Blob) {
      const result = await uploadImage(image)
      if ('error' in result) {
        setSaving(false)
        return showToast(result.error, 'error')
      }
      heroImage = result.url
    } else if (image === 'default') {
      heroImage = DEFAULT_SITE_SETTINGS.heroImage
    }
    const error = await saveSiteSettings({ heroTitle: title, heroSubtitle: subtitle, heroImage })
    setSaving(false)
    if (error) return showToast(error, 'error')
    showToast('Главная страница сайта обновлена')
    onClose()
  }

  const isDefaultImage = image === 'default' || (image === undefined && siteSettings.heroImage === DEFAULT_SITE_SETTINGS.heroImage)

  return (
    <Modal title="Главная страница сайта" onClose={onClose} width="max-w-4xl">
      <form onSubmit={save} noValidate className="grid gap-6 p-5 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass} htmlFor="hero-title">
              Заголовок <span className="text-gray-400">({title.length}/{HERO_TITLE_MAX})</span>
            </label>
            <input
              id="hero-title"
              autoFocus
              maxLength={HERO_TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="hero-subtitle">
              Текст под заголовком <span className="text-gray-400">({subtitle.length}/{HERO_SUBTITLE_MAX})</span>
            </label>
            <textarea
              id="hero-subtitle"
              rows={4}
              maxLength={HERO_SUBTITLE_MAX}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className={`${inputClass} h-auto py-2`}
            />
          </div>
          <div>
            <span className={labelClass}>Большое фото</span>
            <div className="flex flex-wrap gap-2">
              <label className={`${secondaryBtn} cursor-pointer`}>
                <Upload className="size-4" />
                Загрузить фото
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    pick(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              </label>
              {!isDefaultImage && (
                <button type="button" onClick={resetImage} className={secondaryBtn}>
                  <RotateCcw className="size-4" />
                  Стандартное фото
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-gray-400">Лучше квадратное фото, от 1000×1000 px</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTitle(DEFAULT_SITE_SETTINGS.heroTitle)
              setSubtitle(DEFAULT_SITE_SETTINGS.heroSubtitle)
              resetImage()
            }}
            className="self-start text-xs text-gray-500 underline-offset-2 hover:text-gray-950 hover:underline"
          >
            Вернуть всё как было по умолчанию
          </button>
        </div>

        {/* saytda qanday ko'rinishi */}
        <div>
          <span className={labelClass}>Предпросмотр</span>
          <div className="grid grid-cols-2 items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="min-w-0">
              <p className="text-lg leading-tight break-words text-gray-950">{title || '—'}</p>
              <p className="mt-2 line-clamp-5 text-[11px] leading-relaxed break-words text-gray-500">{subtitle}</p>
              <span className="mt-3 inline-block rounded bg-gray-950 px-2 py-1 text-[10px] font-semibold text-white">
                Перейти к покупкам
              </span>
            </div>
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
              {preview ? (
                <img src={preview} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-gray-300">
                  <ImageIcon className="size-8" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 md:col-span-2">
          <button type="button" onClick={onClose} className={`${secondaryBtn} h-10`}>
            Отмена
          </button>
          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving ? 'Сохранение...' : 'Сохранить на сайте'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default HeroEditor
