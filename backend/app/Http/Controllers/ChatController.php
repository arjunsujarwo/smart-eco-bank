<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    public function userChatForm()
    {
        $user = Auth::user();
        
        $chat = Chat::firstOrCreate([
            'user_id' => $user->id
        ]);

        $messages = Message::where('chat_id', $chat->id)
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->get();

        if ($messages->isEmpty()) {
            $admin = User::where('role', 'admin')->first();
            $adminId = $admin ? $admin->id : 1;

            $welcomeMsg = Message::create([
                'chat_id' => $chat->id,
                'sender_id' => $adminId,
                'message' => "Halo {$user->full_name}! Selamat datang di Customer Service Smart Eco Bank. Saya adalah Asisten AI Anda. Ada yang bisa saya bantu hari ini? Anda bisa menanyakan tentang 'poin', 'setor', atau 'reward'!",
                'is_read' => true,
            ]);

            $messages = collect([$welcomeMsg]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'chat' => $chat,
                'messages' => $messages
            ]
        ]);
    }

    public function userSendMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
        ]);

        $user = Auth::user();
        $chat = Chat::where('user_id', $user->id)->firstOrFail();

        $userMsg = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => $user->id,
            'message' => $request->message,
            'is_read' => false,
        ]);

        broadcast(new \App\Events\MessageSent($userMsg));

        $adminNotif = \App\Models\Notification::create([
            'user_id' => 1, // Kita set dummy admin ID 1 jika tidak spesifik, atau ambil dari $adminId yang didefine di bawah
            'title' => "Pesan Baru dari {$user->full_name}",
            'message' => Str::limit($request->message, 50),
            'reference_type' => 'chat',
            'reference_id' => $chat->id,
            'is_read' => false,
        ]);
        broadcast(new \App\Events\AppNotificationSent($adminNotif, null, true));

        $msgLower = strtolower($request->message);
        $admin = User::where('role', 'admin')->first();
        $adminId = $admin ? $admin->id : 1;

        $reply = "";
        if (str_contains($msgLower, 'poin') || str_contains($msgLower, 'point')) {
            $reply = "Kalkulasi Poin Smart Eco Bank dihitung menggunakan rumus: Berat (gram) x 2. Poin hanya akan masuk ke saldo Anda setelah Anda membawa sampah ke posko untuk ditimbang oleh Admin dan memindai QR Code penyetoran yang diberikan.";
        } elseif (str_contains($msgLower, 'setor') || str_contains($msgLower, 'sampah') || str_contains($msgLower, 'kategori')) {
            $reply = "Untuk menyetor sampah, buka Dashboard dan klik 'SETOR SAMPAH'. Ambil foto sampah untuk dipindai oleh AI. Sistem akan menyarankan posko terdekat yang belum penuh. Setelah itu, bawa sampah ke posko agar Admin memverifikasinya.";
        } elseif (str_contains($msgLower, 'reward') || str_contains($msgLower, 'hadiah') || str_contains($msgLower, 'tukar')) {
            $reply = "Anda dapat menukarkan poin dengan produk ramah lingkungan di Katalog Reward. Hadiah yang tersedia saat ini: Tumbler (50.000 poin), Topi (20.000 poin), dan Tote Bag (10.000 poin).";
        } elseif (str_contains($msgLower, 'alamat') || str_contains($msgLower, 'lokasi') || str_contains($msgLower, 'posko')) {
            $reply = "Kami memiliki beberapa posko bank sampah aktif di wilayah Jakarta, yaitu Posko Harmoni Eco, Posko Kebayoran Eco, dan Posko Menteng Eco. Silakan cek menu 'Lokasi Posko' untuk melihat peta lengkap dan status kapasitasnya.";
        } else {
            $reply = "Terima kasih atas pesan Anda. Asisten AI kami telah meneruskan pesan ini ke Admin Smart Eco Bank. Admin akan segera meninjau dan membalas pesan Anda secara langsung di sini. Mohon ditunggu ya!";
        }

        $botMsg = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => $adminId,
            'message' => $reply,
            'is_read' => true,
        ]);

        broadcast(new \App\Events\MessageSent($botMsg));

        $userNotif = \App\Models\Notification::create([
            'user_id' => $user->id,
            'title' => "Balasan dari Admin (AI)",
            'message' => Str::limit($reply, 50),
            'reference_type' => 'chat',
            'reference_id' => $chat->id,
            'is_read' => false,
        ]);
        broadcast(new \App\Events\AppNotificationSent($userNotif, $user->id, false));

        return response()->json([
            'success' => true,
            'data' => [
                'user_message' => $userMsg,
                'bot_message' => $botMsg
            ]
        ]);
    }

    public function adminChatList()
    {
        $chats = Chat::with(['user', 'messages' => function ($q) {
            $q->latest();
        }])
        ->whereHas('messages')
        ->whereHas('user.tokens')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $chats
        ]);
    }

    public function adminChatForm($id)
    {
        $chat = Chat::with('user')->findOrFail($id);
        $messages = Message::where('chat_id', $chat->id)
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->get();

        Message::where('chat_id', $chat->id)
            ->where('sender_id', '!=', Auth::id())
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'data' => [
                'chat' => $chat,
                'messages' => $messages
            ]
        ]);
    }

    public function adminSendMessage(Request $request, $id)
    {
        $request->validate([
            'message' => 'required|string',
        ]);

        $chat = Chat::findOrFail($id);

        $msg = Message::create([
            'chat_id' => $chat->id,
            'sender_id' => Auth::id(),
            'message' => $request->message,
            'is_read' => false,
        ]);

        broadcast(new \App\Events\MessageSent($msg));

        $userNotif = \App\Models\Notification::create([
            'user_id' => $chat->user_id,
            'title' => "Pesan Baru dari Admin",
            'message' => Str::limit($request->message, 50),
            'reference_type' => 'chat',
            'reference_id' => $chat->id,
            'is_read' => false,
        ]);
        broadcast(new \App\Events\AppNotificationSent($userNotif, $chat->user_id, false));

        return response()->json([
            'success' => true,
            'data' => $msg
        ]);
    }
}
