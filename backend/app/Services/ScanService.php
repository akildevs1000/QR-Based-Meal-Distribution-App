<?php

namespace App\Services;

use App\Models\DistributionAssignment;
use App\Models\Employee;
use App\Models\MealLog;
use App\Models\MealRule;
use App\Models\SupplierMealAssignment;
use Illuminate\Support\Carbon;

class ScanService
{
    public const ALLOWED = 'allowed';
    public const DENIED = 'denied';
    public const ERROR = 'error';

    public const REASON_NOT_REGISTERED = 'not_registered';
    public const REASON_INACTIVE = 'inactive';
    public const REASON_NOT_ELIGIBLE = 'not_eligible';
    public const REASON_OUTSIDE_TIME = 'outside_allowed_time';
    public const REASON_ALREADY_RECEIVED = 'already_received';
    public const REASON_INVALID_QR = 'invalid_qr';
    public const REASON_WRONG_SITE = 'wrong_site';

    public function decide(
        ?string $code,
        ?int $scannerSiteId = null,
        string $source = 'scanner',
        ?int $distributorId = null
    ): array {
        $now = Carbon::now();
        $code = is_string($code) ? trim($code) : '';
        $ctx = ['site_id' => $scannerSiteId, 'source' => $source, 'distributor_id' => $distributorId];

        if ($code === '') {
            return $this->logAndReturn(null, null, $code, self::ERROR, self::REASON_INVALID_QR, $now, $ctx);
        }

        $employee = Employee::with('site')->where('employee_code', $code)->first();
        if (!$employee) {
            return $this->logAndReturn(null, null, $code, self::DENIED, self::REASON_NOT_REGISTERED, $now, $ctx);
        }

        if (!$employee->active) {
            return $this->logAndReturn($employee, null, $code, self::DENIED, self::REASON_INACTIVE, $now, $ctx);
        }

        if (!$employee->meal_eligibility) {
            return $this->logAndReturn($employee, null, $code, self::DENIED, self::REASON_NOT_ELIGIBLE, $now, $ctx);
        }

        if ($scannerSiteId && $employee->site_id && $employee->site_id !== $scannerSiteId) {
            return $this->logAndReturn($employee, null, $code, self::DENIED, self::REASON_WRONG_SITE, $now, $ctx);
        }

        $rule = $this->findActiveRule($now);
        if (!$rule) {
            return $this->logAndReturn($employee, null, $code, self::DENIED, self::REASON_OUTSIDE_TIME, $now, $ctx);
        }

        if (!$employee->is_vip) {
            $todayAllowed = MealLog::query()
                ->where('employee_id', $employee->id)
                ->where('meal_rule_id', $rule->id)
                ->where('result', self::ALLOWED)
                ->whereDate('scanned_at', $now->toDateString())
                ->count();

            if ($todayAllowed >= $rule->max_per_day) {
                return $this->logAndReturn($employee, $rule, $code, self::DENIED, self::REASON_ALREADY_RECEIVED, $now, $ctx);
            }
        }

        return $this->logAndReturn($employee, $rule, $code, self::ALLOWED, null, $now, $ctx);
    }

    private function findActiveRule(Carbon $now): ?MealRule
    {
        $current = $now->format('H:i:s');
        return MealRule::query()
            ->where('active', true)
            ->where('start_time', '<=', $current)
            ->where('end_time', '>=', $current)
            ->orderBy('start_time')
            ->first();
    }

    private function resolveSupplierId(?int $siteId, ?int $ruleId, Carbon $at): ?int
    {
        if (!$siteId || !$ruleId) return null;
        $a = SupplierMealAssignment::query()
            ->where('site_id', $siteId)
            ->where('meal_rule_id', $ruleId)
            ->where('start_date', '<=', $at->toDateString())
            ->where(function ($w) use ($at) {
                $w->whereNull('end_date')->orWhere('end_date', '>=', $at->toDateString());
            })
            ->orderByDesc('start_date')
            ->first();
        return $a?->supplier_id;
    }

    private function resolveDistributorId(?int $siteId, ?int $ruleId, Carbon $at): ?int
    {
        if (!$siteId || !$ruleId) return null;
        $a = DistributionAssignment::query()
            ->where('site_id', $siteId)
            ->where('meal_rule_id', $ruleId)
            ->where('start_date', '<=', $at->toDateString())
            ->where(function ($w) use ($at) {
                $w->whereNull('end_date')->orWhere('end_date', '>=', $at->toDateString());
            })
            ->orderByDesc('start_date')
            ->first();
        return $a?->distributor_id;
    }

    private function logAndReturn(
        ?Employee $employee,
        ?MealRule $rule,
        string $code,
        string $result,
        ?string $reason,
        Carbon $at,
        array $ctx = []
    ): array {
        $siteId = $ctx['site_id'] ?? null ?: $employee?->site_id;
        $source = $ctx['source'] ?? 'scanner';
        $type = $source === 'manual' ? 'manual' : 'issue';
        $supplierId = $result === self::ALLOWED ? $this->resolveSupplierId($siteId, $rule?->id, $at) : null;
        $distributorId = $ctx['distributor_id'] ?? null;
        if ($result === self::ALLOWED && !$distributorId) {
            $distributorId = $this->resolveDistributorId($siteId, $rule?->id, $at);
        }

        MealLog::create([
            'employee_id'     => $employee?->id,
            'scanned_code'    => $code,
            'meal_rule_id'    => $rule?->id,
            'site_id'         => $siteId,
            'supplier_id'     => $supplierId,
            'distributor_id'  => $distributorId,
            'source'          => $source,
            'type'            => $type,
            'result'          => $result,
            'reason'          => $reason,
            'scanned_at'      => $at,
        ]);

        return [
            'status' => $result,
            'reason' => $reason,
            'employee' => $employee ? [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'name' => $employee->name,
                'is_vip' => $employee->is_vip,
                'profile_picture' => $employee->profile_picture,
                'designation' => $employee->designation,
                'site' => $employee->site ? [
                    'id' => $employee->site->id,
                    'site_code' => $employee->site->site_code,
                    'name' => $employee->site->name,
                ] : null,
            ] : null,
            'session' => $rule ? [
                'id' => $rule->id,
                'name' => $rule->name,
            ] : null,
            'scanned_at' => $at->toIso8601String(),
        ];
    }
}
