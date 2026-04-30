import { useEffect, useRef, useState } from 'react'

export default function RowMenu({ items = [], align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (ev) => { if (ref.current && !ref.current.contains(ev.target)) setOpen(false) }
    const onKey = (ev) => { if (ev.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const visible = items.filter(Boolean)
  if (visible.length === 0) return null

  const itemCls = 'flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-surface-container-highest/40 transition-colors'
  const popoverPos = align === 'left' ? 'left-0' : 'right-0'

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded hover:bg-surface-container-highest/40 text-slate-400 hover:text-slate-200 transition-colors"
        aria-label="Actions"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>more_vert</span>
      </button>
      {open && (
        <div className={`absolute ${popoverPos} mt-1 w-40 bg-surface-container-low border border-outline-variant/50 rounded-lg shadow-lg overflow-hidden z-20`}>
          {visible.map((it, i) => (
            <button
              key={i}
              type="button"
              disabled={it.disabled}
              onClick={() => { setOpen(false); it.onClick?.() }}
              className={[
                itemCls,
                it.danger ? 'text-red-400' : 'text-slate-200',
                it.disabled ? 'opacity-50 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {it.icon && (
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{it.icon}</span>
              )}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
