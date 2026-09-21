<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminReportIksController extends Controller
{
    private function buildLevelQuery(Request $request)
    {
        $query = DB::table('reg_villages as v')
            ->join('mstr_faskes_villages as fv', 'v.id', '=', 'fv.village_id')
            ->join('mstr_faskes as f', 'fv.faskes_id', '=', 'f.id')
            ->join('reg_districts as d', 'v.district_id', '=', 'd.id');

        $user = $request->user();
        $isPuskesmas = $user && $user->role && $user->role->code === 'puskesmas';
        if ($isPuskesmas) {
            $query->where('fv.faskes_id', $user->puskesmas_id);
        }

        if ($districtId = $request->query('districtId')) {
            $query->where('v.district_id', $districtId);
        }
        if ($puskesmasId = $request->query('puskesmasId')) {
            $query->where('fv.faskes_id', $puskesmasId);
        }
        if ($villageId = $request->query('villageId')) {
            $query->where('v.id', $villageId);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('d.name', 'like', "%{$search}%")
                  ->orWhere('f.name', 'like', "%{$search}%")
                  ->orWhere('v.name', 'like', "%{$search}%");
            });
        }

        $startDate = $request->query('startDate');
        $endDate = $request->query('endDate');
        $year = $request->query('year');
        $period = $request->query('period');

        $query->leftJoin('summary_surveys as h', function ($join) use ($startDate, $endDate, $year, $period) {
            $join->on('v.id', '=', 'h.village_id')
                 ->where('h.status', '!=', 'DRAFT');

            if ($startDate && $endDate) {
                $join->whereBetween(DB::raw('DATE(h.submitted_at)'), [$startDate, $endDate]);
            } elseif ($startDate) {
                $join->whereDate('h.submitted_at', '>=', $startDate);
            } elseif ($endDate) {
                $join->whereDate('h.submitted_at', '<=', $endDate);
            } elseif ($year) {
                $join->where('h.survey_year', $year);
            } else {
                $join->where('h.survey_year', date('Y'));
            }

            if ($period) {
                $join->where('h.survey_period', $period);
            }
        });

        $query->select([
            DB::raw("MAX(h.survey_year) as year"),
            DB::raw("MAX(h.survey_period) as period"),
            DB::raw("COUNT(CASE WHEN h.status IN ('SUBMITTED', 'APPROVED', 'REVISION') THEN 1 END) as surveyedFamilies"),
            DB::raw("COUNT(CASE WHEN h.status = 'APPROVED' THEN 1 END) as validatedFamilies"),
            DB::raw("COUNT(CASE WHEN h.status IN ('SUBMITTED', 'REVISION') THEN 1 END) as backlog"),
            DB::raw("COALESCE(AVG(h.iks_score), 0) as avgIks"),
            DB::raw("COALESCE(SUM(CASE WHEN h.is_iks_healthy = 1 THEN 1 ELSE 0 END), 0) as healthyFamilies"),
            DB::raw("COALESCE(SUM(CASE WHEN h.is_iks_unhealthy = 1 THEN 1 ELSE 0 END), 0) as unhealthyFamilies"),
            'v.district_id as districtId',
            'd.name as districtName',
            'fv.faskes_id as puskesmasId',
            'f.name as puskesmasName',
            'v.id as villageId',
            'v.name as villageName',
        ])->groupBy('v.district_id', 'd.name', 'fv.faskes_id', 'f.name', 'v.id', 'v.name');

        return $query;
    }

    public function index(Request $request)
    {
        $query = $this->buildLevelQuery($request);

        $query->orderBy('avgIks', 'desc');

        $perPage = (int) $request->query('perPage', 5);
        $page = (int) $request->query('page', 1);

        if ($perPage === 999) {
            $records = $query->get();
            $total = $records->count();
            $items = $records;
        } else {
            $paginator = $query->paginate($perPage, ['*'], 'page', $page);
            $total = $paginator->total();
            $items = $paginator->items();
        }

        $mapped = collect($items)->map(function ($item) {
            $totalFam = $item->surveyedFamilies ?: 1;
            
            $avgIks = (float) $item->avgIks;
            if ($item->surveyedFamilies == 0) $rankingStatus = 'empty';
            elseif ($avgIks >= 0.8) $rankingStatus = 'excellent';
            elseif ($avgIks >= 0.6) $rankingStatus = 'stable';
            elseif ($avgIks >= 0.4) $rankingStatus = 'alert';
            else $rankingStatus = 'priority';

            return [
                'id' => md5($item->districtId . $item->puskesmasId . $item->villageId),
                'year' => $item->year ?: date('Y'),
                'period' => $item->period ?: 'semester-1',
                'level' => 'village',
                'districtId' => $item->districtId,
                'districtName' => $item->districtName ?: '-',
                'puskesmasId' => $item->puskesmasId,
                'puskesmasName' => $item->puskesmasName ?: '-',
                'villageId' => $item->villageId,
                'villageName' => $item->villageName ?: '-',
                'surveyedFamilies' => (int) $item->surveyedFamilies,
                'validatedFamilies' => (int) $item->validatedFamilies,
                'avgIks' => $avgIks,
                'healthyFamilyPct' => round(($item->healthyFamilies / $totalFam) * 100),
                'unhealthyPct' => round(($item->unhealthyFamilies / $totalFam) * 100),
                'backlog' => (int) $item->backlog,
                'rankingStatus' => $rankingStatus,
            ];
        });

        // Apply rankingStatus filter after mapping (since rankingStatus is derived)
        if ($rankingStatusFilter = $request->query('rankingStatus')) {
            $mapped = $mapped->filter(function ($item) use ($rankingStatusFilter) {
                return $item['rankingStatus'] === $rankingStatusFilter;
            })->values();
            $total = $mapped->count();
        }

        $totalPages = $perPage > 0 ? ceil($total / $perPage) : 1;

        return response()->json([
            'data' => $mapped,
            'meta' => [
                'page' => $page,
                'perPage' => $perPage,
                'total' => $total,
                'totalPages' => max(1, $totalPages),
                'from' => $total === 0 ? null : ($page - 1) * $perPage + 1,
                'to' => $total === 0 ? null : min($page * $perPage, $total)
            ]
        ]);
    }

    public function stats(Request $request)
    {
        $query = $this->buildLevelQuery($request);
        $records = $query->get();

        $year = $request->query('year') ?: date('Y');
        $periodType = $request->query('period');
        
        $targetQuery = DB::table('mstr_yearly_targets')
            ->join('mstr_periods', 'mstr_yearly_targets.period_id', '=', 'mstr_periods.id')
            ->where('mstr_periods.year', $year);
            
        if ($periodType) {
            $targetQuery->where('mstr_periods.type', $periodType);
        } else {
            $targetQuery->where('mstr_periods.is_active', true);
        }
        
        $targetRecord = $targetQuery->first(['mstr_yearly_targets.target_value']);
        $targetValue = $targetRecord ? (int)$targetRecord->target_value : 19;

        $totalRecords = $records->count();
        if ($totalRecords === 0) {
            return response()->json([
                'totalRecords' => 0,
                'avgIks' => '0.00',
                'avgHealthy' => 0,
                'totalBacklog' => 0,
                'priorityCount' => 0,
            ]);
        }

        $avgIks = $records->avg('avgIks');
        
        $totalFamilies = $records->sum('surveyedFamilies') ?: 1;
        $totalHealthy = $records->sum('healthyFamilies');
        $avgHealthyPct = round(($totalHealthy / $totalFamilies) * 100);

        $totalBacklog = $records->sum('backlog');

        $priorityCount = $records->filter(function ($item) {
            return (float) $item->avgIks < 0.4;
        })->count();

        return response()->json([
            'totalRecords' => $totalRecords,
            'avgIks' => number_format((float) $avgIks, 2, '.', ''),
            'avgHealthy' => $avgHealthyPct,
            'totalBacklog' => (int) $totalBacklog,
            'priorityCount' => $priorityCount,
            'targetValue' => $targetValue,
        ]);
    }

    public function options(Request $request)
    {
        $districtId = $request->query('districtId');
        $puskesmasId = $request->query('puskesmasId');
        
        $user = $request->user();
        $isPuskesmas = $user && $user->role && $user->role->code === 'puskesmas';
        
        if ($isPuskesmas) {
            $puskesmasId = $user->puskesmas_id;
        }

        $years = DB::table('mstr_periods')
            ->select('year')
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year');

        $currentYear = date('Y');
        if (!$years->contains($currentYear)) {
            $years->prepend($currentYear);
        }

        $periods = [
            ['value' => 'semester-1', 'label' => 'Semester I'],
            ['value' => 'semester-2', 'label' => 'Semester II'],
        ];

        $districtsQuery = DB::table('reg_districts')->select('id', 'name')->orderBy('name');
        
        if ($isPuskesmas) {
            $faskes = DB::table('mstr_faskes')->where('id', $puskesmasId)->first();
            if ($faskes) {
                $districtsQuery->where('id', $faskes->district_id);
            }
        }
        $districts = $districtsQuery->get();

        $puskesmasQuery = DB::table('mstr_faskes')
            ->select('id', 'district_id as districtId', 'name')
            ->where('is_active', true)
            ->orderBy('name');
        
        if ($isPuskesmas) {
            $puskesmasQuery->where('id', $puskesmasId);
        } elseif ($districtId) {
            $puskesmasQuery->where('district_id', $districtId);
        }
        $puskesmas = $puskesmasQuery->get();

        $villages = [];
        if ($puskesmasId || $districtId) {
            $villagesQuery = DB::table('reg_villages')
                ->select('id', 'district_id as districtId', 'name')
                ->orderBy('name');
                
            if ($puskesmasId) {
                $villagesQuery->join('mstr_faskes_villages', 'reg_villages.id', '=', 'mstr_faskes_villages.village_id')
                    ->where('mstr_faskes_villages.faskes_id', $puskesmasId);
            } elseif ($districtId) {
                $villagesQuery->where('reg_villages.district_id', $districtId);
            }
            
            $villages = $villagesQuery->select('reg_villages.id', 'reg_villages.district_id as districtId', 'reg_villages.name')->get();
        }

        return response()->json([
            'years' => $years,
            'periods' => $periods,
            'rankingStatuses' => [
                ['value' => 'excellent', 'label' => 'Sangat Baik'],
                ['value' => 'stable', 'label' => 'Stabil'],
                ['value' => 'alert', 'label' => 'Perlu Perhatian'],
                ['value' => 'priority', 'label' => 'Prioritas Intervensi'],
            ],
            'districts' => $districts,
            'puskesmas' => $puskesmas,
            'villages' => $villages,
        ]);
    }
}

