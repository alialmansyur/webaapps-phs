<?php

namespace App\Services;

use App\Models\DinkesPuskesmas;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class ScopeResolverService
{
    public function roleCode(User $user): string
    {
        return $user->role?->code ?? '';
    }

    public function allowedPuskesmasIds(User $user): array
    {
        return match ($this->roleCode($user)) {
            'admin' => [],
            'dinkes' => DinkesPuskesmas::query()->where('dinkes_user_id', $user->id)->pluck('puskesmas_id')->all(),
            'puskesmas' => $user->puskesmas_id ? [$user->puskesmas_id] : [],
            'kader' => $user->puskesmas_id ? [$user->puskesmas_id] : [],
            default => [],
        };
    }

    public function applyUserVisibility(Builder $query, User $user): Builder
    {
        return match ($this->roleCode($user)) {
            'admin' => $query,
            'dinkes' => $query->where(function (Builder $scoped) use ($user): void {
                $scoped->whereIn('puskesmas_id', $this->allowedPuskesmasIds($user))
                    ->orWhere('id', $user->id);
            }),
            'puskesmas' => $query->where('puskesmas_id', $user->puskesmas_id),
            'kader' => $query->where('id', $user->id),
            default => $query->whereRaw('1 = 0'),
        };
    }

    public function canManageAdminUsers(User $user): bool
    {
        return $this->roleCode($user) === 'admin';
    }

    public function canManageKaderUsers(User $user): bool
    {
        return in_array($this->roleCode($user), ['admin', 'puskesmas'], true);
    }

    public function canViewPeriods(User $user): bool
    {
        return in_array($this->roleCode($user), ['admin', 'dinkes', 'puskesmas'], true);
    }

    public function canManagePeriods(User $user): bool
    {
        return $this->roleCode($user) === 'admin';
    }

    public function canViewRegions(User $user): bool
    {
        return in_array($this->roleCode($user), ['admin', 'dinkes', 'puskesmas'], true);
    }

    public function canManageRegions(User $user): bool
    {
        return $this->roleCode($user) === 'admin';
    }

    public function scopeSummary(User $user): array
    {
        return [
            'district_id' => $user->district_id,
            'district_name' => $user->district?->name,
            'puskesmas_id' => $user->puskesmas_id,
            'puskesmas_name' => $user->puskesmas?->name,
            'village_id' => $user->village_id,
            'village_name' => $user->village?->name,
            'allowed_puskesmas_ids' => $this->allowedPuskesmasIds($user),
        ];
    }
}
