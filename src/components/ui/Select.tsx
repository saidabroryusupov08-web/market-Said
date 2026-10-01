import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'

type SelectProps = {
  value: string
  onChange: (value: string) => void
  // disabled — ro'yxatda ko'rinadi, lekin tanlab bo'lmaydi (masalan, omborda tugagan o'lcham)
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
  className?: string
  ariaLabel: string
  // tanlash majburiy bo'lsa-yu hali tanlanmagan bo'lsa qizil rangda ko'rinadi
  invalid?: boolean
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  ariaLabel,
  invalid = false,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const openList = () => {
    setActive(Math.max(0, options.findIndex((option) => option.value === value)))
    setOpen(true)
  }

  const choose = (optionValue: string) => {
    onChange(optionValue)
    setOpen(false)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      setOpen(false)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return openList()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + step + options.length) % options.length)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (open) {
        if (!options[active].disabled) choose(options[active].value)
      }
      else openList()
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        onPointerDown={(e) => {
          if (e.button !== 0) return
          if (open) setOpen(false)
          else openList()
        }}
        onKeyDown={onKeyDown}
        className={`flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 text-left text-sm outline-none transition-colors duration-150 focus-visible:border-gray-300 focus-visible:bg-white focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] ${
          open
            ? 'border-gray-300 bg-white shadow-[0_0_0_3px_rgba(0,0,0,0.08)]'
            : invalid
              ? 'border-red-400 bg-red-50 hover:bg-red-100/70'
              : 'border-transparent bg-gray-100 hover:bg-gray-200/70'
        } ${selected ? 'text-gray-950' : invalid && !open ? 'text-red-600' : 'text-gray-500'}`}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-gray-400 transition-transform duration-100 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <ul
        id={listId}
        role="listbox"
        aria-label={ariaLabel}
        className={`absolute top-full right-0 left-0 z-30 mt-1.5 max-h-60 origin-top overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg transition-[opacity,scale,visibility] ease-out ${
          open
            ? 'visible scale-100 opacity-100 duration-100'
            : 'invisible scale-[0.98] opacity-0 duration-75'
        }`}
      >
        {options.map((option, index) => {
          const isSelected = option.value === value
          return (
            <li
              key={option.value}
              role="option"
              aria-selected={isSelected}
              aria-disabled={option.disabled || undefined}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => !option.disabled && choose(option.value)}
              className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm ${
                option.disabled ? 'cursor-not-allowed text-gray-400 line-through decoration-gray-300' : 'cursor-pointer text-gray-950'
              } ${index === active && !option.disabled ? 'bg-gray-100' : ''} ${isSelected ? 'font-medium' : ''}`}
            >
              {option.label}
              {isSelected && <Check className="size-4 shrink-0" />}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default Select
