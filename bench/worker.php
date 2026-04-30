<?php
// Worker process: bootstraps Laravel, calls ScanService::decide() N times,
// emits a JSON line summary on stdout.
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\ScanService;

$workerId = (int)($argv[1] ?? 0);
$ops = (int)($argv[2] ?? 100);
$poolSize = (int)($argv[3] ?? 200);

$svc = app(ScanService::class);

$timings = [];
$ok = 0; $errors = 0;
$started = microtime(true);

for ($i = 0; $i < $ops; $i++) {
    // Round-robin across the bench employee pool, offset by worker so
    // each worker writes to its own slice (less row-level contention,
    // simulates many distinct scanners).
    $idx = (($workerId * $ops) + $i) % $poolSize;
    $code = sprintf('BENCH-%05d', $idx + 1);

    $t0 = microtime(true);
    try {
        $res = $svc->decide($code, null, 'scanner', null);
        if (($res['status'] ?? null) === 'allowed') $ok++;
        else $errors++;
    } catch (\Throwable $e) {
        $errors++;
    }
    $timings[] = (microtime(true) - $t0) * 1000.0; // ms
}

$elapsed = microtime(true) - $started;
sort($timings);
$n = count($timings);
$pct = function ($p) use ($timings, $n) {
    if ($n === 0) return 0;
    $idx = (int)floor(($p / 100) * ($n - 1));
    return $timings[$idx];
};

echo json_encode([
    'worker' => $workerId,
    'ops' => $ops,
    'allowed' => $ok,
    'errors' => $errors,
    'elapsed_s' => round($elapsed, 4),
    'throughput_ops_s' => round($ops / max($elapsed, 0.0001), 1),
    'p50_ms' => round($pct(50), 2),
    'p95_ms' => round($pct(95), 2),
    'p99_ms' => round($pct(99), 2),
    'max_ms' => round(end($timings) ?: 0, 2),
]) . "\n";
