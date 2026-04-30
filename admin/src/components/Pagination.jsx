export default function Pagination({ meta, onChange }) {
  if (!meta) return null
  const { current_page: current = 1, last_page: last = 1, from = 0, to = 0, total = 0 } = meta
  if (last <= 1 && total <= 0) return null

  const go = (p) => {
    const next = Math.min(Math.max(1, p), last)
    if (next !== current) onChange(next)
  }

  const btn =
    'h-8 min-w-8 px-2 inline-flex items-center justify-center rounded border border-outline-variant/40 text-sm text-slate-300 hover:bg-surface-container-highest/40 disabled:opacity-40 disabled:hover:bg-transparent transition-colors'
  const activeBtn = 'bg-blue-600 border-blue-600 text-white hover:bg-blue-600'

  const pages = buildPageList(current, last)

  return (
    <div className="flex flex-wrap items-center justify-between gap-sm px-4 py-3 border-t border-outline-variant/30 text-sm">
      <div className="text-slate-500">
        {total > 0 ? (
          <>Showing <span className="text-slate-300 font-medium">{from}</span>–<span className="text-slate-300 font-medium">{to}</span> of <span className="text-slate-300 font-medium">{total}</span></>
        ) : (
          <>No results</>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button className={btn} onClick={() => go(1)} disabled={current <= 1} aria-label="First page">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>first_page</span>
        </button>
        <button className={btn} onClick={() => go(current - 1)} disabled={current <= 1} aria-label="Previous page">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-slate-500">…</span>
          ) : (
            <button
              key={p}
              onClick={() => go(p)}
              className={`${btn} ${p === current ? activeBtn : ''}`}
              aria-current={p === current ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        <button className={btn} onClick={() => go(current + 1)} disabled={current >= last} aria-label="Next page">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
        </button>
        <button className={btn} onClick={() => go(last)} disabled={current >= last} aria-label="Last page">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>last_page</span>
        </button>
      </div>
    </div>
  )
}

function buildPageList(current, last) {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const out = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(last - 1, current + 1)
  if (start > 2) out.push('…')
  for (let i = start; i <= end; i++) out.push(i)
  if (end < last - 1) out.push('…')
  out.push(last)
  return out
}
