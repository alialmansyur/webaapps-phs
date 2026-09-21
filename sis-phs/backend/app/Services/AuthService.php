<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        private readonly ScopeResolverService $scopeResolver,
    ) {
    }

    public function login(string $username, string $password, string $deviceName = 'web'): array
    {
        $user = User::query()
            ->with(['role', 'district', 'puskesmas', 'village'])
            ->where('username', $username)
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Username atau password tidak valid.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'username' => ['Akun tidak aktif. Hubungi administrator.'],
            ]);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        return [
            'token' => $user->createToken($deviceName)->plainTextToken,
            'user' => $this->buildMePayload($user->fresh(['role', 'district', 'puskesmas', 'village'])),
        ];
    }

    public function buildMePayload(User $user): array
    {
        $role = $user->role;
        $menus = $role
            ? $role->menus()
                ->with(['parent:id,code,title,path,sort_order,context_group'])
                ->where('menus.is_active', true)
                ->orderBy('menus.parent_id')
                ->orderBy('menus.sort_order')
                ->get(['menus.id', 'menus.parent_id', 'menus.code', 'menus.title', 'menus.path', 'menus.sort_order', 'menus.context_group'])
            : collect();
        $menuTree = $this->buildMenuTree($menus);

        return [
            'id' => $user->id,
            'name' => $user->full_name,
            'username' => $user->username,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'duty_location' => $user->puskesmas?->name ?? $user->village?->name ?? $user->district?->name,
            'is_active' => $user->is_active,
            'must_reset_password' => $user->must_reset_password,
            'role' => $role ? ['id' => $role->id, 'code' => $role->code, 'name' => $role->name] : null,
            'roles' => $role ? [$role->code] : [],
            'permissions' => $menus->pluck('code')->values()->all(),
            'menus' => $menus->map(fn ($menu) => [
                'id' => $menu->id,
                'code' => $menu->code,
                'parent_code' => $menu->parent?->code,
                'title' => $menu->title,
                'path' => $menu->path,
                'context_group' => $menu->context_group,
            ])->values()->all(),
            'menu_tree' => $menuTree,
            'scope' => $this->scopeResolver->scopeSummary($user),
        ];
    }

    private function buildMenuTree(Collection $menus): array
    {
        return $menus
            ->sortBy(fn ($menu) => sprintf(
                '%05d-%05d-%s',
                $menu->parent?->sort_order ?? $menu->sort_order,
                $menu->sort_order,
                $menu->code
            ))
            ->groupBy(fn ($menu) => $menu->parent?->code ?? $menu->code)
            ->map(function (Collection $group): array {
                $first = $group->first();
                $parent = $first?->parent;

                if ($parent) {
                    return [
                        'id' => $parent->code,
                        'code' => $parent->code,
                        'title' => $parent->title,
                        'path' => $parent->path,
                        'context_group' => $parent->context_group,
                        'children' => $group
                            ->sortBy('sort_order')
                            ->values()
                            ->map(fn ($menu) => [
                                'id' => $menu->code,
                                'code' => $menu->code,
                                'title' => $menu->title,
                                'path' => $menu->path,
                                'context_group' => $menu->context_group,
                            ])
                            ->all(),
                    ];
                }

                return [
                    'id' => $first->code,
                    'code' => $first->code,
                    'title' => $first->title,
                    'path' => $first->path,
                    'context_group' => $first->context_group,
                    'children' => [],
                ];
            })
            ->values()
            ->all();
    }

    public function createResetToken(string $identity): array
    {
        $user = User::query()
            ->where('username', $identity)
            ->orWhere('email', $identity)
            ->firstOrFail();

        $token = Password::broker()->createToken($user);

        return [
            'username' => $user->username,
            'email' => $user->email,
            'token' => $token,
        ];
    }

    public function resetPassword(string $username, string $token, string $password): void
    {
        $status = Password::reset(
            [
                'username' => $username,
                'password' => $password,
                'password_confirmation' => $password,
                'token' => $token,
                'email' => User::query()->where('username', $username)->value('email'),
            ],
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'must_reset_password' => false,
                    'remember_token' => Str::random(60),
                ])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'token' => [__($status)],
            ]);
        }
    }
}
