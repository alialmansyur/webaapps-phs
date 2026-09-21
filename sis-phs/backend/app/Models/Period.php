<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Period extends Model
{
    protected $table = 'mstr_periods';

    protected $fillable = [
        'year',
        'name',
        'type',
        'start_date',
        'end_date',
        'is_active',
        'status',
        'description',
        'note',
    ];

    protected $casts = [
        'year' => 'integer',
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function yearlyTarget(): HasOne
    {
        return $this->hasOne(YearlyTarget::class, 'period_id');
    }
}
