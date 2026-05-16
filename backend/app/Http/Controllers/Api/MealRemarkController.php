<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MealRemark;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MealRemarkController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = MealRemark::query()
            ->with(['supplier:id,supplier_code,name', 'site:id,site_code,name', 'mealRule:id,name'])
            ->orderByDesc('remark_date')
            ->orderByDesc('id');

        if ($from       = $request->string('from')->toString())     $q->whereDate('remark_date', '>=', $from);
        if ($to         = $request->string('to')->toString())       $q->whereDate('remark_date', '<=', $to);
        if ($supplierId = $request->integer('supplier_id'))         $q->where('supplier_id', $supplierId);
        if ($siteId     = $request->integer('site_id'))             $q->where('site_id', $siteId);
        if ($author     = $request->string('added_by_type')->toString()) $q->where('added_by_type', $author);

        return response()->json($q->paginate($request->integer('per_page', 25)));
    }

    public function store(Request $request): JsonResponse
    {
        $u = $request->user();

        $data = $request->validate([
            'supplier_id'     => ['required', 'integer', 'exists:suppliers,id'],
            'site_id'         => ['required', 'integer', 'exists:sites,id'],
            'meal_rule_id'    => ['nullable', 'integer', 'exists:meal_rules,id'],
            'remark_date'     => ['required', 'date'],
            'meals_requested' => ['nullable', 'integer', 'min:0'],
            'remark'          => ['required', 'string', 'max:5000'],
        ]);

        $remark = MealRemark::create([
            'supplier_id'      => $data['supplier_id'],
            'site_id'          => $data['site_id'],
            'meal_rule_id'     => $data['meal_rule_id'] ?? null,
            'remark_date'      => $data['remark_date'],
            'meals_requested'  => $data['meals_requested'] ?? null,
            'remark'           => $data['remark'],
            'added_by_type'    => MealRemark::AUTHOR_ADMIN,
            'added_by_id'      => $u->id,
            'added_by_name'    => 'Timekeeper - ' . $u->name,
        ]);

        $remark->load(['supplier:id,supplier_code,name', 'site:id,site_code,name', 'mealRule:id,name']);
        return response()->json($remark, 201);
    }

    public function destroy(MealRemark $mealRemark): JsonResponse
    {
        $mealRemark->delete();
        return response()->json(['ok' => true]);
    }
}
