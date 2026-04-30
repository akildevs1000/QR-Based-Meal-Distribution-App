<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('meal_logs', function (Blueprint $table) {
            $table->foreignId('site_id')->nullable()->after('meal_rule_id')->constrained()->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->after('site_id')->constrained()->nullOnDelete();
            $table->foreignId('distributor_id')->nullable()->after('supplier_id')->constrained('users')->nullOnDelete();
            $table->foreignId('meal_category_id')->nullable()->after('distributor_id')->constrained()->nullOnDelete();
            $table->string('source')->default('scanner')->after('meal_category_id');
            $table->string('type')->default('issue')->after('source');
        });
    }

    public function down(): void
    {
        Schema::table('meal_logs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('site_id');
            $table->dropConstrainedForeignId('supplier_id');
            $table->dropConstrainedForeignId('distributor_id');
            $table->dropConstrainedForeignId('meal_category_id');
            $table->dropColumn(['source', 'type']);
        });
    }
};
