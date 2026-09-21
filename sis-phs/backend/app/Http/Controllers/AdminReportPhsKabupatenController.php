<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Period;

class AdminReportPhsKabupatenController extends Controller
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

        return response()->json([
            'years' => $years,
            'periods' => $periods,
            'districts' => $districts,
            'puskesmas' => $puskesmas,
            'villages' => $villages,
        ]);
    }

    private function buildReportQuery(Request $request)
    {
        $year = $request->query('year');
        $startDate = $request->query('startDate');
        $endDate = $request->query('endDate');
        $districtId = $request->query('districtId');
        $puskesmasId = $request->query('puskesmasId');
        $villageId = $request->query('villageId');
        
        $user = $request->user();

        $applyFilters = function($query, $prefix = '') use ($year, $startDate, $endDate, $districtId, $puskesmasId, $villageId, $user) {
            if ($user && $user->role && $user->role->code === 'puskesmas') {
                $query->where("{$prefix}puskesmas_id", $user->puskesmas_id);
            }
            
            if ($startDate && $endDate) {
                $query->whereBetween(DB::raw("DATE({$prefix}submitted_at)"), [$startDate, $endDate]);
            } elseif ($startDate) {
                $query->whereDate("{$prefix}submitted_at", '>=', $startDate);
            } elseif ($endDate) {
                $query->whereDate("{$prefix}submitted_at", '<=', $endDate);
            } elseif ($year) {
                $query->where("{$prefix}survey_year", $year);
            } else {
                $query->where("{$prefix}survey_year", date('Y'));
            }
            if ($districtId) {
                $query->where("{$prefix}district_id", $districtId);
            }
            if ($puskesmasId) {
                $query->where("{$prefix}puskesmas_id", $puskesmasId);
            }
            if ($villageId) {
                $query->where("{$prefix}village_id", $villageId);
            }
        };

        $hhSub = DB::table('summary_surveys')
            ->select('village_id', 'household_id', DB::raw("MIN(is_phs_healthy) as is_household_healthy"))
            ->where('status', '!=', 'DRAFT')
            ->groupBy('village_id', 'household_id');
        $applyFilters($hhSub);

        $hhAgg = DB::table(DB::raw("({$hhSub->toSql()}) as hh_agg_sub"))
            ->mergeBindings($hhSub)
            ->select([
                'village_id',
                DB::raw("COUNT(household_id) as totalFamilies"),
                DB::raw("SUM(is_household_healthy) as healthyFamilies"),
                DB::raw("SUM(1 - is_household_healthy) as unhealthyFamilies")
            ])
            ->groupBy('village_id');

        $indAgg = DB::table('summary_survey_indicators')
            ->select([
                'village_id',
                DB::raw("SUM(IF(indicator_name = 'Konsumsi Buah dan/atau Sayur' AND is_applicable = 1 AND is_healthy = 1, 1, 0)) as buah_sayur_healthy"),
                DB::raw("SUM(IF(indicator_name = 'Aktivitas Fisik' AND is_applicable = 1 AND is_healthy = 1, 1, 0)) as aktivitas_fisik_healthy"),
                DB::raw("SUM(IF(indicator_name = 'Cuci Tangan' AND is_applicable = 1 AND is_healthy = 1, 1, 0)) as cuci_tangan_healthy"),
                DB::raw("SUM(IF(indicator_name = 'Tidak Merokok / Berhenti Merokok' AND is_applicable = 1 AND is_healthy = 1, 1, 0)) as tidak_merokok_healthy"),
                DB::raw("SUM(IF(indicator_name = 'Pengukuran Tekanan Darah' AND is_applicable = 1 AND is_healthy = 1, 1, 0)) as cek_td_healthy"),
                DB::raw("SUM(IF(indicator_name = 'Pengukuran Gula Darah' AND is_applicable = 1 AND is_healthy = 1, 1, 0)) as cek_gula_healthy"),
            ])
            ->where('status', '!=', 'DRAFT')
            ->groupBy('village_id');
        $applyFilters($indAgg);

        $artAgg = DB::table('summary_surveys')
            ->select([
                'district_id',
                'puskesmas_id',
                'village_id',
                DB::raw("COUNT(survey_id) as artTotal"),
                DB::raw("SUM(IF(age_at_survey >= 5, 1, 0)) as artAge5"),
                DB::raw("SUM(IF(age_at_survey >= 10, 1, 0)) as artAge10"),
                DB::raw("SUM(IF(age_at_survey >= 15, 1, 0)) as artAge15"),
                DB::raw("SUM(is_phs_healthy) as healthyIndividuals"),
                DB::raw("COUNT(survey_id) - SUM(is_phs_healthy) as unhealthyIndividuals")
            ])
            ->where('status', '!=', 'DRAFT')
            ->groupBy('district_id', 'puskesmas_id', 'village_id');
        $applyFilters($artAgg);

        $isPuskesmas = $user && $user->role && $user->role->code === 'puskesmas';
        
        $mainQuery = DB::table('reg_villages as v')
            ->join('mstr_faskes_villages as fv', 'v.id', '=', 'fv.village_id')
            ->join('mstr_faskes as f', 'fv.faskes_id', '=', 'f.id')
            ->join('reg_districts as d', 'v.district_id', '=', 'd.id');

        if ($isPuskesmas) {
            $mainQuery->where('fv.faskes_id', $user->puskesmas_id);
        }

        if ($districtId) {
            $mainQuery->where('v.district_id', $districtId);
        }
        if ($puskesmasId) {
            $mainQuery->where('fv.faskes_id', $puskesmasId);
        }
        if ($villageId) {
            $mainQuery->where('v.id', $villageId);
        }

        $mainQuery
            ->leftJoinSub($artAgg, 'art', function($join) {
                $join->on('v.id', '=', 'art.village_id');
            })
            ->leftJoinSub($hhAgg, 'hh', function($join) {
                $join->on('v.id', '=', 'hh.village_id');
            })
            ->leftJoinSub($indAgg, 'ind', function($join) {
                $join->on('v.id', '=', 'ind.village_id');
            })
            ->select([
                'v.district_id',
                'd.name as districtName',
                'fv.faskes_id as puskesmas_id',
                'f.name as puskesmasName',
                'v.id as village_id',
                'v.name as villageName',
                
                DB::raw("COALESCE(art.artTotal, 0) as artTotal"),
                DB::raw("COALESCE(art.artAge5, 0) as artAge5"),
                DB::raw("COALESCE(art.artAge10, 0) as artAge10"),
                DB::raw("COALESCE(art.artAge15, 0) as artAge15"),
                DB::raw("COALESCE(art.healthyIndividuals, 0) as healthyIndividuals"),
                DB::raw("COALESCE(art.unhealthyIndividuals, 0) as unhealthyIndividuals"),
                
                DB::raw("COALESCE(ind.buah_sayur_healthy, 0) as buah_sayur_healthy"),
                DB::raw("COALESCE(ind.aktivitas_fisik_healthy, 0) as aktivitas_fisik_healthy"),
                DB::raw("COALESCE(ind.cuci_tangan_healthy, 0) as cuci_tangan_healthy"),
                DB::raw("COALESCE(ind.tidak_merokok_healthy, 0) as tidak_merokok_healthy"),
                DB::raw("COALESCE(ind.cek_td_healthy, 0) as cek_td_healthy"),
                DB::raw("COALESCE(ind.cek_gula_healthy, 0) as cek_gula_healthy"),

                DB::raw("COALESCE(hh.totalFamilies, 0) as totalFamilies"),
                DB::raw("COALESCE(hh.healthyFamilies, 0) as healthyFamilies"),
                DB::raw("COALESCE(hh.unhealthyFamilies, 0) as unhealthyFamilies")
            ]);

        return $mainQuery;
    }

    private function formatRow($item, $year)
    {
        $artTotal = (int) $item->artTotal;

        $calcPct = function($healthy, $denominator) {
            return $denominator > 0 ? round(($healthy / $denominator) * 100) : 0;
        };

        $totalFamilies = (int) $item->totalFamilies;
        $healthyFamilies = (int) $item->healthyFamilies;
        $unhealthyFamilies = (int) $item->unhealthyFamilies;

        return [
            'id' => 'PHS-' . $item->district_id . '-' . $item->village_id,
            'year' => $year ?: date('Y'),
            'districtId' => $item->district_id,
            'districtName' => $item->districtName ?: '-',
            'puskesmasId' => $item->puskesmas_id,
            'puskesmasName' => $item->puskesmasName ?: '-',
            'villageId' => $item->village_id,
            'villageName' => $item->villageName ?: '-',
            
            'artTotal' => $artTotal,
            'artAge5' => (int) $item->artAge5,
            'artAge10' => (int) $item->artAge10,
            'artAge15' => (int) $item->artAge15,

            'fruitVegetableHealthy' => (int) $item->buah_sayur_healthy,
            'physicalActivityHealthy' => (int) $item->aktivitas_fisik_healthy,
            'handWashingHealthy' => (int) $item->cuci_tangan_healthy,
            'noSmokingHealthy' => (int) $item->tidak_merokok_healthy,
            'bloodPressureCheckHealthy' => (int) $item->cek_td_healthy,
            'bloodSugarCheckHealthy' => (int) $item->cek_gula_healthy,
            
            'healthyIndividuals' => (int) $item->healthyIndividuals,
            'unhealthyIndividuals' => (int) $item->unhealthyIndividuals,

            'fruitVegetableTotalPct' => $calcPct($item->buah_sayur_healthy, $artTotal),
            'physicalActivityTotalPct' => $calcPct($item->aktivitas_fisik_healthy, $artTotal),
            'handWashingTotalPct' => $calcPct($item->cuci_tangan_healthy, $artTotal),
            'noSmokingTotalPct' => $calcPct($item->tidak_merokok_healthy, $artTotal),
            'bloodPressureCheckTotalPct' => $calcPct($item->cek_td_healthy, $artTotal),
            'bloodSugarCheckTotalPct' => $calcPct($item->cek_gula_healthy, $artTotal),

            'totalFamilies' => $totalFamilies,
            'healthyFamilies' => $healthyFamilies,
            'unhealthyFamilies' => $unhealthyFamilies,
            'healthyPct' => $calcPct($healthyFamilies, $totalFamilies),
            'unhealthyPct' => $calcPct($unhealthyFamilies, $totalFamilies),
        ];
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $qs = md5(json_encode($request->query()));
        $cacheVersion = \App\Helpers\CacheBooster::getVersion("reports");
        $cacheKey = "admin_report_phs_kabupaten_index_{$user?->id}_{$qs}_v{$cacheVersion}";

        $responseData = \App\Helpers\CacheBooster::remember($cacheKey, 60 * 60, function () use ($request) {
            $perPage = (int) $request->query('perPage', 10);
            $page = (int) $request->query('page', 1);
            $year = $request->query('year');

            $query = $this->buildReportQuery($request);
            
            $search = $request->query('search');
            if ($search) {
                $query->having('districtName', 'like', "%{$search}%")
                      ->orHaving('puskesmasName', 'like', "%{$search}%")
                      ->orHaving('villageName', 'like', "%{$search}%");
            }

            $query->orderBy('districtName')->orderBy('puskesmasName')->orderBy('villageName');

            if ($perPage === 999) {
                $data = $query->get();
                $total = $data->count();
                
                $formattedData = $data->map(function ($item) use ($year) {
                    return $this->formatRow($item, $year);
                });

                $formattedData = $formattedData->sortByDesc('healthyPct')->values();

                return [
                    'data' => $formattedData,
                    'meta' => [
                        'page' => 1,
                        'perPage' => $total,
                        'total' => $total,
                        'totalPages' => 1,
                        'from' => 1,
                        'to' => $total
                    ]
                ];
            }

            $wrappedQuery = DB::table(DB::raw("({$query->toSql()}) as final_query"))
                ->mergeBindings($query);

            $paginator = $wrappedQuery->paginate($perPage, ['*'], 'page', $page);

            $formattedData = collect($paginator->items())->map(function ($item) use ($year) {
                return $this->formatRow($item, $year);
            });

            $formattedData = $formattedData->sortByDesc('healthyPct')->values();

            return [
                'data' => $formattedData,
                'meta' => [
                    'page' => $paginator->currentPage(),
                    'perPage' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'totalPages' => $paginator->lastPage(),
                    'from' => $paginator->firstItem(),
                    'to' => $paginator->lastItem(),
                ]
            ];
        });

        return response()->json($responseData);
    }

    public function stats(Request $request)
    {
        $query = $this->buildReportQuery($request);
        
        $search = $request->query('search');
        if ($search) {
            $query->having('districtName', 'like', "%{$search}%")
                  ->orHaving('puskesmasName', 'like', "%{$search}%")
                  ->orHaving('villageName', 'like', "%{$search}%");
        }

        $records = $query->get();

        $districts = $records->pluck('district_id')->unique()->count();
        $puskesmas = $records->pluck('puskesmas_id')->unique()->count();
        $villages = $records->pluck('village_id')->unique()->count();

        $totalFamilies = $records->sum('totalFamilies');
        $totalHealthy = $records->sum('healthyFamilies');

        $avgHealthy = $totalFamilies > 0 ? round(($totalHealthy / $totalFamilies) * 100) : 0;
        $avgUnhealthy = $totalFamilies > 0 ? round((($totalFamilies - $totalHealthy) / $totalFamilies) * 100) : 0;

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
            'districts' => $districts,
            'puskesmas' => $puskesmas,
            'villages' => $villages,
            'avgHealthy' => $avgHealthy,
            'avgUnhealthy' => $avgUnhealthy,
            'targetValue' => $targetValue,
        ]);
    }
}
