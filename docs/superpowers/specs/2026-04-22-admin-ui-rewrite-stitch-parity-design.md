# Admin UI Rewrite — Stitch Dashboard Parity

**Status:** Approved
**Date:** 2026-04-22

## Problem

The admin panel's visible output is broken in the browser (fonts not rendering correctly, scroll clipped, foundational drift from the reference design). The user wants the full visual design system — theme, font, spacing, colors, components — from `stitch_meal_distribution_dashboard/` applied to the admin panel, replacing the current admin presentation layer wholesale.

The data layer (API client, React Query hooks, routing, auth) is correct and must be preserved.

## Goal

Rewrite the admin panel's presentation layer (components + pages) using the stitch dashboard's patterns, so the admin renders pixel-parity with stitch, while preserving all current admin functionality (login, CRUD on employees and meal rules, logs filtering + CSV export).

## Scope

### Rewritten (presentation layer)

- `admin/src/components/TopNavBar.jsx` *(new, mirrors `stitch/src/components/TopNavBar.jsx`)*
- `admin/src/components/SideNavBar.jsx` *(new, mirrors `stitch/src/components/SideNavBar.jsx` but with admin nav items + logout)*
- `admin/src/components/Layout.jsx` *(thin orchestrator composing TopNavBar + SideNavBar + Outlet)*
- `admin/src/pages/Login.jsx`
- `admin/src/pages/Dashboard.jsx`
- `admin/src/pages/Employees.jsx`
- `admin/src/pages/MealRules.jsx`
- `admin/src/pages/Logs.jsx`
- `admin/index.html` *(body classes)*
- `admin/src/index.css` *(align with stitch; drop `body { overflow: hidden }`)*
- `admin/tailwind.config.js` *(sync 1:1 with stitch)*

### Preserved untouched

- `admin/src/api/client.js`, `admin/src/api/queries.js`
- `admin/src/components/ProtectedRoute.jsx`
- `admin/src/App.jsx`, `admin/src/main.jsx`, `admin/package.json`

### Out of scope

- Making the top-bar global search functional
- Any backend / API changes
- New pages or new features
- Responsive mobile polish beyond what stitch already has

## Design Decisions

1. **Sidebar items**: keep admin's real routes — *Dashboard, Employees, Meal Rules, Live Logs* — plus logout at the bottom. Do not add stitch's decorative items (Analytics, Distribution, Inventory).

2. **Dashboard third pane**: replace stitch's "Zone Breakdown" (locations) with **"Session Breakdown"** (group today's served meals by meal rule name). Visual pattern identical to stitch's ZoneBreakdown; data source correct for this app.

3. **Distribution Velocity chart**: keep admin's existing real-data hourly SVG line chart (with smooth Catmull-Rom-ish path). Drop stitch's hardcoded polygon clip-path.

4. **Top-bar search**: render identical to stitch (magnifier icon, placeholder text, same styling) but **inert** — no handler, no state. Can be wired later.

5. **Design tokens**: prefer Tailwind design tokens (`bg-surface-container-low`, `border-outline-variant/50`, `text-on-surface`) where stitch uses them; mirror stitch's occasional `text-slate-*` usage so colors match exactly.

6. **Icons & fonts**: Material Symbols Outlined + Inter, loaded via Google Fonts `<link>` tags in `index.html`.

## Foundation Changes

### `admin/tailwind.config.js`

Replace with stitch's `tailwind.config.js` verbatim. Differences being fixed:

- Add `spacing.rhythm: '8px'`
- Add `borderRadius.full: '0.75rem'`
- Change `surface-container-highest: '#2d3449'` → `'#303541'`
- Remove admin's `borderColor.DEFAULT` override (not present in stitch)

### `admin/index.html`

- Add body class: `class="bg-surface text-on-surface font-inter h-screen overflow-hidden antialiased"`
- Keep title as "MealDistribute Pro — Admin"
- Keep favicon link

### `admin/src/index.css`

- Keep `@tailwind base/components/utilities`
- Keep `body { font-family: 'Inter', ...; }` declaration
- Keep the `.material-symbols-outlined` class declaration
- Keep admin's custom webkit scrollbar styling + date/time picker indicator filter (stitch has neither; these are useful additions that do not conflict visually)
- **Remove** `html, body, #root { height: 100vh; background: ...; color: ...; overflow: hidden }` top-level block — body's `h-screen overflow-hidden` (from index.html) governs the app shell; page-level scroll areas handle their own overflow

## Component Layout

### TopNavBar.jsx

Identical markup to stitch's TopNavBar. Brand label "MealDistribute Pro". Search input (inert). Three icon buttons: `notifications`, `settings`, `help`. User avatar circle with letter "A" (admin) instead of stitch's image URL.

### SideNavBar.jsx

Same shell as stitch's SideNavBar (fixed left, 64 width, `bg-slate-950`, `border-r border-slate-800`, uppercase tracking on labels). Differences:

