# BACKEND.md — Laravel API Conventions

Stack: Laravel 11+ with Sanctum bearer tokens. SQLite for dev, MySQL/Postgres for prod. The backend is a thin REST API; the admin is the only consumer (until a second frontend appears).

Reference implementation: [../backend/](../backend/).

## 1. Folder layout (after `composer create-project laravel/laravel backend`)

```
backend/
├── app/
│   ├── Http/Controllers/
│   │   ├── Controller.php           # base
│   │   └── Api/
│   │       ├── AuthController.php
│   │       ├── ResourceXController.php
│   │       └── …
│   ├── Models/
│   │   ├── User.php
│   │   └── ResourceX.php
│   └── Providers/
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   ├── api.php                      # all endpoints
│   └── web.php                      # leave default
├── config/
│   ├── cors.php                     # edit allowed origins
│   └── sanctum.php
└── .env
```

All API controllers live under `App\Http\Controllers\Api\`. Keep it flat — no per-feature subnamespaces.

## 2. Auth (Sanctum bearer tokens)

Install:
```bash
composer require laravel/sanctum
php artisan install:api
php artisan migrate
```

`User` model uses `HasApiTokens`. Add a seeded admin user via a seeder (don't ship default credentials).

The auth controller has four endpoints. Copy from [../backend/app/Http/Controllers/Api/AuthController.php](../backend/app/Http/Controllers/Api/AuthController.php) verbatim, only renaming the token name (`'admin'` → your app slug):

- `POST /login` → `{ token, user }`. Throttled `10,1`.
- `POST /logout` → `{ ok: true }`. Auth required.
- `GET /me` → user info. Auth required.
- `PATCH /me/profile`, `POST /me/password` — keep as-is.

Login throws `ValidationException` with `email` field error on bad credentials so the admin form can surface it.

## 3. Controller shape (the SiteController template)

Every resource controller looks like this. Copy from [../backend/app/Http/Controllers/Api/SiteController.php](../backend/app/Http/Controllers/Api/SiteController.php) and adapt.

```php
class ResourceXController extends Controller
{
    private const TYPES = ['a', 'b', 'c'];     // any enums

    public function index(Request $request): JsonResponse
    {
        $q = ResourceX::query()->orderBy('name');

        if ($s = $request->string('q')->toString()) {
            $q->where(fn($w) => $w->where('name', 'like', "%{$s}%")
                                  ->orWhere('code', 'like', "%{$s}%"));
        }
        if ($type = $request->string('type')->toString()) {
            $q->where('type', $type);
        }

        if ($request->boolean('all')) {
            return response()->json(['data' => $q->get()]);
        }

        return response()->json($q->paginate($request->integer('per_page', 25)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:191'],
            'code' => ['required', 'string', 'max:64', 'unique:resource_x,code'],
            'type' => ['sometimes', 'string', Rule::in(self::TYPES)],
        ]);
        return response()->json(ResourceX::create($data), 201);
    }

    public function show(ResourceX $resourceX): JsonResponse
    {
        return response()->json($resourceX);
    }

