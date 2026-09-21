<?php

namespace App\Http\Controllers\Kader;

use App\Http\Controllers\Controller;
use App\Http\Requests\Kader\UpdatePasswordRequest;
use App\Http\Requests\Kader\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Survey;

class ProfileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing(['district', 'puskesmas', 'village', 'role']);

        $totalSubmittedSurveys = Survey::query()
            ->where('surveyor_user_id', $user->id)
            ->whereNotIn('status', ['DRAFT', 'NEEDS_SYNC']) // assuming drafts are not submitted
            ->count();

        $pendingDrafts = Survey::query()
            ->where('surveyor_user_id', $user->id)
            ->whereIn('status', ['DRAFT', 'NEEDS_SYNC', 'READY_SUBMIT'])
            ->count();

        $totalManagedHouseholds = Survey::query()
            ->where('surveyor_user_id', $user->id)
            ->join('mstr_respondents', 'trx_surveys.respondent_id', '=', 'mstr_respondents.id')
            ->distinct('mstr_respondents.household_id')
            ->count('mstr_respondents.household_id');

        $villages = [];
        if ($user->village) {
            $villages[] = $user->village->name;
        }

        return response()->json([
            'id' => $user->id,
            'fullName' => $user->full_name,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role?->name ?? 'Kader Survei',
            'puskesmasName' => $user->puskesmas?->name ?? '-',
            'districtName' => $user->district?->name ?? '-',
            'villages' => $villages,
            'coverageArea' => $user->coverage_area ?? 'Area Penugasan',
            'totalManagedHouseholds' => $totalManagedHouseholds,
            'totalSubmittedSurveys' => $totalSubmittedSurveys,
            'pendingDrafts' => $pendingDrafts,
            'syncStatus' => 'SYNCED',
            'lastSyncAt' => now()->toIso8601String(),
            'deviceLabel' => 'Web Browser',
            'joinedAt' => $user->created_at?->toIso8601String() ?? now()->toIso8601String(),
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        $user->update([
            'full_name' => $request->validated('full_name'),
            'phone' => $request->validated('phone'),
            'email' => $request->validated('email'),
        ]);

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => $user
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        $user->update([
            'password' => Hash::make($request->validated('password')),
        ]);

        return response()->json([
            'message' => 'Password berhasil diperbarui.'
        ]);
    }
}
