<?php

namespace App\Http\Controllers;

use App\Models\AiResult;
use App\Models\LocationCategory;
use App\Models\PointHistory;
use App\Models\QrCode;
use App\Models\RewardProduct;
use App\Models\User;
use App\Models\WasteCategory;
use App\Models\CollectionLocation;
use App\Models\WasteTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class WasteTransactionController extends Controller
{
    public function dashboard()
    {
        $user = Auth::user();
        $today = now()->toDateString();

        $popularRewards = RewardProduct::where('is_active', true)
            ->take(3)
            ->get();

        $totalPoint = $user->total_points;

        // Last activity: gabungan setoran + tukar hari ini (dilihat dari kapan di-update/approve)
        $todaySetoran = WasteTransaction::where('user_id', $user->id)
            ->whereDate('updated_at', $today)
            ->with(['category', 'location', 'aiResult', 'qrCode'])
            ->latest('updated_at')
            ->get()
            ->map(function ($trx) {
                return [
                    'id' => $trx->id,
                    'type' => 'setoran',
                    'date' => $trx->updated_at->toIso8601String(),
                    'category_name' => $trx->category->category_name ?? null,
                    'location_name' => $trx->location->location_name ?? $trx->location->nama_pengepul ?? null,
                    'weight_gram' => $trx->weight_gram,
                    'earned_points' => $trx->earned_points,
                    'photo_path' => $trx->photo_path,
                    'status' => $trx->status,
                    'rejection_reason' => $trx->rejection_reason,
                    'ai_result' => $trx->aiResult ? [
                        'confidence_score' => $trx->aiResult->confidence_score,
                        'detected_category' => $trx->aiResult->detected_category,
                        'result' => $trx->aiResult->result,
                        'message' => $trx->aiResult->message,
                    ] : null,
                    'qr_code' => $trx->qrCode ? [
                        'token' => $trx->qrCode->token,
                        'is_scanned' => $trx->qrCode->is_scanned,
                        'expired_at' => $trx->qrCode->expired_at,
                        'scanned_at' => $trx->qrCode->scanned_at,
                    ] : null,
                ];
            });

        $todayTukar = \App\Models\RewardOrder::where('user_id', $user->id)
            ->whereDate('updated_at', $today)
            ->with('product')
            ->latest('updated_at')
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'type' => 'tukar',
                    'date' => $order->updated_at->toIso8601String(),
                    'product_name' => $order->product_name,
                    'product_image' => $order->product->image_path ?? null,
                    'point_per_item' => $order->point_per_item,
                    'quantity' => $order->quantity,
                    'total_points' => $order->total_points,
                    'status' => $order->status,
                ];
            });

        $lastActivity = $todaySetoran->concat($todayTukar)
            ->sortByDesc('date')
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'popularRewards' => $popularRewards,
                'totalPoint' => $totalPoint,
                'last_activity' => $lastActivity
            ]
        ]);
    }

    public function aiScanProcess(Request $request)
    {
        $request->validate([
            'waste_image' => 'required|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        $file = $request->file('waste_image');
        $filename = strtolower($file->getClientOriginalName());
        $path = $file->store('temp_ai_scans', 'public');

        $apiKey = config('services.gemini.key');
        $scanData = null;

        if ($apiKey) {
            try {
                $imageData = base64_encode(file_get_contents($file->path()));
                $mimeType = $file->getMimeType();

                $response = \Illuminate\Support\Facades\Http::post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => "Analisis gambar ini secara akurat. PERTAMA, pastikan apakah objek utama adalah SAMPAH (barang bekas/buangan) atau BUKAN (misalnya: hewan hidup, wajah manusia, dsb). JIKA BUKAN sampah, berikan 'confidence' 0 dan 'message' berupa alasan mengapa gambar ditolak. JIKA SAMPAH, identifikasi objek utamanya, estimasi beratnya dalam gram, dan tentukan kategorinya (Pilih HANYA salah satu dari: Organic Waste atau Non-Organic Waste). Kembalikan response HANYA dalam format JSON dengan struktur: {\"product_name\": \"Nama Objek\", \"category_name\": \"Kategori\", \"confidence\": 95.0, \"estimated_weight\": 200, \"result\": \"Deskripsi detail dalam Bahasa Indonesia\", \"message\": \"Pesan saran/penolakan untuk pengguna\"}"],
                                ['inline_data' => ['mime_type' => $mimeType, 'data' => $imageData]]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json'
                    ]
                ]);

                if ($response->successful()) {
                    $resultText = $response->json('candidates.0.content.parts.0.text');
                    $resultText = preg_replace('/```json\s*/', '', $resultText);
                    $resultText = preg_replace('/```\s*/', '', $resultText);
                    $scanData = json_decode(trim($resultText), true);
                }
            } catch (\Exception $e) {
                // Fallback
            }
        }

        if (!$scanData) {
            if (str_contains($filename, 'kardus') || str_contains($filename, 'box')) {
                $scanData = [
                    'product_name' => 'Kardus',
                    'category_name' => 'Non-Organic Waste',
                    'confidence' => 95.50,
                    'estimated_weight' => rand(200, 600),
                    'result' => 'Tumpukan Kardus Bekas',
                    'message' => 'Sampah kertas terdeteksi. Pastikan kardus dalam keadaan kering dan dilipat agar menghemat ruang.'
                ];
            } elseif (str_contains($filename, 'botol') || str_contains($filename, 'plastik') || str_contains($filename, 'bottle')) {
                $scanData = [
                    'product_name' => 'Botol Plastik',
                    'category_name' => 'Non-Organic Waste',
                    'confidence' => 97.00,
                    'estimated_weight' => rand(50, 300),
                    'result' => 'Botol Plastik PET Bekas',
                    'message' => 'Sampah plastik terdeteksi. Bersihkan sisa cairan sebelum disetorkan.'
                ];
            } elseif (str_contains($filename, 'kaleng') || str_contains($filename, 'can')) {
                $scanData = [
                    'product_name' => 'Kaleng Aluminium',
                    'category_name' => 'Non-Organic Waste',
                    'confidence' => 96.50,
                    'estimated_weight' => rand(50, 200),
                    'result' => 'Kaleng Aluminium Bekas Minuman',
                    'message' => 'Sampah logam terdeteksi. Pipihkan kaleng jika memungkinkan.'
                ];
            } elseif (str_contains($filename, 'daun') || str_contains($filename, 'sisa') || str_contains($filename, 'organik') || str_contains($filename, 'buah')) {
                $scanData = [
                    'product_name' => 'Sisa Makanan / Organik',
                    'category_name' => 'Organic Waste',
                    'confidence' => 92.00,
                    'estimated_weight' => rand(200, 800),
                    'result' => 'Daun Kering dan Sisa Buah',
                    'message' => 'Sampah organik terdeteksi. Hanya digunakan untuk pembuatan kompos di TPS.'
                ];
            } else {
                $scanData = [
                    'product_name' => 'Tidak Diketahui',
                    'category_name' => 'Unknown',
                    'confidence' => 0.0,
                    'estimated_weight' => 0,
                    'result' => 'Objek tidak teridentifikasi',
                    'message' => 'Sistem gagal mendeteksi objek. Jika Anda belum memasukkan API Key Gemini, sistem hanya mengandalkan deteksi nama file (misal: "botol.jpg").'
                ];
            }
        }

        if (!isset($scanData['confidence']) || $scanData['confidence'] < 60) {
            return response()->json([
                'success' => false,
                'message' => isset($scanData['message']) && $scanData['message'] !== '' 
                    ? $scanData['message'] 
                    : 'Foto sampah tidak dapat dikenali. Tingkat akurasi AI terlalu rendah. Silakan ambil foto yang lebih jelas atau unggah ulang gambar.'
            ], 422);
        }

        $scanData['image_path'] = $path;
        
        // Also map category for convenience of the frontend
        $catName = strtolower(trim($scanData['category_name']));
        $category = WasteCategory::whereRaw('LOWER(category_name) = ?', [$catName])->first();
        
        if (!$category) {
            if (str_contains($catName, 'organik') && !str_contains($catName, 'anorganik') && !str_contains($catName, 'non') && !str_contains($catName, 'bukan')) {
                $category = WasteCategory::where('category_name', 'Organic Waste')->first();
            } else {
                $category = WasteCategory::where('category_name', 'Non-Organic Waste')->first();
            }
        }

        $scanData['mapped_category'] = $category;

        // Hitung estimasi poin berdasarkan conversion rate dari database
        $conversionRate = intval(\App\Models\Setting::getValue('point_conversion_rate', 2));
        $scanData['estimated_point'] = ($scanData['estimated_weight'] ?? 0) * $conversionRate;

        return response()->json([
            'success' => true,
            'message' => 'Scan berhasil',
            'data' => $scanData
        ]);
    }

    public function aiScanSubmit(Request $request)
    {
        $request->validate([
            'location_id' => 'required|exists:collection_locations,id',
            'category_id' => 'required|exists:waste_categories,id',
            'weight_gram' => 'required|integer|min:1',
            'confidence' => 'required|numeric',
            'category_name' => 'required|string',
            'product_name' => 'required|string',
            'message' => 'nullable|string',
            'image_path' => 'nullable|string'
        ]);

        $weight = $request->weight_gram;
        $conversionRate = intval(\App\Models\Setting::getValue('point_conversion_rate', 2));
        $estimatedPoints = $weight * $conversionRate;

        $transaction = WasteTransaction::create([
            'user_id' => Auth::id(),
            'category_id' => $request->category_id,
            'location_id' => $request->location_id,
            'photo_path' => $request->image_path ?? 'uploads/' . Auth::id() . '_' . time() . '.png',
            'weight_gram' => $weight,
            'earned_points' => $estimatedPoints,
            'status' => 'pending',
        ]);

        AiResult::create([
            'transaction_id' => $transaction->id,
            'confidence_score' => $request->confidence,
            'detected_category' => $request->category_name,
            'result' => 'success',
            'message' => "Objek Terdeteksi: " . $request->product_name . " - " . $request->message,
        ]);

        $adminNotif = \App\Models\Notification::create([
            'user_id' => 1,
            'title' => 'Setoran Baru Menunggu Verifikasi',
            'message' => Auth::user()->full_name . " melakukan setoran {$request->category_name}.",
            'reference_type' => 'transaction',
            'reference_id' => $transaction->id,
            'is_read' => false,
        ]);
        broadcast(new \App\Events\AppNotificationSent($adminNotif, null, true));

        return response()->json([
            'success' => true,
            'message' => 'Setoran sampah berhasil diajukan! Silakan bawa sampah fisik Anda ke posko untuk diverifikasi oleh Admin.',
            'data' => $transaction
        ]);
    }

    public function locationsApi(Request $request)
    {
        $request->validate([
            'lat' => 'required|numeric',
            'long' => 'required|numeric',
        ]);

        $userLat = floatval($request->lat);
        $userLong = floatval($request->long);

        $locations = CollectionLocation::all();
        $allLocations = [];
        $sortedLocations = [];

        foreach ($locations as $loc) {
            $earthRadius = 6371; 
            $latDiff = deg2rad($loc->latitude - $userLat);
            $lonDiff = deg2rad($loc->longitude - $userLong);
            $a = sin($latDiff / 2) * sin($latDiff / 2) +
                 cos(deg2rad($userLat)) * cos(deg2rad($loc->latitude)) *
                 sin($lonDiff / 2) * sin($lonDiff / 2);
            $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
            $distanceKm = round($earthRadius * $c, 2);

            $isFull = $loc->current_capacity >= $loc->max_capacity || $loc->status === 'Penuh';

            $locData = [
                'id' => $loc->id,
                'location_name' => $loc->location_name,
                'lat' => (string)number_format($loc->latitude, 8),
                'long' => (string)number_format($loc->longitude, 8),
                'distance_km' => $distanceKm,
                'alamat' => $loc->address,
                'status' => $loc->status,
                'is_full' => $isFull
            ];
            
            $allLocations[] = [
                'id' => $loc->id,
                'location_name' => $loc->location_name,
                'lat' => (string)number_format($loc->latitude, 8),
                'long' => (string)number_format($loc->longitude, 8),
                'status' => $loc->status
            ];

            $sortedLocations[] = $locData;
        }

        usort($sortedLocations, function($a, $b) {
            return $a['distance_km'] <=> $b['distance_km'];
        });

        $nearestLocation = null;
        foreach ($sortedLocations as $loc) {
            if (!$loc['is_full']) {
                $nearestLocation = $loc;
                break;
            }
        }

        if (!$nearestLocation && count($sortedLocations) > 0) {
            $nearestLocation = $sortedLocations[0];
        }

        $user = Auth::user();
        $selectedLocation = null;
        if ($user && $user->selectedLocation) {
            $selectedLocation = [
                'id' => $user->selectedLocation->id,
                'location_name' => $user->selectedLocation->location_name,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'near_location' => $nearestLocation ? [$nearestLocation] : [],
                'all_location' => $allLocations,
                'selected_location' => $selectedLocation
            ]
        ]);
    }

    public function updateSelectedLocation(Request $request)
    {
        $request->validate([
            'location_id' => 'required|exists:collection_locations,id',
        ]);

        $user = Auth::user();
        $user->selected_location_id = $request->location_id;
        $user->save();

        $location = CollectionLocation::find($request->location_id);

        return response()->json([
            'success' => true,
            'message' => 'Lokasi pilihan berhasil diperbarui.',
            'data' => [
                'id' => $location->id,
                'location_name' => $location->location_name,
            ]
        ]);
    }

    public function history()
    {
        $userId = Auth::id();

        // Setoran sampah
        $setoran = WasteTransaction::where('user_id', $userId)
            ->with(['category', 'location', 'aiResult', 'qrCode'])
            ->latest()
            ->get()
            ->map(function ($trx) {
                return [
                    'id' => $trx->id,
                    'type' => 'setoran',
                    'date' => $trx->created_at->toIso8601String(),
                    'category_name' => $trx->category->category_name ?? null,
                    'location_name' => $trx->location->location_name ?? null,
                    'weight_gram' => $trx->weight_gram,
                    'earned_points' => $trx->earned_points,
                    'photo_path' => $trx->photo_path,
                    'status' => $trx->status,
                    'rejection_reason' => $trx->rejection_reason,
                    'ai_result' => $trx->aiResult ? [
                        'confidence_score' => $trx->aiResult->confidence_score,
                        'detected_category' => $trx->aiResult->detected_category,
                        'result' => $trx->aiResult->result,
                        'message' => $trx->aiResult->message,
                    ] : null,
                    'qr_code' => $trx->qrCode ? [
                        'token' => $trx->qrCode->token,
                        'is_scanned' => $trx->qrCode->is_scanned,
                        'expired_at' => $trx->qrCode->expired_at,
                        'scanned_at' => $trx->qrCode->scanned_at,
                    ] : null,
                ];
            });

        // Tukar reward
        $tukar = \App\Models\RewardOrder::where('user_id', $userId)
            ->with('product')
            ->latest()
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'type' => 'tukar',
                    'date' => $order->created_at->toIso8601String(),
                    'product_name' => $order->product_name,
                    'product_image' => $order->product->image_path ?? null,
                    'point_per_item' => $order->point_per_item,
                    'quantity' => $order->quantity,
                    'total_points' => $order->total_points,
                    'status' => $order->status,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'totalPoint' => Auth::user()->total_points,
                'setoran' => $setoran,
                'tukar' => $tukar,
            ]
        ]);
    }

    public function scanQrProcess(Request $request)
    {
        $request->validate([
            'qr_token' => 'required|string',
        ]);

        $qrCode = QrCode::where('token', $request->qr_token)->first();

        if (!$qrCode) {
            return response()->json(['success' => false, 'message' => 'QR Code tidak valid atau tidak terdaftar.'], 404);
        }

        if ($qrCode->is_scanned) {
            return response()->json(['success' => false, 'message' => 'QR Code ini sudah pernah digunakan.'], 400);
        }

        $transaction = $qrCode->transaction;

        if (!$transaction || $transaction->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Transaksi setoran tidak valid atau telah diproses sebelumnya.'], 400);
        }

        $qrCode->is_scanned = true;
        $qrCode->scanned_at = now();
        $qrCode->save();

        $transaction->status = 'completed';
        $transaction->save();

        $user = $transaction->user;
        $pointsEarned = $transaction->earned_points;
        $user->total_points += $pointsEarned;
        $user->save();

        PointHistory::create([
            'user_id' => $user->id,
            'type' => 'earn',
            'points' => $pointsEarned,
            'reference_id' => $transaction->id,
            'description' => "Poin didapat dari setoran sampah {$transaction->category->category_name} seberat {$transaction->weight_gram} gram.",
        ]);

        $notif = \App\Models\Notification::create([
            'user_id' => $user->id,
            'title' => 'Setoran Selesai & Poin Ditambahkan!',
            'message' => "Selamat! Setoran sampah Anda telah dikonfirmasi oleh Admin. +{$pointsEarned} poin telah ditambahkan ke akun Anda.",
            'reference_type' => 'transaction',
            'reference_id' => $transaction->id,
            'is_read' => false,
        ]);
        broadcast(new \App\Events\AppNotificationSent($notif, $user->id, false));

        $locCategory = LocationCategory::where('location_id', $transaction->location_id)
            ->where('category_id', $transaction->category_id)
            ->first();
        if ($locCategory) {
            $locCategory->current_load = min($locCategory->capacity, $locCategory->current_load + $transaction->weight_gram);
            $locCategory->save();
        }

        return response()->json([
            'success' => true,
            'message' => "QR Code berhasil dipindai! Selamat Anda mendapatkan +{$pointsEarned} Poin.",
            'data' => [
                'points_earned' => $pointsEarned,
                'total_points' => $user->total_points
            ]
        ]);
    }
}
