<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waste_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('waste_categories')->onDelete('cascade');
            $table->foreignId('location_id')->constrained('collection_locations')->onDelete('cascade');
            $table->string('photo_path')->nullable();
            $table->integer('weight_gram')->default(0);
            $table->integer('earned_points')->default(0);
            $table->string('status')->default('pending'); // pending, completed, cancelled, rejected
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waste_transactions');
    }
};
