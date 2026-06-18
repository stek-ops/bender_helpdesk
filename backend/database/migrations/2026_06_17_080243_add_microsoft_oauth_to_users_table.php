<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('microsoft_id')->nullable()->after('id');
            $table->text('microsoft_token')->nullable()->after('microsoft_id');
            $table->unique('microsoft_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['microsoft_id']);
            $table->dropColumn(['microsoft_id', 'microsoft_token']);
        });
    }
};
