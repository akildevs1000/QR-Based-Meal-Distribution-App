<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->boolean('meal_eligibility')->default(true)->after('designation');
            $table->string('duty_status')->default('on_duty')->after('meal_eligibility');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['meal_eligibility', 'duty_status']);
        });
    }
};
