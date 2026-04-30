import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useEmployees, useSaveEmployee, useDeleteEmployee, useSites } from '../api/queries'
import Pagination from '../components/Pagination'
import Select from '../components/Select'
import DatePicker from '../components/DatePicker'
import RowMenu from '../components/RowMenu'
import {
  prewarmBackgroundRemoval,
  removeBackgroundOnWhite,
  dataUrlToFile,
} from '../lib/backgroundRemoval'

const inputCls =
  'w-full bg-surface-container-lowest border border-outline-variant/50 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all'

export default function Employees() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [q])
  const { data, isLoading } = useEmployees({ q, page })
  const { data: sitesData } = useSites({ all: 1 })
  const save = useSaveEmployee()
  const del = useDeleteEmployee()
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [printing, setPrinting] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [bulkPrinting, setBulkPrinting] = useState(null)

  const sites = sitesData?.data ?? []

  const openNew = () => setEditing({
    employee_code: '',
    name: '',
    designation: '',
    meal_eligibility: true,
    duty_status: 'on_duty',
    date_of_joining: '',
    grade: '',
    site_id: null,
    profile_picture: null,
    is_vip: false,
    active: true,
  })
  const close = () => setEditing(null)

  const onSave = async (e) => {
    e.preventDefault()
    await save.mutateAsync(editing)
    close()
  }

  const apiOrigin = (import.meta.env.VITE_API_BASE || 'http://localhost:8000/api').replace(/\/api\/?$/, '')
  const pictureUrl = (path) => (path ? `${apiOrigin}/storage/${path}` : null)

  const rows = data?.data ?? []

  const toggleSelect = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }
  const toggleSelectAll = () => {
    if (selected.size === rows.length && rows.length > 0) setSelected(new Set())
    else setSelected(new Set(rows.map(r => r.id)))
  }
  const openBulkPrint = () => {
    const picks = rows.filter(r => selected.has(r.id))
    if (picks.length > 0) setBulkPrinting(picks)
  }

  return (
    <>
      <header className="flex justify-between items-end mb-lg">
        <div>
          <h1 className="font-h1 text-h1 text-slate-100">Employees</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Manage employee records and QR codes.</p>
        </div>
        <div className="flex gap-sm">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" style={{ fontSize: 18 }}>search</span>
            <input
              placeholder="Search employees…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/50 rounded pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all w-64"
            />
          </div>
          {selected.size > 0 && (
            <button
              onClick={openBulkPrint}
              className="bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>print</span>
              Print {selected.size} card{selected.size === 1 ? '' : 's'}
            </button>
          )}
          <button
            onClick={openNew}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Add employee
          </button>
        </div>
      </header>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-visible">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3 font-medium w-8">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={rows.length > 0 && selected.size === rows.length}
                  onChange={toggleSelectAll}
                  className="rounded border-outline-variant bg-surface-container-lowest text-blue-500 focus:ring-blue-400"
                />
              </th>
              <th className="px-4 py-3 font-medium">Photo</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Designation</th>
              <th className="px-4 py-3 font-medium">Eligible</th>
              <th className="px-4 py-3 font-medium">Duty</th>
              <th className="px-4 py-3 font-medium">Site</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-center">Print</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && (
              <tr><td colSpan="12" className="p-6 text-center text-slate-500">Loading…</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan="12" className="p-6 text-center text-slate-500">No employees.</td></tr>
            )}
            {rows.map((e) => (
              <tr key={e.id} className="hover:bg-surface-container-highest/10 transition-colors">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(e.id)}
                    onChange={() => toggleSelect(e.id)}
                    className="rounded border-outline-variant bg-surface-container-lowest text-blue-500 focus:ring-blue-400"
                  />
                </td>
                <td className="px-4 py-3">
                  {e.profile_picture ? (
                    <img src={pictureUrl(e.profile_picture)} alt="" className="w-10 h-10 rounded-full object-cover border border-outline-variant/40" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest/40 border border-outline-variant/40 flex items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">{e.employee_code}</td>
                <td className="px-4 py-3 text-slate-200 font-medium">{e.name}</td>
                <td className="px-4 py-3 text-slate-300">{e.designation || <span className="text-slate-500">—</span>}</td>
                <td className="px-4 py-3">
                  {e.meal_eligibility
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border bg-green-900/40 text-green-400 border-green-800/50">YES</span>
                    : <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border bg-slate-900/40 text-slate-400 border-slate-700/50">NO</span>}
                </td>
                <td className="px-4 py-3 text-slate-300 text-xs uppercase tracking-wide">{(e.duty_status || 'on_duty').replace('_', ' ')}</td>
                <td className="px-4 py-3 text-slate-300">
                  {e.site ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-slate-500">{e.site.site_code}</span>
                      <span>{e.site.name}</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-300 font-mono text-[12px]">
                  {e.date_of_joining ? String(e.date_of_joining).slice(0, 10) : <span className="text-slate-500">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ' +
                      (e.active
                        ? 'bg-green-900/40 text-green-400 border-green-800/50'
                        : 'bg-slate-900/40 text-slate-400 border-slate-700/50')
                    }
                  >
                    {e.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setPrinting(e)}
                    className="p-1.5 rounded hover:bg-surface-container-highest/40 text-slate-400 hover:text-slate-200 transition-colors"
                    aria-label="Print card"
                    title="Print card"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>print</span>
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <RowMenu
                    items={[
                      { icon: 'visibility', label: 'View', onClick: () => setViewing(e) },
                      { icon: 'edit', label: 'Edit', onClick: () => setEditing(e) },
                      { icon: 'print', label: 'Print card', onClick: () => setPrinting(e) },
                      { icon: 'delete', label: 'Delete', danger: true, onClick: () => { if (confirm(`Delete ${e.employee_code}?`)) del.mutate(e.id) } },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination meta={data} onChange={setPage} />
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setViewing(null)}>
          <div onClick={(ev) => ev.stopPropagation()} className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-start gap-md mb-md">
              {viewing.profile_picture ? (
                <img src={pictureUrl(viewing.profile_picture)} alt="" className="w-20 h-20 rounded-full object-cover border border-outline-variant/40" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-surface-container-highest/40 border border-outline-variant/40 flex items-center justify-center text-slate-500">
                  <span className="material-symbols-outlined" style={{ fontSize: 36 }}>person</span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-h3 font-h3 text-slate-100">{viewing.name}</h2>
                <p className="font-mono text-sm text-slate-400 mt-1">{viewing.employee_code}</p>
                <span
                  className={
                    'inline-flex items-center mt-2 px-2 py-0.5 rounded text-[10px] font-semibold border ' +
                    (viewing.active
                      ? 'bg-green-900/40 text-green-400 border-green-800/50'
                      : 'bg-slate-900/40 text-slate-400 border-slate-700/50')
                  }
                >
                  {viewing.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-md text-sm">
              <div>
                <dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">Designation</dt>
                <dd className="text-slate-200">{viewing.designation || '—'}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">Grade</dt>
                <dd className="text-slate-200">{viewing.grade || '—'}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">Meal eligibility</dt>
                <dd className="text-slate-200">{viewing.meal_eligibility === false ? 'No' : 'Yes'}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">Duty status</dt>
                <dd className="text-slate-200">{(viewing.duty_status || 'on_duty').replace('_', ' ')}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">Date of joining</dt>
                <dd className="text-slate-200 font-mono text-[13px]">{viewing.date_of_joining ? String(viewing.date_of_joining).slice(0, 10) : '—'}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">Site</dt>
                <dd className="text-slate-200">
                  {viewing.site ? (
                    <>
                      <span className="font-mono text-[11px] text-slate-500 mr-1.5">{viewing.site.site_code}</span>
                      {viewing.site.name}
                    </>
                  ) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">QR</dt>
                <dd>
                  <div className="bg-white p-1.5 rounded inline-block">
                    <QRCodeSVG value={viewing.employee_code} size={72} />
                  </div>
                </dd>
              </div>
            </dl>

            <div className="flex justify-end gap-sm pt-lg mt-md border-t border-outline-variant/30">
              <button onClick={() => setViewing(null)} className="px-4 py-2 rounded border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 transition-colors">Close</button>
              <button
                onClick={() => { const e = viewing; setViewing(null); setEditing(e) }}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={onSave} className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-lg w-full max-w-lg space-y-md max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-h3 font-h3 text-slate-100">{editing.id ? 'Edit' : 'New'} Employee</h2>
              <p className="text-body-md text-slate-400 mt-1">Assign a unique code to generate a QR.</p>
            </div>
            <PhotoDropzone
              value={editing.profile_picture}
              existingUrl={pictureUrl(typeof editing.profile_picture === 'string' ? editing.profile_picture : null)}
              onChange={(file) => setEditing({ ...editing, profile_picture: file })}
            />
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Employee code</label>
              <input
                required
                value={editing.employee_code || ''}
                onChange={(ev) => setEditing({ ...editing, employee_code: ev.target.value })}
                className={`${inputCls} font-mono`}
                placeholder="EMP-00001"
              />
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Name</label>
              <input
                required
                value={editing.name || ''}
                onChange={(ev) => setEditing({ ...editing, name: ev.target.value })}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Designation</label>
                <input
                  value={editing.designation || ''}
                  onChange={(ev) => setEditing({ ...editing, designation: ev.target.value })}
                  className={inputCls}
                  placeholder="Software Engineer"
                />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Grade</label>
                <input
                  value={editing.grade || ''}
                  onChange={(ev) => setEditing({ ...editing, grade: ev.target.value })}
                  className={inputCls}
                  placeholder="L2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Meal eligibility</label>
                <Select
                  value={editing.meal_eligibility === false ? 'no' : 'yes'}
                  onChange={(v) => setEditing({ ...editing, meal_eligibility: v === 'yes' })}
                  options={[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Duty status</label>
                <Select
                  value={editing.duty_status || 'on_duty'}
                  onChange={(v) => setEditing({ ...editing, duty_status: v })}
                  options={[
                    { value: 'on_duty', label: 'On Duty' },
                    { value: 'allowance', label: 'Allowance' },
                  ]}
                />
              </div>
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Date of joining</label>
              <DatePicker
                value={editing.date_of_joining ? String(editing.date_of_joining).slice(0, 10) : ''}
                onChange={(v) => setEditing({ ...editing, date_of_joining: v })}
                placeholder="Pick a date"
              />
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Site</label>
              <Select
                searchable
                value={editing.site_id ?? ''}
                onChange={(v) => setEditing({ ...editing, site_id: v === '' ? null : Number(v) })}
                options={[
                  { value: '', label: '— Unassigned —' },
                  ...sites.map((s) => ({ value: String(s.id), label: `${s.site_code} — ${s.name}` })),
                ]}
              />
            </div>
            <div className="flex gap-md text-sm">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={editing.active !== false}
                  onChange={(ev) => setEditing({ ...editing, active: ev.target.checked })}
                  className="rounded border-outline-variant bg-surface-container-lowest text-blue-500 focus:ring-blue-400"
                />
                Active
              </label>
            </div>
            <div className="flex justify-end gap-sm pt-sm">
              <button type="button" onClick={close} className="px-4 py-2 rounded border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 transition-colors">Cancel</button>
              <button type="submit" disabled={save.isPending} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-60 transition-colors">
                {save.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {printing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setPrinting(null)}>
          <div onClick={(ev) => ev.stopPropagation()} className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-lg max-w-sm w-full">
            <h2 className="text-h3 font-h3 text-slate-100 mb-md">Access card</h2>
            <div className="flex justify-center bg-slate-900/40 rounded-lg p-md">
              <div id="print-card-area">
                <AccessCard employee={printing} pictureUrl={pictureUrl} />
              </div>
            </div>
            <div className="flex justify-end gap-sm pt-md">
              <button onClick={() => setPrinting(null)} className="px-4 py-2 rounded border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 transition-colors">Close</button>
              <button onClick={() => window.print()} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-2 transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>print</span>
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkPrinting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setBulkPrinting(null)}>
          <div onClick={(ev) => ev.stopPropagation()} className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-md">
              <div>
                <h2 className="text-h3 font-h3 text-slate-100">Bulk access cards</h2>
                <p className="text-body-md text-slate-400 mt-1">{bulkPrinting.length} card{bulkPrinting.length === 1 ? '' : 's'} — printed in a grid.</p>
              </div>
              <div className="flex gap-sm">
                <button onClick={() => setBulkPrinting(null)} className="px-4 py-2 rounded border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 transition-colors">Close</button>
                <button onClick={() => window.print()} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-2 transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>print</span>
                  Print all
                </button>
              </div>
            </div>
            <div id="print-card-area" className="bulk-print-grid bg-slate-900/40 rounded-lg p-md">
              {bulkPrinting.map(e => <AccessCard key={e.id} employee={e} pictureUrl={pictureUrl} />)}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function PhotoDropzone({ value, existingUrl, onChange }) {
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [bgError, setBgError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => { prewarmBackgroundRemoval() }, [])

  const preview = value instanceof File ? URL.createObjectURL(value) : existingUrl

  const pick = async (file) => {
    if (!file) return
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return
    setBgError(null)
    setProcessing(true)
    try {
      const cleanedDataUrl = await removeBackgroundOnWhite(file)
      const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '')
      const cleanedFile = await dataUrlToFile(cleanedDataUrl, `${baseName}.jpg`)
      onChange(cleanedFile)
    } catch (e) {
      console.error('Background removal failed', e)
      setBgError('Background removal failed — using original image.')
      onChange(file)
    } finally {
      setProcessing(false)
    }
  }

  const onDrop = (ev) => {
    ev.preventDefault()
    setDragging(false)
    if (processing) return
    const file = ev.dataTransfer?.files?.[0]
    pick(file)
  }

  return (
    <div>
      <label className="block text-label-md text-slate-300 mb-1.5">Profile picture</label>
      <div
        onClick={() => { if (!processing) inputRef.current?.click() }}
        onDragOver={(ev) => { ev.preventDefault(); if (!processing) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={
          'flex items-center gap-md rounded-lg border-2 border-dashed p-md transition-colors ' +
          (processing ? 'cursor-wait opacity-80 ' : 'cursor-pointer ') +
          (dragging
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-outline-variant/50 hover:border-blue-400/60 hover:bg-surface-container-highest/20')
        }
      >
        {preview ? (
          <img src={preview} alt="" className="w-16 h-16 rounded-full object-cover border border-outline-variant/40 bg-white" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-surface-container-highest/40 border border-outline-variant/40 flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>person</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-slate-200 font-medium flex items-center gap-2">
            <span
              className={
                'material-symbols-outlined ' +
                (processing ? 'text-blue-400 animate-spin' : 'text-slate-400')
              }
              style={{ fontSize: 18 }}
            >
              {processing ? 'autorenew' : dragging ? 'file_download' : 'upload'}
            </span>
            {processing
              ? 'Removing background…'
              : dragging
                ? 'Drop to upload'
                : value instanceof File
                  ? value.name
                  : 'Drop file or click to upload'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {bgError
              ? <span className="text-amber-400">{bgError}</span>
              : 'PNG, JPEG or WebP · up to 4 MB · background auto-replaced with white'}
          </div>
        </div>
        {value instanceof File && !processing && (
          <button type="button" onClick={(ev) => { ev.stopPropagation(); onChange(null); setBgError(null) }}
            className="p-1.5 rounded hover:bg-surface-container-highest/40 text-slate-400 hover:text-red-400 shrink-0">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={processing}
          onChange={(ev) => pick(ev.target.files?.[0])}
          className="hidden"
        />
      </div>
    </div>
  )
}

function AccessCard({ employee, pictureUrl }) {
  const doj = employee.date_of_joining ? String(employee.date_of_joining).slice(0, 10) : null
  const dojFormatted = doj ? `${doj.slice(8, 10)}/${doj.slice(5, 7)}/${doj.slice(0, 4)}` : '—'
  const photo = employee.profile_picture ? pictureUrl(employee.profile_picture) : null
  const brandPrimary = '#0e7490'

  return (
    <div
      className="access-card bg-white text-black relative"
      style={{ width: '53.98mm', height: '85.6mm', padding: '4mm 5mm', fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box', overflow: 'hidden', borderRadius: 0, boxShadow: 'none' }}
    >
      {/* Decorative arcs — optional, enable later if desired
      <svg
        className="absolute top-0 right-0 pointer-events-none"
        width="26mm"
        height="26mm"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMaxYMin meet"
      >
        <circle cx="100" cy="0" r="55" fill="none" stroke={brandPrimary} strokeWidth="0.6" opacity="0.85" />
        <circle cx="100" cy="0" r="68" fill="none" stroke={brandPrimary} strokeWidth="0.6" opacity="0.7" />
        <circle cx="100" cy="0" r="82" fill="none" stroke={brandPrimary} strokeWidth="0.6" opacity="0.55" />
        <circle cx="100" cy="0" r="96" fill="none" stroke={brandPrimary} strokeWidth="0.6" opacity="0.4" />
      </svg>
      */}

      <div className="flex justify-center relative" style={{ marginTop: '2mm' }}>
        <div
          style={{
            width: '34mm',
            height: '34mm',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#f8fafc',
            border: '0.35mm solid',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
        >
          {photo ? (
            <img
              src={photo}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                borderRadius: '50%',
              }}
            />
          ) : (
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 60 }}>person</span>
          )}
        </div>
      </div>

      <div className="text-center" style={{ marginTop: '2mm' }}>
        <div className="text-[12px] font-bold leading-tight">{employee.name}</div>
        <div className="text-[15px] font-bold leading-tight" style={{ marginTop: '1mm' }}>
          {employee.designation || '—'}
        </div>
      </div>

      <div className="flex justify-between items-end gap-2" style={{ marginTop: '2.5mm' }}>
        <div className="text-[12.5px] font-bold" style={{ lineHeight: 1.4 }}>
          <div>{employee.employee_code}</div>
          <div>DOJ: {dojFormatted}</div>
          <div>Grade: {employee.grade || '—'}</div>
        </div>
        <div className="bg-white">
          <QRCodeSVG value={employee.employee_code} size={50} />
        </div>
      </div>

      <div
        className="text-center"
        style={{ position: 'absolute', left: 0, right: 0, bottom: '3mm' }}
      >
        <div
          style={{
            color: brandPrimary,
            fontFamily: '"Montserrat", "Inter", system-ui, sans-serif',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          <span style={{ fontWeight: 800,  fontSize:"23px", textTransform: 'lowercase' }}>i</span>
          <span style={{ fontWeight: 800,  fontSize:"30px", textTransform: 'lowercase' }}>nnovo</span>
          <span style={{ fontWeight: 800, fontSize:"24px", textTransform: 'uppercase', letterSpacing: '0.02em', marginLeft: '1.4mm' }}>MEP</span>
        </div>
        <div
          style={{
            fontFamily: '"Montserrat", "Inter", system-ui, sans-serif',
            fontSize: '11px',
            fontWeight:"bold",
            color:"#000",
            marginTop: '1mm',
            letterSpacing: '0.02em',
          }}
        >
          innovogroup.com
        </div>
      </div>
    </div>
  )
}
