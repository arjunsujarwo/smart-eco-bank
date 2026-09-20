<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['user_id', 'category_id', 'location_id', 'photo_path', 'weight_gram', 'earned_points', 'status', 'rejection_reason'])]
class WasteTransaction extends Model
{
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(WasteCategory::class, 'category_id');
    }

    public function location()
    {
        return $this->belongsTo(CollectionLocation::class, 'location_id');
    }

    public function aiResult()
    {
        return $this->hasOne(AiResult::class, 'transaction_id');
    }

    public function qrCode()
    {
        return $this->hasOne(QrCode::class, 'transaction_id');
    }
}
