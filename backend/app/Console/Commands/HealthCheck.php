<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class HealthCheck extends Command
{
    protected $signature = 'health:check';
    protected $description = 'Heartbeat command — emits a line every time the scheduler ticks. Used to verify the scheduler is alive.';

    public function handle(): int
    {
        $this->info('Health check OK at ' . now()->toIso8601String());
        return self::SUCCESS;
    }
}
