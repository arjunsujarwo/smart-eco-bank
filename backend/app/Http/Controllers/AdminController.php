<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WasteCategory;
use App\Models\CollectionLocation;
use App\Models\LocationCategory;
use App\Models\RewardProduct;
use App\Models\ProductLocationStock;
use App\Models\WasteTransaction;
use App\Models\AiResult;
use App\Models\QrCode;
use App\Models\RewardOrder;
use App\Models\PointHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    public function dashboard()
    {
        $totalUsers = User::where('role', 'user')->count();
        $totalWaste = WasteTransaction::where('status', 'completed')->sum('weight_gram');
        $totalPoints = WasteTransaction::where('status', 'completed')->sum('earned_points');
        $totalRewards = RewardOrder::count();
        $pendingVerifications = WasteTransaction::where('status', 'pending')->count();

        $monthlyStats = [
            'months' => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            'waste_collected' => [12000, 19000, 15000, 25000, 22000, $totalWaste],
            'points_distributed' => [24000, 38000, 30000, 50000, 44000, $totalPoints]
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'totalUsers' => $totalUsers,
                'totalWaste' => $totalWaste,
                'totalPoints' => $totalPoints,
                'totalRewards' => $totalRewards,
                'pendingVerifications' => $pendingVerifications,
                'monthlyStats' => $monthlyStats
            ]
        ]);
    }

    public function verificationQueue()
    {
        $transactions = WasteTransaction::with(['user', 'category', 'location', 'aiResult', 'qrCode'])
            ->latest()
            ->get();

        $categories = WasteCategory::all();

        return response()->json([
            'success' => true,
            'data' => [
                'transactions' => $transactions,
                'categories' => $categories
            ]
        ]);
    }

    public function processQr(Request $request)
    {
        $request->validate([
            'unique_code' => 'required|string',
            'weight_gram' => 'required|integer|min:1',
            'location_id' => 'required|exists:collection_locations,id',
            'category_id' => 'required|exists:waste_categories,id',
        ]);

        $user = User::where('unique_code', $request->unique_code)->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User dengan kode unik tersebut tidak ditemukan.'], 404);
        }

        $weight = $request->weight_gram;
        $conversionRate = intval(\App\Models\Setting::getValue('point_conversion_rate', 2));
        $points = $weight * $conversionRate;

        $transaction = WasteTransaction::create([
            'user_id' => $user->id,
            'category_id' => $request->category_id,
            'location_id' => $request->location_id,
            'photo_path' => 'direct_admin_scan',
            'weight_gram' => $weight,
            'earned_points' => $points,
            'status' => 'completed',
        ]);

        $user->total_points += $points;
        $user->save();

        PointHistory::create([
            'user_id' => $user->id,
            'type' => 'earn',
            'points' => $points,
            'reference_id' => $transaction->id,
            'description' => '[Admin Scan] Poin Setoran Langsung di TPS',
        ]);

        $location = CollectionLocation::find($request->location_id);
        if ($location) {
            $location->current_capacity += $weight;
            if ($location->current_capacity >= $location->max_capacity) {
                $location->status = 'Penuh';
                $location->current_capacity = $location->max_capacity;
            } else if ($location->current_capacity >= ($location->max_capacity * 0.8)) {
                $location->status = 'Hampir Penuh';
            }
            $location->save();

            $locCategory = LocationCategory::firstOrCreate(
                ['location_id' => $location->id, 'category_id' => $request->category_id],
                ['capacity' => 1000000, 'current_load' => 0] 
            );
            $locCategory->current_load += $weight;
            $locCategory->save();
        }

        return response()->json([
            'success' => true,
            'message' => "Berhasil! {$points} Poin telah ditambahkan ke akun {$user->full_name}."
        ]);
    }

    public function generateQr(Request $request, $id)
    {
        $request->validate([
            'product_name' => 'required|string|max:255',
            'category_id' => 'required|exists:waste_categories,id',
            'weight_gram' => 'required|integer|min:1',
        ]);

        $transaction = WasteTransaction::findOrFail($id);

        if ($transaction->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Transaksi tidak berada dalam status pending.'], 400);
        }

        $weight = $request->weight_gram;
        $conversionRate = intval(\App\Models\Setting::getValue('point_conversion_rate', 2));
        $points = $weight * $conversionRate;

        $transaction->weight_gram = $weight;
        $transaction->category_id = $request->category_id;
        $transaction->earned_points = $points;
        $transaction->save();

        if ($transaction->aiResult) {
            $transaction->aiResult->result = $request->product_name;
            $transaction->aiResult->save();
        }

        $qrCode = QrCode::updateOrCreate(
            ['transaction_id' => $transaction->id],
            [
                'token' => Str::random(40),
                'is_scanned' => false,
                'expired_at' => now()->addHours(24),
            ]
        );

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $qrCode->token,
                'points' => $points,
                'transaction_id' => $transaction->id
            ]
        ]);
    }

    public function rejectTransaction(Request $request, $id)
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $transaction = WasteTransaction::findOrFail($id);
        
        $transaction->status = 'rejected';
        $transaction->rejection_reason = $request->rejection_reason;
        $transaction->save();

        $notif = \App\Models\Notification::create([
            'user_id' => $transaction->user_id,
            'title' => 'Setoran Sampah Ditolak',
            'message' => "Setoran sampah kategori {$transaction->category->category_name} Anda ditolak. Alasan: {$request->rejection_reason}",
            'reference_type' => 'transaction',
            'reference_id' => $transaction->id,
            'is_read' => false,
        ]);
        broadcast(new \App\Events\AppNotificationSent($notif, $transaction->user_id, false));

        return response()->json([
            'success' => true,
            'message' => 'Transaksi setoran berhasil ditolak/dibatalkan.'
        ]);
    }

    public function rewardsQueue()
    {
        $orders = RewardOrder::with(['user', 'pickupLocation'])->latest()->get();
        $products = RewardProduct::all();

        return response()->json([
            'success' => true,
            'data' => [
                'orders' => $orders,
                'products' => $products
            ]
        ]);
    }

    public function updateRewardStatus($id, $status)
    {
        $order = RewardOrder::findOrFail($id);

        if (!in_array($status, ['dikemas', 'pengiriman'])) {
            return response()->json(['success' => false, 'message' => 'Status perubahan tidak valid.'], 400);
        }

        $order->status = $status;
        $order->save();

        $statusNames = [
            'dikemas' => 'sedang dikemas',
            'pengiriman' => 'sedang dalam pengiriman',
        ];

        $notif = \App\Models\Notification::create([
            'user_id' => $order->user_id,
            'title' => "Pesanan Reward: {$order->product_name}",
            'message' => "Pesanan reward {$order->product_name} Anda {$statusNames[$status]}.",
            'reference_type' => 'reward',
            'reference_id' => $order->id,
            'is_read' => false,
        ]);
        broadcast(new \App\Events\AppNotificationSent($notif, $order->user_id, false));

        return response()->json([
            'success' => true,
            'message' => "Status pesanan reward {$order->product_name} berhasil diubah menjadi {$status}."
        ]);
    }

    public function verifyPickup(Request $request, $id)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $order = RewardOrder::with('pickupLocation')->findOrFail($id);

        if ($order->status === 'selesai') {
            return response()->json(['success' => false, 'message' => 'Pesanan sudah selesai.'], 400);
        }

        if (strtoupper(trim($request->code)) !== strtoupper($order->pickup_code ?? '')) {
            return response()->json(['success' => false, 'message' => 'Kode pengambilan tidak valid.'], 400);
        }

        $order->status = 'selesai';
        $order->save();

        $locationName = $order->pickupLocation?->location_name ?? 'posko';

        $notif = \App\Models\Notification::create([
            'user_id' => $order->user_id,
            'title' => 'Reward Berhasil Diambil!',
            'message' => "Pengambilan reward {$order->product_name} di {$locationName} telah diverifikasi.",
            'reference_type' => 'reward',
            'reference_id' => $order->id,
            'is_read' => false,
        ]);
        broadcast(new \App\Events\AppNotificationSent($notif, $order->user_id, false));

        return response()->json([
            'success' => true,
            'message' => "Pengambilan reward {$order->product_name} berhasil diverifikasi.",
        ]);
    }

    public function stockManagement()
    {
        $products = RewardProduct::with(['locationStocks.location'])->get();
        $locations = CollectionLocation::all();

        return response()->json([
            'success' => true,
            'data' => [
                'products' => $products,
                'locations' => $locations
            ]
        ]);
    }

    public function updateLocationCapacity(Request $request, $id)
    {
        $request->validate([
            'current_capacity' => 'required|numeric|min:0',
            'max_capacity' => 'required|numeric|min:1',
            'status' => 'required|string',
        ]);

        $loc = CollectionLocation::findOrFail($id);
        $loc->current_capacity = $request->current_capacity;
        $loc->max_capacity = $request->max_capacity;
        $loc->status = $request->status;
        $loc->save();

        return response()->json([
            'success' => true,
            'message' => "Kapasitas Posko {$loc->location_name} berhasil diperbarui."
        ]);
    }

    public function updateStock(Request $request, $id)
    {
        $request->validate([
            'location_id' => 'required|exists:collection_locations,id',
            'stock' => 'required|integer|min:0',
        ]);

        $product = RewardProduct::findOrFail($id);

        ProductLocationStock::updateOrCreate(
            ['product_id' => $id, 'location_id' => $request->location_id],
            ['stock' => $request->stock]
        );

        $product->syncTotalStock();

        $location = CollectionLocation::find($request->location_id);

        return response()->json([
            'success' => true,
            'message' => "Stok {$product->product_name} di {$location->location_name} berhasil diperbarui."
        ]);
    }

    public function rewardsStore(Request $request)
    {
        $request->validate([
            'product_name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'required_points' => 'required|integer|min:1',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        $imagePath = 'placeholder.png';
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('rewards', 'public');
        }

        $product = RewardProduct::create([
            'product_name' => $request->product_name,
            'category' => $request->category,
            'required_points' => $request->required_points,
            'stock' => 0,
            'image' => $imagePath,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Produk reward baru berhasil ditambahkan.',
            'data' => $product
        ]);
    }

    public function rewardsUpdate(Request $request, $id)
    {
        $request->validate([
            'product_name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'required_points' => 'required|integer|min:1',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        $product = RewardProduct::findOrFail($id);

        $imagePath = $product->image;
        if ($request->hasFile('image')) {
            if ($imagePath && $imagePath !== 'placeholder.png' && Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            $imagePath = $request->file('image')->store('rewards', 'public');
        }

        $product->update([
            'product_name' => $request->product_name,
            'category' => $request->category,
            'required_points' => $request->required_points,
            'image' => $imagePath,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Produk reward berhasil diperbarui.',
            'data' => $product
        ]);
    }

    public function rewardsDestroy($id)
    {
        $product = RewardProduct::findOrFail($id);
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk reward berhasil dihapus.'
        ]);
    }

    public function locationsIndex()
    {
        $locations = CollectionLocation::all();
        return response()->json([
            'success' => true,
            'data' => $locations
        ]);
    }

    public function locationsStore(Request $request)
    {
        $request->validate([
            'location_name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $location = CollectionLocation::create([
            'location_name' => $request->location_name,
            'address' => $request->address,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lokasi pengepul baru berhasil ditambahkan.',
            'data' => $location
        ]);
    }

    public function locationsUpdate(Request $request, $id)
    {
        $request->validate([
            'location_name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $location = CollectionLocation::findOrFail($id);
        $location->update([
            'location_name' => $request->location_name,
            'address' => $request->address,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lokasi pengepul berhasil diperbarui.',
            'data' => $location
        ]);
    }

    public function locationsDestroy($id)
    {
        $location = CollectionLocation::findOrFail($id);
        $location->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lokasi pengepul berhasil dihapus.'
        ]);
    }

    public function usersIndex()
    {
        $users = User::latest()->get();
        
        $activityLogs = [
            ['user' => 'Budi Santoso', 'activity' => 'Melakukan pemindaian AI Botol Plastik', 'time' => '10 menit yang lalu'],
            ['user' => 'Budi Santoso', 'activity' => 'Menukarkan 10.000 Pts dengan Tote Bag', 'time' => '1 jam yang lalu'],
            ['user' => 'Budi Santoso', 'activity' => 'Mengklaim Poin Setoran Sampah', 'time' => '3 jam yang lalu'],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $users,
                'activityLogs' => $activityLogs
            ]
        ]);
    }

    public function usersStore(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,user',
        ]);

        $user = User::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'role' => $request->role,
            'total_points' => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => "User {$user->full_name} berhasil ditambahkan sebagai {$user->role}.",
            'data' => $user
        ], 201);
    }

    public function usersUpdate(Request $request, $id)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
        ]);

        $user = User::findOrFail($id);
        $user->update([
            'full_name' => $request->full_name,
            'phone' => $request->phone,
            'address' => $request->address,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Informasi user {$user->full_name} berhasil diperbarui.",
            'data' => $user
        ]);
    }

    public function usersSuspend($id)
    {
        $user = User::findOrFail($id);
        $user->is_suspended = !$user->is_suspended;
        $user->save();

        $status = $user->is_suspended ? 'ditangguhkan (suspend)' : 'diaktifkan kembali';
        return response()->json([
            'success' => true,
            'message' => "Akun user {$user->full_name} berhasil {$status}.",
            'data' => $user
        ]);
    }

    public function pointsIndex()
    {
        $users = User::where('role', 'user')->get();
        $histories = PointHistory::with('user')->latest()->take(20)->get();
        $conversionRate = intval(\App\Models\Setting::getValue('point_conversion_rate', 2));

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $users,
                'histories' => $histories,
                'conversionRate' => $conversionRate
            ]
        ]);
    }

    public function pointsAdjust(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'points' => 'required|integer',
            'action' => 'required|in:add,subtract',
            'description' => 'required|string|max:255',
        ]);

        $user = User::findOrFail($request->user_id);
        $pointsChange = intval($request->points);

        if ($request->action === 'subtract') {
            $pointsChange = -$pointsChange;
        }

        $user->total_points = max(0, $user->total_points + $pointsChange);
        $user->save();

        PointHistory::create([
            'user_id' => $user->id,
            'type' => $request->action === 'add' ? 'earn' : 'redeem',
            'points' => abs($pointsChange),
            'reference_id' => null,
            'description' => '[Admin Manual Adjustment] ' . $request->description,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Saldo poin {$user->full_name} berhasil disesuaikan.",
            'data' => $user
        ]);
    }

    public function pointsRateUpdate(Request $request)
    {
        $request->validate([
            'conversion_rate' => 'required|integer|min:1',
        ]);

        \App\Models\Setting::setValue('point_conversion_rate', intval($request->conversion_rate));

        return response()->json([
            'success' => true,
            'message' => 'Rasio konversi poin berhasil diperbarui.'
        ]);
    }

    public function reportsIndex()
    {
        $totalOrganic = WasteTransaction::where('status', 'completed')
            ->whereHas('category', function($q) { $q->where('category_name', 'Organic Waste'); })
            ->sum('weight_gram');
            
        $totalNonOrganic = WasteTransaction::where('status', 'completed')
            ->whereHas('category', function($q) { $q->where('category_name', 'Non-Organic Waste'); })
            ->sum('weight_gram');

        $reports = [
            'organic_kg' => round($totalOrganic / 1000, 2),
            'non_organic_kg' => round($totalNonOrganic / 1000, 2),
            'co2_saved_kg' => round((($totalOrganic + $totalNonOrganic) * 1.5) / 1000, 2),
            'landfill_saved_liters' => round((($totalOrganic + $totalNonOrganic) * 2) / 1000, 2),
            'registrations' => User::where('role', 'user')->count(),
            'redemptions' => RewardOrder::count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $reports
        ]);
    }

    public function aiMonitoringIndex()
    {
        $totalScans = AiResult::count();
        $avgAccuracy = AiResult::avg('confidence_score') ?? 0;
        
        $scanDist = AiResult::select('detected_category', DB::raw('count(*) as count'))
            ->groupBy('detected_category')
            ->get();

        $categories = [];
        $counts = [];
        foreach ($scanDist as $dist) {
            $categories[] = $dist->detected_category;
            $counts[] = $dist->count;
        }

        $failedLogs = [
            ['time' => '12 jam yang lalu', 'issue' => 'Kamera gelap / blur saat mendeteksi Plastik', 'confidence' => '42.1%'],
            ['time' => '1 hari yang lalu', 'issue' => 'Produk batu terdeteksi sebagai Anorganik salah kategori', 'confidence' => '31.5%'],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'totalScans' => $totalScans,
                'avgAccuracy' => $avgAccuracy,
                'categories' => $categories,
                'counts' => $counts,
                'failedLogs' => $failedLogs
            ]
        ]);
    }
}
