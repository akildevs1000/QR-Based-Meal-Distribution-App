<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MealRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MealRuleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            MealRule::orderBy('start_time')->paginate($request->integer('per_page', 25))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $rule = MealRule::create($data);
        return response()->json($rule, 201);
    }

    public function show(MealRule $mealRule): JsonResponse
    {
        return response()->json($mealRule);
    }

    public function update(Request $request, MealRule $mealRule): JsonResponse
    {
        $data = $this->validated($request, updating: true);
        $mealRule->update($data);
        return response()->json($mealRule);
    }

    public function destroy(MealRule $mealRule): JsonResponse
    {
        $mealRule->delete();
        return response()->json(['ok' => true]);
    }

    private function validated(Request $request, bool $updating = false): array
    {
        $required = $updating ? 'sometimes' : 'required';
        return $request->validate([
            'name' => [$required, 'string', 'max:64'],
            'start_time' => [$required, 'date_format:H:i,H:i:s'],
            'end_time' => [$required, 'date_format:H:i,H:i:s', 'after:start_time'],
            'max_per_day' => ['sometimes', 'integer', 'min:1'],
            'active' => ['sometimes', 'boolean'],
        ]);
    }
}
