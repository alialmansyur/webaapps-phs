<?php

namespace App\Services;

use App\Models\Menu;
use App\Models\Role;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

class RoleMenuService
{
    private const SYSTEM_ROLE_CODES = ['admin', 'dinkes', 'puskesmas', 'kader', 'auditor', 'analis'];

    public function matrix(): array
    {
        $roles = Role::query()->orderBy('id')->get();
        $menus = Menu::query()->with('children')->whereNull('parent_id')->orderBy('sort_order')->get();
        $roleMenus = [];

        foreach ($roles as $role) {
            $roleMenus[$role->code] = $role->menus()->pluck('code')->all();
        }

        return [
            'roles' => $roles->map(fn (Role $role) => [
                'id' => $role->id,
                'code' => $role->code,
                'name' => $role->name,
                'description' => $role->description,
                'status' => $role->is_active ? 'ACTIVE' : 'INACTIVE',
                'is_system' => $this->isSystemRole($role),
                'can_delete' => ! $this->isSystemRole($role),
            ])->all(),
            'menu_groups' => $menus->map(fn (Menu $menu) => [
                'id' => $menu->code,
                'title' => $menu->title,
                'children' => $menu->children->where('is_active', true)->sortBy('sort_order')->map(fn (Menu $child) => [
                    'id' => $child->code,
                    'title' => $child->title,
                    'path' => $child->path,
                ])->values()->all(),
            ])->all(),
            'role_menus' => $roleMenus,
        ];
    }

    public function syncMatrix(array $roleMenus): void
    {
        DB::transaction(function () use ($roleMenus): void {
            foreach ($roleMenus as $roleCode => $menuCodes) {
                $role = Role::query()->where('code', $roleCode)->first();
                if (! $role) {
                    continue;
                }

                $menuIds = Menu::query()->whereIn('code', $menuCodes)->pluck('id')->all();
                $role->menus()->sync($menuIds);
            }
        });
    }

    public function createRole(array $data): Role
    {
        return Role::query()->create([
            'code' => str($data['code'] ?? $data['name'])->lower()->slug('-')->toString(),
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => ($data['status'] ?? 'ACTIVE') === 'ACTIVE',
        ]);
    }

    public function updateRole(Role $role, array $data): Role
    {
        $role->fill([
            'name' => $data['name'] ?? $role->name,
            'description' => $data['description'] ?? $role->description,
            'is_active' => ($data['status'] ?? ($role->is_active ? 'ACTIVE' : 'INACTIVE')) === 'ACTIVE',
        ])->save();

        return $role->fresh();
    }

    public function deleteRole(Role $role): void
    {
        if ($this->isSystemRole($role)) {
            $this->abortWithMessage('Role bawaan sistem tidak dapat dihapus.');
        }

        if ($role->users()->exists()) {
            $this->abortWithMessage('Role masih dipakai oleh user aktif. Pindahkan user ke role lain terlebih dahulu.');
        }

        DB::transaction(function () use ($role): void {
            $role->menus()->detach();
            $role->delete();
        });
    }

    private function isSystemRole(Role $role): bool
    {
        return in_array($role->code, self::SYSTEM_ROLE_CODES, true);
    }

    private function abortWithMessage(string $message): never
    {
        throw new HttpResponseException(response()->json([
            'message' => $message,
        ], 422));
    }
}
