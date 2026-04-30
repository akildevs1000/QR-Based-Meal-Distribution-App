# DESIGN-SYSTEM.md — Tokens, Components, Patterns

The visual language. Pair this with [PHILOSOPHY.md](PHILOSOPHY.md) (the why) and [ADMIN.md](ADMIN.md) (the how to wire it up).

## 1. Tokens

All tokens live in [snippets/tailwind.config.js](snippets/tailwind.config.js). Copy the file verbatim. Do not maintain a parallel `theme.ts`.

### 1.1 Colors

**Surface ramp** (darkest → lightest)
```
surface-container-lowest  #060e20   forms / inputs
surface                   #0b1326   page background
surface-container-low     #131b2e   cards, popovers, modals
surface-container         #171f33
surface-container-high    #222a3d
surface-container-highest #303541   subtle row hover at /10, /20, /40
```

**Text ramp**
```
slate-100   primary (headings, key values)
slate-200   table cells (body)
slate-300   buttons, links, body
slate-400   secondary text, subtitles
slate-500   placeholder, hint, "no data"
slate-600   disabled
```

**Accent**
```
blue-300    "today" indicator text
blue-400    focus border + focus ring + accent text
blue-500    hover on solid blue button
blue-600    selected state, primary CTA fill
blue-600/20 subtle highlight (in-range, action button bg)
blue-600/15 selected option background in Select
```

**Borders / outlines**
```
outline-variant         #424754
outline-variant/50      input + card borders
outline-variant/40      pagination button borders
outline-variant/30      pagination top divider, popover footer divider
outline-variant/20      table row dividers
```

**Status palette** — formula `bg-X-900/40 text-X-400 border-X-800/50`
- success / allowed → green
- error / denied → red
- warning / pending → yellow or amber
- neutral / draft → slate

### 1.2 Spacing
```
xs  4px    rare, only inside icons/buttons
sm  8px    gap between filter inputs, badge gaps
md 16px   padding inside cards, gap between sections
lg 24px   header bottom margin, vertical section spacing
xl 32px   card padding for forms (login, settings)
2xl 48px   page top spacing in marketing-style screens
gutter 24px  page padding (Layout main)
margin 32px  outer page margin in centered layouts
```

### 1.3 Typography (Inter)
```
h1        32/40, weight 600, tracking -0.02em
h2        24/32, weight 600, tracking -0.015em
h3        20/28, weight 600, tracking -0.01em
body-lg   16/24, weight 400, tracking -0.01em
body-md   14/20, weight 400, tracking -0.005em   (default body size)
label-md  12/16, weight 500, tracking 0.01em     (form labels)
label-sm  11/14, weight 600, tracking 0.03em uppercase  (table headers)
```

Apply both classes together: `font-h1 text-h1`. The `font-X` class sets the font family; the `text-X` class sets size + weight + tracking + line-height.

### 1.4 Radii
```
DEFAULT  0.125rem   2px — buttons, inputs (default `rounded`)
lg       0.25rem    4px — popover, table card (`rounded-lg`)
xl       0.5rem     8px — login card, dialog (`rounded-xl`)
full     0.75rem    12px — pill chips
```

## 2. Component Contracts

The reusable primitives live (today) in [../admin/src/components/](../admin/src/components/). Copy them verbatim into a new project's `admin/src/components/`. Treat their public API as locked.

### 2.1 `<Layout/>`
Fixed left sidebar + scrollable main with `<Outlet/>`. Drop into a `<Route element>` to wrap the authenticated area. No props.

