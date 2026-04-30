<?php

// TEMPLATE — copy to backend/app/Http/Controllers/Api/<Resource>Controller.php
// Find/replace:
//   ResourceX  → Customer (or whatever)
//   resource_x → customers (table name)
//   resource-x → customers (URL kebab if multi-word)
// Adjust validation rules and search columns to match the real schema.

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResourceX;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ResourceXController extends Controller
{
    private const STATUSES = ['active', 'inactive'];

    public function index(Request $request): JsonResponse
    {
        $q = ResourceX::query()->orderBy('name');

        if ($s = $request->string('q')->toString()) {
            $q->where(function ($w) use ($s) {
                $w->where('name', 'like', "%{$s}%")
                  ->orWhere('code', 'like', "%{$s}%");
            });
        }
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }

        if ($request->boolean('all')) {
            return response()->json(['data' => $q->get()]);
        }
        return response()->json($q->paginate($request->integer('per_page', 25)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code'   => ['required', 'string', 'max:64', 'unique:resource_x,code'],
            'name'   => ['required', 'string', 'max:191'],
            'status' => ['sometimes', 'string', Rule::in(self::STATUSES)],
            'notes'  => ['nullable', 'string', 'max:2000'],
            'active' => ['boolean'],
        ]);
        return response()->json(ResourceX::create($data), 201);
    }

    public function show(ResourceX $resourceX): JsonResponse
    {
        return response()->json($resourceX);
    }

    public function update(Request $request, ResourceX $resourceX): JsonResponse
    {
        $data = $request->validate([
            'code'   => ['sometimes', 'string', 'max:64', Rule::unique('resource_x', 'code')->ignore($resourceX->id)],
            'name'   => ['sometimes', 'string', 'max:191'],
            'status' => ['sometimes', 'string', Rule::in(self::STATUSES)],
            'notes'  => ['sometimes', 'nullable', 'string', 'max:2000'],
            'active' => ['sometimes', 'boolean'],
        ]);
        $resourceX->update($data);
        return response()->json($resourceX->fresh());
    }

    public function destroy(ResourceX $resourceX): JsonResponse
    {
        $resourceX->delete();
        return response()->json(['ok' => true]);
    }
}
