<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['location_name', 'address', 'latitude', 'longitude', 'max_capacity', 'current_capacity', 'status'])]
class CollectionLocation extends Model
{
    protected $table = 'collection_locations';

    public function locationCategories()
    {
        return $this->hasMany(LocationCategory::class, 'location_id');
    }

    public function transactions()
    {
        return $this->hasMany(WasteTransaction::class, 'location_id');
    }

    public function productStocks()
    {
        return $this->hasMany(ProductLocationStock::class, 'location_id');
    }
}
