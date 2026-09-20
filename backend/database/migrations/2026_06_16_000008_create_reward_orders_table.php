<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reward_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('reward_products')->onDelete('cascade');
            $table->string('product_name');
            $table->integer('point_per_item');
            $table->integer('quantity');
            $table->integer('total_points');
            $table->string('status')->default('process'); // process, dikemas, pengiriman, selesai
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reward_orders');
    }
};
