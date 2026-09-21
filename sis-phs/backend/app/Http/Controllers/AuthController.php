<?php

namespace App\Http\Controllers;

use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Services\ActivityLogService;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
        private readonly ActivityLogService $activityLogService,
    ) {
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $payload = $this->authService->login(
            $request->validated('username'),
            $request->validated('password'),
            $request->input('device_name', 'web'),
        );

        $this->activityLogService->log(
            $request->user(),
            'auth.login',
            'user',
            $payload['user']['id'],
            ['username' => $payload['user']['username']],
            $request
        );

        return response()->json($payload);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logout berhasil.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()?->loadMissing(['role', 'district', 'puskesmas', 'village']);

        return response()->json($this->authService->buildMePayload($user));
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $identity = $request->validated('email') ?: $request->validated('username');
        abort_unless($identity, 422, 'Username atau email wajib diisi.');
        $payload = $this->authService->createResetToken($identity);

        return response()->json([
            'message' => 'Token reset password berhasil dibuat untuk environment pengembangan.',
            'data' => $payload,
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $this->authService->resetPassword(
            $request->validated('username'),
            $request->validated('token'),
            $request->validated('password'),
        );

        return response()->json(['message' => 'Password berhasil direset.']);
    }
}
