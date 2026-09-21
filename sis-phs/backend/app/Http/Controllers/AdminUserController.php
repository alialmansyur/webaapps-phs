<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\AuthorizesRoleAccess;
use App\Http\Requests\StoreAdminUserRequest;
use App\Http\Requests\UpdateAdminUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class AdminUserController extends BaseUserController
{
    use AuthorizesRoleAccess;

    public function index(Request $request): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageAdminUsers($request->user()));
        $records = $this->userManagementService->listAdminUsers($request->user(), $request->all());

        return response()->json($this->paginatedUserResponse($records, false));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageAdminUsers($request->user()));
        $user = User::query()->with(['role', 'district', 'puskesmas'])->findOrFail($id);

        return response()->json(['data' => $this->transformAdminUser($user)]);
    }

    public function store(StoreAdminUserRequest $request): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageAdminUsers($request->user()));
        $user = $this->userManagementService->upsertAdminUser($request->validated());
        $this->activityLogService->log($request->user(), 'admin-user.created', 'user', $user->id, ['username' => $user->username], $request);

        return response()->json(['message' => 'User admin berhasil dibuat.', 'data' => $this->transformAdminUser($user)], 201);
    }

    public function update(UpdateAdminUserRequest $request, int $id): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageAdminUsers($request->user()));
        $user = User::query()->findOrFail($id);
        $user = $this->userManagementService->upsertAdminUser($request->validated(), $user);

        return response()->json(['message' => 'User admin berhasil diperbarui.', 'data' => $this->transformAdminUser($user)]);
    }

    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageAdminUsers($request->user()));
        $user = User::query()->findOrFail($id);
        $token = Password::broker()->createToken($user);

        return response()->json([
            'message' => 'Token reset password berhasil dibuat.',
            'data' => ['username' => $user->username, 'token' => $token],
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageAdminUsers($request->user()));
        $validated = $request->validate(['is_active' => ['required', 'boolean']]);
        $user = $this->userManagementService->setStatus(User::query()->findOrFail($id), $validated['is_active']);

        return response()->json(['message' => 'Status user berhasil diperbarui.', 'data' => $this->transformAdminUser($user)]);
    }
}
