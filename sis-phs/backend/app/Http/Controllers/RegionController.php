<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\AuthorizesRoleAccess;
use App\Http\Requests\ImportRegionRequest;
use App\Http\Requests\StoreRegionRequest;
use App\Http\Requests\UpdateRegionRequest;
use App\Services\RegionManagementService;
use App\Services\ScopeResolverService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegionController extends Controller
{
    use AuthorizesRoleAccess;

    public function __construct(
        private readonly ScopeResolverService $scopeResolver,
        private readonly RegionManagementService $regionManagementService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canViewRegions($request->user()));

        $records = $this->regionManagementService->paginate($request->all());

        return response()->json([
            'data' => $records->items(),
            'meta' => [
                'page' => $records->currentPage(),
                'perPage' => $records->perPage(),
                'total' => $records->total(),
                'totalPages' => $records->lastPage(),
                'from' => $records->firstItem() ?? 0,
                'to' => $records->lastItem() ?? 0,
            ],
            'filters' => $this->regionManagementService->options((string) $request->query('level', '')),
        ]);
    }

    public function show(Request $request, string $level, string $regionId): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canViewRegions($request->user()));

        return response()->json([
            'data' => $this->regionManagementService->detail($level, $regionId),
        ]);
    }

    public function store(StoreRegionRequest $request): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageRegions($request->user()));

        return response()->json([
            'message' => 'Wilayah berhasil dibuat.',
            'data' => $this->regionManagementService->store($request->validated()),
        ], 201);
    }

    public function update(UpdateRegionRequest $request, string $level, string $regionId): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageRegions($request->user()));

        return response()->json([
            'message' => 'Wilayah berhasil diperbarui.',
            'data' => $this->regionManagementService->update($level, $regionId, $request->validated()),
        ]);
    }

    public function import(ImportRegionRequest $request): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageRegions($request->user()));
        $result = $this->regionManagementService->import($request->file('file'));

        return response()->json([
            'message' => 'Import wilayah selesai diproses.',
            'data' => $result,
        ]);
    }

    public function destroy(Request $request, string $level, string $regionId): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManageRegions($request->user()));

        $this->regionManagementService->destroy($level, $regionId);

        return response()->json([
            'message' => 'Wilayah berhasil dihapus.',
        ]);
    }
}
