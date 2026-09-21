<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DinkesPuskesmas extends Model
{
    protected $table = 'dinkes_puskesmas';

    protected $fillable = ['dinkes_user_id', 'puskesmas_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dinkes_user_id');
    }

    public function puskesmas(): BelongsTo
    {
        return $this->belongsTo(Puskesmas::class);
    }
}
