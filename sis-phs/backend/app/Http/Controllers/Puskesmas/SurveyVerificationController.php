<?php

namespace App\Http\Controllers\Puskesmas;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Services\SurveySummaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SurveyVerificationController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 5);
        $search = $request->input('search');
        $districtId = $request->input('districtId');
        $villageId = $request->input('villageId');
        $status = $request->input('status');
        $user = $request->user();

        $query = Survey::with([
            'respondent.household.village.district',
            'surveyor',
            'answers.questionItem.question'
        ])->orderBy('submitted_at', 'desc');

        // Note: For now, we assume the Puskesmas user sees all surveys or is restricted 
        // to their area, but there is no specific puskesmas_id in Survey.
        // We'll filter based on search and parameters.

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%$search%")
                  ->orWhereHas('surveyor', function ($q2) use ($search) {
                      $q2->where('full_name', 'like', "%$search%");
                  })
                  ->orWhereHas('respondent', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%$search%")
                         ->orWhereHas('household', function ($q3) use ($search) {
                             $q3->where('head_of_family_name', 'like', "%$search%");
                         });
                  });
            });
        }

        if ($districtId) {
            $query->whereHas('respondent.household.village', function ($q) use ($districtId) {
                $q->where('district_id', $districtId);
            });
        }

        if ($villageId) {
            $query->whereHas('respondent.household', function ($q) use ($villageId) {
                $q->where('village_id', $villageId);
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        $paginator = $query->paginate($perPage);

        $items = collect($paginator->items())->map(function ($survey) {
            $totalAnswers = collect($survey->answers)->count();
            $yAnswers = collect($survey->answers)->filter(function($ans) {
                return $ans->answer_text === 'Y';
            })->count();

            // IKS 1 (Persentase)
            $iksScore1 = $totalAnswers > 0 ? ($yAnswers / $totalAnswers) * 100 : 0;
            
            // IKS 2 (Status)
            $iksScore2 = ($yAnswers == $totalAnswers && $totalAnswers > 0) ? 'SEHAT' : 'TIDAK SEHAT';

            $flaggedIndicators = collect($survey->answers)->filter(function($ans) {
                return $ans->answer_text !== 'Y';
            })->map(function($ans) {
                return $ans->questionItem->question->question_text ?? 'Indikator';
            })->values()->all();

            $detailAnswers = collect($survey->answers)->map(function ($ans) {
                return [
                    'question_text' => $ans->questionItem->question->question_text ?? 'Pertanyaan tidak ditemukan',
                    'answer_text' => $ans->answer_text,
                ];
            })->values()->all();

            // Determine puskesmas name (mocked or retrieved from user relations if available)
            // Since we don't have direct puskesmas relation here without more context,
            // we will use the surveyor's puskesmas if available, or just fallback.
            $puskesmasName = 'Puskesmas Terkait';

            return [
                'id' => $survey->id,
                'submittedAt' => $survey->submitted_at,
                'kaderName' => $survey->surveyor->full_name ?? '-',
                'puskesmasName' => $puskesmasName,
                'districtId' => $survey->respondent->household->village->district_id ?? null,
                'districtName' => $survey->respondent->household->village->district->name ?? '-',
                'villageId' => $survey->respondent->household->village_id ?? null,
                'villageName' => $survey->respondent->household->village->name ?? '-',
                'householdNo' => $survey->respondent->household->no_kk ?? '-',
                'householdHead' => $survey->respondent->household->head_of_family_name ?? '-',
                'respondentName' => $survey->respondent->name ?? '-',
                'respondentAge' => $survey->age_at_survey,
                'iksScore1' => round($iksScore1, 2),
                'iksScore2' => $iksScore2,
                'status' => $survey->status,
                'flaggedIndicators' => $flaggedIndicators,
                'answers' => $detailAnswers,
                'notes' => $survey->notes ?? '',
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

    public function decision(Request $request, $id)
    {
        $request->validate([
            'action' => 'required|in:approve,revision',
            'notes' => 'nullable|string',
        ]);

        $survey = Survey::findOrFail($id);
        
        $survey->status = $request->action === 'approve' ? 'APPROVED' : 'REVISION';
        if ($request->has('notes')) {
            $survey->notes = $request->input('notes');
        }
        $survey->save();
        SurveySummaryService::generateSummaryForSurvey($survey->id);

        return response()->json([
            'message' => 'Keputusan verifikasi berhasil disimpan.',
            'status' => $survey->status,
        ]);
    }
}
