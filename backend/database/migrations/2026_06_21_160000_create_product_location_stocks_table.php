<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_location_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('reward_products')->cascadeOnDelete();
            $table->foreignId('location_id')->constrained('collection_locations')->cascadeOnDelete();
            $table->integer('stock')->default(0);
            $table->unique(['product_id', 'location_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_location_stocks');
    }
};
