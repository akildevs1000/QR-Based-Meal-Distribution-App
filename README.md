# QR Meal Distribution

Monorepo for a QR-based employee meal distribution system.

| Project | Stack | Dev port |
|---------|-------|----------|
| `backend/` | Laravel 11 API (SQLite) | 8000 |
| `admin/`   | React + Vite + Tailwind | 5173 |
| `counter/` | React + Vite + Tailwind (scanner) | 5174 |

See [initial-flow.md](initial-flow.md) for the full functional spec.

## Quickstart

All three apps run in parallel. Use three terminals.

### 1. Backend

```powershell
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

Default seeded admin: `admin@example.com` / `password`.
Sample employee QR codes: `EMP-00001` through `EMP-00005` (one is VIP).

### 2. Admin panel

```powershell
cd admin
npm install
npm run dev
```

Open http://localhost:5173 and log in.

### 3. Counter app (scanner)

```powershell
cd counter
npm install
npm run dev -- --host
```

Open http://localhost:5174 on a device with a camera. Camera APIs require HTTPS or localhost — on a phone use the machine's LAN IP through a reverse tunnel, or run via `vite --host` and browse to the local HTTP URL (most mobile browsers allow camera on plain HTTP only for `localhost`).

## API

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST   | `/api/scan` | — | rate-limited |
| POST   | `/api/login` | — | Sanctum |
| POST   | `/api/logout` | Sanctum | |
| GET    | `/api/me` | Sanctum | |
| CRUD   | `/api/employees` | Sanctum | |
| CRUD   | `/api/meal-rules` | Sanctum | |
| GET    | `/api/logs` | Sanctum | filters: date, employee_id, result |
| GET    | `/api/logs/export` | Sanctum | CSV (stub) |
