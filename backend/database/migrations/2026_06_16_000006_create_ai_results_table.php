<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('waste_transactions')->onDelete('cascade');
            $table->decimal('confidence_score', 5, 2); // e.g. 98.50
            $table->string('detected_category');
            $table->text('result'); // deskripsi detail barang terdeteksi
            $table->text('message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_results');
    }
};
