<?php

namespace App\Http\Controllers;

use App\Models\District;
use App\Models\Faskes;
use App\Models\Puskesmas;
use App\Models\Role;
use App\Models\Village;
use App\Services\ScopeResolverService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LookupController extends Controller
{
    public function __construct(
        private readonly ScopeResolverService $scopeResolver,
    ) {
    }

    public function roles(): JsonResponse
    {
        return response()->json([
            'data' => Role::query()->where('is_active', true)->orderBy('id')->get(['id', 'code as value', 'name as label']),
        ]);
    }

    public function districts(Request $request): JsonResponse
    {
        $query = District::query()->orderBy('name');

        if ($request->user() && $this->scopeResolver->roleCode($request->user()) !== 'admin' && $request->user()->district_id) {
            $query->where('id', $request->user()->district_id);
        }

        if ($request->has('search') && $request->search != '') {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json(['data' => $query->get()]);
    }

    public function puskesmas(Request $request): JsonResponse
    {
        $query = Puskesmas::query()->orderBy('name');

        if ($request->filled('district_id')) {
            $query->where('district_id', $request->query('district_id'));
        }

        if ($request->user() && $this->scopeResolver->roleCode($request->user()) !== 'admin') {
            $allowed = $this->scopeResolver->allowedPuskesmasIds($request->user());
            if (! empty($allowed)) {
                $query->whereIn('id', $allowed);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        return response()->json(['data' => $query->get()]);
    }

    public function faskes(Request $request): JsonResponse
    {
        $query = Faskes::query()->where('is_active', true)->orderBy('name');

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('district_id')) {
            $query->where('district_id', $request->query('district_id'));
        }

        if ($request->has('search') && $request->search != '') {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json(['data' => $query->get()]);
    }

    public function villages(Request $request): JsonResponse
    {
        $query = Village::query()->orderBy('name');

        if ($request->filled('district_id')) {
            $query->where('district_id', $request->query('district_id'));
        }

        if ($request->filled('puskesmas_id')) {
            $puskesmasId = (int) $request->query('puskesmas_id');
            $query->whereHas('puskesmas', fn ($builder) => $builder->where('puskesmas.id', $puskesmasId));
        }

        if ($request->filled('faskes_id')) {
            $faskesId = (int) $request->query('faskes_id');
            $query->whereHas('faskes', fn ($builder) => $builder->where('mstr_faskes.id', $faskesId));
        }

        if ($request->has('search') && $request->search != '') {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->user() && $this->scopeResolver->roleCode($request->user()) !== 'admin') {
            if ($request->user()->village_id) {
                $query->where('id', $request->user()->village_id);
            } else {
                $allowed = $this->scopeResolver->allowedPuskesmasIds($request->user());
                if (! empty($allowed)) {
                    $query->where(function ($q) use ($allowed) {
                        $q->whereHas('puskesmas', fn ($builder) => $builder->whereIn('puskesmas.id', $allowed))
                          ->orWhereHas('faskes', fn ($builder) => $builder->whereIn('mstr_faskes.id', $allowed));
                    });
                }
            }
        }

        return response()->json(['data' => $query->get()]);
    }
}
