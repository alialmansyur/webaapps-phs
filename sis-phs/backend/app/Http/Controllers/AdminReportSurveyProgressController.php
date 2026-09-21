<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Period;
use Illuminate\Support\Facades\DB;

class AdminReportSurveyProgressController extends Controller
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
                // join with mstr_faskes_villages
                $villagesQuery->join('mstr_faskes_villages', 'reg_villages.id', '=', 'mstr_faskes_villages.village_id')
                    ->where('mstr_faskes_villages.faskes_id', $puskesmasId);
            } elseif ($districtId) {
                $villagesQuery->where('reg_villages.district_id', $districtId);
            }
            
            // Remove table prefix from select for clean object
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

    private function buildBaseQuery(Request $request)
    {
        $districtId = $request->query('districtId');
        $puskesmasId = $request->query('puskesmasId');
        $villageId = $request->query('villageId');
        $search = $request->query('search');

        // We group by user (kader) and village.
        $query = DB::table('users as u')
            ->join('roles as r', 'u.role_id', '=', 'r.id')
            ->where('r.code', 'kader')
            ->leftJoin('reg_districts as d', 'u.district_id', '=', 'd.id')
            ->leftJoin('mstr_faskes as f', 'u.puskesmas_id', '=', 'f.id')
            ->leftJoin('reg_villages as v', 'u.village_id', '=', 'v.id')
            ->select([
                'u.id as kader_id',
                'u.name as kaderName',
                'u.village_id',
                'v.name as villageName',
                'u.district_id',
                'd.name as districtName',
                'u.puskesmas_id',
                'f.name as puskesmasName',
            ]);

        $user = $request->user();
        if ($user && $user->role && $user->role->code === 'puskesmas') {
            $query->where('u.puskesmas_id', $user->puskesmas_id);
        }

        if ($districtId) {
            $query->where('u.district_id', $districtId);
        }
        if ($puskesmasId) {
            $query->where('u.puskesmas_id', $puskesmasId);
        }
        if ($villageId) {
            $query->where('u.village_id', $villageId);
        }
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('u.name', 'like', "%{$search}%")
                  ->orWhere('v.name', 'like', "%{$search}%")
                  ->orWhere('f.name', 'like', "%{$search}%")
                  ->orWhere('d.name', 'like', "%{$search}%");
            });
        }

        return $query;
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->query('perPage', 10);
        $page = (int) $request->query('page', 1);
        $year = $request->query('year');
        $startDate = $request->query('startDate');
        $endDate = $request->query('endDate');

        $query = $this->buildBaseQuery($request);

        $query->leftJoin('summary_surveys as s', function ($join) use ($startDate, $endDate, $year) {
            $join->on('u.id', '=', 's.surveyor_user_id');
            if ($startDate && $endDate) {
                $join->whereBetween(DB::raw('DATE(s.submitted_at)'), [$startDate, $endDate]);
            } elseif ($startDate) {
                $join->whereDate('s.submitted_at', '>=', $startDate);
            } elseif ($endDate) {
                $join->whereDate('s.submitted_at', '<=', $endDate);
            } elseif ($year) {
                $join->where('s.survey_year', $year);
            } else {
                $join->where('s.survey_year', date('Y'));
            }
        });

        $query->addSelect([
            DB::raw("COUNT(CASE WHEN s.status IN ('SUBMITTED', 'APPROVED', 'REVISION') THEN 1 END) as surveyedHouseholds"),
            DB::raw("COUNT(CASE WHEN s.status = 'APPROVED' THEN 1 END) as validatedHouseholds"),
            DB::raw("COUNT(CASE WHEN s.status IN ('SUBMITTED', 'REVISION') THEN 1 END) as pendingHouseholds")
        ]);

        $query->groupBy(
            'u.id',
            'u.name',
            'u.village_id',
            'v.name',
            'u.district_id',
            'd.name',
            'u.puskesmas_id',
            'f.name'
        );

        $query->orderBy('surveyedHouseholds', 'desc');

        if ($perPage === 999) {
            // For export
            $data = $query->get();
            $total = $data->count();
            
            $formattedData = $data->map(function ($item) use ($year) {
                return [
                    'id' => 'PRG-' . $item->kader_id . '-' . $item->village_id,
                    'year' => $year ?: date('Y'),
                    'districtId' => $item->district_id,
                    'districtName' => $item->districtName ?: '-',
                    'puskesmasId' => $item->puskesmas_id,
                    'puskesmasName' => $item->puskesmasName ?: '-',
                    'villageId' => $item->village_id,
                    'villageName' => $item->villageName ?: '-',
                    'kaderName' => $item->kaderName,
                    'surveyedHouseholds' => (int) $item->surveyedHouseholds,
                    'validatedHouseholds' => (int) $item->validatedHouseholds,
                    'pendingHouseholds' => (int) $item->pendingHouseholds,
                ];
            });

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

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        $formattedData = collect($paginator->items())->map(function ($item) use ($year) {
            return [
                'id' => 'PRG-' . $item->kader_id . '-' . $item->village_id,
                'year' => $year ?: date('Y'),
                'districtId' => $item->district_id,
                'districtName' => $item->districtName ?: '-',
                'puskesmasId' => $item->puskesmas_id,
                'puskesmasName' => $item->puskesmasName ?: '-',
                'villageId' => $item->village_id,
                'villageName' => $item->villageName ?: '-',
                'kaderName' => $item->kaderName,
                'surveyedHouseholds' => (int) $item->surveyedHouseholds,
                'validatedHouseholds' => (int) $item->validatedHouseholds,
                'pendingHouseholds' => (int) $item->pendingHouseholds,
            ];
        });

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
        $year = $request->query('year');
        $districtId = $request->query('districtId');
        $puskesmasId = $request->query('puskesmasId');
        $villageId = $request->query('villageId');
        $startDate = $request->query('startDate');
        $endDate = $request->query('endDate');

        $user = $request->user();
        $isPuskesmas = $user && $user->role && $user->role->code === 'puskesmas';
        if ($isPuskesmas) {
            $puskesmasId = $user->puskesmas_id;
        }

        $query = DB::table('summary_surveys');

        if ($districtId) { $query->where('district_id', $districtId); }
        if ($puskesmasId) { $query->where('puskesmas_id', $puskesmasId); }
        if ($villageId) { $query->where('village_id', $villageId); }

        if ($startDate && $endDate) {
            $query->whereBetween(DB::raw('DATE(submitted_at)'), [$startDate, $endDate]);
        } elseif ($startDate) {
            $query->whereDate('submitted_at', '>=', $startDate);
        } elseif ($endDate) {
            $query->whereDate('submitted_at', '<=', $endDate);
        } elseif ($year) {
            $query->where('survey_year', $year);
        } else {
            $query->where('survey_year', date('Y'));
        }

        $totals = (clone $query)->select(
            DB::raw("COUNT(CASE WHEN status IN ('SUBMITTED', 'APPROVED', 'REVISION') THEN 1 END) as surveyedHouseholds"),
            DB::raw("COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as validatedHouseholds"),
            DB::raw("COUNT(CASE WHEN status IN ('SUBMITTED', 'REVISION') THEN 1 END) as pendingHouseholds"),
            DB::raw("SUM(CASE WHEN is_iks_healthy = 1 THEN 1 ELSE 0 END) as healthyFamilies")
        )->first();

        // For chart data, group by region
        $chartQuery = (clone $query)->select(
            DB::raw("COUNT(CASE WHEN status IN ('SUBMITTED', 'APPROVED', 'REVISION') THEN 1 END) as surveyed"),
            DB::raw("COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as validated")
        );

        if ($puskesmasId) {
            $chartQuery->join('reg_villages as v', 'summary_surveys.village_id', '=', 'v.id')
                ->addSelect('v.name as name')->groupBy('v.name');
        } elseif ($districtId) {
            $chartQuery->join('mstr_faskes as f', 'summary_surveys.puskesmas_id', '=', 'f.id')
                ->addSelect('f.name as name')->groupBy('f.name');
        } else {
            $chartQuery->join('reg_districts as d', 'summary_surveys.district_id', '=', 'd.id')
                ->addSelect('d.name as name')->groupBy('d.name');
        }

        $chartData = $chartQuery->orderBy('surveyed', 'desc')->limit(10)->get();

        $totalSurveyed = (int) ($totals->surveyedHouseholds ?? 0);
        $totalHealthy = (int) ($totals->healthyFamilies ?? 0);
        $avgHealthy = $totalSurveyed > 0 ? round(($totalHealthy / $totalSurveyed) * 100) : 0;

        $targetYear = $year ?: date('Y');
        $periodType = $request->query('period');
        
        $targetQuery = DB::table('mstr_yearly_targets')
            ->join('mstr_periods', 'mstr_yearly_targets.period_id', '=', 'mstr_periods.id')
            ->where('mstr_periods.year', $targetYear);
            
        if ($periodType) {
            $targetQuery->where('mstr_periods.type', $periodType);
        } else {
            $targetQuery->where('mstr_periods.is_active', true);
        }
        
        $targetRecord = $targetQuery->first(['mstr_yearly_targets.target_value']);
        $targetValue = $targetRecord ? (int)$targetRecord->target_value : 19;

        return response()->json([
            'surveyed' => $totalSurveyed,
            'validated' => (int) ($totals->validatedHouseholds ?? 0),
            'backlog' => (int) ($totals->pendingHouseholds ?? 0),
            'avgHealthy' => $avgHealthy,
            'targetValue' => $targetValue,
            'chartData' => $chartData
        ]);
    }
}

