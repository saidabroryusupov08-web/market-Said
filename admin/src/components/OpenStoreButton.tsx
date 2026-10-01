import { useState, type ReactNode } from 'react'
import { useT } from '../i18n'
import { ConfirmDialog } from './ui'

// do'kon manzili (Vercel env: VITE_STORE_URL)
const STORE_URL = (import.meta.env.VITE_STORE_URL as string | undefined) || ''

// "Открыть магазин": tasodifan bosib, admin paneldan chiqib ketmaslik uchun avval so'raladi.
// Do'kon yangi tabda ochiladi, admin panel ochiq qoladi.
function OpenStoreButton({ className, children }: { className: string; children: ReactNode }) {
  const [asking, setAsking] = useState(false)
  const { t } = useT()
  if (!STORE_URL) return null

  return (
    <>
      <button type="button" onClick={() => setAsking(true)} className={className}>
        {children}
      </button>
      {asking && (
        <ConfirmDialog
          tone="info"
          title={t('store.confirmTitle')}
          message={t('store.confirmMessage')}
          confirmLabel={t('store.confirmYes')}
          cancelLabel={t('common.no')}
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false)
            window.open(STORE_URL, '_blank', 'noopener,noreferrer')
          }}
        />
      )}
    </>
  )
}

export default OpenStoreButton