    public function update(Request $request, ResourceX $resourceX): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:191'],
            'code' => ['sometimes', 'string', 'max:64', Rule::unique('resource_x', 'code')->ignore($resourceX->id)],
            'type' => ['sometimes', 'string', Rule::in(self::TYPES)],
        ]);
        $resourceX->update($data);
        return response()->json($resourceX->fresh());
    }

    public function destroy(ResourceX $resourceX): JsonResponse
    {
        $resourceX->delete();
        return response()->json(['ok' => true]);
    }
}
```

Rules:
- **Validation lives in the controller**, inline. Don't make FormRequest classes unless validation is reused or is huge.
- **`?q=` is the universal search filter.** Always wraps in `function ($w)` so OR clauses don't leak.
- **`?all=1` returns the full list ungated** for use in dropdowns. Default is paginated 25 per page.
- **`?per_page=N` overrides page size.**
- **`{sometimes, ...}` for update fields** — partial updates.
- **`Rule::unique(...)->ignore($id)` on update** — never forget this.
- **Index returns the paginator object directly**; the admin's `<Pagination>` reads `current_page/last_page/from/to/total` from it. Don't wrap in `{ data: ... }` (Laravel's paginator already has `.data`).
- **Route-model binding** auto-resolves `{site}` → `Site` model. For kebab-case URLs like `meal-rules`, declare `->parameters(['meal-rules' => 'mealRule'])`.

## 4. Routes

Source: [../backend/routes/api.php](../backend/routes/api.php). Pattern:

```php
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/me/profile', [AuthController::class, 'updateProfile']);
    Route::post('/me/password', [AuthController::class, 'updatePassword']);

    Route::apiResource('resource-x', ResourceXController::class)
        ->parameters(['resource-x' => 'resourceX']);
});
```

`apiResource` registers index/store/show/update/destroy. Don't write them by hand.

Public (unauthenticated) endpoints — only when needed. Each public route gets its own `throttle:N,1` to prevent abuse.

## 5. Migrations

Source pattern: [../backend/database/migrations/](../backend/database/migrations/). One migration per logical change. Naming: `YYYY_MM_DD_HHMMSS_create_X_table.php`, `..._add_Y_to_X_table.php`, `..._extend_X_table.php`.

Conventions:
- Always include `$table->id()` and `$table->timestamps()`.
- String columns default `max:191` to be MySQL utf8mb4 index-safe.
- Booleans get explicit defaults: `$table->boolean('active')->default(true)`.
- Foreign keys: `$table->foreignId('site_id')->constrained()->onDelete('set null')` (or `cascade`).
- Indexes for any column you filter or join on.

Don't squash migrations into one giant file. Keep them additive.

## 6. Models

Source: [../backend/app/Models/Site.php](../backend/app/Models/Site.php).

```php
class ResourceX extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'type', 'active'];

    protected $hidden = ['pin'];           // sensitive fields

    protected $casts = [
        'active'     => 'boolean',
        'start_date' => 'date',
    ];

    public function children(): HasMany { return $this->hasMany(Child::class); }
}
```

Rules:
- **Fillable, not guarded.** Explicit list of mass-assignable columns.
- **Casts for booleans, dates, json, decimals.** Don't trust the driver.
- **Hidden for sensitive fields** (`pin`, `password`, hashed tokens).
- **Relationships only.** No business logic methods. No scopes unless reused 3+ times.

## 7. CORS

Edit `config/cors.php`:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
'supports_credentials' => false,
```
Bearer tokens don't need `supports_credentials`. Keep it false.

## 8. .env essentials

```
APP_NAME=YourApp
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=sqlite
# or mysql with DB_HOST/PORT/DATABASE/USERNAME/PASSWORD

SANCTUM_STATEFUL_DOMAINS=        # leave empty for bearer-token mode
```

## 9. File uploads

When a resource has a file (avatar, document, attachment):
- Column is `string` storing the public URL.
- Controller accepts `multipart/form-data`. The admin auto-detects when to send multipart (see [ADMIN.md](ADMIN.md) section "File uploads").
- Store under `storage/app/public/<resource>/`, return the URL via `Storage::url(...)`.
- For PUT-with-file, the admin sends POST + `_method: 'PUT'` (Laravel reads it). The controller uses `update($validated)` as normal.

Pattern: see how `EmployeeController` handles `profile_picture` in this repo.

## 10. What NOT to do

- **No service classes** for simple CRUD. Controllers are fine being a few dozen lines.
- **No repository pattern.** Eloquent IS the repository.
- **No DTOs / resources** for trivial responses. Use array shaping in the controller (`$arr = $model->toArray(); $arr['x'] = ...; return $arr;`) when you need it. Reach for `JsonResource` only when responses are reused across endpoints with shape divergence.
- **No `try/catch` swallowing exceptions.** Let Laravel's exception handler turn them into proper JSON errors. Validation throws automatically.
- **No global `try` in `index()` returning 500.** If something is broken, fail loud.
- **No business logic in models.** Models = schema + relationships + casts.
