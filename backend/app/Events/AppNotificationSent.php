<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AppNotificationSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;
    public $targetUserId;
    public $isAdminChannel;

    /**
     * Create a new event instance.
     */
    public function __construct($notification, $targetUserId = null, $isAdminChannel = false)
    {
        $this->notification = $notification;
        $this->targetUserId = $targetUserId;
        $this->isAdminChannel = $isAdminChannel;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        if ($this->isAdminChannel) {
            return [new PrivateChannel('admin.notifications')];
        }

        return [
            new PrivateChannel('App.Models.User.' . $this->targetUserId),
        ];
    }

    public function broadcastWith(): array
    {
        return ['notification' => $this->notification];
    }
}
