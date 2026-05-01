<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Heartbeat — proves the scheduler is alive. Look for "(cron)" lines in the
// app's log window every minute. Remove or move to a longer cadence once
// real scheduled tasks are in place.
Schedule::command('health:check')->everyMinute();
