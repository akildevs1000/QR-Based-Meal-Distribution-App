# FEATURE-RECIPE.md — Adding One Resource End-to-End

A "feature" in this kit is almost always: one new resource (table) with CRUD, a list page, an edit modal, and a nav entry. Every feature follows the same seven steps. If you find yourself doing extra steps, stop and check whether you're fighting the philosophy.

We'll use **Customer** as the worked example. Substitute your resource name throughout.

Time budget: **30-60 minutes per feature**, once the bootstrap is done.

---

## Step 1 — Migration (backend)

```bash
cd backend
php artisan make:migration create_customers_table
```

```php
// database/migrations/..._create_customers_table.php
public function up(): void {
    Schema::create('customers', function (Blueprint $table) {
        $table->id();
        $table->string('code', 64)->unique();
        $table->string('name', 191);
        $table->string('email', 191)->nullable();
        $table->string('phone', 32)->nullable();
        $table->string('status')->default('active');   // 'active' | 'inactive'
        $table->text('notes')->nullable();
        $table->boolean('active')->default(true);
        $table->timestamps();

        $table->index('status');
    });
}

public function down(): void { Schema::dropIfExists('customers'); }
```

```bash
php artisan migrate
```

## Step 2 — Model (backend)

```bash
php artisan make:model Customer
```

```php
// app/Models/Customer.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'name', 'email', 'phone', 'status', 'notes', 'active'];

    protected $casts = [
        'active' => 'boolean',
    ];
}
```

If the resource has relationships, add them here. Otherwise nothing else.

## Step 3 — Controller (backend)

```bash
php artisan make:controller Api/CustomerController
```

Copy from [snippets/ResourceController.php](snippets/ResourceController.php) and adapt the resource name + validation rules. The shape is fixed: `index/store/show/update/destroy` with inline `$request->validate([...])`.

```php
// app/Http/Controllers/Api/CustomerController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    private const STATUSES = ['active', 'inactive'];

    public function index(Request $request): JsonResponse
    {
        $q = Customer::query()->orderBy('name');

        if ($s = $request->string('q')->toString()) {
            $q->where(fn ($w) => $w->where('name', 'like', "%{$s}%")
                                  ->orWhere('code', 'like', "%{$s}%")
                                  ->orWhere('email', 'like', "%{$s}%"));
        }
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }

        if ($request->boolean('all')) {
            return response()->json(['data' => $q->get()]);
        }
        return response()->json($q->paginate($request->integer('per_page', 25)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code'   => ['required', 'string', 'max:64', 'unique:customers,code'],
            'name'   => ['required', 'string', 'max:191'],
            'email'  => ['nullable', 'email', 'max:191'],
            'phone'  => ['nullable', 'string', 'max:32'],
            'status' => ['sometimes', 'string', Rule::in(self::STATUSES)],
            'notes'  => ['nullable', 'string', 'max:2000'],
            'active' => ['boolean'],
        ]);
        return response()->json(Customer::create($data), 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        return response()->json($customer);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $data = $request->validate([
            'code'   => ['sometimes', 'string', 'max:64', Rule::unique('customers', 'code')->ignore($customer->id)],
            'name'   => ['sometimes', 'string', 'max:191'],
            'email'  => ['sometimes', 'nullable', 'email', 'max:191'],
            'phone'  => ['sometimes', 'nullable', 'string', 'max:32'],
            'status' => ['sometimes', 'string', Rule::in(self::STATUSES)],
            'notes'  => ['sometimes', 'nullable', 'string', 'max:2000'],
            'active' => ['sometimes', 'boolean'],
        ]);
        $customer->update($data);
        return response()->json($customer->fresh());
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete();
        return response()->json(['ok' => true]);
    }
}
```

## Step 4 — Route (backend)

In `routes/api.php`, inside the `auth:sanctum` group:
```php
Route::apiResource('customers', \App\Http\Controllers\Api\CustomerController::class);
```

For kebab-case multi-word resources, add the parameter map:
```php
Route::apiResource('meal-rules', MealRuleController::class)->parameters(['meal-rules' => 'mealRule']);
```

Smoke-test:
```bash
curl -H "Authorization: Bearer <your-token>" http://localhost:8000/api/customers
```

## Step 5 — Query hooks (admin)

Append to `admin/src/api/queries.js`:

```js
// Customers
export function useCustomers(params = {}) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => (await api.get('/customers', { params })).data,
  })
}

export function useSaveCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c) => c.id
      ? (await api.put(`/customers/${c.id}`, c)).data
      : (await api.post('/customers', c)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/customers/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}
```

If you need a single-customer detail load (rare; usually the row already has everything):
```js
export function useCustomer(id, enabled = true) {
  return useQuery({
    queryKey: ['customer', id],
    enabled: !!id && enabled,
    queryFn: async () => (await api.get(`/customers/${id}`)).data,
  })
}
```

## Step 6 — List page (admin)

Create `admin/src/pages/Customers.jsx`. Apply the page recipe verbatim — see [ADMIN.md](ADMIN.md) section "Page recipe".

