<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['transaction_id', 'confidence_score', 'detected_category', 'result', 'message'])]
class AiResult extends Model
{
    protected $table = 'ai_results';

    public function transaction()
    {
        return $this->belongsTo(WasteTransaction::class, 'transaction_id');
    }
}
