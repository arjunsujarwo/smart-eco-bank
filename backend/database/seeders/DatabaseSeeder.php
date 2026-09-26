<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WasteCategory;
use App\Models\CollectionLocation;
use App\Models\LocationCategory;
use App\Models\RewardProduct;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Kategori Sampah
        $categories = [
            ['category_name' => 'Organic Waste', 'description' => 'Sampah organik seperti sisa makanan, daun gugur, dan kulit buah.'],
            ['category_name' => 'Non-Organic Waste', 'description' => 'Sampah anorganik daur ulang seperti plastik, kertas, logam, dan kaca.'],
        ];

        foreach ($categories as $cat) {
            WasteCategory::firstOrCreate(
                ['category_name' => $cat['category_name']],
                $cat
            );
        }

        // 2. Seed Lokasi Pengepul
        $locations = [
            ['location_name' => 'Smart Eco Bekasi', 'address' => 'Jl. Chairil Anwar No. 27, Bekasi', 'latitude' => -6.240000, 'longitude' => 106.990000],
            ['location_name' => 'Smart Eco Tambun', 'address' => 'Jl. Sultan Hasanudin No. 12, Tambun', 'latitude' => -6.260000, 'longitude' => 107.070000],
            ['location_name' => 'Smart Eco Cikarang', 'address' => 'Jl. Raya Cikarang No. 88, Cikarang', 'latitude' => -6.290000, 'longitude' => 107.170000],
        ];

        foreach ($locations as $loc) {
            CollectionLocation::firstOrCreate(
                ['location_name' => $loc['location_name']],
                $loc
            );
        }

        // 3. Seed Pivot Kapasitas Kategori per Lokasi
        $allCats = WasteCategory::all();
        $allLocs = CollectionLocation::all();

        foreach ($allLocs as $loc) {
            foreach ($allCats as $cat) {
                LocationCategory::firstOrCreate(
                    [
                        'location_id' => $loc->id,
                        'category_id' => $cat->id,
                    ],
                    [
                        'capacity' => 1000000, // 1 ton (1 juta gram)
                        'current_load' => 0,
                    ]
                );
            }
        }

        // 4. Seed Produk Reward
        $rewards = [
            ['product_name' => 'Tumbler', 'required_points' => 50000, 'stock' => 10, 'image' => 'tumbler.png', 'is_active' => true],
            ['product_name' => 'Topi', 'required_points' => 20000, 'stock' => 15, 'image' => 'topi.png', 'is_active' => true],
            ['product_name' => 'Tote Bag', 'required_points' => 10000, 'stock' => 25, 'image' => 'tote_bag.png', 'is_active' => true],
        ];

        foreach ($rewards as $rwd) {
            RewardProduct::firstOrCreate(
                ['product_name' => $rwd['product_name']],
                $rwd
            );
        }

        // 5. Seed User & Admin Accounts
        User::firstOrCreate(
            ['email' => 'user@example.com'],
            [
                'full_name' => 'Budi Santoso',
                'phone' => '08123456789',
                'address' => 'Jl. Kebon Jeruk No. 12, Jakarta Barat',
                'password' => bcrypt('password'),
                'role' => 'user',
                'total_points' => 25000, // Mulai dengan 25k poin untuk testing penukaran
            ]
        );

        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'full_name' => 'Lumina Admin',
                'phone' => '08987654321',
                'address' => 'Kantor Pusat Smart Eco Bank',
                'password' => bcrypt('password'),
                'role' => 'admin',
                'total_points' => 0,
            ]
        );
    }
}