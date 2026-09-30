import { useState, type FormEvent } from 'react'
import { ShieldCheck, ShieldOff, Smartphone } from 'lucide-react'
import { useAuth, type TotpEnrollment } from '../lib/auth'
import { validatePassword } from '../lib/password'
import { CodeInput, PasswordInput } from '../pages/Login'
import { ConfirmDialog, labelClass, Modal, primaryBtn, secondaryBtn, useToast } from './ui'

function ChangePassword() {
  const { changePassword } = useAuth()
  const showToast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!current) return setError('Введите текущий пароль')
    const problem = validatePassword(next, confirm)
    if (problem) return setError(problem)
    setBusy(true)
    const failed = await changePassword(current, next)
    setBusy(false)
    if (failed) return setError(failed)
    setCurrent('')
    setNext('')
    setConfirm('')
    showToast('Пароль изменён')
  }

  const clear = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setError('')
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-950">Сменить пароль</h3>
      <div>
        <label className={labelClass} htmlFor="current-password">
          Текущий пароль
        </label>
        <PasswordInput
          id="current-password"
          autoComplete="current-password"
          value={current}
          onChange={clear(setCurrent)}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="next-password">
            Новый пароль
          </label>
          <PasswordInput
            id="next-password"
            autoComplete="new-password"
            value={next}
            onChange={clear(setNext)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="confirm-next-password">
            Повторите новый
          </label>
          <PasswordInput
            id="confirm-next-password"
            autoComplete="new-password"
            value={confirm}
            onChange={clear(setConfirm)}
          />
        </div>
      </div>
      <p className="text-xs text-gray-400">Минимум 8 символов, буквы и цифры.</p>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={`${primaryBtn} self-start`}>
        {busy ? 'Сохранение...' : 'Изменить пароль'}
      </button>
    </form>
  )
}

function TwoFactor({ enabled }: { enabled: boolean }) {
  const { startTotpEnrollment, confirmTotpEnrollment, disableTotp } = useAuth()
  const showToast = useToast()
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmOff, setConfirmOff] = useState(false)

  const start = async () => {
    setBusy(true)
    const result = await startTotpEnrollment()
    setBusy(false)
    if ('error' in result) return showToast(result.error, 'error')
    setEnrollment(result)
  }

  const verify = async (e: FormEvent) => {
    e.preventDefault()
    if (!enrollment) return
    if (code.length !== 6) return setError('Введите 6 цифр из приложения')
    setBusy(true)
    const failed = await confirmTotpEnrollment(enrollment.factorId, code)
    setBusy(false)
    if (failed) {
      setError(failed)
      setCode('')
      return
    }
    setEnrollment(null)
    setCode('')
    showToast('Двухфакторная защита включена')
  }

  const turnOff = async () => {
    setConfirmOff(false)
    setBusy(true)
    const failed = await disableTotp()
    setBusy(false)
    showToast(failed ?? 'Двухфакторная защита отключена', failed ? 'error' : 'success')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-950">Двухфакторная защита (2FA)</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {enabled ? 'Включена' : 'Выключена'}
        </span>
      </div>
      <p className="text-xs text-gray-500">
        При входе кроме пароля нужен 6-значный код из приложения на телефоне (Google
        Authenticator, Microsoft Authenticator и др.). Даже если пароль украдут, без телефона войти
        не получится.
      </p>

      {enabled ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirmOff(true)}
          className={`${secondaryBtn} self-start text-red-600 hover:bg-red-50`}
        >
          <ShieldOff className="size-4" />
          Отключить 2FA
        </button>
      ) : enrollment ? (
        <form onSubmit={verify} noValidate className="flex flex-col gap-3 rounded-lg bg-gray-50 p-4">
          <ol className="list-decimal space-y-1 pl-4 text-xs text-gray-600">
            <li>Установите Google Authenticator на телефон.</li>
            <li>Нажмите «+» → «Сканировать QR-код» и наведите на код ниже.</li>
            <li>Введите 6 цифр, которые покажет приложение.</li>
          </ol>
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start">
            <img
              src={enrollment.qrCode}
              alt="QR-код для приложения"
              className="size-40 shrink-0 rounded-lg border border-gray-200 bg-white p-2"
            />
            <div className="min-w-0 text-xs text-gray-500">
              Не получается сканировать? Введите ключ вручную:
              <code className="mt-1 block rounded bg-white px-2 py-1.5 font-mono text-[11px] break-all text-gray-950 select-all">
                {enrollment.secret}
              </code>
            </div>
          </div>
          <CodeInput
            value={code}
            onChange={(v) => {
              setCode(v)
              setError('')
            }}
          />
          {error && (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? 'Проверка...' : 'Подтвердить и включить'}
            </button>
            <button type="button" onClick={() => setEnrollment(null)} className={`${secondaryBtn} h-10`}>
              Отмена
            </button>
          </div>
        </form>
      ) : (
        <button type="button" disabled={busy} onClick={start} className={`${secondaryBtn} self-start`}>
          <Smartphone className="size-4" />
          {busy ? 'Подготовка...' : 'Включить 2FA'}
        </button>
      )}

      {confirmOff && (
        <ConfirmDialog
          message="Отключить двухфакторную защиту? Для входа снова будет достаточно только пароля."
          confirmLabel="Да, отключить"
          onConfirm={turnOff}
          onCancel={() => setConfirmOff(false)}
        />
      )}
    </div>
  )
}

function SecurityModal({ onClose }: { onClose: () => void }) {
  const { state } = useAuth()
  if (state.status !== 'admin') return null

  return (
    <Modal title="Безопасность" onClose={onClose} width="max-w-lg">
      <div className="flex flex-col gap-6 p-5">
        <div className="flex items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2.5">
          <ShieldCheck className="size-4 shrink-0 text-gray-500" />
          <span className="min-w-0 truncate text-sm text-gray-700">{state.session.user.email}</span>
        </div>
        <ChangePassword />
        <div className="border-t border-gray-100" />
        <TwoFactor enabled={state.mfaEnabled} />
        <p className="border-t border-gray-100 pt-4 text-xs text-gray-400">
          Если не пользоваться панелью 30 минут, выход произойдёт автоматически.
        </p>
      </div>
    </Modal>
  )
}

export default SecurityModal
