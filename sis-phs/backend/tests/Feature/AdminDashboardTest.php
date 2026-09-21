<?php

namespace Tests\Feature;

use App\Models\Survey;
use App\Models\User;
use App\Services\SurveySummaryService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use DatabaseTransactions;

    public function test_dashboard_uses_selected_period_and_summary_consistently(): void
    {
        [$adminRoleId, $kaderRoleId] = $this->firstOrCreateRoles();
        $faskesId = $this->createFaskes();
        $villageId = $this->seedRegion();
        $this->attachVillageToFaskes($faskesId, $villageId);

        $adminUser = User::factory()->create([
            'role_id' => $adminRoleId,
            'username' => 'admin_dashboard_'.uniqid(),
            'full_name' => 'Admin Dashboard',
        ]);

        $kader = User::factory()->create([
            'role_id' => $kaderRoleId,
            'username' => 'kader_admin_dashboard_'.uniqid(),
            'full_name' => 'Kader Admin Dashboard',
            'district_id' => '320416',
            'village_id' => $villageId,
            'puskesmas_id' => $faskesId,
        ]);

        $periodHealthy = $this->createPeriod(2036, 'Periode 2036', '2036-01-01', '2036-12-31', true);
        $periodUnhealthy = $this->createPeriod(2035, 'Periode 2035', '2035-01-01', '2035-12-31', false);

        $this->createSurveyWithAnswers($kader->id, $periodHealthy, $villageId, ['Y', 'Y'], 'APPROVED', '2036-06-10 10:00:00');
        $this->createSurveyWithAnswers($kader->id, $periodUnhealthy, $villageId, ['Y', 'N'], 'APPROVED', '2035-06-10 10:00:00');

        Sanctum::actingAs($adminUser);

        $healthyResponse = $this->getJson('/api/admin/dashboard?filter='.$periodHealthy);
        $healthyResponse->assertOk();
        $healthyResponse->assertJsonPath('selectedFilter', (string) $periodHealthy);
        $healthyResponse->assertJsonPath('data.cards.0.value', '1');
        $healthyResponse->assertJsonPath('data.cards.1.value', '1.000');
        $healthyResponse->assertJsonPath('data.cards.3.value', '0');
        $healthyResponse->assertJsonPath('data.topInsights.1.value', '100%');
        $healthyResponse->assertJsonPath('data.topInsights.2.value', '100%');
        $healthyResponse->assertJsonPath('data.donut.series.0', 1);
        $healthyResponse->assertJsonPath('data.donut.series.1', 0);
        $healthyResponse->assertJsonPath('data.donut.series.2', 0);
        $healthyPayload = $healthyResponse->json();
        $this->assertStringStartsWith('1/', $healthyPayload['data']['cards'][5]['value']);
        $healthyRegion = collect($healthyPayload['data']['regions']['rows'])
            ->firstWhere('area', 'Puskesmas Admin Test');
        $this->assertNotNull($healthyRegion);
        $this->assertSame('1', $healthyRegion['realisasi']);

        $unhealthyResponse = $this->getJson('/api/admin/dashboard?filter='.$periodUnhealthy);
        $unhealthyResponse->assertOk();
        $unhealthyResponse->assertJsonPath('selectedFilter', (string) $periodUnhealthy);
        $unhealthyResponse->assertJsonPath('data.cards.0.value', '1');
        $unhealthyResponse->assertJsonPath('data.cards.1.value', '0.500');
        $unhealthyResponse->assertJsonPath('data.topInsights.1.value', '100%');
        $unhealthyResponse->assertJsonPath('data.topInsights.2.value', '0%');
        $unhealthyResponse->assertJsonPath('data.donut.series.0', 1);
        $unhealthyResponse->assertJsonPath('data.donut.series.1', 0);
        $unhealthyResponse->assertJsonPath('data.donut.series.2', 0);
        $unhealthyPayload = $unhealthyResponse->json();
        $this->assertStringStartsWith('0/', $unhealthyPayload['data']['cards'][5]['value']);
        $unhealthyRegion = collect($unhealthyPayload['data']['regions']['rows'])
            ->firstWhere('area', 'Puskesmas Admin Test');
        $this->assertNotNull($unhealthyRegion);
        $this->assertSame('1', $unhealthyRegion['realisasi']);
    }

    private function firstOrCreateRoles(): array
    {
        $adminRoleId = (int) (\DB::table('roles')->where('code', 'admin')->value('id')
            ?? \DB::table('roles')->insertGetId([
                'code' => 'admin',
                'name' => 'Admin',
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

        return [$adminRoleId, $kaderRoleId];
    }

    private function createFaskes(): int
    {
        return (int) \DB::table('mstr_faskes')->insertGetId([
            'code' => 'PKM-ADMIN-'.uniqid(),
            'name' => 'Puskesmas Admin Test',
            'type' => 'PUSKESMAS',
            'district_id' => '320416',
            'district_name' => 'Kecamatan Test',
            'regency_name' => 'Kabupaten Test',
            'address' => 'Jl. Admin No. 1',
            'phone' => '021222222',
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

        $villageId = '3204160098';
        \DB::table('reg_villages')->insertOrIgnore([
            'id' => $villageId,
            'district_id' => '320416',
            'name' => 'Desa Admin Test',
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
            'title' => 'Kuesioner Admin '.$periodId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $householdId = (int) \DB::table('mstr_households')->insertGetId([
            'no_kk' => '33'.str_pad((string) random_int(1, 99999999999999), 14, '0', STR_PAD_LEFT),
            'head_of_family_name' => 'Keluarga Admin',
            'village_id' => $villageId,
            'rw' => '001',
            'rt' => '001',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $respondentId = (int) \DB::table('mstr_respondents')->insertGetId([
            'household_id' => $householdId,
            'nik' => '34'.str_pad((string) random_int(1, 99999999999999), 14, '0', STR_PAD_LEFT),
            'name' => 'Responden Admin',
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
                'code' => 'Q-ADMIN-'.uniqid().'-'.$index,
                'question_text' => 'Pertanyaan admin '.$index,
                'input_type' => 'RADIO',
                'min_age' => 0,
                'max_age' => 0,
                'indicator' => 'IND-ADMIN-'.$index,
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
