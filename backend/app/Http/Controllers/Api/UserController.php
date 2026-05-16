<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = User::query()
            ->with('assignedRole:id,name')
            ->orderBy('name');

        if ($s = $request->string('q')->toString()) {
            $q->where(function ($w) use ($s) {
                $w->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%");
            });
        }
        if ($roleId = $request->integer('role_id')) {
            $q->where('role_id', $roleId);
        }
        if ($request->boolean('all')) {
            return response()->json(['data' => $q->get()]);
        }
        return response()->json($q->paginate($request->integer('per_page', 25)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:191'],
            'email'    => ['required', 'email', 'max:191', 'unique:users,email', 'unique:supplier_users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role_id'  => ['required', 'integer', 'exists:roles,id'],
            'active'   => ['sometimes', 'boolean'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => User::ROLE_USER,
            'role_id' => $data['role_id'],
            'active' => $data['active'] ?? true,
        ]);

        $user->load('assignedRole:id,name');
        return response()->json($user, 201);
    }

    public function show(User $user): JsonResponse
    {
        $user->load('assignedRole:id,name');
        return response()->json($user);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        if ($user->isSuperAdmin()) {
            abort(403, 'The main administrator account cannot be modified here.');
        }

        $data = $request->validate([
            'name'     => ['sometimes', 'string', 'max:191'],
            'email'    => ['sometimes', 'email', 'max:191', Rule::unique('users', 'email')->ignore($user->id), 'unique:supplier_users,email'],
            'password' => ['sometimes', 'nullable', 'string', 'min:6'],
            'role_id'  => ['sometimes', 'integer', 'exists:roles,id'],
            'active'   => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('password', $data) && empty($data['password'])) {
            unset($data['password']);
        }

        // Never allow changing the legacy `role` string column from this endpoint.
        $user->fill($data);
        $user->role = User::ROLE_USER;
        $user->save();

        $user->load('assignedRole:id,name');
        return response()->json($user);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_if($request->user()?->id === $user->id, 422, 'You cannot delete your own account.');
        abort_if($user->isSuperAdmin(), 403, 'The main administrator account cannot be deleted.');
        $user->delete();
        return response()->json(['ok' => true]);
    }
}
