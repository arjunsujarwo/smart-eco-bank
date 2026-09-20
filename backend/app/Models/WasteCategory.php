<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['category_name', 'description'])]
class WasteCategory extends Model
{
    public function locationCategories()
    {
        return $this->hasMany(LocationCategory::class, 'category_id');
    }

    public function transactions()
    {
        return $this->hasMany(WasteTransaction::class, 'category_id');
    }
}