### 2.2 `<SideNavBar/>`
The vertical nav. Driven by a `navGroups` constant inside the file:
```js
const navGroups = [
  { label: 'Overview', links: [{ to: '/dashboard', icon: 'dashboard', label: 'Dashboard' }] },
  // …
]
```
Edit `navGroups` per app. Logo + company name come from `useSettings()` (so each project's settings table can override branding).

### 2.3 `<DatePicker/>`
```jsx
<DatePicker
  value="2026-04-25"           // ISO date string or ''
  onChange={iso => setDate(iso)}
  placeholder="Select date"
  align="left|right"           // popover alignment
  disabled
  required                     // makes the underlying hidden input required
/>
```
Built-in clear button. Today + Clear footer actions. Click-outside + Escape close.

### 2.4 `<DateRangePicker/>`
```jsx
<DateRangePicker
  value={{ from: '2026-04-01', to: '2026-04-25' }}
  onChange={({from, to}) => setRange({from, to})}
  placeholder="Pick a date range"
  align="left|right"
/>
```
Two-month side-by-side calendar. Click start → hover preview → click end. Auto-swaps if end < start.

### 2.5 `<Select/>`
```jsx
<Select
  value={v}
  onChange={setV}
  options={[{ value, label, disabled?, searchText? }]}
  placeholder="…"
  leadingIcon="domain"
  align="left|right"
  searchable
  required
  disabled
/>
```
Keyboard nav: ArrowUp/Down/Enter/Escape. For "all/any" filters prepend `{ value: '', label: 'All X' }`.

### 2.6 `<Pagination/>`
```jsx
<Pagination meta={data} onChange={setPage} />
```
Expects Laravel paginator shape: `{ current_page, last_page, from, to, total }`. Renders "Showing X–Y of Z" + first/prev/numbered pages with ellipsis/next/last.

### 2.7 `<ProtectedRoute/>`
```jsx
<Route element={<ProtectedRoute><Layout/></ProtectedRoute>}>
  …
</Route>
```
Redirects to `/login` when no token in `localStorage`.

## 3. Page Recipe (visual)

```
┌──────────────────────────────────────────────────────────────┐
│  Title                                       [Primary action] │  ← header (mb-lg)
│  Subtitle line                                                │
├──────────────────────────────────────────────────────────────┤
│  [DatePicker] [Select] [Select] [Select]   …   [Clear]        │  ← filter toolbar (mb-md)
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐ ╮ │
│ │ TIME · BENEFICIARY · MEAL · POINT · …                  │ │ │  ← table header (label-sm uppercase)
│ ├────────────────────────────────────────────────────────┤ │ │
│ │ 10:00  EMP-001 · Alice  Lunch  Site A  …               │ │ │  ← table rows (body-md)
│ │ 10:01  EMP-002 · Bob    Lunch  Site A  …               │ │ │
│ ├────────────────────────────────────────────────────────┤ │ │
│ │ Showing 1–25 of 312        [‹] [1][2][3]…[13] [›]      │ │ │  ← pagination
│ └────────────────────────────────────────────────────────┘ ╯ │
└──────────────────────────────────────────────────────────────┘
```
Card wrapper: `bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-hidden`.

## 4. Status Patterns

### 4.1 Pills / badges (tiny, inline)
```jsx
const badge = (v) => 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ' +
  (v === 'allowed' ? 'bg-green-900/40 text-green-400 border-green-800/50'
   : v === 'denied' ? 'bg-red-900/40 text-red-400 border-red-800/50'
   : 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50')
```

### 4.2 Action button — primary
```
bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded px-4 py-2.5 transition-colors
```

### 4.3 Action button — secondary (toolbar)
```
bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 px-4 py-2 rounded text-sm font-semibold
```

### 4.4 Inline danger
```
text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2
```

### 4.5 Loading / empty cell
```jsx
<tr><td colSpan={N} className="p-6 text-center text-slate-500">Loading…</td></tr>
<tr><td colSpan={N} className="p-6 text-center text-slate-500">No results.</td></tr>
```

## 5. Form Field Pattern (modals, settings)

```jsx
<div>
  <label className="block text-label-md text-slate-300 mb-1.5">Email</label>
  <input className={inputCls} type="email" value={v} onChange={…} required />
</div>
```
Where `inputCls` is the standard:
```js
const inputCls =
  'w-full bg-surface-container-lowest border border-outline-variant/50 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all'
```

## 6. Material Symbols

Add the web font in `index.html`:
```html
<link href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined" rel="stylesheet" />
```
Use:
```jsx
<span className="material-symbols-outlined" style={{ fontSize: 18 }}>dashboard</span>
```
Common ones:
- nav: `dashboard`, `list_alt`, `badge`, `apartment`, `group`, `settings`
- actions: `add`, `edit`, `delete`, `download`, `upload`, `close`, `check`, `search`
- chevrons: `chevron_left`, `chevron_right`, `expand_more`, `keyboard_double_arrow_left/right`
- date: `calendar_today`, `date_range`
- domain examples: `restaurant_menu`, `local_shipping`, `receipt_long`, `inventory_2`, `report`, `assessment`
