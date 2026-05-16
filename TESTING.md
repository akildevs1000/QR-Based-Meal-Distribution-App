# Testing Checklist

End-to-end smoke test for the QR Meal Distribution CMS. Work top to bottom on a fresh seed.

---

## 0. Setup

- [ ] `cd backend && php artisan migrate:fresh --seed` returns `Seeded: admin@example.com / password (+ distributor, timekeeper, sitemanager)`
- [ ] `cd backend && php artisan test` → **7/7 pass**
- [ ] `cd backend && php artisan storage:link` (once, so uploaded photos/attachments are publicly served)
- [ ] Three terminals running:
  - [ ] `cd backend && php artisan serve` → http://localhost:8000
  - [ ] `cd admin && npm run dev` → http://localhost:5173
  - [ ] `cd counter && npm run dev -- --host` → http://localhost:5174 (optional, for scanner)

### Seeded accounts

| Email | Password | Role |
|---|---|---|
| admin@example.com | password | admin |
| distributor@example.com | password | distributor |
| timekeeper@example.com | password | timekeeper |
| sitemanager@example.com | password | site_manager |

### Seeded master data (useful fixtures)

- **Sites:** `DIP-1` (Camp), `P-121` (Site), `P-101` (Site, finish), `HQ` (Site)
- **Employees:** `INVOW03210` (Hymath Pasha · Watchman), `INVOW03292` (Ranjeet Kumar · not eligible), `EMP-00001..5` (VIP = Evelyn Park)
- **Suppliers:** `INVO01`, `AMC01`, `DDC01`, `SSC001` (inactive)
- **Cuisines:** North/South Indian, Bangladeshi, Pakistani, Nepali, African (18 categories)
- **Complaints:** C001 (open), C002 (resolved), C003 (in review)
- **Delivery Notes:** DN0001 (delivered 500/500), DN0002 (partial 115/120)

---

## 1. Authentication & Profile

- [ ] Navigate to http://localhost:5173 → redirects to `/login`
- [ ] Log in as `admin@example.com` / `password` → lands on `/dashboard`
- [ ] Wrong password shows an error message, no redirect
- [ ] Sidebar shows company name + 4 groups: **Overview · Master Data · Operations · System**
- [ ] **Settings → Profile**: change name, save, refresh, persists
- [ ] **Settings → Security**: change password, log out, log back in with new password
- [ ] **Settings → Branding**: upload a logo; sidebar + scanner header pick it up; delete logo also works
- [ ] Log out via sidebar → returns to `/login`

---

## 2. Dashboard (`/dashboard`)

- [ ] KPI tiles render (Active Employees, Meals Served, Access Denied, Sites, Efficiency)
- [ ] Live clock updates each second
- [ ] Site filter dropdown shows all seeded sites
- [ ] Distribution velocity chart renders
- [ ] Recent scan log shows latest events once you've scanned (empty initially)

---

## 3. Beneficiaries / Employees (`/employees`)

- [ ] List shows 5 seeded employees with photo placeholder, code, designation, **Eligible** badge, **Duty** column
- [ ] Search box filters by code/name
- [ ] Click **Add employee** → modal opens
- [ ] **Drag-and-drop photo upload**: drag a PNG/JPG onto the upload zone — it highlights, then shows the filename
- [ ] Alternatively, click the dropzone → file picker opens
- [ ] Clear button (×) removes the selected file
- [ ] Save a new employee (meal_eligibility = Yes, duty_status = On Duty) → appears in list
- [ ] Edit existing: change **Meal eligibility** to No → badge flips to NO
- [ ] Edit existing: change **Duty status** to Allowance → column shows "ALLOWANCE"
- [ ] View modal: shows all fields including eligibility, duty status, QR code
- [ ] Print single card: opens modal, clicking **Print** shows a 54×86mm card only (no UI chrome) in the print preview
- [ ] **Bulk print**:
  - [ ] Select 2–3 employees via checkboxes → "Print N cards" button appears
  - [ ] Header checkbox selects/deselects all rows
  - [ ] Click **Print N cards** → modal shows a grid of cards
  - [ ] Clicking **Print all** shows grid of cards in print preview (no sidebar/nav)
- [ ] Delete an employee → confirm dialog → removed from list

---

## 4. Sites (`/sites`)

- [ ] List shows 4 seeded sites with **Type** (CAMP/SITE), **Status**, **Start**, **End** columns
- [ ] Status badges: DIP-1 = ACTIVE green, P-101 = FINISH blue
- [ ] Create new site: fill code, name, type = Camp, status = Active, dates → saves
- [ ] Edit existing site dates → persists
- [ ] **View detail modal** (via row menu → View):
  - [ ] Shows type, status, start/end dates, description
  - [ ] **Meal supplier assignments** section lists existing assignments (DIP-1 → AMC Catering for Breakfast)
  - [ ] Click **+ Add** under supplier assignments → modal opens → pick supplier + meal + start date → saves → row appears
  - [ ] Delete an assignment → row disappears
  - [ ] **Meal distribution assignments** section same flow (distributor user → meal → dates)
