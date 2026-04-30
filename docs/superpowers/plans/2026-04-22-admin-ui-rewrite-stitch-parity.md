# Admin UI Rewrite — Stitch Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the admin panel's presentation layer (components + pages + foundational config) to visually mirror `stitch_meal_distribution_dashboard/` while preserving all admin functionality (routing, auth, API queries, CRUD).

**Architecture:** Replace admin's foundation files (`tailwind.config.js`, `index.html`, `index.css`) with stitch-synced versions. Split the monolithic `Layout.jsx` into dedicated `TopNavBar.jsx` + `SideNavBar.jsx` components matching stitch's structure. Rewrite all 5 pages (Login, Dashboard, Employees, MealRules, Logs) from scratch using stitch's design patterns, wiring into the preserved React Query hooks in `src/api/queries.js`.

**Tech Stack:** React 19, Vite 8, Tailwind CSS 3.4, React Router 7, React Query 5, Inter font + Material Symbols Outlined (Google Fonts CDN), `qrcode.react`.

**Verification:** No unit tests (no test framework in project). Each task ends with visual verification via `npm run dev` + browser check against the stitch reference.

**Working directory for all commands:** `admin/` (relative to project root).

---

## File Structure

**Modified:**
- `admin/tailwind.config.js` — sync with stitch 1:1
- `admin/index.html` — add body classes to match stitch
- `admin/src/index.css` — align with stitch, drop body overflow hidden
- `admin/src/components/Layout.jsx` — reduce to thin orchestrator

**Created:**
- `admin/src/components/TopNavBar.jsx` — new, from stitch pattern
- `admin/src/components/SideNavBar.jsx` — new, from stitch pattern + admin routes + logout

**Rewritten:**
- `admin/src/pages/Login.jsx`
- `admin/src/pages/Dashboard.jsx`
- `admin/src/pages/Employees.jsx`
- `admin/src/pages/MealRules.jsx`
- `admin/src/pages/Logs.jsx`

**Untouched:**
- `admin/src/api/client.js`, `admin/src/api/queries.js`, `admin/src/components/ProtectedRoute.jsx`, `admin/src/App.jsx`, `admin/src/main.jsx`, `admin/package.json`

---

## Task 1: Sync Tailwind config with stitch

**Files:**
- Modify: `admin/tailwind.config.js`

- [ ] **Step 1: Replace admin/tailwind.config.js with stitch-synced version**

Full file content:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tertiary: '#d3e4fe',
        'surface-container-low': '#131b2e',
        'error-container': '#93000a',
        'secondary-fixed-dim': '#bcc7de',
        'on-primary-fixed': '#001a42',
        error: '#ffb4ab',
        'surface-container-high': '#222a3d',
        'primary-container': '#adc6ff',
        'on-primary-container': '#385283',
        surface: '#0b1326',
        'surface-container-lowest': '#060e20',
        'on-tertiary-fixed-variant': '#38485d',
        'on-secondary-fixed': '#111c2d',
        'surface-container-highest': '#303541',
        'on-secondary': '#263143',
        'on-background': '#dee2f2',
        'on-error-container': '#ffdad6',
        'outline-variant': '#424754',
        outline: '#8c909f',
        'surface-container': '#171f33',
        'on-secondary-container': '#aab5cc',
        'tertiary-fixed': '#d3e4fe',
        'on-primary': '#122f5f',
        'on-secondary-fixed-variant': '#3c475a',
        'inverse-surface': '#dee2f2',
        'surface-variant': '#303541',
        'primary-fixed': '#d8e2ff',
        'inverse-primary': '#455e90',
        'on-surface': '#dee2f2',
        primary: '#d8e2ff',
        'secondary-container': '#3c475a',
        'primary-accent-alt': '#3B82F6',
        'on-tertiary-container': '#435469',
        'surface-dim': '#0f131e',
        background: '#0f131e',
        'on-tertiary': '#213145',
        'on-primary-fixed-variant': '#2c4677',
        'on-surface-variant': '#c4c6d0',
        'tertiary-container': '#b7c8e1',
        'surface-bright': '#353946',
        'primary-fixed-dim': '#adc6ff',
        secondary: '#bcc7de',
        'tertiary-fixed-dim': '#b7c8e1',
        'inverse-on-surface': '#2c303d',
        'on-tertiary-fixed': '#0b1c2f',
        'secondary-fixed': '#d8e3fa',
        'surface-tint': '#adc6ff',
        'on-error': '#690005',
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        full: '0.75rem',
      },
      spacing: {
        rhythm: '8px',
        xl: '32px',
        sm: '8px',
        '2xl': '48px',
        md: '16px',
        lg: '24px',
        margin: '32px',
        'base-unit': '4px',
        xs: '4px',
        gutter: '24px',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        'body-md': ['Inter'],
        'label-sm': ['Inter'],
        'body-lg': ['Inter'],
        h3: ['Inter'],
        h2: ['Inter'],
        h1: ['Inter'],
        'label-md': ['Inter'],
      },
      fontSize: {
        'body-md': ['14px', { lineHeight: '20px', letterSpacing: '-0.005em', fontWeight: '400' }],
        'label-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.03em', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '400' }],
        h3: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
        h2: ['24px', { lineHeight: '32px', letterSpacing: '-0.015em', fontWeight: '600' }],
        h1: ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/tailwind.config.js
