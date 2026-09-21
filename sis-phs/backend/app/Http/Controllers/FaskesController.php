<?php

namespace App\Http\Controllers;

use App\Models\Faskes;
use Illuminate\Http\Request;

class FaskesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Faskes::withCount(['villages', 'kaders as cadre_count'])->withSum('kaders as household_coverage', 'coverage_area');

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('district_name', 'like', "%{$search}%")
                  ->orWhere('village_focus', 'like', "%{$search}%");
            });
        }

        if ($request->has('districtId') && $request->districtId != '') {
            $query->where('district_id', $request->districtId);
        }

        if ($request->has('type') && $request->type != '') {
            $query->where('type', $request->type);
        }

        if ($request->has('cadreStatus') && $request->cadreStatus != '') {
            if ($request->cadreStatus === 'WITH_CADRE') {
                $query->where('cadre_count', '>', 0);
            } else {
                $query->where('cadre_count', 0);
            }
        }

        if ($request->has('status') && $request->status != '') {
            $isActive = $request->status === 'active';
            $query->where('is_active', $isActive);
        }

        $query->orderBy('name', 'asc');

        $perPage = $request->input('perPage', 5);
        $paginator = $query->paginate($perPage);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'page' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'totalPages' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:mstr_faskes,code',
            'name' => 'required|string',
            'type' => 'required|in:PUSKESMAS,PUSTU,POSKESDES',
            'district_id' => 'nullable|string',
            'district_name' => 'nullable|string',
            'regency_name' => 'nullable|string',
            'village_focus' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'is_active' => 'boolean',
            'cadre_count' => 'integer',
            'household_coverage' => 'integer',
        ]);

        $faskes = Faskes::create($validated);

        return response()->json(['data' => $faskes], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $faskes = Faskes::withCount(['villages', 'kaders as cadre_count'])->withSum('kaders as household_coverage', 'coverage_area')->findOrFail($id);
        return response()->json(['data' => $faskes]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $faskes = Faskes::findOrFail($id);

        $validated = $request->validate([
            'code' => 'required|string|unique:mstr_faskes,code,' . $faskes->id,
            'name' => 'required|string',
            'type' => 'required|in:PUSKESMAS,PUSTU,POSKESDES',
            'district_id' => 'nullable|string',
            'district_name' => 'nullable|string',
            'regency_name' => 'nullable|string',
            'village_focus' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'is_active' => 'boolean',
            'cadre_count' => 'integer',
            'household_coverage' => 'integer',
        ]);

        $faskes->update($validated);

        return response()->json(['data' => $faskes]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $faskes = Faskes::findOrFail($id);
        $faskes->delete();

        return response()->json(null, 204);
    }

    public function stats()
    {
        $total = Faskes::count();
        $active = Faskes::where('is_active', true)->count();
        $puskesmas = Faskes::where('type', 'PUSKESMAS')->count();
        $supporting = Faskes::where('type', '!=', 'PUSKESMAS')->count();

        return response()->json([
            'data' => [
                'total' => $total,
                'active' => $active,
                'puskesmas' => $puskesmas,
                'supporting' => $supporting,
            ]
        ]);
    }

    public function villages($id)
    {
        $faskes = Faskes::findOrFail($id);
        return response()->json(['data' => $faskes->villages()->orderBy('name')->get()]);
    }

    public function addVillage(Request $request, $id)
    {
        $validated = $request->validate([
            'village_id' => 'required|string|exists:reg_villages,id'
        ]);

        $faskes = Faskes::findOrFail($id);

        if ($faskes->villages()->where('village_id', $validated['village_id'])->exists()) {
            return response()->json(['message' => 'Desa ini sudah dipetakan ke faskes tersebut.'], 422);
        }

        $faskes->villages()->attach($validated['village_id']);

        return response()->json(['message' => 'Desa berhasil dipetakan.'], 200);
    }

    public function removeVillage($id, $villageId)
    {
        $faskes = Faskes::findOrFail($id);
        $faskes->villages()->detach($villageId);

        return response()->json(['message' => 'Pemetaan desa berhasil dihapus.'], 200);
    }

    public function kaders($id)
    {
        $faskes = Faskes::findOrFail($id);
        $kaders = \App\Models\User::whereHas('role', function($q) {
            $q->where('code', 'kader');
        })->where('puskesmas_id', $id)->orderBy('name')->get();

        return response()->json(['data' => $kaders]);
    }
}
