import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { AlertTriangle, CheckCircle2, ExternalLink, Lock, X, XCircle } from 'lucide-react'
import { useAuth } from '../lib/auth'
import PasswordInput from './PasswordInput'
import { iconBtn, secondaryBtn } from './styles'


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
// withPassword: muhim amal (o'chirish, 2FA'ni o'chirish) — parol qayta so'raladi.
// Oxirgi 5 daqiqada parol to'g'ri kiritilgan bo'lsa, qayta so'ralmaydi (auth.tsx: REAUTH_GRACE_MS).
// tone 'info': xavfsiz amal (masalan saytga o'tish) — qizil emas, ko'k ko'rinish
export function ConfirmDialog({
  message,
  confirmLabel = 'Да, удалить',
  cancelLabel = 'Отмена',
  title = 'Подтверждение',
  onConfirm,
  onCancel,
  withPassword = false,
  tone = 'danger',
}: {
  message: string
  confirmLabel?: string
  cancelLabel?: string
  title?: string
  onConfirm: () => void
  onCancel: () => void
  withPassword?: boolean
  tone?: 'danger' | 'info'
}) {
  const danger = tone === 'danger'
  const { verifyPassword, needsPassword } = useAuth()
  // oyna ochilgan paytdagi holat: keyin taymer o'tib ketsa ham forma o'zgarmaydi
  const [askPassword] = useState(() => withPassword && needsPassword())
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const confirm = async (e?: FormEvent) => {
    e?.preventDefault()
    if (checking) return
    if (askPassword) {
      if (!password) return setError('Введите пароль')
      setChecking(true)
      const problem = await verifyPassword(password)
      setChecking(false)
      if (problem) {
        setError(problem)
        setPassword('')
        return
      }
    }
    onConfirm()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <form
        role="alertdialog"
        aria-label={title}
        onSubmit={confirm}
        noValidate
        className="w-full max-w-sm animate-[zoom-in_150ms_ease-out] rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`mb-3 flex items-center gap-2.5 ${danger ? 'text-red-600' : 'text-blue-600'}`}>
          {danger ? <AlertTriangle className="size-5" /> : <ExternalLink className="size-5" />}
          <h3 className="text-base font-semibold text-gray-950">{title}</h3>
        </div>
        <p className="mb-4 text-sm text-gray-600">{message}</p>
        {askPassword && (
          <div className="mb-4">
            <label
              className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500"
              htmlFor="confirm-password-check"
            >
              <Lock className="size-3.5" />
              Для этого действия введите ваш пароль
            </label>
            <PasswordInput
              id="confirm-password-check"
              autoComplete="current-password"
              autoFocus
              value={password}
              invalid={!!error}
              onChange={(v) => {
                setPassword(v)
                setError('')
              }}
            />
            {error && (
              <p role="alert" className="mt-1.5 text-xs text-red-600">
                {error}
              </p>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={secondaryBtn}>
            {cancelLabel}
          </button>
          <button
            type="submit"
            autoFocus={!askPassword}
            disabled={checking}
            className={`h-9 cursor-pointer rounded-lg px-3.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {checking ? 'Проверка...' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

