Summary
A working end-to-end monorepo — all three apps wired and verified.

Backend — backend/

Laravel 12 + Sanctum + SQLite
Migrations: employees, meal_rules, meal_logs
Core logic in app/Services/ScanService.php — shared between API and tests
Controllers in app/Http/Controllers/Api/: ScanController, AuthController, EmployeeController, MealRuleController, LogController
Routes in routes/api.php — 16 endpoints registered
Seeder: admin admin@example.com / password, meal rules (Breakfast/Lunch/Dinner), 5 employees (EMP-00001…EMP-00005, EMP-00005 is VIP)
6/6 feature tests passing (tests/Feature/ScanTest.php)
Live API verified — scan/login/me/employees/meal-rules/logs all returning expected JSON
Counter app — counter/ on port 5174

Single-screen scanner: src/App.jsx state machine + Scanner + ResultOverlay
Uses @yudiel/react-qr-scanner, full-viewport green/red feedback, 2.5s auto-reset, 3s duplicate-decode cooldown
Production build clean
Admin app — admin/ on port 5173

React Router + React Query + Tailwind
Pages: Login, Employees (with live QR render via qrcode.react), MealRules, Logs (filter + CSV export)
Sanctum token stored in localStorage, 401 auto-redirects to login
Production build clean
Next steps for you
Open 3 terminals and run:


# terminal 1
cd backend; php artisan serve
# terminal 2
cd admin; npm run dev
# terminal 3
cd counter; npm run dev
Log in at http://localhost:5173 with admin@example.com / password. The counter at http://localhost:5174 needs camera permission — on a phone, browse to http://<your-lan-ip>:5174 (the dev server is already host: true).