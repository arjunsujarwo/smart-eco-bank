<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reward_orders', function (Blueprint $table) {
            $table->string('pickup_code', 8)->nullable()->unique()->after('status');
            $table->foreignId('pickup_location_id')->nullable()->constrained('collection_locations')->nullOnDelete()->after('pickup_code');
        });
    }

    public function down(): void
    {
        Schema::table('reward_orders', function (Blueprint $table) {
            $table->dropForeign(['pickup_location_id']);
            $table->dropColumn(['pickup_code', 'pickup_location_id']);
        });
    }
};
