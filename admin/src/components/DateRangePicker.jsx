import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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

export default function DateRangePicker({
  value = { from: '', to: '' },
  onChange,
  placeholder = 'Pick a date range',
  disabled = false,
  className = '',
  align = 'left',
  id,
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const popoverRef = useRef(null)
  const [coords, setCoords] = useState(null)
  const [tempStart, setTempStart] = useState(null)
  const [hover, setHover] = useState(null)
  const [view, setView] = useState(() => {
    const p = parseISO(value?.from)
    const now = new Date()
    return { y: p?.y ?? now.getFullYear(), mo: p?.mo ?? now.getMonth() }
  })

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
    const POPOVER_W = 528 // ~ two 240px calendars + padding + gap
    const update = () => {
      const r = wrapRef.current?.getBoundingClientRect()
      if (!r) return
      const vw = window.innerWidth
      const vh = window.innerHeight
      let left = align === 'right' ? r.right - POPOVER_W : r.left
      left = Math.max(8, Math.min(left, vw - POPOVER_W - 8))
      const popH = popoverRef.current?.offsetHeight || 360
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

  useEffect(() => {
    if (!open) { setTempStart(null); setHover(null); return }
    const p = parseISO(value?.from)
    if (p) setView({ y: p.y, mo: p.mo })
  }, [open, value?.from])

  const today = new Date()
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate())

  const goPrev = () => setView((v) => (v.mo === 0 ? { y: v.y - 1, mo: 11 } : { y: v.y, mo: v.mo - 1 }))
  const goNext = () => setView((v) => (v.mo === 11 ? { y: v.y + 1, mo: 0 } : { y: v.y, mo: v.mo + 1 }))
  const goPrevYear = () => setView((v) => ({ y: v.y - 1, mo: v.mo }))
  const goNextYear = () => setView((v) => ({ y: v.y + 1, mo: v.mo }))

  const buildCells = (y, mo) => {
    const total = daysInMonth(y, mo)
    const offset = firstDow(y, mo)
    const arr = []
    for (let i = 0; i < offset; i++) arr.push(null)
    for (let d = 1; d <= total; d++) arr.push(d)
    while (arr.length % 7 !== 0) arr.push(null)
    return arr
  }
  const nextView = view.mo === 11 ? { y: view.y + 1, mo: 0 } : { y: view.y, mo: view.mo + 1 }
  const cellsLeft = useMemo(() => buildCells(view.y, view.mo), [view])
  const cellsRight = useMemo(() => buildCells(nextView.y, nextView.mo), [nextView.y, nextView.mo])

  const display = () => {
    if (!value?.from && !value?.to) return placeholder
    if (value.from && value.to) {
      if (value.from === value.to) return formatDisplay(value.from)
      return `${formatDisplay(value.from)} → ${formatDisplay(value.to)}`
    }
    return formatDisplay(value.from || value.to)
  }

  const hasValue = !!(value?.from || value?.to)

  // Effective range for highlighting (commit when both start+end set; otherwise tempStart→hover preview)
  const effectiveRange = useMemo(() => {
    if (tempStart) {
      const a = tempStart, b = hover ?? tempStart
      return a <= b ? { from: a, to: b } : { from: b, to: a }
    }
    if (value?.from && value?.to) {
      return value.from <= value.to
        ? { from: value.from, to: value.to }
        : { from: value.to, to: value.from }
    }
    return null
  }, [tempStart, hover, value?.from, value?.to])

  const onDayClick = (iso) => {
    if (!tempStart) {
      setTempStart(iso)
      setHover(iso)
    } else {
      const a = tempStart, b = iso
      const range = a <= b ? { from: a, to: b } : { from: b, to: a }
      onChange?.(range)
      setTempStart(null)
      setHover(null)
      setOpen(false)
    }
  }

  const clear = (e) => {
    e?.stopPropagation()
    onChange?.({ from: '', to: '' })
    setTempStart(null)
    setHover(null)
    setOpen(false)
  }

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
          hasValue ? 'pr-9' : 'pr-3',
        ].join(' ')}
      >
        <span className="material-symbols-outlined text-slate-500 shrink-0" style={{ fontSize: 18 }}>date_range</span>
        <span className={hasValue ? 'text-slate-100 truncate' : 'text-slate-500 truncate'}>
          {display()}
        </span>
      </button>

      {hasValue && !disabled && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear range"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-slate-200 hover:bg-surface-container-highest/40 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
        </button>
      )}

      {open && !disabled && coords && createPortal(
        <div
          ref={popoverRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width, zIndex: 1000 }}
          className="bg-surface-container-low border border-outline-variant/50 rounded-lg shadow-xl"
        >
          <div className="p-md">
            <div className="flex gap-md">
              {[
                { y: view.y, mo: view.mo, cells: cellsLeft, isLeft: true },
                { y: nextView.y, mo: nextView.mo, cells: cellsRight, isLeft: false },
              ].map((cal, idx) => (
                <div key={idx} className="w-60">
                  <div className="flex items-center justify-between mb-sm">
                    <div className={`flex items-center gap-0.5 ${cal.isLeft ? '' : 'invisible pointer-events-none'}`}>
                      <button type="button" onClick={goPrevYear} className="p-1 rounded hover:bg-surface-container-highest/40 text-slate-300" aria-label="Previous year">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>keyboard_double_arrow_left</span>
                      </button>
                      <button type="button" onClick={goPrev} className="p-1 rounded hover:bg-surface-container-highest/40 text-slate-300" aria-label="Previous month">
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span>
                      </button>
                    </div>
                    <div className="text-slate-100 font-semibold text-sm select-none">{MONTHS[cal.mo]} {cal.y}</div>
                    <div className={`flex items-center gap-0.5 ${cal.isLeft ? 'invisible pointer-events-none' : ''}`}>
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
                    {cal.cells.map((d, i) => {
                      if (!d) return <div key={i} />
                      const iso = toISO(cal.y, cal.mo, d)
                      const inRange = effectiveRange && iso >= effectiveRange.from && iso <= effectiveRange.to
                      const isStart = effectiveRange && iso === effectiveRange.from
                      const isEnd = effectiveRange && iso === effectiveRange.to
                      const isEndpoint = isStart || isEnd
                      const isToday = iso === todayISO
                      return (
                        <button
                          key={i}
                          type="button"
                          onMouseEnter={() => tempStart && setHover(iso)}
                          onClick={() => onDayClick(iso)}
                          className={[
                            'h-8 rounded text-sm font-medium transition-colors',
                            isEndpoint
                              ? 'bg-blue-600 text-white hover:bg-blue-500'
                              : inRange
                                ? 'bg-blue-600/20 text-blue-100 hover:bg-blue-600/30'
                                : isToday
                                  ? 'text-blue-300 ring-1 ring-blue-500/40 hover:bg-surface-container-highest/40'
                                  : 'text-slate-200 hover:bg-surface-container-highest/40',
                          ].join(' ')}
                        >{d}</button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-sm pt-sm border-t border-outline-variant/30 text-xs">
              <span className="text-slate-500">
                {tempStart ? 'Pick the end date' : 'Pick the start date'}
              </span>
              <button type="button" onClick={clear} className="text-slate-400 hover:text-slate-200 transition-colors">Clear</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
