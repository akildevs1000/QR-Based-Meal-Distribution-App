<?php

namespace Database\Seeders;

use App\Models\Complaint;
use App\Models\Cuisine;
use App\Models\DeliveryNote;
use App\Models\DistributionAssignment;
use App\Models\Employee;
use App\Models\FoodRequest;
use App\Models\MealCategory;
use App\Models\MealLog;
use App\Models\MealRule;
use App\Models\Site;
use App\Models\Supplier;
use App\Models\SupplierMealAssignment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // --- Permissions (must run first; admin & sub-users depend on the catalog) ---
        $this->call(PermissionSeeder::class);

        // --- Users ---
        // Main admin: super-admin marker (role='admin'), bypasses every permission check.
        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin', 'password' => 'password', 'role' => User::ROLE_ADMIN, 'active' => true]
        );
        // Operational accounts referenced by other seed data. They have no role_id by default —
        // the main admin assigns roles to them through the UI after seeding.
        $distributor = User::updateOrCreate(
            ['email' => 'distributor@example.com'],
            ['name' => 'Camp Boss', 'password' => 'password', 'role' => User::ROLE_USER, 'active' => true]
        );
        $timekeeper = User::updateOrCreate(
            ['email' => 'timekeeper@example.com'],
            ['name' => 'Timekeeper 1', 'password' => 'password', 'role' => User::ROLE_USER, 'active' => true]
        );
        $siteManager = User::updateOrCreate(
            ['email' => 'sitemanager@example.com'],
            ['name' => 'Site Manager', 'password' => 'password', 'role' => User::ROLE_USER, 'active' => true]
        );

        // --- Meal Rules (sessions) ---
        $rules = [
            ['name' => 'Breakfast', 'start_time' => '07:00:00', 'end_time' => '09:30:00', 'max_per_day' => 1, 'active' => true],
            ['name' => 'Lunch',     'start_time' => '12:00:00', 'end_time' => '14:30:00', 'max_per_day' => 1, 'active' => true],
            ['name' => 'Dinner',    'start_time' => '18:00:00', 'end_time' => '20:30:00', 'max_per_day' => 1, 'active' => true],
        ];
        foreach ($rules as $r) {
            MealRule::updateOrCreate(['name' => $r['name']], $r);
        }
        $ruleByName = MealRule::pluck('id', 'name');

        // --- Sites (with type + dates) ---
        $sites = [
            ['site_code' => 'DIP-1',  'name' => 'DIP-1 Rent Camp',       'type' => 'camp',    'status' => 'active',   'description' => 'Temporary camp',           'start_date' => '2025-09-01', 'end_date' => null],
            ['site_code' => 'P-121',  'name' => 'Project 121 - Metro',   'type' => 'site',    'status' => 'active',   'description' => null,                       'start_date' => '2025-08-01', 'end_date' => null],
            ['site_code' => 'P-101',  'name' => 'Project 101',           'type' => 'site',    'status' => 'finish',   'description' => 'finish',                   'start_date' => '2024-07-01', 'end_date' => '2025-08-31'],
            ['site_code' => 'HQ',     'name' => 'Headquarters',          'type' => 'site',    'status' => 'active',   'description' => 'Main corporate campus.',  'start_date' => null,         'end_date' => null],
        ];
        foreach ($sites as $s) {
            $site = Site::updateOrCreate(['site_code' => $s['site_code']], $s + ['active' => $s['status'] === 'active']);
            if (empty($site->getAttributes()['pin'])) {
                $site->forceFill(['pin' => Hash::make('0000')])->save();
            }
        }
        $siteByCode = Site::pluck('id', 'site_code');

        // --- Employees (beneficiaries) ---
        $employees = [
            ['employee_code' => 'INVOW03210', 'name' => 'Hymath Pasha',   'designation' => 'Watchman',         'date_of_joining' => '2022-01-01', 'grade' => 'L2', 'site_code' => 'DIP-1', 'meal_eligibility' => true,  'duty_status' => 'on_duty',   'is_vip' => false],
            ['employee_code' => 'INVOW03292', 'name' => 'Ranjeet Kumar',  'designation' => 'Helper',           'date_of_joining' => '2023-10-07', 'grade' => 'L1', 'site_code' => 'P-121', 'meal_eligibility' => false, 'duty_status' => 'allowance', 'is_vip' => false],
            ['employee_code' => 'EMP-00001',  'name' => 'Alice Kumar',    'designation' => 'Software Engineer','date_of_joining' => '2022-03-15', 'grade' => 'L2', 'site_code' => 'HQ',    'meal_eligibility' => true,  'duty_status' => 'on_duty',   'is_vip' => false],
            ['employee_code' => 'EMP-00002',  'name' => 'Brian Chen',     'designation' => 'QA Analyst',       'date_of_joining' => '2021-07-01', 'grade' => 'L2', 'site_code' => 'HQ',    'meal_eligibility' => true,  'duty_status' => 'on_duty',   'is_vip' => false],
            ['employee_code' => 'EMP-00005',  'name' => 'Evelyn Park',    'designation' => 'CTO',              'date_of_joining' => '2019-05-05', 'grade' => 'L5', 'site_code' => 'HQ',    'meal_eligibility' => true,  'duty_status' => 'on_duty',   'is_vip' => true],
        ];
        foreach ($employees as $e) {
            $siteId = $siteByCode[$e['site_code']] ?? null;
            unset($e['site_code']);
            Employee::updateOrCreate(['employee_code' => $e['employee_code']], $e + ['active' => true, 'site_id' => $siteId]);
        }

        // --- Cuisines + Meal Categories ---
        $catalog = [
            'North Indian'  => ['Veg Rice', 'Non-Veg Rice', 'Veg Chapati', 'Veg Roti', 'Non-Veg Chapati', 'Non-Veg Roti'],
            'South Indian'  => ['Veg Matta Rice', 'Non-Veg Matta Rice'],
            'Bangladeshi'   => ['Veg Rice', 'Non-Veg Rice'],
            'Pakistani'     => ['Non-Veg Rice', 'Veg Roti', 'Non-Veg Roti'],
            'Nepali'        => ['Veg Rice', 'Non-Veg Rice', 'Veg Chapati', 'Non-Veg Chapati'],
            'African'       => ['Mixed'],
        ];
        foreach ($catalog as $cuisineName => $categories) {
            $cuisine = Cuisine::updateOrCreate(['name' => $cuisineName], ['active' => true]);
            foreach ($categories as $catName) {
                MealCategory::updateOrCreate(
                    ['cuisine_id' => $cuisine->id, 'name' => $catName],
                    ['active' => true]
                );
            }
        }

        // --- Suppliers ---
        $suppliers = [
            ['supplier_code' => 'INVO01', 'name' => 'Innovo Build LLC', 'status' => 'active',   'start_date' => '2022-01-01', 'end_date' => null,         'contact_person' => 'Rep Sunil',      'contact_email' => 'sunil@innovo.example', 'contact_phone' => '+971-50-0000001'],
            ['supplier_code' => 'AMC01',  'name' => 'AMC Catering',     'status' => 'active',   'start_date' => '2023-06-01', 'end_date' => null,         'contact_person' => 'Ahmed',          'contact_email' => 'ops@amc.example',      'contact_phone' => '+971-50-0000002'],
            ['supplier_code' => 'DDC01',  'name' => 'DD Catering',      'status' => 'active',   'start_date' => '2024-01-01', 'end_date' => null,         'contact_person' => 'Devi',           'contact_email' => 'devi@dd.example',      'contact_phone' => '+971-50-0000003'],
            ['supplier_code' => 'SSC001', 'name' => 'SSCCCCC',          'status' => 'inactive', 'start_date' => '2023-01-01', 'end_date' => '2024-12-31', 'contact_person' => null,             'contact_email' => null,                   'contact_phone' => null],
        ];
        foreach ($suppliers as $s) {
            Supplier::updateOrCreate(['supplier_code' => $s['supplier_code']], $s);
        }
        $supplierByCode = Supplier::pluck('id', 'supplier_code');

        // Attach suppliers to sites (many-to-many)
        $amc = Supplier::where('supplier_code', 'AMC01')->first();
        $ddc = Supplier::where('supplier_code', 'DDC01')->first();
        $amc?->sites()->syncWithoutDetaching([$siteByCode['DIP-1'] ?? null, $siteByCode['HQ'] ?? null]);
        $ddc?->sites()->syncWithoutDetaching([$siteByCode['P-121'] ?? null]);

        // --- Supplier Meal Assignments ---
        if ($amc && isset($siteByCode['DIP-1'], $ruleByName['Breakfast'])) {
            SupplierMealAssignment::updateOrCreate(
                ['supplier_id' => $amc->id, 'site_id' => $siteByCode['DIP-1'], 'meal_rule_id' => $ruleByName['Breakfast'], 'start_date' => '2025-09-01'],
                ['end_date' => null, 'remarks' => 'Primary B/F supplier']
            );
        }
        if ($ddc && isset($siteByCode['P-121'], $ruleByName['Lunch'])) {
            SupplierMealAssignment::updateOrCreate(
                ['supplier_id' => $ddc->id, 'site_id' => $siteByCode['P-121'], 'meal_rule_id' => $ruleByName['Lunch'], 'start_date' => '2025-08-01'],
                ['end_date' => null, 'remarks' => 'Lunch only']
            );
        }

        // --- Distribution Assignments ---
        if (isset($siteByCode['DIP-1'], $ruleByName['Breakfast'])) {
            DistributionAssignment::updateOrCreate(
                ['distributor_id' => $distributor->id, 'site_id' => $siteByCode['DIP-1'], 'meal_rule_id' => $ruleByName['Breakfast'], 'start_date' => '2025-09-01'],
                ['end_date' => null, 'remarks' => 'Camp Boss distributes B/F']
            );
        }
        if (isset($siteByCode['P-121'], $ruleByName['Lunch'])) {
            DistributionAssignment::updateOrCreate(
                ['distributor_id' => $timekeeper->id, 'site_id' => $siteByCode['P-121'], 'meal_rule_id' => $ruleByName['Lunch'], 'start_date' => '2025-08-01'],
                ['end_date' => null, 'remarks' => 'Timekeeper handles lunch']
            );
        }

        // --- Food Requests (sample) ---
        if (isset($siteByCode['DIP-1'], $ruleByName['Lunch']) && $amc) {
            FoodRequest::updateOrCreate(
                ['request_date' => '2025-10-01', 'site_id' => $siteByCode['DIP-1'], 'supplier_id' => $amc->id, 'meal_rule_id' => $ruleByName['Lunch']],
                ['quantity' => 420, 'status' => 'submitted', 'remarks' => 'Same as yesterday', 'requested_by' => $timekeeper->id]
            );
        }
        if (isset($siteByCode['P-121'], $ruleByName['Lunch']) && $ddc) {
            FoodRequest::updateOrCreate(
                ['request_date' => '2025-10-01', 'site_id' => $siteByCode['P-121'], 'supplier_id' => $ddc->id, 'meal_rule_id' => $ruleByName['Lunch']],
                ['quantity' => 120, 'status' => 'submitted', 'remarks' => null, 'requested_by' => $timekeeper->id]
            );
        }

        // --- Delivery Notes (samples) ---
        if (isset($siteByCode['DIP-1'], $ruleByName['Breakfast']) && $amc) {
            DeliveryNote::updateOrCreate(
                ['note_no' => 'DN0001'],
                [
                    'delivery_date' => '2025-10-01', 'delivery_time' => '06:45:00',
                    'site_id' => $siteByCode['DIP-1'], 'supplier_id' => $amc->id,
                    'meal_rule_id' => $ruleByName['Breakfast'],
                    'quantity_requested' => 500, 'quantity_delivered' => 500,
                    'status' => 'delivered', 'received_by' => $distributor->id,
                    'notes' => 'Delivered on time',
                ]
            );
        }
        if (isset($siteByCode['P-121'], $ruleByName['Lunch']) && $ddc) {
            DeliveryNote::updateOrCreate(
                ['note_no' => 'DN0002'],
                [
                    'delivery_date' => '2025-10-01', 'delivery_time' => '12:15:00',
                    'site_id' => $siteByCode['P-121'], 'supplier_id' => $ddc->id,
                    'meal_rule_id' => $ruleByName['Lunch'],
                    'quantity_requested' => 120, 'quantity_delivered' => 115,
                    'status' => 'partial', 'received_by' => $timekeeper->id,
                    'notes' => 'Short by 5 portions — escalated',
                ]
            );
        }

        // --- Complaints (samples from spec) ---
        $today = Carbon::today()->toDateString();
        $complaints = [
            ['ref_no' => 'C001', 'date_logged' => '2025-09-02', 'site_code' => 'DIP-1', 'supplier_code' => 'AMC01', 'rule' => 'Lunch',  'issue_type' => 'Food Quality',    'description' => 'Food quality not good',       'status' => 'open',      'date_resolved' => null,         'remarks' => 'Escalated to Supplier'],
            ['ref_no' => 'C002', 'date_logged' => '2025-09-05', 'site_code' => 'P-121', 'supplier_code' => 'DDC01', 'rule' => 'Lunch',  'issue_type' => 'Late Delivery',   'description' => 'Late delivery',               'status' => 'resolved', 'date_resolved' => '2025-09-06', 'remarks' => 'Supplier apologized'],
            ['ref_no' => 'C003', 'date_logged' => '2025-09-10', 'site_code' => 'P-101', 'supplier_code' => 'INVO01','rule' => 'Dinner', 'issue_type' => 'Wrong Items',     'description' => 'Wrong meals delivered',       'status' => 'in_review','date_resolved' => null,         'remarks' => 'Investigating'],
            ['ref_no' => 'C004', 'date_logged' => $today,       'site_code' => 'P-121', 'supplier_code' => 'DDC01', 'rule' => 'Lunch',  'issue_type' => 'Late Delivery',   'description' => 'Delivery late by 20 minutes', 'status' => 'open',      'date_resolved' => null,         'remarks' => 'Called supplier'],
            ['ref_no' => 'C005', 'date_logged' => $today,       'site_code' => 'DIP-1', 'supplier_code' => 'AMC01', 'rule' => 'Lunch',  'issue_type' => 'Food Quality',    'description' => 'Rice undercooked',            'status' => 'in_review','date_resolved' => null,         'remarks' => 'Sample kept'],
        ];
        foreach ($complaints as $c) {
            Complaint::updateOrCreate(
                ['ref_no' => $c['ref_no']],
                [
                    'date_logged'   => $c['date_logged'],
                    'site_id'       => $siteByCode[$c['site_code']] ?? null,
                    'supplier_id'   => $supplierByCode[$c['supplier_code']] ?? null,
                    'meal_rule_id'  => $ruleByName[$c['rule']] ?? null,
                    'issue_type'    => $c['issue_type'],
                    'description'   => $c['description'],
                    'logged_by'     => $timekeeper->id,
                    'status'        => $c['status'],
                    'date_resolved' => $c['date_resolved'],
                    'remarks'       => $c['remarks'],
                ]
            );
        }

        // --- Transactions (meal_logs) for today + past 7 days ---
        $this->seedTransactions($ruleByName, $siteByCode, $supplierByCode, $distributor, $timekeeper);

        // --- Today's food requests (so Request Comparison has fresh data) ---
        $this->seedTodayFoodRequests($ruleByName, $siteByCode, $supplierByCode, $timekeeper);

        // --- Today's delivery notes ---
        $this->seedTodayDeliveryNotes($ruleByName, $siteByCode, $supplierByCode, $distributor, $timekeeper);

        $this->command->info('Seeded: admin@example.com / password (+ distributor, timekeeper, sitemanager)');
        $this->command->info('Seeded ' . MealLog::count() . ' meal logs across last 7 days');
    }

    /**
     * Seed realistic meal scan history.
     * Mix of allowed/denied across employees × rules × days, with site + supplier + distributor
     * populated to mirror what ScanService does at runtime.
     */
    private function seedTransactions(
        \Illuminate\Support\Collection $ruleByName,
        \Illuminate\Support\Collection $siteByCode,
        \Illuminate\Support\Collection $supplierByCode,
        User $distributor,
        User $timekeeper,
    ): void {
        if (MealLog::count() > 0) {
            return; // idempotent
        }

        $employees = Employee::all()->keyBy('employee_code');

        // (site_code, rule_name) → ['supplier' => code, 'distributor' => user_id]
        // Matches the assignments created earlier in this seeder.
        $assignments = [
            'DIP-1|Breakfast' => ['supplier' => 'AMC01',  'distributor' => $distributor->id],
            'DIP-1|Lunch'     => ['supplier' => 'AMC01',  'distributor' => $distributor->id],
            'DIP-1|Dinner'    => ['supplier' => 'AMC01',  'distributor' => $distributor->id],
            'P-121|Breakfast' => ['supplier' => 'DDC01',  'distributor' => $timekeeper->id],
            'P-121|Lunch'     => ['supplier' => 'DDC01',  'distributor' => $timekeeper->id],
            'P-121|Dinner'    => ['supplier' => 'DDC01',  'distributor' => $timekeeper->id],
            'HQ|Breakfast'    => ['supplier' => 'INVO01', 'distributor' => $distributor->id],
            'HQ|Lunch'        => ['supplier' => 'INVO01', 'distributor' => $distributor->id],
            'HQ|Dinner'       => ['supplier' => 'INVO01', 'distributor' => $distributor->id],
        ];

        $ruleTime = [
            'Breakfast' => '08:15:00',
            'Lunch'     => '12:45:00',
            'Dinner'    => '19:10:00',
        ];

        $rows = [];

        // Past 7 days + today, in chronological order
        for ($d = 6; $d >= 0; $d--) {
            $day = Carbon::today()->subDays($d);

            foreach (['Breakfast', 'Lunch', 'Dinner'] as $ruleName) {
                $ruleId = $ruleByName[$ruleName] ?? null;
                if (!$ruleId) continue;

                foreach ($employees as $emp) {
                    if (!$emp->site_id) continue;
                    if (!$emp->meal_eligibility) continue; // skip Ranjeet

                    $siteCode = $siteByCode->search($emp->site_id);
                    $key = $siteCode . '|' . $ruleName;
                    $assign = $assignments[$key] ?? null;
                    $supplierId = $assign ? ($supplierByCode[$assign['supplier']] ?? null) : null;
                    $distributorId = $assign['distributor'] ?? null;

                    // Drop ~20% of scans to make the data look natural
                    if (random_int(1, 100) <= 20) continue;

                    $scannedAt = $day->copy()->setTimeFromTimeString($ruleTime[$ruleName])
                        ->addMinutes(random_int(-20, 20));

                    $rows[] = [
                        'employee_id'    => $emp->id,
                        'scanned_code'   => $emp->employee_code,
                        'meal_rule_id'   => $ruleId,
                        'site_id'        => $emp->site_id,
                        'supplier_id'    => $supplierId,
                        'distributor_id' => $distributorId,
                        'meal_category_id' => null,
                        'source'         => 'scanner',
                        'type'           => 'issue',
                        'result'         => 'allowed',
                        'reason'         => null,
                        'scanned_at'     => $scannedAt,
                        'created_at'     => $scannedAt,
                        'updated_at'     => $scannedAt,
                    ];
                }
            }
        }

        // Add today "already_received" duplicates for a couple of employees
        $hymath = $employees['INVOW03210'] ?? null;
        if ($hymath && isset($ruleByName['Breakfast'])) {
            $when = Carbon::today()->setTimeFromTimeString('08:42:00');
            $rows[] = [
                'employee_id'    => $hymath->id,
                'scanned_code'   => $hymath->employee_code,
                'meal_rule_id'   => $ruleByName['Breakfast'],
                'site_id'        => $hymath->site_id,
                'supplier_id'    => $supplierByCode['AMC01'] ?? null,
                'distributor_id' => null,
                'meal_category_id' => null,
                'source'         => 'scanner',
                'type'           => 'issue',
                'result'         => 'denied',
                'reason'         => 'already_received',
                'scanned_at'     => $when,
                'created_at'     => $when,
                'updated_at'     => $when,
            ];
        }

        // Today "not_eligible" for Ranjeet
        $ranjeet = $employees['INVOW03292'] ?? null;
        if ($ranjeet && isset($ruleByName['Lunch'])) {
            $when = Carbon::today()->setTimeFromTimeString('12:15:00');
            $rows[] = [
                'employee_id'    => $ranjeet->id,
                'scanned_code'   => $ranjeet->employee_code,
                'meal_rule_id'   => null,
                'site_id'        => $ranjeet->site_id,
                'supplier_id'    => null,
                'distributor_id' => null,
                'meal_category_id' => null,
                'source'         => 'scanner',
                'type'           => 'issue',
                'result'         => 'denied',
                'reason'         => 'not_eligible',
                'scanned_at'     => $when,
                'created_at'     => $when,
                'updated_at'     => $when,
            ];
        }

        // Yesterday "wrong_site": Alice (HQ) scanned at DIP-1
        $alice = $employees['EMP-00001'] ?? null;
        if ($alice && isset($siteByCode['DIP-1'])) {
            $when = Carbon::yesterday()->setTimeFromTimeString('13:05:00');
            $rows[] = [
                'employee_id'    => $alice->id,
                'scanned_code'   => $alice->employee_code,
                'meal_rule_id'   => null,
                'site_id'        => $siteByCode['DIP-1'],
                'supplier_id'    => null,
                'distributor_id' => null,
                'meal_category_id' => null,
                'source'         => 'scanner',
                'type'           => 'issue',
                'result'         => 'denied',
                'reason'         => 'wrong_site',
                'scanned_at'     => $when,
                'created_at'     => $when,
                'updated_at'     => $when,
            ];
        }

        // One "not_registered" error today
        $when = Carbon::today()->setTimeFromTimeString('11:58:00');
        $rows[] = [
            'employee_id'    => null,
            'scanned_code'   => 'UNKNOWN-QR-0042',
            'meal_rule_id'   => null,
            'site_id'        => $siteByCode['P-121'] ?? null,
            'supplier_id'    => null,
            'distributor_id' => null,
            'meal_category_id' => null,
            'source'         => 'scanner',
            'type'           => 'issue',
            'result'         => 'denied',
            'reason'         => 'not_registered',
            'scanned_at'     => $when,
            'created_at'     => $when,
            'updated_at'     => $when,
        ];

        // Bulk insert in chunks to stay under SQLite's variable limit
        foreach (array_chunk($rows, 200) as $chunk) {
            DB::table('meal_logs')->insert($chunk);
        }
    }

    private function seedTodayFoodRequests(
        \Illuminate\Support\Collection $ruleByName,
        \Illuminate\Support\Collection $siteByCode,
        \Illuminate\Support\Collection $supplierByCode,
        User $timekeeper,
    ): void {
        $today = Carbon::today()->toDateString();
        $yesterday = Carbon::yesterday()->toDateString();

        $entries = [
            // Yesterday
            ['date' => $yesterday, 'site' => 'DIP-1', 'supplier' => 'AMC01',  'rule' => 'Breakfast', 'qty' => 480, 'remarks' => null],
            ['date' => $yesterday, 'site' => 'DIP-1', 'supplier' => 'AMC01',  'rule' => 'Lunch',     'qty' => 460, 'remarks' => '20 workers on leave'],
            ['date' => $yesterday, 'site' => 'DIP-1', 'supplier' => 'AMC01',  'rule' => 'Dinner',    'qty' => 440, 'remarks' => null],
            ['date' => $yesterday, 'site' => 'P-121', 'supplier' => 'DDC01',  'rule' => 'Lunch',     'qty' => 130, 'remarks' => null],
            ['date' => $yesterday, 'site' => 'HQ',    'supplier' => 'INVO01', 'rule' => 'Lunch',     'qty' => 50,  'remarks' => null],
            // Today (slight variance vs yesterday for the comparison report)
            ['date' => $today,     'site' => 'DIP-1', 'supplier' => 'AMC01',  'rule' => 'Breakfast', 'qty' => 500, 'remarks' => 'Overtime shift'],
            ['date' => $today,     'site' => 'DIP-1', 'supplier' => 'AMC01',  'rule' => 'Lunch',     'qty' => 455, 'remarks' => null],
            ['date' => $today,     'site' => 'DIP-1', 'supplier' => 'AMC01',  'rule' => 'Dinner',    'qty' => 440, 'remarks' => null],
            ['date' => $today,     'site' => 'P-121', 'supplier' => 'DDC01',  'rule' => 'Lunch',     'qty' => 115, 'remarks' => '15 on sick leave'],
            ['date' => $today,     'site' => 'HQ',    'supplier' => 'INVO01', 'rule' => 'Lunch',     'qty' => 52,  'remarks' => null],
        ];

        foreach ($entries as $e) {
            if (!isset($siteByCode[$e['site']], $ruleByName[$e['rule']])) continue;
            FoodRequest::updateOrCreate(
                [
                    'request_date' => $e['date'],
                    'site_id'      => $siteByCode[$e['site']],
                    'meal_rule_id' => $ruleByName[$e['rule']],
                    'supplier_id'  => $supplierByCode[$e['supplier']] ?? null,
                ],
                [
                    'quantity'     => $e['qty'],
                    'status'       => 'submitted',
                    'remarks'      => $e['remarks'],
                    'requested_by' => $timekeeper->id,
                ]
            );
        }
    }

    private function seedTodayDeliveryNotes(
        \Illuminate\Support\Collection $ruleByName,
        \Illuminate\Support\Collection $siteByCode,
        \Illuminate\Support\Collection $supplierByCode,
        User $distributor,
        User $timekeeper,
    ): void {
        $today = Carbon::today()->toDateString();

        $entries = [
            ['site' => 'DIP-1', 'supplier' => 'AMC01',  'rule' => 'Breakfast', 'time' => '06:55:00', 'req' => 500, 'del' => 500, 'status' => 'delivered', 'by' => $distributor->id, 'notes' => 'On time'],
            ['site' => 'DIP-1', 'supplier' => 'AMC01',  'rule' => 'Lunch',     'time' => '12:20:00', 'req' => 455, 'del' => 455, 'status' => 'delivered', 'by' => $distributor->id, 'notes' => null],
            ['site' => 'P-121', 'supplier' => 'DDC01',  'rule' => 'Lunch',     'time' => '12:30:00', 'req' => 115, 'del' => 110, 'status' => 'partial',   'by' => $timekeeper->id,  'notes' => 'Short by 5 portions'],
            ['site' => 'HQ',    'supplier' => 'INVO01', 'rule' => 'Lunch',     'time' => '13:00:00', 'req' => 52,  'del' => 52,  'status' => 'delivered', 'by' => $distributor->id, 'notes' => null],
        ];

        foreach ($entries as $e) {
            if (!isset($siteByCode[$e['site']], $ruleByName[$e['rule']], $supplierByCode[$e['supplier']])) continue;
            DeliveryNote::updateOrCreate(
                [
                    'delivery_date' => $today,
                    'site_id'       => $siteByCode[$e['site']],
                    'supplier_id'   => $supplierByCode[$e['supplier']],
                    'meal_rule_id'  => $ruleByName[$e['rule']],
                ],
                [
                    'note_no'            => DeliveryNote::nextNoteNo(),
                    'delivery_time'      => $e['time'],
                    'quantity_requested' => $e['req'],
                    'quantity_delivered' => $e['del'],
                    'status'             => $e['status'],
                    'received_by'        => $e['by'],
                    'notes'              => $e['notes'],
                ]
            );
        }
    }
}
