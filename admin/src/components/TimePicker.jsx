import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const pad2 = (n) => String(n).padStart(2, '0')

const parse = (v) => {
  if (!v || typeof v !== 'string') return null
  const m = v.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const h = +m[1], mm = +m[2]
  if (isNaN(h) || isNaN(mm) || h < 0 || h > 23 || mm < 0 || mm > 59) return null
  return { h, m: mm }
}

const format12 = (v) => {
  const p = parse(v)
  if (!p) return ''
  const period = p.h >= 12 ? 'PM' : 'AM'
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12
  return `${pad2(h12)}:${pad2(p.m)} ${period}`
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

export default function TimePicker({
  value = '',
  onChange,
  placeholder = 'Select time',
  required = false,
  disabled = false,
  className = '',
  id,
  align = 'left',
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const popoverRef = useRef(null)
  const [coords, setCoords] = useState(null)

  const parsed = parse(value)
  const period = parsed && parsed.h >= 12 ? 'PM' : 'AM'
  const hour12 = parsed ? (parsed.h % 12 === 0 ? 12 : parsed.h % 12) : null
  const minute = parsed ? parsed.m : null
  // Snap minute display to nearest 5-min slot for highlight
  const minuteSlot = minute == null ? null : Math.round(minute / 5) * 5 % 60

  const emit = (h12, m, p) => {
    let h = h12 % 12
    if (p === 'PM') h += 12
    onChange?.(`${pad2(h)}:${pad2(m)}`)
  }

  const onPickHour = (h12) => emit(h12, minute ?? 0, period)
  const onPickMinute = (m) => emit(hour12 ?? 12, m, period)
  const onPickPeriod = (p) => emit(hour12 ?? 12, minute ?? 0, p)

  useEffect(() => {
    if (!open) return
    const onDoc = (ev) => {
      if (wrapRef.current && wrapRef.current.contains(ev.target)) return
      if (popoverRef.current && popoverRef.current.contains(ev.target)) return
      setOpen(false)
    }
    const onKey = (ev) => { if (ev.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open) { setCoords(null); return }
    const POPOVER_W = 256
    const update = () => {
      const r = wrapRef.current?.getBoundingClientRect()
      if (!r) return
      const vw = window.innerWidth
      const vh = window.innerHeight
      let left = align === 'right' ? r.right - POPOVER_W : r.left
      left = Math.max(8, Math.min(left, vw - POPOVER_W - 8))
      const popH = popoverRef.current?.offsetHeight || 300
      const spaceBelow = vh - r.bottom
      const top = spaceBelow < popH + 8 && r.top > popH + 8
        ? r.top - popH - 4
        : r.bottom + 4
      setCoords({ top, left, width: POPOVER_W })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, align])

  const clear = (e) => {
    e?.stopPropagation()
    onChange?.('')
    setOpen(false)
  }

  const setNow = () => {
    const d = new Date()
    const m = Math.round(d.getMinutes() / 5) * 5
    const carryHour = m === 60
    const h = (d.getHours() + (carryHour ? 1 : 0)) % 24
    onChange?.(`${pad2(h)}:${pad2(carryHour ? 0 : m)}`)
    setOpen(false)
  }

  const cellCls = (isSel) => [
    'h-8 rounded text-sm font-medium font-mono transition-colors',
    isSel
      ? 'bg-blue-600 text-white hover:bg-blue-500'
      : 'text-slate-200 hover:bg-surface-container-highest/40',
  ].join(' ')

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={[
          'w-full flex items-center gap-2 bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-left transition-all',
          'focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none',
          'hover:border-outline-variant',
          disabled ? 'opacity-60 cursor-not-allowed' : '',
          value ? 'pr-9' : 'pr-3',
        ].join(' ')}
      >
        <span className="material-symbols-outlined text-slate-500 shrink-0" style={{ fontSize: 18 }}>schedule</span>
        <span className={value ? 'text-slate-100 truncate font-mono' : 'text-slate-500 truncate'}>
          {value ? format12(value) : placeholder}
        </span>
      </button>

      {value && !disabled && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear time"
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

      {open && !disabled && coords && createPortal(
        <div
          ref={popoverRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width, zIndex: 1000 }}
          className="bg-surface-container-low border border-outline-variant/50 rounded-lg shadow-xl p-md"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1.5">Hour</div>
          <div className="grid grid-cols-4 gap-1 mb-sm">
            {HOURS.map((h) => (
              <button key={h} type="button" onClick={() => onPickHour(h)} className={cellCls(hour12 === h)}>
                {pad2(h)}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1.5">Minute</div>
          <div className="grid grid-cols-4 gap-1 mb-sm">
            {MINUTES.map((m) => (
              <button key={m} type="button" onClick={() => onPickMinute(m)} className={cellCls(minuteSlot === m)}>
                {pad2(m)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1">
            {['AM', 'PM'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPickPeriod(p)}
                className={[
                  'h-8 rounded text-sm font-semibold transition-colors',
                  period === p && parsed
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'text-slate-200 bg-surface-container-highest/20 hover:bg-surface-container-highest/40',
                ].join(' ')}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-sm pt-sm border-t border-outline-variant/30">
            <button type="button" onClick={clear} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">Clear</button>
            <button type="button" onClick={setNow} className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">Now</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
