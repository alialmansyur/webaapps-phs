<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Period;

class AdminReportSurveyIndicatorsController extends Controller
{
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

        // Include current year if not present
        $currentYear = date('Y');
        if (!$years->contains($currentYear)) {
            $years->prepend($currentYear);
        }

        $periods = Period::select('id as value', 'name as label')
            ->orderBy('start_date', 'desc')
            ->get();

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

        // Distinct indicators
        $indicators = DB::table('mstr_questions')
            ->whereNotNull('indicator')
            ->select('indicator as value', 'indicator as label')
            ->distinct()
            ->orderBy('indicator')
            ->get();

        $validationStatuses = [
            ['value' => 'all', 'label' => 'Semua Status Validasi'],
            ['value' => 'validated', 'label' => 'Sudah tervalidasi'],
            ['value' => 'pending', 'label' => 'Menunggu validasi'],
        ];

        return response()->json([
            'years' => $years,
            'periods' => $periods,
            'districts' => $districts,
            'puskesmas' => $puskesmas,
            'villages' => $villages,
            'indicators' => $indicators,
            'validationStatuses' => $validationStatuses,
        ]);
    }

    private function buildIndicatorQuery(Request $request)
    {
        $year = $request->query('year');
        $periodId = $request->query('period');
        $districtId = $request->query('districtId');
        $puskesmasId = $request->query('puskesmasId');
        $villageId = $request->query('villageId');
        $startDate = $request->query('startDate');
        $endDate = $request->query('endDate');
        $indicator = $request->query('indicator');
        $validationStatus = $request->query('validationStatus');

        $query = DB::table('summary_survey_indicators as ind')
            ->leftJoin('reg_districts as d', 'ind.district_id', '=', 'd.id')
            ->leftJoin('mstr_faskes as f', 'ind.puskesmas_id', '=', 'f.id')
            ->where('ind.status', '!=', 'DRAFT')
            ->where('ind.is_applicable', 1);

        $user = $request->user();
        if ($user && $user->role && $user->role->code === 'puskesmas') {
            $query->where('ind.puskesmas_id', $user->puskesmas_id);
        }

        if ($startDate && $endDate) {
            $query->whereBetween(DB::raw('DATE(ind.submitted_at)'), [$startDate, $endDate]);
        } elseif ($startDate) {
            $query->whereDate('ind.submitted_at', '>=', $startDate);
        } elseif ($endDate) {
            $query->whereDate('ind.submitted_at', '<=', $endDate);
        } elseif ($year) {
            $query->where('ind.survey_year', $year);
        } else {
            $query->where('ind.survey_year', date('Y'));
        }
        
        if ($periodId) {
            $query->where('ind.survey_period', $periodId);
        }
        if ($districtId) {
            $query->where('ind.district_id', $districtId);
        }
        if ($puskesmasId) {
            $query->where('ind.puskesmas_id', $puskesmasId);
        }
        if ($villageId) {
            $query->where('ind.village_id', $villageId);
        }
        if ($indicator) {
            $query->where('ind.indicator_name', $indicator);
        }
        
        if ($validationStatus && $validationStatus !== 'all') {
            if ($validationStatus === 'validated') {
                $query->where('ind.status', 'APPROVED');
            } else if ($validationStatus === 'pending') {
                $query->where('ind.status', '!=', 'APPROVED');
            }
        }

        $query->select([
            'ind.indicator_name as indicator',
            'ind.min_age',
            DB::raw("COUNT(ind.survey_id) as respondents"),
            DB::raw("SUM(ind.is_healthy) as healthyCount"),
            DB::raw("SUM(1 - ind.is_healthy) as unhealthyCount"),
        ])
        ->groupBy(
            'ind.indicator_name', 'ind.min_age'
        );

        return $query;
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->query('perPage', 10);
        $page = (int) $request->query('page', 1);
        $year = $request->query('year');

        $query = $this->buildIndicatorQuery($request);
        
        $search = $request->query('search');
        if ($search) {
            $query->having('indicator', 'like', "%{$search}%");
        }

        $query->orderBy('indicator');

        if ($perPage === 999) {
            // For export
            $data = $query->get();
            $total = $data->count();
            
            $formattedData = $data->map(function ($item) use ($year) {
                $totalCount = $item->respondents;
                $healthyPct = $totalCount > 0 ? round(($item->healthyCount / $totalCount) * 100) : 0;
                $unhealthyPct = $totalCount > 0 ? round(($item->unhealthyCount / $totalCount) * 100) : 0;
                
                return [
                    'id' => 'IND-' . md5($item->indicator),
                    'year' => $year ?: date('Y'),
                    'indicator' => $item->indicator,
                    'respondentType' => 'art-' . $item->min_age,
                    'minAge' => $item->min_age,
                    'respondents' => (int) $item->respondents,
                    'healthyPct' => $healthyPct,
                    'unhealthyPct' => $unhealthyPct,
                ];
            });

            // Re-sort by healthyPct desc for export
            $formattedData = $formattedData->sortByDesc('healthyPct')->values();

            return response()->json([
                'data' => $formattedData,
                'meta' => [
                    'page' => 1,
                    'perPage' => $total,
                    'total' => $total,
                    'totalPages' => 1,
                    'from' => 1,
                    'to' => $total
                ]
            ]);
        }

        $wrappedQuery = DB::table(DB::raw("({$query->toSql()}) as final_query"))
            ->mergeBindings($query);
            
        $paginator = $wrappedQuery->paginate($perPage, ['*'], 'page', $page);

        $formattedData = collect($paginator->items())->map(function ($item) use ($year) {
            $totalCount = $item->respondents;
            $healthyPct = $totalCount > 0 ? round(($item->healthyCount / $totalCount) * 100) : 0;
            $unhealthyPct = $totalCount > 0 ? round(($item->unhealthyCount / $totalCount) * 100) : 0;
            
            return [
                'id' => 'IND-' . md5($item->indicator),
                'year' => $year ?: date('Y'),
                'indicator' => $item->indicator,
                'respondentType' => 'art-' . $item->min_age,
                'minAge' => $item->min_age,
                'respondents' => (int) $item->respondents,
                'healthyPct' => $healthyPct,
                'unhealthyPct' => $unhealthyPct,
            ];
        });
        
        $formattedData = $formattedData->sortByDesc('healthyPct')->values();

        return response()->json([
            'data' => $formattedData,
            'meta' => [
                'page' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'totalPages' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ]
        ]);
    }

    public function stats(Request $request)
    {
        $query = $this->buildIndicatorQuery($request);
        
        $search = $request->query('search');
        if ($search) {
            $query->having('districtName', 'like', "%{$search}%")
                  ->orHaving('puskesmasName', 'like', "%{$search}%")
                  ->orHaving('indicator', 'like', "%{$search}%");
        }

        $records = $query->get();

        $totalRespondents = $records->sum('respondents');
        
        $totalHealthyCount = $records->sum('healthyCount');
        $avgHealthy = $totalRespondents > 0 ? round(($totalHealthyCount / $totalRespondents) * 100) : 0;
        
        $indicatorsCount = $records->pluck('indicator')->unique()->count();
        
        $pendingCount = $records->where('validationStatus', 'pending')->sum('respondents');
        
        $indicatorGroups = $records->groupBy('indicator')->map(function($group) {
            $resps = $group->sum('respondents');
            $healthy = $group->sum('healthyCount');
            $unhealthy = $group->sum('unhealthyCount');
            $healthyPct = $resps > 0 ? ($healthy / $resps) * 100 : 0;
            $unhealthyPct = $resps > 0 ? ($unhealthy / $resps) * 100 : 0;
            return [
                'healthyPct' => round($healthyPct),
                'unhealthyPct' => round($unhealthyPct)
            ];
        });
        
        $lowestIndicator = '-';
        if ($indicatorGroups->isNotEmpty()) {
            $sorted = $indicatorGroups->sortBy('healthyPct');
            $lowestIndicator = $sorted->keys()->first();
        }

        $chartData = [];
        foreach ($indicatorGroups as $label => $pcts) {
            $chartData[] = [
                'indicator' => $label,
                'healthyPct' => $pcts['healthyPct'],
                'unhealthyPct' => $pcts['unhealthyPct'],
            ];
        }

        // Sort chartData by healthyPct desc
        usort($chartData, function($a, $b) { return $b['healthyPct'] <=> $a['healthyPct']; });

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
            'indicators' => $indicatorsCount,
            'respondents' => (int) $totalRespondents,
            'avgHealthy' => $avgHealthy,
            'lowestIndicator' => $lowestIndicator,
            'pending' => (int) $pendingCount,
            'chartData' => $chartData,
            'targetValue' => $targetValue,
        ]);
    }
}
