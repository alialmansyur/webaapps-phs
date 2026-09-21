<?php

namespace Tests\Feature;

use App\Models\Survey;
use App\Models\User;
use App\Services\SurveySummaryService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class SurveySummaryServiceTest extends TestCase
{
    use DatabaseTransactions;

    public function test_summary_uses_y_n_rule_for_healthy_and_unhealthy_scores(): void
    {
        $roleId = (int) (\DB::table('roles')->where('code', 'kader')->value('id')
            ?? \DB::table('roles')->insertGetId([
                'code' => 'kader',
                'name' => 'Kader',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));

        $user = User::factory()->create([
            'role_id' => $roleId,
            'username' => 'kader_summary_'.uniqid(),
            'full_name' => 'Kader Summary',
        ]);

        $healthySurvey = $this->createSurveyWithAnswers($user->id, ['Y', 'Y']);
        SurveySummaryService::generateSummaryForSurvey($healthySurvey->id);

        $this->assertDatabaseHas('summary_surveys', [
            'survey_id' => $healthySurvey->id,
            'iks_score' => 1,
            'is_iks_healthy' => 1,
            'is_iks_unhealthy' => 0,
            'is_phs_healthy' => 1,
        ]);

        $unhealthySurvey = $this->createSurveyWithAnswers($user->id, ['Y', 'N']);
        SurveySummaryService::generateSummaryForSurvey($unhealthySurvey->id);

        $this->assertDatabaseHas('summary_surveys', [
            'survey_id' => $unhealthySurvey->id,
            'iks_score' => 0.5,
            'is_iks_healthy' => 0,
            'is_iks_unhealthy' => 1,
            'is_phs_healthy' => 0,
        ]);
    }

    private function createSurveyWithAnswers(int $surveyorId, array $answers): Survey
    {
        \DB::table('reg_provinces')->insertOrIgnore([
            'id' => '32',
            'name' => 'Jawa Barat',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        \DB::table('reg_regencies')->insertOrIgnore([
            'id' => '3204',
            'province_id' => '32',
            'name' => 'Kabupaten Test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        \DB::table('reg_districts')->insertOrIgnore([
            'id' => '320416',
            'regency_id' => '3204',
            'name' => 'Kecamatan Test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $villageId = '320416'.str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        \DB::table('reg_villages')->insert([
            'id' => $villageId,
            'district_id' => '320416',
            'name' => 'Desa '.$villageId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $periodId = \DB::table('mstr_periods')->insertGetId([
            'year' => random_int(2031, 2040),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $questionnaireId = \DB::table('mstr_yearly_questionnaires')->insertGetId([
            'period_id' => $periodId,
            'title' => 'Kuesioner Summary',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $householdId = \DB::table('mstr_households')->insertGetId([
            'no_kk' => 'KK-'.uniqid(),
            'head_of_family_name' => 'Kepala Keluarga',
            'village_id' => $villageId,
            'rw' => '001',
            'rt' => '001',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $respondentId = \DB::table('mstr_respondents')->insertGetId([
            'household_id' => $householdId,
            'nik' => 'NIK-'.uniqid(),
            'name' => 'Responden Summary',
            'gender' => 'L',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $survey = Survey::query()->create([
            'yearly_questionnaire_id' => $questionnaireId,
            'period_id' => $periodId,
            'surveyor_user_id' => $surveyorId,
            'respondent_id' => $respondentId,
            'age_at_survey' => 40,
            'status' => 'SUBMITTED',
            'submitted_at' => now(),
        ]);

        foreach (array_values($answers) as $index => $answer) {
            $questionId = \DB::table('mstr_questions')->insertGetId([
                'code' => 'QSUM-'.uniqid().'-'.$index,
                'question_text' => 'Pertanyaan '.$index,
                'input_type' => 'RADIO',
                'min_age' => 0,
                'max_age' => 0,
                'indicator' => 'IND-SUM-'.$index,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $questionItemId = \DB::table('mstr_yearly_question_items')->insertGetId([
                'yearly_questionnaire_id' => $questionnaireId,
                'question_id' => $questionId,
                'sort_order' => $index + 1,
                'is_mandatory' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            \DB::table('trx_survey_answers')->insert([
                'survey_id' => $survey->id,
                'yearly_question_item_id' => $questionItemId,
                'answer_text' => $answer,
                'answer_option_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $survey;
    }
}
