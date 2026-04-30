<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ScanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ScanController extends Controller
{
    public function __construct(private readonly ScanService $scans) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code'           => ['required', 'string', 'max:128'],
            'site_id'        => ['nullable', 'integer', 'exists:sites,id'],
            'source'         => ['nullable', 'string', Rule::in(['scanner', 'manual'])],
            'distributor_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $decision = $this->scans->decide(
            $data['code'],
            $data['site_id'] ?? null,
            $data['source'] ?? 'scanner',
            $data['distributor_id'] ?? null
        );

        return response()->json($decision);
    }
}
