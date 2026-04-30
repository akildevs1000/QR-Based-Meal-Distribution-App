# ADMIN.md — React 19 + Vite + Tailwind Conventions

The frontend half of the kit. Pair with [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) (the visual rules) and [PHILOSOPHY.md](PHILOSOPHY.md) (the why).

Reference: [../admin/](../admin/).

## 1. Stack

```
react              19
react-dom          19
react-router-dom   7
@tanstack/react-query  5
axios              1
tailwindcss        3
vite               5+
```

Optional, only when needed:
- `qrcode.react` — if generating QR codes
- `@imgly/background-removal` — if doing client-side image processing

Do **not** install: MUI, Chakra, AntD, Mantine, Bootstrap, styled-components, emotion, redux, zustand, jotai, formik, react-hook-form, yup, zod, dayjs, date-fns, lodash. None of them are needed.

## 2. Folder layout

```
admin/
├── index.html                # add Material Symbols + Inter font links
├── package.json
├── vite.config.js            # Vite default
├── tailwind.config.js        # COPY VERBATIM from snippets/
├── postcss.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx              # COPY from snippets/ — providers + router
    ├── App.jsx               # routing skeleton (section 5)
    ├── index.css             # COPY VERBATIM from snippets/
    ├── api/
    │   ├── client.js         # axios instance + token storage
    │   └── queries.js        # all useX/useSaveX/useDeleteX hooks
    ├── components/           # COPY all primitives from ../admin/src/components/
    │   ├── Layout.jsx
    │   ├── SideNavBar.jsx    # edit navGroups
    │   ├── DatePicker.jsx
    │   ├── DateRangePicker.jsx
    │   ├── Select.jsx
    │   ├── Pagination.jsx
    │   ├── ProtectedRoute.jsx
    │   └── RowMenu.jsx       # only if used
    └── pages/
        ├── Login.jsx
        ├── Dashboard.jsx
        └── ResourceX.jsx
```

## 3. `api/client.js`

Source: [snippets/api-client.js](snippets/api-client.js). One axios instance with two interceptors.

```js
const TOKEN_KEY = 'myapp_token'   // CHANGE PER APP

export const api = axios.create({ baseURL: resolveBaseURL() })

api.interceptors.request.use((config) => {
  const t = getToken()
  if (t) config.headers.Authorization = `Bearer ${t}`
  config.headers.Accept = 'application/json'
  return config
})

api.interceptors.response.use(r => r, err => {
  if (err?.response?.status === 401) {
    setToken(null)
    if (window.location.pathname !== '/login') window.location.assign('/login')
  }
  return Promise.reject(err)
})
```

`resolveBaseURL()`: prefer `VITE_API_BASE` env, else `${protocol}//${hostname}:8000/api`, else localhost.

## 4. `api/queries.js` — the hook convention

For every backend resource X, write four hooks (all but `useX` are optional depending on the resource):

```js
// LIST
export function useResourceX(params = {}) {
  return useQuery({
    queryKey: ['resource-x', params],
    queryFn: async () => (await api.get('/resource-x', { params })).data,
  })
}

// ONE (only when you need detail loading)
export function useResourceXOne(id, enabled = true) {
  return useQuery({
    queryKey: ['resource-x', id],
    enabled: !!id && enabled,
    queryFn: async () => (await api.get(`/resource-x/${id}`)).data,
  })
}

// UPSERT (POST if no id, PUT if id)
export function useSaveResourceX() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (obj) => obj.id
      ? (await api.put(`/resource-x/${obj.id}`, obj)).data
      : (await api.post('/resource-x', obj)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resource-x'] }),
  })
}

// DELETE
export function useDeleteResourceX() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/resource-x/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resource-x'] }),
  })
}
```

For resources with **file uploads** (e.g. an avatar field), wrap payload-building:

```js
function buildResourceXPayload(obj) {
  const hasFile = obj.avatar instanceof File
  if (!hasFile) {
    const { avatar, ...rest } = obj
    return { data: rest, headers: undefined }
  }
  const fd = new FormData()
  Object.entries(obj).forEach(([k, v]) => {
    if (k === 'id' || v == null) return
    if (k === 'avatar' && !(v instanceof File)) return
    if (typeof v === 'boolean') fd.append(k, v ? '1' : '0')
    else fd.append(k, v)
  })
  return { data: fd, headers: { 'Content-Type': 'multipart/form-data' } }
}

// In useSaveResourceX, when updating with FormData:
//   data.append('_method', 'PUT')
//   POST instead of PUT
```

