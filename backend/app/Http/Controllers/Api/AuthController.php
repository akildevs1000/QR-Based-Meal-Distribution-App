<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupplierUser;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // 1. Try admin user
        $user = User::where('email', $credentials['email'])->first();
        if ($user && Hash::check($credentials['password'], $user->password)) {
            $token = $user->createToken('admin')->plainTextToken;
            return response()->json([
                'token' => $token,
                'type'  => 'admin',
                'user'  => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                ],
            ]);
        }

        // 2. Try supplier user
        $supplierUser = SupplierUser::with('supplier:id,supplier_code,name,status')
            ->where('email', $credentials['email'])
            ->first();
        if ($supplierUser && $supplierUser->active && Hash::check($credentials['password'], $supplierUser->password)) {
            if ($supplierUser->supplier && $supplierUser->supplier->status !== 'active') {
                throw ValidationException::withMessages([
                    'email' => ['This supplier account is inactive.'],
                ]);
            }
            $supplierUser->forceFill(['last_login_at' => now()])->save();
            $token = $supplierUser->createToken('supplier')->plainTextToken;
            return response()->json([
                'token'    => $token,
                'type'     => 'supplier',
                'user'     => [
                    'id'    => $supplierUser->id,
                    'name'  => $supplierUser->name,
                    'email' => $supplierUser->email,
                    'role'  => $supplierUser->role,
                ],
                'supplier' => $supplierUser->supplier
                    ? [
                        'id'            => $supplierUser->supplier->id,
                        'supplier_code' => $supplierUser->supplier->supplier_code,
                        'name'          => $supplierUser->supplier->name,
                    ]
                    : null,
            ]);
        }

        throw ValidationException::withMessages([
            'email' => ['Invalid credentials.'],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['ok' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        $u = $request->user();

        if ($u instanceof SupplierUser) {
            $u->loadMissing('supplier:id,supplier_code,name,status');
            return response()->json([
                'type'     => 'supplier',
                'id'       => $u->id,
                'name'     => $u->name,
                'email'    => $u->email,
                'role'     => $u->role,
                'supplier' => $u->supplier
                    ? [
                        'id'            => $u->supplier->id,
                        'supplier_code' => $u->supplier->supplier_code,
                        'name'          => $u->supplier->name,
                        'status'        => $u->supplier->status,
                    ]
                    : null,
            ]);
        }

        $u->load('assignedRole.permissions:id,key');

        return response()->json([
            'type'           => 'admin',
            'id'             => $u->id,
            'name'           => $u->name,
            'email'          => $u->email,
            'role'           => $u->role,
            'role_id'        => $u->role_id,
            'role_name'      => $u->assignedRole?->name,
            'is_super_admin' => $u->isSuperAdmin(),
            'permissions'    => $u->permissionKeys(),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $u = $request->user();
        abort_if(!($u instanceof User), 403);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:191'],
            'email' => ['sometimes', 'email', 'max:191', Rule::unique('users', 'email')->ignore($u->id)],
        ]);
        if (array_key_exists('name', $data)) {
            $u->name = $data['name'];
        }
        if (array_key_exists('email', $data)) {
            $u->email = $data['email'];
        }
        $u->save();
        return response()->json([
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $u = $request->user();
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        if (!Hash::check($data['current_password'], $u->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }
        $u->password = $data['password'];
        $u->save();
        return response()->json(['ok' => true]);
    }
}
