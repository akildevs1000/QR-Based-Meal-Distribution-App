<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('delivery_notes', function (Blueprint $table) {
            $table->id();
            $table->string('note_no')->unique();
            $table->date('delivery_date');
            $table->time('delivery_time')->nullable();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('meal_rule_id')->constrained()->cascadeOnDelete();
            $table->foreignId('meal_category_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('quantity_requested')->default(0);
            $table->unsignedInteger('quantity_delivered')->default(0);
            $table->string('status')->default('delivered');
            $table->string('attachment_path')->nullable();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['delivery_date', 'site_id', 'meal_rule_id']);
            $table->index(['supplier_id', 'delivery_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_notes');
    }
};