The Laravel `_method: 'PUT'` workaround is required because PHP doesn't parse multipart bodies on PUT.

## 5. Routing skeleton (`App.jsx`)

```jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route element={<ProtectedRoute><Layout/></ProtectedRoute>}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/resource-x" element={<ResourceX />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Route>
</Routes>
```

Catch-all redirects to dashboard, not 404.

## 6. Page recipe (the list page)

Every list page follows this exact skeleton (the `Logs` page in this repo is the cleanest example).

```jsx
export default function ResourceX() {
  const [filters, setFilters] = useState({ q: '', type: '', site_id: '' })
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [filters])

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
  const { data, isLoading } = useResourceX({ ...params, page })
  const rows = data?.data ?? []

  return (
    <>
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-md mb-lg">
        <div className="min-w-0">
          <h1 className="font-h1 text-h1 text-slate-100">Title</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Subtitle.</p>
        </div>
        <button className="bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          New
        </button>
      </header>

      {/* Filter toolbar — inline, no labels */}
      <div className="flex flex-wrap items-center gap-sm mb-md">
        <DatePicker value={filters.date} onChange={v => setFilters({...filters, date: v})} placeholder="Any date" className="w-44" />
        <Select value={filters.type} onChange={v => setFilters({...filters, type: v})} className="w-40"
                options={[{value:'',label:'Any type'}, {value:'a',label:'A'}]} />
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters({date:'', type:''})}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            <span className="material-symbols-outlined" style={{fontSize:16}}>close</span>Clear
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-hidden">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan={2} className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan={2} className="p-6 text-center text-slate-500">No results.</td></tr>}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-surface-container-highest/10 transition-colors">
                <td className="px-3 py-3 text-slate-200">{r.name}</td>
                <td className="px-3 py-3 text-slate-400 text-sm">{r.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination meta={data} onChange={setPage} />
      </div>
    </>
  )
}
```

State pattern (mandatory):
- One `filters` object held in a single `useState`.
- `useEffect(() => setPage(1), [filters])` resets pagination on any filter change.
- `params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ''))` strips empties.
- `rows = data?.data ?? []`.
- Loading / empty rows use `colSpan={N}` matching column count.

## 7. Edit modals (preferred) or drawers

Don't make a separate `/resource-x/:id/edit` route. Open a modal/drawer on the same page. Pattern:

```jsx
const [editing, setEditing] = useState(null)   // null | { ...item } | {} for new

// trigger: setEditing(row)  for edit
//          setEditing({})    for new
// in JSX:
{editing && <EditDialog value={editing} onClose={() => setEditing(null)} />}
```

The dialog uses the form field pattern from [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) section 5.

## 8. Auth flow (end-to-end)

1. `<Login/>` form calls `useLogin().mutateAsync({ email, password })`.
2. `onSuccess` of `useLogin` stores the token: `setToken(data.token)`.
3. `<Login/>` then `nav('/dashboard', { replace: true })`.
4. All subsequent requests carry `Authorization: Bearer <token>` (request interceptor).
5. Any 401 → response interceptor clears token + redirects to `/login`.
6. `<ProtectedRoute>` blocks unauthenticated access on app load.
7. `useLogout()` POSTs `/logout`, clears token in `onSettled` (so it clears on network error too).

No refresh tokens. No silent renewal. No httpOnly cookies. Simple by design.

## 9. Environment variables

```
VITE_API_BASE=http://localhost:8000/api    # optional; falls back to current host:8000/api
```

Vite exposes only `VITE_*` to client code. Don't put secrets here.

## 10. Build + dev

```
npm run dev         # http://localhost:5173
npm run build       # outputs dist/
npm run preview     # serves dist/ for sanity check
```

Deploy: serve `dist/` as static. Any static host (nginx, S3, Vercel, Netlify) works. The backend lives at a separate origin; CORS handles the boundary.
