<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('company')->nullable()->after('name');
            $table->string('employee_ref_id')->nullable()->after('employee_code');
            $table->index('employee_ref_id');
            $table->index('company');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex(['employee_ref_id']);
            $table->dropIndex(['company']);
            $table->dropColumn(['company', 'employee_ref_id']);
        });
    }
};
