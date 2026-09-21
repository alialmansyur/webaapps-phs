<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class YearlyTarget extends Model
{
    protected $table = 'mstr_yearly_targets';

    protected $fillable = [
        'period_id',
        'target_value',
    ];

    protected $casts = [
        'period_id' => 'integer',
        'target_value' => 'integer',
    ];

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class, 'period_id');
    }
}
