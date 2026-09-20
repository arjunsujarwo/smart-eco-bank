<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use App\Models\User;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('collection_locations', function (Blueprint $table) {
            $table->integer('max_capacity')->default(1000000); // 1 Ton in grams
            $table->integer('current_capacity')->default(0);
            $table->string('status')->default('Tersedia'); // 'Tersedia', 'Penuh', 'Tutup'
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('unique_code')->unique()->nullable();
        });

        // Generate unique code for existing users
        $users = User::all();
        foreach ($users as $user) {
            $user->unique_code = 'SEWB-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));
            $user->save();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('collection_locations', function (Blueprint $table) {
            $table->dropColumn(['max_capacity', 'current_capacity', 'status']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('unique_code');
        });
    }
};
