<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MealCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MealCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = MealCategory::query()->with('cuisine')->orderBy('name');
        if ($cid = $request->integer('cuisine_id')) {
            $q->where('cuisine_id', $cid);
        }
        if ($request->boolean('all')) {
            return response()->json(['data' => $q->get()]);
        }
        return response()->json($q->paginate($request->integer('per_page', 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'cuisine_id' => ['required', 'integer', 'exists:cuisines,id'],
            'name'       => ['required', 'string', 'max:191'],
            'active'     => ['sometimes', 'boolean'],
        ]);
        $exists = MealCategory::where('cuisine_id', $data['cuisine_id'])
            ->where('name', $data['name'])->exists();
        abort_if($exists, 422, 'A category with this name already exists for this cuisine.');
        return response()->json(MealCategory::create($data)->load('cuisine'), 201);
    }

    public function show(MealCategory $mealCategory): JsonResponse
    {
        return response()->json($mealCategory->load('cuisine'));
    }

    public function update(Request $request, MealCategory $mealCategory): JsonResponse
    {
        $data = $request->validate([
            'cuisine_id' => ['sometimes', 'integer', 'exists:cuisines,id'],
            'name'       => ['sometimes', 'string', 'max:191'],
            'active'     => ['sometimes', 'boolean'],
        ]);
        $mealCategory->update($data);
        return response()->json($mealCategory->load('cuisine'));
    }

    public function destroy(MealCategory $mealCategory): JsonResponse
    {
        $mealCategory->delete();
        return response()->json(['ok' => true]);
    }
}
