<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    private const BRAND_KEYS = ['company_name', 'company_tagline'];

    public function index(): JsonResponse
    {
        return response()->json($this->payload());
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'company_tagline' => ['sometimes', 'nullable', 'string', 'max:160'],
        ]);
        foreach ($data as $k => $v) {
            AppSetting::set($k, $v);
        }
        return response()->json($this->payload());
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => ['required', 'file', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
        ]);

        $old = AppSetting::get('company_logo');
        if ($old && Storage::disk('public')->exists($old)) {
            Storage::disk('public')->delete($old);
        }

        $path = $request->file('logo')->store('branding', 'public');
        AppSetting::set('company_logo', $path);

        return response()->json($this->payload());
    }

    public function deleteLogo(): JsonResponse
    {
        $old = AppSetting::get('company_logo');
        if ($old && Storage::disk('public')->exists($old)) {
            Storage::disk('public')->delete($old);
        }
        AppSetting::set('company_logo', null);
        return response()->json($this->payload());
    }

    public function publicIndex(): JsonResponse
    {
        $p = $this->payload();
        return response()->json([
            'company_name' => $p['company_name'],
            'company_tagline' => $p['company_tagline'],
            'logo_url' => $p['logo_url'],
        ]);
    }

    private function payload(): array
    {
        $map = AppSetting::allAsMap();
        $logoPath = $map['company_logo'] ?? null;
        return [
            'company_name' => $map['company_name'] ?? null,
            'company_tagline' => $map['company_tagline'] ?? null,
            'logo_path' => $logoPath,
            'logo_url' => $logoPath ? url('storage/' . $logoPath) : null,
        ];
    }
}
