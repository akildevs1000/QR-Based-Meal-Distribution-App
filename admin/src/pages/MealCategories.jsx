import { useState } from 'react'
import {
  useCuisines, useSaveCuisine, useDeleteCuisine,
  useMealCategories, useSaveMealCategory, useDeleteMealCategory,
} from '../api/queries'
import Select from '../components/Select'
import Checkbox from '../components/Checkbox'

const inputCls =
  'w-full bg-surface-container-lowest border border-outline-variant/50 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all'

export default function MealCategories() {
  const { data: cuisinesData, isLoading } = useCuisines({ all: 1, with_categories: 1 })
  const saveCuisine = useSaveCuisine()
  const delCuisine = useDeleteCuisine()
  const saveCat = useSaveMealCategory()
  const delCat = useDeleteMealCategory()
  const [editingCuisine, setEditingCuisine] = useState(null)
  const [editingCat, setEditingCat] = useState(null)

  const cuisines = cuisinesData?.data ?? []

  const onSaveCuisine = async (e) => { e.preventDefault(); await saveCuisine.mutateAsync(editingCuisine); setEditingCuisine(null) }
  const onSaveCat = async (e) => { e.preventDefault(); await saveCat.mutateAsync(editingCat); setEditingCat(null) }

  return (
    <>
      <header className="flex justify-between items-end mb-lg">
        <div>
          <h1 className="font-h1 text-h1 text-slate-100">Meal Types & Categories</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Cuisines and their meal categories (Veg Rice, Non-Veg Chapati, etc).</p>
        </div>
        <button onClick={() => setEditingCuisine({ name: '', active: true })}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>Add cuisine
        </button>
      </header>

      {isLoading && <div className="text-center text-slate-500 p-8">Loading…</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {cuisines.map(c => (
          <div key={c.id} className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-md">
            <div className="flex items-start justify-between mb-sm">
              <div>
                <h3 className="text-h3 font-h3 text-slate-100">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{c.categories_count ?? (c.categories?.length ?? 0)} categories</p>
              </div>
              <div className="flex items-center gap-1">
                <span className={
                  'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ' +
                  (c.active ? 'bg-green-900/40 text-green-400 border-green-800/50' : 'bg-slate-900/40 text-slate-400 border-slate-700/50')
                }>{c.active ? 'ACTIVE' : 'INACTIVE'}</span>
                <button onClick={() => setEditingCuisine({ ...c })} className="p-1.5 text-slate-400 hover:text-slate-200"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span></button>
                <button onClick={() => { if (confirm(`Delete cuisine "${c.name}" and all its categories?`)) delCuisine.mutate(c.id) }}
                  className="p-1.5 text-red-400 hover:text-red-300"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span></button>
              </div>
            </div>

            <div className="space-y-1">
              {(c.categories ?? []).length === 0 && <div className="text-slate-500 text-xs italic">No categories yet.</div>}
              {(c.categories ?? []).map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-surface-container-highest/20 rounded px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 text-sm">{cat.name}</span>
                    {!cat.active && <span className="text-[9px] text-slate-500 uppercase">inactive</span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditingCat({ ...cat, cuisine_id: c.id })} className="p-1 text-slate-400 hover:text-slate-200"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span></button>
                    <button onClick={() => { if (confirm(`Delete category "${cat.name}"?`)) delCat.mutate(cat.id) }} className="p-1 text-red-400 hover:text-red-300"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span></button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setEditingCat({ cuisine_id: c.id, name: '', active: true })}
              className="mt-sm w-full text-sm text-blue-400 hover:text-blue-300 border border-dashed border-outline-variant/50 rounded py-2 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>Add category
            </button>
          </div>
        ))}
      </div>

      {editingCuisine && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={onSaveCuisine} className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-lg w-full max-w-sm space-y-md">
            <h2 className="text-h3 font-h3 text-slate-100">{editingCuisine.id ? 'Edit' : 'New'} Cuisine</h2>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Name</label>
              <input required value={editingCuisine.name} onChange={e => setEditingCuisine({ ...editingCuisine, name: e.target.value })} className={inputCls} placeholder="North Indian" />
            </div>
            <Checkbox
              checked={!!editingCuisine.active}
              onChange={(v) => setEditingCuisine({ ...editingCuisine, active: v })}
            >
              Active
            </Checkbox>
            <div className="flex justify-end gap-sm pt-sm">
              <button type="button" onClick={() => setEditingCuisine(null)} className="px-4 py-2 rounded border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 transition-colors">Cancel</button>
              <button type="submit" disabled={saveCuisine.isPending} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-60 transition-colors">
                {saveCuisine.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingCat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={onSaveCat} className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-lg w-full max-w-sm space-y-md">
            <h2 className="text-h3 font-h3 text-slate-100">{editingCat.id ? 'Edit' : 'New'} Meal Category</h2>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Cuisine</label>
              <Select
                value={editingCat.cuisine_id}
                onChange={(v) => setEditingCat({ ...editingCat, cuisine_id: Number(v) })}
                options={cuisines.map(c => ({ value: c.id, label: c.name }))}
              />
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Category name</label>
              <input required value={editingCat.name} onChange={e => setEditingCat({ ...editingCat, name: e.target.value })} className={inputCls} placeholder="Veg Rice" />
            </div>
            <Checkbox
              checked={!!editingCat.active}
              onChange={(v) => setEditingCat({ ...editingCat, active: v })}
            >
              Active
            </Checkbox>
            <div className="flex justify-end gap-sm pt-sm">
              <button type="button" onClick={() => setEditingCat(null)} className="px-4 py-2 rounded border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 transition-colors">Cancel</button>
              <button type="submit" disabled={saveCat.isPending} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-60 transition-colors">
                {saveCat.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
