<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('meal_remarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();
            $table->foreignId('meal_rule_id')->nullable()->constrained('meal_rules')->nullOnDelete();
            $table->date('remark_date');
            $table->integer('meals_requested')->nullable();
            $table->text('remark');
            // polymorphic author
            $table->string('added_by_type', 32);   // 'admin' | 'supplier_user'
            $table->unsignedBigInteger('added_by_id');
            $table->string('added_by_name', 191);
            $table->timestamps();

            $table->index(['supplier_id', 'remark_date']);
            $table->index(['site_id', 'remark_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meal_remarks');
    }
};
