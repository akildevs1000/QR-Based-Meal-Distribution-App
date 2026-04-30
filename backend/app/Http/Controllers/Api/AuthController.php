<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $token = $user->createToken('admin')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
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
        $u->load('assignedRole.permissions:id,key');

        return response()->json([
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role,
            'role_id' => $u->role_id,
            'role_name' => $u->assignedRole?->name,
            'is_super_admin' => $u->isSuperAdmin(),
            'permissions' => $u->permissionKeys(),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $u = $request->user();
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
