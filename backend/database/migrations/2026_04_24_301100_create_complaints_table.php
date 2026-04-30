<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->string('ref_no')->unique();
            $table->date('date_logged');
            $table->foreignId('site_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('meal_rule_id')->nullable()->constrained()->nullOnDelete();
            $table->string('issue_type');
            $table->text('description');
            $table->string('attachment_path')->nullable();
            $table->foreignId('logged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('open');
            $table->date('date_resolved')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index(['status', 'date_logged']);
            $table->index(['site_id', 'date_logged']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};
