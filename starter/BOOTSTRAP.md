# BOOTSTRAP.md — Day 1: Empty Folder → Working Auth Loop

The goal of day 1 is **not** to build features. It is to prove the wiring end-to-end:

1. Backend boots, responds to `/api/login`.
2. Admin builds, renders the login page.
3. Logging in stores a token and lands on `/dashboard`.
4. An invalid token returns 401 and the admin redirects back to `/login`.

If those four work, every feature after is just repeating [FEATURE-RECIPE.md](FEATURE-RECIPE.md).

Estimated time: half a day if you have read [PHILOSOPHY.md](PHILOSOPHY.md), [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md), [BACKEND.md](BACKEND.md), [ADMIN.md](ADMIN.md) first.

---

## Step 0 — Decide

- **Project name**: e.g. `acme-portal`. Used in `package.json`, app title, token storage key.
- **Repo layout**: single repo with `backend/` + `admin/` folders (recommended), or two repos.
- **Token storage key**: `acme_token` (project slug + `_token`).
- **Backend port**: 8000 (Laravel default). Admin dev port: 5173 (Vite default).

## Step 1 — Scaffold both shells

```bash
mkdir acme-portal && cd acme-portal

# Backend
composer create-project laravel/laravel backend
cd backend
composer require laravel/sanctum
php artisan install:api
php artisan migrate
cd ..

# Admin
npm create vite@latest admin -- --template react
cd admin
npm install
npm install react-router-dom @tanstack/react-query axios
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
cd ..
```

If you intend a monorepo with shared tooling later (workspaces, etc.), set up `package.json` at the root now. Otherwise skip — both subfolders are self-contained.

## Step 2 — Wire the design tokens (admin)

Replace generated files with the kit's verbatim copies:

- `admin/tailwind.config.js` ← [snippets/tailwind.config.js](snippets/tailwind.config.js)
- `admin/src/index.css` ← [snippets/index.css](snippets/index.css)
- `admin/src/main.jsx` ← [snippets/main.jsx](snippets/main.jsx)

Edit `admin/index.html` `<head>` to load fonts:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
<link href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined" rel="stylesheet" />
```
Update `<title>` to your app name.

Smoke check: `npm run dev` should still build (no app yet, just default Vite page).

## Step 3 — Bring in the primitives (admin)

Copy from the parent project's [../admin/src/components/](../admin/src/components/) into `admin/src/components/`:

- `Layout.jsx`
- `SideNavBar.jsx`
- `DatePicker.jsx`
- `DateRangePicker.jsx`
- `Select.jsx`
- `Pagination.jsx`
- `ProtectedRoute.jsx`

Then **edit `SideNavBar.jsx` `navGroups`** down to a minimal nav:
```js
const navGroups = [
  {
    label: 'Overview',
    links: [{ to: '/dashboard', icon: 'dashboard', label: 'Dashboard' }],
  },
]
```
You'll add resource entries as you build them.

Also strip references to `useSettings()` if your app has no settings table yet — hardcode the company name and tagline temporarily.

## Step 4 — API client (admin)

Create `admin/src/api/client.js` from [snippets/api-client.js](snippets/api-client.js). **Change `TOKEN_KEY`** to `acme_token` (or your slug).

Create `admin/src/api/queries.js` with just the auth hooks for now:
```js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, setToken } from './client'

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: async () => (await api.get('/me')).data })
}
export function useLogin() {
  return useMutation({
    mutationFn: async (creds) => (await api.post('/login', creds)).data,
    onSuccess: (data) => setToken(data.token),
  })
}
export function useLogout() {
  return useMutation({
    mutationFn: async () => (await api.post('/logout')).data,
    onSettled: () => setToken(null),
  })
}
```

## Step 5 — Auth backend

Create `backend/app/Http/Controllers/Api/AuthController.php` from [../backend/app/Http/Controllers/Api/AuthController.php](../backend/app/Http/Controllers/Api/AuthController.php). Change the token name `'admin'` → your app slug.

Edit `backend/routes/api.php`:
```php
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/me/profile', [AuthController::class, 'updateProfile']);
    Route::post('/me/password', [AuthController::class, 'updatePassword']);
});
```

Edit `backend/config/cors.php` to allow `http://localhost:5173`.

Make sure `User` model uses `HasApiTokens`:
```php
use Laravel\Sanctum\HasApiTokens;
class User extends Authenticatable {
    use HasApiTokens, HasFactory, Notifiable;
    // …
}
```

## Step 6 — Seed an admin user

Create `backend/database/seeders/AdminUserSeeder.php`:
```php
public function run(): void {
    User::firstOrCreate(
        ['email' => 'admin@example.com'],
        ['name' => 'Admin', 'password' => bcrypt('changeme')]
    );
}
```
Register in `DatabaseSeeder.php`. Run:
```bash
php artisan db:seed --class=AdminUserSeeder
```

## Step 7 — Login + Dashboard pages (admin)

Create `admin/src/pages/Login.jsx` from [snippets/Login.jsx](snippets/Login.jsx). Update brand text.

Create `admin/src/pages/Dashboard.jsx` minimal:
```jsx
import { useMe } from '../api/queries'
export default function Dashboard() {
  const { data: me } = useMe()
  return (
    <>
      <header className="mb-lg">
        <h1 className="font-h1 text-h1 text-slate-100">Dashboard</h1>
        <p className="font-body-md text-body-md text-slate-400 mt-1">Welcome{me ? `, ${me.name}` : ''}.</p>
      </header>
      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-md text-slate-400">
        Auth loop is working. Replace this placeholder with real widgets.
      </div>
    </>
  )
}
```

Replace `admin/src/App.jsx`:
```jsx
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
```

## Step 8 — Run both, verify the loop

Terminal A:
```bash
cd backend && php artisan serve
```

Terminal B:
```bash
cd admin && npm run dev
```

Open `http://localhost:5173`. You should be redirected to `/login`. Log in with the seeded credentials. You should land on `/dashboard` rendered inside the sidebar layout.

## Step 9 — Verify the failure paths

- DevTools → Application → Local Storage → delete the token. Reload. Should redirect to `/login`. ✅
- DevTools → Application → Local Storage → set token to garbage. Reload. The first authed request returns 401, the interceptor clears the token and redirects to `/login`. ✅
- Click "Log out" in the sidebar (if `SideNavBar` has it). Should clear token + return to `/login`. ✅

## Step 10 — Commit, then start features

```bash
git init
git add .
git commit -m "scaffold: backend + admin auth loop"
```

Now and only now, build features using [FEATURE-RECIPE.md](FEATURE-RECIPE.md).

---

## Common bootstrap mistakes

- **Tailwind not picking up classes** → check `tailwind.config.js` `content` glob includes `./src/**/*.{js,jsx,ts,tsx}` and `./index.html`.
- **`bg-surface-container-low` renders default white** → `index.css` is missing or `tailwind.config.js` didn't copy the custom colors.
- **CORS blocked** → `config/cors.php` `allowed_origins` doesn't include the dev URL exactly (no trailing slash).
- **401 on every request after login** → token name in storage doesn't match what `client.js` reads, or the request interceptor isn't attached (check `main.jsx` imports `./api/client`? — it doesn't need to; importing client.js anywhere in the tree side-effects the interceptors).
- **Sanctum CSRF errors** → don't use `auth:sanctum` cookie mode; this kit uses bearer tokens only. Leave `SANCTUM_STATEFUL_DOMAINS` empty.
- **`php artisan install:api` not found** → Laravel < 11. Upgrade or run the manual Sanctum install steps from the docs.
