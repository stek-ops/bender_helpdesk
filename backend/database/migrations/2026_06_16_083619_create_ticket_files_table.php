<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create("ticket_files", function (Blueprint $table) {
            $table->id();
            $table->foreignId("ticket_id")->constrained()->cascadeOnDelete();
            $table->string("original_name");
            $table->string("stored_path");
            $table->string("mime_type")->nullable();
            $table->integer("size")->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists("ticket_files");
    }
};
