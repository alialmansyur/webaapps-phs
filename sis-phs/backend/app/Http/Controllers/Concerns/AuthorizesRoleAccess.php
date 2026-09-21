<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Exceptions\HttpResponseException;

trait AuthorizesRoleAccess
{
    protected function abortUnlessRole(bool $condition, string $message = 'Anda tidak memiliki akses ke endpoint ini.'): void
    {
        if (! $condition) {
            throw new HttpResponseException(response()->json([
                'message' => $message,
            ], 403));
        }
    }
}
