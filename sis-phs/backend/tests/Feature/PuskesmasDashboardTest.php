<?php

namespace Tests\Feature;

use App\Models\Survey;
use App\Models\User;
use App\Services\SurveySummaryService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PuskesmasDashboardTest extends TestCase
{
    use DatabaseTransactions;

    public function test_dashboard_uses_selected_period_and_summary_consistently(): void
    {
        [$puskesmasRoleId, $kaderRoleId] = $this->firstOrCreateRoles();
        $faskesId = $this->createFaskes();
        $villageId = $this->seedRegion();
        $this->attachVillageToFaskes($faskesId, $villageId);

        $puskesmasUser = User::factory()->create([
            'role_id' => $puskesmasRoleId,
            'username' => 'puskesmas_dashboard_'.uniqid(),
            'full_name' => 'Admin Puskesmas Dashboard',
            'puskesmas_id' => $faskesId,
        ]);

        $kader = User::factory()->create([
            'role_id' => $kaderRoleId,
            'username' => 'kader_dashboard_'.uniqid(),
            'full_name' => 'Kader Dashboard',
            'district_id' => '320416',
            'village_id' => $villageId,
            'puskesmas_id' => $faskesId,
        ]);

        $period2026 = $this->createPeriod(2036, 'Periode 2036', '2036-01-01', '2036-12-31', true);
        $period2025 = $this->createPeriod(2035, 'Periode 2035', '2035-01-01', '2035-12-31', false);

        $this->createSurveyWithAnswers($kader->id, $period2026, $villageId, ['Y', 'Y'], 'APPROVED', '2036-06-10 10:00:00');
        $this->createSurveyWithAnswers($kader->id, $period2025, $villageId, ['Y', 'N'], 'APPROVED', '2035-06-10 10:00:00');

        Sanctum::actingAs($puskesmasUser);

        $period2026Response = $this->getJson('/api/puskesmas/dashboard?filter='.$period2026);
        $period2026Response->assertOk();
        $period2026Response->assertJsonPath('selectedFilter', (string) $period2026);
        $period2026Response->assertJsonPath('data.cards.1.value', '1');
        $period2026Response->assertJsonPath('data.villages.rows.0.iks', '1.00');
        $period2026Response->assertJsonPath('data.villages.rows.0.status', 'Baik');

        $period2025Response = $this->getJson('/api/puskesmas/dashboard?filter='.$period2025);
        $period2025Response->assertOk();
        $period2025Response->assertJsonPath('selectedFilter', (string) $period2025);
        $period2025Response->assertJsonPath('data.cards.1.value', '1');
        $period2025Response->assertJsonPath('data.villages.rows.0.iks', '0.50');
        $period2025Response->assertJsonPath('data.villages.rows.0.status', 'Stabil');
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

    private function createFaskes(): int
    {
        return (int) \DB::table('mstr_faskes')->insertGetId([
            'code' => 'PKM-TEST-'.uniqid(),
            'name' => 'Puskesmas Test Dashboard',
            'type' => 'PUSKESMAS',
            'district_id' => '320416',
            'district_name' => 'Kecamatan Test',
            'regency_name' => 'Kabupaten Test',
            'address' => 'Jl. Dashboard No. 1',
            'phone' => '021000000',
            'is_active' => true,
            'cadre_count' => 3,
            'household_coverage' => 10,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
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

        $villageId = '3204160001';
        \DB::table('reg_villages')->insertOrIgnore([
            'id' => $villageId,
            'district_id' => '320416',
            'name' => 'Desa Test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $villageId;
    }

    private function attachVillageToFaskes(int $faskesId, string $villageId): void
    {
        \DB::table('mstr_faskes_villages')->insert([
            'faskes_id' => $faskesId,
            'village_id' => $villageId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createPeriod(int $year, string $name, string $startDate, string $endDate, bool $isActive): int
    {
        return (int) \DB::table('mstr_periods')->insertGetId([
            'year' => $year,
            'name' => $name,
            'type' => 'REGULAR',
            'start_date' => $startDate,
            'end_date' => $endDate,
            'is_active' => $isActive,
            'status' => $isActive ? 'ACTIVE' : 'CLOSED',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createSurveyWithAnswers(
        int $surveyorId,
        int $periodId,
        string $villageId,
        array $answers,
        string $status,
        string $submittedAt
    ): void {
        $questionnaireId = (int) \DB::table('mstr_yearly_questionnaires')->insertGetId([
            'period_id' => $periodId,
            'title' => 'Kuesioner Dashboard '.$periodId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $householdId = (int) \DB::table('mstr_households')->insertGetId([
            'no_kk' => 'KK-'.uniqid(),
            'head_of_family_name' => 'Keluarga Dashboard',
            'village_id' => $villageId,
            'rw' => '001',
            'rt' => '001',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $respondentId = (int) \DB::table('mstr_respondents')->insertGetId([
            'household_id' => $householdId,
            'nik' => 'NIK-'.uniqid(),
            'name' => 'Responden Dashboard',
            'gender' => 'L',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $survey = Survey::query()->create([
            'yearly_questionnaire_id' => $questionnaireId,
            'period_id' => $periodId,
            'surveyor_user_id' => $surveyorId,
            'respondent_id' => $respondentId,
            'age_at_survey' => 35,
            'status' => $status,
            'submitted_at' => $submittedAt,
            'created_at' => $submittedAt,
            'updated_at' => $submittedAt,
        ]);

        foreach (array_values($answers) as $index => $answer) {
            $questionId = (int) \DB::table('mstr_questions')->insertGetId([
                'code' => 'Q-DSH-'.uniqid().'-'.$index,
                'question_text' => 'Pertanyaan dashboard '.$index,
                'input_type' => 'RADIO',
                'min_age' => 0,
                'max_age' => 0,
                'indicator' => 'IND-DSH-'.$index,
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
                'created_at' => $submittedAt,
                'updated_at' => $submittedAt,
            ]);
        }

        SurveySummaryService::generateSummaryForSurvey($survey->id);
    }
}
