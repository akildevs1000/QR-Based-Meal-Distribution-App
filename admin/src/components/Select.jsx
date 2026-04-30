import { useEffect, useMemo, useRef, useState } from 'react'

export default function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  required = false,
  disabled = false,
  searchable = false,
  className = '',
  align = 'left',
  id,
  leadingIcon,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(-1)
  const wrapRef = useRef(null)
  const searchRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (ev) => { if (wrapRef.current && !wrapRef.current.contains(ev.target)) setOpen(false) }
    const onKey = (ev) => { if (ev.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) { setQuery(''); setActiveIdx(-1); return }
    if (searchable) setTimeout(() => searchRef.current?.focus(), 0)
  }, [open, searchable])

  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value ?? '')),
    [options, value]
  )

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options
    const q = query.toLowerCase()
    return options.filter((o) => {
      const text = typeof o.label === 'string'
        ? o.label
        : (o.searchText ?? String(o.value ?? ''))
      return text.toLowerCase().includes(q)
    })
  }, [options, query, searchable])

  const handleSelect = (val) => {
    onChange(val)
    setOpen(false)
  }

  const onKeyDown = (ev) => {
    if (!open) {
      if (ev.key === 'ArrowDown' || ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault()
        setOpen(true)
      }
      return
    }
    if (ev.key === 'ArrowDown') {
      ev.preventDefault()
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1))
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (ev.key === 'Enter') {
      ev.preventDefault()
      const opt = filtered[activeIdx]
      if (opt && !opt.disabled) handleSelect(opt.value)
    }
  }

  const popoverPos = align === 'right' ? 'right-0' : 'left-0'

  return (
    <div ref={wrapRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={[
          'w-full flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/50 rounded px-3 py-2 text-sm text-left transition-all',
          'focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none',
          'hover:border-outline-variant',
          disabled ? 'opacity-60 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {leadingIcon && (
          <span className="material-symbols-outlined text-slate-500 shrink-0" style={{ fontSize: 18 }}>{leadingIcon}</span>
        )}
        <span className={`flex-1 truncate ${selected ? 'text-slate-100' : 'text-slate-500'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className={`material-symbols-outlined text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ fontSize: 18 }}>
          expand_more
        </span>
      </button>

      {required && (
        <input
          tabIndex={-1}
          required
          value={value == null ? '' : String(value)}
          onChange={() => { }}
          aria-hidden
          className="absolute inset-0 opacity-0 pointer-events-none"
        />
      )}

      {open && !disabled && (
        <div className={`absolute z-30 mt-1 ${popoverPos} min-w-full bg-surface-container-low border border-outline-variant/50 rounded-lg shadow-xl overflow-hidden`}>
          {searchable && (
            <div className="p-2 border-b border-outline-variant/30">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" style={{ fontSize: 16 }}>search</span>
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActiveIdx(0) }}
                  placeholder="Search…"
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded pl-8 pr-2 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                />
              </div>
            </div>
          )}
          <div ref={listRef} className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-500 text-center">No options</div>
            ) : filtered.map((opt, i) => {
              const isSelected = String(opt.value) === String(value ?? '')
              const isActive = i === activeIdx
              return (
                <button
                  key={String(opt.value ?? i)}
                  type="button"
                  disabled={opt.disabled}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => !opt.disabled && handleSelect(opt.value)}
                  className={[
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                    opt.disabled
                      ? 'text-slate-600 cursor-not-allowed'
                      : isSelected
                        ? 'bg-blue-600/15 text-blue-100'
                        : isActive
                          ? 'bg-surface-container-highest/40 text-slate-100'
                          : 'text-slate-200',
                  ].join(' ')}
                >
                  <span className="flex-1 truncate">{opt.label}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-blue-400 shrink-0" style={{ fontSize: 18 }}>check</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
