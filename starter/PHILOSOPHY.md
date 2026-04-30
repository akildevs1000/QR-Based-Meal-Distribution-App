# PHILOSOPHY.md — The Non-Negotiables

These are the rules that make every screen feel like the same product. Break them only with explicit reason and explicit approval.

## Visual

1. **Dark, high-density, analytical.** Surface `#0b1326`. Accent blue `#3B82F6`. No gradients (one exception: a subtle radial on the Login backdrop). No drop shadows except `shadow-xl` on popovers (date picker, select dropdown).
2. **Tokens, not raw colors.** Surfaces use the `surface-*` ramp. Text uses `slate-*` (100/300/400/500/600). Accent uses `blue-*` (400 for focus, 600 for selected, `blue-600/20` for tints).
3. **Spacing alphabet.** Only these spacings exist: `xs/sm/md/lg/xl/2xl` = 4/8/16/24/32/48 px. Page gutter is `p-gutter` (24 px). Card padding `p-md`. Don't invent new spacings.
4. **Borders are thin and translucent.** `border-outline-variant/50` on inputs and cards. `border-outline-variant/30` on dividers. `border-outline-variant/20` on table row separators.
5. **Focus ring is blue, always.** `focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none`. Never a default browser focus ring.
6. **Selected = solid blue. Today = blue ring. Range = blue/20.** Same logic in `DatePicker`, `DateRangePicker`, `Pagination`, list rows, dropdown options. Consistency over variety.
7. **Material Symbols Outlined web font.** Sized inline `style={{ fontSize: 18 }}`. No `react-icons`, no `lucide-react`, no SVG sprites — one font does it all.

## Layout

8. **Page recipe is fixed.** Header (title + subtitle on left, primary action on right) → inline filter toolbar → table card with pagination. Dashboard is the exception. Detail/edit screens use modals or drawers, never a separate route.
9. **Inline filter toolbar over bordered filter card.** Filters live in a single `flex flex-wrap gap-sm` row. No labels above inputs — each input's placeholder communicates the filter ("All sites", "Any date"). A Clear button appears only when at least one filter is set.
10. **Sidebar is fixed-width, grouped, blue-marked active.** Left sidebar `w-64`, dark navy. Items are grouped under tiny uppercase labels (Overview / Master Data / Operations / System). Active item gets a 2px left blue border and `text-blue-300`.

## Functional

11. **One filters object per page.** `useState({ filter1: '', filter2: '' })`. Strip empty values before sending to the API. Reset page to 1 when filters change.
12. **react-query owns server state.** Always have a query key. Mutations invalidate the matching key on success. Local UI state stays in `useState`.
13. **`useX/useSaveX/useDeleteX` triplet per resource.** Save is upsert: POST if no `id`, PUT if `id`. File uploads use `multipart/form-data` with Laravel's `_method: 'PUT'` workaround on update.
14. **Auth is bearer token in `localStorage`.** No cookies, no refresh tokens, no silent renewal. 401 response = clear token + redirect to `/login`. Done.
15. **Backend controllers are thin and shaped the same.** index/store/show/update/destroy. Validation inline in the controller via `$request->validate([...])`. List endpoints support `?q=`, paginated with `?per_page=N`, full-list mode with `?all=1`.
16. **Migrations describe schema, models describe relationships and casts.** No business logic in models. Controllers do the orchestration.

## Why these rules exist

- **Speed.** A new feature page should take 30-60 minutes because the recipe is fixed. The first time someone has to "design" a list page, you've lost a half-day.
- **Visual coherence.** Different developers will write different code; tokens and recipes constrain that variation enough that the result still feels like one product.
- **Onboardability.** A new dev (or a new Claude session) reads PHILOSOPHY + DESIGN-SYSTEM and can write a believable page within an hour.
- **Forklift-ability.** Because primitives are pure components and API hooks follow a naming convention, lifting them into a shared package later is a copy-paste operation, not a refactor.

## When to break a rule

Only when the alternative is materially worse for the user. Example:

- A "Reports" page legitimately needs a different layout (date-range pickers + chart canvas, no table). That's fine — but reuse `DateRangePicker` and `Select`, keep the header pattern, keep the spacing tokens.
- A wizard / multi-step form needs progress indicators. Add the indicator using existing tokens; don't introduce a new color or radius.

If you find yourself breaking three rules to ship one feature, stop. The feature is fighting the philosophy. Either change the feature design or formally amend the philosophy and update this file.
