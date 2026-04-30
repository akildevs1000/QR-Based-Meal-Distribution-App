<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;

class PermissionController extends Controller
{
    public function index(): JsonResponse
    {
        $permissions = Permission::query()
            ->orderBy('group')
            ->orderBy('sort')
            ->orderBy('id')
            ->get(['id', 'key', 'label', 'group']);

        $grouped = $permissions->groupBy('group')->map(function ($items, $group) {
            return [
                'group' => $group,
                'permissions' => $items->values(),
            ];
        })->values();

        return response()->json([
            'data' => $permissions,
            'grouped' => $grouped,
        ]);
    }
}
