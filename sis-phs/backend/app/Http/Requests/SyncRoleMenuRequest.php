<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SyncRoleMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'role_menus' => ['required', 'array'],
            'role_menus.*' => ['array'],
            'role_menus.*.*' => ['string', 'exists:menus,code'],
        ];
    }
}
