<?php

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\KaderUserController;
use App\Http\Controllers\LookupController;
use App\Http\Controllers\PeriodController;
use App\Http\Controllers\RbacController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\AdminInterventionController;
use App\Http\Controllers\Kader\SurveyController;
use App\Http\Controllers\DashboardController;
use App\Http\Middleware\EnsureRoleIsKader;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::prefix('admin/rbac')->group(function (): void {
        Route::get('roles', [RbacController::class, 'roles']);
        Route::post('roles', [RbacController::class, 'storeRole']);
        Route::put('roles/{role:code}', [RbacController::class, 'updateRole']);
        Route::delete('roles/{role:code}', [RbacController::class, 'destroyRole']);
        Route::get('menus', [RbacController::class, 'menus']);
        Route::get('matrix', [RbacController::class, 'matrix']);
        Route::put('matrix', [RbacController::class, 'sync']);
    });

    Route::prefix('admin/settings/periods')->group(function (): void {
        Route::get('', [PeriodController::class, 'index']);
        Route::post('', [PeriodController::class, 'store']);
        Route::get('{period}', [PeriodController::class, 'show']);
        Route::put('{period}', [PeriodController::class, 'update']);
        Route::patch('{period}/status', [PeriodController::class, 'updateStatus']);
    });

    Route::prefix('admin/master/regions')->group(function (): void {
        Route::get('', [RegionController::class, 'index']);
        Route::post('', [RegionController::class, 'store']);
        Route::post('import', [RegionController::class, 'import']);
        Route::get('{level}/{regionId}', [RegionController::class, 'show']);
        Route::put('{level}/{regionId}', [RegionController::class, 'update']);
        Route::delete('{level}/{regionId}', [RegionController::class, 'destroy']);
    });

    Route::prefix('admin/master/faskes')->group(function (): void {
        Route::get('stats', [\App\Http\Controllers\FaskesController::class, 'stats']);
        Route::get('', [\App\Http\Controllers\FaskesController::class, 'index']);
        Route::post('', [\App\Http\Controllers\FaskesController::class, 'store']);
        Route::get('{id}', [\App\Http\Controllers\FaskesController::class, 'show']);
        Route::put('{id}', [\App\Http\Controllers\FaskesController::class, 'update']);
        Route::delete('{id}', [\App\Http\Controllers\FaskesController::class, 'destroy']);
        
        Route::get('{id}/villages', [\App\Http\Controllers\FaskesController::class, 'villages']);
        Route::post('{id}/villages', [\App\Http\Controllers\FaskesController::class, 'addVillage']);
        Route::delete('{id}/villages/{villageId}', [\App\Http\Controllers\FaskesController::class, 'removeVillage']);

        Route::get('{id}/kaders', [\App\Http\Controllers\FaskesController::class, 'kaders']);
    });

    Route::prefix('admin/master/questions')->group(function (): void {
        Route::get('', [QuestionController::class, 'index']);
        Route::post('', [QuestionController::class, 'store']);
        Route::get('{id}', [QuestionController::class, 'show']);
        Route::put('{id}', [QuestionController::class, 'update']);
        Route::delete('{id}', [QuestionController::class, 'destroy']);
    });

    Route::prefix('admin/users/admin')->group(function (): void {
        Route::get('', [AdminUserController::class, 'index']);
        Route::post('', [AdminUserController::class, 'store']);
        Route::get('{id}', [AdminUserController::class, 'show']);
        Route::put('{id}', [AdminUserController::class, 'update']);
        Route::post('{id}/reset-password', [AdminUserController::class, 'resetPassword']);
        Route::patch('{id}/status', [AdminUserController::class, 'updateStatus']);
    });

    Route::prefix('admin/users/kader')->group(function (): void {
        Route::get('', [KaderUserController::class, 'index']);
        Route::post('', [KaderUserController::class, 'store']);
        Route::get('{id}', [KaderUserController::class, 'show']);
        Route::put('{id}', [KaderUserController::class, 'update']);
        Route::post('{id}/reset-password', [KaderUserController::class, 'resetPassword']);
        Route::patch('{id}/status', [KaderUserController::class, 'updateStatus']);
    });

    Route::prefix('admin/surveys/interventions')->group(function (): void {
        Route::get('', [AdminInterventionController::class, 'index']);
        Route::post('', [AdminInterventionController::class, 'store']);
        Route::put('{id}', [AdminInterventionController::class, 'update']);
        Route::delete('{id}', [AdminInterventionController::class, 'destroy']);
    });

    Route::prefix('admin/reports')->group(function (): void {
        Route::get('survey-progress/options', [\App\Http\Controllers\AdminReportSurveyProgressController::class, 'options']);
        Route::get('survey-progress/stats', [\App\Http\Controllers\AdminReportSurveyProgressController::class, 'stats']);
        Route::get('survey-progress', [\App\Http\Controllers\AdminReportSurveyProgressController::class, 'index']);

        Route::get('survey-indicators/options', [\App\Http\Controllers\AdminReportSurveyIndicatorsController::class, 'options']);
        Route::get('survey-indicators/stats', [\App\Http\Controllers\AdminReportSurveyIndicatorsController::class, 'stats']);
        Route::get('survey-indicators', [\App\Http\Controllers\AdminReportSurveyIndicatorsController::class, 'index']);

        Route::get('phs-kabupaten/options', [\App\Http\Controllers\AdminReportPhsKabupatenController::class, 'options']);
        Route::get('phs-kabupaten/stats', [\App\Http\Controllers\AdminReportPhsKabupatenController::class, 'stats']);
        Route::get('phs-kabupaten', [\App\Http\Controllers\AdminReportPhsKabupatenController::class, 'index']);

        Route::get('iks/options', [\App\Http\Controllers\AdminReportIksController::class, 'options']);
        Route::get('iks/stats', [\App\Http\Controllers\AdminReportIksController::class, 'stats']);
        Route::get('iks', [\App\Http\Controllers\AdminReportIksController::class, 'index']);

        Route::get('rankings/options', [\App\Http\Controllers\AdminReportRankingsController::class, 'options']);
        Route::get('rankings/stats', [\App\Http\Controllers\AdminReportRankingsController::class, 'stats']);
        Route::get('rankings', [\App\Http\Controllers\AdminReportRankingsController::class, 'index']);
    });

    Route::middleware(EnsureRoleIsKader::class)->group(function (): void {
        Route::prefix('kader/surveys')->group(function (): void {
            Route::get('questions', [SurveyController::class, 'questions']);
            Route::post('check-nik', [SurveyController::class, 'checkNik']);
            Route::get('history', [SurveyController::class, 'history']);
            Route::get('history/{surveyId}', [SurveyController::class, 'historyDetail']);
            Route::post('', [SurveyController::class, 'store']);
        });

        Route::prefix('kader/interventions')->group(function (): void {
            Route::get('', [\App\Http\Controllers\Api\InterventionController::class, 'index']);
            Route::get('log', [\App\Http\Controllers\Api\InterventionController::class, 'log']);
            Route::post('', [\App\Http\Controllers\Api\InterventionController::class, 'store']);
        });

        Route::prefix('kader/profile')->group(function (): void {
            Route::apiResource('wilayah', \App\Http\Controllers\Kader\WilayahController::class)->except(['show']);
        });

        Route::get('kader/dashboard', [DashboardController::class, 'kader']);
    });

    Route::prefix('puskesmas/surveys')->group(function (): void {
        Route::get('verification', [\App\Http\Controllers\Puskesmas\SurveyVerificationController::class, 'index']);
        Route::post('verification/{id}/decision', [\App\Http\Controllers\Puskesmas\SurveyVerificationController::class, 'decision']);
    });

    Route::prefix('kader/profile')->group(function (): void {
        Route::get('', [\App\Http\Controllers\Kader\ProfileController::class, 'index']);
        Route::put('', [\App\Http\Controllers\Kader\ProfileController::class, 'update']);
        Route::put('password', [\App\Http\Controllers\Kader\ProfileController::class, 'updatePassword']);
    });

    Route::prefix('lookups')->group(function (): void {
        Route::get('roles', [LookupController::class, 'roles']);
        Route::get('districts', [LookupController::class, 'districts']);
        Route::get('puskesmas', [LookupController::class, 'puskesmas']);
        Route::get('faskes', [LookupController::class, 'faskes']);
        Route::get('villages', [LookupController::class, 'villages']);
    });

    Route::get('puskesmas/dashboard', [DashboardController::class, 'puskesmas']);
    Route::get('dinkes/dashboard', [DashboardController::class, 'dinkes']);
    Route::get('admin/dashboard', [DashboardController::class, 'admin']);
});
