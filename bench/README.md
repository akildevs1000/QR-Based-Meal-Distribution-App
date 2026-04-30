# Scan benchmark — how to run

Run all commands from the **project root** (`d:/projects/QR-Based-Meal-Distribution-App`), not from inside `bench/`.

## Step 1 — Seed bench data (do this once, or any time you want to reset)

```
php bench/setup.php 200
```

Creates 200 fake employees and a permissive meal rule for the test.

## Step 2 — Run the benchmark

Pick one of these depending on how heavy a test you want:

```
node bench/run.mjs                                       # default: 10 workers, 200 ops each
```

```
WORKERS=1  OPS=200 node bench/run.mjs                    # baseline
WORKERS=5  OPS=100 node bench/run.mjs                    # light
WORKERS=10 OPS=100 node bench/run.mjs                    # normal load
WORKERS=25 OPS=80  node bench/run.mjs                    # peak load
```

Each run prints one JSON block at the end. The numbers that matter:

- `throughput_ops_s` — scans per second (higher = better)
- `worker_p95_median_ms` — most scans finished within this many ms (lower = better)
- `errors` — should be 0

## Step 3 — Restore your real data when you're done

The bench replaces your real meal rules with a fake one, so before going back to normal work:

```
cd backend
php artisan migrate:fresh --seed
```

That's it. Don't worry about the rest.
