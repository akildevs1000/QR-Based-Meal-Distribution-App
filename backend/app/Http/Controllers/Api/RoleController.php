<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Role::query()
            ->withCount(['permissions', 'users'])
            ->orderBy('name');

        if ($s = $request->string('q')->toString()) {
            $q->where('name', 'like', "%{$s}%");
        }

        return response()->json(['data' => $q->get()]);
    }

    public function show(Role $role): JsonResponse
    {
        $role->load('permissions:id,key,label,group');
        $role->loadCount('users');

        return response()->json([
            'id' => $role->id,
            'name' => $role->name,
            'description' => $role->description,
            'is_system' => $role->is_system,
            'users_count' => $role->users_count,
            'permissions' => $role->permissions,
            'permission_ids' => $role->permissions->pluck('id'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'           => ['required', 'string', 'max:120', 'unique:roles,name'],
            'description'    => ['nullable', 'string', 'max:255'],
            'permission_ids' => ['array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        $role = Role::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_system' => false,
        ]);

        $role->syncPermissions($data['permission_ids'] ?? []);

        return $this->show($role->fresh());
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        if ($role->is_system) {
            abort(403, 'System roles cannot be modified.');
        }

        $data = $request->validate([
            'name'           => ['sometimes', 'string', 'max:120', Rule::unique('roles', 'name')->ignore($role->id)],
            'description'    => ['sometimes', 'nullable', 'string', 'max:255'],
            'permission_ids' => ['sometimes', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        if (array_key_exists('name', $data)) {
            $role->name = $data['name'];
        }
        if (array_key_exists('description', $data)) {
            $role->description = $data['description'];
        }
        $role->save();

        if (array_key_exists('permission_ids', $data)) {
            $role->syncPermissions($data['permission_ids']);
        }

        return $this->show($role->fresh());
    }

    public function destroy(Role $role): JsonResponse
    {
        if ($role->is_system) {
            abort(403, 'System roles cannot be deleted.');
        }

        $assigned = $role->users()->count();
        if ($assigned > 0) {
            return response()->json([
                'message' => "Cannot delete this role: {$assigned} user(s) are still assigned to it. Reassign them first.",
            ], 422);
        }

        $role->delete();
        return response()->json(['ok' => true]);
    }
}
