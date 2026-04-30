<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cuisine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CuisineController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Cuisine::query()->withCount('categories')->orderBy('name');
        if ($request->boolean('with_categories')) {
            $q->with(['categories' => fn ($c) => $c->orderBy('name')]);
        }
        if ($request->boolean('all')) {
            return response()->json(['data' => $q->get()]);
        }
        return response()->json($q->paginate($request->integer('per_page', 50)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'   => ['required', 'string', 'max:191', 'unique:cuisines,name'],
            'active' => ['sometimes', 'boolean'],
        ]);
        return response()->json(Cuisine::create($data), 201);
    }

    public function show(Cuisine $cuisine): JsonResponse
    {
        return response()->json($cuisine->load('categories'));
    }

    public function update(Request $request, Cuisine $cuisine): JsonResponse
    {
        $data = $request->validate([
            'name'   => ['sometimes', 'string', 'max:191', Rule::unique('cuisines', 'name')->ignore($cuisine->id)],
            'active' => ['sometimes', 'boolean'],
        ]);
        $cuisine->update($data);
        return response()->json($cuisine);
    }

    public function destroy(Cuisine $cuisine): JsonResponse
    {
        $cuisine->delete();
        return response()->json(['ok' => true]);
    }
}
