<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\AuthorizesRoleAccess;
use App\Http\Requests\StorePeriodRequest;
use App\Http\Requests\UpdatePeriodRequest;
use App\Models\Period;
use App\Services\ScopeResolverService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PeriodController extends Controller
{
    use AuthorizesRoleAccess;

    public function __construct(
        private readonly ScopeResolverService $scopeResolver,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canViewPeriods($request->user()));

        $perPage = max(1, min((int) $request->integer('per_page', 5), 100));
        $search = trim((string) $request->string('search', ''));
        $year = trim((string) $request->string('year', ''));
        $status = trim((string) $request->string('status', ''));
        $type = trim((string) $request->string('type', ''));
        $targetBand = trim((string) $request->string('target_band', ''));

        $query = Period::query()
            ->with('yearlyTarget')
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($scoped) use ($search): void {
                    $scoped->where('name', 'like', "%{$search}%")
                        ->orWhere('note', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('year', 'like', "%{$search}%");
                });
            })
            ->when($year !== '', fn ($builder) => $builder->where('year', (int) $year))
            ->when($status !== '', fn ($builder) => $builder->where('status', $status))
            ->when($type !== '', fn ($builder) => $builder->where('type', $type))
            ->when($targetBand !== '', function ($builder) use ($targetBand): void {
                $builder->whereHas('yearlyTarget', function ($targetQuery) use ($targetBand): void {
                    if ($targetBand === 'HIGH') {
                        $targetQuery->where('target_value', '>=', 80);
                        return;
                    }

                    if ($targetBand === 'MEDIUM') {
                        $targetQuery->whereBetween('target_value', [50, 79]);
                        return;
                    }

                    $targetQuery->where('target_value', '<', 50);
                });
            })
            ->orderByDesc('year')
            ->orderByDesc('id');

        $records = $query->paginate($perPage)->withQueryString();

        $years = Period::query()
            ->orderByDesc('year')
            ->pluck('year')
            ->map(fn ($item) => (string) $item)
            ->all();

        return response()->json([
            'data' => collect($records->items())->map(fn (Period $period) => $this->transformPeriod($period))->all(),
            'meta' => [
                'page' => $records->currentPage(),
                'perPage' => $records->perPage(),
                'total' => $records->total(),
                'totalPages' => $records->lastPage(),
                'from' => $records->firstItem() ?? 0,
                'to' => $records->lastItem() ?? 0,
            ],
            'filters' => [
                'years' => array_map(fn (string $value) => ['value' => $value, 'label' => $value], $years),
            ],
        ]);
    }

    public function show(Request $request, Period $period): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canViewPeriods($request->user()));

        $period->load('yearlyTarget');

        return response()->json([
            'data' => $this->transformPeriod($period),
        ]);
    }

    public function store(StorePeriodRequest $request): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManagePeriods($request->user()));

        $period = DB::transaction(function () use ($request): Period {
            $validated = $request->validated();
            $status = $validated['status'];

            $period = Period::query()->create([
                'year' => $validated['year'],
                'name' => $validated['name'],
                'type' => $validated['type'],
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'status' => $status,
                'is_active' => $status === 'ACTIVE',
                'description' => $validated['note'] ?? null,
                'note' => $validated['note'] ?? null,
            ]);

            $period->yearlyTarget()->create([
                'target_value' => $validated['target_percentage'],
            ]);

            return $period->load('yearlyTarget');
        });

        return response()->json([
            'message' => 'Periode berhasil dibuat.',
            'data' => $this->transformPeriod($period),
        ], 201);
    }

    public function update(UpdatePeriodRequest $request, Period $period): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManagePeriods($request->user()));

        $period = DB::transaction(function () use ($request, $period): Period {
            $validated = $request->validated();
            $status = $validated['status'];

            $period->update([
                'year' => $validated['year'],
                'name' => $validated['name'],
                'type' => $validated['type'],
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'status' => $status,
                'is_active' => $status === 'ACTIVE',
                'description' => $validated['note'] ?? null,
                'note' => $validated['note'] ?? null,
            ]);

            $period->yearlyTarget()->updateOrCreate(
                ['period_id' => $period->id],
                ['target_value' => $validated['target_percentage']],
            );

            return $period->fresh()->load('yearlyTarget');
        });

        return response()->json([
            'message' => 'Periode berhasil diperbarui.',
            'data' => $this->transformPeriod($period),
        ]);
    }

    public function updateStatus(Request $request, Period $period): JsonResponse
    {
        $this->abortUnlessRole($this->scopeResolver->canManagePeriods($request->user()));

        $validated = $request->validate([
            'status' => ['required', 'in:ACTIVE,CLOSED,DRAFT'],
        ]);

        $period->update([
            'status' => $validated['status'],
            'is_active' => $validated['status'] === 'ACTIVE',
        ]);

        return response()->json([
            'message' => 'Status periode berhasil diperbarui.',
            'data' => $this->transformPeriod($period->fresh()->load('yearlyTarget')),
        ]);
    }

    private function transformPeriod(Period $period): array
    {
        return [
            'id' => $period->id,
            'year' => $period->year,
            'name' => $period->name ?: sprintf('Periode Tahunan %s', $period->year),
            'type' => $period->type ?: 'REGULAR',
            'startDate' => optional($period->start_date)->format('Y-m-d'),
            'endDate' => optional($period->end_date)->format('Y-m-d'),
            'targetPercentage' => (int) ($period->yearlyTarget?->target_value ?? 0),
            'status' => $period->status ?: ($period->is_active ? 'ACTIVE' : 'DRAFT'),
            'note' => $period->note ?? $period->description ?? '',
            'updatedAt' => optional($period->updated_at)->toIso8601String() ?? optional($period->created_at)->toIso8601String() ?? now()->toIso8601String(),
            'updatedBy' => 'Admin Settings',
        ];
    }
}
