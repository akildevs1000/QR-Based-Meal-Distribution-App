# Starter Guide — Design & Functional Philosophy

A reference for spinning up a new app (admin / counter / scanner / customer portal / anything) that *feels* and *behaves* the same as this one. Not a framework, not a published package — a documented pattern set with concrete code references so you can copy with intent.

The canonical implementation lives in [admin/](admin/). Everything below points back to that folder.

---

## 1. Stack

The only opinions baked into the philosophy:

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | React 19 + Vite | Fast dev server, no SSR complexity |
| Routing | react-router-dom v7 | Nested routes + `<Outlet/>` layout |
| Data | @tanstack/react-query + axios | Cache-by-key, mutations invalidate keys |
| Styling | Tailwind 3 + custom token theme | All design tokens live in `tailwind.config.js` |
| Icons | Material Symbols Outlined (web font) | One source, sized inline via `style={{ fontSize }}` |
| Auth | Bearer token in `localStorage` | 401 interceptor → redirect to `/login` |

Reference: [admin/package.json](admin/package.json)

---

## 2. Design Philosophy (the non-negotiables)

These are the rules that make everything look like the same app.

1. **Dark, high-density, analytical.** Surface `#0b1326`, accent blue `#3B82F6`. No gradients, no shadows beyond `shadow-xl` on popovers. Borders are `outline-variant/50`.
2. **Tokens, not raw colors.** Never write `bg-slate-900` for a surface — use `bg-surface-container-low`. Slate is allowed for *text* (`text-slate-100`, `text-slate-400`, `text-slate-500`).
3. **Spacing is a small alphabet.** `xs/sm/md/lg/xl/2xl` (4/8/16/24/32/48). Page gutter is `p-gutter` (24px). Card padding is `p-md`. Don't invent new spacings.
4. **Typography classes match named tokens.** `font-h1 text-h1`, `font-body-md text-body-md`, `font-label-sm text-label-sm`. Headings are `text-slate-100`, body is `text-slate-300/400`, hint is `text-slate-500`.
5. **Inline filter toolbar over bordered filter card.** No labels above filter inputs — each `Select`/`DatePicker` has its own placeholder. See [Logs.jsx:65-142](admin/src/pages/Logs.jsx#L65-L142).
6. **Borders are thin and translucent.** `border border-outline-variant/50` on inputs/cards, `border-outline-variant/30` on dividers.
7. **Focus ring is blue.** Always `focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none`.
8. **Selected = blue; today = blue ring; in-range = blue/20.** Same in `DatePicker`, `DateRangePicker`, `Pagination`, list rows.
9. **Material Symbols, sized inline.** `<span className="material-symbols-outlined" style={{ fontSize: 18 }}>icon_name</span>`. Don't import an icon library.
10. **No CSS files per component.** All styling is Tailwind classes. The only global CSS is [admin/src/index.css](admin/src/index.css) (font, scrollbar, print).

---

## 3. Design Tokens

The full token table is in [admin/DESIGN.md](admin/DESIGN.md) and the live config is [admin/tailwind.config.js](admin/tailwind.config.js). When cloning to a new app, **copy `tailwind.config.js` and `index.css` verbatim** unless the brand changes.

Key token groups:

- **Surface ramp:** `surface-container-lowest` < `surface` < `surface-container-low` < `surface-container` < `surface-container-high` < `surface-container-highest`. Forms sit on `surface-container-lowest`, cards on `surface-container-low`.
- **Text ramp:** `slate-100` (primary) → `slate-300` (body) → `slate-400` (secondary) → `slate-500` (hint/placeholder) → `slate-600` (disabled).
- **Accent:** `blue-400` (focus + links), `blue-600` (selected/active), `blue-600/20` (subtle highlight), `blue-600/15` (selected option bg in `Select`).
- **Status:** `green-*` (allowed/success), `red-*` (denied/error), `amber-*` / `yellow-*` (warning), with the `bg-X-900/40 text-X-400 border-X-800/50` badge formula.

---

## 4. Reusable Components — Public Contracts

These are the primitives every page composes. When you build a new app, copy this folder first, before any page.

Source: [admin/src/components/](admin/src/components/)

### `<Layout/>` — [Layout.jsx](admin/src/components/Layout.jsx)
Fixed left sidebar (`w-64`) + scrollable main (`p-gutter bg-surface`). Renders `<Outlet/>`. The shape of every authenticated screen.

### `<SideNavBar/>` — [SideNavBar.jsx](admin/src/components/SideNavBar.jsx)
Vertical nav grouped into labeled sections (`Overview`, `Master Data`, `Operations`, `System`). Each item is `{ to, icon, label }`. Active item gets a 2px left blue border. Logo + company name pulled from `useSettings()`. **Replace `navGroups` per app — the rest stays.**

### `<DatePicker/>` — [DatePicker.jsx](admin/src/components/DatePicker.jsx)
Single ISO-date picker.
```
<DatePicker value="2026-04-25" onChange={iso => …}
  placeholder="Select date" align="left|right" disabled required />
```
- Value is always `YYYY-MM-DD` string (or `''`).
- Built-in clear button when value is set.
- Click-outside + Escape to close.
- Has Today / Clear actions in the popover footer.

### `<DateRangePicker/>` — [DateRangePicker.jsx](admin/src/components/DateRangePicker.jsx)
Two-month range picker.
```
<DateRangePicker value={{ from, to }} onChange={({from,to}) => …}
  placeholder="Pick a date range" align="left|right" />
```
- Click start → hover preview → click end. Auto-swaps if end < start.
- Same token palette as `DatePicker`. Both share format helpers (`pad2`, `toISO`, `parseISO`, `formatDisplay`) — extract these to `lib/date.js` if you ever need them outside.

### `<Select/>` — [Select.jsx](admin/src/components/Select.jsx)
Dropdown, optionally `searchable`.
```
<Select value={v} onChange={setV}
  options={[{ value, label, disabled?, searchText? }, …]}
  placeholder="…" leadingIcon="domain" align="left|right"
  searchable required disabled />
```
- Keyboard nav: ArrowUp/Down/Enter/Escape.
- For "all"/"any" filter rows, prepend `{ value: '', label: 'All X' }`.
- `searchText` overrides label-based search when label is a node.

### `<Pagination/>` — [Pagination.jsx](admin/src/components/Pagination.jsx)
Drives off Laravel-style paginator meta.
```
<Pagination meta={data} onChange={setPage} />
```
Expects `{ current_page, last_page, from, to, total }`. Renders "Showing X–Y of Z" + first/prev/pages/next/last with ellipsis when > 7 pages.

### `<ProtectedRoute/>` — [ProtectedRoute.jsx](admin/src/components/ProtectedRoute.jsx)
Wraps `<Layout/>`. Redirects to `/login` if no token.

### `<RowMenu/>` and `<TopNavBar/>` are present too — copy if you use them, skip if not. Don't bring along anything you won't immediately use.

---

## 5. Page Recipe (the list-page pattern)

Every list page in [admin/src/pages/](admin/src/pages/) follows this exact skeleton. The cleanest example is [Logs.jsx](admin/src/pages/Logs.jsx).

```
<>
  {/* 1. Header — title + subtitle on left, primary action on right */}
  <header className="flex flex-wrap items-center justify-between gap-md mb-lg">
    <div className="min-w-0">
      <h1 className="font-h1 text-h1 text-slate-100">Title</h1>
      <p className="font-body-md text-body-md text-slate-400 mt-1">Subtitle.</p>
    </div>
    <button className="bg-blue-600/20 text-blue-400 border border-blue-500/30 …">
      <span className="material-symbols-outlined">…</span> Action
    </button>
  </header>

  {/* 2. Inline filter toolbar — no labels, just placeholders */}
  <div className="flex flex-wrap items-center gap-sm mb-md">
    <DatePicker … className="w-44" />
    <Select … className="w-56" searchable />
    {/* Conditionally render a "Clear" button when any filter is set */}
  </div>

  {/* 3. Table card */}
  <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-hidden">
    <table className="w-full text-left text-body-md">
      <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">…</thead>
      <tbody className="divide-y divide-outline-variant/20">
        {isLoading && <tr><td colSpan={N} className="p-6 text-center text-slate-500">Loading…</td></tr>}
        {!isLoading && rows.length === 0 && <tr><td colSpan={N} className="p-6 text-center text-slate-500">No results.</td></tr>}
        {rows.map(r => <tr className="hover:bg-surface-container-highest/10">…</tr>)}
      </tbody>
    </table>
    <Pagination meta={data} onChange={setPage} />
  </div>
</>
```

State pattern:
- One `filters` object held in a single `useState`.
- `useEffect(() => setPage(1), [filters])` resets pagination on any filter change.
- `params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ''))` — strip empties before sending.
- The list query is `useX({ ...params, page })`.

Status pills follow this formula (see [Logs.jsx:8-19](admin/src/pages/Logs.jsx#L8-L19)):
```
const badge = (s) => 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ' +
  (s === 'allowed' ? 'bg-green-900/40 text-green-400 border-green-800/50'
   : s === 'denied' ? 'bg-red-900/40 text-red-400 border-red-800/50'
   : 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50')
```

---

## 6. API Layer

Two files. That's the entire data layer per app.

### `api/client.js` — [client.js](admin/src/api/client.js)
- Single axios instance.
- Base URL resolution: `VITE_API_BASE` env → `http(s)://{hostname}:8000/api` → localhost fallback. **Per app, change the storage key (`admin_token`) and possibly the port.**
- Request interceptor adds `Authorization: Bearer …` and `Accept: application/json`.
- Response interceptor: on 401, clear token + `window.location.assign('/login')`.

### `api/queries.js` — [queries.js](admin/src/api/queries.js)
One naming convention, applied to every resource:

```
useX(params)        → GET /x list, queryKey: ['x', params]
useX(id)            → GET /x/:id detail, queryKey: ['x', id], enabled: !!id
useSaveX()          → POST or PUT depending on x.id, invalidates ['x']
useDeleteX()        → DELETE /x/:id, invalidates ['x']
```

For resources with file uploads, write a `buildXPayload(obj)` helper that returns `{ data, headers }` — JSON when no file, multipart `FormData` with `_method: 'PUT'` on update when there is. Pattern: [queries.js:31-62](admin/src/api/queries.js#L31-L62).

`useSettings`/`usePublicSettings` use `staleTime: 60_000` because settings barely change.

---

## 7. Auth Flow

1. `POST /login` → `{ token, user }`. Store via `setToken(data.token)` in `useLogin().onSuccess`.
2. Every request auto-attaches the bearer.
3. `<ProtectedRoute>` checks `getToken()`; missing → `<Navigate to="/login" replace />`.
4. Any 401 from the server → axios response interceptor clears token + redirects.
5. `useLogout()` POSTs `/logout`, clears token in `onSettled` (so it clears even on network error).

No refresh tokens. No silent renewal. Simple by design.

---

## 8. Routing Skeleton

Source: [App.jsx](admin/src/App.jsx). The shape:

```
<Routes>
  <Route path="/login" element={<Login/>} />
  <Route element={<ProtectedRoute><Layout/></ProtectedRoute>}>
    <Route path="/dashboard" element={<Dashboard/>} />
    {/* …feature pages… */}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Route>
</Routes>
```

Catch-all redirects to the home of the authenticated area, not 404. New apps follow the same shape.

---

## 9. Folder Structure for a New App

```
new-app/
├─ index.html
├─ package.json          # copy admin/, prune unused deps
├─ vite.config.js
├─ tailwind.config.js    # COPY VERBATIM
├─ postcss.config.js
├─ public/
│  ├─ favicon.svg
│  └─ icons.svg          # Material Symbols sprite (or use the web font)
└─ src/
   ├─ main.jsx           # QueryClientProvider + BrowserRouter + <App/>
   ├─ App.jsx            # routing skeleton (section 8)
   ├─ index.css          # COPY VERBATIM
   ├─ api/
   │  ├─ client.js       # change TOKEN_KEY, base URL
   │  └─ queries.js      # rewrite for the new app's resources
   ├─ components/        # COPY: Layout, SideNavBar (edit navGroups),
   │                     # DatePicker, DateRangePicker, Select,
   │                     # Pagination, ProtectedRoute
   └─ pages/
      ├─ Login.jsx       # copy then tweak
      ├─ Dashboard.jsx   # rewrite
      └─ <Feature>.jsx   # follow the page recipe (section 5)
```

---

## 10. Clone Checklist (do this in order)

1. **Copy `admin/` → `new-app/`** in the monorepo. Don't symlink.
2. **Rename** in `package.json` (`name`), `index.html` (title).
3. **Pick a token storage key** (`admin_token` → `counter_token` etc.) in `api/client.js` and the matching login flow.
4. **Decide the API base.** If it shares a backend, leave the resolver. If not, set `VITE_API_BASE` per env.
5. **Strip pages you don't need.** Delete the file *and* its route in `App.jsx` *and* its query helpers *and* its nav entry. Don't leave dead code as "might be useful later."
6. **Edit `navGroups` in `SideNavBar.jsx`** to the new app's information architecture.
7. **Verify the design tokens still apply.** `bg-surface`, `font-h1`, `border-outline-variant/50` should all render. If something looks wrong, your tailwind.config.js didn't copy cleanly.
8. **Build one feature page using the recipe in section 5.** If it doesn't feel like the admin app at first glance, the philosophy didn't make it through — go back and find the divergence (usually spacing or border opacity).
9. **Only then** start writing real features.

---

## 11. When to Promote to a Shared Package

The first new app stays a copy. The second time you fix the same bug in two places, lift the primitives:

```
packages/ui/             # DatePicker, DateRangePicker, Select, Pagination, RowMenu
packages/api-core/       # axios client + interceptors + token storage
packages/theme/          # tailwind preset + index.css + DESIGN.md
```

Wire with npm/pnpm workspaces. `admin/`, `counter/`, `scanner/`, and the new app all import from these.

Don't do this on day one — you don't yet know which APIs are stable. Wait for the second copy-paste pain.

---

## 12. What This Doc Is Not

- Not a framework — there's no runtime, no plugin system, no abstraction layer.
- Not a design system website — Storybook would be nice but is not required to ship.
- Not a place to record per-feature business rules — those live in code + commit messages.

The whole philosophy is: **a small set of primitives, applied consistently, on top of a token-driven theme.** Keep that and the apps will feel like one product.
