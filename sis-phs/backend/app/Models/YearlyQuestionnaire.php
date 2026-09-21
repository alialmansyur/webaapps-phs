<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class YearlyQuestionnaire extends Model
{
    protected $table = 'mstr_yearly_questionnaires';

    protected $fillable = [
        'period_id',
        'title',
    ];

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class, 'period_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(YearlyQuestionItem::class, 'yearly_questionnaire_id');
    }
}
