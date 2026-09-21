<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SurveySummaryService
{
    /**
     * Generate or update summary for a given survey_id.
     */
    public static function generateSummaryForSurvey($surveyId)
    {
        // 1. Fetch Survey Data
        $survey = DB::table('trx_surveys as s')
            ->join('users as u', 's.surveyor_user_id', '=', 'u.id')
            ->join('mstr_respondents as r', 's.respondent_id', '=', 'r.id')
            ->where('s.id', $surveyId)
            ->select([
                's.id as survey_id',
                's.status',
                's.submitted_at',
                's.age_at_survey',
                's.surveyor_user_id',
                'r.household_id',
                'u.district_id',
                'u.puskesmas_id',
                'u.village_id',
                DB::raw("YEAR(COALESCE(s.submitted_at, s.created_at)) as survey_year"),
                DB::raw("CASE WHEN MONTH(COALESCE(s.submitted_at, s.created_at)) <= 6 THEN 'semester-1' ELSE 'semester-2' END as survey_period")
            ])
            ->first();

        if (!$survey) return;

        // Fetch Answers grouped by Indicator
        $answers = DB::table('trx_survey_answers as a')
            ->join('mstr_yearly_question_items as yqi', 'a.yearly_question_item_id', '=', 'yqi.id')
            ->join('mstr_questions as q', 'yqi.question_id', '=', 'q.id')
            ->leftJoin('mstr_question_options as o', 'a.answer_option_id', '=', 'o.id')
            ->where('a.survey_id', $surveyId)
            ->whereNotNull('q.indicator')
            ->select([
                'q.indicator',
                'q.min_age',
                'o.value as option_value',
                'a.answer_text',
            ])
            ->get();

        $indicators = [];
        // Group by indicator
        foreach ($answers as $ans) {
            if (!isset($indicators[$ans->indicator])) {
                $indicators[$ans->indicator] = [
                    'min_age' => $ans->min_age,
                    'is_applicable' => 0,
                    'is_healthy' => 1,
                    'all_y' => 1,
                ];
            }

            $val = strtoupper(trim((string) ($ans->option_value ?: $ans->answer_text)));

            if (!in_array($val, ['Y', 'N'], true)) {
                continue;
            }

            if (in_array($val, ['Y', 'N'], true)) {
                $indicators[$ans->indicator]['is_applicable'] = 1;
            }
            if ($val === 'N') {
                $indicators[$ans->indicator]['is_healthy'] = 0;
            }

            if ($val !== 'Y') {
                $indicators[$ans->indicator]['all_y'] = 0;
            }
        }

        // Aggregate IKS Score
        $totalApplicable = 0;
        $totalHealthy = 0;
        $isPhsHealthy = true; // Assumes healthy unless proven otherwise

        $indicatorInserts = [];

        foreach ($indicators as $indName => $data) {
            $totalApplicable += $data['is_applicable'];
            if ($data['is_applicable']) {
                $totalHealthy += $data['is_healthy'];
            }
            
            if ($data['all_y'] == 0) {
                $isPhsHealthy = false;
            }

            $indicatorInserts[] = [
                'survey_id' => $survey->survey_id,
                'indicator_name' => $indName,
                'district_id' => $survey->district_id,
                'puskesmas_id' => $survey->puskesmas_id,
                'village_id' => $survey->village_id,
                'survey_year' => $survey->survey_year,
                'survey_period' => $survey->survey_period,
                'status' => $survey->status,
                'submitted_at' => $survey->submitted_at,
                'min_age' => $data['min_age'],
                'is_applicable' => $data['is_applicable'],
                'is_healthy' => $data['is_healthy'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $iksScore = $totalApplicable > 0 ? ($totalHealthy / $totalApplicable) : 0;
        $isIksHealthy = ($iksScore == 1.0);
        $isIksUnhealthy = ($iksScore < 1.0);

        DB::beginTransaction();
        try {
            DB::table('summary_surveys')->updateOrInsert(
                ['survey_id' => $survey->survey_id],
                [
                    'household_id' => $survey->household_id,
                    'surveyor_user_id' => $survey->surveyor_user_id,
                    'district_id' => $survey->district_id,
                    'puskesmas_id' => $survey->puskesmas_id,
                    'village_id' => $survey->village_id,
                    'survey_year' => $survey->survey_year,
                    'survey_period' => $survey->survey_period,
                    'status' => $survey->status,
                    'submitted_at' => $survey->submitted_at,
                    'age_at_survey' => $survey->age_at_survey,
                    'iks_score' => $iksScore,
                    'is_iks_healthy' => $isIksHealthy,
                    'is_iks_unhealthy' => $isIksUnhealthy,
                    'is_phs_healthy' => $isPhsHealthy,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            DB::table('summary_survey_indicators')->where('survey_id', $survey->survey_id)->delete();

            if (!empty($indicatorInserts)) {
                DB::table('summary_survey_indicators')->insert($indicatorInserts);
            }

            DB::commit();
            
            // Invalidate Caches
            try {
                \App\Helpers\CacheBooster::refreshVersion("dashboard_kader_{$survey->surveyor_user_id}");
                if ($survey->puskesmas_id) {
                    \App\Helpers\CacheBooster::refreshVersion("dashboard_puskesmas_{$survey->puskesmas_id}");
                }
                \App\Helpers\CacheBooster::refreshVersion("dashboard_dinkes");
                \App\Helpers\CacheBooster::refreshVersion("reports");
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Failed to refresh cache version: ' . $e->getMessage());
            }
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
