<?php

namespace App\Http\Controllers;

use App\Models\PointHistory;
use App\Models\ProductLocationStock;
use App\Models\RewardOrder;
use App\Models\RewardProduct;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class RewardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $products = RewardProduct::where('is_active', true)
            ->with(['locationStocks.location'])
            ->get();
        $orders = RewardOrder::where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'products' => $products,
                'orders' => $orders
            ]
        ]);
    }

    public function exchange(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:reward_products,id',
            'quantity' => 'required|integer|min:1',
            'location_id' => 'required|exists:collection_locations,id',
        ]);

        $user = Auth::user();
        $product = RewardProduct::find($request->product_id);
        $quantity = $request->quantity;
        $totalPoints = $product->required_points * $quantity;

        if ($user->total_points < $totalPoints) {
            return response()->json(['success' => false, 'message' => "Poin Anda tidak mencukupi untuk menukarkan {$quantity}x {$product->product_name}."], 400);
        }

        $locationStock = ProductLocationStock::where('product_id', $product->id)
            ->where('location_id', $request->location_id)
            ->first();

        if (!$locationStock || $locationStock->stock < $quantity) {
            return response()->json(['success' => false, 'message' => "Stok {$product->product_name} di posko yang dipilih tidak mencukupi."], 400);
        }

        $user->total_points -= $totalPoints;
        $user->save();

        $locationStock->stock -= $quantity;
        $locationStock->save();
        $product->syncTotalStock();

        $pickupCode = Str::upper(Str::random(6));

        $order = RewardOrder::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'product_name' => $product->product_name,
            'point_per_item' => $product->required_points,
            'quantity' => $quantity,
            'total_points' => $totalPoints,
            'status' => 'process',
            'pickup_code' => $pickupCode,
            'pickup_location_id' => $request->location_id,
        ]);

        PointHistory::create([
            'user_id' => $user->id,
            'type' => 'redeem',
            'points' => -$totalPoints,
            'reference_id' => $order->id,
            'description' => "Penukaran poin untuk {$quantity}x {$product->product_name}.",
        ]);

        $userNotif = \App\Models\Notification::create([
            'user_id' => $user->id,
            'title' => 'Penukaran Reward Diproses',
            'message' => "Penukaran {$quantity}x {$product->product_name} berhasil diajukan dan sedang diproses.",
            'reference_type' => 'reward',
            'reference_id' => $order->id,
            'is_read' => false,
        ]);
        broadcast(new \App\Events\AppNotificationSent($userNotif, $user->id, false));

        $adminNotif = \App\Models\Notification::create([
            'user_id' => 1,
            'title' => 'Pesanan Reward Baru',
            'message' => "{$user->full_name} menukarkan {$quantity}x {$product->product_name}.",
            'reference_type' => 'reward',
            'reference_id' => $order->id,
            'is_read' => false,
        ]);
        broadcast(new \App\Events\AppNotificationSent($adminNotif, null, true));

        return response()->json([
            'success' => true,
            'message' => "Penukaran {$quantity}x {$product->product_name} berhasil dilakukan! Silakan pantau pengiriman pada tabel pesanan.",
            'data' => $order
        ]);
    }

    public function showOrder($id)
    {
        $order = RewardOrder::with(['product', 'pickupLocation'])->where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $locationName = $order->pickupLocation?->location_name ?? 'Posko';

        $tracking = [
            [
                'status' => 'process',
                'label' => 'Pesanan Diterima',
                'description' => 'Pesanan Anda telah diterima dan sedang disiapkan.',
                'date' => $order->created_at->format('d M Y, H:i'),
                'is_completed' => true,
            ],
            [
                'status' => 'pickup',
                'label' => "Ambil di {$locationName}",
                'description' => "Tunjukkan kode pengambilan Anda ke petugas di {$locationName}.",
                'date' => $order->status === 'selesai' ? $order->updated_at->format('d M Y, H:i') : null,
                'is_completed' => $order->status === 'selesai',
            ],
            [
                'status' => 'selesai',
                'label' => 'Selesai',
                'description' => 'Reward berhasil diambil.',
                'date' => $order->status === 'selesai' ? $order->updated_at->format('d M Y, H:i') : null,
                'is_completed' => $order->status === 'selesai',
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'order' => $order,
                'pickup_code' => $order->pickup_code,
                'pickup_location' => $order->pickupLocation ? [
                    'id' => $order->pickupLocation->id,
                    'location_name' => $order->pickupLocation->location_name,
                    'address' => $order->pickupLocation->address,
                ] : null,
                'tracking' => $tracking,
            ]
        ]);
    }

    public function confirmReceived($id)
    {
        $order = RewardOrder::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if ($order->status !== 'pengiriman') {
            return response()->json(['success' => false, 'message' => 'Status pesanan tidak valid untuk dikonfirmasi.'], 400);
        }

        $order->status = 'selesai';
        $order->save();

        $userNotif = \App\Models\Notification::create([
            'user_id' => Auth::id(),
            'title' => 'Reward Diterima!',
            'message' => "Anda telah mengonfirmasi penerimaan reward: {$order->product_name}.",
            'reference_type' => 'reward',
            'reference_id' => $order->id,
            'is_read' => false,
        ]);
        broadcast(new \App\Events\AppNotificationSent($userNotif, Auth::id(), false));

        return response()->json([
            'success' => true,
            'message' => "Konfirmasi penerimaan reward {$order->product_name} berhasil disimpan.",
            'data' => $order
        ]);
    }
}
