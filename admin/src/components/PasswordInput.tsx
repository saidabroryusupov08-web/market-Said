import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { inputClass } from './styles'

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  autoFocus,
  invalid,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  autoFocus?: boolean
  invalid?: boolean
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} pr-10 ${invalid ? 'border-red-400' : ''}`}
      />
      <button
        type="button"
        aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-700"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

export default PasswordInput
