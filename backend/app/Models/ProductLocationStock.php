<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['product_id', 'location_id', 'stock'])]
class ProductLocationStock extends Model
{
    public function product()
    {
        return $this->belongsTo(RewardProduct::class, 'product_id');
    }

    public function location()
    {
        return $this->belongsTo(CollectionLocation::class, 'location_id');
    }
}
