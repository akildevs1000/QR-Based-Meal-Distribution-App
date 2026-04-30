<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class DeliveryNoteController extends Controller
{
    private const STATUSES = ['delivered', 'partial', 'rejected', 'pending'];

    public function index(Request $request): JsonResponse
    {
        $q = DeliveryNote::query()
            ->with(['site', 'supplier', 'mealRule', 'mealCategory.cuisine', 'receiver'])
            ->orderByDesc('delivery_date')
            ->orderByDesc('id');

        if ($siteId = $request->integer('site_id')) {
            $q->where('site_id', $siteId);
        }
        if ($supplierId = $request->integer('supplier_id')) {
            $q->where('supplier_id', $supplierId);
        }
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        if ($d = $request->string('date')->toString()) {
            $q->whereDate('delivery_date', $d);
        }
        if ($from = $request->string('from')->toString()) {
            $q->whereDate('delivery_date', '>=', $from);
        }
        if ($to = $request->string('to')->toString()) {
            $q->whereDate('delivery_date', '<=', $to);
        }

        return response()->json($q->paginate($request->integer('per_page', 25)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'delivery_date'      => ['required', 'date'],
            'delivery_time'      => ['nullable', 'date_format:H:i,H:i:s'],
            'site_id'            => ['required', 'integer', 'exists:sites,id'],
            'supplier_id'        => ['required', 'integer', 'exists:suppliers,id'],
            'meal_rule_id'       => ['required', 'integer', 'exists:meal_rules,id'],
            'meal_category_id'   => ['nullable', 'integer', 'exists:meal_categories,id'],
            'quantity_requested' => ['sometimes', 'integer', 'min:0'],
            'quantity_delivered' => ['required', 'integer', 'min:0'],
            'status'             => ['sometimes', 'string', Rule::in(self::STATUSES)],
            'notes'              => ['nullable', 'string', 'max:2000'],
            'attachment'         => ['nullable', 'file', 'max:10240'],
        ]);
        if ($request->hasFile('attachment')) {
            $data['attachment_path'] = $request->file('attachment')->store('delivery-notes', 'public');
        }
        unset($data['attachment']);
        $data['note_no'] = DeliveryNote::nextNoteNo();
        $data['received_by'] = $request->user()?->id;
        $note = DeliveryNote::create($data);
        return response()->json($note->load(['site', 'supplier', 'mealRule', 'mealCategory.cuisine', 'receiver']), 201);
    }

    public function show(DeliveryNote $deliveryNote): JsonResponse
    {
        return response()->json($deliveryNote->load(['site', 'supplier', 'mealRule', 'mealCategory.cuisine', 'receiver']));
    }

    public function update(Request $request, DeliveryNote $deliveryNote): JsonResponse
    {
        $data = $request->validate([
            'delivery_date'      => ['sometimes', 'date'],
            'delivery_time'      => ['sometimes', 'nullable', 'date_format:H:i,H:i:s'],
            'site_id'            => ['sometimes', 'integer', 'exists:sites,id'],
            'supplier_id'        => ['sometimes', 'integer', 'exists:suppliers,id'],
            'meal_rule_id'       => ['sometimes', 'integer', 'exists:meal_rules,id'],
            'meal_category_id'   => ['sometimes', 'nullable', 'integer', 'exists:meal_categories,id'],
            'quantity_requested' => ['sometimes', 'integer', 'min:0'],
            'quantity_delivered' => ['sometimes', 'integer', 'min:0'],
            'status'             => ['sometimes', 'string', Rule::in(self::STATUSES)],
            'notes'              => ['sometimes', 'nullable', 'string', 'max:2000'],
            'attachment'         => ['sometimes', 'nullable', 'file', 'max:10240'],
        ]);
        if ($request->hasFile('attachment')) {
            if ($deliveryNote->attachment_path) {
                Storage::disk('public')->delete($deliveryNote->attachment_path);
            }
            $data['attachment_path'] = $request->file('attachment')->store('delivery-notes', 'public');
        }
        unset($data['attachment']);
        $deliveryNote->update($data);
        return response()->json($deliveryNote->load(['site', 'supplier', 'mealRule', 'mealCategory.cuisine', 'receiver']));
    }

    public function destroy(DeliveryNote $deliveryNote): JsonResponse
    {
        if ($deliveryNote->attachment_path) {
            Storage::disk('public')->delete($deliveryNote->attachment_path);
        }
        $deliveryNote->delete();
        return response()->json(['ok' => true]);
    }
}
