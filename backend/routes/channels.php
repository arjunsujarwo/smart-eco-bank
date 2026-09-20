<?php

use App\Models\Chat;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('admin.notifications', function ($user) {
    return $user->role === 'admin';
});

Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    if ($user->role === 'admin') {
        return true;
    }

    $chat = Chat::find($chatId);
    if ($chat && (int) $chat->user_id === (int) $user->id) {
        return true;
    }

    return false;
});
