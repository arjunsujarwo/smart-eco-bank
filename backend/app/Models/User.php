<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['full_name', 'email', 'phone', 'address', 'password', 'role', 'total_points', 'is_suspended', 'photo_path', 'security_pin', 'selected_location_id'])]
#[Hidden(['password', 'remember_token', 'security_pin'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public function transactions()
    {
        return $this->hasMany(WasteTransaction::class);
    }

    public function rewardOrders()
    {
        return $this->hasMany(RewardOrder::class);
    }

    public function pointHistories()
    {
        return $this->hasMany(PointHistory::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class)->latest();
    }

    public function chats()
    {
        return $this->hasMany(Chat::class);
    }

    public function selectedLocation()
    {
        return $this->belongsTo(CollectionLocation::class, 'selected_location_id');
    }

    protected $appends = ['has_pin', 'photo_url'];

    public function getHasPinAttribute()
    {
        return !empty($this->security_pin);
    }

    public function getPhotoUrlAttribute()
    {
        if ($this->photo_path) {
            return asset('storage/' . $this->photo_path);
        }
        return null;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
