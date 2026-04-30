# CLAUDE.md — Bootstrap Instructions for Claude

**You are bootstrapping a fresh project from this starter kit. Read this file before doing anything else.**

This folder (`starter/`) contains the design philosophy, architectural conventions, and reference snippets needed to clone the look-and-feel of the parent project into a new app. Follow it literally. Do not improvise.

## Reading order

Read these in order, **before writing or scaffolding any code**:

1. [PHILOSOPHY.md](PHILOSOPHY.md) — the non-negotiables
2. [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) — tokens + component contracts
3. [BACKEND.md](BACKEND.md) — Laravel API conventions
4. [ADMIN.md](ADMIN.md) — React/Vite/Tailwind conventions
5. [BOOTSTRAP.md](BOOTSTRAP.md) — the day-1 step list
6. [FEATURE-RECIPE.md](FEATURE-RECIPE.md) — how to add a single resource

After reading, summarize the project plan back to the user in 5-8 bullet points and confirm before scaffolding.

## What to confirm with the user before scaffolding

1. **Project name** — used in `package.json`, app title, token storage key.
2. **Repo layout** — single repo with `backend/` + `admin/` folders, or two separate repos?
3. **Resources** — which entities will the admin manage? (e.g., Customers, Orders, Invoices.) You don't need the full schema yet, just the names.
4. **Auth model** — single user role or multi-role? Default: single role, email + password, Sanctum bearer tokens.
5. **Brand divergence** — does the new app use a different primary color or stay on `#3B82F6`? Default: stay.

If the user has not specified, ask. Do not invent answers.

## Hard rules (do not break without explicit user OK)

1. **Use design tokens, not raw colors.** `bg-surface-container-low`, never `bg-slate-900` for surfaces.
2. **Inline filter toolbar, no labels.** Each filter input uses its placeholder; no "Filter by site:" labels above inputs.
3. **Page recipe is fixed.** Header (title + action) → inline filter toolbar → table card with pagination. See [ADMIN.md](ADMIN.md) section "Page Recipe".
4. **Component primitives copy verbatim.** DatePicker, DateRangePicker, Select, Pagination, Layout, SideNavBar, ProtectedRoute. Only `SideNavBar.navGroups` should be edited.
5. **API hook naming is fixed.** `useX(params)` for list, `useX(id)` for one, `useSaveX()` for upsert (POST or PUT based on `obj.id`), `useDeleteX()` for delete. Always invalidate the matching query key.
6. **Backend controllers follow the SiteController shape.** index/store/show/update/destroy with `request->validate()`, paginated list with optional `?all=1` for full lists.
7. **Auth uses Sanctum bearer tokens** stored in `localStorage` under a project-specific key (e.g., `myapp_token`). 401 responses clear token + redirect to `/login`.
8. **Material Symbols Outlined**, sized inline via `style={{ fontSize: 18 }}`. No icon libraries.
9. **No CSS files per component.** Tailwind classes only. The single global CSS is `index.css` (font, scrollbar, print).
10. **Status badges** follow the `bg-X-900/40 text-X-400 border-X-800/50` formula. See [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) "Status Patterns".

## Snippets to copy verbatim

From `starter/snippets/`:
- `tailwind.config.js` → `admin/tailwind.config.js`
- `index.css` → `admin/src/index.css`
- `main.jsx` → `admin/src/main.jsx`
- `ProtectedRoute.jsx` → `admin/src/components/ProtectedRoute.jsx`

From the parent project's `admin/src/components/` (or wherever the reusable primitives live):
- `Layout.jsx`, `SideNavBar.jsx` (edit `navGroups` for the new app)
- `DatePicker.jsx`, `DateRangePicker.jsx`, `Select.jsx`, `Pagination.jsx`, `RowMenu.jsx`

## Templates (adapt, do not copy verbatim)

- `snippets/api-client.js` — change `TOKEN_KEY` and base URL
- `snippets/Login.jsx` — change brand text and redirect target
- `snippets/ResourceController.php` — rename to the actual resource

## When you may proceed without asking

- Migration column types and indexes for an obvious schema (`name string`, `email unique`, `created_at timestamp`).
- Standard validation rules (`required`, `string|max:191`, `email`, `unique:table,column`).
- The standard `apiResource` route registration and the `useX/useSaveX/useDeleteX` hook trio.
- Paginated index, single show, validated store/update, soft-delete-or-hard-delete destroy.

## When you must ask first

- The user requests a layout that diverges from the page recipe (e.g., a Kanban board, a calendar view, side-by-side detail panes).
- The user requests a non-token color or a brand-color override.
- The user wants a feature flag, multi-tenancy, or anything that changes auth.
- The user wants a third frontend (scanner, counter, kiosk) on day 1 — confirm whether they want it scaffolded now or deferred.
- A migration would drop or rename a column on an existing table that already has data.

## What you must never do silently

- Do **not** install a UI library (MUI, Chakra, Mantine, AntD). The kit is Tailwind + custom primitives.
- Do **not** add a state manager (Redux, Zustand, Jotai). React Query owns server state; `useState`/`useReducer` owns local state.
- Do **not** add SSR, Next.js, Remix. Vite SPA is the choice.
- Do **not** rewrite the design tokens. Copy `tailwind.config.js` and `index.css` verbatim.
- Do **not** create a `theme.ts` / `colors.ts` / `tokens.js` parallel system. The Tailwind config is the only source.

## End-of-session check

Before declaring the bootstrap complete, verify:

- [ ] User can run `php artisan serve` and `npm run dev` and reach the admin in a browser
- [ ] Login page renders, accepts credentials, stores token, redirects to `/dashboard`
- [ ] Dashboard renders inside `<Layout/>` with the SideNav (even if Dashboard body is just "Hello, {user.name}")
- [ ] An invalid token returns 401 and the admin redirects to `/login`
- [ ] One feature (any one) has been built end-to-end as a smoke test using [FEATURE-RECIPE.md](FEATURE-RECIPE.md)

If any item fails, debug — do not declare done.
