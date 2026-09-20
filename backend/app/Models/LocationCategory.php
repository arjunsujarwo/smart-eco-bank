<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['location_id', 'category_id', 'capacity', 'current_load'])]
class LocationCategory extends Model
{
    protected $table = 'location_categories';

    public function location()
    {
        return $this->belongsTo(CollectionLocation::class, 'location_id');
    }

    public function category()
    {
        return $this->belongsTo(WasteCategory::class, 'category_id');
    }
}
