<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Household extends Model
{
    protected $table = 'mstr_households';

    protected $fillable = [
        'no_kk',
        'head_of_family_name',
        'village_id',
        'rw',
        'rt',
    ];

    public function village(): BelongsTo
    {
        return $this->belongsTo(Village::class, 'village_id');
    }

    public function respondents(): HasMany
    {
        return $this->hasMany(Respondent::class, 'household_id');
    }
}
