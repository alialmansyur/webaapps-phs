<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\AuthorizesRoleAccess;
use App\Http\Requests\StoreKaderUserRequest;
use App\Http\Requests\UpdateKaderUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class KaderUserController extends BaseUserController
{
    use AuthorizesRoleAccess;

    public function index(Request $request): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageKaderUsers($request->user()));
        $records = $this->userManagementService->listKaderUsers($request->user(), $request->all());

        return response()->json($this->paginatedUserResponse($records, true));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageKaderUsers($request->user()));
        $user = User::query()->with(['role', 'district', 'puskesmas', 'village'])->findOrFail($id);

        return response()->json(['data' => $this->transformKaderUser($user)]);
    }

    public function store(StoreKaderUserRequest $request): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageKaderUsers($request->user()));
        $user = $this->userManagementService->upsertKaderUser($request->validated());

        return response()->json(['message' => 'User kader berhasil dibuat.', 'data' => $this->transformKaderUser($user)], 201);
    }

    public function update(UpdateKaderUserRequest $request, int $id): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageKaderUsers($request->user()));
        $user = User::query()->findOrFail($id);
        $user = $this->userManagementService->upsertKaderUser($request->validated(), $user);

        return response()->json(['message' => 'User kader berhasil diperbarui.', 'data' => $this->transformKaderUser($user)]);
    }

    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageKaderUsers($request->user()));
        $user = User::query()->findOrFail($id);
        $token = Password::broker()->createToken($user);

        return response()->json([
            'message' => 'Token reset password berhasil dibuat.',
            'data' => ['username' => $user->username, 'token' => $token],
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageKaderUsers($request->user()));
        $validated = $request->validate(['is_active' => ['required', 'boolean']]);
        $user = $this->userManagementService->setStatus(User::query()->findOrFail($id), $validated['is_active']);

        return response()->json(['message' => 'Status user berhasil diperbarui.', 'data' => $this->transformKaderUser($user)]);
    }
}
