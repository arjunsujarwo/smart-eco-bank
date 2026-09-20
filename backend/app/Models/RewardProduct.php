<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['product_name', 'category', 'required_points', 'stock', 'image', 'is_active'])]
class RewardProduct extends Model
{
    public function orders()
    {
        return $this->hasMany(RewardOrder::class, 'product_id');
    }

    public function locationStocks()
    {
        return $this->hasMany(ProductLocationStock::class, 'product_id');
    }

    public function syncTotalStock(): void
    {
        $this->stock = $this->locationStocks()->sum('stock');
        $this->save();
    }

    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        if ($this->image && $this->image !== 'placeholder.png') {
            return asset('storage/' . $this->image);
        }
        return null;
    }
}
