import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Camera, ShieldCheck, ShieldOff, Smartphone, Trash2 } from 'lucide-react'
import { profileOf, useAuth, type TotpEnrollment } from '../lib/auth'
import { useT } from '../i18n'
import { useAdminData } from '../lib/data'
import { resizeImage } from '../lib/image'
import { validatePassword } from '../lib/password'
import Avatar from './Avatar'
import PasswordInput from './PasswordInput'
import { CodeInput } from '../pages/Login'
import { ConfirmDialog, Modal, useToast } from './ui'
import { inputClass, labelClass, primaryBtn, secondaryBtn } from './styles'

function ChangePassword() {
  const { changePassword } = useAuth()
  const showToast = useToast()
  const { t } = useT()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!current) return setError(t('security.enterCurrent'))
    const problem = validatePassword(next, confirm)
    if (problem) return setError(problem)
    setBusy(true)
    const failed = await changePassword(current, next)
    setBusy(false)
    if (failed) return setError(failed)
    setCurrent('')
    setNext('')
    setConfirm('')
    showToast(t('security.passwordChanged'))
  }

  const clear = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setError('')
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-950">{t('security.changePassword')}</h3>
      <div>
        <label className={labelClass} htmlFor="current-password">
          {t('security.currentPassword')}
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
            {t('login.newPassword')}
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
            {t('security.repeatNew')}
          </label>
          <PasswordInput
            id="confirm-next-password"
            autoComplete="new-password"
            value={confirm}
            onChange={clear(setConfirm)}
          />
        </div>
      </div>
      <p className="text-xs text-gray-400">{t('security.passwordRule')}</p>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={`${primaryBtn} self-start`}>
        {busy ? t('common.saving') : t('security.changePasswordBtn')}
      </button>
    </form>
  )
}

function TwoFactor({ enabled }: { enabled: boolean }) {
  const { startTotpEnrollment, confirmTotpEnrollment, disableTotp } = useAuth()
  const showToast = useToast()
  const { t } = useT()
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
    if (code.length !== 6) return setError(t('login.enterCode'))
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
    showToast(t('security.mfaEnabled'))
  }

  const turnOff = async () => {
    setConfirmOff(false)
    setBusy(true)
    const failed = await disableTotp()
    setBusy(false)
    showToast(failed ?? t('security.mfaDisabled'), failed ? 'error' : 'success')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-950">{t('security.mfaTitle')}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {enabled ? t('security.on') : t('security.off')}
        </span>
      </div>
      <p className="text-xs text-gray-500">
        {t('security.mfaExplain')}
      </p>

      {enabled ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirmOff(true)}
          className={`${secondaryBtn} self-start text-red-600 hover:bg-red-50`}
        >
          <ShieldOff className="size-4" />
          {t('security.mfaDisable')}
        </button>
      ) : enrollment ? (
        <form onSubmit={verify} noValidate className="flex flex-col gap-3 rounded-lg bg-gray-50 p-4">
          <ol className="list-decimal space-y-1 pl-4 text-xs text-gray-600">
            <li>{t('security.mfaStep1')}</li>
            <li>{t('security.mfaStep2')}</li>
            <li>{t('security.mfaStep3')}</li>
          </ol>
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start">
            <img
              src={enrollment.qrCode}
              alt={t('security.qrAlt')}
              className="size-40 shrink-0 rounded-lg border border-gray-200 bg-white p-2"
            />
            <div className="min-w-0 text-xs text-gray-500">
              {t('security.manualKey')}
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
              {busy ? t('common.checking') : t('security.confirmEnable')}
            </button>
            <button type="button" onClick={() => setEnrollment(null)} className={`${secondaryBtn} h-10`}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" disabled={busy} onClick={start} className={`${secondaryBtn} self-start`}>
          <Smartphone className="size-4" />
          {busy ? t('security.preparing') : t('security.mfaEnable')}
        </button>
      )}

      {confirmOff && (
        <ConfirmDialog
          withPassword
          message={t('security.mfaDisableConfirm')}
          confirmLabel={t('security.mfaDisableYes')}
          onConfirm={turnOff}
          onCancel={() => setConfirmOff(false)}
        />
      )}
    </div>
  )
}

