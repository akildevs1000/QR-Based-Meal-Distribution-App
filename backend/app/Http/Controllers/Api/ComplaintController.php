<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ComplaintController extends Controller
{
    private const STATUSES = ['open', 'in_review', 'resolved', 'escalated'];
    private const ISSUE_TYPES = ['Food Quality', 'Late Delivery', 'Wrong Items', 'Other'];

    public function index(Request $request): JsonResponse
    {
        $q = Complaint::query()
            ->with(['site', 'supplier', 'mealRule', 'logger'])
            ->orderByDesc('date_logged')
            ->orderByDesc('id');
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        if ($siteId = $request->integer('site_id')) {
            $q->where('site_id', $siteId);
        }
        if ($supplierId = $request->integer('supplier_id')) {
            $q->where('supplier_id', $supplierId);
        }
        if ($from = $request->string('from')->toString()) {
            $q->whereDate('date_logged', '>=', $from);
        }
        if ($to = $request->string('to')->toString()) {
            $q->whereDate('date_logged', '<=', $to);
        }
        return response()->json($q->paginate($request->integer('per_page', 25)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date_logged'   => ['required', 'date'],
            'site_id'       => ['nullable', 'integer', 'exists:sites,id'],
            'supplier_id'   => ['nullable', 'integer', 'exists:suppliers,id'],
            'meal_rule_id'  => ['nullable', 'integer', 'exists:meal_rules,id'],
            'issue_type'    => ['required', 'string', Rule::in(self::ISSUE_TYPES)],
            'description'   => ['required', 'string', 'max:5000'],
            'status'        => ['sometimes', 'string', Rule::in(self::STATUSES)],
            'remarks'       => ['nullable', 'string', 'max:2000'],
            'attachment'    => ['nullable', 'file', 'max:10240'],
        ]);
        if ($request->hasFile('attachment')) {
            $data['attachment_path'] = $request->file('attachment')->store('complaints', 'public');
        }
        unset($data['attachment']);
        $data['ref_no'] = Complaint::nextRefNo();
        $data['logged_by'] = $request->user()?->id;
        $complaint = Complaint::create($data);
        return response()->json($complaint->load(['site', 'supplier', 'mealRule', 'logger']), 201);
    }

    public function show(Complaint $complaint): JsonResponse
    {
        return response()->json($complaint->load(['site', 'supplier', 'mealRule', 'logger']));
    }

    public function update(Request $request, Complaint $complaint): JsonResponse
    {
        $data = $request->validate([
            'date_logged'   => ['sometimes', 'date'],
            'site_id'       => ['sometimes', 'nullable', 'integer', 'exists:sites,id'],
            'supplier_id'   => ['sometimes', 'nullable', 'integer', 'exists:suppliers,id'],
            'meal_rule_id'  => ['sometimes', 'nullable', 'integer', 'exists:meal_rules,id'],
            'issue_type'    => ['sometimes', 'string', Rule::in(self::ISSUE_TYPES)],
            'description'   => ['sometimes', 'string', 'max:5000'],
            'status'        => ['sometimes', 'string', Rule::in(self::STATUSES)],
            'date_resolved' => ['sometimes', 'nullable', 'date'],
            'remarks'       => ['sometimes', 'nullable', 'string', 'max:2000'],
            'attachment'    => ['sometimes', 'nullable', 'file', 'max:10240'],
        ]);
        if ($request->hasFile('attachment')) {
            if ($complaint->attachment_path) {
                Storage::disk('public')->delete($complaint->attachment_path);
            }
            $data['attachment_path'] = $request->file('attachment')->store('complaints', 'public');
        }
        unset($data['attachment']);
        if (($data['status'] ?? null) === 'resolved' && empty($complaint->date_resolved) && !array_key_exists('date_resolved', $data)) {
            $data['date_resolved'] = now()->toDateString();
        }
        $complaint->update($data);
        return response()->json($complaint->load(['site', 'supplier', 'mealRule', 'logger']));
    }

    public function destroy(Complaint $complaint): JsonResponse
    {
        if ($complaint->attachment_path) {
            Storage::disk('public')->delete($complaint->attachment_path);
        }
        $complaint->delete();
        return response()->json(['ok' => true]);
    }
}
