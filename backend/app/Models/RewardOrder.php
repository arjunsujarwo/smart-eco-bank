<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'product_id', 'product_name', 'point_per_item', 'quantity', 'total_points', 'status', 'pickup_code', 'pickup_location_id'])]
class RewardOrder extends Model
{
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(RewardProduct::class, 'product_id');
    }

    public function pickupLocation()
    {
        return $this->belongsTo(CollectionLocation::class, 'pickup_location_id');
    }
}
