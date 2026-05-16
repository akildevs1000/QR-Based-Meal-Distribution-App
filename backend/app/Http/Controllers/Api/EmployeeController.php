<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    private const DUTY_STATUSES = ['on_duty', 'allowance'];

    public function index(Request $request): JsonResponse
    {
        $q = Employee::query()->with('site')->orderBy('employee_code');
        if ($s = $request->string('q')->toString()) {
            $q->where(function ($w) use ($s) {
                $w->where('employee_code', 'like', "%{$s}%")
                  ->orWhere('name', 'like', "%{$s}%")
                  ->orWhere('employee_ref_id', 'like', "%{$s}%")
                  ->orWhere('company', 'like', "%{$s}%");
            });
        }
        if ($siteId = $request->integer('site_id')) {
            $q->where('site_id', $siteId);
        }
        if ($duty = $request->string('duty_status')->toString()) {
            $q->where('duty_status', $duty);
        }
        return response()->json($q->paginate($request->integer('per_page', 25)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_code'    => ['required', 'string', 'max:64', 'unique:employees,employee_code'],
            'employee_ref_id'  => ['nullable', 'string', 'max:64'],
            'company'          => ['nullable', 'string', 'max:191'],
            'name'             => ['required', 'string', 'max:191'],
            'designation'      => ['nullable', 'string', 'max:191'],
            'meal_eligibility' => ['sometimes', 'boolean'],
            'duty_status'      => ['sometimes', 'string', Rule::in(self::DUTY_STATUSES)],
            'date_of_joining'  => ['nullable', 'date'],
            'expiry_date'      => ['nullable', 'date'],
            'grade'            => ['nullable', 'string', 'max:64'],
            'site_id'          => ['nullable', 'integer', 'exists:sites,id'],
            'profile_picture'  => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'is_vip'           => ['boolean'],
            'active'           => ['boolean'],
        ]);
        if ($request->hasFile('profile_picture')) {
            $data['profile_picture'] = $request->file('profile_picture')->store('employees', 'public');
        }
        $employee = Employee::create($data);
        return response()->json($employee->load('site'), 201);
    }

    public function show(Employee $employee): JsonResponse
    {
        return response()->json($employee->load('site'));
    }

    public function update(Request $request, Employee $employee): JsonResponse
    {
        $data = $request->validate([
            'employee_code'    => ['sometimes', 'string', 'max:64', Rule::unique('employees', 'employee_code')->ignore($employee->id)],
            'employee_ref_id'  => ['sometimes', 'nullable', 'string', 'max:64'],
            'company'          => ['sometimes', 'nullable', 'string', 'max:191'],
            'name'             => ['sometimes', 'string', 'max:191'],
            'designation'      => ['sometimes', 'nullable', 'string', 'max:191'],
            'meal_eligibility' => ['sometimes', 'boolean'],
            'duty_status'      => ['sometimes', 'string', Rule::in(self::DUTY_STATUSES)],
            'date_of_joining'  => ['sometimes', 'nullable', 'date'],
            'expiry_date'      => ['sometimes', 'nullable', 'date'],
            'grade'            => ['sometimes', 'nullable', 'string', 'max:64'],
            'site_id'          => ['sometimes', 'nullable', 'integer', 'exists:sites,id'],
            'profile_picture'  => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'is_vip'           => ['sometimes', 'boolean'],
            'active'           => ['sometimes', 'boolean'],
        ]);
        if ($request->hasFile('profile_picture')) {
            $data['profile_picture'] = $request->file('profile_picture')->store('employees', 'public');
        }
        $employee->update($data);
        return response()->json($employee->load('site'));
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $employee->delete();
        return response()->json(['ok' => true]);
    }
}
