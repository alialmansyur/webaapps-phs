<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Services\SurveySummaryService;

class Survey extends Model
{
    use HasUuids;

    protected $table = 'trx_surveys';

    protected $fillable = [
        'yearly_questionnaire_id',
        'period_id',
        'surveyor_user_id',
        'respondent_id',
        'age_at_survey',
        'status',
        'submitted_at',
        'notes',
    ];

    protected $casts = [
        'age_at_survey' => 'integer',
        'submitted_at' => 'datetime',
    ];

    public function questionnaire(): BelongsTo
    {
        return $this->belongsTo(YearlyQuestionnaire::class, 'yearly_questionnaire_id');
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class, 'period_id');
    }

    public function surveyor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'surveyor_user_id');
    }

    public function respondent(): BelongsTo
    {
        return $this->belongsTo(Respondent::class, 'respondent_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(SurveyAnswer::class, 'survey_id');
    }

    protected static function booted()
    {
        static::saved(function ($survey) {
            // Only generate summary if it's not a draft, or if it was just changed to draft (to clear summary maybe, but we'll ignore drafts)
            if ($survey->status !== 'DRAFT') {
                SurveySummaryService::generateSummaryForSurvey($survey->id);
            }
        });
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(Intervention::class, 'survey_id');
    }
}
