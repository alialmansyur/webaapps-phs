<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class UserUpsertRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function baseRules(bool $isCreate): array
    {
        $userId = $this->route('id') ?? $this->route('user');

        return [
            'username' => ['required', 'string', 'max:255', Rule::unique('users', 'username')->ignore($userId)],
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => [$isCreate ? 'required' : 'nullable', 'string', 'min:8'],
            'is_active' => ['sometimes', 'boolean'],
            'must_reset_password' => ['sometimes', 'boolean'],
        ];
    }
}
