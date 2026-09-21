<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class KaderSurveyStoreSummaryTest extends TestCase
{
    use DatabaseTransactions;

    public function test_kader_store_generates_summary_after_answers_are_saved(): void
    {
        $roleId = $this->firstOrCreateKaderRole();
        $periodId = $this->createActivePeriod();
        $questionnaireId = $this->createQuestionnaire($periodId);
        $questions = $this->createQuestionsWithOptions($questionnaireId, [
            ['code' => 'Q-KADER-1', 'indicator' => 'IND-KADER-1'],
            ['code' => 'Q-KADER-2', 'indicator' => 'IND-KADER-2'],
        ]);

        $kader = User::factory()->create([
            'role_id' => $roleId,
            'username' => 'kader_store_'.uniqid(),
            'full_name' => 'Kader Store',
            'district_id' => '320416',
            'village_id' => '3204160001',
        ]);

        Sanctum::actingAs($kader);

        $response = $this->postJson('/api/kader/surveys', [
            'questionnaire_id' => $questionnaireId,
            'respondent' => [
                'no_kk' => '3172012301000099',
                'nik' => '3172012301000088',
                'nama' => 'Budi Survey',
                'umur' => 35,
                'gender' => 'L',
                'rt' => '001',
                'rw' => '002',
                'alamat' => 'Jl. Test No. 1',
            ],
            'responses' => [
                [
                    'question_item_id' => $questions[0]['item_id'],
                    'answer' => 'Y',
                ],
                [
                    'question_item_id' => $questions[1]['item_id'],
                    'answer' => 'Y',
                ],
            ],
        ]);

        $response->assertCreated();
        $surveyId = $response->json('survey_id');

        $this->assertDatabaseHas('summary_surveys', [
            'survey_id' => $surveyId,
            'iks_score' => 1,
            'is_iks_healthy' => 1,
            'is_iks_unhealthy' => 0,
            'is_phs_healthy' => 1,
        ]);
    }

    private function firstOrCreateKaderRole(): int
    {
        $existing = \DB::table('roles')->where('code', 'kader')->value('id');

        if ($existing) {
            return (int) $existing;
        }

        return (int) \DB::table('roles')->insertGetId([
            'code' => 'kader',
            'name' => 'Kader',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createActivePeriod(): int
    {
        $this->seedRegion();

        return (int) \DB::table('mstr_periods')->insertGetId([
            'year' => random_int(2031, 2040),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createQuestionnaire(int $periodId): int
    {
        return (int) \DB::table('mstr_yearly_questionnaires')->insertGetId([
            'period_id' => $periodId,
            'title' => 'Kuesioner Kader Test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createQuestionsWithOptions(int $questionnaireId, array $questions): array
    {
        $records = [];

        foreach ($questions as $index => $question) {
            $questionId = (int) \DB::table('mstr_questions')->insertGetId([
                'code' => $question['code'].'-'.uniqid(),
                'question_text' => 'Pertanyaan '.$question['code'],
                'input_type' => 'RADIO',
                'min_age' => 0,
                'max_age' => 0,
                'indicator' => $question['indicator'],
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

            $itemId = (int) \DB::table('mstr_yearly_question_items')->insertGetId([
                'yearly_questionnaire_id' => $questionnaireId,
                'question_id' => $questionId,
                'sort_order' => $index + 1,
                'is_mandatory' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $records[] = [
                'question_id' => $questionId,
                'item_id' => $itemId,
            ];
        }

        return $records;
    }

    private function seedRegion(): void
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

        \DB::table('reg_villages')->insertOrIgnore([
            'id' => '3204160001',
            'district_id' => '320416',
            'name' => 'Desa Test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
