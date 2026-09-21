<?php

namespace Tests\Feature;

use App\Models\Survey;
use App\Models\User;
use App\Services\SurveySummaryService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SurveyVerificationDecisionTest extends TestCase
{
    use DatabaseTransactions;

    public function test_decision_updates_survey_summary_status(): void
    {
        [$puskesmasRoleId, $kaderRoleId] = $this->firstOrCreateRoles();
        $villageId = $this->seedRegion();

        $puskesmasUser = User::factory()->create([
            'role_id' => $puskesmasRoleId,
            'username' => 'puskesmas_verif_'.uniqid(),
            'full_name' => 'Puskesmas Verification',
        ]);

        $kader = User::factory()->create([
            'role_id' => $kaderRoleId,
            'username' => 'kader_verif_'.uniqid(),
            'full_name' => 'Kader Verification',
            'district_id' => '320416',
            'village_id' => $villageId,
        ]);

        $periodId = $this->createPeriod();
        $survey = $this->createSubmittedSurvey($kader->id, $periodId, $villageId);
        SurveySummaryService::generateSummaryForSurvey($survey->id);

        $this->assertDatabaseHas('summary_surveys', [
            'survey_id' => $survey->id,
            'status' => 'SUBMITTED',
            'iks_score' => 1,
            'is_iks_unhealthy' => 0,
            'is_phs_healthy' => 1,
        ]);

        Sanctum::actingAs($puskesmasUser);

        $response = $this->postJson('/api/puskesmas/surveys/verification/'.$survey->id.'/decision', [
            'action' => 'approve',
            'notes' => 'Valid',
        ]);

        $response->assertOk();
        $response->assertJsonPath('status', 'APPROVED');

        $this->assertDatabaseHas('summary_surveys', [
            'survey_id' => $survey->id,
            'status' => 'APPROVED',
            'iks_score' => 1,
            'is_iks_unhealthy' => 0,
            'is_phs_healthy' => 1,
        ]);
    }

    private function firstOrCreateRoles(): array
    {
        $puskesmasRoleId = (int) (\DB::table('roles')->where('code', 'puskesmas')->value('id')
            ?? \DB::table('roles')->insertGetId([
                'code' => 'puskesmas',
                'name' => 'Puskesmas',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));

        $kaderRoleId = (int) (\DB::table('roles')->where('code', 'kader')->value('id')
            ?? \DB::table('roles')->insertGetId([
                'code' => 'kader',
                'name' => 'Kader',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));

        return [$puskesmasRoleId, $kaderRoleId];
    }

    private function seedRegion(): string
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

        $villageId = '3204160097';
        \DB::table('reg_villages')->insertOrIgnore([
            'id' => $villageId,
            'district_id' => '320416',
            'name' => 'Desa Verification Test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $villageId;
    }

    private function createPeriod(): int
    {
        return (int) \DB::table('mstr_periods')->insertGetId([
            'year' => 2037,
            'name' => 'Periode 2037',
            'type' => 'REGULAR',
            'start_date' => '2037-01-01',
            'end_date' => '2037-12-31',
            'is_active' => true,
            'status' => 'ACTIVE',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createSubmittedSurvey(int $surveyorId, int $periodId, string $villageId): Survey
    {
        $questionnaireId = (int) \DB::table('mstr_yearly_questionnaires')->insertGetId([
            'period_id' => $periodId,
            'title' => 'Kuesioner Verification',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $householdId = (int) \DB::table('mstr_households')->insertGetId([
            'no_kk' => '33'.str_pad((string) random_int(1, 99999999999999), 14, '0', STR_PAD_LEFT),
            'head_of_family_name' => 'Keluarga Verification',
            'village_id' => $villageId,
            'rw' => '001',
            'rt' => '001',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $respondentId = (int) \DB::table('mstr_respondents')->insertGetId([
            'household_id' => $householdId,
            'nik' => '34'.str_pad((string) random_int(1, 99999999999999), 14, '0', STR_PAD_LEFT),
            'name' => 'Responden Verification',
            'gender' => 'L',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $survey = Survey::query()->create([
            'yearly_questionnaire_id' => $questionnaireId,
            'period_id' => $periodId,
            'surveyor_user_id' => $surveyorId,
            'respondent_id' => $respondentId,
            'age_at_survey' => 30,
            'status' => 'SUBMITTED',
            'submitted_at' => '2037-05-10 10:00:00',
            'created_at' => '2037-05-10 10:00:00',
            'updated_at' => '2037-05-10 10:00:00',
        ]);

        foreach (['Y', 'Y'] as $index => $answer) {
            $questionId = (int) \DB::table('mstr_questions')->insertGetId([
                'code' => 'Q-VERIF-'.uniqid().'-'.$index,
                'question_text' => 'Pertanyaan verification '.$index,
                'input_type' => 'RADIO',
                'min_age' => 0,
                'max_age' => 0,
                'indicator' => 'IND-VERIF-'.$index,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            \DB::table('mstr_question_options')->insert([
                [
                    'question_id' => $questionId,
                    'label' => 'Ya',
                    'value' => 'Y',
                    'sort_order' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'question_id' => $questionId,
                    'label' => 'Tidak',
                    'value' => 'N',
                    'sort_order' => 2,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            $questionItemId = (int) \DB::table('mstr_yearly_question_items')->insertGetId([
                'yearly_questionnaire_id' => $questionnaireId,
                'question_id' => $questionId,
                'sort_order' => $index + 1,
                'is_mandatory' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $optionId = (int) \DB::table('mstr_question_options')
                ->where('question_id', $questionId)
                ->where('value', $answer)
                ->value('id');

            \DB::table('trx_survey_answers')->insert([
                'survey_id' => $survey->id,
                'yearly_question_item_id' => $questionItemId,
                'answer_text' => $answer,
                'answer_option_id' => $optionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $survey;
    }
}
