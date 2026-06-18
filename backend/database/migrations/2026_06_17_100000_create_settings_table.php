<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("settings", function (Blueprint $table) {
            $table->id();
            $table->string("key")->unique();
            $table->text("value")->nullable();
            $table->timestamps();
        });

        DB::table("settings")->insert([
            ["key" => "teams_webhook_url", "value" => ""],
            ["key" => "teams_enabled", "value" => "false"],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists("settings");
    }
};
