<?php

namespace Tests\Feature;

use App\Models\Intervention;
use App\Models\Survey;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class KaderInterventionScopeTest extends TestCase
{
    use DatabaseTransactions;

    public function test_kader_only_sees_and_creates_interventions_within_own_survey_scope(): void
    {
        $roleId = $this->firstOrCreateKaderRole();
        $kaderA = User::factory()->create([
            'role_id' => $roleId,
            'username' => 'kader_a_'.uniqid(),
            'full_name' => 'Kader A',
        ]);
        $kaderB = User::factory()->create([
            'role_id' => $roleId,
            'username' => 'kader_b_'.uniqid(),
            'full_name' => 'Kader B',
        ]);

        $ownSurvey = $this->createSubmittedSurvey($kaderA->id, '320416', '3204162003', 'NIK-OWN', 'KK-OWN');
        $otherSurvey = $this->createSubmittedSurvey($kaderB->id, '320416', '3204162004', 'NIK-OTHER', 'KK-OTHER');

        Intervention::query()->create([
            'survey_id' => $ownSurvey->id,
            'kader_id' => $kaderA->id,
            'topic' => 'Edukasi gizi',
            'result' => 'Kunjungan awal selesai',
            'follow_up' => 'Pantau ulang',
        ]);

        Sanctum::actingAs($kaderA);

        $belumResponse = $this->getJson('/api/kader/interventions?tab=belum');
        $belumResponse->assertOk();
        $belumResponse->assertJsonPath('total', 0);

        $sudahResponse = $this->getJson('/api/kader/interventions?tab=sudah');
        $sudahResponse->assertOk();
        $sudahResponse->assertJsonPath('total', 1);
        $sudahResponse->assertJsonPath('data.0.id', $ownSurvey->id);
        $sudahResponse->assertJsonMissing(['id' => $otherSurvey->id]);

        $createOwn = $this->postJson('/api/kader/interventions', [
            'survey_id' => $ownSurvey->id,
            'topic' => 'Duplikat',
            'result' => 'Tidak boleh',
        ]);
        $createOwn->assertStatus(422);

        $createOther = $this->postJson('/api/kader/interventions', [
            'survey_id' => $otherSurvey->id,
            'topic' => 'Coba lintas user',
            'result' => 'Harus ditolak',
        ]);
        $createOther->assertForbidden();

        $freshOwnSurvey = $this->createSubmittedSurvey($kaderA->id, '320416', '3204162005', 'NIK-FRESH', 'KK-FRESH');
        $createFresh = $this->postJson('/api/kader/interventions', [
            'survey_id' => $freshOwnSurvey->id,
            'topic' => 'Konseling PHBS',
            'result' => 'Keluarga menerima edukasi',
            'follow_up' => 'Kontrol 1 minggu',
            'next_visit_at' => '2026-06-20 10:00:00',
        ]);

        $createFresh->assertCreated();
        $this->assertDatabaseHas('trx_interventions', [
            'survey_id' => $freshOwnSurvey->id,
            'kader_id' => $kaderA->id,
            'topic' => 'Konseling PHBS',
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

    private function createSubmittedSurvey(int $surveyorId, string $districtId, string $villageId, string $nik, string $kk): Survey
    {
        \DB::table('reg_provinces')->insert([
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
            'id' => $districtId,
            'regency_id' => '3204',
            'name' => 'Kecamatan Test '.$districtId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        \DB::table('reg_villages')->insertOrIgnore([
            'id' => $villageId,
            'district_id' => $districtId,
            'name' => 'Desa Test '.$villageId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $periodId = \DB::table('mstr_periods')->insertGetId([
            'year' => random_int(2024, 2030),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $questionnaireId = \DB::table('mstr_yearly_questionnaires')->insertGetId([
            'period_id' => $periodId,
            'title' => 'Kuesioner Test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $questionId = \DB::table('mstr_questions')->insertGetId([
            'code' => 'Q-'.uniqid(),
            'question_text' => 'Apakah sehat?',
            'input_type' => 'RADIO',
            'min_age' => 0,
            'max_age' => 0,
            'indicator' => 'IND-'.uniqid(),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $questionItemId = \DB::table('mstr_yearly_question_items')->insertGetId([
            'yearly_questionnaire_id' => $questionnaireId,
            'question_id' => $questionId,
            'sort_order' => 1,
            'is_mandatory' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $householdId = \DB::table('mstr_households')->insertGetId([
            'no_kk' => $kk,
            'head_of_family_name' => 'Kepala '.$kk,
            'village_id' => $villageId,
            'rw' => '001',
            'rt' => '001',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $respondentId = \DB::table('mstr_respondents')->insertGetId([
            'household_id' => $householdId,
            'nik' => $nik,
            'name' => 'Responden '.$nik,
            'gender' => 'P',
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
            'submitted_at' => now(),
        ]);

        \DB::table('trx_survey_answers')->insert([
            'survey_id' => $survey->id,
            'yearly_question_item_id' => $questionItemId,
            'answer_text' => 'N',
            'answer_option_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $survey->fresh();
    }
}
