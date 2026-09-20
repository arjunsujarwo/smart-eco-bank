<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\WasteTransactionController;
use App\Http\Controllers\RewardController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;

Route::get('/user', function (Request $request) {
    $user = $request->user();
    $data = $user->toArray();
    
    // Append accessors explicitly just in case
    $data['photo_url'] = $user->photo_url;
    $data['has_pin'] = $user->has_pin;

    $data['total_gram_saved'] = \App\Models\WasteTransaction::where('user_id', $user->id)
        ->where('status', 'completed')
        ->sum('weight_gram');

    if ($user->role === 'admin') {
        $data['activity_logs'] = [
            [
                'id' => 'l1',
                'action' => 'Berhasil Login',
                'timestamp' => 'Hari ini, 08:30 WIB',
                'color' => 'primary',
            ],
            [
                'id' => 'l2',
                'action' => 'Verifikasi Setoran #VRF-001',
                'timestamp' => 'Kemarin, 14:20 WIB',
                'color' => 'secondary',
            ],
            [
                'id' => 'l3',
                'action' => 'Update Stok Tumbler',
                'timestamp' => '18 Jun, 10:15 WIB',
                'color' => 'tertiary',
            ],
        ];
    } else {
        $data['activity_logs'] = null;
    }

    return response()->json(['success' => true, 'data' => $data]);
})->middleware('auth:sanctum');

// 1. Rute Autentikasi
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Rute yang membutuhkan autentikasi
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/validate-token', [AuthController::class, 'validateToken']);

    // Rute Profil & Keamanan (Bisa diakses user & admin, tapi dilarang jika suspended)
    Route::middleware('not.suspended')->group(function () {
        Route::post('/profile/update', [ProfileController::class, 'updateProfile']);
        Route::delete('/profile/photo', [ProfileController::class, 'deletePhoto']);
        Route::post('/profile/password', [ProfileController::class, 'updatePassword']);
        Route::post('/profile/pin', [ProfileController::class, 'updatePin']);
    });
    // verifikasi pin masih boleh? Sebaiknya biarkan saja, karena bisa dipakai untuk hal lain. Tapi kalau ditangguhkan, pin tidak terlalu berguna.
    // Kita wrap update saja.
    Route::post('/profile/verify-pin', [ProfileController::class, 'verifyPin']);

    // Rute Notifikasi (Bisa diakses user & admin)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/delete-all', [NotificationController::class, 'destroyAll']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/{id}/delete', [NotificationController::class, 'destroy']);

    // 2. Rute Pengguna / Nasabah
    Route::middleware('role:user')->group(function () {
        Route::get('/dashboard', [WasteTransactionController::class, 'dashboard']);
        Route::post('/ai-scan', [WasteTransactionController::class, 'aiScanProcess']);
        Route::get('/ai-scan/results', [WasteTransactionController::class, 'aiScanResults']);
        
        Route::get('/locations', [WasteTransactionController::class, 'locationsApi']); 
        Route::get('/history', [WasteTransactionController::class, 'history']);
        Route::get('/rewards', [RewardController::class, 'index']);
        Route::get('/rewards/orders/{id}', [RewardController::class, 'showOrder']);

        // Rute yang diblokir jika user di-suspend
        Route::middleware('not.suspended')->group(function () {
            Route::post('/ai-scan/submit', [WasteTransactionController::class, 'aiScanSubmit']);
            Route::post('/locations/select', [WasteTransactionController::class, 'updateSelectedLocation']);
            Route::post('/scan-qr', [WasteTransactionController::class, 'scanQrProcess']);
            Route::post('/rewards/exchange', [RewardController::class, 'exchange']);
            Route::post('/rewards/orders/{id}/confirm', [RewardController::class, 'confirmReceived']);
        });
        
        Route::get('/chatbot', [ChatController::class, 'userChatForm']); 
        Route::post('/chatbot/send', [ChatController::class, 'userSendMessage']);
    });

    // 3. Rute Admin
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);

        Route::post('/scan-qr', [AdminController::class, 'processQr']);

        Route::get('/verification', [AdminController::class, 'verificationQueue']);
        Route::post('/verification/{id}/approve', [AdminController::class, 'generateQr']);
        Route::post('/verification/{id}/reject', [AdminController::class, 'rejectTransaction']);
        
        Route::get('/rewards', [AdminController::class, 'rewardsQueue']);
        Route::post('/rewards', [AdminController::class, 'rewardsStore']);
        Route::post('/rewards/{id}/update', [AdminController::class, 'rewardsUpdate']);
        Route::post('/rewards/{id}/delete', [AdminController::class, 'rewardsDestroy']);
        Route::post('/rewards/{id}/status/{status}', [AdminController::class, 'updateRewardStatus']);
        Route::post('/rewards/{id}/verify', [AdminController::class, 'verifyPickup']);
        
        Route::get('/stock', [AdminController::class, 'stockManagement']);
        Route::post('/stock/{id}/update', [AdminController::class, 'updateStock']);
        Route::post('/stock/location/{id}/update', [AdminController::class, 'updateLocationCapacity']);
        
        Route::get('/locations', [AdminController::class, 'locationsIndex']);
        Route::post('/locations', [AdminController::class, 'locationsStore']);
        Route::post('/locations/{id}/update', [AdminController::class, 'locationsUpdate']);
        Route::post('/locations/{id}/delete', [AdminController::class, 'locationsDestroy']);

        Route::get('/users', [AdminController::class, 'usersIndex']);
        Route::post('/users', [AdminController::class, 'usersStore']);
        Route::post('/users/{id}/update', [AdminController::class, 'usersUpdate']);
        Route::post('/users/{id}/suspend', [AdminController::class, 'usersSuspend']);

        Route::get('/points', [AdminController::class, 'pointsIndex']);
        Route::post('/points/adjust', [AdminController::class, 'pointsAdjust']);
        Route::post('/points/rate', [AdminController::class, 'pointsRateUpdate']);

        Route::get('/reports', [AdminController::class, 'reportsIndex']);
        
        Route::get('/ai-monitoring', [AdminController::class, 'aiMonitoringIndex']);

        Route::get('/chats', [ChatController::class, 'adminChatList']);
        Route::get('/chats/{id}', [ChatController::class, 'adminChatForm']);
        Route::post('/chats/{id}/send', [ChatController::class, 'adminSendMessage']);
    });
});
Broadcast::routes(['middleware' => ['auth:sanctum']]);
