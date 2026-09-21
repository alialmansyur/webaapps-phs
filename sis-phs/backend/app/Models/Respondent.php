<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Respondent extends Model
{
    protected $table = 'mstr_respondents';

    protected $fillable = [
        'household_id',
        'nik',
        'name',
        'birth_date',
        'gender',
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class, 'household_id');
    }

    public function surveys(): HasMany
    {
        return $this->hasMany(Survey::class, 'respondent_id');
    }
}
