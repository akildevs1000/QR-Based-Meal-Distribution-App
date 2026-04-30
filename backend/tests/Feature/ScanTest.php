<?php

use App\Models\Employee;
use App\Models\MealLog;
use App\Models\MealRule;
use App\Services\ScanService;
use Illuminate\Support\Carbon;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    Carbon::setTestNow(Carbon::parse('2026-04-22 12:30:00'));
    MealRule::create([
        'name' => 'Lunch',
        'start_time' => '12:00:00',
        'end_time' => '14:30:00',
        'max_per_day' => 1,
        'active' => true,
    ]);
});

it('allows a registered employee in window', function () {
    Employee::create(['employee_code' => 'EMP-01', 'name' => 'Alice']);

    $res = app(ScanService::class)->decide('EMP-01');

    expect($res['status'])->toBe('allowed');
    expect($res['reason'])->toBeNull();
    expect(MealLog::where('result', 'allowed')->count())->toBe(1);
});

it('denies unknown codes as not_registered', function () {
    $res = app(ScanService::class)->decide('NOPE');

    expect($res['status'])->toBe('denied');
    expect($res['reason'])->toBe('not_registered');
    expect(MealLog::where('result', 'denied')->count())->toBe(1);
});

it('denies scans outside any meal window', function () {
    Carbon::setTestNow(Carbon::parse('2026-04-22 03:00:00'));
    Employee::create(['employee_code' => 'EMP-01', 'name' => 'Alice']);

    $res = app(ScanService::class)->decide('EMP-01');

    expect($res['status'])->toBe('denied');
    expect($res['reason'])->toBe('outside_allowed_time');
});

it('denies a second scan in the same session for a non-VIP', function () {
    Employee::create(['employee_code' => 'EMP-01', 'name' => 'Alice']);

    app(ScanService::class)->decide('EMP-01');
    $second = app(ScanService::class)->decide('EMP-01');

    expect($second['status'])->toBe('denied');
    expect($second['reason'])->toBe('already_received');
});

it('allows repeated scans for a VIP employee', function () {
    Employee::create(['employee_code' => 'VIP-01', 'name' => 'Evelyn', 'is_vip' => true]);

    app(ScanService::class)->decide('VIP-01');
    $second = app(ScanService::class)->decide('VIP-01');

    expect($second['status'])->toBe('allowed');
});

it('denies inactive employees', function () {
    Employee::create(['employee_code' => 'EMP-01', 'name' => 'Alice', 'active' => false]);

    $res = app(ScanService::class)->decide('EMP-01');

    expect($res['status'])->toBe('denied');
    expect($res['reason'])->toBe('inactive');
});