git commit -m "chore(admin): sync tailwind config with stitch dashboard"
```

---

## Task 2: Update admin/index.html body classes

**Files:**
- Modify: `admin/index.html`

- [ ] **Step 1: Replace admin/index.html**

```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <title>MealDistribute Pro — Admin</title>
  </head>
  <body class="bg-surface text-on-surface font-inter h-screen overflow-hidden antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add admin/index.html
git commit -m "chore(admin): add body classes matching stitch dashboard"
```

---

## Task 3: Simplify admin/src/index.css

**Files:**
- Modify: `admin/src/index.css`

- [ ] **Step 1: Replace admin/src/index.css**

Drops `body { overflow: hidden }` (which clipped scroll on list pages) and the `html,body,#root { height: 100vh; ... }` block (superseded by body classes set in index.html). Keeps custom scrollbar + date/time picker indicator tweaks since they work alongside stitch's design.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: 'liga';
}

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: #0b1326; }
::-webkit-scrollbar-thumb { background: #2d3449; border-radius: 6px; }
::-webkit-scrollbar-thumb:hover { background: #424754; }

input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator {
  filter: invert(0.8);
  cursor: pointer;
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/index.css
git commit -m "chore(admin): simplify index.css and drop body overflow-hidden"
```

---

## Task 4: Create TopNavBar component

**Files:**
- Create: `admin/src/components/TopNavBar.jsx`

- [ ] **Step 1: Write admin/src/components/TopNavBar.jsx**

Mirrors stitch's TopNavBar. Avatar circle shows "A" instead of stitch's image URL. Search input is inert.

```jsx
export default function TopNavBar() {
  const iconButtons = ['notifications', 'settings', 'help']

  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-14 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 text-blue-200 font-inter text-sm tracking-tight transition-all duration-150 ease-in-out">
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold tracking-tighter text-slate-100">MealDistribute Pro</span>
      </div>

      <div className="flex-1 max-w-md mx-6">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-slate-400" style={{ fontSize: '18px' }}>
            search
          </span>
          <input
            type="text"
            placeholder="Search logs, users, locations..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded pl-10 pr-4 py-1.5 text-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all placeholder-slate-500 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {iconButtons.map((icon) => (
          <button
            key={icon}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 rounded transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {icon}
            </span>
          </button>
        ))}
        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center ml-2 text-slate-300 text-xs font-semibold">
          A
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/components/TopNavBar.jsx
git commit -m "feat(admin): add TopNavBar component from stitch pattern"
```

---

## Task 5: Create SideNavBar component

**Files:**
- Create: `admin/src/components/SideNavBar.jsx`

- [ ] **Step 1: Write admin/src/components/SideNavBar.jsx**

Mirrors stitch SideNavBar structure. Primary nav uses React Router `NavLink` with admin's 4 routes. Logout button at the bottom calls `useLogout()` and navigates to `/login`.

```jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useLogout } from '../api/queries'

const primaryLinks = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/employees', icon: 'badge', label: 'Employees' },
  { to: '/meal-rules', icon: 'restaurant_menu', label: 'Meal Rules' },
  { to: '/logs', icon: 'list_alt', label: 'Live Logs' },
]

const linkCls = ({ isActive }) =>
  isActive
    ? 'flex items-center gap-3 bg-slate-900 text-blue-300 border-l-2 border-blue-400 px-4 py-3 active:opacity-80 transition-all'
    : 'flex items-center gap-3 text-slate-500 border-l-2 border-transparent px-4 py-3 hover:text-slate-200 hover:bg-slate-900/80 active:opacity-80 transition-all'

