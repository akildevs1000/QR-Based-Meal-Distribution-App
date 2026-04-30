<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\MealLog;
use App\Models\Site;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            'site_code'   => ['required', 'string', 'max:64', 'unique:sites,site_code'],
            'name'        => ['required', 'string', 'max:191'],
            'type'        => ['sometimes', 'string', Rule::in(self::TYPES)],
            'status'      => ['sometimes', 'string', Rule::in(self::STATUSES)],
            'description' => ['nullable', 'string', 'max:2000'],
            'start_date'  => ['nullable', 'date'],
            'end_date'    => ['nullable', 'date', 'after_or_equal:start_date'],
            'pin'         => ['nullable', 'string', 'min:4', 'max:12', 'regex:/^\d+$/'],
            'active'      => ['boolean'],
        ]);
        if (!empty($data['pin'])) {
            $data['pin'] = Hash::make($data['pin']);
        } else {
            unset($data['pin']);
        }
        if (array_key_exists('status', $data) && !array_key_exists('active', $data)) {
            $data['active'] = $data['status'] === 'active';
        }
        $site = Site::create($data);
        return response()->json($this->decorate(collect([$site]))->first(), 201);
    }

    public function show(Site $site): JsonResponse
    {
        $site->load([
            'supplierMealAssignments.supplier',
            'supplierMealAssignments.mealRule',
            'distributionAssignments.distributor',
            'distributionAssignments.mealRule',
            'suppliers',
        ]);
        $arr = $site->toArray();
        $arr['has_pin'] = !empty($site->getAttributes()['pin']);
        return response()->json($arr);
    }

    public function update(Request $request, Site $site): JsonResponse
    {
        $data = $request->validate([
            'site_code'   => ['sometimes', 'string', 'max:64', Rule::unique('sites', 'site_code')->ignore($site->id)],
            'name'        => ['sometimes', 'string', 'max:191'],
            'type'        => ['sometimes', 'string', Rule::in(self::TYPES)],
            'status'      => ['sometimes', 'string', Rule::in(self::STATUSES)],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'start_date'  => ['sometimes', 'nullable', 'date'],
            'end_date'    => ['sometimes', 'nullable', 'date', 'after_or_equal:start_date'],
            'pin'         => ['sometimes', 'nullable', 'string', 'min:4', 'max:12', 'regex:/^\d+$/'],
            'clear_pin'   => ['sometimes', 'boolean'],
            'active'      => ['sometimes', 'boolean'],
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
        $site->update($data);
        return response()->json($this->decorate(collect([$site->fresh()]))->first());
    }

    public function destroy(Site $site): JsonResponse
    {
        $site->delete();
        return response()->json(['ok' => true]);
    }

    public function publicStats(Site $site): JsonResponse
    {
        $today = now()->toDateString();

        $employees = Employee::where('site_id', $site->id)
            ->where('active', true)
            ->count();

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
            $arr = $s->toArray();
            $arr['has_pin'] = !empty($s->getAttributes()['pin']);
            return $arr;
        });
    }
}
