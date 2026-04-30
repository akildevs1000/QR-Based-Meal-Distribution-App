<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $reports) {}

    public function catalog(): JsonResponse
    {
        $items = [];
        foreach (ReportService::REPORTS as $key => $meta) {
            $items[] = ['key' => $key, 'name' => $meta['name'], 'category' => $meta['category']];
        }
        return response()->json(['data' => $items]);
    }

    public function run(Request $request, string $key): JsonResponse|Response|StreamedResponse
    {
        abort_unless(isset(ReportService::REPORTS[$key]), 404, 'Unknown report');

        $data = $request->validate([
            'from'    => ['required', 'date'],
            'to'      => ['required', 'date', 'after_or_equal:from'],
            'format'  => ['sometimes', 'string', 'in:json,xlsx,pdf,csv'],
            'site_id' => ['sometimes', 'nullable', 'integer', 'exists:sites,id'],
        ]);

        $from = Carbon::parse($data['from']);
        $to   = Carbon::parse($data['to']);
        $format = $data['format'] ?? 'json';
        $opts   = ['site_id' => $data['site_id'] ?? null];

        $report = $this->reports->run($key, $from, $to, $opts);

        return match ($format) {
            'xlsx'  => $this->xlsx($key, $report),
            'pdf'   => $this->pdf($key, $report),
            'csv'   => $this->csv($key, $report),
            default => response()->json($report),
        };
    }

    private function xlsx(string $key, array $report): Response
    {
        $flat = $this->reports->flatten($key, $report);
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        // Excel disallows * ? : / \ [ ] in sheet titles
        $safeTitle = preg_replace('/[*?:\/\\\\\[\]]/', ' ', ReportService::REPORTS[$key]['name']);
        $sheet->setTitle(Str::limit($safeTitle, 30, ''));

        // Title block
        $sheet->setCellValue('A1', $report['title']);
        $sheet->mergeCells('A1:' . $this->colLetter(count($flat['headers'])) . '1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->setCellValue('A2', 'Period: ' . $report['period']);
        $sheet->mergeCells('A2:' . $this->colLetter(count($flat['headers'])) . '2');
        $sheet->getStyle('A2')->getFont()->setItalic(true)->setSize(10);

        // Headers
        $sheet->fromArray($flat['headers'], null, 'A4');
        $headerRange = 'A4:' . $this->colLetter(count($flat['headers'])) . '4';
        $sheet->getStyle($headerRange)->getFont()->setBold(true);
        $sheet->getStyle($headerRange)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('1E293B');
        $sheet->getStyle($headerRange)->getFont()->getColor()->setRGB('FFFFFF');
        $sheet->getStyle($headerRange)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Data rows
        if (count($flat['rows']) > 0) {
            $sheet->fromArray($flat['rows'], null, 'A5');
            $lastRow = 4 + count($flat['rows']);
            $dataRange = 'A5:' . $this->colLetter(count($flat['headers'])) . $lastRow;
            $sheet->getStyle($dataRange)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        }

        foreach (range('A', $this->colLetter(count($flat['headers']))) as $c) {
            $sheet->getColumnDimension($c)->setAutoSize(true);
        }

        $filename = $key . '-' . now()->format('Ymd-His') . '.xlsx';
        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0, must-revalidate',
        ]);
    }

    private function pdf(string $key, array $report): Response
    {
        $flat = $this->reports->flatten($key, $report);
        $pdf = Pdf::loadView('reports.table', [
            'title'   => $report['title'],
            'period'  => $report['period'],
            'headers' => $flat['headers'],
            'rows'    => $flat['rows'],
            'totals'  => $report['totals'] ?? [],
        ])->setPaper('a4', count($flat['headers']) > 6 ? 'landscape' : 'portrait');
        return $pdf->download($key . '-' . now()->format('Ymd-His') . '.pdf');
    }

    private function csv(string $key, array $report): StreamedResponse
    {
        $flat = $this->reports->flatten($key, $report);
        $filename = $key . '-' . now()->format('Ymd-His') . '.csv';
        return response()->streamDownload(function () use ($flat) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $flat['headers']);
            foreach ($flat['rows'] as $r) {
                fputcsv($out, $r);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    private function colLetter(int $n): string
    {
        $letter = '';
        while ($n > 0) {
            $mod = ($n - 1) % 26;
            $letter = chr(65 + $mod) . $letter;
            $n = intdiv($n - $mod, 26);
        }
        return $letter;
    }
}
