import { useEffect, useMemo, useRef, useState } from 'react'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const pad2 = (n) => String(n).padStart(2, '0')
const toISO = (y, mo, d) => `${y}-${pad2(mo + 1)}-${pad2(d)}`
const parseISO = (s) => {
  if (!s || typeof s !== 'string') return null
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const y = +m[1], mo = +m[2] - 1, d = +m[3]
  if (isNaN(y) || isNaN(mo) || isNaN(d)) return null
  return { y, mo, d }
}
const formatDisplay = (s) => {
  const p = parseISO(s)
  if (!p) return ''
  return `${pad2(p.d)} ${SHORT_MONTHS[p.mo]} ${p.y}`
}
const daysInMonth = (y, mo) => new Date(y, mo + 1, 0).getDate()
const firstDow = (y, mo) => new Date(y, mo, 1).getDay()

export default function DatePicker({
  value = '',
  onChange,
  placeholder = 'Select date',
  required = false,
  disabled = false,
  className = '',
  id,
  align = 'left',
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const [view, setView] = useState(() => {
    const p = parseISO(value)
    const now = new Date()
    return { y: p?.y ?? now.getFullYear(), mo: p?.mo ?? now.getMonth() }
  })

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
    if (!open) return
    const p = parseISO(value)
    if (p) setView({ y: p.y, mo: p.mo })
  }, [open, value])

  const selected = useMemo(() => parseISO(value), [value])
  const today = new Date()
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate())

  const goPrev = () => setView((v) => (v.mo === 0 ? { y: v.y - 1, mo: 11 } : { y: v.y, mo: v.mo - 1 }))
  const goNext = () => setView((v) => (v.mo === 11 ? { y: v.y + 1, mo: 0 } : { y: v.y, mo: v.mo + 1 }))
  const goPrevYear = () => setView((v) => ({ y: v.y - 1, mo: v.mo }))
  const goNextYear = () => setView((v) => ({ y: v.y + 1, mo: v.mo }))

  const cells = useMemo(() => {
    const total = daysInMonth(view.y, view.mo)
    const offset = firstDow(view.y, view.mo)
    const arr = []
    for (let i = 0; i < offset; i++) arr.push(null)
    for (let d = 1; d <= total; d++) arr.push(d)
    while (arr.length % 7 !== 0) arr.push(null)
    return arr
  }, [view])

  const select = (d) => {
    onChange(toISO(view.y, view.mo, d))
    setOpen(false)
  }
  const clear = (e) => {
    e?.stopPropagation()
    onChange('')
    setOpen(false)
  }
  const goToday = () => {
    const t = new Date()
    setView({ y: t.getFullYear(), mo: t.getMonth() })
    onChange(toISO(t.getFullYear(), t.getMonth(), t.getDate()))
    setOpen(false)
  }

  const popoverPos = align === 'right' ? 'right-0' : 'left-0'

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
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
          value ? 'pr-9' : 'pr-3',
        ].join(' ')}
      >
        <span className="material-symbols-outlined text-slate-500 shrink-0" style={{ fontSize: 18 }}>calendar_today</span>
        <span className={value ? 'text-slate-100 truncate' : 'text-slate-500 truncate'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {value && !disabled && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear date"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-slate-200 hover:bg-surface-container-highest/40 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
        </button>
      )}

      {required && (
        <input
          tabIndex={-1}
          required
          value={value}
          onChange={() => { }}
          aria-hidden
          className="absolute inset-0 opacity-0 pointer-events-none"
        />
      )}

      {open && !disabled && (
        <div className={`absolute z-30 mt-1 ${popoverPos} bg-surface-container-low border border-outline-variant/50 rounded-lg shadow-xl p-md w-72`}>
          <div className="flex items-center justify-between mb-sm">
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={goPrevYear} className="p-1 rounded hover:bg-surface-container-highest/40 text-slate-300" aria-label="Previous year">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>keyboard_double_arrow_left</span>
              </button>
              <button type="button" onClick={goPrev} className="p-1 rounded hover:bg-surface-container-highest/40 text-slate-300" aria-label="Previous month">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span>
              </button>
            </div>
            <div className="text-slate-100 font-semibold text-sm select-none">{MONTHS[view.mo]} {view.y}</div>
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={goNext} className="p-1 rounded hover:bg-surface-container-highest/40 text-slate-300" aria-label="Next month">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span>
              </button>
              <button type="button" onClick={goNextYear} className="p-1 rounded hover:bg-surface-container-highest/40 text-slate-300" aria-label="Next year">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>keyboard_double_arrow_right</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[11px] font-medium uppercase tracking-wider text-slate-500 py-1">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />
              const iso = toISO(view.y, view.mo, d)
              const isSelected = selected && selected.y === view.y && selected.mo === view.mo && selected.d === d
              const isToday = iso === todayISO
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => select(d)}
                  className={[
                    'h-8 rounded text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : isToday
                        ? 'text-blue-300 ring-1 ring-blue-500/40 hover:bg-surface-container-highest/40'
                        : 'text-slate-200 hover:bg-surface-container-highest/40',
                  ].join(' ')}
                >{d}</button>
              )
            })}
          </div>
          <div className="flex items-center justify-between mt-sm pt-sm border-t border-outline-variant/30">
            <button type="button" onClick={clear} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">Clear</button>
            <button type="button" onClick={goToday} className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">Today</button>
          </div>
        </div>
      )}
    </div>
  )
}
