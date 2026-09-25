<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('reward_products', 'category')) {
            Schema::table('reward_products', function (Blueprint $table) {
                $table->string('category')->nullable()->after('product_name');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('reward_products', 'category')) {
            Schema::table('reward_products', function (Blueprint $table) {
                $table->dropColumn('category');
            });
        }
    }
};
