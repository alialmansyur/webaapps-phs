<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Intervention;
use App\Models\Survey;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class InterventionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $perPage = $request->input('perPage', 10);
        $search = $request->input('search');
        $tab = $request->input('tab', 'belum'); // 'belum' or 'sudah'

        $query = Survey::with([
            'respondent.household.village.district',
            'respondent.household.village.faskes',
            'interventions' => function ($builder) use ($user) {
                $builder->where('kader_id', $user->id)->latest();
            },
        ])
        ->where('surveyor_user_id', $user->id)
        ->where('status', 'SUBMITTED')
        ->whereHas('answers', function ($q) {
            $q->where('answer_text', 'N');
        });

        if ($tab === 'sudah') {
            $query->whereHas('interventions', function ($builder) use ($user) {
                $builder->where('kader_id', $user->id);
            });
        } else {
            $query->whereDoesntHave('interventions', function ($builder) use ($user) {
                $builder->where('kader_id', $user->id);
            });
        }

        if ($search) {
            $query->whereHas('respondent', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nik', 'like', "%{$search}%")
                  ->orWhereHas('household', function ($q2) use ($search) {
                      $q2->where('head_of_family_name', 'like', "%{$search}%");
                  });
            });
        }

        $surveys = $query->latest()->paginate($perPage);

        // Transform data
        $surveys->getCollection()->transform(function ($survey) use ($tab) {
            $respondent = $survey->respondent;
            $household = $respondent?->household;
            $village = $household?->village;
            $district = $village ? $village->district : null;

            $item = [
                'id' => $survey->id,
                'respondentName' => $respondent?->name ?? '-',
                'householdHead' => $household?->head_of_family_name ?? '-',
                'householdNo' => $household?->no_kk ?? '-',
                'villageName' => $village->name ?? '-',
                'districtName' => $district->name ?? '-',
                'puskesmasName' => ($village && $village->faskes->count() > 0) ? $village->faskes->first()->name : '-',
                'status' => 'Tidak Sehat',
            ];

            if ($tab === 'sudah') {
                $intervention = $survey->interventions->first();
                $item['topic'] = $intervention?->topic ?? '-';
                $item['result'] = $intervention?->result ?? '-';
                $item['followUp'] = $intervention?->follow_up;
                $item['nextVisitAt'] = $intervention?->next_visit_at;
                $item['intervenedAt'] = $intervention?->created_at;
            }

            return $item;
        });

        return response()->json($surveys);
    }

    public function log(Request $request)
    {
        $user = $request->user();
        $perPage = $request->input('perPage', 5);

        $query = Intervention::query()
            ->with([
                'survey.respondent.household.village.district',
                'survey.respondent.household.village.faskes',
                'kader',
            ])
            ->where('kader_id', $user->id)
            ->whereHas('survey', function ($builder) use ($user) {
                $builder->where('surveyor_user_id', $user->id);
            });

        if ($search = $request->input('search')) {
            $query->where(function ($builder) use ($search) {
                $builder->where('topic', 'like', "%{$search}%")
                    ->orWhere('result', 'like', "%{$search}%")
                    ->orWhere('follow_up', 'like', "%{$search}%")
                    ->orWhereHas('survey.respondent', function ($respondentQuery) use ($search) {
                        $respondentQuery->where('name', 'like', "%{$search}%")
                            ->orWhereHas('household', function ($householdQuery) use ($search) {
                                $householdQuery->where('head_of_family_name', 'like', "%{$search}%")
                                    ->orWhere('no_kk', 'like', "%{$search}%");
                            });
                    });
            });
        }

        if ($districtId = $request->input('districtId')) {
            $query->whereHas('survey.respondent.household.village', function ($builder) use ($districtId) {
                $builder->where('district_id', $districtId);
            });
        }

        if ($villageId = $request->input('villageId')) {
            $query->whereHas('survey.respondent.household', function ($builder) use ($villageId) {
                $builder->where('village_id', $villageId);
            });
        }

        if ($status = $request->input('status')) {
            $now = now();

            $query->where(function ($builder) use ($status, $now) {
                if ($status === 'DONE') {
                    $builder->whereNotNull('result')
                        ->where(function ($doneQuery) {
                            $doneQuery->whereNull('next_visit_at')
                                ->orWhere('follow_up', '=', '');
                        });

                    return;
                }

                if ($status === 'OVERDUE') {
                    $builder->whereNotNull('next_visit_at')
                        ->where('next_visit_at', '<', $now);

                    return;
                }

                if ($status === 'SCHEDULED') {
                    $builder->whereNotNull('next_visit_at')
                        ->where('next_visit_at', '>=', $now)
                        ->where(function ($scheduledQuery) {
                            $scheduledQuery->whereNull('result')
                                ->orWhere('result', '=', '');
                        });

                    return;
                }

                if ($status === 'ONGOING') {
                    $builder->whereNotNull('result')
                        ->where('result', '!=', '')
                        ->whereNotNull('next_visit_at')
                        ->where('next_visit_at', '>=', $now);

                    return;
                }

                $builder->where(function ($pendingQuery) {
                    $pendingQuery->whereNull('result')
                        ->orWhere('result', '=', '');
                });
            });
        }

        $interventions = $query->latest()->paginate($perPage);
        $interventions->getCollection()->transform(function ($intervention) {
            return $this->transformLogItem($intervention);
        });

        return response()->json($interventions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'survey_id' => 'required|uuid|exists:trx_surveys,id',
            'topic' => 'required|string',
            'result' => 'required|string',
            'follow_up' => 'nullable|string',
            'next_visit_at' => 'nullable|date',
        ]);

        $survey = Survey::query()
            ->where('id', $validated['survey_id'])
            ->where('surveyor_user_id', $request->user()->id)
            ->where('status', 'SUBMITTED')
            ->whereHas('answers', function ($builder) {
                $builder->where('answer_text', 'N');
            })
            ->first();

        if (! $survey) {
            throw new HttpException(403, 'Survey tidak berada dalam scope kader Anda atau tidak valid untuk intervensi.');
        }

        $alreadyIntervened = Intervention::query()
            ->where('survey_id', $survey->id)
            ->where('kader_id', $request->user()->id)
            ->exists();

        if ($alreadyIntervened) {
            throw new HttpException(422, 'Intervensi untuk survey ini sudah pernah dicatat.');
        }

        $intervention = Intervention::create([
            'id' => Str::uuid(),
            'survey_id' => $survey->id,
            'kader_id' => $request->user()->id,
            'topic' => $validated['topic'],
            'result' => $validated['result'],
            'follow_up' => $validated['follow_up'] ?? null,
            'next_visit_at' => ! empty($validated['next_visit_at']) ? date('Y-m-d H:i:s', strtotime($validated['next_visit_at'])) : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Edukasi berhasil dicatat.',
            'data' => $intervention,
        ]);
    }

    private function transformLogItem(Intervention $intervention): array
    {
        $survey = $intervention->survey;
        $respondent = $survey?->respondent;
        $household = $respondent?->household;
        $village = $household?->village;
        $district = $village?->district;

        return [
            'id' => $intervention->id,
            'surveyId' => $intervention->survey_id,
            'respondentName' => $respondent?->name ?? '-',
            'householdHead' => $household?->head_of_family_name ?? '-',
            'householdNo' => $household?->no_kk ?? '-',
            'districtName' => $district?->name ?? '-',
            'villageName' => $village?->name ?? '-',
            'puskesmasName' => ($village && $village->faskes->count() > 0) ? $village->faskes->first()->name : '-',
            'recordedBy' => $intervention->kader?->full_name ?? $intervention->kader?->name ?? '-',
            'topic' => $intervention->topic,
            'result' => $intervention->result,
            'followUp' => $intervention->follow_up ?: '-',
            'status' => $this->resolveInterventionProgressStatus($intervention),
            'createdAt' => $intervention->created_at,
            'updatedAt' => $intervention->updated_at,
            'nextVisitAt' => $intervention->next_visit_at,
        ];
    }

    private function resolveInterventionProgressStatus(Intervention $intervention): string
    {
        if ($intervention->next_visit_at && strtotime((string) $intervention->next_visit_at) < time()) {
            return 'OVERDUE';
        }

        if (! empty($intervention->result) && empty($intervention->next_visit_at)) {
            return 'DONE';
        }

        if (! empty($intervention->result)) {
            return 'ONGOING';
        }

        if (! empty($intervention->next_visit_at)) {
            return 'SCHEDULED';
        }

        return 'PENDING';
    }
}
