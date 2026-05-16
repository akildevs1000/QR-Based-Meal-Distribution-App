<?php

namespace App\Services;

use App\Models\Complaint;
use App\Models\DeliveryNote;
use App\Models\Employee;
use App\Models\FoodRequest;
use App\Models\MealLog;
use App\Models\MealRule;
use App\Models\Site;
use Carbon\CarbonPeriod;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ReportService
{
    public const REPORTS = [
        'daily-transaction'     => ['name' => 'Daily Transaction Report',    'category' => 'Transaction'],
        'by-supplier'           => ['name' => 'Reports by Supplier',         'category' => 'Supplier'],
        'by-location'           => ['name' => 'Reports by Location',         'category' => 'Location'],
        'duplicate-eligibility' => ['name' => 'Duplicate / Eligibility',     'category' => 'Eligibility'],
        'remarks'               => ['name' => 'Remarks / Comments',          'category' => 'Feedback'],
        'request-comparison'    => ['name' => 'Request Comparison',          'category' => 'Summary'],
        'delivery-notes'        => ['name' => 'Delivery Notes Report',       'category' => 'Delivery'],
        'complaints'            => ['name' => 'Complaint / Issue Report',    'category' => 'Complaint'],
    ];

    public function daily(Carbon $from, Carbon $to, ?int $siteId = null): array
    {
        $rules = MealRule::orderBy('start_time')->get();
        $q = MealLog::query()
            ->with(['employee.site', 'mealRule', 'site'])
            ->where('result', 'allowed')
            ->whereBetween('scanned_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]);
        if ($siteId) {
            $q->where(function ($w) use ($siteId) {
                $w->where('site_id', $siteId)->orWhereHas('employee', fn ($e) => $e->where('site_id', $siteId));
            });
        }
        $logs = $q->get();

        // Group by employee × rule
        $rows = $logs->groupBy('employee_id')->map(function ($group) use ($rules) {
            $first = $group->first();
            $emp = $first->employee;
            if (!$emp) return null;
            $byRule = [];
            $byRuleDetails = [];
            foreach ($rules as $r) {
                $items = $group->where('meal_rule_id', $r->id);
                if ($items->isEmpty()) {
                    $byRule[$r->name] = '—';
                    $byRuleDetails[$r->name] = null;
                    continue;
                }
                $sites = $items->pluck('site.site_code')->filter()->unique()->values();
                $sitesStr = $sites->implode(', ') ?: '✓';
                $scans = $items->pluck('scanned_at')
                    ->filter()
                    ->sort()
                    ->map(fn ($t) => $t->toIso8601String())
                    ->unique()
                    ->values()
                    ->all();
                $byRule[$r->name] = $sitesStr;
                $byRuleDetails[$r->name] = ['sites' => $sitesStr, 'scans' => $scans];
            }
            return [
                'employee_code'   => $emp->employee_code,
                'name'            => $emp->name,
                'profile_picture' => $emp->profile_picture,
                'site'            => $emp->site?->site_code ?? '—',
                'meals'           => $byRule,
                'meal_details'    => $byRuleDetails,
            ];
        })->filter()->values()->all();

        return [
            'title'   => 'Workers Daily Report',
            'period'  => $this->periodLabel($from, $to),
            'headers' => array_merge(['Site', 'Worker'], $rules->pluck('name')->all()),
            'rows'    => $rows,
            'rules'   => $rules->pluck('name')->values()->all(),
            'totals'  => [
                'employees' => count($rows),
                'meals'     => $logs->count(),
            ],
        ];
    }

    public function bySupplier(Carbon $from, Carbon $to): array
    {
        $rules = MealRule::orderBy('start_time')->get();
        $ruleNames = $rules->pluck('name')->all();
        $logs = MealLog::query()
            ->with(['supplier', 'site', 'mealRule'])
            ->where('result', 'allowed')
            ->whereBetween('scanned_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->get();

        $grouped = $logs->groupBy([
            fn ($l) => $l->supplier?->name ?? '— Unassigned —',
            fn ($l) => $l->site?->site_code ?? ($l->employee?->site?->site_code ?? '—'),
            fn ($l) => $l->scanned_at->toDateString(),
        ]);

        $rows = [];
        foreach ($grouped as $supplierName => $sites) {
            foreach ($sites as $siteCode => $dates) {
                foreach ($dates as $date => $items) {
                    $counts = array_fill_keys($ruleNames, 0);
                    foreach ($items as $l) {
                        $n = $l->mealRule?->name;
                        if ($n && isset($counts[$n])) $counts[$n]++;
                    }
                    $rows[] = [
                        'supplier' => $supplierName,
                        'site'     => $siteCode,
                        'date'     => $date,
                        'meals'    => $counts,
                        'total'    => array_sum($counts),
                    ];
                }
            }
        }
        usort($rows, fn ($a, $b) => [$a['supplier'], $a['site'], $a['date']] <=> [$b['supplier'], $b['site'], $b['date']]);

        return [
            'title'   => 'Site Meals by Supplier',
            'period'  => $this->periodLabel($from, $to),
            'headers' => array_merge(['Supplier', 'Site', 'Date'], $ruleNames, ['Total']),
            'rows'    => $rows,
            'rules'   => $ruleNames,
        ];
    }

    public function byLocation(Carbon $from, Carbon $to, ?int $siteId = null): array
    {
        $rules = MealRule::orderBy('start_time')->get();
        $ruleNames = $rules->pluck('name')->all();
        $q = MealLog::query()
            ->with(['site', 'employee.site', 'mealRule'])
            ->where('result', 'allowed')
            ->whereBetween('scanned_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]);
        if ($siteId) {
            $q->where(function ($w) use ($siteId) {
                $w->where('site_id', $siteId)->orWhereHas('employee', fn ($e) => $e->where('site_id', $siteId));
            });
        }
        $logs = $q->get();

        $grouped = $logs->groupBy([
            fn ($l) => $l->site?->site_code ?? $l->employee?->site?->site_code ?? '—',
            fn ($l) => $l->scanned_at->toDateString(),
        ]);

        $rows = [];
        foreach ($grouped as $site => $dates) {
            foreach ($dates as $date => $items) {
                $counts = array_fill_keys($ruleNames, 0);
                foreach ($items as $l) {
                    $n = $l->mealRule?->name;
                    if ($n && isset($counts[$n])) $counts[$n]++;
                }
                $rows[] = [
                    'site'  => $site,
                    'date'  => $date,
                    'meals' => $counts,
                    'total' => array_sum($counts),
                ];
            }
        }
        usort($rows, fn ($a, $b) => [$a['site'], $a['date']] <=> [$b['site'], $b['date']]);

        return [
            'title'   => 'Meal Distribution by Location',
            'period'  => $this->periodLabel($from, $to),
            'headers' => array_merge(['Site', 'Date'], $ruleNames, ['Total']),
            'rows'    => $rows,
            'rules'   => $ruleNames,
        ];
    }

    public function duplicateEligibility(Carbon $from, Carbon $to): array
    {
        $logs = MealLog::query()
            ->with(['employee.site', 'site', 'mealRule'])
            ->where('result', 'denied')
            ->whereIn('reason', ['already_received', 'not_eligible', 'inactive', 'wrong_site'])
            ->whereBetween('scanned_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->orderBy('scanned_at')
            ->get();

        $rows = $logs->map(function ($l) {
            $reasonMap = [
                'already_received' => 'Duplicate Scan',
                'not_eligible'     => 'Not Eligible',
                'inactive'         => 'Not Eligible',
                'wrong_site'       => 'Wrong Site',
            ];
            $reasonNote = [
                'already_received' => 'Already received this meal',
                'not_eligible'     => 'Meal eligibility disabled',
                'inactive'         => 'Account inactive',
                'wrong_site'       => 'Scanned at wrong site',
            ];
            return [
                'worker_id'       => $l->employee?->employee_code ?? $l->scanned_code,
                'name'            => $l->employee?->name,
                'profile_picture' => $l->employee?->profile_picture,
                'current_site'    => $l->employee?->site?->site_code ?? '—',
                'scan_site'       => $l->site?->site_code ?? '—',
                'result'          => $l->result,
                'status'          => strtoupper((string) $l->result),
                'reason'          => $reasonNote[$l->reason] ?? '',
                'meal_type'       => $l->mealRule?->name ?? '—',
                'date'            => $l->scanned_at->toDateString(),
                'time'            => $l->scanned_at->format('H:i:s'),
                'scanned_at'      => $l->scanned_at->toIso8601String(),
            ];
        })->values()->all();

        return [
            'title'   => 'Duplicate / Eligibility Report',
            'period'  => $this->periodLabel($from, $to),
            'headers' => ['Worker', 'Current / Actual', 'Site for scan', 'Status', 'Reason', 'Meal', 'When'],
            'rows'    => $rows,
            'totals'  => ['records' => count($rows)],
        ];
    }

    public function remarks(Carbon $from, Carbon $to): array
    {
        $start = $from->copy()->startOfDay();
        $end = $to->copy()->endOfDay();
        $foodRequests = FoodRequest::query()
            ->with(['site', 'supplier', 'mealRule', 'requester'])
            ->whereBetween('request_date', [$start, $end])
            ->whereNotNull('remarks')
            ->where('remarks', '!=', '')
            ->get();
        $complaints = Complaint::query()
            ->with(['site', 'supplier', 'mealRule', 'logger'])
            ->whereBetween('date_logged', [$start, $end])
            ->get();

        $rows = [];
        foreach ($foodRequests as $r) {
            $rows[] = [
                'date'       => $r->request_date?->toDateString(),
                'supplier'   => $r->supplier?->name ?? '—',
                'site'       => $r->site?->name ?? '—',
                'meal_type'  => $r->mealRule?->name ?? '—',
                'quantity'   => $r->quantity,
                'remarks'    => $r->remarks,
                'added_by'   => $r->requester?->name ?? '—',
                'source'     => 'Food Request',
            ];
        }
        foreach ($complaints as $c) {
            $rows[] = [
                'date'       => $c->date_logged?->toDateString(),
                'supplier'   => $c->supplier?->name ?? '—',
                'site'       => $c->site?->name ?? '—',
                'meal_type'  => $c->mealRule?->name ?? '—',
                'quantity'   => null,
                'remarks'    => $c->description . ($c->remarks ? " — {$c->remarks}" : ''),
                'added_by'   => $c->logger?->name ?? '—',
                'source'     => 'Complaint ' . $c->ref_no,
            ];
        }
        usort($rows, fn ($a, $b) => strcmp((string) $a['date'], (string) $b['date']));

        return [
            'title'   => 'Remarks / Comments Report',
            'period'  => $this->periodLabel($from, $to),
            'headers' => ['Date', 'Supplier', 'Site', 'Meal', 'Quantity', 'Remarks', 'Added By', 'Source'],
            'rows'    => $rows,
            'totals'  => ['entries' => count($rows)],
        ];
    }

    public function requestComparison(Carbon $from, Carbon $to): array
    {
        $start = $from->copy()->subDay()->startOfDay();
        $end = $to->copy()->endOfDay();
        $requests = FoodRequest::query()
            ->with(['site', 'supplier', 'mealRule'])
            ->whereBetween('request_date', [$start, $end])
            ->orderBy('request_date')
            ->get();

        // Index by (site, meal_rule, supplier, date)
        $index = [];
        foreach ($requests as $r) {
            $key = sprintf('%d|%d|%d|%s', $r->site_id ?? 0, $r->meal_rule_id ?? 0, $r->supplier_id ?? 0, $r->request_date?->toDateString());
            $index[$key] = $r;
        }

        $rows = [];
        foreach ($requests as $r) {
            $date = $r->request_date?->toDateString();
            if (!$date || $date < $from->toDateString() || $date > $to->toDateString()) continue;
            $prevDate = Carbon::parse($date)->subDay()->toDateString();
            $prevKey = sprintf('%d|%d|%d|%s', $r->site_id ?? 0, $r->meal_rule_id ?? 0, $r->supplier_id ?? 0, $prevDate);
            $prev = $index[$prevKey] ?? null;
            $prevQty = $prev?->quantity;
            $variance = $prevQty !== null ? ($r->quantity - $prevQty) : null;
            $pct = ($prevQty && $prevQty > 0) ? round(($variance / $prevQty) * 100, 1) : null;
            $rows[] = [
                'date'        => $date,
                'supplier'    => $r->supplier?->name ?? '—',
                'site'        => $r->site?->name ?? '—',
                'meal_type'   => $r->mealRule?->name ?? '—',
                'yesterday'   => $prevQty,
                'today'       => $r->quantity,
                'variance'    => $variance,
                'change_pct'  => $pct === null ? null : ($pct > 0 ? "+{$pct}%" : "{$pct}%"),
                'reason'      => $r->remarks,
            ];
        }

        return [
            'title'   => 'Request Comparison',
            'period'  => $this->periodLabel($from, $to),
            'headers' => ['Date', 'Supplier', 'Site', 'Meal', 'Yesterday', 'Today', 'Variance', '% Change', 'Reason'],
            'rows'    => $rows,
            'totals'  => ['rows' => count($rows)],
        ];
    }

    public function deliveryNotes(Carbon $from, Carbon $to, ?int $siteId = null): array
    {
        $q = DeliveryNote::query()
            ->with(['site', 'supplier', 'mealRule', 'receiver'])
            ->whereBetween('delivery_date', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->orderBy('delivery_date')
            ->orderBy('delivery_time');
        if ($siteId) {
            $q->where('site_id', $siteId);
        }
        $items = $q->get();

        $rows = $items->map(fn ($n) => [
            'note_no'            => $n->note_no,
            'date'               => $n->delivery_date?->toDateString(),
            'time'               => $n->delivery_time,
            'site'               => $n->site ? ($n->site->site_code . ' — ' . $n->site->name) : '—',
            'supplier'           => $n->supplier?->name ?? '—',
            'meal_type'          => $n->mealRule?->name ?? '—',
            'quantity_requested' => $n->quantity_requested,
            'quantity_delivered' => $n->quantity_delivered,
            'variance'           => $n->quantity_delivered - $n->quantity_requested,
            'status'             => strtoupper((string) $n->status),
            'received_by'        => $n->receiver?->name ?? '—',
            'notes'              => $n->notes ?? '—',
        ])->values()->all();

        return [
            'title'   => 'Delivery Notes Report',
            'period'  => $this->periodLabel($from, $to),
            'headers' => ['Note #', 'Date', 'Time', 'Site', 'Supplier', 'Meal', 'Requested', 'Delivered', 'Variance', 'Status', 'Received By', 'Notes'],
            'rows'    => $rows,
            'totals'  => [
                'notes'     => count($rows),
                'delivered' => $items->sum('quantity_delivered'),
            ],
        ];
    }

    public function complaints(Carbon $from, Carbon $to): array
    {
        $items = Complaint::query()
            ->with(['site', 'supplier', 'mealRule', 'logger'])
            ->whereBetween('date_logged', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->orderBy('date_logged')
            ->get();

        $rows = $items->map(fn ($c) => [
            'ref_no'        => $c->ref_no,
            'date_logged'   => $c->date_logged?->toDateString(),
            'site'          => $c->site ? ($c->site->site_code . ' — ' . $c->site->name) : '—',
            'supplier'      => $c->supplier?->name ?? '—',
            'meal_type'     => $c->mealRule?->name ?? '—',
            'issue_type'    => $c->issue_type,
            'description'   => $c->description,
            'logged_by'     => $c->logger?->name ?? '—',
            'status'        => strtoupper(str_replace('_', ' ', (string) $c->status)),
            'date_resolved' => $c->date_resolved?->toDateString() ?? '—',
            'remarks'       => $c->remarks ?? '—',
        ])->values()->all();

        return [
            'title'   => 'Complaint / Issue Report',
            'period'  => $this->periodLabel($from, $to),
            'headers' => ['Ref #', 'Logged', 'Site', 'Supplier', 'Meal', 'Issue', 'Description', 'Logged By', 'Status', 'Resolved', 'Remarks'],
            'rows'    => $rows,
            'totals'  => ['complaints' => count($rows)],
        ];
    }

    public function run(string $key, Carbon $from, Carbon $to, array $opts = []): array
    {
        $siteId = $opts['site_id'] ?? null;
        return match ($key) {
            'daily-transaction'     => $this->daily($from, $to, $siteId),
            'by-supplier'           => $this->bySupplier($from, $to),
            'by-location'           => $this->byLocation($from, $to, $siteId),
            'duplicate-eligibility' => $this->duplicateEligibility($from, $to),
            'remarks'               => $this->remarks($from, $to),
            'request-comparison'    => $this->requestComparison($from, $to),
            'delivery-notes'        => $this->deliveryNotes($from, $to, $siteId),
            'complaints'            => $this->complaints($from, $to),
            default                 => throw new \InvalidArgumentException("Unknown report: {$key}"),
        };
    }

    private function periodLabel(Carbon $from, Carbon $to): string
    {
        if ($from->isSameDay($to)) {
            return $from->format('D, M j, Y');
        }
        return $from->format('M j, Y') . ' → ' . $to->format('M j, Y');
    }

    /**
     * Flatten a report into a simple 2D array (headers + rows) for Excel/CSV export.
     */
    public function flatten(string $key, array $report): array
    {
        $headers = $report['headers'];
        $flat = [];

        foreach ($report['rows'] as $row) {
            $flat[] = match ($key) {
                'daily-transaction' => array_merge(
                    [$row['site'], trim(($row['employee_code'] ?? '') . ' — ' . ($row['name'] ?? ''), ' —')],
                    array_map(fn ($r) => $row['meals'][$r] ?? '', $report['rules']),
                ),
                'by-supplier' => array_merge(
                    [$row['supplier'], $row['site'], $row['date']],
                    array_map(fn ($r) => $row['meals'][$r] ?? 0, $report['rules']),
                    [$row['total']],
                ),
                'by-location' => array_merge(
                    [$row['site'], $row['date']],
                    array_map(fn ($r) => $row['meals'][$r] ?? 0, $report['rules']),
                    [$row['total']],
                ),
                'duplicate-eligibility' => [
                    trim(($row['worker_id'] ?? '') . ' — ' . ($row['name'] ?? ''), ' —'),
                    $row['current_site'], $row['scan_site'], $row['status'],
                    $row['reason'], $row['meal_type'],
                    trim(($row['date'] ?? '') . ' ' . ($row['time'] ?? '')),
                ],
                'remarks' => [
                    $row['date'], $row['supplier'], $row['site'], $row['meal_type'],
                    $row['quantity'], $row['remarks'], $row['added_by'], $row['source'],
                ],
                'request-comparison' => [
                    $row['date'], $row['supplier'], $row['site'], $row['meal_type'],
                    $row['yesterday'] ?? '—', $row['today'], $row['variance'] ?? '—',
                    $row['change_pct'] ?? '—', $row['reason'] ?? '—',
                ],
                'delivery-notes' => [
                    $row['note_no'], $row['date'], $row['time'], $row['site'], $row['supplier'],
                    $row['meal_type'], $row['quantity_requested'], $row['quantity_delivered'],
                    $row['variance'], $row['status'], $row['received_by'], $row['notes'],
                ],
                'complaints' => [
                    $row['ref_no'], $row['date_logged'], $row['site'], $row['supplier'],
                    $row['meal_type'], $row['issue_type'], $row['description'],
                    $row['logged_by'], $row['status'], $row['date_resolved'], $row['remarks'],
                ],
                default => array_values((array) $row),
            };
        }

        return ['headers' => $headers, 'rows' => $flat];
    }
}
