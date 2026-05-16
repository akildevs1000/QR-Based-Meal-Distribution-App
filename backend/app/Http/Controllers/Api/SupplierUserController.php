<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SupplierUserController extends Controller
{
    public function index(Supplier $supplier): JsonResponse
    {
        $users = $supplier->users()
            ->orderBy('name')
            ->get(['id', 'supplier_id', 'name', 'email', 'role', 'active', 'last_login_at', 'created_at']);

        return response()->json(['data' => $users]);
    }

    public function store(Request $request, Supplier $supplier): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:191'],
            'email'    => ['required', 'email', 'max:191', 'unique:users,email', 'unique:supplier_users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role'     => ['required', 'string', Rule::in(SupplierUser::ROLES)],
            'active'   => ['sometimes', 'boolean'],
        ]);

        $user = $supplier->users()->create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],
            'role'     => $data['role'],
            'active'   => $data['active'] ?? true,
        ]);

        return response()->json($user->only([
            'id', 'supplier_id', 'name', 'email', 'role', 'active', 'last_login_at', 'created_at',
        ]), 201);
    }

    public function update(Request $request, SupplierUser $supplierUser): JsonResponse
    {
        $data = $request->validate([
            'name'   => ['sometimes', 'string', 'max:191'],
            'email'  => ['sometimes', 'email', 'max:191',
                Rule::unique('supplier_users', 'email')->ignore($supplierUser->id),
                'unique:users,email',
            ],
            'role'   => ['sometimes', 'string', Rule::in(SupplierUser::ROLES)],
            'active' => ['sometimes', 'boolean'],
        ]);

        $supplierUser->fill($data)->save();

        return response()->json($supplierUser->only([
            'id', 'supplier_id', 'name', 'email', 'role', 'active', 'last_login_at', 'created_at',
        ]));
    }

    public function resetPassword(Request $request, SupplierUser $supplierUser): JsonResponse
    {
        $data = $request->validate([
            'password' => ['sometimes', 'string', 'min:8'],
        ]);

        $password = $data['password'] ?? Str::random(12);
        $supplierUser->password = $password;
        $supplierUser->save();

        // Invalidate all existing tokens for that user
        $supplierUser->tokens()->delete();

        return response()->json([
            'ok'       => true,
            'password' => $password,
        ]);
    }

    public function destroy(SupplierUser $supplierUser): JsonResponse
    {
        $supplierUser->tokens()->delete();
        $supplierUser->delete();
        return response()->json(['ok' => true]);
    }
}
