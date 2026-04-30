<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Supplier::query()->orderBy('supplier_code');
        if ($s = $request->string('q')->toString()) {
            $q->where(function ($w) use ($s) {
                $w->where('supplier_code', 'like', "%{$s}%")
                  ->orWhere('name', 'like', "%{$s}%");
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
            'supplier_code'   => ['required', 'string', 'max:64', 'unique:suppliers,supplier_code'],
            'name'            => ['required', 'string', 'max:191'],
            'status'          => ['sometimes', 'string', Rule::in(['active', 'inactive'])],
            'start_date'      => ['nullable', 'date'],
            'end_date'        => ['nullable', 'date', 'after_or_equal:start_date'],
            'contact_person'  => ['nullable', 'string', 'max:191'],
            'contact_email'   => ['nullable', 'email', 'max:191'],
            'contact_phone'   => ['nullable', 'string', 'max:64'],
            'address'         => ['nullable', 'string', 'max:2000'],
            'notes'           => ['nullable', 'string', 'max:2000'],
            'site_ids'        => ['sometimes', 'array'],
            'site_ids.*'      => ['integer', 'exists:sites,id'],
        ]);
        $siteIds = $data['site_ids'] ?? [];
        unset($data['site_ids']);
        $supplier = Supplier::create($data);
        if ($siteIds) {
            $supplier->sites()->sync($siteIds);
        }
        return response()->json($supplier->load(['sites', 'documents']), 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return response()->json($supplier->load(['sites', 'documents', 'mealAssignments.site', 'mealAssignments.mealRule']));
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $data = $request->validate([
            'supplier_code'   => ['sometimes', 'string', 'max:64', Rule::unique('suppliers', 'supplier_code')->ignore($supplier->id)],
            'name'            => ['sometimes', 'string', 'max:191'],
            'status'          => ['sometimes', 'string', Rule::in(['active', 'inactive'])],
            'start_date'      => ['sometimes', 'nullable', 'date'],
            'end_date'        => ['sometimes', 'nullable', 'date', 'after_or_equal:start_date'],
            'contact_person'  => ['sometimes', 'nullable', 'string', 'max:191'],
            'contact_email'   => ['sometimes', 'nullable', 'email', 'max:191'],
            'contact_phone'   => ['sometimes', 'nullable', 'string', 'max:64'],
            'address'         => ['sometimes', 'nullable', 'string', 'max:2000'],
            'notes'           => ['sometimes', 'nullable', 'string', 'max:2000'],
            'site_ids'        => ['sometimes', 'array'],
            'site_ids.*'      => ['integer', 'exists:sites,id'],
        ]);
        $siteIds = $data['site_ids'] ?? null;
        unset($data['site_ids']);
        $supplier->update($data);
        if ($siteIds !== null) {
            $supplier->sites()->sync($siteIds);
        }
        return response()->json($supplier->load(['sites', 'documents']));
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        foreach ($supplier->documents as $doc) {
            if ($doc->file_path) {
                Storage::disk('public')->delete($doc->file_path);
            }
        }
        $supplier->delete();
        return response()->json(['ok' => true]);
    }

    public function uploadDocument(Request $request, Supplier $supplier): JsonResponse
    {
        $data = $request->validate([
            'name'       => ['required', 'string', 'max:191'],
            'expires_at' => ['nullable', 'date'],
            'file'       => ['required', 'file', 'max:10240'],
        ]);
        $file = $request->file('file');
        $path = $file->store('supplier-documents', 'public');
        $doc = $supplier->documents()->create([
            'name'       => $data['name'],
            'file_path'  => $path,
            'mime_type'  => $file->getClientMimeType(),
            'size_bytes' => $file->getSize(),
            'expires_at' => $data['expires_at'] ?? null,
        ]);
        return response()->json($doc, 201);
    }

    public function deleteDocument(Supplier $supplier, SupplierDocument $document): JsonResponse
    {
        abort_if($document->supplier_id !== $supplier->id, 404);
        if ($document->file_path) {
            Storage::disk('public')->delete($document->file_path);
        }
        $document->delete();
        return response()->json(['ok' => true]);
    }
}
