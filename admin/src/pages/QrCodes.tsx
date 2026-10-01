import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { AlertTriangle, Check, Copy, Download, Mail, MessageCircle, Printer, Send, Share2, ShieldCheck, Store } from 'lucide-react'
import { useT } from '../i18n'
import { useToast } from '../components/ui'
import { secondaryBtn } from '../components/styles'

// Ikki QR kod: do'kon (xaridorlar uchun) va admin panel. QR har doim INTERNETDAGI manzilni
// ko'rsatadi (localhost'ni telefon ocholmaydi) — panel shu kompyuterda ochilgan bo'lsa ham:
//  - do'kon: VITE_PUBLIC_STORE_URL, bo'lmasa Vercel'dagi do'kon manzili
//  - admin: VITE_PUBLIC_ADMIN_URL, bo'lmasa panel internetda ochilgan bo'lsa — o'sha manzil

const env = import.meta.env as Record<string, string | undefined>
const trimSlash = (url: string) => url.replace(/\/$/, '')
const isLocal = (url: string) => /^https?:\/\/(localhost|127\.|0\.0\.0\.0|\[::1\])/i.test(url)
const PUBLIC_STORE_URL = trimSlash(env.VITE_PUBLIC_STORE_URL || 'https://market-said.vercel.app')
const PUBLIC_ADMIN_URL = trimSlash(
  env.VITE_PUBLIC_ADMIN_URL || (isLocal(window.location.origin) ? '' : window.location.origin),
)
const DARK = '#0f172a'

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

// "Поделиться": telefonda — tizimning ulashish oynasi (QR rasm + havola), kompyuterda — menyu
function ShareButton({ url, title, makeFile }: { url: string; title: string; makeFile: () => Promise<File> }) {
  const { t } = useT()
  const showToast = useToast()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const text = t('qr.shareText', { title })
  const share = async () => {
    // telefon (va Windows/Mac'dagi zamonaviy brauzer): QR rasmi bilan birga yuboriladi
    if (navigator.share) {
      try {
        const file = await makeFile()
        const data: ShareData = navigator.canShare?.({ files: [file] }) ? { files: [file], title, text: `${text} ${url}` } : { title, text, url }
        await navigator.share(data)
        return
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
      }
    }
    setOpen((v) => !v)
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      showToast(t('qr.copied'))
    } catch {
      showToast(t('qr.copyFailed'), 'error')
    }
    setOpen(false)
  }
  const links = [
    { key: 'telegram', label: 'Telegram', Icon: Send, href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
    { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle, href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
    { key: 'email', label: 'Email', Icon: Mail, href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n${url}`)}` },
  ]

  return (
    <div ref={rootRef} className="relative">
      <button type="button" onClick={share} aria-haspopup="menu" aria-expanded={open} className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-950 px-3 text-xs font-semibold text-white transition hover:bg-gray-800">
        <Share2 className="size-3.5" />
        {t('qr.share')}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 bottom-full z-30 mb-2 w-52 animate-[fade-in_120ms_ease-out] rounded-xl border border-gray-200 bg-white p-1 shadow-xl">
          {links.map(({ key, label, Icon, href }) => (
            <a
              key={key}
              role="menuitem"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-800 hover:bg-gray-100"
            >
              <Icon className="size-4 text-gray-500" />
              {label}
            </a>
          ))}
          <button type="button" role="menuitem" onClick={copy} className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-gray-800 hover:bg-gray-100">
            <Copy className="size-4 text-gray-500" />
            {t('qr.copyLink')}
          </button>
        </div>
      )}
    </div>
  )
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
  const makeFile = async () => {
    const blob = await (await fetch(await makePng(url, title))).blob()
    return new File([blob], `${file}.png`, { type: 'image/png' })
  }
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
          <div className="mt-auto flex w-full flex-col gap-2">
          <ShareButton url={url} title={title} makeFile={makeFile} />
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
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
        </div>
      ) : (
        <p className="flex items-start gap-2 p-5 text-sm text-gray-500">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          {t(kind === 'admin' ? 'qr.adminNotPublished' : 'qr.noStoreUrl')}
        </p>
      )}
    </section>
  )
}

function QrCodes() {
  const { t } = useT()
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-gray-500">{t('qr.intro')}</p>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <QrCard kind="store" url={PUBLIC_STORE_URL} title={t('qr.storeTitle')} subtitle={t('qr.storeSubtitle')} Icon={Store} tone="bg-blue-50 text-blue-700" />
        <QrCard kind="admin" url={PUBLIC_ADMIN_URL} title={t('qr.adminTitle')} subtitle={t('qr.adminSubtitle')} Icon={ShieldCheck} tone="bg-gray-100 text-gray-700" />
      </div>
    </div>
  )
}

export default QrCodes
