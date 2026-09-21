<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SurveyAnswer extends Model
{
    protected $table = 'trx_survey_answers';

    protected $fillable = [
        'survey_id',
        'yearly_question_item_id',
        'answer_text',
        'answer_option_id',
    ];

    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class, 'survey_id');
    }

    public function questionItem(): BelongsTo
    {
        return $this->belongsTo(YearlyQuestionItem::class, 'yearly_question_item_id');
    }

    public function answerOption(): BelongsTo
    {
        return $this->belongsTo(QuestionOption::class, 'answer_option_id');
    }
}