export default function SideNavBar() {
  const nav = useNavigate()
  const logout = useLogout()

  const onLogout = async () => {
    await logout.mutateAsync().catch(() => {})
    nav('/login', { replace: true })
  }

  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 z-40 flex flex-col py-4 bg-slate-950 border-r border-slate-800 text-blue-200 font-inter text-xs font-medium uppercase tracking-widest transition-all">
      <div className="px-6 mb-6">
        <h2 className="text-xl font-black text-slate-100 normal-case tracking-normal">Distributor HQ</h2>
        <p className="text-slate-500 text-[10px] mt-1 normal-case tracking-normal">Analytical Oversight</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {primaryLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkCls}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {link.icon}
            </span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-4 pb-4 border-b border-slate-800/50 mb-2">
        <button className="w-full bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 py-2 px-4 rounded text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            download
          </span>
          Export Reports
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 text-slate-500 px-4 py-2 hover:text-slate-200 hover:bg-slate-900/80 transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            logout
          </span>
          Log out
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/components/SideNavBar.jsx
git commit -m "feat(admin): add SideNavBar component with admin routes + logout"
```

---

## Task 6: Reduce Layout.jsx to thin orchestrator

**Files:**
- Modify: `admin/src/components/Layout.jsx`

- [ ] **Step 1: Replace admin/src/components/Layout.jsx**

```jsx
import { Outlet } from 'react-router-dom'
import TopNavBar from './TopNavBar'
import SideNavBar from './SideNavBar'

export default function Layout() {
  return (
    <div className="bg-surface text-on-surface h-screen overflow-hidden">
      <TopNavBar />
      <div className="flex h-screen pt-14">
        <SideNavBar />
        <main className="ml-64 flex-1 overflow-y-auto p-gutter bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/components/Layout.jsx
git commit -m "refactor(admin): reduce Layout to thin orchestrator of TopNavBar + SideNavBar"
```

---

## Task 7: Rewrite Login page

**Files:**
- Modify: `admin/src/pages/Login.jsx`

- [ ] **Step 1: Replace admin/src/pages/Login.jsx**

Stitch-style centered card on the surface with a radial blue gradient accent behind. All inputs use the stitch inset pattern.

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogin } from '../api/queries'

const inputCls =
  'w-full bg-surface-container-lowest border border-outline-variant/50 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all'

export default function Login() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('password')
  const [err, setErr] = useState(null)
  const login = useLogin()
  const nav = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr(null)
    try {
      await login.mutateAsync({ email, password })
      nav('/dashboard', { replace: true })
    } catch (e) {
      setErr(e?.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface relative overflow-hidden font-inter">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none" />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-sm bg-surface-container-low border border-outline-variant/50 rounded-xl p-xl space-y-md"
      >
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600/20 border border-blue-500/30 mb-2">
            <span className="material-symbols-outlined text-blue-400" style={{ fontSize: 24 }}>restaurant</span>
          </div>
          <h1 className="text-h2 font-h2 text-slate-100">MealDistribute Pro</h1>
          <p className="text-body-md text-slate-400">Admin control center</p>
        </div>
        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            required
          />
        </div>
        {err && (
          <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2">
            {err}
          </div>
        )}
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded px-4 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/pages/Login.jsx
git commit -m "feat(admin): rewrite Login page with stitch patterns"
```

---

## Task 8: Rewrite Dashboard page

**Files:**
- Modify: `admin/src/pages/Dashboard.jsx`

- [ ] **Step 1: Replace admin/src/pages/Dashboard.jsx**

Stitch's 5-metric grid + 3-pane content grid (DistributionVelocity col-span-2 row-span-1, SessionBreakdown col-span-1 row-span-2, LiveScanEventLog col-span-2 row-span-1). All data from real React Query hooks.

```jsx
import { useMemo } from 'react'
import { useEmployees, useLogs, useMealRules } from '../api/queries'

function Metric({ label, icon, value, suffix, trend, accentClass = 'bg-blue-500/5', progress }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-3 flex flex-col justify-between h-24 relative overflow-hidden">
      <div className="flex justify-between items-start z-10">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider truncate mr-1 font-semibold">{label}</span>
        <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 16 }}>{icon}</span>
      </div>
      <div className="z-10">
        <div className="text-xl font-bold text-slate-100 leading-none mb-1.5">
          {value}
          {suffix && <span className="text-slate-500 text-sm font-normal">{suffix}</span>}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-medium leading-none ${trend.color}`}>
            {trend.icon && <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{trend.icon}</span>}
            <span>{trend.label}</span>
          </div>
        )}
      </div>
      {progress != null && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-container-highest">
          <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
      <div className={`absolute bottom-0 right-0 w-24 h-24 ${accentClass} rounded-full blur-2xl -mr-8 -mb-8 pointer-events-none`} />
    </div>
  )
}

