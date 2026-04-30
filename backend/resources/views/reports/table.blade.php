<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{{ $title }}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "DejaVu Sans", sans-serif; font-size: 10px; color: #0f172a; margin: 0; padding: 24px; }
  .header { margin-bottom: 16px; border-bottom: 2px solid #1e293b; padding-bottom: 10px; }
  .header h1 { margin: 0; font-size: 16px; color: #1e293b; letter-spacing: -0.01em; }
  .header .period { margin: 4px 0 0; font-size: 10px; color: #64748b; }
  .totals { margin-top: 8px; font-size: 9.5px; color: #475569; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  thead th { background: #1e293b; color: #fff; font-weight: 600; text-align: left; padding: 6px 8px; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.02em; }
  tbody td { border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 9.5px; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  .empty { text-align: center; color: #94a3b8; padding: 16px; font-style: italic; }
  .footer { margin-top: 24px; font-size: 8px; color: #94a3b8; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 6px; }
</style>
</head>
<body>
  <div class="header">
    <h1>{{ $title }}</h1>
    <div class="period">Period: {{ $period }}</div>
    @if(!empty($totals))
      <div class="totals">
        @foreach($totals as $k => $v)
          <strong>{{ ucfirst(str_replace('_', ' ', $k)) }}:</strong> {{ $v }}@if(!$loop->last) · @endif
        @endforeach
      </div>
    @endif
  </div>

  @if(count($rows) === 0)
    <div class="empty">No data for this period.</div>
  @else
    <table>
      <thead>
        <tr>
          @foreach($headers as $h)
            <th>{{ $h }}</th>
          @endforeach
        </tr>
      </thead>
      <tbody>
        @foreach($rows as $row)
          <tr>
            @foreach($row as $cell)
              <td>{{ $cell === null || $cell === '' ? '—' : $cell }}</td>
            @endforeach
          </tr>
        @endforeach
      </tbody>
    </table>
  @endif

  <div class="footer">Generated {{ now()->toDayDateTimeString() }}</div>
</body>
</html>