- [ ] PIN: set a 4-digit PIN, save; row shows the lock icon; edit with "Remove PIN" checkbox clears it
- [ ] Delete site → confirm → removed

---

## 5. Suppliers (`/suppliers`)

- [ ] List shows 4 suppliers with contact info + status (SSC001 = INACTIVE)
- [ ] Search filters by name/code
- [ ] Status filter (active/inactive) narrows the list
- [ ] Create a new supplier with contact person + email + phone + address
- [ ] Edit a supplier → check sites on assigned-locations panel → save → reflected in detail
- [ ] **View detail** (row menu → View):
  - [ ] Shows contact fields, start/end dates
  - [ ] **Assigned locations** chips render
  - [ ] **Meal assignments** table lists site × meal × dates
  - [ ] **Documents** section:
    - [ ] Enter document name (e.g. "Trade License"), optional expiry, choose a PDF/image → **Upload**
    - [ ] Document appears in list with link
    - [ ] Clicking the name opens the file in a new tab
    - [ ] Delete document → removed
- [ ] Delete supplier → confirm → gone (documents also cleaned up)

---

## 6. Meal Rules (`/meal-rules`)

- [ ] List shows Breakfast / Lunch / Dinner with time windows
- [ ] Create a new rule (e.g. Tea Break 16:00–16:30, max 1/day) → saves
- [ ] Edit max_per_day → persists
- [ ] Delete a rule → confirm → removed

---

## 7. Meal Types & Categories (`/meal-categories`)

- [ ] Cards for all 6 cuisines render: North Indian, South Indian, Bangladeshi, Pakistani, Nepali, African
- [ ] Each card lists its seeded categories (e.g. North Indian → Veg Rice / Non-Veg Rice / Veg Chapati …)
- [ ] **Add cuisine** → "Continental" → card appears
- [ ] Click **+ Add category** on a cuisine → enter "Pasta" → new row under that cuisine
- [ ] Edit a category name → persists
- [ ] Delete a category → confirm → removed
- [ ] Delete a cuisine warns it'll cascade categories → confirm → both gone

---

## 8. Food Requests (`/food-requests`)

- [ ] List shows 2 seeded requests (DIP-1/Lunch/420, P-121/Lunch/120)
- [ ] Filters: date / site / supplier / status all narrow results
- [ ] **New request**: pick date, site, meal, optional category + supplier, quantity, status = Submitted → saves
- [ ] Edit a request: change status → Delivered → badge flips to emerald
- [ ] Delete → confirm → removed

---

## 9. Delivery Notes (`/delivery-notes`)

- [ ] List shows 2 seeded notes: DN0001 (delivered 500/500, variance 0) and DN0002 (partial 115/120, variance -5 in red)
- [ ] Variance column colors: negative = red, positive = emerald, zero = slate
- [ ] Filter by date / site / supplier / status
- [ ] **New delivery note**: date, time, site, supplier, meal, qty requested + delivered, status, optional slip upload → saves as `DN0003`
- [ ] Upload a photo/PDF as delivery slip → paperclip icon appears on row → clicking it opens file
- [ ] Create a "partial" note where delivered < requested → variance cell is red with `-N`
- [ ] Edit status → "rejected" → badge flips red
- [ ] Delete → confirm → removed

---

## 10. Complaints (`/complaints`)

- [ ] List shows 3 seeded complaints (C001 open, C002 resolved, C003 in review) with their ref #, site, supplier, issue type
- [ ] Filters: status / site / supplier
- [ ] **New complaint**: fill date, issue type (Food Quality / Late Delivery / Wrong Items / Other), description, optionally attach a photo → saves → new ref # auto-generated (`C004`, `C005`, …)
- [ ] Edit an open complaint → set status = Resolved → `date_resolved` auto-fills if blank → persists
- [ ] Attachment: upload, paperclip icon appears, click to view file, replace on edit, delete on delete
- [ ] Delete → confirm → removed

---

## 11. Reports (`/reports`)

- [ ] Page lists **8 reports** with icons:
  - [ ] Daily Transaction Report
  - [ ] Reports by Supplier
  - [ ] Reports by Location
  - [ ] Duplicate / Eligibility
  - [ ] Remarks / Comments
  - [ ] Request Comparison
  - [ ] Delivery Notes Report
  - [ ] Complaint / Issue Report