- Header: "Distributor HQ" / "Analytical Oversight" (same as stitch)
- Nav items (React Router `NavLink`):
  - `dashboard` → `/dashboard`
  - `badge` → `/employees`
  - `restaurant_menu` → `/meal-rules`
  - `list_alt` → `/logs`
- Active state: `bg-slate-900 text-blue-300 border-l-2 border-blue-400` (stitch pattern)
- Export Reports button kept as decoration (same styling as stitch)
- Bottom: logout button using `logout` icon, calls `useLogout()` → navigate to `/login`

### Layout.jsx

```jsx
<div className="bg-surface text-on-surface h-screen overflow-hidden">
  <TopNavBar />
  <div className="flex h-screen pt-14">
    <SideNavBar />
    <main className="ml-64 flex-1 overflow-y-auto p-gutter bg-surface">
      <Outlet />
    </main>
  </div>
</div>
```

## Page Designs

### Login.jsx

Centered card on full-screen surface with radial blue gradient accent behind. Card: `max-w-sm bg-surface-container-low border border-outline-variant/50 rounded-xl p-xl`. Logo badge (restaurant icon in blue tint box). Email + password inputs using stitch's inset input style. Submit button: solid blue primary. Error display: muted red container style.

Functionality: unchanged from current — `useLogin()` mutation, navigate to `/dashboard` on success.

### Dashboard.jsx

Header row: h1 "Executive Dashboard" + "System Online" indicator (pulsing green dot).

**Metrics row** (5 cards, `grid-cols-5 gap-md`):

1. Active Emp. (badge icon)
2. Meals Served (restaurant icon, progress bar = coverage %)
3. Access Denied (block icon, red accent)
4. Sessions (point_of_sale icon, `active/total`)
5. Efficiency (speed icon, green accent, approval rate %)

**Content grid** (`lg:grid-cols-3 lg:grid-rows-2 gap-md lg:h-[600px]`):

- **Distribution Velocity** (col-span-2, row-span-1): real hourly SVG line chart from today's allowed logs; 1 Day / 1 Week / 1 Month toggle (stateful but only 1 Day wired to data — Week/Month are visual for now)
- **Session Breakdown** (col-span-1, row-span-2): table of meal rule name → served count today
- **Live Scan Event Log** (col-span-2, row-span-1): last 8 log rows with stitch's row-hover + blue highlight on most recent; "View All" link → `/logs`

All data from `useEmployees`, `useLogs`, `useMealRules` hooks (unchanged).

### Employees.jsx

Header: h1 "Employees" + search input (right) + blue "Add employee" button. Single card wrapping the table. Columns: QR (rendered via `qrcode.react`), Code (mono), Name, VIP (amber badge if true), Status (green/gray badge), Actions (Edit/Delete text buttons in blue/red).

Modal: stitch-style `fixed inset-0 bg-black/60 backdrop-blur-sm` with centered form card. Inputs use the stitch input pattern. Buttons: outlined Cancel + solid blue Save.

Functionality: unchanged — `useEmployees`, `useSaveEmployee`, `useDeleteEmployee`.

### MealRules.jsx

Header: h1 "Meal Rules" + "Add rule" button. Card-wrapped table: Name, Start, End, Max/day, Status, Actions. Modal same pattern as Employees (Name text, Start/End time inputs, Max/day number, Active checkbox).

Functionality: unchanged — `useMealRules`, `useSaveMealRule`, `useDeleteMealRule`.

### Logs.jsx

Header: h1 "Live Logs" + "Export CSV" button (stitch outlined-blue style matching sidebar's Export Reports). Below header: filter card (3 columns: Date / Employee / Result). Below that: card-wrapped log table (Time, Employee, Session, Result, Reason, Scanned code).

Functionality: unchanged — `useLogs` with filter params, `/logs/export` download.

## Verification Plan

1. `cd admin && npm install` (if needed)
2. `npm run dev`
3. Open `http://localhost:5173` (or whatever Vite picks) — should redirect to `/login`
4. Visual check on `/login`: dark surface, Inter font visible, radial gradient behind card, blue logo badge
5. DevTools Network tab: Inter + Material Symbols fonts load (no 404s)
6. Log in (with backend running — the existing behavior)
7. `/dashboard` renders: top bar, left sidebar with active state on Dashboard, 5 metric cards, 3 panes, no console errors
8. Navigate to `/employees`, `/meal-rules`, `/logs`: each has correct active sidebar state, consistent header + cards, tables scroll internally (not page-level)
9. Open "Add employee" modal → confirm backdrop blur and form styling
10. Click "Export CSV" with/without logs → confirm download or disabled state

## Risks / Watch-outs

- **React 19 + Vite 8**: admin uses newer versions than stitch (React 18 + Vite 5). Tailwind 3.4 still works identically; no expected conflict, but verify dev server starts clean.
- **Backend dependency**: dashboard requires backend running for real data. If the user tests without backend, queries will error — the UI should still render skeleton/empty states gracefully. Our pages already handle empty-data paths (`isLoading`, zero-length arrays).
- **Fonts need internet**: Google Fonts is an external dependency. If offline, fonts fall back to system — styling still legible.
