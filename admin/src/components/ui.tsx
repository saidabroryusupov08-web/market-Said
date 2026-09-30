import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react'

// ---------- umumiy klasslar ----------
export const inputClass =
  'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.2)]'
export const labelClass = 'mb-1 block text-xs font-medium text-gray-500'
export const primaryBtn =
  'inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-gray-950 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400'
export const secondaryBtn =
  'inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
export const iconBtn =
  'flex size-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-950'

// ---------- toast (pastda chiqadigan qisqa xabar) ----------
type Toast = { id: number; text: string; kind: 'success' | 'error' }
type ShowToast = (text: string, kind?: Toast['kind']) => void

const ToastContext = createContext<ShowToast>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const show = useCallback<ShowToast>(
    (text, kind = 'success') => setToast({ id: Date.now(), text, kind }),
    [],
  )

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), toast.kind === 'error' ? 5000 : 2500)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4">
          <div
            key={toast.id}
            role="status"
            className={`flex max-w-md animate-[fade-in_150ms_ease-out] items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
              toast.kind === 'error' ? 'bg-red-600' : 'bg-gray-950'
            }`}
          >
            {toast.kind === 'error' ? (
              <XCircle className="size-4 shrink-0" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-green-400" />
            )}
            {toast.text}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)

// ---------- modal oyna ----------
export function Modal({
  title,
  onClose,
  children,
  width = 'max-w-2xl',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  width?: string
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-[fade-in_150ms_ease-out] bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label={title}
        className={`relative flex max-h-[92vh] w-full ${width} animate-[zoom-in_150ms_ease-out] flex-col rounded-xl bg-white shadow-xl`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-950">{title}</h2>
          <button type="button" aria-label="Закрыть" onClick={onClose} className={iconBtn}>
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ---------- o'chirishni tasdiqlash ----------
export function ConfirmDialog({
  message,
  confirmLabel = 'Да, удалить',
  onConfirm,
  onCancel,
}: {
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        role="alertdialog"
        className="w-full max-w-sm animate-[zoom-in_150ms_ease-out] rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2.5 text-red-600">
          <AlertTriangle className="size-5" />
          <h3 className="text-base font-semibold text-gray-950">Подтверждение</h3>
        </div>
        <p className="mb-5 text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={secondaryBtn}>
            Отмена
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="h-9 cursor-pointer rounded-lg bg-red-600 px-3.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