function StatusBadge({ result, reason }) {
  const approved = result === 'allowed'
  const denied = result === 'denied'
  const label = approved
    ? 'APPROVED'
    : denied
      ? `DENIED${reason ? ' · ' + reason.toUpperCase() : ''}`
      : (result || 'ERROR').toUpperCase()
  const cls = approved
    ? 'bg-green-900/40 text-green-400 border-green-800/50'
    : denied
      ? 'bg-red-900/40 text-red-400 border-red-800/50'
      : 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${cls}`}>
      {label}
    </span>
  )
}

function niceMax(raw) {
  if (raw <= 4) return 4
  if (raw <= 8) return 8
  if (raw <= 20) return Math.ceil(raw / 4) * 4
  if (raw <= 100) return Math.ceil(raw / 10) * 10
  return Math.ceil(raw / 100) * 100
}

function buildSmoothPath(points) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M${points[0].x},${points[0].y}`
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}

function LineChart({ slice, max }) {
  const W = 100
  const H = 100
  const n = slice.length
  const points = slice.map((v, i) => ({
    x: n === 1 ? W / 2 : (i / (n - 1)) * W,
    y: H - (v / max) * H,
  }))
  const linePath = buildSmoothPath(points)
  const areaPath = linePath
    ? `${linePath} L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`
    : ''
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="chart-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath && <path d={areaPath} fill="url(#chart-area)" />}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  )
}

export default function Dashboard() {
  const today = new Date().toISOString().slice(0, 10)
  const { data: empPage } = useEmployees({ per_page: 1 })
  const { data: todayLogsPage } = useLogs({ date: today, per_page: 500 })
  const { data: recentLogsPage } = useLogs({ per_page: 8 })
  const { data: rules } = useMealRules()

  const totalEmployees = empPage?.meta?.total ?? empPage?.total ?? empPage?.data?.length ?? 0
  const todayLogs = todayLogsPage?.data ?? []
  const recentLogs = recentLogsPage?.data ?? []

  const { served, denied, coverage } = useMemo(() => {
    const s = todayLogs.filter((l) => l.result === 'allowed').length
    const d = todayLogs.filter((l) => l.result === 'denied').length
    const cov = totalEmployees > 0 ? Math.round((s / totalEmployees) * 100) : 0
    return { served: s, denied: d, coverage: cov }
  }, [todayLogs, totalEmployees])

  const activeRules = (rules || []).filter((r) => r.active).length
  const totalRules = (rules || []).length

  const sessionBreakdown = useMemo(() => {
    const map = new Map()
    for (const l of todayLogs) {
      if (l.result !== 'allowed') continue
      const name = l.meal_rule?.name || 'Unassigned'
      map.set(name, (map.get(name) || 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [todayLogs])

  const hourly = useMemo(() => {
    const buckets = Array.from({ length: 24 }, () => 0)
    for (const l of todayLogs) {
      if (l.result !== 'allowed') continue
      const h = new Date(l.scanned_at).getHours()
      buckets[h] += 1
    }
    let running = 0
    const cumulative = buckets.slice(6, 20).map((v) => (running += v))
    const rawMax = Math.max(0, ...cumulative)
    return { slice: cumulative, max: niceMax(rawMax) }
  }, [todayLogs])

  return (
    <>
      <header className="flex justify-between items-end mb-lg">
        <div>
          <h1 className="font-h1 text-h1 text-slate-100">Executive Dashboard</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">
            Real-time overview of meal distribution metrics.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="font-label-sm text-label-sm text-slate-400 uppercase tracking-widest">System Online</span>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-md mb-lg">
        <Metric
          label="Active Emp."
          icon="badge"
          value={totalEmployees.toLocaleString()}
          trend={{ icon: 'group', label: 'Registered', color: 'text-slate-400' }}
        />
        <Metric
          label="Meals Served"
          icon="restaurant"
          value={served.toLocaleString()}
          trend={{ icon: 'arrow_upward', label: `${coverage}% cov.`, color: 'text-green-400' }}
          progress={coverage}
        />
        <Metric
          label="Access Denied"
          icon="block"
          value={denied.toLocaleString()}
          trend={{ icon: 'arrow_downward', label: 'today', color: 'text-red-400' }}
          accentClass="bg-red-500/5"
        />
        <Metric
          label="Sessions"
          icon="point_of_sale"
          value={activeRules}
          suffix={`/${totalRules}`}
          trend={{
            label: totalRules ? `${Math.round((activeRules / totalRules) * 100)}% active` : '—',
            color: 'text-slate-400',
          }}
        />
        <Metric
          label="Efficiency"
          icon="speed"
          value={todayLogs.length > 0 ? `${Math.round((served / todayLogs.length) * 100)}%` : '—'}
          trend={{ icon: 'arrow_upward', label: 'approval rate', color: 'text-green-400' }}
          accentClass="bg-green-500/5"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-md lg:h-[600px]">
        <section className="lg:col-span-2 lg:row-span-1 bg-surface-container-low border border-outline-variant/50 rounded-lg flex flex-col p-md min-h-[300px]">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-h3 text-h3 text-slate-200">Distribution Velocity</h3>
            <div className="flex bg-surface-container-high rounded p-1 border border-outline-variant/30">
              <button className="px-3 py-1 rounded font-label-md text-label-md bg-surface-variant text-slate-100 shadow-sm">1 Day</button>
              <button className="px-3 py-1 rounded font-label-md text-label-md text-slate-400 hover:text-slate-200">1 Week</button>
              <button className="px-3 py-1 rounded font-label-md text-label-md text-slate-400 hover:text-slate-200">1 Month</button>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative flex items-end w-full">
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-slate-500 text-[11px] pb-6 pr-2 text-right w-8">
              <span>{hourly.max}</span>
              <span>{Math.round(hourly.max * 0.75)}</span>
              <span>{Math.round(hourly.max * 0.5)}</span>
              <span>{Math.round(hourly.max * 0.25)}</span>
              <span>0</span>
            </div>
            <div className="absolute inset-0 ml-8 mb-6 border-b border-outline-variant/30 flex flex-col justify-between pointer-events-none">
              <div className="border-t border-outline-variant/10 h-0 w-full" />
              <div className="border-t border-outline-variant/10 h-0 w-full" />
              <div className="border-t border-outline-variant/10 h-0 w-full" />
              <div className="border-t border-outline-variant/10 h-0 w-full" />
              <div className="h-0 w-full" />
            </div>
            <div className="ml-8 mb-6 w-full h-[85%] relative">
              <LineChart slice={hourly.slice} max={hourly.max} />
            </div>
            <div className="absolute bottom-0 left-8 right-0 flex justify-between text-slate-500 text-[11px]">
              <span>06:00</span>
              <span>08:00</span>
              <span>10:00</span>
              <span>12:00</span>
              <span>14:00</span>
              <span>16:00</span>
            </div>
          </div>
        </section>

        <section className="lg:col-span-1 lg:row-span-2 bg-surface-container-low border border-outline-variant/50 rounded-lg flex flex-col overflow-hidden min-h-[300px]">
          <div className="p-md border-b border-outline-variant/30 bg-surface-container-highest/30">
            <h3 className="font-h3 text-h3 text-slate-200">Session Breakdown</h3>
            <p className="font-label-md text-label-md text-slate-400 mt-1">Meals served by session today.</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-body-md">
              <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-medium">Session</th>
                  <th className="px-4 py-3 font-medium text-right">Served</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {sessionBreakdown.length === 0 && (
                  <tr>
                    <td colSpan="2" className="px-4 py-6 text-center text-slate-500 text-sm">
                      No meals served yet today.
                    </td>
                  </tr>
                )}
                {sessionBreakdown.map(([name, count]) => (
                  <tr key={name} className="hover:bg-surface-container-highest/10 transition-colors">
                    <td className="px-4 py-3 text-slate-200">{name}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lg:col-span-2 lg:row-span-1 bg-surface-container-low border border-outline-variant/50 rounded-lg flex flex-col overflow-hidden min-h-[300px]">
          <div className="p-md border-b border-outline-variant/30 bg-surface-container-highest/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="font-h3 text-h3 text-slate-200">Live Scan Event Log</h3>
              <span className="flex h-2 w-2 relative ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            </div>
            <a href="/logs" className="text-label-md font-medium text-blue-400 hover:text-blue-300">View All</a>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-body-md whitespace-nowrap">
              <thead className="bg-surface-container-highest/10 text-label-sm text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2 font-medium">Timestamp</th>
                  <th className="px-4 py-2 font-medium">Employee</th>
                  <th className="px-4 py-2 font-medium">ID</th>
                  <th className="px-4 py-2 font-medium">Session</th>
                  <th className="px-4 py-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-sm">
                {recentLogs.length === 0 && (
                  <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-500">No recent scan events.</td></tr>
                )}
                {recentLogs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className={idx === 0 ? 'bg-blue-500/5 hover:bg-blue-500/10 transition-colors' : 'hover:bg-surface-container-highest/10 transition-colors'}
                  >
                    <td className="px-4 py-2 font-mono text-slate-400 text-xs">
                      {new Date(log.scanned_at).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2 text-slate-200 font-medium">
                      {log.employee?.name || <span className="text-slate-500 italic">unknown</span>}
                    </td>
                    <td className="px-4 py-2 font-mono text-slate-500">
                      {log.employee?.employee_code || log.scanned_code}
                    </td>
                    <td className="px-4 py-2 text-slate-400">{log.meal_rule?.name || '—'}</td>
                    <td className="px-4 py-2 text-right">
                      <StatusBadge result={log.result} reason={log.reason} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/pages/Dashboard.jsx
git commit -m "feat(admin): rewrite Dashboard with stitch 3-pane grid pattern"
```

---

## Task 9: Rewrite Employees page

**Files:**
- Modify: `admin/src/pages/Employees.jsx`

- [ ] **Step 1: Replace admin/src/pages/Employees.jsx**

Card-wrapped table with QR, code, name, VIP/status badges, action buttons. Modal is stitch-style backdrop blur with inset form inputs.

```jsx
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useEmployees, useSaveEmployee, useDeleteEmployee } from '../api/queries'

const inputCls =
  'w-full bg-surface-container-lowest border border-outline-variant/50 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all'

export default function Employees() {
  const [q, setQ] = useState('')
  const { data, isLoading } = useEmployees({ q })
  const save = useSaveEmployee()
  const del = useDeleteEmployee()
  const [editing, setEditing] = useState(null)

  const openNew = () => setEditing({ employee_code: '', name: '', is_vip: false, active: true })
  const close = () => setEditing(null)

  const onSave = async (e) => {
    e.preventDefault()
    await save.mutateAsync(editing)
    close()
  }

  const rows = data?.data ?? []

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
          <button
            onClick={openNew}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Add employee
          </button>
        </div>
      </header>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-hidden">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">QR</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">VIP</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && (
              <tr><td colSpan="6" className="p-6 text-center text-slate-500">Loading…</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan="6" className="p-6 text-center text-slate-500">No employees.</td></tr>
            )}
            {rows.map((e) => (
              <tr key={e.id} className="hover:bg-surface-container-highest/10 transition-colors">
                <td className="px-4 py-3">
                  <div className="bg-white p-1 rounded inline-block">
                    <QRCodeSVG value={e.employee_code} size={48} />
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">{e.employee_code}</td>
                <td className="px-4 py-3 text-slate-200 font-medium">{e.name}</td>
                <td className="px-4 py-3">
                  {e.is_vip ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-900/40 text-amber-400 border border-amber-800/50">VIP</span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
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
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => setEditing(e)} className="text-blue-400 hover:text-blue-300 text-sm font-medium">Edit</button>
                  <button
                    onClick={() => { if (confirm(`Delete ${e.employee_code}?`)) del.mutate(e.id) }}
                    className="text-red-400 hover:text-red-300 text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={onSave} className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-lg w-full max-w-md space-y-md">
            <div>
              <h2 className="text-h3 font-h3 text-slate-100">{editing.id ? 'Edit' : 'New'} Employee</h2>
              <p className="text-body-md text-slate-400 mt-1">Assign a unique code to generate a QR.</p>
            </div>
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
            <div className="flex gap-md text-sm">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={!!editing.is_vip}
                  onChange={(ev) => setEditing({ ...editing, is_vip: ev.target.checked })}
                  className="rounded border-outline-variant bg-surface-container-lowest text-blue-500 focus:ring-blue-400"
                />
                VIP (unlimited)
              </label>
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
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/pages/Employees.jsx
git commit -m "feat(admin): rewrite Employees page with stitch card + table patterns"
```

---

## Task 10: Rewrite MealRules page

**Files:**
- Modify: `admin/src/pages/MealRules.jsx`

- [ ] **Step 1: Replace admin/src/pages/MealRules.jsx**

```jsx
import { useState } from 'react'
import { useMealRules, useSaveMealRule, useDeleteMealRule } from '../api/queries'

const EMPTY = { name: '', start_time: '12:00', end_time: '14:00', max_per_day: 1, active: true }

const inputCls =
  'w-full bg-surface-container-lowest border border-outline-variant/50 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all'

export default function MealRules() {
  const { data: rules, isLoading } = useMealRules()
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
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Add rule
        </button>
      </header>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-hidden">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">End</th>
              <th className="px-4 py-3 font-medium">Max/day</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="6" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && (!rules || rules.length === 0) && (
              <tr><td colSpan="6" className="p-6 text-center text-slate-500">No meal rules.</td></tr>
            )}
            {rules?.map((r) => (
              <tr key={r.id} className="hover:bg-surface-container-highest/10 transition-colors">
                <td className="px-4 py-3 text-slate-200 font-medium">{r.name}</td>
                <td className="px-4 py-3 font-mono text-slate-300">{r.start_time}</td>
                <td className="px-4 py-3 font-mono text-slate-300">{r.end_time}</td>
                <td className="px-4 py-3 text-slate-300">{r.max_per_day}</td>
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
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => setEditing({ ...r })} className="text-blue-400 hover:text-blue-300 text-sm font-medium">Edit</button>
                  <button
                    onClick={() => { if (confirm(`Delete ${r.name}?`)) del.mutate(r.id) }}
                    className="text-red-400 hover:text-red-300 text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={onSave} className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-lg w-full max-w-md space-y-md">
            <div>
              <h2 className="text-h3 font-h3 text-slate-100">{editing.id ? 'Edit' : 'New'} Meal Rule</h2>
              <p className="text-body-md text-slate-400 mt-1">Defines a time window and daily limit.</p>
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
                <input
                  required type="time"
                  value={editing.start_time?.slice(0, 5) || ''}
                  onChange={(ev) => setEditing({ ...editing, start_time: ev.target.value + ':00' })}
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">End</label>
                <input
                  required type="time"
                  value={editing.end_time?.slice(0, 5) || ''}
                  onChange={(ev) => setEditing({ ...editing, end_time: ev.target.value + ':00' })}
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Max per day</label>
              <input
                type="number" min={1}
                value={editing.max_per_day}
                onChange={(ev) => setEditing({ ...editing, max_per_day: +ev.target.value })}
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={!!editing.active}
                onChange={(ev) => setEditing({ ...editing, active: ev.target.checked })}
                className="rounded border-outline-variant bg-surface-container-lowest text-blue-500 focus:ring-blue-400"
              />
              Active
            </label>
            <div className="flex justify-end gap-sm pt-sm">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 transition-colors">Cancel</button>
              <button type="submit" disabled={save.isPending} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-60 transition-colors">
                {save.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/pages/MealRules.jsx
git commit -m "feat(admin): rewrite MealRules page with stitch card + table patterns"
```

---

## Task 11: Rewrite Logs page

**Files:**
- Modify: `admin/src/pages/Logs.jsx`

- [ ] **Step 1: Replace admin/src/pages/Logs.jsx**

Header with h1 + outlined-blue "Export CSV" button. Filter card (Date / Employee / Result). Card-wrapped log table with Time, Employee, Session, Result, Reason, Scanned code.

```jsx
import { useState } from 'react'
import { useLogs, useEmployees } from '../api/queries'
import { api, getToken } from '../api/client'

const resultBadge = (r) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border '
  if (r === 'allowed') return base + 'bg-green-900/40 text-green-400 border-green-800/50'
  if (r === 'denied') return base + 'bg-red-900/40 text-red-400 border-red-800/50'
  return base + 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50'
}

const inputCls =
  'w-full bg-surface-container-lowest border border-outline-variant/50 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all'

export default function Logs() {
  const [filters, setFilters] = useState({ date: '', employee_id: '', result: '' })
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
  const { data, isLoading } = useLogs(params)
  const { data: empPage } = useEmployees({ per_page: 500 })

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

  return (
    <>
      <header className="flex justify-between items-end mb-lg">
        <div>
          <h1 className="font-h1 text-h1 text-slate-100">Live Logs</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">All scan events with filtering and export.</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!getToken()}
          className="bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-40"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
          Export CSV
        </button>
      </header>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-md mb-md grid grid-cols-1 md:grid-cols-3 gap-md">
        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Date</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Employee</label>
          <select
            value={filters.employee_id}
            onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}
            className={inputCls}
          >
            <option value="">All</option>
            {empPage?.data?.map((e) => (
              <option key={e.id} value={e.id}>{e.employee_code} — {e.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Result</label>
          <select
            value={filters.result}
            onChange={(e) => setFilters({ ...filters, result: e.target.value })}
            className={inputCls}
          >
            <option value="">All</option>
            <option value="allowed">Allowed</option>
            <option value="denied">Denied</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-hidden">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Session</th>
              <th className="px-4 py-3 font-medium">Result</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Scanned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="6" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan="6" className="p-6 text-center text-slate-500">No logs for these filters.</td></tr>
            )}
            {rows.map((l) => (
              <tr key={l.id} className="hover:bg-surface-container-highest/10 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-300 text-xs">{new Date(l.scanned_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  {l.employee
                    ? <span className="text-slate-200"><span className="font-mono text-slate-400">{l.employee.employee_code}</span> — {l.employee.name}</span>
                    : <span className="text-slate-500 italic">unknown</span>}
                </td>
                <td className="px-4 py-3 text-slate-300">{l.meal_rule?.name || '—'}</td>
                <td className="px-4 py-3"><span className={resultBadge(l.result)}>{(l.result || '').toUpperCase()}</span></td>
                <td className="px-4 py-3 text-slate-400">{l.reason || '—'}</td>
                <td className="px-4 py-3 font-mono text-slate-500 text-xs">{l.scanned_code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/pages/Logs.jsx
git commit -m "feat(admin): rewrite Logs page with stitch filter card + table"
```

---

## Task 12: Install dependencies and run dev server for visual verification

**Files:** none (verification only)

- [ ] **Step 1: Install dependencies (if not installed)**

```bash
cd admin && npm install
```

Expected: finishes without errors. If `node_modules` already exists and lockfile unchanged, this is a no-op.

- [ ] **Step 2: Start dev server**

```bash
cd admin && npm run dev
```

Expected: Vite prints `Local: http://localhost:5173/` (or similar port) and watches files. No compile errors in terminal.

- [ ] **Step 3: Visual verification checklist (open browser to the Vite URL)**

Verify each of these, reporting any failures:

- `/login` redirects correctly; dark surface + radial blue gradient behind the centered card; Inter font rendering (distinctive — if you see a serif or default sans, fonts aren't loading); material icon (restaurant) visible in blue tint box; inputs have inset dark background
- DevTools Network tab: `Inter:wght@...` and `Material+Symbols+Outlined...` both 200 OK (no 404)
- Submit login (with backend running) → `/dashboard` loads
- `/dashboard`: top bar visible with brand "MealDistribute Pro", search input centered, icon buttons + avatar "A" on right; sidebar with "Distributor HQ" heading, 4 items, Dashboard highlighted in blue; 5 metric cards in a row; 3-pane content grid (velocity chart, session breakdown, live log); no console errors
- `/employees`: sidebar now highlights "Employees"; search + "Add employee" button in header; card-wrapped table; clicking "Add employee" opens backdrop-blur modal; modal form inputs have dark inset style; Cancel closes; Save persists
- `/meal-rules`: similar shell; "Add rule" button opens modal with Start/End time inputs
- `/logs`: "Export CSV" button in outlined-blue style; filter card visible; table below; export button disabled until login token present
- Scroll test: on `/logs` or `/employees` with many rows, main content area (not page) should scroll smoothly — if the whole page locks and you can't scroll, `body { overflow: hidden }` is still somewhere

- [ ] **Step 4: Stop the dev server**

Ctrl+C in the terminal running `npm run dev`.

- [ ] **Step 5: Report any failures**

If the visual checklist passes, proceed. If anything fails, note the specific symptom (URL, what was expected, what appeared) so the issue can be diagnosed.

---

## Self-Review

Spec coverage (checked against `docs/superpowers/specs/2026-04-22-admin-ui-rewrite-stitch-parity-design.md`):

- ✅ Tailwind config sync → Task 1
- ✅ index.html body classes → Task 2
- ✅ index.css alignment → Task 3
- ✅ TopNavBar creation → Task 4
- ✅ SideNavBar creation → Task 5
- ✅ Layout orchestrator → Task 6
- ✅ Login page → Task 7
- ✅ Dashboard page (Session Breakdown substitution, real hourly chart) → Task 8
- ✅ Employees page → Task 9
- ✅ MealRules page → Task 10
- ✅ Logs page → Task 11
- ✅ Verification → Task 12

Placeholder scan: No TBD/TODO/placeholders.

Type/name consistency: Component names (`TopNavBar`, `SideNavBar`, `Layout`), hook names (`useLogin`, `useLogout`, `useEmployees`, `useLogs`, `useMealRules`, `useSaveEmployee`, `useDeleteEmployee`, `useSaveMealRule`, `useDeleteMealRule`) used consistently across tasks.

Unused code: Layout's previous inline TopNavBar + SideNavBar markup is fully replaced by imports from the new component files — no orphaned references.
