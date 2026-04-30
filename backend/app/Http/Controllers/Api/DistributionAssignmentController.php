<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DistributionAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DistributionAssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = DistributionAssignment::query()
            ->with(['distributor', 'site', 'mealRule'])
            ->orderByDesc('start_date');
        if ($siteId = $request->integer('site_id')) {
            $q->where('site_id', $siteId);
        }
        if ($distId = $request->integer('distributor_id')) {
            $q->where('distributor_id', $distId);
        }
        if ($request->boolean('all')) {
            return response()->json(['data' => $q->get()]);
        }
        return response()->json($q->paginate($request->integer('per_page', 25)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);
        $row = DistributionAssignment::create($data);
        return response()->json($row->load(['distributor', 'site', 'mealRule']), 201);
    }

    public function show(DistributionAssignment $distributionAssignment): JsonResponse
    {
        return response()->json($distributionAssignment->load(['distributor', 'site', 'mealRule']));
    }

    public function update(Request $request, DistributionAssignment $distributionAssignment): JsonResponse
    {
        $data = $this->validateData($request, true);
        $distributionAssignment->update($data);
        return response()->json($distributionAssignment->load(['distributor', 'site', 'mealRule']));
    }

    public function destroy(DistributionAssignment $distributionAssignment): JsonResponse
    {
        $distributionAssignment->delete();
        return response()->json(['ok' => true]);
    }

    private function validateData(Request $request, bool $updating = false): array
    {
        $required = $updating ? 'sometimes' : 'required';
        return $request->validate([
            'distributor_id' => [$required, 'integer', 'exists:users,id'],
            'site_id'        => [$required, 'integer', 'exists:sites,id'],
            'meal_rule_id'   => [$required, 'integer', 'exists:meal_rules,id'],
            'start_date'     => [$required, 'date'],
            'end_date'       => ['nullable', 'date', 'after_or_equal:start_date'],
            'remarks'        => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
