import { useState } from 'react'
import { useMealRules, useSaveMealRule, useDeleteMealRule } from '../api/queries'
import Pagination from '../components/Pagination'
import RowMenu from '../components/RowMenu'
import Checkbox from '../components/Checkbox'
import TimePicker from '../components/TimePicker'

const EMPTY = { name: '', start_time: '12:00', end_time: '14:00', max_per_day: 1, active: true }

const inputCls =
  'w-full bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 hover:bg-surface-container-high/70 hover:border-outline-variant/50 focus:bg-surface-container-high focus:border-blue-400 focus:ring-1 focus:ring-blue-400/60 focus:outline-none transition-all'

export default function MealRules() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useMealRules({ page })
  const rules = data?.data
  const save = useSaveMealRule()
  const del = useDeleteMealRule()
  const [editing, setEditing] = useState(null)

  const onSave = async (e) => {
    e.preventDefault()
    await save.mutateAsync(editing)
    setEditing(null)
  }

  return (
    <>
      <header className="flex justify-between items-end mb-lg">
        <div>
          <h1 className="font-h1 text-h1 text-slate-100">Meal Rules</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Configure sessions, time windows, and limits.</p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Add rule
        </button>
      </header>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-visible">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">End</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="5" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && (!rules || rules.length === 0) && (
              <tr><td colSpan="5" className="p-6 text-center text-slate-500">No meal rules.</td></tr>
            )}
            {rules?.map((r) => (
              <tr key={r.id} className="hover:bg-surface-container-highest/10 transition-colors">
                <td className="px-4 py-3 text-slate-200 font-medium">{r.name}</td>
                <td className="px-4 py-3 font-mono text-slate-300">{r.start_time}</td>
                <td className="px-4 py-3 font-mono text-slate-300">{r.end_time}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ' +
                      (r.active
                        ? 'bg-green-900/40 text-green-400 border-green-800/50'
                        : 'bg-slate-900/40 text-slate-400 border-slate-700/50')
                    }
                  >
                    {r.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <RowMenu
                    items={[
                      { icon: 'edit', label: 'Edit', onClick: () => setEditing({ ...r }) },
                      { icon: 'delete', label: 'Delete', danger: true, onClick: () => { if (confirm(`Delete ${r.name}?`)) del.mutate(r.id) } },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination meta={data} onChange={setPage} />
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={onSave} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-lg w-full max-w-md space-y-md">
            <div>
              <h2 className="text-h3 font-h3 text-slate-100">{editing.id ? 'Edit' : 'New'} Meal Rule</h2>
              <p className="text-body-md text-slate-400 mt-1">Defines a time window for this meal.</p>
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Name</label>
              <input
                required
                value={editing.name}
                onChange={(ev) => setEditing({ ...editing, name: ev.target.value })}
                className={inputCls}
                placeholder="Breakfast"
              />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Start</label>
                <TimePicker
                  required
                  value={editing.start_time?.slice(0, 5) || ''}
                  onChange={(v) => setEditing({ ...editing, start_time: v ? v + ':00' : '' })}
                  placeholder="Pick a time"
                />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">End</label>
                <TimePicker
                  required
                  value={editing.end_time?.slice(0, 5) || ''}
                  onChange={(v) => setEditing({ ...editing, end_time: v ? v + ':00' : '' })}
                  placeholder="Pick a time"
                />
              </div>
            </div>
            <Checkbox
              checked={!!editing.active}
              onChange={(v) => setEditing({ ...editing, active: v })}
            >
              Active
            </Checkbox>
            <div className="flex justify-end gap-sm pt-sm">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-colors">Cancel</button>
              <button type="submit" disabled={save.isPending} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60 transition-colors">
                {save.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