- [ ] Top filter bar: Start date + End date + (optional) Site
- [ ] For **each** report, exercise all 3 actions with period `2025-09-01` → `2026-05-01`:
  - [ ] **Preview** → in-app modal opens with headers + rows (totals badges where applicable)
  - [ ] **Excel** → downloads `.xlsx` file; open in Excel/LibreOffice to confirm header row + data
  - [ ] **PDF** → downloads `.pdf`; open to confirm title, period, table, auto-landscape when columns > 6
- [ ] **Complaints report** preview shows all 3 seeded complaints + any you created
- [ ] **Request Comparison** for `2025-10-01 → 2025-10-31` shows yesterday/today/variance/% columns
- [ ] **Remarks** combines food-request remarks + complaint descriptions
- [ ] **Delivery Notes** report shows DN0001 + DN0002 + any you created with `delivered` total in the header
- [ ] **Site filter**: pick DIP-1 in the top bar → rerun Daily Transaction → only DIP-1 rows returned

---

## 12. Users & Access (`/users`)

- [ ] List shows 4 seeded users with role badges (admin, distributor, timekeeper, site_manager)
- [ ] Role filter narrows the list
- [ ] **Create user**: name, email, password, role = Distributor → saved, appears in list
- [ ] Edit user: change role, leave password blank → password unchanged
- [ ] Edit user: set new password → log out → log in with new creds → works
- [ ] Try to **delete your own account** → rejected with error message
- [ ] Delete another user → confirm → removed

---

## 13. Transactions / Live Logs (`/logs`)

Produce a scan first:
- [ ] POST to `/api/scan` from curl or the counter app
  - In bash: `curl -X POST http://localhost:8000/api/scan -H "Content-Type: application/json" -d '{"code":"INVOW03210","site_id":1,"source":"scanner"}'`
  - Adjust the system clock or change a meal rule to match current time for an `allowed` result
- [ ] Go to `/logs` → new row appears
- [ ] Columns present: Time, Beneficiary, Meal, **Point, Supplier, Distributor, Type, Source**, Result, Reason
- [ ] Filters: date / employee / site / supplier / source / type / result all narrow the list
- [ ] **Export CSV** downloads `meal-logs-YYYY-MM-DD.csv` with the enriched columns
- [ ] Create a manual-entry scan (`"source":"manual"`) → row shows `type=MANUAL`, `source=MANUAL` in amber badges
- [ ] A `allowed` scan on a site with a supplier-meal-assignment auto-populates the Supplier column
- [ ] A `allowed` scan on a site with a distribution-assignment auto-populates the Distributor column
- [ ] Denied reasons recognisable: `not_registered`, `inactive`, `not_eligible`, `outside_allowed_time`, `already_received`, `wrong_site`

---

## 14. Scanner (counter app @ http://localhost:5174)

- [ ] First load shows the **Site picker** — select DIP-1
- [ ] Header shows "Serving DIP-1 Rent Camp" with company logo
- [ ] Point the camera at a printed beneficiary QR (use the Print card feature to generate one)
- [ ] Valid scan during a meal window → full-screen **green "YES"** overlay with employee name, code, designation, timestamp (2.5 s)
- [ ] Invalid code → **red "NO"** overlay with reason label:
  - [ ] "Not Registered"
  - [ ] "Account Inactive"
  - [ ] "Outside Allowed Time"
  - [ ] "Already Received Meal"
  - [ ] "Invalid QR Code"
  - [ ] "Wrong Site" (scan a beneficiary whose site ≠ scanner site)
- [ ] Duplicate scan of the same code within 3 s is ignored (cooldown)
- [ ] Switch site via the selector → list reloads, new site bound
- [ ] Each scan shows up in the admin `/logs` page in real time

### Native scanner (`scanner/` app, optional)

- [ ] `cd scanner && npm install && npx expo start`
- [ ] Same flow as counter app, plus **PIN lock** when site has a PIN (default `0000`)

---

## 15. Sanity checks

- [ ] `php artisan test` still **7/7 pass** after manual testing
- [ ] `npm run build` in `admin/` is clean
- [ ] No 500 errors visible in `backend/storage/logs/laravel.log` during the session
- [ ] Refresh each page with browser devtools Network tab → only `200` / `304` responses (no `401`/`403`/`500`)

---

## If something breaks

- **Photos / attachments 404:** run `php artisan storage:link` once
- **401 loops:** clear `admin_token` from localStorage and re-login
- **"Outside Allowed Time" for every scan:** adjust a meal rule's `start_time`/`end_time` in `/meal-rules` to bracket the current clock
- **Fresh start:** `php artisan migrate:fresh --seed` wipes everything and re-seeds in ~2 seconds
