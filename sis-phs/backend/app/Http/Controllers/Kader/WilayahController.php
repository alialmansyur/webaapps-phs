<?php

namespace App\Http\Controllers\Kader;

use App\Http\Controllers\Controller;
use App\Models\KaderRegion;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class WilayahController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $perPage = $request->query('per_page', 5);
        $search = $request->query('search', '');
        $districtId = $request->query('districtId', '');
        $villageId = $request->query('villageId', '');

        $query = KaderRegion::with('village.district')
            ->where('user_id', $user->id);

        if (!empty($villageId)) {
            $query->where('village_id', $villageId);
        } elseif (!empty($districtId)) {
            $query->whereHas('village', function ($q) use ($districtId) {
                $q->where('district_id', $districtId);
            });
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('rt', 'like', "%{$search}%")
                  ->orWhere('rw', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('village', function ($qv) use ($search) {
                      $qv->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $regions = $query->paginate($perPage);
        $metrics = $this->buildRegionMetrics($regions->getCollection());

        $regions->getCollection()->transform(function ($region) use ($metrics) {
            $metric = $metrics[$this->regionKey($region->village_id, $region->rt, $region->rw)] ?? [
                'totalHouseholds' => 0,
                'surveyedHouseholds' => 0,
                'coveragePct' => 0,
                'avgIks' => 0,
                'priorityCount' => 0,
                'healthStatus' => 'TIDAK_SEHAT',
            ];

            return [
                'id' => $region->id,
                'rt' => $region->rt,
                'rw' => $region->rw,
                'villageId' => $region->village_id,
                'villageName' => $region->village ? $region->village->name : '-',
                'districtId' => $region->village && $region->village->district ? $region->village->district->id : null,
                'districtName' => $region->village && $region->village->district ? $region->village->district->name : '-',
                'notes' => $region->notes,
                'totalHouseholds' => $metric['totalHouseholds'],
                'surveyedHouseholds' => $metric['surveyedHouseholds'],
                'coveragePct' => $metric['coveragePct'],
                'avgIks' => $metric['avgIks'],
                'priorityCount' => $metric['priorityCount'],
                'healthStatus' => $metric['healthStatus'],
            ];
        });

        return response()->json([
            'data' => $regions->items(),
            'meta' => [
                'page' => $regions->currentPage(),
                'perPage' => $regions->perPage(),
                'total' => $regions->total(),
                'totalPages' => $regions->lastPage(),
                'from' => $regions->firstItem() ?: 0,
                'to' => $regions->lastItem() ?: 0,
            ]
        ]);
    }

    private function buildRegionMetrics(Collection $regions): array
    {
        if ($regions->isEmpty()) {
            return [];
        }

        $tuples = $regions
            ->map(fn ($region) => [
                'village_id' => $region->village_id,
                'rt' => $region->rt,
                'rw' => $region->rw,
            ])
            ->unique(fn ($region) => $this->regionKey($region['village_id'], $region['rt'], $region['rw']))
            ->values();

        $householdStats = DB::table('mstr_households')
            ->selectRaw('village_id, rt, rw, COUNT(*) as total_households')
            ->where($this->tupleFilter($tuples))
            ->groupBy('village_id', 'rt', 'rw')
            ->get()
            ->keyBy(fn ($row) => $this->regionKey($row->village_id, $row->rt, $row->rw));

        $latestSummaryPerHousehold = DB::table('summary_surveys')
            ->selectRaw('MAX(id) as summary_id')
            ->whereIn('status', ['SUBMITTED', 'APPROVED', 'REVISION'])
            ->groupBy('household_id');

        $surveyStats = DB::table('summary_surveys as ss')
            ->joinSub($latestSummaryPerHousehold, 'latest_summary', function ($join) {
                $join->on('latest_summary.summary_id', '=', 'ss.id');
            })
            ->join('mstr_households as hh', 'hh.id', '=', 'ss.household_id')
            ->selectRaw('hh.village_id, hh.rt, hh.rw, COUNT(*) as surveyed_households, ROUND(AVG(ss.iks_score), 4) as avg_iks, SUM(CASE WHEN ss.iks_score < 1 THEN 1 ELSE 0 END) as priority_count')
            ->where($this->tupleFilter($tuples, 'hh'))
            ->groupBy('hh.village_id', 'hh.rt', 'hh.rw')
            ->get()
            ->keyBy(fn ($row) => $this->regionKey($row->village_id, $row->rt, $row->rw));

        $metrics = [];

        foreach ($tuples as $tuple) {
            $key = $this->regionKey($tuple['village_id'], $tuple['rt'], $tuple['rw']);
            $totalHouseholds = (int) ($householdStats[$key]->total_households ?? 0);
            $surveyedHouseholds = (int) ($surveyStats[$key]->surveyed_households ?? 0);
            $avgIks = round((float) ($surveyStats[$key]->avg_iks ?? 0), 4);
            $priorityCount = (int) ($surveyStats[$key]->priority_count ?? 0);
            $coveragePct = $totalHouseholds > 0 ? (int) round(($surveyedHouseholds / $totalHouseholds) * 100) : 0;

            $metrics[$key] = [
                'totalHouseholds' => $totalHouseholds,
                'surveyedHouseholds' => $surveyedHouseholds,
                'coveragePct' => $coveragePct,
                'avgIks' => $avgIks,
                'priorityCount' => $priorityCount,
                'healthStatus' => $priorityCount === 0 && $surveyedHouseholds > 0 ? 'SEHAT' : 'TIDAK_SEHAT',
            ];
        }

        return $metrics;
    }

    private function tupleFilter(Collection $tuples, string $tableAlias = ''): \Closure
    {
        $prefix = $tableAlias !== '' ? $tableAlias.'.' : '';

        return function ($query) use ($tuples, $prefix) {
            $query->where(function ($orQuery) use ($tuples, $prefix) {
                foreach ($tuples as $tuple) {
                    $orQuery->orWhere(function ($tupleQuery) use ($tuple, $prefix) {
                        $tupleQuery
                            ->where($prefix.'village_id', $tuple['village_id'])
                            ->where($prefix.'rt', $tuple['rt'])
                            ->where($prefix.'rw', $tuple['rw']);
                    });
                }
            });
        };
    }

    private function regionKey(string $villageId, string $rt, string $rw): string
    {
        return implode('|', [$villageId, $rt, $rw]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'village_id' => 'required|string|exists:reg_villages,id',
            'rt' => 'required|string|max:10',
            'rw' => 'required|string|max:10',
            'notes' => 'nullable|string'
        ]);

        $exists = KaderRegion::where('user_id', $request->user()->id)
            ->where('village_id', $request->village_id)
            ->where('rt', $request->rt)
            ->where('rw', $request->rw)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Wilayah binaan untuk RT/RW dan Desa tersebut sudah ada.'], 422);
        }

        $region = KaderRegion::create([
            'user_id' => $request->user()->id,
            'village_id' => $request->village_id,
            'rt' => $request->rt,
            'rw' => $request->rw,
            'notes' => $request->notes,
        ]);

        return response()->json(['data' => $region], 201);
    }

    public function update(Request $request, $id)
    {
        $region = KaderRegion::where('user_id', $request->user()->id)->findOrFail($id);

        $request->validate([
            'village_id' => 'required|string|exists:reg_villages,id',
            'rt' => 'required|string|max:10',
            'rw' => 'required|string|max:10',
            'notes' => 'nullable|string'
        ]);

        $exists = KaderRegion::where('user_id', $request->user()->id)
            ->where('village_id', $request->village_id)
            ->where('rt', $request->rt)
            ->where('rw', $request->rw)
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Wilayah binaan untuk RT/RW dan Desa tersebut sudah ada.'], 422);
        }

        $region->update($request->only(['village_id', 'rt', 'rw', 'notes']));

        return response()->json(['data' => $region]);
    }

    public function destroy(Request $request, $id)
    {
        $region = KaderRegion::where('user_id', $request->user()->id)->findOrFail($id);
        $region->delete();

        return response()->json(['message' => 'Wilayah binaan berhasil dihapus']);
    }
}
