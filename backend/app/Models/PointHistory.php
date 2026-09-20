<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['user_id', 'type', 'points', 'reference_id', 'description'])]
class PointHistory extends Model
{
    protected $table = 'point_histories';

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
