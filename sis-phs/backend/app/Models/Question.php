<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    protected $table = 'mstr_questions';

    protected $fillable = [
        'code',
        'indicator',
        'question_text',
        'input_type',
        'min_age',
        'max_age',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'min_age' => 'integer',
        'max_age' => 'integer',
    ];

    public function options(): HasMany
    {
        return $this->hasMany(QuestionOption::class, 'question_id');
    }
}
