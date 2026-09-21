<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\AuthorizesRoleAccess;
use App\Http\Requests\SyncRoleMenuRequest;
use App\Models\Role;
use App\Services\RoleMenuService;
use App\Services\ScopeResolverService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RbacController extends Controller
{
    use AuthorizesRoleAccess;

    public function __construct(
        private readonly RoleMenuService $roleMenuService,
        private readonly ScopeResolverService $scopeResolver,
    ) {
    }

    public function roles(Request $request): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageAdminUsers($request->user()));

        return response()->json([
            'data' => $this->roleMenuService->matrix()['roles'],
        ]);
    }

    public function menus(Request $request): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageAdminUsers($request->user()));

        return response()->json([
            'data' => $this->roleMenuService->matrix()['menu_groups'],
        ]);
    }

    public function matrix(Request $request): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageAdminUsers($request->user()));

        return response()->json($this->roleMenuService->matrix());
    }

    public function sync(SyncRoleMenuRequest $request): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageAdminUsers($request->user()));
        $this->roleMenuService->syncMatrix($request->validated('role_menus'));

        return response()->json(['message' => 'Matriks role-menu berhasil disimpan.']);
    }

    public function storeRole(Request $request): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageAdminUsers($request->user()));

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:ACTIVE,INACTIVE'],
        ]);

        $role = $this->roleMenuService->createRole($validated);

        return response()->json([
            'message' => 'Role berhasil dibuat.',
            'data' => $role,
        ], 201);
    }

    public function updateRole(Request $request, Role $role): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageAdminUsers($request->user()));

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:ACTIVE,INACTIVE'],
        ]);

        $updatedRole = $this->roleMenuService->updateRole($role, $validated);

        return response()->json([
            'message' => 'Role berhasil diperbarui.',
            'data' => $updatedRole,
        ]);
    }

    public function destroyRole(Request $request, Role $role): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageAdminUsers($request->user()));

        $this->roleMenuService->deleteRole($role);

        return response()->json([
            'message' => 'Role berhasil dihapus.',
        ]);
    }
}
