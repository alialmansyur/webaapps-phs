<?php

namespace App\Services;

use App\Models\DinkesPuskesmas;
use App\Models\PuskesmasVillage;
use App\Models\Role;
use App\Models\User;
use App\Models\UserScope;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserManagementService
{
    public function __construct(
        private readonly ScopeResolverService $scopeResolver,
    ) {
    }

    public function listAdminUsers(User $actor, array $filters): LengthAwarePaginator
    {
        $query = User::query()
            ->with(['role', 'district', 'puskesmas'])
            ->whereHas('role', fn (Builder $builder) => $builder->whereIn('code', ['admin', 'dinkes', 'puskesmas', 'auditor', 'analis']));

        $this->scopeResolver->applyUserVisibility($query, $actor);
        $this->applyCommonFilters($query, $filters);

        if (! empty($filters['role'])) {
            $query->whereHas('role', fn (Builder $builder) => $builder->where('code', $filters['role']));
        }

        return $query->orderBy('full_name')->paginate($filters['per_page'] ?? 10);
    }

    public function listKaderUsers(User $actor, array $filters): LengthAwarePaginator
    {
        $query = User::query()
            ->with(['role', 'district', 'puskesmas', 'village'])
            ->whereHas('role', fn (Builder $builder) => $builder->where('code', 'kader'));

        $this->scopeResolver->applyUserVisibility($query, $actor);
        $this->applyCommonFilters($query, $filters);

        if (! empty($filters['village_id'])) {
            $query->where('village_id', $filters['village_id']);
        }

        return $query->orderBy('full_name')->paginate($filters['per_page'] ?? 10);
    }

    public function upsertAdminUser(array $data, ?User $user = null): User
    {
        return DB::transaction(function () use ($data, $user): User {
            $role = Role::query()->where('code', $data['role_code'])->firstOrFail();
            $record = $user ?? new User();

            $record->fill([
                'name' => $data['full_name'],
                'username' => $data['username'],
                'full_name' => $data['full_name'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'role_id' => $role->id,
                'district_id' => $data['district_id'] ?? null,
                'puskesmas_id' => $data['puskesmas_id'] ?? null,
                'village_id' => null,
                'kader_code' => null,
                'coverage_area' => null,
                'is_active' => $data['is_active'] ?? true,
                'must_reset_password' => $data['must_reset_password'] ?? ($user ? $record->must_reset_password : true),
            ]);

            if (! empty($data['password'])) {
                $record->password = $data['password'];
            }

            $record->save();

            $this->syncScopes($record);

            if ($role->code === 'dinkes' && ! empty($data['managed_puskesmas_ids'])) {
                DinkesPuskesmas::query()->where('dinkes_user_id', $record->id)->delete();
                foreach ($data['managed_puskesmas_ids'] as $puskesmasId) {
                    DinkesPuskesmas::query()->create([
                        'dinkes_user_id' => $record->id,
                        'puskesmas_id' => $puskesmasId,
                    ]);
                }
            }

            return $record->fresh(['role', 'district', 'puskesmas']);
        });
    }

    public function upsertKaderUser(array $data, ?User $user = null): User
    {
        $role = Role::query()->where('code', 'kader')->firstOrFail();
        $mappedVillage = \App\Models\FaskesVillage::query()
            ->where('faskes_id', $data['puskesmas_id']) // using puskesmas_id from user table that points to faskes_id
            ->where('village_id', $data['village_id'])
            ->exists();

        if (! $mappedVillage) {
            throw ValidationException::withMessages([
                'village_id' => ['Desa tidak termasuk cakupan puskesmas yang dipilih.'],
            ]);
        }

        $existing = User::query()
            ->where('village_id', $data['village_id'])
            ->where('is_active', true)
            ->where('role_id', $role->id)
            ->when($user, fn (Builder $builder) => $builder->where('id', '!=', $user->id))
            ->exists();

        if ($existing) {
            throw ValidationException::withMessages([
                'village_id' => ['Desa ini sudah memiliki kader aktif.'],
            ]);
        }

        return DB::transaction(function () use ($data, $user, $role): User {
            $faskes = \App\Models\Faskes::find($data['puskesmas_id']);
            $record = $user ?? new User();

            $record->fill([
                'name' => $data['full_name'],
                'username' => $data['username'],
                'full_name' => $data['full_name'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'role_id' => $role->id,
                'district_id' => $faskes ? $faskes->district_id : null,
                'puskesmas_id' => $data['puskesmas_id'],
                'village_id' => $data['village_id'],
                'kader_code' => $data['kader_code'],
                'coverage_area' => $data['coverage_area'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'must_reset_password' => $data['must_reset_password'] ?? ($user ? $record->must_reset_password : true),
            ]);

            if (! empty($data['password'])) {
                $record->password = $data['password'];
            }

            $record->save();
            $this->syncScopes($record);

            return $record->fresh(['role', 'district', 'puskesmas', 'village']);
        });
    }

    public function setStatus(User $user, bool $isActive): User
    {
        $user->forceFill(['is_active' => $isActive])->save();
        return $user->fresh(['role', 'district', 'puskesmas', 'village']);
    }

    private function applyCommonFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['search'])) {
            $keyword = mb_strtolower($filters['search']);
            $query->where(function (Builder $builder) use ($keyword): void {
                $builder
                    ->whereRaw('LOWER(username) LIKE ?', ["%{$keyword}%"])
                    ->orWhereRaw('LOWER(full_name) LIKE ?', ["%{$keyword}%"])
                    ->orWhereRaw('LOWER(email) LIKE ?', ["%{$keyword}%"])
                    ->orWhereRaw('LOWER(phone) LIKE ?', ["%{$keyword}%"]);
            });
        }

        if (($filters['status'] ?? null) === 'active') {
            $query->where('is_active', true);
        } elseif (($filters['status'] ?? null) === 'inactive') {
            $query->where('is_active', false);
        }

        if (! empty($filters['district_id'])) {
            $query->where('district_id', $filters['district_id']);
        }

        if (! empty($filters['puskesmas_id'])) {
            $query->where('puskesmas_id', $filters['puskesmas_id']);
        }
    }

    private function syncScopes(User $user): void
    {
        UserScope::query()->where('user_id', $user->id)->delete();

        UserScope::query()->create([
            'user_id' => $user->id,
            'scope_type' => $user->role?->code ?? 'custom',
            'district_id' => $user->district_id,
            'puskesmas_id' => $user->puskesmas_id,
            'village_id' => $user->village_id,
            'is_primary' => true,
        ]);
    }
}
