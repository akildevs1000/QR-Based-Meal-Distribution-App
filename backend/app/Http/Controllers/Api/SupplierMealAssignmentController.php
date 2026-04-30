<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupplierMealAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierMealAssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = SupplierMealAssignment::query()
            ->with(['supplier', 'site', 'mealRule'])
            ->orderByDesc('start_date');
        if ($siteId = $request->integer('site_id')) {
            $q->where('site_id', $siteId);
        }
        if ($supplierId = $request->integer('supplier_id')) {
            $q->where('supplier_id', $supplierId);
        }
        if ($request->boolean('all')) {
            return response()->json(['data' => $q->get()]);
        }
        return response()->json($q->paginate($request->integer('per_page', 25)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);
        $row = SupplierMealAssignment::create($data);
        return response()->json($row->load(['supplier', 'site', 'mealRule']), 201);
    }

    public function show(SupplierMealAssignment $supplierMealAssignment): JsonResponse
    {
        return response()->json($supplierMealAssignment->load(['supplier', 'site', 'mealRule']));
    }

    public function update(Request $request, SupplierMealAssignment $supplierMealAssignment): JsonResponse
    {
        $data = $this->validateData($request, true);
        $supplierMealAssignment->update($data);
        return response()->json($supplierMealAssignment->load(['supplier', 'site', 'mealRule']));
    }

    public function destroy(SupplierMealAssignment $supplierMealAssignment): JsonResponse
    {
        $supplierMealAssignment->delete();
        return response()->json(['ok' => true]);
    }

    private function validateData(Request $request, bool $updating = false): array
    {
        $required = $updating ? 'sometimes' : 'required';
        return $request->validate([
            'supplier_id'  => [$required, 'integer', 'exists:suppliers,id'],
            'site_id'      => [$required, 'integer', 'exists:sites,id'],
            'meal_rule_id' => [$required, 'integer', 'exists:meal_rules,id'],
            'start_date'   => [$required, 'date'],
            'end_date'     => ['nullable', 'date', 'after_or_equal:start_date'],
            'remarks'      => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
