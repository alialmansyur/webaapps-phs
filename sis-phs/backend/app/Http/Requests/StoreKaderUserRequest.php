<?php

namespace App\Http\Requests;

class StoreKaderUserRequest extends UserUpsertRequest
{
    public function rules(): array
    {
        return array_merge($this->baseRules(true), [
            'puskesmas_id' => ['required', 'integer', 'exists:mstr_faskes,id'],
            'village_id' => ['required', 'string', 'exists:reg_villages,id'],
            'kader_code' => ['required', 'string', 'max:50'],
            'coverage_area' => ['nullable', 'string', 'max:255'],
        ]);
    }
}
