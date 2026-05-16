import { useEffect, useState } from 'react'
import { useLogs, useEmployees, useSites, useSuppliers } from '../api/queries'
import { api, getToken } from '../api/client'
import Pagination from '../components/Pagination'
import Select from '../components/Select'
import DatePicker from '../components/DatePicker'

const resultBadge = (r) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border '
  if (r === 'allowed') return base + 'bg-green-900/40 text-green-400 border-green-800/50'
  if (r === 'denied') return base + 'bg-red-900/40 text-red-400 border-red-800/50'
  return base + 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50'
}

const typeBadge = (t) => {
  const base = 'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold '
  if (t === 'manual') return base + 'bg-amber-900/40 text-amber-300'
  return base + 'bg-slate-800/60 text-slate-400'
}

const inputCls =
  'w-full bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 hover:bg-surface-container-high/70 hover:border-outline-variant/50 focus:bg-surface-container-high focus:border-blue-400 focus:ring-1 focus:ring-blue-400/60 focus:outline-none transition-all'

const apiOrigin = (import.meta.env.VITE_API_BASE || 'http://localhost:8000/api').replace(/\/api\/?$/, '')
const pictureUrl = (path) => (path ? `${apiOrigin}/storage/${path}` : null)

const dateFmt = new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })

export default function Logs() {
  const [filters, setFilters] = useState({ date: '', employee_id: '', site_id: '', supplier_id: '', source: '', type: '', result: '' })
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [filters])
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
  const { data, isLoading } = useLogs({ ...params, page })
  const { data: empPage } = useEmployees({ per_page: 500 })
  const { data: sitesData } = useSites({ all: 1 })
  const { data: suppliersData } = useSuppliers({ all: 1 })

  const exportCsv = async () => {
    const res = await api.get('/logs/export', { params, responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `meal-logs-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  const rows = data?.data ?? []
  const sites = sitesData?.data ?? []
  const suppliers = suppliersData?.data ?? []

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-md mb-lg">
        <div className="min-w-0">
          <h1 className="font-h1 text-h1 text-slate-100">Transactions</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">All scan events with filtering and export.</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!getToken()}
          className="bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors disabled:opacity-40"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
          Export CSV
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-sm mb-md">
        <DatePicker
          value={filters.date}
          onChange={(v) => setFilters({ ...filters, date: v })}
          placeholder="Any date"
          className="w-44"
        />
        <Select
          value={filters.employee_id}
          onChange={(v) => setFilters({ ...filters, employee_id: v })}
          searchable
          className="w-56"
          options={[
            { value: '', label: 'All employees' },
            ...(empPage?.data ?? []).map(e => ({ value: String(e.id), label: `${e.employee_code} — ${e.name}` })),
          ]}
        />
        <Select
          value={filters.site_id}
          onChange={(v) => setFilters({ ...filters, site_id: v })}
          searchable
          className="w-52"
          options={[
            { value: '', label: 'All sites' },
            ...sites.map(s => ({ value: String(s.id), label: `${s.site_code} — ${s.name}` })),
          ]}
        />
        <Select
          value={filters.supplier_id}
          onChange={(v) => setFilters({ ...filters, supplier_id: v })}
          searchable
          className="w-52"
          options={[
            { value: '', label: 'All suppliers' },
            ...suppliers.map(s => ({ value: String(s.id), label: `${s.supplier_code} — ${s.name}` })),
          ]}
        />
        <Select
          value={filters.source}
          onChange={(v) => setFilters({ ...filters, source: v })}
          className="w-40"
          options={[
            { value: '', label: 'Any source' },
            { value: 'scanner', label: 'Scanner' },
            { value: 'manual', label: 'Manual' },
          ]}
        />
        <Select
          value={filters.type}
          onChange={(v) => setFilters({ ...filters, type: v })}
          className="w-36"
          options={[
            { value: '', label: 'Any type' },
            { value: 'issue', label: 'Issue' },
            { value: 'manual', label: 'Manual' },
          ]}
        />
        <Select
          value={filters.result}
          onChange={(v) => setFilters({ ...filters, result: v })}
          className="w-36"
          options={[
            { value: '', label: 'Any result' },
            { value: 'allowed', label: 'Allowed' },
            { value: 'denied', label: 'Denied' },
            { value: 'error', label: 'Error' },
          ]}
        />
        {(filters.date || filters.employee_id || filters.site_id || filters.supplier_id || filters.source || filters.type || filters.result) && (
          <button
            type="button"
            onClick={() => setFilters({ date: '', employee_id: '', site_id: '', supplier_id: '', source: '', type: '', result: '' })}
            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>Clear
          </button>
        )}
      </div>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-hidden">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3 font-medium">Time</th>
              <th className="px-3 py-3 font-medium">Beneficiary</th>
              <th className="px-3 py-3 font-medium">Meal</th>
              <th className="px-3 py-3 font-medium">Point</th>
              <th className="px-3 py-3 font-medium">Supplier</th>
              <th className="px-3 py-3 font-medium">Distributor</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 font-medium">Source</th>
              <th className="px-3 py-3 font-medium">Result</th>
              <th className="px-3 py-3 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="10" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan="10" className="p-6 text-center text-slate-500">No logs for these filters.</td></tr>}
            {rows.map(l => {
              const d = l.scanned_at ? new Date(l.scanned_at) : null
              const photo = pictureUrl(l.employee?.profile_picture)
              return (
              <tr key={l.id} className="hover:bg-surface-container-highest/10 transition-colors">
                <td className="px-3 py-3 whitespace-nowrap">
                  {d ? (
                    <div className="leading-tight">
                      <div className="text-slate-200 text-sm font-medium">{dateFmt.format(d)}</div>
                      <div className="text-slate-400 text-xs font-mono mt-0.5">{timeFmt.format(d)}</div>
                    </div>
                  ) : <span className="text-slate-500">—</span>}
                </td>
                <td className="px-3 py-3">
                  {l.employee ? (
                    <div className="flex items-center gap-2.5">
                      {photo ? (
                        <img
                          src={photo}
                          alt=""
                          width={40}
                          height={40}
                          className="object-cover border border-outline-variant/40 flex-shrink-0 block"
                          style={{ width: 40, height: 40, minWidth: 40, minHeight: 40, borderRadius: '9999px' }}
                        />
                      ) : (
                        <div
                          className="bg-surface-container-highest/40 border border-outline-variant/40 flex items-center justify-center flex-shrink-0"
                          style={{ width: 40, height: 40, minWidth: 40, minHeight: 40, borderRadius: '9999px' }}
                        >
                          <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 20 }}>person</span>
                        </div>
                      )}
                      <div className="min-w-0 leading-tight">
                        <div className="text-slate-200 text-sm truncate">{l.employee.name}</div>
                        <div className="font-mono text-slate-400 text-xs">{l.employee.employee_code}</div>
                      </div>
                    </div>
                  ) : <span className="text-slate-500 italic">unknown</span>}
                </td>
                <td className="px-3 py-3 text-slate-300 text-sm">{l.meal_rule?.name || '—'}</td>
                <td className="px-3 py-3 text-slate-300 text-xs">{(l.site?.site_code || l.employee?.site?.site_code) || <span className="text-slate-500">—</span>}</td>
                <td className="px-3 py-3 text-slate-300 text-xs">{l.supplier?.name || <span className="text-slate-500">—</span>}</td>
                <td className="px-3 py-3 text-slate-300 text-xs">{l.distributor?.name || <span className="text-slate-500">—</span>}</td>
                <td className="px-3 py-3"><span className={typeBadge(l.type)}>{(l.type || '').toUpperCase()}</span></td>
                <td className="px-3 py-3"><span className={typeBadge(l.source)}>{(l.source || '').toUpperCase()}</span></td>
                <td className="px-3 py-3"><span className={resultBadge(l.result)}>{(l.result || '').toUpperCase()}</span></td>
                <td className="px-3 py-3 text-slate-400 text-xs">{l.reason || '—'}</td>
              </tr>
              )
            })}
          </tbody>
        </table>
        <Pagination meta={data} onChange={setPage} />
      </div>
    </>
  )
}
