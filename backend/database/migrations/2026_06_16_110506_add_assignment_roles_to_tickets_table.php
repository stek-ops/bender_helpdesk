<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('co_executor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('observer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['co_executor_id']);
            $table->dropForeign(['observer_id']);
            $table->dropForeign(['reviewer_id']);
            $table->dropColumn(['co_executor_id', 'observer_id', 'reviewer_id']);
        });
    }
};