```jsx
import { useEffect, useState } from 'react'
import { useCustomers, useDeleteCustomer } from '../api/queries'
import Pagination from '../components/Pagination'
import Select from '../components/Select'

export default function Customers() {
  const [filters, setFilters] = useState({ q: '', status: '' })
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  useEffect(() => { setPage(1) }, [filters])

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
  const { data, isLoading } = useCustomers({ ...params, page })
  const del = useDeleteCustomer()
  const rows = data?.data ?? []

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-md mb-lg">
        <div className="min-w-0">
          <h1 className="font-h1 text-h1 text-slate-100">Customers</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">All customer accounts.</p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          New customer
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-sm mb-md">
        <input
          type="text"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          placeholder="Search…"
          className="w-64 bg-surface-container-lowest border border-outline-variant/50 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
        />
        <Select
          value={filters.status}
          onChange={(v) => setFilters({ ...filters, status: v })}
          className="w-40"
          options={[
            { value: '', label: 'Any status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
        {Object.values(filters).some(Boolean) && (
          <button
            onClick={() => setFilters({ q: '', status: '' })}
            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>Clear
          </button>
        )}
      </div>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-hidden">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3 font-medium">Code</th>
              <th className="px-3 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Email</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium w-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan={5} className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">No customers.</td></tr>}
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-surface-container-highest/10 transition-colors">
                <td className="px-3 py-3 font-mono text-slate-300 text-xs">{c.code}</td>
                <td className="px-3 py-3 text-slate-200">{c.name}</td>
                <td className="px-3 py-3 text-slate-400 text-sm">{c.email || '—'}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    c.status === 'active'
                      ? 'bg-green-900/40 text-green-400 border-green-800/50'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/50'
                  }`}>{c.status.toUpperCase()}</span>
                </td>
                <td className="px-3 py-3 text-right">
                  <button onClick={() => setEditing(c)} className="text-slate-400 hover:text-slate-200 mr-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                  </button>
                  <button
                    onClick={() => confirm(`Delete ${c.name}?`) && del.mutate(c.id)}
                    className="text-slate-500 hover:text-red-400"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination meta={data} onChange={setPage} />
      </div>

      {editing && <CustomerDialog value={editing} onClose={() => setEditing(null)} />}
    </>
  )
}
```

The edit dialog (`CustomerDialog`) is a small component in the same file. It uses the form field pattern from [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) section 5 and `useSaveCustomer()` to submit.

## Step 7 — Wire up routing + nav (admin)

In `admin/src/App.jsx`:
```jsx
import Customers from './pages/Customers'
// …
<Route path="/customers" element={<Customers />} />
```

In `admin/src/components/SideNavBar.jsx`, add to the appropriate group:
```js
{ to: '/customers', icon: 'group', label: 'Customers' },
```

## Done. Smoke-test the loop.

1. Reload admin. Customers appears in the sidebar.
2. Click it. Empty state renders.
3. Click "New customer". Modal opens. Save. Row appears.
4. Click edit. Modal opens with values. Change name. Save. Row updates.
5. Click delete. Confirm. Row disappears.
6. Filter by status. List narrows. Clear. List returns.
7. Pagination works at >25 rows.

If anything is wrong, the divergence is almost certainly in:
- A missing `Rule::unique(...)->ignore($id)` on update (fails on edit-without-changing-code)
- A missing `qc.invalidateQueries(...)` on a mutation (rows don't refresh)
- Sending `''` instead of stripping it from params (backend filters incorrectly)

---

## Variations

### Resource with file upload (avatar, document)

In the controller, accept `multipart/form-data` and store via `Storage::disk('public')->putFile(...)`. In the migration, add a `string('avatar')->nullable()`. In the queries hook, use the `buildXPayload` pattern from [ADMIN.md](ADMIN.md) section 4.

### Resource with parent/child detail page

If editing the parent involves listing/managing children (e.g., Site → SupplierMealAssignments), you have two choices:
1. **Modal-only:** the parent's edit modal contains a sub-table for children, edited inline. Preferred for short child lists.
2. **Detail route:** `<Route path="/sites/:id" element={<SiteDetail/>} />` with its own page using the same recipe. Use only when the child list is long enough that a modal feels cramped.

### Public (unauthenticated) endpoint

Add the route outside the `auth:sanctum` group, with its own `throttle:N,1`. On the admin side, write the query hook the same way — the request interceptor sends a token if present, and the backend simply ignores it for public routes.

### Bulk action

Add a checkbox column. Track `selectedIds` in `useState(new Set())`. The toolbar grows a "Bulk actions" button when `selectedIds.size > 0`. Send the array to a new backend endpoint (`POST /customers/bulk-delete`).

---

## What you do **not** add per feature

- A new color or radius or spacing.
- A custom Input/Button/Modal component (use `inputCls` and the existing patterns).
- A separate `services/` or `repositories/` folder in the backend.
- A new state management library on the frontend.
- A unit test pyramid. (Test where it earns its keep — the validators in the controller, the auth flow. Don't test that React renders text.)
