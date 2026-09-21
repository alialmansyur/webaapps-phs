<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'year' => ['required', 'integer', 'digits:4', Rule::unique('mstr_periods', 'year')],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['REGULAR', 'FOLLOW_UP', 'PILOT', 'SPECIAL'])],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(['DRAFT', 'ACTIVE', 'CLOSED'])],
            'target_percentage' => ['required', 'integer', 'min:0', 'max:100'],
            'note' => ['nullable', 'string'],
        ];
    }
}
