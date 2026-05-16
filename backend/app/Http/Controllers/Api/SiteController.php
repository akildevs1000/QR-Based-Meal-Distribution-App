<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\MealLog;
use App\Models\Site;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SiteController extends Controller
{
    private const TYPES = ['camp', 'site', 'project', 'other'];
    private const STATUSES = ['active', 'inactive', 'finish'];

    public function index(Request $request): JsonResponse
    {
        $q = Site::query()->orderBy('site_code');
        if ($s = $request->string('q')->toString()) {
            $q->where(function ($w) use ($s) {
                $w->where('site_code', 'like', "%{$s}%")
                  ->orWhere('name', 'like', "%{$s}%");
            });
        }
        if ($type = $request->string('type')->toString()) {
            $q->where('type', $type);
        }
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        if ($request->boolean('all')) {
            return response()->json(['data' => $this->decorate($q->get())]);
        }
        $page = $q->paginate($request->integer('per_page', 25));
        $page->setCollection($this->decorate($page->getCollection()));
        return response()->json($page);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'site_code'              => ['required', 'string', 'max:64', 'unique:sites,site_code'],
            'name'                   => ['required', 'string', 'max:191'],
            'type'                   => ['sometimes', 'string', Rule::in(self::TYPES)],
            'status'                 => ['sometimes', 'string', Rule::in(self::STATUSES)],
            'description'            => ['nullable', 'string', 'max:2000'],
            'start_date'             => ['nullable', 'date'],
            'end_date'               => ['nullable', 'date', 'after_or_equal:start_date'],
            'pin'                    => ['nullable', 'string', 'min:4', 'max:12', 'regex:/^\d+$/'],
            'active'                 => ['boolean'],
            'meal_quotas'            => ['sometimes', 'array'],
            'meal_quotas.*.meal_rule_id' => ['required_with:meal_quotas', 'integer', 'exists:meal_rules,id'],
            'meal_quotas.*.quantity'     => ['required_with:meal_quotas', 'integer', 'min:0'],
        ]);
        if (!empty($data['pin'])) {
            $data['pin'] = Hash::make($data['pin']);
        } else {
            unset($data['pin']);
        }
        if (array_key_exists('status', $data) && !array_key_exists('active', $data)) {
            $data['active'] = $data['status'] === 'active';
        }
        $quotas = $data['meal_quotas'] ?? null;
        unset($data['meal_quotas']);

        $site = DB::transaction(function () use ($data, $quotas) {
            $site = Site::create($data);
            if (is_array($quotas)) {
                $this->syncQuotas($site, $quotas);
            }
            return $site;
        });

        return response()->json($this->decorate(collect([$site->load('mealQuotas')]))->first(), 201);
    }

    public function show(Site $site): JsonResponse
    {
        $site->load([
            'supplierMealAssignments.supplier',
            'supplierMealAssignments.mealRule',
            'distributionAssignments.distributor',
            'distributionAssignments.mealRule',
            'suppliers',
            'mealQuotas.mealRule',
        ]);
        $arr = $site->toArray();
        $arr['has_pin'] = !empty($site->getAttributes()['pin']);
        return response()->json($arr);
    }

    public function update(Request $request, Site $site): JsonResponse
    {
        $data = $request->validate([
            'site_code'              => ['sometimes', 'string', 'max:64', Rule::unique('sites', 'site_code')->ignore($site->id)],
            'name'                   => ['sometimes', 'string', 'max:191'],
            'type'                   => ['sometimes', 'string', Rule::in(self::TYPES)],
            'status'                 => ['sometimes', 'string', Rule::in(self::STATUSES)],
            'description'            => ['sometimes', 'nullable', 'string', 'max:2000'],
            'start_date'             => ['sometimes', 'nullable', 'date'],
            'end_date'               => ['sometimes', 'nullable', 'date', 'after_or_equal:start_date'],
            'pin'                    => ['sometimes', 'nullable', 'string', 'min:4', 'max:12', 'regex:/^\d+$/'],
            'clear_pin'              => ['sometimes', 'boolean'],
            'active'                 => ['sometimes', 'boolean'],
            'meal_quotas'            => ['sometimes', 'array'],
            'meal_quotas.*.meal_rule_id' => ['required_with:meal_quotas', 'integer', 'exists:meal_rules,id'],
            'meal_quotas.*.quantity'     => ['required_with:meal_quotas', 'integer', 'min:0'],
        ]);
        if ($request->boolean('clear_pin')) {
            $data['pin'] = null;
        } elseif (!empty($data['pin'])) {
            $data['pin'] = Hash::make($data['pin']);
        } else {
            unset($data['pin']);
        }
        unset($data['clear_pin']);
        if (array_key_exists('status', $data) && !array_key_exists('active', $data)) {
            $data['active'] = $data['status'] === 'active';
        }
        $quotas = array_key_exists('meal_quotas', $data) ? $data['meal_quotas'] : null;
        unset($data['meal_quotas']);

        DB::transaction(function () use ($site, $data, $quotas) {
            $site->update($data);
            if (is_array($quotas)) {
                $this->syncQuotas($site, $quotas);
            }
        });

        return response()->json($this->decorate(collect([$site->fresh('mealQuotas')]))->first());
    }

    private function syncQuotas(Site $site, array $quotas): void
    {
        $keep = [];
        foreach ($quotas as $row) {
            $ruleId = (int) $row['meal_rule_id'];
            $qty = (int) $row['quantity'];
            if ($qty <= 0) {
                continue;
            }
            $site->mealQuotas()->updateOrCreate(
                ['meal_rule_id' => $ruleId],
                ['quantity' => $qty]
            );
            $keep[] = $ruleId;
        }
        $site->mealQuotas()
            ->when(!empty($keep), fn ($q) => $q->whereNotIn('meal_rule_id', $keep))
            ->delete();
    }

    public function destroy(Site $site): JsonResponse
    {
        $site->delete();
        return response()->json(['ok' => true]);
    }

    public function quotasSummary(Request $request): JsonResponse
    {
        $siteId = $request->integer('site_id') ?: null;
        $today = now()->toDateString();
        $tomorrow = now()->addDay()->toDateString();
        return response()->json([
            'today'    => $this->quotasFor($today, $siteId),
            'tomorrow' => $this->quotasFor($tomorrow, $siteId),
        ]);
    }

    private function quotasFor(string $date, ?int $siteId): array
    {
        $siteIds = Site::query()
            ->where('status', 'active')
            ->where(fn ($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', $date))
            ->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', $date))
            ->when($siteId, fn ($q) => $q->where('id', $siteId))
            ->pluck('id');

        $byRule = \App\Models\SiteMealQuota::query()
            ->whereIn('site_id', $siteIds)
            ->with('mealRule:id,name,start_time')
            ->get()
            ->groupBy('meal_rule_id')
            ->map(fn ($group) => [
                'meal_rule_id' => (int) $group->first()->meal_rule_id,
                'name'         => $group->first()->mealRule?->name,
                'start_time'   => $group->first()->mealRule?->start_time,
                'quantity'     => (int) $group->sum('quantity'),
            ])
            ->sortBy('start_time')
            ->values();

        return [
            'date'    => $date,
            'total'   => (int) $byRule->sum('quantity'),
            'by_rule' => $byRule,
        ];
    }

    public function publicStats(Site $site): JsonResponse
    {
        $today = now()->toDateString();

        $employees = Employee::where('site_id', $site->id)
            ->where('active', true)
            ->count();

        $mealQuotas = $site->mealQuotas()
            ->with('mealRule:id,name,start_time')
            ->get()
            ->map(fn ($q) => [
                'meal_rule_id' => (int) $q->meal_rule_id,
                'name'         => $q->mealRule?->name,
                'start_time'   => $q->mealRule?->start_time,
                'quantity'     => (int) $q->quantity,
            ])
            ->sortBy('start_time')
            ->values();

        $logs = MealLog::query()
            ->whereDate('scanned_at', $today)
            ->where(function ($w) use ($site) {
                $w->where('site_id', $site->id)
                  ->orWhereHas('employee', fn ($e) => $e->where('site_id', $site->id));
            });

        $served = (clone $logs)->where('result', 'allowed')->count();
        $denied = (clone $logs)->where('result', 'denied')->count();

        $servedEmployeeIds = (clone $logs)
            ->where('result', 'allowed')
            ->whereNotNull('employee_id')
            ->distinct()
            ->pluck('employee_id');

        $pending = Employee::where('site_id', $site->id)
            ->where('active', true)
            ->whereNotIn('id', $servedEmployeeIds)
            ->count();

        return response()->json([
            'employees'    => $employees,
            'served_today' => $served,
            'denied_today' => $denied,
            'pending'      => $pending,
            'meal_quotas'  => $mealQuotas,
        ]);
    }

    public function publicLogs(Request $request, Site $site): JsonResponse
    {
        $limit = (int) $request->integer('limit', 10);
        $limit = max(1, min(200, $limit));

        $logs = MealLog::query()
            ->where(function ($w) use ($site) {
                $w->where('site_id', $site->id)
                  ->orWhereHas('employee', fn ($e) => $e->where('site_id', $site->id));
            })
            ->with([
                'employee:id,employee_code,name,profile_picture,site_id',
                'mealRule:id,name',
            ])
            ->orderByDesc('scanned_at')
            ->limit($limit + 1)
            ->get();

        $hasMore = $logs->count() > $limit;
        if ($hasMore) {
            $logs = $logs->take($limit);
        }

        return response()->json([
            'data'     => $logs->values(),
            'has_more' => $hasMore,
        ]);
    }

    private function decorate($sites)
    {
        return $sites->map(function (Site $s) {
            if (!$s->relationLoaded('mealQuotas')) {
                $s->load('mealQuotas.mealRule');
            }
            $arr = $s->toArray();
            $arr['has_pin'] = !empty($s->getAttributes()['pin']);
            return $arr;
        });
    }
}
