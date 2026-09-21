<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class YearlyQuestionItem extends Model
{
    protected $table = 'mstr_yearly_question_items';

    protected $fillable = [
        'yearly_questionnaire_id',
        'question_id',
        'sort_order',
        'is_mandatory',
    ];

    protected $casts = [
        'is_mandatory' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function questionnaire(): BelongsTo
    {
        return $this->belongsTo(YearlyQuestionnaire::class, 'yearly_questionnaire_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class, 'question_id');
    }
}
