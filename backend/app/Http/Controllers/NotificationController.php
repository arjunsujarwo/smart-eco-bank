<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            // Ambil ID semua admin untuk menarik notifikasi yang ditujukan ke admin
            $adminIds = \App\Models\User::where('role', 'admin')->pluck('id')->toArray();
            $adminIds[] = 1; // Fallback legacy admin ID yang di-hardcode sebelumnya

            $notifications = Notification::whereIn('user_id', $adminIds)->latest()->get();
        } else {
            // Jika user biasa, ambil notifikasi miliknya saja
            $notifications = Notification::where('user_id', $user->id)
                ->where('title', '!=', 'Setoran Baru Menunggu Verifikasi') // Filter legacy notif admin
                ->latest()->get();
        }

        return response()->json([
            'success' => true,
            'data' => $notifications
        ]);
    }

    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);

        // Verifikasi kepemilikan (admin bisa akses yang user_id null, user hanya miliknya)
        $user = $request->user();
        if ($user->role !== 'admin' && $notification->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $notification->is_read = true;
        $notification->save();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai sudah dibaca.',
            'data' => $notification
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);

        $user = $request->user();
        if ($user->role !== 'admin' && $notification->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi berhasil dihapus.'
        ]);
    }

    public function destroyAll(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            $adminIds = \App\Models\User::where('role', 'admin')->pluck('id')->toArray();
            $adminIds[] = 1;
            Notification::whereIn('user_id', $adminIds)->delete();
        } else {
            Notification::where('user_id', $user->id)
                ->where('title', '!=', 'Setoran Baru Menunggu Verifikasi')
                ->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi berhasil dihapus.'
        ]);
    }
}
