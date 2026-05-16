<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\MealLog;
use App\Models\MealRule;
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DemoMealLogSeeder extends Seeder
{
    public function run(): void
    {
        $existing = MealLog::count();
        if ($existing > 0 && !env('FORCE_DEMO_LOGS', false)) {
            $this->command?->warn("meal_logs already has {$existing} rows. Set FORCE_DEMO_LOGS=1 to seed anyway.");
            return;
        }

        $employees = Employee::where('active', true)->get(['id', 'employee_code', 'site_id']);
        if ($employees->isEmpty()) {
            $this->command?->warn('No active employees — nothing to seed. Run the employee import first.');
            return;
        }

        $rules = MealRule::where('active', true)->orderBy('start_time')->get(['id', 'start_time', 'end_time']);
        if ($rules->isEmpty()) {
            $this->command?->warn('No active meal rules — nothing to seed.');
            return;
        }

        $supplierId    = Supplier::query()->value('id');
        $distributorId = User::query()->value('id');

        $deniedReasons = ['out_of_window', 'duplicate', 'not_eligible', 'unknown_code'];
        $sources       = ['qr', 'qr', 'qr', 'qr', 'manual']; // 80% qr / 20% manual
        $now           = Carbon::now();
        $today         = $now->copy()->startOfDay();

        $rows = [];

        // 7-day backfill: 6 historical days + today
        for ($daysAgo = 6; $daysAgo >= 0; $daysAgo--) {
            $day = $today->copy()->subDays($daysAgo);
            $isToday = $daysAgo === 0;

            foreach ($employees as $emp) {
                foreach ($rules as $rule) {
                    // 75% chance the employee shows up for this meal on this day
                    if (mt_rand(1, 100) > 75) {
                        continue;
                    }

                    [$startH, $startM] = explode(':', $rule->start_time);
                    [$endH,   $endM]   = explode(':', $rule->end_time);
                    $startSec = ((int) $startH) * 3600 + ((int) $startM) * 60;
                    $endSec   = ((int) $endH)   * 3600 + ((int) $endM)   * 60;
                    if ($endSec <= $startSec) {
                        $endSec = $startSec + 3600;
                    }
                    // Scan time clusters in the first 60% of the window (peak)
                    $bias    = $startSec + (int) (($endSec - $startSec) * (mt_rand(0, 60) / 100));
                    $jitter  = mt_rand(-300, 600);
                    $scanSec = max($startSec, min($endSec - 1, $bias + $jitter));

                    $scannedAt = $day->copy()->addSeconds($scanSec);

                    // Skip future scans (only matters for "today")
                    if ($isToday && $scannedAt->isFuture()) {
                        continue;
                    }

                    $isDenied = mt_rand(1, 100) <= 6; // ~6% denied
                    $result   = $isDenied ? 'denied' : 'allowed';
                    $reason   = $isDenied ? $deniedReasons[array_rand($deniedReasons)] : null;

                    $rows[] = [
                        'employee_id'    => $emp->id,
                        'scanned_code'   => $emp->employee_code,
                        'meal_rule_id'   => $rule->id,
                        'site_id'        => $emp->site_id,
                        'supplier_id'    => $supplierId,
                        'distributor_id' => $distributorId,
                        'meal_category_id' => null,
                        'source'         => $sources[array_rand($sources)],
                        'type'           => 'scan',
                        'result'         => $result,
                        'reason'         => $reason,
                        'scanned_at'     => $scannedAt->toDateTimeString(),
                        'created_at'     => $scannedAt->toDateTimeString(),
                        'updated_at'     => $scannedAt->toDateTimeString(),
                    ];
                }
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            MealLog::insert($chunk);
        }

        $this->command?->info(sprintf(
            'Inserted %d meal_log rows (%d employees × 7 days × %d rules).',
            count($rows),
            $employees->count(),
            $rules->count()
        ));
    }
}
