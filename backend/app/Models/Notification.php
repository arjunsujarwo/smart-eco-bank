<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['user_id', 'title', 'message', 'reference_type', 'reference_id', 'is_read'])]
class Notification extends Model
{
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