const NAME_MAX = 40

// ism va rasm: saqlash bosilgunicha hech narsa yuklanmaydi (bekor qilinsa Storage'da ortiqcha fayl qolmaydi)
function Profile({ session }: { session: Session }) {
  const { updateProfile } = useAuth()
  const { uploadImage, removeImage } = useAdminData()
  const showToast = useToast()
  const { t } = useT()
  const current = profileOf(session)
  const [name, setName] = useState(current.name)
  // undefined — o'zgarmagan, null — o'chiriladi, Blob — yangi rasm
  const [pending, setPending] = useState<Blob | null | undefined>(undefined)
  const [preview, setPreview] = useState<string | null>(current.avatarUrl)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // tanlangan faylning vaqtinchalik ko'rinishi tozalanadi
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const pick = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return showToast(t('common.pickImage'), 'error')
    try {
      const blob = await resizeImage(file, 256, true)
      setPending(blob)
      setPreview(URL.createObjectURL(blob))
    } catch {
      showToast(t('common.imageReadFailed'), 'error')
    }
  }

  const changed = name.trim() !== current.name || pending !== undefined

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!changed || saving) return
    setSaving(true)
    let avatarUrl = current.avatarUrl
    if (pending instanceof Blob) {
      const result = await uploadImage(pending)
      if ('error' in result) {
        setSaving(false)
        return showToast(result.error, 'error')
      }
      avatarUrl = result.url
    } else if (pending === null) {
      avatarUrl = null
    }
    const error = await updateProfile({ name: name.slice(0, NAME_MAX), avatarUrl })
    setSaving(false)
    if (error) {
      if (pending instanceof Blob && avatarUrl) await removeImage(avatarUrl)
      return showToast(error, 'error')
    }
    // eski rasm Storage'da keraksiz qolmasin
    if (current.avatarUrl && current.avatarUrl !== avatarUrl) await removeImage(current.avatarUrl)
    setPending(undefined)
    showToast(t('profile.saved'))
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-950">{t('profile.title')}</h3>
      <div className="flex items-center gap-4">
        <Avatar src={preview} name={name || current.email} className="size-16 text-xl" />
        <div className="flex flex-wrap gap-2">
          <label className={`${secondaryBtn} h-8 text-xs`}>
            <Camera className="size-3.5" />
            {preview ? t('profile.replacePhoto') : t('profile.uploadPhoto')}
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
          {preview && (
            <button
              type="button"
              onClick={() => {
                setPending(null)
                setPreview(null)
              }}
              className={`${secondaryBtn} h-8 text-xs text-red-600 hover:bg-red-50`}
            >
              <Trash2 className="size-3.5" />
              {t('profile.removePhoto')}
            </button>
          )}
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="profile-name">
          {t('profile.nameLabel')}
        </label>
        <input
          id="profile-name"
          maxLength={NAME_MAX}
          placeholder={t('profile.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>
      <p className="flex items-center gap-1.5 text-xs text-gray-400">
        <ShieldCheck className="size-3.5" />
        {current.email}
      </p>
      <button type="submit" disabled={!changed || saving} className={`${primaryBtn} self-start`}>
        {saving ? t('common.saving') : t('profile.save')}
      </button>
    </form>
  )
}

function SecurityModal({ onClose }: { onClose: () => void }) {
  const { state } = useAuth()
  const { t } = useT()
  if (state.status !== 'admin') return null

  return (
    <Modal title={t('security.modalTitle')} onClose={onClose} width="max-w-lg">
      <div className="flex flex-col gap-6 p-5">
        <Profile session={state.session} />
        <div className="border-t border-gray-100" />
        <ChangePassword />
        <div className="border-t border-gray-100" />
        <TwoFactor enabled={state.mfaEnabled} />
        <p className="border-t border-gray-100 pt-4 text-xs text-gray-400">
          {t('security.autoLogout')}
        </p>
      </div>
    </Modal>
  )
}

export default SecurityModal
