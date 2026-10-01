import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { AlertTriangle, Check, Copy, Download, Printer, ShieldCheck, Store } from 'lucide-react'
import { useT } from '../i18n'
import { useToast } from '../components/ui'
import { secondaryBtn } from '../components/styles'

// Ikki QR kod: do'kon (xaridorlar uchun) va admin panel. Manzillar:
//  - do'kon: VITE_STORE_URL (Vercel'dagi do'kon manzili)
//  - admin: panel ochilgan manzil (window.location.origin)
// localhost bo'lsa — telefon bu manzilni ocholmaydi, shuni ogohlantiramiz.

const STORE_URL = ((import.meta.env.VITE_STORE_URL as string | undefined) || '').replace(/\/$/, '')
const DARK = '#0f172a'

const isLocal = (url: string) => /^https?:\/\/(localhost|127\.|0\.0\.0\.0|\[::1\])/i.test(url)

// QR + ostida yozuv bo'lgan PNG (chop etish va telefonga yuborish uchun qulay)
async function makePng(url: string, caption: string) {
  const size = 1024
  const pad = 64
  const qr = await QRCode.toDataURL(url, { width: size, margin: 1, errorCorrectionLevel: 'M', color: { dark: DARK, light: '#ffffff' } })
  const img = new Image()
  img.src = qr
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = size + pad * 2
  canvas.height = size + pad * 2 + 150
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, pad, pad, size, size)
  ctx.fillStyle = DARK
  ctx.textAlign = 'center'
  ctx.font = 'bold 56px system-ui, sans-serif'
  ctx.fillText(caption, canvas.width / 2, size + pad + 80)
  ctx.fillStyle = '#64748b'
  ctx.font = '36px system-ui, sans-serif'
  ctx.fillText(url.replace(/^https?:\/\//, ''), canvas.width / 2, size + pad + 130)
  return canvas.toDataURL('image/png')
}

function download(href: string, name: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = name
  a.click()
}

function QrCard({
  kind,
  url,
  title,
  subtitle,
  Icon,
  tone,
}: {
  kind: 'store' | 'admin'
  url: string
  title: string
  subtitle: string
  Icon: typeof Store
  tone: string
}) {
  const { t } = useT()
  const showToast = useToast()
  const [svg, setSvg] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!url) return
    let cancelled = false
    QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: DARK, light: '#ffffff' } }).then((s) => {
      if (!cancelled) setSvg(s)
    })
    return () => {
      cancelled = true
    }
  }, [url])

  const file = `cx-shop-qr-${kind}`
  const savePng = async () => download(await makePng(url, title), `${file}.png`)
  const saveSvg = () => {
    const href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    download(href, `${file}.svg`)
    URL.revokeObjectURL(href)
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      showToast(t('qr.copyFailed'), 'error')
    }
  }
  const print = async () => {
    const png = await makePng(url, title)
    const w = window.open('', '_blank', 'width=700,height=900')
    if (!w) return showToast(t('qr.popupBlocked'), 'error')
    w.document.write(
      `<!doctype html><title>${title}</title><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${png}" style="width:80%;max-width:520px" onload="setTimeout(()=>{print();close()},200)"></body>`,
    )
    w.document.close()
  }

  return (
    <section data-qr={kind} className="flex flex-col rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <span className={`flex size-9 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-950">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>

      {url ? (
        <div className="flex flex-1 flex-col items-center gap-4 p-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            {svg ? (
              <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt={t('qr.alt', { title })} className="size-56" />
            ) : (
              <div className="size-56 animate-pulse rounded-lg bg-gray-100" />
            )}
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer" className="max-w-full truncate text-sm font-medium text-blue-700 select-text hover:underline">
            {url.replace(/^https?:\/\//, '')}
          </a>
          {isLocal(url) && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {t('qr.localWarning')}
            </p>
          )}
          <div className="mt-auto grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
            <button type="button" onClick={savePng} disabled={!svg} className={`${secondaryBtn} h-9 text-xs`}>
              <Download className="size-3.5" />
              PNG
            </button>
            <button type="button" onClick={saveSvg} disabled={!svg} className={`${secondaryBtn} h-9 text-xs`}>
              <Download className="size-3.5" />
              SVG
            </button>
            <button type="button" onClick={copy} className={`${secondaryBtn} h-9 text-xs`}>
              {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
              {copied ? t('qr.copied') : t('qr.copy')}
            </button>
            <button type="button" onClick={print} disabled={!svg} className={`${secondaryBtn} h-9 text-xs`}>
              <Printer className="size-3.5" />
              {t('qr.print')}
            </button>
          </div>
        </div>
      ) : (
        <p className="flex items-start gap-2 p-5 text-sm text-gray-500">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          {t('qr.noStoreUrl')}
        </p>
      )}
    </section>
  )
}

function QrCodes() {
  const { t } = useT()
  const adminUrl = window.location.origin
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-gray-500">{t('qr.intro')}</p>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <QrCard kind="store" url={STORE_URL} title={t('qr.storeTitle')} subtitle={t('qr.storeSubtitle')} Icon={Store} tone="bg-blue-50 text-blue-700" />
        <QrCard kind="admin" url={adminUrl} title={t('qr.adminTitle')} subtitle={t('qr.adminSubtitle')} Icon={ShieldCheck} tone="bg-gray-100 text-gray-700" />
      </div>
    </div>
  )
}

export default QrCodes
