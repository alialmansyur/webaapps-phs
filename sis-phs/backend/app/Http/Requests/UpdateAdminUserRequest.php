<?php

namespace App\Http\Requests;

class UpdateAdminUserRequest extends UserUpsertRequest
{
    public function rules(): array
    {
        return array_merge($this->baseRules(false), [
            'role_code' => ['required', 'in:admin,dinkes,puskesmas,auditor,analis'],
            'district_id' => ['nullable', 'string', 'exists:districts,id'],
            'puskesmas_id' => ['nullable', 'integer', 'exists:mstr_faskes,id'],
        ]);
    }
}
