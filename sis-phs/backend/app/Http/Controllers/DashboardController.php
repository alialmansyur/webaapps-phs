<?php

namespace App\Http\Controllers;

use App\Models\Faskes;
use App\Models\Period;
use App\Models\Survey;
use App\Models\Intervention;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function kader(Request $request)
    {
        $user = Auth::user();
        $filter = $request->query('filter', 'week');

        $cacheVersion = \App\Helpers\CacheBooster::getVersion("dashboard_kader_{$user->id}");
        $cacheKey = "dashboard_kader_{$user->id}_{$filter}_v{$cacheVersion}";
        
        $data = \App\Helpers\CacheBooster::remember($cacheKey, 60 * 5, function () use ($user, $filter) {
            $draftSurveys = Survey::where('surveyor_user_id', $user->id)
                ->where('status', 'DRAFT')
                ->count();
            $activeInterventions = Intervention::where('kader_id', $user->id)->count();
            $trendCategories = [];
            $trendTargetData = [];
            $trendRealData = [];

            if ($filter === 'week') {
                $target = 5;
                $periodLabel = 'minggu ini';
                $periodStart = now()->startOfWeek()->startOfDay();
                $periodEnd = now()->endOfWeek()->endOfDay();

                $dailyCounts = Survey::query()
                    ->selectRaw('DATE(submitted_at) as bucket_date, COUNT(*) as total')
                    ->where('surveyor_user_id', $user->id)
                    ->whereIn('status', ['SUBMITTED', 'APPROVED'])
                    ->whereBetween('submitted_at', [$periodStart, $periodEnd])
                    ->groupBy('bucket_date')
                    ->pluck('total', 'bucket_date');

                $completedSurveys = 0;
                for ($i = 0; $i < 7; $i++) {
                    $date = $periodStart->copy()->addDays($i);
                    $key = $date->toDateString();
                    $count = (int) ($dailyCounts[$key] ?? 0);
                    $trendCategories[] = $date->isoFormat('ddd');
                    $trendTargetData[] = $target;
                    $trendRealData[] = $count;
                    $completedSurveys += $count;
                }

                $targetCards = [
                    'label' => 'Target Harian',
                    'value' => '5 keluarga',
                    'subtitle' => $completedSurveys . ' keluarga selesai minggu ini',
                    'color' => 'teal'
                ];
                $progressLabel = 'Target pengisian minggu ini';
                $progressBaseTarget = 35;
            } else {
                $target = 30;
                $periodLabel = 'bulan ini';
                $periodStart = now()->startOfMonth()->startOfDay();
                $periodEnd = now()->endOfMonth()->endOfDay();

                $weeklyCounts = Survey::query()
                    ->selectRaw('YEARWEEK(submitted_at, 1) as bucket_week, COUNT(*) as total')
                    ->where('surveyor_user_id', $user->id)
                    ->whereIn('status', ['SUBMITTED', 'APPROVED'])
                    ->whereBetween('submitted_at', [$periodStart, $periodEnd])
                    ->groupBy('bucket_week')
                    ->pluck('total', 'bucket_week');

                $completedSurveys = 0;
                $cursor = $periodStart->copy()->startOfWeek();
                $weekIndex = 1;
                while ($cursor->lte($periodEnd)) {
                    $bucketKey = (int) $cursor->format('oW');
                    $count = (int) ($weeklyCounts[$bucketKey] ?? 0);
                    $trendCategories[] = 'P' . $weekIndex;
                    $trendTargetData[] = $target;
                    $trendRealData[] = $count;
                    $completedSurveys += $count;
                    $cursor->addWeek();
                    $weekIndex++;
                }

                $targetCards = [
                    'label' => 'Target Bulanan',
                    'value' => '120 keluarga',
                    'subtitle' => $completedSurveys . ' keluarga selesai bulan ini',
                    'color' => 'teal'
                ];
                $progressLabel = 'Target pengisian bulan ini';
                $progressBaseTarget = 120;
            }

            $progressValue = min(100, round(($completedSurveys / max(1, $progressBaseTarget)) * 100));
            $reminders = [];
            
            $oldDrafts = Survey::where('surveyor_user_id', $user->id)
                ->where('status', 'DRAFT')
                ->orderBy('updated_at', 'asc')
                ->take(1)
                ->get();
                
            foreach ($oldDrafts as $draft) {
                $reminders[] = [
                    'title' => 'Selesaikan draft keluarga',
                    'time' => $draft->updated_at->diffForHumans(),
                    'status' => 'Prioritas',
                    'description' => 'Ada draft survei yang belum diselesaikan. Pastikan dikirim sebelum akhir minggu.'
                ];
            }

            $dueInterventions = Intervention::where('kader_id', $user->id)
                ->whereDate('next_visit_at', '<=', \Carbon\Carbon::today()->addDays(2))
                ->orderBy('next_visit_at', 'asc')
                ->take(2)
                ->get();

            foreach ($dueInterventions as $intervention) {
                $isOverdue = \Carbon\Carbon::parse($intervention->next_visit_at)->isPast();
                $reminders[] = [
                    'title' => 'Kunjungan follow-up',
                    'time' => \Carbon\Carbon::parse($intervention->next_visit_at)->format('d M H:i'),
                    'status' => $isOverdue ? 'Prioritas' : 'Atensi',
                    'description' => 'Follow up edukasi untuk ' . ($intervention->topic ?? 'keluarga prioritas') . '.'
                ];
            }
            
            if (count($reminders) < 3) {
                $reminders[] = [
                    'title' => 'Sinkronisasi sebelum pulang',
                    'time' => '16:00',
                    'status' => 'Penting',
                    'description' => 'Pastikan semua form hari ini terkirim saat koneksi stabil.'
                ];
            }

            $recentSurveys = Survey::with(['respondent.household', 'interventions' => function ($builder) {
                $builder->latest();
            }])
                ->withCount('answers')
                ->withCount([
                    'answers as healthy_answers_count' => function ($builder) {
                        $builder->where('answer_text', 'Y');
                    },
                ])
                ->where('surveyor_user_id', $user->id)
                ->orderBy('updated_at', 'desc')
                ->take(5)
                ->get();

            $familiesRows = [];
            foreach ($recentSurveys as $survey) {
                $household = $survey->respondent->household ?? null;
                $progressText = $survey->status === 'DRAFT' ? 'Proses' : '100%';
                $latestIntervention = $survey->interventions->first();
                $needsIntervention = $survey->answers_count > 0 && $survey->healthy_answers_count < $survey->answers_count;
                $statusLabel = match ($survey->status) {
                    'APPROVED' => 'Terverifikasi',
                    'REVISION' => 'Revisi',
                    'REJECTED' => 'Ditolak',
                    'DRAFT' => 'Draft',
                    default => 'Menunggu',
                };

                if ($needsIntervention && $latestIntervention) {
                    $statusLabel = ! empty($latestIntervention->result) && empty($latestIntervention->next_visit_at)
                        ? 'Intervensi Selesai'
                        : 'Intervensi Aktif';
                } elseif ($needsIntervention) {
                    $statusLabel = 'Perlu Intervensi';
                }
                
                $familiesRows[] = [
                    'keluarga' => $household->head_of_family_name ?? 'Tidak Diketahui',
                    'alamat' => $household ? 'RT ' . str_pad($household->rt, 2, '0', STR_PAD_LEFT) . ' / RW ' . str_pad($household->rw, 2, '0', STR_PAD_LEFT) : '-',
                    'progress' => $progressText,
                    'status' => $statusLabel,
                ];
            }

            return [
                'greeting' => $user->name,
                'subtitle' => 'Fokus utama Anda adalah mencapai target pengisian, menyelesaikan draft, dan memastikan follow-up berjalan lancar.',
                'progress' => [
                    'label' => $progressLabel,
                    'value' => $progressValue,
                    'note' => "{$completedSurveys} dari target {$progressBaseTarget} selesai"
                ],
                'heroStats' => [
                    ['label' => 'Input selesai', 'value' => "{$completedSurveys} keluarga"],
                    ['label' => 'Draft aktif', 'value' => "{$draftSurveys} form"],
                    ['label' => 'Reminder aktif', 'value' => count($reminders) . " agenda"],
                ],
                'cards' => [
                    $targetCards,
                    ['label' => 'Progress ' . $periodLabel, 'value' => "{$progressValue}%", 'subtitle' => 'Realisasi capaian pengisian', 'color' => 'blue'],
                    ['label' => 'Draft Belum Final', 'value' => (string)$draftSurveys, 'subtitle' => 'Perlu diselesaikan segera', 'color' => 'amber'],
                    ['label' => 'Follow-up Aktif', 'value' => (string)$activeInterventions, 'subtitle' => 'Keluarga prioritas', 'color' => 'rose'],
                ],
                'reminders' => $reminders,
                'trend' => [
                    'title' => 'Tren Pengisian ' . ucfirst($periodLabel),
                    'categories' => $trendCategories,
                    'series' => [
                        ['name' => 'Target', 'data' => $trendTargetData],
                        ['name' => 'Tercapai', 'data' => $trendRealData],
                    ],
                ],
                'donut' => [
                    'title' => 'Komposisi Aktivitas',
                    'labels' => ['Selesai', 'Draft', 'Follow-up'],
                    'series' => [$completedSurveys, $draftSurveys, $activeInterventions],
                ],
                'families' => [
                    'title' => 'Keluarga Dalam Proses',
                    'rows' => count($familiesRows) > 0 ? $familiesRows : [
                        ['keluarga' => '-', 'alamat' => '-', 'progress' => '-', 'status' => '-']
                    ],
                ],
            ];
        });

        return response()->json([
            'filters' => [
                ['value' => 'week', 'label' => 'Minggu Ini'],
                ['value' => 'month', 'label' => 'Bulan Ini'],
            ],
            'data' => $data
        ]);
    }

    public function puskesmas(Request $request)
    {
        $user = Auth::user();
        $puskesmasId = $user->puskesmas_id;

        $periods = Period::orderBy('start_date', 'desc')->get();
        $filters = $periods->map(function ($p) {
            return ['value' => (string)$p->id, 'label' => $p->name];
        })->toArray();

        $selectedPeriod = null;
        $filter = $request->query('filter');
        if ($filter !== null && $filter !== '') {
            $selectedPeriod = $periods->firstWhere('id', (int) $filter);
        }
        if (! $selectedPeriod) {
            $selectedPeriod = $periods->firstWhere('is_active', true) ?? $periods->first();
        }

        $periodId = $selectedPeriod ? $selectedPeriod->id : 'all';
        $cacheVersion = \App\Helpers\CacheBooster::getVersion("dashboard_puskesmas_{$puskesmasId}");
        $cacheKey = "dashboard_puskesmas_{$puskesmasId}_{$periodId}_v{$cacheVersion}";

        $responseData = \App\Helpers\CacheBooster::remember($cacheKey, 60 * 15, function () use ($puskesmasId, $selectedPeriod, $filters) {
            $periodStart = $selectedPeriod?->start_date?->copy()->startOfDay();
            $periodEnd = $selectedPeriod?->end_date?->copy()->endOfDay();
            if (! $periodStart || ! $periodEnd) {
                $fallbackYear = (int) ($selectedPeriod?->year ?? now()->year);
                $periodStart = Carbon::create($fallbackYear, 1, 1)->startOfDay();
                $periodEnd = Carbon::create($fallbackYear, 12, 31)->endOfDay();
            }

            $activeKadersQuery = User::where('puskesmas_id', $puskesmasId)
                ->whereHas('role', function($q) { $q->where('code', 'kader'); });

            $activeKadersCount = (clone $activeKadersQuery)->count();

            $targetValue = 19;
            if ($selectedPeriod) {
                $yt = DB::table('mstr_yearly_targets')->where('period_id', $selectedPeriod->id)->first();
                if ($yt) {
                    $targetValue = (int) $yt->target_value;
                }
            }

            $faskes = Faskes::find($puskesmasId);
            $totalTargetKaders = $faskes && $faskes->cadre_count > 0 ? $faskes->cadre_count : max($activeKadersCount, 1);

            $kaderIds = (clone $activeKadersQuery)->pluck('id');
            $hasKaders = $kaderIds->isNotEmpty();

            $surveyBaseQuery = Survey::query()
                ->whereBetween(DB::raw('COALESCE(submitted_at, created_at)'), [$periodStart, $periodEnd]);

            if ($hasKaders) {
                $surveyBaseQuery->whereIn('surveyor_user_id', $kaderIds);
            } else {
                $surveyBaseQuery->whereRaw('1 = 0');
            }

            $summaryBaseQuery = DB::table('summary_surveys as ss')
                ->where('ss.puskesmas_id', $puskesmasId)
                ->whereBetween('ss.submitted_at', [$periodStart, $periodEnd]);

            $totalSurveys = (clone $summaryBaseQuery)
                ->whereIn('ss.status', ['SUBMITTED', 'APPROVED', 'REVISION'])
                ->count();

            $totalWaitingVerif = (clone $summaryBaseQuery)
                ->where('ss.status', 'SUBMITTED')
                ->count();
                
            $totalValidSurveys = (clone $summaryBaseQuery)
                ->where('ss.status', 'APPROVED')
                ->count();
                
            $sehatCount = (clone $summaryBaseQuery)
                ->where('ss.status', 'APPROVED')
                ->where('ss.is_iks_healthy', 1)
                ->count();
                
            $puskesmasRep = $totalValidSurveys > 0 ? round(($sehatCount / max(1, $totalValidSurveys)) * 100) : 0;

            $totalInterventions = Intervention::whereHas('survey', function($q) use ($kaderIds, $periodStart, $periodEnd, $hasKaders) {
                if ($hasKaders) {
                    $q->whereIn('surveyor_user_id', $kaderIds);
                } else {
                    $q->whereRaw('1 = 0');
                }
                $q->whereBetween(DB::raw('COALESCE(submitted_at, created_at)'), [$periodStart, $periodEnd]);
            })->count();

            $visitCounts = (clone $surveyBaseQuery)
                ->select('surveyor_user_id', DB::raw('COUNT(*) as visits'))
                ->whereIn('status', ['SUBMITTED', 'APPROVED', 'REVISION'])
                ->groupBy('surveyor_user_id')
                ->pluck('visits', 'surveyor_user_id');

            $draftCounts = (clone $surveyBaseQuery)
                ->select('surveyor_user_id', DB::raw('COUNT(*) as drafts'))
                ->where('status', 'DRAFT')
                ->groupBy('surveyor_user_id')
                ->pluck('drafts', 'surveyor_user_id');

            $kaders = $hasKaders ? User::whereIn('id', $kaderIds)->get() : collect();
            $leaderboard = [];
            $onTrackCount = 0;
            $pantauCount = 0;
            $atensiCount = 0;

            foreach ($kaders as $kader) {
                $visits = (int) ($visitCounts[$kader->id] ?? 0);
                $drafts = (int) ($draftCounts[$kader->id] ?? 0);

                $completion = $visits > 0 ? min(100, round(($visits / max(1, $visits + $drafts)) * 100)) : 0;

                if ($visits >= 10) {
                    $status = 'On Track';
                    $onTrackCount++;
                } elseif ($visits > 0) {
                    $status = 'Pantau';
                    $pantauCount++;
                } else {
                    $status = 'Perlu Atensi';
                    $atensiCount++;
                }
                
                $leaderboard[] = [
                    'name' => $kader->name ?? $kader->full_name,
                    'completion' => $completion,
                    'visits' => $visits,
                    'drafts' => $drafts,
                    'status' => $status
                ];
            }

            usort($leaderboard, function($a, $b) {
                if ($a['visits'] === $b['visits']) {
                    return $a['drafts'] <=> $b['drafts'];
                }

                return $b['visits'] <=> $a['visits'];
            });

            // Tampilkan hanya top 3 kader
            $leaderboard = array_slice($leaderboard, 0, 3);

            $donutSeries = [$onTrackCount, $pantauCount, $atensiCount];

            $trendCategories = [];
            $trendMasuk = [];
            $trendTerverifikasi = [];

            $monthCursor = $periodStart->copy()->startOfMonth();
            $monthEndCursor = $periodEnd->copy()->startOfMonth();

            while ($monthCursor->lte($monthEndCursor)) {
                $month = $monthCursor->copy();
                $trendCategories[] = $month->isoFormat('MMM');

                $masuk = (clone $summaryBaseQuery)
                    ->whereIn('ss.status', ['SUBMITTED', 'APPROVED', 'REVISION'])
                    ->whereYear('ss.submitted_at', $month->year)
                    ->whereMonth('ss.submitted_at', $month->month)
                    ->count();

                $terverifikasi = (clone $summaryBaseQuery)
                    ->where('ss.status', 'APPROVED')
                    ->whereYear('ss.updated_at', $month->year)
                    ->whereMonth('ss.updated_at', $month->month)
                    ->count();

                $trendMasuk[] = $masuk;
                $trendTerverifikasi[] = $terverifikasi;
                $monthCursor->addMonth();
            }

            $villageRows = [];
            $alerts = [];
            if ($faskes) {
                $villages = $faskes->villages()->get();
                foreach ($villages as $village) {
                    $villageStats = DB::table('summary_surveys as ss')
                        ->where('ss.puskesmas_id', $puskesmasId)
                        ->where('ss.village_id', $village->id)
                        ->whereBetween('ss.submitted_at', [$periodStart, $periodEnd])
                        ->selectRaw("
                            COUNT(CASE WHEN ss.status IN ('SUBMITTED', 'APPROVED', 'REVISION') THEN 1 END) as total_surveys,
                            COUNT(CASE WHEN ss.status = 'APPROVED' THEN 1 END) as approved_surveys,
                            AVG(CASE WHEN ss.status = 'APPROVED' THEN ss.iks_score END) as avg_iks,
                            SUM(CASE WHEN ss.status = 'APPROVED' AND ss.is_iks_healthy = 1 THEN 1 ELSE 0 END) as healthy_surveys,
                            SUM(CASE WHEN ss.status = 'APPROVED' AND ss.is_iks_unhealthy = 1 THEN 1 ELSE 0 END) as unhealthy_surveys
                        ")
                        ->first();

                    $surveiCount = (int) ($villageStats->total_surveys ?? 0);
                    $validCount = (int) ($villageStats->approved_surveys ?? 0);
                    $iks = $validCount > 0 ? round((float) ($villageStats->avg_iks ?? 0), 2) : 0;

                    if ($iks >= 0.8) {
                        $vStatus = 'Baik';
                    } elseif ($iks >= 0.5) {
                        $vStatus = 'Stabil';
                    } else {
                        $vStatus = $validCount > 0 ? 'Tertinggal' : 'Belum Ada Data';
                    }
                    
                    $villageRows[] = [
                        'desa' => $village->name,
                        'survei' => (string)$surveiCount,
                        'valid' => (string)$validCount,
                        'iks' => number_format($iks, 2),
                        'status' => $vStatus
                    ];
                    
                    if ($vStatus === 'Tertinggal') {
                        $alerts[] = [
                            'title' => $village->name . ' tertinggal IKS',
                            'status' => 'Prioritas',
                            'description' => 'Nilai IKS sangat rendah. Perlu intervensi dan pendampingan segera.'
                        ];
                    } elseif ($surveiCount > 0 && $validCount == 0) {
                        $alerts[] = [
                            'title' => $village->name . ' perlu verifikasi',
                            'status' => 'Atensi',
                            'description' => 'Ada ' . $surveiCount . ' survei belum divalidasi di desa ini.'
                        ];
                    }
                }
            }
            
            if (empty($alerts)) {
                $alerts[] = [
                    'title' => 'Kondisi wilayah stabil',
                    'status' => 'Baik',
                    'description' => 'Belum ada anomali atau peringatan prioritas saat ini.'
                ];
            }

            if (empty($villageRows)) {
                $villageRows[] = ['desa' => '-', 'survei' => '0', 'valid' => '0', 'iks' => '0.00', 'status' => '-'];
            }
            
            if (empty($leaderboard)) {
                $leaderboard[] = ['name' => '-', 'completion' => 0, 'visits' => 0, 'drafts' => 0, 'status' => '-'];
            }

            return [
                'targetValue' => $targetValue,
                'summary' => 'Dashboard puskesmas memuat capaian para kader, status verifikasi, dan kualitas hasil wilayah kerja sesuai periode yang dipilih.',
                'cards' => [
                    ['label' => 'Kader Aktif', 'value' => "{$activeKadersCount}/{$totalTargetKaders}", 'subtitle' => 'Berdasarkan data pengguna sistem', 'color' => 'blue'],
                    ['label' => 'Survei Masuk', 'value' => number_format($totalSurveys, 0, ',', '.'), 'subtitle' => 'Periode '.strtolower($selectedPeriod?->name ?? 'aktif'), 'color' => 'teal'],
                    ['label' => 'Menunggu Verifikasi', 'value' => (string)$totalWaitingVerif, 'subtitle' => 'Status SUBMITTED pada periode terpilih', 'color' => 'amber'],
                    ['label' => 'Keluarga Intervensi', 'value' => (string)$totalInterventions, 'subtitle' => 'Masuk pantauan aktif pada periode terpilih', 'color' => 'rose'],
                    ['label' => 'Target Data Sehat', 'value' => "{$puskesmasRep}%", 'subtitle' => 'Capaian sehat aktual', 'color' => 'blue', 'targetValue' => $targetValue, 'currentValue' => $puskesmasRep, 'targetLabel' => "Target: {$targetValue}%"],
                ],
                'leaderboard' => $leaderboard,
                'trend' => [
                    'title' => 'Tren Capaian Kader vs Verifikasi',
                    'categories' => $trendCategories,
                    'series' => [
                        ['name' => 'Survei Masuk', 'data' => $trendMasuk],
                        ['name' => 'Terverifikasi', 'data' => $trendTerverifikasi],
                    ],
                ],
                'donut' => [
                    'title' => 'Status Kader Lapangan',
                    'labels' => ['On Track', 'Pantau', 'Perlu Atensi'],
                    'series' => $donutSeries,
                ],
                'villages' => [
                    'title' => 'Snapshot Capaian Desa',
                    'rows' => $villageRows,
                ],
                'alerts' => array_slice($alerts, 0, 3),
            ];
        });

        return response()->json([
            'filters' => $filters,
            'selectedFilter' => $selectedPeriod ? (string) $selectedPeriod->id : ($filters[0]['value'] ?? ''),
            'data' => $responseData
        ]);
    }

    public function dinkes(Request $request)
    {
        $periods = \App\Models\Period::orderBy('start_date', 'desc')->get();
        $filters = $periods->map(function ($p) {
            return ['value' => (string)$p->id, 'label' => $p->name];
        })->toArray();

        $selectedPeriod = null;
        $filter = $request->query('filter');
        if ($filter !== null && $filter !== '') {
            $selectedPeriod = $periods->firstWhere('id', (int) $filter);
        }
        if (! $selectedPeriod) {
            $selectedPeriod = $periods->firstWhere('is_active', true) ?? $periods->first();
        }

        $periodId = $selectedPeriod ? $selectedPeriod->id : 'all';
        $cacheVersion = \App\Helpers\CacheBooster::getVersion("dashboard_dinkes");
        $cacheKey = "dashboard_dinkes_{$periodId}_v{$cacheVersion}";

        $responseData = \App\Helpers\CacheBooster::remember($cacheKey, 60 * 30, function () use ($selectedPeriod, $filters) {
            $periodStart = $selectedPeriod?->start_date?->copy()->startOfDay();
            $periodEnd = $selectedPeriod?->end_date?->copy()->endOfDay();
            if (! $periodStart || ! $periodEnd) {
                $fallbackYear = (int) ($selectedPeriod?->year ?? now()->year);
                $periodStart = Carbon::create($fallbackYear, 1, 1)->startOfDay();
                $periodEnd = Carbon::create($fallbackYear, 12, 31)->endOfDay();
            }

            $faskesList = \App\Models\Faskes::where('is_active', true)->get()->keyBy('id');
            
            $targetValue = 19;
            if ($selectedPeriod) {
                $yt = DB::table('mstr_yearly_targets')->where('period_id', $selectedPeriod->id)->first();
                if ($yt) {
                    $targetValue = (int) $yt->target_value;
                }
            }
            $faskesStats = [];
            foreach ($faskesList as $fId => $f) {
                $faskesStats[(string) $fId] = [
                    'name' => $f->name,
                    'coverage_target' => $f->household_coverage ?? 1,
                    'total_surveys' => 0,
                    'valid_count' => 0,
                    'total_score' => 0,
                ];
            }

            $sehatCount = 0;
            $tidakSehatCount = 0;
            $totalValidSurveys = 0;
            $totalSurveysCount = 0;

            $summaryRows = DB::table('summary_surveys as ss')
                ->leftJoin('mstr_faskes_villages as mfv', 'mfv.village_id', '=', 'ss.village_id')
                ->whereBetween('ss.submitted_at', [$periodStart, $periodEnd])
                ->whereIn('ss.status', ['SUBMITTED', 'APPROVED', 'REVISION'])
                ->select([
                    'ss.status',
                    'ss.iks_score',
                    'ss.is_iks_healthy',
                    'ss.is_iks_unhealthy',
                    'ss.submitted_at',
                    DB::raw('COALESCE(ss.puskesmas_id, mfv.faskes_id) as mapped_puskesmas_id'),
                ])
                ->get();

            foreach ($summaryRows as $summary) {
                $faskesId = (string) ($summary->mapped_puskesmas_id ?? '');
                if ($faskesId !== '' && isset($faskesStats[$faskesId])) {
                    $faskesStats[$faskesId]['total_surveys']++;
                }

                $totalSurveysCount++;

                if ($summary->status === 'APPROVED') {
                    $totalValidSurveys++;
                    $sehatCount += (int) $summary->is_iks_healthy;
                    $tidakSehatCount += (int) $summary->is_iks_unhealthy;

                    if ($faskesId !== '' && isset($faskesStats[$faskesId])) {
                        $faskesStats[$faskesId]['valid_count']++;
                        $faskesStats[$faskesId]['total_score'] += (float) $summary->iks_score;
                    }
                }
            }

            $processedFaskes = [];
            foreach ($faskesStats as $fId => $stat) {
                $iks = $stat['valid_count'] > 0 ? ($stat['total_score'] / $stat['valid_count']) : 0;
                $cov = $stat['coverage_target'] > 0 ? min(100, round(($stat['total_surveys'] / max(1, $stat['coverage_target'])) * 100)) : 0;
                
                $processedFaskes[] = [
                    'name' => $stat['name'],
                    'iks' => $iks,
                    'coverage' => $cov,
                    'valid_count' => $stat['valid_count'],
                    'total_surveys' => $stat['total_surveys']
                ];
            }

            usort($processedFaskes, function($a, $b) {
                if ($a['iks'] === $b['iks']) {
                    return $b['valid_count'] <=> $a['valid_count'];
                }

                return $b['iks'] <=> $a['iks'];
            });

            $onTrackCount = 0;
            $atensiCount = 0;
            $rankings = [];

            foreach ($processedFaskes as $fStat) {
                if ($fStat['valid_count'] <= 0) {
                    $status = 'Belum Ada Data';
                } elseif ($fStat['iks'] >= 0.8) {
                    $status = 'Baik';
                    $onTrackCount++;
                } elseif ($fStat['iks'] >= 0.5) {
                    $status = 'Pantau';
                } else {
                    $status = 'Atensi';
                    $atensiCount++;
                }
                
                $rankings[] = [
                    'unit' => $fStat['name'],
                    'iks' => number_format($fStat['iks'], 2),
                    'coverage' => $fStat['coverage'] . '%',
                    'trend' => 'Stabil',
                    'status' => $status
                ];
            }

            $faskesWithData = array_values(array_filter($processedFaskes, function ($item) {
                return $item['valid_count'] > 0;
            }));

            $bestFaskes = $faskesWithData[0] ?? null;
            $worstFaskes = null;
            if (! empty($faskesWithData)) {
                $sortedAscending = $faskesWithData;
                usort($sortedAscending, function ($a, $b) {
                    if ($a['iks'] === $b['iks']) {
                        return $a['valid_count'] <=> $b['valid_count'];
                    }

                    return $a['iks'] <=> $b['iks'];
                });
                $worstFaskes = $sortedAscending[0] ?? null;
            }

            $avgIks = $totalValidSurveys > 0
                ? round($summaryRows->where('status', 'APPROVED')->avg('iks_score') ?? 0, 4)
                : 0;
                
            $dinkesRep = $totalValidSurveys > 0 ? round(($sehatCount / max(1, $totalValidSurveys)) * 100) : 0;

            $focusIndicators = [];
            $topIndicators = DB::table('summary_survey_indicators as ssi')
                ->join('summary_surveys as ss', 'ss.survey_id', '=', 'ssi.survey_id')
                ->whereBetween('ss.submitted_at', [$periodStart, $periodEnd])
                ->where('ss.status', 'APPROVED')
                ->where('ssi.is_applicable', 1)
                ->where('ssi.is_healthy', 0)
                ->select('ssi.indicator_name', DB::raw('COUNT(*) as total'))
                ->groupBy('ssi.indicator_name')
                ->orderByDesc('total')
                ->limit(3)
                ->get();

            foreach ($topIndicators as $indicator) {
                $count = (int) $indicator->total;
                $percentage = $totalValidSurveys > 0 ? min(100, round(($count / $totalValidSurveys) * 100)) : 0;
                $focusIndicators[] = [
                    'label' => strlen($indicator->indicator_name) > 50 ? substr($indicator->indicator_name, 0, 47) . '...' : $indicator->indicator_name,
                    'value' => $percentage . '%',
                    'progress' => $percentage,
                    'status' => $percentage > 50 ? 'Prioritas' : 'Pantau',
                    'note' => 'Banyak keluarga menjawab "Tidak"'
                ];
            }

            $dominantIndicatorTitle = $topIndicators->first()->indicator_name ?? '-';
            if (strlen($dominantIndicatorTitle) > 50) {
                $dominantIndicatorTitle = substr($dominantIndicatorTitle, 0, 47) . '...';
            }

            $trendCategories = [];
            $trendSurveys = [];
            $trendIks = [];

            $trendBuckets = [];
            foreach ($summaryRows as $summary) {
                $bucketKey = Carbon::parse($summary->submitted_at)->format('Y-m');
                if (! isset($trendBuckets[$bucketKey])) {
                    $trendBuckets[$bucketKey] = [
                        'surveys' => 0,
                        'iks_total' => 0,
                        'iks_count' => 0,
                    ];
                }

                $trendBuckets[$bucketKey]['surveys']++;

                if ($summary->status === 'APPROVED') {
                    $trendBuckets[$bucketKey]['iks_total'] += (float) $summary->iks_score;
                    $trendBuckets[$bucketKey]['iks_count']++;
                }
            }

            $monthCursor = $periodStart->copy()->startOfMonth();
            $monthEndCursor = $periodEnd->copy()->startOfMonth();
            while ($monthCursor->lte($monthEndCursor)) {
                $bucketKey = $monthCursor->format('Y-m');
                $bucket = $trendBuckets[$bucketKey] ?? ['surveys' => 0, 'iks_total' => 0, 'iks_count' => 0];

                $trendCategories[] = $monthCursor->isoFormat('MMM');
                $trendSurveys[] = (int) $bucket['surveys'];
                $trendIks[] = $bucket['iks_count'] > 0
                    ? round(($bucket['iks_total'] / $bucket['iks_count']) * 10000)
                    : 0;

                $monthCursor->addMonth();
            }

            return [
                'targetValue' => $targetValue,
                'summary' => 'Dashboard dinkes mencakup seluruh data puskesmas di wilayah untuk membaca capaian IKS, coverage, ranking unit, dan konsentrasi desa prioritas sesuai periode yang dipilih.',
                'cards' => [
                    ['label' => 'Keluarga Tersurvei', 'value' => number_format($totalSurveysCount, 0, ',', '.'), 'subtitle' => 'Periode '.strtolower($selectedPeriod?->name ?? 'aktif'), 'color' => 'blue'],
                    ['label' => 'IKS Kabupaten', 'value' => number_format($avgIks, 3), 'subtitle' => 'Rata-rata IKS wilayah tervalidasi', 'color' => 'teal'],
                    ['label' => 'Puskesmas On Track', 'value' => "{$onTrackCount}/" . count($processedFaskes), 'subtitle' => 'Unit dengan IKS >= 0.8', 'color' => 'emerald'],
                    ['label' => 'Puskesmas Atensi', 'value' => (string)$atensiCount, 'subtitle' => 'Unit dengan IKS < 0.5', 'color' => 'amber'],
                    ['label' => 'Target Data Sehat', 'value' => "{$dinkesRep}%", 'subtitle' => 'Capaian sehat aktual', 'color' => 'blue', 'targetValue' => $targetValue, 'currentValue' => $dinkesRep, 'targetLabel' => "Target: {$targetValue}%"],
                ],
                'mapSummary' => [
                    ['label' => 'Wilayah terbaik', 'value' => $bestFaskes['name'] ?? '-', 'note' => 'IKS ' . number_format($bestFaskes['iks'] ?? 0, 2) . ' dan coverage ' . ($bestFaskes['coverage'] ?? 0) . '%'],
                    ['label' => 'Wilayah terendah', 'value' => $worstFaskes['name'] ?? '-', 'note' => $worstFaskes ? 'Perlu pembinaan lanjutan lintas indikator' : 'Belum ada data tervalidasi pada periode ini'],
                    ['label' => 'Indikator dominan', 'value' => $dominantIndicatorTitle, 'note' => 'Masalah utama berdasarkan jumlah jawaban Tidak'],
                ],
                'trend' => [
                    'title' => 'Tren Capaian Seluruh Puskesmas',
                    'categories' => $trendCategories,
                    'series' => [
                        ['name' => 'Keluarga Disurvei', 'data' => $trendSurveys],
                        ['name' => 'IKS x10000', 'data' => $trendIks],
                    ],
                ],
                'donut' => [
                    'title' => 'Komposisi Status Keluarga',
                    'labels' => ['Sehat', 'Tidak Sehat'],
                    'series' => [$sehatCount, $tidakSehatCount],
                ],
                'rankings' => [
                    'title' => 'Ranking Puskesmas',
                    'rows' => !empty($rankings) ? $rankings : [
                        ['unit' => '-', 'iks' => '0', 'coverage' => '0%', 'trend' => '-', 'status' => '-']
                    ],
                ],
                'focusIndicators' => !empty($focusIndicators) ? $focusIndicators : [
                    ['label' => '-', 'value' => '0%', 'progress' => 0, 'status' => 'Baik', 'note' => 'Belum ada data']
                ],
            ];
        });

        return response()->json([
            'filters' => $filters,
            'selectedFilter' => $selectedPeriod ? (string) $selectedPeriod->id : ($filters[0]['value'] ?? ''),
            'data' => $responseData
        ]);
    }

    public function admin(Request $request)
    {
        $periods = Period::orderBy('start_date', 'desc')->get();
        $filters = $periods->map(function ($period) {
            return ['value' => (string) $period->id, 'label' => $period->name];
        })->toArray();

        $selectedPeriod = null;
        $filter = $request->query('filter');
        if ($filter !== null && $filter !== '') {
            $selectedPeriod = $periods->firstWhere('id', (int) $filter);
        }
        if (! $selectedPeriod) {
            $selectedPeriod = $periods->firstWhere('is_active', true) ?? $periods->first();
        }

        $periodStart = $selectedPeriod?->start_date?->copy()->startOfDay();
        $periodEnd = $selectedPeriod?->end_date?->copy()->endOfDay();
        if (! $periodStart || ! $periodEnd) {
            $fallbackYear = (int) ($selectedPeriod?->year ?? now()->year);
            $periodStart = Carbon::create($fallbackYear, 1, 1)->startOfDay();
            $periodEnd = Carbon::create($fallbackYear, 12, 31)->endOfDay();
        }

        $totalInterventions = Intervention::whereHas('survey', function ($query) use ($periodStart, $periodEnd) {
            $query->whereBetween(DB::raw('COALESCE(submitted_at, created_at)'), [$periodStart, $periodEnd]);
        })->count();
        $totalKaders = User::whereHas('role', function($q) { $q->where('code', 'kader'); })->count();

        $faskesList = Faskes::where('is_active', true)->get()->keyBy('id');
        
        $targetValue = 19;
        if ($selectedPeriod) {
            $yt = DB::table('mstr_yearly_targets')->where('period_id', $selectedPeriod->id)->first();
            if ($yt) {
                $targetValue = (int) $yt->target_value;
            }
        }
        $faskesStats = [];
        foreach ($faskesList as $faskesId => $faskes) {
            $faskesStats[(string) $faskesId] = [
                'name' => $faskes->name,
                'coverage_target' => $faskes->household_coverage ?: 100,
                'total_surveys' => 0,
                'valid_count' => 0,
                'total_score' => 0,
            ];
        }

        $summaryRows = DB::table('summary_surveys as ss')
            ->leftJoin('mstr_faskes_villages as mfv', 'mfv.village_id', '=', 'ss.village_id')
            ->whereBetween('ss.submitted_at', [$periodStart, $periodEnd])
            ->whereIn('ss.status', ['SUBMITTED', 'APPROVED', 'REVISION'])
            ->select([
                'ss.status',
                'ss.iks_score',
                'ss.is_iks_healthy',
                'ss.is_iks_unhealthy',
                'ss.submitted_at',
                DB::raw('COALESCE(ss.puskesmas_id, mfv.faskes_id) as mapped_puskesmas_id'),
            ])
            ->get();

        $totalSurveys = 0;
        $validStatusCount = 0;
        $revisiStatusCount = 0;
        $submittedStatusCount = 0;
        $sehatCount = 0;
        $tidakSehatCount = 0;

        foreach ($summaryRows as $summary) {
            $faskesId = (string) ($summary->mapped_puskesmas_id ?? '');
            if ($faskesId !== '' && isset($faskesStats[$faskesId])) {
                $faskesStats[$faskesId]['total_surveys']++;
            }

            $totalSurveys++;

            if ($summary->status === 'APPROVED') {
                $validStatusCount++;
                $sehatCount += (int) $summary->is_iks_healthy;
                $tidakSehatCount += (int) $summary->is_iks_unhealthy;

                if ($faskesId !== '' && isset($faskesStats[$faskesId])) {
                    $faskesStats[$faskesId]['valid_count']++;
                    $faskesStats[$faskesId]['total_score'] += (float) $summary->iks_score;
                }
            } elseif ($summary->status === 'REVISION') {
                $revisiStatusCount++;
            } elseif ($summary->status === 'SUBMITTED') {
                $submittedStatusCount++;
            }
        }

        $totalDrafts = $submittedStatusCount;
        $onTrackCount = 0;
        $processedFaskes = [];
        foreach ($faskesStats as $stat) {
            $iks = $stat['valid_count'] > 0 ? ($stat['total_score'] / $stat['valid_count']) : 0.0;
            $cov = $stat['coverage_target'] > 0 ? min(100, round(($stat['total_surveys'] / max(1, $stat['coverage_target'])) * 100)) : 0;
            if ($iks >= 0.8) {
                $onTrackCount++;
            }
            $processedFaskes[] = [
                'name' => $stat['name'],
                'iks' => $iks,
                'coverage' => $cov,
                'total' => $stat['total_surveys'],
                'target' => $stat['coverage_target']
            ];
        }
        
        $avgIks = $validStatusCount > 0
            ? round($summaryRows->where('status', 'APPROVED')->avg('iks_score') ?? 0, 4)
            : 0;
        
        $puskesmasRep = $totalSurveys > 0 ? round(($validStatusCount / max(1, $totalSurveys)) * 100) : 0;
        $dinkesRep = $validStatusCount > 0 ? round(($sehatCount / max(1, $validStatusCount)) * 100) : 0;

        $trendCategories = [];
        $trendSurveys = [];
        $trendValid = array_fill(0, 12, 0);

        $trendBuckets = [];
        foreach ($summaryRows as $summary) {
            if (! $summary->submitted_at) {
                continue;
            }

            $bucketKey = Carbon::parse($summary->submitted_at)->format('Y-m');
            if (! isset($trendBuckets[$bucketKey])) {
                $trendBuckets[$bucketKey] = [
                    'surveys' => 0,
                    'approved' => 0,
                ];
            }

            $trendBuckets[$bucketKey]['surveys']++;
            if ($summary->status === 'APPROVED') {
                $trendBuckets[$bucketKey]['approved']++;
            }
        }

        $trendValid = [];
        $monthCursor = $periodStart->copy()->startOfMonth();
        $monthEndCursor = $periodEnd->copy()->startOfMonth();
        while ($monthCursor->lte($monthEndCursor)) {
            $bucketKey = $monthCursor->format('Y-m');
            $bucket = $trendBuckets[$bucketKey] ?? ['surveys' => 0, 'approved' => 0];

            $trendCategories[] = $monthCursor->isoFormat('MMM');
            $trendSurveys[] = (int) $bucket['surveys'];
            $trendValid[] = (int) $bucket['approved'];
            $monthCursor->addMonth();
        }

        $regionRows = [];
        foreach ($processedFaskes as $pf) {
            if ($pf['coverage'] >= 90) $status = 'Baik';
            elseif ($pf['coverage'] >= 50) $status = 'Stabil';
            else $status = 'Perlu Eskalasi';
            
            $regionRows[] = [
                'area' => $pf['name'],
                'target' => number_format($pf['target'], 0, ',', '.'),
                'realisasi' => number_format($pf['total'], 0, ',', '.'),
                'coverage' => $pf['coverage'] . '%',
                'status' => $status
            ];
        }
        
        usort($regionRows, function($a, $b) {
            return (int)str_replace(['%', '.'], '', $b['coverage']) <=> (int)str_replace(['%', '.'], '', $a['coverage']);
        });

        $activeUnitCount = count(array_filter($processedFaskes, function($p) { return $p['total'] > 0; }));
        $totalUnitCount = count($processedFaskes);
        $unitSyncProgress = $totalUnitCount > 0 ? round(($activeUnitCount / $totalUnitCount) * 100) : 0;

        $slaProgress = 85; 
        
        $closedInterventions = Intervention::whereNotNull('result')
            ->whereHas('survey', function ($query) use ($periodStart, $periodEnd) {
                $query->whereBetween(DB::raw('COALESCE(submitted_at, created_at)'), [$periodStart, $periodEnd]);
            })
            ->count();
        $interventionProgress = $totalInterventions > 0 ? round(($closedInterventions / $totalInterventions) * 100) : 0;

        return response()->json([
            'filters' => !empty($filters) ? $filters : [['value' => (string) now()->year, 'label' => 'Tahun ' . now()->year]],
            'selectedFilter' => $selectedPeriod ? (string) $selectedPeriod->id : ($filters[0]['value'] ?? ''),
            'data' => [
                'targetValue' => $targetValue,
                'summary' => 'Dashboard admin memberikan gambaran komprehensif performa lintas level berdasarkan summary survei dan periode yang dipilih.',
                'cards' => [
                    ['label' => 'Survei Masuk', 'value' => number_format($totalSurveys, 0, ',', '.'), 'subtitle' => 'Periode '.strtolower($selectedPeriod?->name ?? 'aktif'), 'color' => 'blue'],
                    ['label' => 'IKS Wilayah', 'value' => number_format($avgIks, 3), 'subtitle' => 'Rata-rata IKS Wilayah', 'color' => 'teal'],
                    ['label' => 'Kader Aktif', 'value' => number_format($totalKaders, 0, ',', '.'), 'subtitle' => 'Total kader dalam sistem', 'color' => 'purple'],
                    ['label' => 'Backlog Validasi', 'value' => number_format($totalDrafts, 0, ',', '.'), 'subtitle' => 'Status SUBMITTED pada periode terpilih', 'color' => 'amber'],
                    ['label' => 'Intervensi Aktif', 'value' => number_format($totalInterventions, 0, ',', '.'), 'subtitle' => 'Tindak lanjut tercatat', 'color' => 'rose'],
                    ['label' => 'Puskesmas On Track', 'value' => "{$onTrackCount}/" . count($faskesList), 'subtitle' => 'IKS >= 0.8', 'color' => 'emerald'],
                    ['label' => 'Target Data Sehat', 'value' => "{$dinkesRep}%", 'subtitle' => 'Capaian sehat aktual', 'color' => 'blue', 'targetValue' => $targetValue, 'currentValue' => $dinkesRep, 'targetLabel' => "Target: {$targetValue}%"],
                ],
                'topInsights' => [
                    ['title' => 'Cakupan Pengisian Wilayah', 'value' => $unitSyncProgress . '%', 'note' => 'Puskesmas dengan setidaknya 1 survei pada periode terpilih.'],
                    ['title' => 'Rasio Validasi Puskesmas', 'value' => $puskesmasRep . '%', 'note' => 'Persentase survei yang berhasil diverifikasi dari seluruh survei masuk.'],
                    ['title' => 'Rasio Keluarga Sehat', 'value' => $dinkesRep . '%', 'note' => 'Persentase keluarga dengan seluruh indikator applicable bernilai Y.'],
                ],
                'trend' => [
                    'title' => 'Tren Masuk & Validasi Survei',
                    'categories' => $trendCategories,
                    'series' => [
                        ['name' => 'Survei Masuk', 'data' => $trendSurveys],
                        ['name' => 'Tervalidasi', 'data' => $trendValid],
                    ],
                ],
                'donut' => [
                    'title' => 'Proporsi Status Verifikasi',
                    'labels' => ['Valid', 'Revisi', 'Belum Dicek'],
                    'series' => [$validStatusCount, $revisiStatusCount, $submittedStatusCount],
                ],
                'supporting' => [
                    ['label' => 'Sinkronisasi unit', 'value' => "{$activeUnitCount}/{$totalUnitCount}", 'progress' => $unitSyncProgress, 'status' => $unitSyncProgress >= 90 ? 'Baik' : 'Pantau', 'note' => 'Unit puskesmas aktif.'],
                    ['label' => 'SLA validasi 48 jam', 'value' => $slaProgress . '%', 'progress' => $slaProgress, 'status' => $slaProgress >= 90 ? 'Baik' : 'Pantau', 'note' => 'Estimasi performa kecepatan validasi.'],
                    ['label' => 'Intervensi tertutup', 'value' => $interventionProgress . '%', 'progress' => $interventionProgress, 'status' => $interventionProgress >= 80 ? 'Baik' : 'Atensi', 'note' => 'Kasus intervensi yang telah memiliki hasil.'],
                ],
                'regions' => [
                    'title' => 'Ringkasan Capaian Wilayah Faskes',
                    'rows' => count($regionRows) > 0 ? array_slice($regionRows, 0, 10) : [
                        ['area' => '-', 'target' => '0', 'realisasi' => '0', 'coverage' => '0%', 'status' => '-']
                    ],
                ],
                'adminNotes' => [
                    ['title' => 'Data real-time periode ' . ($selectedPeriod?->name ?? now()->year), 'status' => 'Info', 'description' => 'Dashboard menggunakan summary survei yang tersinkron dari data pengisian aplikasi.'],
                    ['title' => 'Pantau Backlog Validasi', 'status' => $totalDrafts > 50 ? 'Prioritas' : 'Baik', 'description' => "Saat ini terdapat {$totalDrafts} survei yang menunggu divalidasi oleh puskesmas."],
                    ['title' => 'Tindak Lanjut Intervensi', 'status' => $interventionProgress < 50 ? 'Atensi' : 'Baik', 'description' => 'Pastikan puskesmas mendorong penyelesaian intervensi yang sedang berjalan.'],
                ],
            ]
        ]);
    }
}


