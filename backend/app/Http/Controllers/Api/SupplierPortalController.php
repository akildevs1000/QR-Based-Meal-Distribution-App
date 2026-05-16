<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\DeliveryNote;
use App\Models\FoodRequest;
use App\Models\MealRemark;
use App\Models\SupplierMealAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SupplierPortalController extends Controller
{
    private function supplierId(Request $request): int
    {
        return (int) $request->user()->supplier_id;
    }

    public function dashboard(Request $request): JsonResponse
    {
        $supplierId = $this->supplierId($request);
        $today      = now()->toDateString();
        $weekStart  = now()->startOfWeek()->toDateString();
        $weekEnd    = now()->endOfWeek()->toDateString();

        $requestsToday = FoodRequest::where('supplier_id', $supplierId)
            ->whereDate('request_date', $today)
            ->sum('quantity');

        $deliveriesThisWeek = DeliveryNote::where('supplier_id', $supplierId)
            ->whereBetween('delivery_date', [$weekStart, $weekEnd])
            ->count();

        $openComplaints = Complaint::where('supplier_id', $supplierId)
            ->whereIn('status', ['open', 'in_review'])
            ->count();

        $activeAssignments = SupplierMealAssignment::where('supplier_id', $supplierId)
            ->where(function ($q) use ($today) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $today);
            })
            ->count();

        $recentRequests = FoodRequest::with(['site:id,site_code,name', 'mealRule:id,name'])
            ->where('supplier_id', $supplierId)
            ->orderByDesc('request_date')
            ->limit(5)
            ->get(['id', 'request_date', 'site_id', 'meal_rule_id', 'quantity', 'status']);

        $recentComplaints = Complaint::with(['site:id,site_code,name'])
            ->where('supplier_id', $supplierId)
            ->orderByDesc('date_logged')
            ->limit(5)
            ->get(['id', 'ref_no', 'date_logged', 'site_id', 'issue_type', 'status']);

        return response()->json([
            'kpis' => [
                'requests_today'       => (int) $requestsToday,
                'deliveries_this_week' => (int) $deliveriesThisWeek,
                'open_complaints'      => (int) $openComplaints,
                'active_assignments'   => (int) $activeAssignments,
            ],
            'recent_requests'   => $recentRequests,
            'recent_complaints' => $recentComplaints,
        ]);
    }

    public function foodRequests(Request $request): JsonResponse
    {
        $q = FoodRequest::with(['site:id,site_code,name', 'mealRule:id,name', 'mealCategory:id,name'])
            ->where('supplier_id', $this->supplierId($request))
            ->orderByDesc('request_date')
            ->orderByDesc('id');

        if ($from = $request->string('from')->toString()) $q->whereDate('request_date', '>=', $from);
        if ($to   = $request->string('to')->toString())   $q->whereDate('request_date', '<=', $to);
        if ($siteId = $request->integer('site_id'))       $q->where('site_id', $siteId);
        if ($status = $request->string('status')->toString()) $q->where('status', $status);

        return response()->json($q->paginate($request->integer('per_page', 25)));
    }

    public function deliveryNotes(Request $request): JsonResponse
    {
        $q = DeliveryNote::with(['site:id,site_code,name', 'mealRule:id,name', 'mealCategory:id,name'])
            ->where('supplier_id', $this->supplierId($request))
            ->orderByDesc('delivery_date')
            ->orderByDesc('id');

        if ($from = $request->string('from')->toString()) $q->whereDate('delivery_date', '>=', $from);
        if ($to   = $request->string('to')->toString())   $q->whereDate('delivery_date', '<=', $to);
        if ($siteId = $request->integer('site_id'))       $q->where('site_id', $siteId);
        if ($status = $request->string('status')->toString()) $q->where('status', $status);

        return response()->json($q->paginate($request->integer('per_page', 25)));
    }

    public function complaints(Request $request): JsonResponse
    {
        $q = Complaint::with(['site:id,site_code,name', 'mealRule:id,name'])
            ->where('supplier_id', $this->supplierId($request))
            ->orderByDesc('date_logged')
            ->orderByDesc('id');

        if ($from = $request->string('from')->toString()) $q->whereDate('date_logged', '>=', $from);
        if ($to   = $request->string('to')->toString())   $q->whereDate('date_logged', '<=', $to);
        if ($status = $request->string('status')->toString()) $q->where('status', $status);

        return response()->json($q->paginate($request->integer('per_page', 25)));
    }

    public function assignments(Request $request): JsonResponse
    {
        $assignments = SupplierMealAssignment::with(['site:id,site_code,name', 'mealRule:id,name'])
            ->where('supplier_id', $this->supplierId($request))
            ->orderBy('start_date')
            ->get();

        return response()->json(['data' => $assignments]);
    }

    public function sites(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->loadMissing('supplier.sites:id,site_code,name');
        return response()->json(['data' => $user->supplier?->sites ?? []]);
    }

    public function mealRules(Request $request): JsonResponse
    {
        $rules = \App\Models\MealRule::query()
            ->where('active', true)
            ->orderBy('start_time')
            ->get(['id', 'name', 'start_time', 'end_time']);
        return response()->json(['data' => $rules]);
    }

    public function profile(Request $request): JsonResponse
    {
        $u = $request->user();
        return response()->json([
            'id'    => $u->id,
            'name'  => $u->name,
            'email' => $u->email,
            'role'  => $u->role,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $u = $request->user();
        $data = $request->validate([
            'name'  => ['sometimes', 'string', 'max:191'],
            'email' => ['sometimes', 'email', 'max:191',
                Rule::unique('supplier_users', 'email')->ignore($u->id),
                'unique:users,email',
            ],
        ]);
        $u->fill($data)->save();
        return response()->json([
            'id'    => $u->id,
            'name'  => $u->name,
            'email' => $u->email,
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $u = $request->user();
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'string', 'min:8', 'confirmed'],
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

    // ── Write actions ───────────────────────────────────────────────────────

    public function confirmDelivery(Request $request, DeliveryNote $deliveryNote): JsonResponse
    {
        abort_if($deliveryNote->supplier_id !== $this->supplierId($request), 404);

        $data = $request->validate([
            'status'             => ['required', 'string', Rule::in(['delivered', 'partial', 'rejected', 'pending'])],
            'quantity_delivered' => ['nullable', 'integer', 'min:0'],
            'notes'              => ['nullable', 'string', 'max:2000'],
            'attachment'         => ['nullable', 'file', 'max:10240'],
        ]);

        if (in_array($data['status'], ['delivered', 'partial'], true) && empty($data['quantity_delivered']) && $data['quantity_delivered'] !== 0) {
            throw ValidationException::withMessages([
                'quantity_delivered' => ['Quantity delivered is required when status is delivered or partial.'],
            ]);
        }

        $deliveryNote->status             = $data['status'];
        if (array_key_exists('quantity_delivered', $data)) $deliveryNote->quantity_delivered = $data['quantity_delivered'];
        if (array_key_exists('notes', $data))              $deliveryNote->notes              = $data['notes'];

        if ($request->hasFile('attachment')) {
            if ($deliveryNote->attachment_path) {
                Storage::disk('public')->delete($deliveryNote->attachment_path);
            }
            $deliveryNote->attachment_path = $request->file('attachment')->store('delivery-notes', 'public');
        }

        $deliveryNote->save();
        $deliveryNote->load(['site:id,site_code,name', 'mealRule:id,name', 'mealCategory:id,name']);

        return response()->json($deliveryNote);
    }

    public function respondToComplaint(Request $request, Complaint $complaint): JsonResponse
    {
        abort_if($complaint->supplier_id !== $this->supplierId($request), 404);

        $data = $request->validate([
            'supplier_response' => ['required', 'string', 'max:5000'],
        ]);

        $complaint->supplier_response     = $data['supplier_response'];
        $complaint->supplier_responded_at = now();
        if ($complaint->status === 'open') {
            $complaint->status = 'in_review';
        }
        $complaint->save();
        $complaint->load(['site:id,site_code,name', 'mealRule:id,name']);

        return response()->json($complaint);
    }

    public function mealRemarks(Request $request): JsonResponse
    {
        $supplierId = $this->supplierId($request);
        $q = MealRemark::with(['site:id,site_code,name', 'mealRule:id,name'])
            ->where('supplier_id', $supplierId)
            ->orderByDesc('remark_date')
            ->orderByDesc('id');

        if ($from = $request->string('from')->toString()) $q->whereDate('remark_date', '>=', $from);
        if ($to   = $request->string('to')->toString())   $q->whereDate('remark_date', '<=', $to);
        if ($siteId = $request->integer('site_id'))       $q->where('site_id', $siteId);

        return response()->json($q->paginate($request->integer('per_page', 25)));
    }

    public function storeMealRemark(Request $request): JsonResponse
    {
        $supplierId = $this->supplierId($request);
        $u = $request->user();

        $data = $request->validate([
            'site_id'         => ['required', 'integer', 'exists:sites,id'],
            'meal_rule_id'    => ['nullable', 'integer', 'exists:meal_rules,id'],
            'remark_date'     => ['required', 'date'],
            'meals_requested' => ['nullable', 'integer', 'min:0'],
            'remark'          => ['required', 'string', 'max:5000'],
        ]);

        // Ensure the site belongs to this supplier
        $u->loadMissing('supplier.sites:id');
        $allowedSiteIds = ($u->supplier?->sites ?? collect())->pluck('id')->all();
        if (!in_array($data['site_id'], $allowedSiteIds, true)) {
            throw ValidationException::withMessages([
                'site_id' => ['You are not assigned to this site.'],
            ]);
        }

        $remark = MealRemark::create([
            'supplier_id'      => $supplierId,
            'site_id'          => $data['site_id'],
            'meal_rule_id'     => $data['meal_rule_id'] ?? null,
            'remark_date'      => $data['remark_date'],
            'meals_requested'  => $data['meals_requested'] ?? null,
            'remark'           => $data['remark'],
            'added_by_type'    => MealRemark::AUTHOR_SUPPLIER_USER,
            'added_by_id'      => $u->id,
            'added_by_name'    => 'Supplier - ' . $u->name,
        ]);

        $remark->load(['site:id,site_code,name', 'mealRule:id,name']);
        return response()->json($remark, 201);
    }

    public function destroyMealRemark(Request $request, MealRemark $mealRemark): JsonResponse
    {
        abort_if($mealRemark->supplier_id !== $this->supplierId($request), 404);
        // Only allow deletion of the user's own remarks
        $u = $request->user();
        if ($mealRemark->added_by_type !== MealRemark::AUTHOR_SUPPLIER_USER || (int) $mealRemark->added_by_id !== (int) $u->id) {
            abort(403, 'You can only delete your own remarks.');
        }
        $mealRemark->delete();
        return response()->json(['ok' => true]);
    }
}
