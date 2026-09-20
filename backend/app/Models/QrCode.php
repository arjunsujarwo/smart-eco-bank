<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['transaction_id', 'token', 'is_scanned', 'expired_at', 'scanned_at'])]
class QrCode extends Model
{
    protected $table = 'qr_codes';

    public function transaction()
    {
        return $this->belongsTo(WasteTransaction::class, 'transaction_id');
    }
}
