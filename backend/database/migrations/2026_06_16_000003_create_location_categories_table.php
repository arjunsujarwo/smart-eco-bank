<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('location_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained('collection_locations')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('waste_categories')->onDelete('cascade');
            $table->integer('capacity')->default(1000000); // dalam gram (misal 1 ton)
            $table->integer('current_load')->default(0); // dalam gram
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('location_categories');
    }
};
