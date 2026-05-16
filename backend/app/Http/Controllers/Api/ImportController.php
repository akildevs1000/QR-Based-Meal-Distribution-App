<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Site;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class ImportController extends Controller
{
    public function employees(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
        ]);

        $path = $request->file('file')->getRealPath();
        try {
            $spreadsheet = IOFactory::load($path);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Could not read the file: '.$e->getMessage(),
            ], 422);
        }

        $sheet = $spreadsheet->getActiveSheet();
        $rows  = $sheet->toArray(null, true, true, true);
        if (empty($rows)) {
            return response()->json(['message' => 'The file is empty.'], 422);
        }

        $headerRow = array_shift($rows);
        $columns   = $this->mapColumns($headerRow);

        $required = ['employee_code', 'name'];
        foreach ($required as $key) {
            if (!isset($columns[$key])) {
                return response()->json([
                    'message' => "Missing required column: ".$this->prettyHeader($key)
                        .". Expected headers include LABOR_CODE and EMPNAME.",
                ], 422);
            }
        }

        $summary = [
            'employees_created' => 0,
            'employees_updated' => 0,
            'sites_created'     => 0,
            'sites_skipped'     => 0,
            'rows_skipped'      => 0,
            'errors'            => [],
        ];

        $sitesCache = [];

        DB::transaction(function () use ($rows, $columns, &$summary, &$sitesCache) {
            $rowNumber = 1;
            foreach ($rows as $row) {
                $rowNumber++;

                if ($this->isBlankRow($row)) {
                    continue;
                }

                $code = $this->cell($row, $columns, 'employee_code');
                $name = $this->cell($row, $columns, 'name');

                if (!$code || !$name) {
                    $summary['rows_skipped']++;
                    $summary['errors'][] = "Row {$rowNumber}: missing employee code or name — skipped.";
                    continue;
                }

                $siteId = null;
                $siteCode = $this->cell($row, $columns, 'site_code');
                if ($siteCode) {
                    $siteCode = trim($siteCode);
                    if (isset($sitesCache[$siteCode])) {
                        $siteId = $sitesCache[$siteCode];
                    } else {
                        $existing = Site::where('site_code', $siteCode)->first();
                        if ($existing) {
                            $siteId = $existing->id;
                            $summary['sites_skipped']++;
                        } else {
                            $siteName = $this->cell($row, $columns, 'site_name') ?: $siteCode;
                            $site = Site::create([
                                'site_code' => $siteCode,
                                'name'      => trim($siteName),
                                'type'      => 'camp',
                                'status'    => 'active',
                                'active'    => true,
                            ]);
                            $siteId = $site->id;
                            $summary['sites_created']++;
                        }
                        $sitesCache[$siteCode] = $siteId;
                    }
                }

                $refId = $this->cell($row, $columns, 'employee_ref_id');
                if ($refId !== null && !is_string($refId)) {
                    $refId = (string) $refId;
                }

                $attrs = [
                    'name'             => trim($name),
                    'employee_ref_id'  => $this->trimOrNull($refId),
                    'company'          => $this->trimOrNull($this->cell($row, $columns, 'company')),
                    'designation'      => $this->trimOrNull($this->cell($row, $columns, 'designation')),
                    'date_of_joining'  => $this->parseDate($this->cell($row, $columns, 'date_of_joining')),
                    'expiry_date'      => $this->parseDate($this->cell($row, $columns, 'expiry_date')),
                    'meal_eligibility' => $this->parseYesNo($this->cell($row, $columns, 'meal_eligibility'), true),
                    'active'           => $this->parseStatus($this->cell($row, $columns, 'status')),
                ];
                if ($siteId !== null) {
                    $attrs['site_id'] = $siteId;
                }

                $existing = Employee::where('employee_code', trim($code))->first();
                if ($existing) {
                    $existing->update($attrs);
                    $summary['employees_updated']++;
                } else {
                    Employee::create(array_merge(['employee_code' => trim($code)], $attrs));
                    $summary['employees_created']++;
                }
            }
        });

        return response()->json($summary);
    }

    private function mapColumns(array $headerRow): array
    {
        $aliases = [
            'employee_code'    => ['labor_code', 'employee_code', 'employee code', 'code'],
            'employee_ref_id'  => ['labor_id', 'labour_id', 'employee_ref_id', 'ref_id', 'reference_id'],
            'company'          => ['company', 'company_code', 'organisation', 'organization', 'org'],
            'name'             => ['empname', 'name', 'employee_name', 'employee name'],
            'designation'      => ['designaiton', 'designaition', 'designation', 'role', 'job_title'],
            'date_of_joining'  => ['date_of_joining', 'date of joining', 'doj', 'joining_date'],
            'expiry_date'      => ['efective_date', 'effective_date', 'effective date', 'expiry_date', 'expiry date', 'expiration_date', 'visa_expiry', 'id_expiry'],
            'site_code'        => ['campcode', 'camp_code', 'camp code', 'site_code', 'site code'],
            'site_name'        => ['camp_name', 'camp name', 'site_name', 'site name'],
            'meal_eligibility' => ['meals_eligibility', 'meal_eligibility', 'meal eligibility', 'eligible'],
            'status'           => ['status', 'employee_status', 'state'],
        ];

        $normalized = [];
        foreach ($headerRow as $col => $heading) {
            $normalized[$col] = strtolower(trim((string) $heading));
        }

        $mapping = [];
        foreach ($aliases as $key => $candidates) {
            foreach ($normalized as $col => $heading) {
                if (in_array($heading, $candidates, true)) {
                    $mapping[$key] = $col;
                    break;
                }
            }
        }
        return $mapping;
    }

    private function prettyHeader(string $key): string
    {
        $labels = [
            'employee_code' => 'LABOR_CODE',
            'name'          => 'EMPNAME',
        ];
        return $labels[$key] ?? $key;
    }

    private function cell(array $row, array $columns, string $key)
    {
        if (!isset($columns[$key])) {
            return null;
        }
        $col = $columns[$key];
        return $row[$col] ?? null;
    }

    private function isBlankRow(array $row): bool
    {
        foreach ($row as $v) {
            if ($v !== null && trim((string) $v) !== '') {
                return false;
            }
        }
        return true;
    }

    private function trimOrNull($v): ?string
    {
        if ($v === null) return null;
        $s = trim((string) $v);
        return $s === '' ? null : $s;
    }

    private function parseDate($v): ?string
    {
        if ($v === null || $v === '') return null;
        if (is_numeric($v)) {
            try {
                return ExcelDate::excelToDateTimeObject($v)->format('Y-m-d');
            } catch (\Throwable $e) {
                return null;
            }
        }
        try {
            return (new \DateTime((string) $v))->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function parseYesNo($v, bool $default): bool
    {
        if ($v === null) return $default;
        $s = strtolower(trim((string) $v));
        if (in_array($s, ['y', 'yes', 'true', '1'], true)) return true;
        if (in_array($s, ['n', 'no', 'false', '0'], true)) return false;
        return $default;
    }

    private function parseStatus($v): bool
    {
        if ($v === null) return true;
        return strtolower(trim((string) $v)) === 'active';
    }
}
