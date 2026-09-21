<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\ScopeResolverService;
use App\Services\UserManagementService;

abstract class BaseUserController extends Controller
{
    public function __construct(
        protected readonly UserManagementService $userManagementService,
        protected readonly ScopeResolverService $scopeResolver,
        protected readonly ActivityLogService $activityLogService,
    ) {
    }

    protected function paginatedUserResponse($records, bool $isKader): array
    {
        $items = collect($records->items())
            ->map(fn (User $user) => $isKader ? $this->transformKaderUser($user) : $this->transformAdminUser($user))
            ->all();

        return [
            'data' => $items,
            'meta' => [
                'page' => $records->currentPage(),
                'perPage' => $records->perPage(),
                'total' => $records->total(),
                'totalPages' => $records->lastPage(),
                'from' => $records->firstItem() ?? 0,
                'to' => $records->lastItem() ?? 0,
            ],
        ];
    }

    protected function transformAdminUser(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'fullName' => $user->full_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => strtoupper($user->role?->code ?? ''),
            'roleCode' => $user->role?->code,
            'roleLabel' => $user->role?->name,
            'scopeType' => $user->puskesmas_id ? 'PUSKESMAS' : ($user->district_id ? 'KABUPATEN' : 'GLOBAL'),
            'scopeLabel' => $user->puskesmas?->name ?? $user->district?->name ?? 'Kabupaten',
            'institution' => $user->puskesmas?->name ?? $user->district?->name ?? 'Dinas Kesehatan Kabupaten',
            'puskesmasId' => $user->puskesmas_id,
            'districtId' => $user->district_id,
            'isActive' => $user->is_active,
            'lastLoginAt' => optional($user->last_login_at)->toIso8601String() ?? now()->subDays(1)->toIso8601String(),
        ];
    }

    protected function transformKaderUser(User $user): array
    {
        return [
            'id' => $user->id,
            'code' => $user->kader_code,
            'username' => $user->username,
            'fullName' => $user->full_name,
            'phone' => $user->phone,
            'puskesmasId' => $user->puskesmas_id,
            'puskesmasName' => $user->puskesmas?->name,
            'districtId' => $user->district_id,
            'districtName' => $user->district?->name,
            'villageId' => $user->village_id,
            'villageName' => $user->village?->name,
            'coverageArea' => $user->coverage_area ?? 'Wilayah binaan utama',
            'surveyCount' => 0,
            'lastSyncAt' => optional($user->last_login_at)->toIso8601String() ?? now()->subDays(2)->toIso8601String(),
            'isActive' => $user->is_active,
        ];
    }
}
