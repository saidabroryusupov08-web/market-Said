import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'

// Admin panel uchun ochiladigan ro'yxat (brauzerning oddiy <select> o'rniga): bir xil dizayn,
// klaviatura bilan ishlaydi (↑ ↓ Enter Esc), tanlangan qator belgilanadi, uzun ro'yxat aylanadi.

export type SelectOption = { value: string; label: string }

function Select({
  value,
  onChange,
  options,
  ariaLabel,
  className = '',
  id,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  ariaLabel: string
  className?: string
  id?: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // klaviatura bilan yurganda faol qator ko'rinib tursin
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const openList = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }

  const choose = (next: string) => {
    onChange(next)
    setOpen(false)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (open) e.stopPropagation()
      setOpen(false)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return openList()
      if (options.length === 0) return
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + step + options.length) % options.length)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (open) {
        if (options[active]) choose(options[active].value)
      } else openList()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-sm text-gray-950 outline-none transition focus-visible:border-blue-500 focus-visible:shadow-[0_0_0_4px_rgba(59,130,246,0.2)] ${
          open ? 'border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className="truncate">{selected?.label ?? ''}</span>
        <ChevronDown className={`size-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute top-full right-0 left-0 z-40 mt-1.5 max-h-64 min-w-max animate-[fade-in_100ms_ease-out] overflow-y-auto rounded-xl border border-gray-200 bg-white/95 p-1 shadow-xl backdrop-blur-md"
        >
          {options.map((o, i) => {
            const isSelected = o.value === value
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o.value)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm ${
                  isSelected ? 'font-semibold text-blue-800' : 'text-gray-800'
                } ${i === active ? (isSelected ? 'bg-blue-600/10' : 'bg-gray-100') : isSelected ? 'bg-blue-600/5' : ''}`}
              >
                {o.label}
                {isSelected && <Check className="size-4 shrink-0 text-blue-700" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default Select
