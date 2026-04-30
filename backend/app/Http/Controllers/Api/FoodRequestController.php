<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FoodRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FoodRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = FoodRequest::query()
            ->with(['site', 'supplier', 'mealRule', 'mealCategory.cuisine', 'requester'])
            ->orderByDesc('request_date')
            ->orderByDesc('id');
        if ($siteId = $request->integer('site_id')) {
            $q->where('site_id', $siteId);
        }
        if ($supplierId = $request->integer('supplier_id')) {
            $q->where('supplier_id', $supplierId);
        }
        if ($d = $request->string('date')->toString()) {
            $q->whereDate('request_date', $d);
        }
        if ($from = $request->string('from')->toString()) {
            $q->whereDate('request_date', '>=', $from);
        }
        if ($to = $request->string('to')->toString()) {
            $q->whereDate('request_date', '<=', $to);
        }
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        return response()->json($q->paginate($request->integer('per_page', 25)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);
        if (empty($data['requested_by']) && $request->user()) {
            $data['requested_by'] = $request->user()->id;
        }
        $row = FoodRequest::create($data);
        return response()->json($row->load(['site', 'supplier', 'mealRule', 'mealCategory.cuisine', 'requester']), 201);
    }

    public function show(FoodRequest $foodRequest): JsonResponse
    {
        return response()->json($foodRequest->load(['site', 'supplier', 'mealRule', 'mealCategory.cuisine', 'requester']));
    }

    public function update(Request $request, FoodRequest $foodRequest): JsonResponse
    {
        $data = $this->validateData($request, true);
        $foodRequest->update($data);
        return response()->json($foodRequest->load(['site', 'supplier', 'mealRule', 'mealCategory.cuisine', 'requester']));
    }

    public function destroy(FoodRequest $foodRequest): JsonResponse
    {
        $foodRequest->delete();
        return response()->json(['ok' => true]);
    }

    private function validateData(Request $request, bool $updating = false): array
    {
        $required = $updating ? 'sometimes' : 'required';
        return $request->validate([
            'request_date'     => [$required, 'date'],
            'site_id'          => [$required, 'integer', 'exists:sites,id'],
            'supplier_id'      => ['sometimes', 'nullable', 'integer', 'exists:suppliers,id'],
            'meal_rule_id'     => [$required, 'integer', 'exists:meal_rules,id'],
            'meal_category_id' => ['sometimes', 'nullable', 'integer', 'exists:meal_categories,id'],
            'quantity'         => [$required, 'integer', 'min:0'],
            'status'           => ['sometimes', 'string', Rule::in(['submitted', 'approved', 'delivered', 'cancelled'])],
            'remarks'          => ['sometimes', 'nullable', 'string', 'max:2000'],
            'requested_by'     => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
        ]);
    }
}
