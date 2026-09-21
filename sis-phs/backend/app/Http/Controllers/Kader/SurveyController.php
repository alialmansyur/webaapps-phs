<?php

namespace App\Http\Controllers\Kader;

use App\Http\Controllers\Controller;
use App\Models\Household;
use App\Models\Intervention;
use App\Models\Period;
use App\Models\Respondent;
use App\Models\Survey;
use App\Models\SurveyAnswer;
use App\Models\YearlyQuestionItem;
use App\Models\YearlyQuestionnaire;
use App\Services\SurveySummaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SurveyController extends Controller
{
    public function checkNik(Request $request)
    {
        $request->validate([
            'nik' => 'required|string',
        ]);

        $respondent = Respondent::where('nik', $request->nik)->first();
        if (!$respondent) {
            return response()->json(['exists' => false]);
        }

        $currentMonth = now()->month;
        $currentYear = now()->year;

        $surveyExists = Survey::where('respondent_id', $respondent->id)
            ->whereMonth('submitted_at', $currentMonth)
            ->whereYear('submitted_at', $currentYear)
            ->exists();

        return response()->json([
            'exists' => $surveyExists,
            'message' => $surveyExists ? 'Responden dengan NIK ini sudah mengisi survei pada bulan ini.' : null,
        ]);
    }

    public function questions()
    {
        $activePeriod = Period::where('is_active', true)->first();

        if (!$activePeriod) {
            // Fallback: cari kuesioner dari periode terakhir atau ambil mstr_questions langsung
            $questionnaire = YearlyQuestionnaire::latest()->first();
        } else {
            $questionnaire = YearlyQuestionnaire::where('period_id', $activePeriod->id)->first();
        }

        if (!$questionnaire) {
            return response()->json(['message' => 'Belum ada kuesioner aktif'], 404);
        }

        $items = YearlyQuestionItem::with(['question' => function($q) {
            $q->where('is_active', true);
        }, 'question.options' => function($q) {
            $q->orderBy('sort_order');
        }])
        ->whereHas('question', function($q) {
            $q->where('is_active', true);
        })
        ->where('yearly_questionnaire_id', $questionnaire->id)
        ->orderBy('sort_order')
        ->get();

        $formattedQuestions = $items->map(function ($item) {
            $q = $item->question;
            return [
                'id' => $item->id,
                'question_id' => $q->id,
                'code' => $q->code,
                'text' => $q->question_text,
                'input_type' => $q->input_type,
                'condition' => [
                    'type' => $q->min_age > 0 ? 'age_min' : ($q->max_age > 0 ? 'age_max' : null),
                    'value' => $q->min_age > 0 ? $q->min_age : ($q->max_age > 0 ? $q->max_age : null),
                ],
                'options' => $q->options->map(function ($opt) {
                    return [
                        'id' => $opt->id,
                        'label' => $opt->label,
                        'value' => $opt->value,
                    ];
                }),
                'is_mandatory' => $item->is_mandatory,
            ];
        });

        return response()->json([
            'questionnaire_id' => $questionnaire->id,
            'title' => $questionnaire->title,
            'questions' => $formattedQuestions,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'respondent' => 'required|array',
            'respondent.no_kk' => 'required|string',
            'respondent.nik' => 'required|string',
            'respondent.nama' => 'required|string',
            'respondent.umur' => 'required|numeric',
            'respondent.gender' => 'required|in:L,P',
            'respondent.rt' => 'required|string',
            'respondent.rw' => 'required|string',
            'respondent.alamat' => 'required|string',
            'responses' => 'required|array',
            'questionnaire_id' => 'required|exists:mstr_yearly_questionnaires,id',
        ]);

        $activePeriod = Period::where('is_active', true)->first();
        if (!$activePeriod) {
            return response()->json(['message' => 'Tidak ada periode aktif untuk menyimpan survei'], 400);
        }

        $user = $request->user();

        DB::beginTransaction();
        try {
            // Kita asumsikan kader ini terikat ke sebuah faskes_village, namun untuk simple-nya kita pakai satu village
            $villageId = $user->village_id;
            if (!$villageId) {
                $village = DB::table('reg_villages')->first();
                if (!$village) {
                    throw new \Exception('Tidak ada data desa (village) di database dan user belum di-assign ke desa.');
                }
                $villageId = $village->id;
            }

            $household = Household::updateOrCreate(
                ['no_kk' => $request->respondent['no_kk']],
                [
                    'head_of_family_name' => $request->respondent['nama'], // Asumsikan responden ini kepala keluarga untuk saat ini jika baru
                    'village_id' => $villageId,
                    'rw' => $request->respondent['rw'],
                    'rt' => $request->respondent['rt'],
                ]
            );

            $respondent = Respondent::updateOrCreate(
                ['nik' => $request->respondent['nik']],
                [
                    'household_id' => $household->id,
                    'name' => $request->respondent['nama'],
                    'gender' => $request->respondent['gender'],
                ]
            );

            $survey = Survey::create([
                'id' => Str::uuid(),
                'yearly_questionnaire_id' => $request->questionnaire_id,
                'period_id' => $activePeriod->id,
                'surveyor_user_id' => $user->id,
                'respondent_id' => $respondent->id,
                'age_at_survey' => $request->respondent['umur'],
                'status' => 'SUBMITTED',
                'submitted_at' => now(),
            ]);

            foreach ($request->responses as $resp) {
                $item = YearlyQuestionItem::find($resp['question_item_id']);
                if (!$item) continue;

                // Cari option id jika response_value adalah Y atau T dan question punya options
                $option = null;
                $answerText = $resp['answer'];
                
                $questionOption = DB::table('mstr_question_options')
                    ->where('question_id', $item->question_id)
                    ->where('value', $answerText)
                    ->first();
                    
                if ($questionOption) {
                    $option = $questionOption->id;
                }

                SurveyAnswer::create([
                    'survey_id' => $survey->id,
                    'yearly_question_item_id' => $item->id,
                    'answer_text' => $answerText,
                    'answer_option_id' => $option,
                ]);
            }

            SurveySummaryService::generateSummaryForSurvey($survey->id);

            DB::commit();

            return response()->json([
                'message' => 'Survei berhasil disimpan',
                'survey_id' => $survey->id,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menyimpan survei: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function history(Request $request)
    {
        $user = $request->user();
        $perPage = $request->input('perPage', 5);
        $search = $request->input('search');
        $districtId = $request->input('districtId');
        $villageId = $request->input('villageId');
        $validationStatus = $request->input('validationStatus');
        $healthStatus = $request->input('healthStatus');

        $query = Survey::with([
            'respondent.household.village.district',
            'interventions' => function ($builder) {
                $builder->latest();
            },
        ])
            ->withCount('answers')
            ->withCount([
                'answers as healthy_answers_count' => function ($builder) {
                    $builder->where('answer_text', 'Y');
                },
            ])
            ->where('surveyor_user_id', $user->id)
            ->orderBy('submitted_at', 'desc');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('id', 'like', "%$search%")
                  ->orWhereHas('respondent', function($q2) use ($search) {
                      $q2->where('name', 'like', "%$search%")
                         ->orWhere('nik', 'like', "%$search%")
                         ->orWhereHas('household', function($q3) use ($search) {
                             $q3->where('head_of_family_name', 'like', "%$search%")
                                ->orWhere('no_kk', 'like', "%$search%");
                         });
                  });
            });
        }

        if ($villageId) {
            $query->whereHas('respondent.household', function($q) use ($villageId) {
                $q->where('village_id', $villageId);
            });
        }

        if ($districtId) {
            $query->whereHas('respondent.household.village', function($q) use ($districtId) {
                $q->where('district_id', $districtId);
            });
        }

        if ($validationStatus) {
            $query->where('status', $validationStatus);
        }

        if ($healthStatus === 'SEHAT') {
            $query->whereDoesntHave('answers', function($q) {
                $q->where('answer_text', '!=', 'Y');
            })->whereHas('answers');
        } elseif ($healthStatus === 'TIDAK_SEHAT') {
            $query->whereHas('answers', function($q) {
                $q->where('answer_text', '!=', 'Y');
            });
        }

        $paginator = $query->paginate($perPage);

        $items = collect($paginator->items())->map(function ($survey) {
            $totalAnswers = (int) $survey->answers_count;
            $yAnswers = (int) $survey->healthy_answers_count;
            $iksScore = $totalAnswers > 0 ? ($yAnswers / $totalAnswers) : 0;
            $healthStatusVal = ($yAnswers == $totalAnswers && $totalAnswers > 0) ? 'SEHAT' : 'TIDAK_SEHAT';
            $validationMapped = $survey->status === 'SUBMITTED' ? 'SUBMITTED' : 
                ($survey->status === 'APPROVED' ? 'APPROVED' : 
                ($survey->status === 'REVISION' ? 'REVISION' : 
                ($survey->status === 'REJECTED' ? 'REJECTED' : 'SUBMITTED')));
            $latestIntervention = $survey->interventions->first();
            $needsIntervention = $healthStatusVal === 'TIDAK_SEHAT';

            return [
                'id' => $survey->id,
                'respondentNik' => $survey->respondent->nik ?? '-',
                'householdNo' => $survey->respondent->household->no_kk ?? '-',
                'householdHead' => $survey->respondent->household->head_of_family_name ?? '-',
                'respondentName' => $survey->respondent->name ?? '-',
                'submittedAt' => $survey->submitted_at,
                'iksScore' => $iksScore,
                'healthStatus' => $healthStatusVal,
                'validationStatus' => $validationMapped,
                'interventionStatus' => $this->resolveHistoryInterventionStatus($latestIntervention, $needsIntervention, $validationMapped),
                'revisionNote' => in_array($validationMapped, ['REVISION', 'REJECTED'], true) ? ($survey->notes ?: null) : null,
            ];
        });

        return response()->json([
            'data' => $items,
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

    public function historyDetail(Request $request, string $surveyId)
    {
        $survey = Survey::with([
            'respondent.household.village.district',
            'answers.questionItem.question',
            'interventions' => function ($builder) {
                $builder->latest();
            },
        ])
            ->where('surveyor_user_id', $request->user()->id)
            ->where('id', $surveyId)
            ->firstOrFail();

        $totalAnswers = $survey->answers->count();
        $yAnswers = $survey->answers->where('answer_text', 'Y')->count();
        $iksScore = $totalAnswers > 0 ? ($yAnswers / $totalAnswers) : 0;
        $healthStatusVal = ($yAnswers == $totalAnswers && $totalAnswers > 0) ? 'SEHAT' : 'TIDAK_SEHAT';
        $validationMapped = $survey->status === 'SUBMITTED' ? 'SUBMITTED' :
            ($survey->status === 'APPROVED' ? 'APPROVED' :
            ($survey->status === 'REVISION' ? 'REVISION' :
            ($survey->status === 'REJECTED' ? 'REJECTED' : 'SUBMITTED')));
        $latestIntervention = $survey->interventions->first();
        $needsIntervention = $healthStatusVal === 'TIDAK_SEHAT';

        return response()->json([
            'data' => [
                'id' => $survey->id,
                'respondentNik' => $survey->respondent->nik ?? '-',
                'householdNo' => $survey->respondent->household->no_kk ?? '-',
                'householdHead' => $survey->respondent->household->head_of_family_name ?? '-',
                'respondentName' => $survey->respondent->name ?? '-',
                'submittedAt' => $survey->submitted_at,
                'iksScore' => $iksScore,
                'healthStatus' => $healthStatusVal,
                'validationStatus' => $validationMapped,
                'interventionStatus' => $this->resolveHistoryInterventionStatus($latestIntervention, $needsIntervention, $validationMapped),
                'revisionNote' => in_array($validationMapped, ['REVISION', 'REJECTED'], true) ? ($survey->notes ?: null) : null,
                'answers' => $survey->answers->map(function ($answer) {
                    return [
                        'question_text' => $answer->questionItem->question->question_text ?? 'Pertanyaan tidak ditemukan',
                        'answer_text' => $answer->answer_text,
                    ];
                })->values()->all(),
            ],
        ]);
    }

    private function resolveHistoryInterventionStatus(?Intervention $intervention, bool $needsIntervention, string $validationStatus): string
    {
        if (in_array($validationStatus, ['REVISION', 'REJECTED'], true)) {
            return 'Menunggu perbaikan data';
        }

        if (! $needsIntervention) {
            return 'Tidak perlu intervensi';
        }

        if (! $intervention) {
            return 'Belum intervensi';
        }

        if ($intervention->next_visit_at && now()->gt($intervention->next_visit_at)) {
            return 'Perlu kunjungan ulang';
        }

        if (! empty($intervention->result) && empty($intervention->next_visit_at)) {
            return 'Selesai edukasi';
        }

        if (! empty($intervention->next_visit_at)) {
            return 'Terjadwal';
        }

        return 'Sedang ditindaklanjuti';
    }
}
