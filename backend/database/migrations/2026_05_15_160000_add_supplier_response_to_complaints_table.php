<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->text('supplier_response')->nullable()->after('remarks');
            $table->timestamp('supplier_responded_at')->nullable()->after('supplier_response');
        });
    }

    public function down(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->dropColumn(['supplier_response', 'supplier_responded_at']);
        });
    }
};
