<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MealLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LogController extends Controller
{
    private const RELATIONS = [
        'employee:id,employee_code,name,profile_picture,site_id',
        'employee.site:id,site_code,name',
        'mealRule:id,name',
        'site:id,site_code,name',
        'supplier:id,supplier_code,name',
        'distributor:id,name,email,role',
    ];

    public function index(Request $request): JsonResponse
    {
        $q = $this->filtered($request)
            ->with(self::RELATIONS)
            ->orderByDesc('scanned_at');

        return response()->json($q->paginate($request->integer('per_page', 50)));
    }

    public function export(Request $request): StreamedResponse
    {
        $q = $this->filtered($request)
            ->with(self::RELATIONS)
            ->orderBy('scanned_at');

        $filename = 'meal-logs-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($q) {
            $out = fopen('php://output', 'w');
            fputcsv($out, [
                'scanned_at', 'employee_code', 'employee_name', 'meal_rule',
                'site', 'supplier', 'distributor', 'source', 'type',
                'result', 'reason', 'scanned_code',
            ]);
            $q->chunk(500, function ($chunk) use ($out) {
                foreach ($chunk as $log) {
                    fputcsv($out, [
                        $log->scanned_at?->toIso8601String(),
                        $log->employee?->employee_code,
                        $log->employee?->name,
                        $log->mealRule?->name,
                        $log->site?->site_code ?? $log->employee?->site?->site_code,
                        $log->supplier?->name,
                        $log->distributor?->name,
                        $log->source,
                        $log->type,
                        $log->result,
                        $log->reason,
                        $log->scanned_code,
                    ]);
                }
            });
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    private function filtered(Request $request)
    {
        $q = MealLog::query();

        if ($date = $request->string('date')->toString()) {
            $q->whereDate('scanned_at', $date);
        }
        if ($from = $request->string('from')->toString()) {
            $q->where('scanned_at', '>=', $from);
        }
        if ($to = $request->string('to')->toString()) {
            $q->where('scanned_at', '<=', $to);
        }
        if ($empId = $request->integer('employee_id')) {
            $q->where('employee_id', $empId);
        }
        if ($siteId = $request->integer('site_id')) {
            $q->where(function ($w) use ($siteId) {
                $w->where('site_id', $siteId)
                  ->orWhereHas('employee', fn ($e) => $e->where('site_id', $siteId));
            });
        }
        if ($supplierId = $request->integer('supplier_id')) {
            $q->where('supplier_id', $supplierId);
        }
        if ($source = $request->string('source')->toString()) {
            $q->where('source', $source);
        }
        if ($type = $request->string('type')->toString()) {
            $q->where('type', $type);
        }
        if ($result = $request->string('result')->toString()) {
            $q->where('result', $result);
        }

        return $q;
    }
}
