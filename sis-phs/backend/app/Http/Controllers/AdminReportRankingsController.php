<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminReportRankingsController extends Controller
{
    private function buildBaseQuery(Request $request)
    {
        $query = DB::table('summary_surveys as h')
            ->join('mstr_faskes as f', 'h.puskesmas_id', '=', 'f.id')
            ->join('reg_districts as d', 'h.district_id', '=', 'd.id')
            ->where('h.status', '!=', 'DRAFT');

        $year = $request->query('year');
        if ($year) {
            $query->where('h.survey_year', $year);
        } else {
            $query->where('h.survey_year', date('Y'));
        }

        if ($period = $request->query('period')) {
            $query->where('h.survey_period', $period);
        }
        if ($districtId = $request->query('districtId')) {
            $query->where('h.district_id', $districtId);
        }
        if ($puskesmasId = $request->query('puskesmasId')) {
            $query->where('h.puskesmas_id', $puskesmasId);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('f.name', 'like', "%{$search}%")
                  ->orWhere('d.name', 'like', "%{$search}%");
            });
        }

        return $query;
    }

    public function index(Request $request)
    {
        $qs = md5(json_encode($request->query()));
        $cacheVersion = \App\Helpers\CacheBooster::getVersion("reports");
        $cacheKey = "admin_report_rankings_index_{$qs}_v{$cacheVersion}";

        $responseData = \App\Helpers\CacheBooster::remember($cacheKey, 60 * 60, function () use ($request) {
            $query = $this->buildBaseQuery($request);

            $query->select([
                'h.puskesmas_id as puskesmasId',
                'f.name as puskesmasName',
                'd.name as districtName',
                DB::raw("COUNT(CASE WHEN h.status IN ('SUBMITTED', 'APPROVED', 'REVISION') THEN 1 END) as surveyedFamilies"),
                DB::raw("COUNT(CASE WHEN h.status = 'APPROVED' THEN 1 END) as validatedFamilies"),
                DB::raw("COUNT(CASE WHEN h.status IN ('SUBMITTED', 'REVISION') THEN 1 END) as backlog"),
                DB::raw("AVG(h.iks_score) as avgIks"),
                DB::raw("SUM(CASE WHEN h.is_iks_healthy = 1 THEN 1 ELSE 0 END) as healthyFamilies"),
                DB::raw("SUM(CASE WHEN h.is_iks_unhealthy = 1 THEN 1 ELSE 0 END) as unhealthyFamilies"),
                DB::raw("COUNT(DISTINCT h.surveyor_user_id) as activeSurveyors"),
            ])->groupBy('h.puskesmas_id', 'f.name', 'd.name');

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
                if ($avgIks >= 0.8) $rankingStatus = 'excellent';
                elseif ($avgIks >= 0.6) $rankingStatus = 'stable';
                elseif ($avgIks >= 0.4) $rankingStatus = 'alert';
                else $rankingStatus = 'priority';

                return [
                    'id' => md5($item->puskesmasId),
                    'puskesmasId' => $item->puskesmasId,
                    'puskesmasName' => $item->puskesmasName ?: '-',
                    'districtName' => $item->districtName ?: '-',
                    'surveyedFamilies' => (int) $item->surveyedFamilies,
                    'validatedFamilies' => (int) $item->validatedFamilies,
                    'avgIks' => $avgIks,
                    'healthyPct' => round(($item->healthyFamilies / $totalFam) * 100),
                    'unhealthyPct' => round(($item->unhealthyFamilies / $totalFam) * 100),
                    'backlog' => (int) $item->backlog,
                    'activeSurveyors' => (int) $item->activeSurveyors,
                    'rankingStatus' => $rankingStatus,
                ];
            });

            if ($rankingStatusFilter = $request->query('rankingStatus')) {
                $mapped = $mapped->filter(function ($item) use ($rankingStatusFilter) {
                    return $item['rankingStatus'] === $rankingStatusFilter;
                })->values();
                $total = $mapped->count();
            }

            $totalPages = $perPage > 0 ? ceil($total / $perPage) : 1;

            return [
                'data' => $mapped,
                'meta' => [
                    'page' => $page,
                    'perPage' => $perPage,
                    'total' => $total,
                    'totalPages' => max(1, $totalPages),
                    'from' => $total === 0 ? null : ($page - 1) * $perPage + 1,
                    'to' => $total === 0 ? null : min($page * $perPage, $total)
                ]
            ];
        });

        return response()->json($responseData);
    }

    public function stats(Request $request)
    {
        $query = $this->buildBaseQuery($request);
        
        $query->select([
            'h.puskesmas_id as puskesmasId',
            DB::raw("AVG(h.iks_score) as avgIks"),
            DB::raw("COUNT(DISTINCT h.surveyor_user_id) as activeSurveyors"),
        ])->groupBy('h.puskesmas_id');

        $records = $query->get();

        $totalPuskesmas = $records->count();
        if ($totalPuskesmas === 0) {
            return response()->json([
                'totalPuskesmas' => 0,
                'avgIks' => '0.00',
                'activeSurveyors' => 0,
                'priorityCount' => 0,
            ]);
        }

        $avgIks = $records->avg('avgIks');
        $activeSurveyors = $records->sum('activeSurveyors');
        $priorityCount = $records->filter(function ($item) {
            return (float) $item->avgIks < 0.4;
        })->count();

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

        return response()->json([
            'totalPuskesmas' => $totalPuskesmas,
            'avgIks' => number_format((float) $avgIks, 2, '.', ''),
            'activeSurveyors' => (int) $activeSurveyors,
            'priorityCount' => $priorityCount,
            'targetValue' => $targetValue,
        ]);
    }

    public function options(Request $request)
    {
        $districtId = $request->query('districtId');

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
        $districts = $districtsQuery->get();

        $puskesmasQuery = DB::table('mstr_faskes')
            ->select('id', 'district_id as districtId', 'name')
            ->where('is_active', true)
            ->orderBy('name');
        
        if ($districtId) {
            $puskesmasQuery->where('district_id', $districtId);
        }
        $puskesmas = $puskesmasQuery->get();

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
        ]);
    }
}
