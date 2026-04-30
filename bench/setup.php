<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Employee;
use App\Models\MealRule;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

$count = (int)($argv[1] ?? 200);

// TRUNCATE differs across drivers — Eloquent's truncate() abstracts it.
\App\Models\MealLog::query()->delete();
echo "cleared meal_logs\n";

$existing = Employee::pluck('employee_code')->all();
$rows = [];
$now = Carbon::now()->toDateTimeString();
for ($i = 1; $i <= $count; $i++) {
    $code = sprintf('BENCH-%05d', $i);
    if (in_array($code, $existing, true)) continue;
    $rows[] = [
        'employee_code' => $code,
        'name' => "Bench Employee $i",
        'designation' => 'Tester',
        'meal_eligibility' => true,
        'duty_status' => 'on_duty',
        'grade' => 'L1',
        'active' => true,
        'is_vip' => false,
        'created_at' => $now,
        'updated_at' => $now,
    ];
}
if ($rows) {
    foreach (array_chunk($rows, 100) as $chunk) Employee::insert($chunk);
    echo "inserted " . count($rows) . " bench employees\n";
} else {
    echo "bench employees already exist\n";
}

// Force a permissive 24/7 BENCH_RULE so every scan is "allowed" (max_per_day high
// means concurrent inserts actually happen instead of short-circuiting at the
// daily-limit check).
MealRule::query()->where('name', '!=', 'BENCH_RULE')->update(['active' => false]);
MealRule::updateOrCreate(
    ['name' => 'BENCH_RULE'],
    [
        'start_time' => '00:00:00',
        'end_time' => '23:59:59',
        'max_per_day' => 999999,
        'active' => true,
    ]
);
echo "BENCH_RULE active (24/7, max_per_day=999999); other rules deactivated\n";

echo "ready\n";
