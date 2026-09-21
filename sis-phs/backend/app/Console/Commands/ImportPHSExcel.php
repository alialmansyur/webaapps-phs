<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\MstrHousehold;
use App\Models\MstrRespondent;
use App\Models\TrxSurvey;
use App\Models\TrxSurveyAnswer;
use App\Models\RegVillage;
use App\Models\MstrPeriod;
use App\Models\MstrYearlyQuestionnaire;
use App\Models\MstrYearlyQuestionItem;
use App\Models\MstrQuestion;
use App\Models\MstrQuestionOption;
use App\Models\Role;

class ImportPHSExcel extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'phs:import-excel';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import PHS data from JSON dumped from Excel';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $path = storage_path('app/phs_data.json');
        
        if (!file_exists($path)) {
            $this->error("File not found at $path");
            return;
        }

        $data = json_decode(file_get_contents($path), true);
        if (!$data) {
            $this->error("Invalid JSON data.");
            return;
        }

        $this->info("Importing " . count($data) . " rows.");

        // Preload roles, questions, options to minimize DB queries
        $kaderRole = DB::table('roles')->where('name', 'like', '%Kader%')->first();
        $roleId = $kaderRole ? $kaderRole->id : null;

        // Map Questions PHS-101 to PHS-106
        $questions = DB::table('mstr_questions')->whereIn('code', ['PHS-101', 'PHS-102', 'PHS-103', 'PHS-104', 'PHS-105', 'PHS-106'])->get()->keyBy('code');
        $options = DB::table('mstr_question_options')->get()->groupBy('question_id');

        $successCount = 0;
        $errorCount = 0;

        DB::beginTransaction();

        try {
            foreach ($data as $index => $row) {
                // Determine Year from 'Submitted at' (Excel serial date)
                $excelDate = $row['Submitted at'];
                if (is_numeric($excelDate)) {
                    $unixTimestamp = ($excelDate - 25569) * 86400;
                    $submittedAt = date('Y-m-d H:i:s', $unixTimestamp);
                    $year = date('Y', $unixTimestamp);
                } else {
                    $submittedAt = date('Y-m-d H:i:s');
                    $year = date('Y');
                }

                // 1. Period and Questionnaire
                $period = DB::table('mstr_periods')->where('year', $year)->first();
                if (!$period) {
                    $periodId = DB::table('mstr_periods')->insertGetId([
                        'year' => $year,
                        'name' => "Periode $year",
                        'type' => 'REGULAR',
                        'status' => 'ACTIVE',
                        'is_active' => 1,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    $period = DB::table('mstr_periods')->where('id', $periodId)->first();
                }

                $questionnaire = DB::table('mstr_yearly_questionnaires')->where('period_id', $period->id)->first();
                if (!$questionnaire) {
                    $questionnaireId = DB::table('mstr_yearly_questionnaires')->insertGetId([
                        'period_id' => $period->id,
                        'title' => "Kuesioner PHS $year",
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    $questionnaire = DB::table('mstr_yearly_questionnaires')->where('id', $questionnaireId)->first();
                    
                    // Create items
                    foreach ($questions as $q) {
                        DB::table('mstr_yearly_question_items')->insert([
                            'yearly_questionnaire_id' => $questionnaire->id,
                            'question_id' => $q->id,
                            'sort_order' => 0,
                            'is_mandatory' => 1,
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }
                }

                // Load items
                $yearlyItems = DB::table('mstr_yearly_question_items')->where('yearly_questionnaire_id', $questionnaire->id)->get()->keyBy('question_id');

                // 2. Village
                $villageRaw = $row['Desa yang diperiksa'];
                $villageClean = trim(str_replace(['Desa ', 'Kelurahan '], '', $villageRaw));
                $village = DB::table('reg_villages')->where('name', 'like', '%' . $villageClean . '%')->first();

                if (!$village) {
                    $this->warn("Row $index: Village not found for '$villageRaw'. Skipping.");
                    $errorCount++;
                    continue;
                }

                // 3. Kader User
                $kaderName = trim($row['Nama Kader']);
                $kader = DB::table('users')->where('name', $kaderName)->orWhere('full_name', $kaderName)->first();
                
                if (!$kader) {
                    $username = strtolower(str_replace(' ', '', $kaderName)) . '_' . Str::random(4);
                    $kaderId = DB::table('users')->insertGetId([
                        'name' => $kaderName,
                        'full_name' => $kaderName,
                        'username' => $username,
                        'password' => Hash::make('PHS@2026'),
                        'role_id' => $roleId,
                        'district_id' => $village->district_id,
                        'village_id' => $village->id,
                        'puskesmas_id' => null,
                        'kader_code' => 'KDR-' . Str::upper(Str::random(6)),
                        'is_active' => 1,
                        'must_reset_password' => 1,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    $kader = DB::table('users')->where('id', $kaderId)->first();
                }

                // 4. Household
                $respondentName = trim($row['Nama yang diperiksa']);
                $rw = str_pad($row['RW yang diperiksa'] ?? '0', 3, '0', STR_PAD_LEFT);
                $rt = str_pad($row['RT yang diperiksa'] ?? '0', 3, '0', STR_PAD_LEFT);

                $household = DB::table('mstr_households')
                    ->where('village_id', $village->id)
                    ->where('rw', $rw)
                    ->where('rt', $rt)
                    ->where('head_of_family_name', $respondentName)
                    ->first();

                if (!$household) {
                    $householdId = DB::table('mstr_households')->insertGetId([
                        'head_of_family_name' => $respondentName,
                        'village_id' => $village->id,
                        'rw' => $rw,
                        'rt' => $rt,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    $household = DB::table('mstr_households')->where('id', $householdId)->first();
                }

                // 5. Respondent
                $respondent = DB::table('mstr_respondents')
                    ->where('household_id', $household->id)
                    ->where('name', $respondentName)
                    ->first();

                if (!$respondent) {
                    $respondentId = DB::table('mstr_respondents')->insertGetId([
                        'household_id' => $household->id,
                        'name' => $respondentName,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    $respondent = DB::table('mstr_respondents')->where('id', $respondentId)->first();
                }

                // 6. Survey
                $surveyId = (string) Str::uuid();
                DB::table('trx_surveys')->insert([
                    'id' => $surveyId,
                    'yearly_questionnaire_id' => $questionnaire->id,
                    'period_id' => $period->id,
                    'surveyor_user_id' => $kader->id,
                    'respondent_id' => $respondent->id,
                    'age_at_survey' => (int) $row['Usia yang diperiksa'],
                    'status' => 'SUBMITTED',
                    'submitted_at' => $submittedAt,
                    'notes' => 'Imported from Excel. Submission ID: ' . $row['Submission ID'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                // 7. Answers Mapping
                $answerMap = [
                    'PHS-101' => $row['(Usia diatas 10 tahun) Apakah sasaran melakukan aktivitas fisik (baik itu kebugaran/olah raga maupun melakukan pekerjaan sehari-hari) setiap hari minimal 30 menit atau 150 menit per minggu secara terus menerus'] ?? null,
                    'PHS-102' => $row['(Usia ≥ 10 tahun) Apakah sasaran melakukan cuci tangan pada saat sebelum menyiapkan makanan, setiap kali tangan kotor (memegang uang, binatang dan berkebun), setelah buang air besar, setelah menceboki bayi/anak, setelah menggunakan pestisida/insektisida, sebelum menyusui bayi, dan sebelum makan dengan menggunakan sabun dan air mengalir atau dengan menggunakan hand sanitizer'] ?? null,
                    'PHS-103' => $row['(Usia ≥ 5 tahun) Apakah sasaran mengonsumsi buah dan/atau sayur (kombinasi sayur dan buah) setiap hari'] ?? null,
                    'PHS-104' => $row['(Usia ≥ 10 tahun) Apakah sasaran tidak pernah mencoba merokok atau sudah berhenti merokok sampai dengan saat pengumpulan data'] ?? null,
                    'PHS-105' => $row['(Usia ≥ 15 tahun) Apakah sasaran mengukur tekanan darah nya minimal 1 kali dalam 1 tahun'] ?? null,
                    'PHS-106' => $row['(Usia ≥ 15 tahun) Apakah sasaran mengukur gula darah nya minimal 1 kali dalam 1 tahun'] ?? null
                ];

                foreach ($answerMap as $code => $ansText) {
                    if (empty($ansText) || !isset($questions[$code])) continue;

                    $q = $questions[$code];
                    $yItem = $yearlyItems[$q->id] ?? null;
                    if (!$yItem) continue;

                    // Match option (Iya / Tidak)
                    $ansTextClean = strtolower(trim($ansText));
                    $opts = $options[$q->id] ?? [];
                    $selectedOptionId = null;

                    $isIya = str_starts_with($ansTextClean, 'iya');
                    $isTidak = str_starts_with($ansTextClean, 'tidak');
                    
                    $finalAnswerText = $ansText;

                    foreach ($opts as $opt) {
                        if (($isIya && $opt->value === 'Y') || ($isTidak && $opt->value === 'N')) {
                            $selectedOptionId = $opt->id;
                            $finalAnswerText = $opt->value;
                            break;
                        }
                    }

                    DB::table('trx_survey_answers')->insert([
                        'survey_id' => $surveyId,
                        'yearly_question_item_id' => $yItem->id,
                        'answer_text' => $finalAnswerText,
                        'answer_option_id' => $selectedOptionId,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }

                $successCount++;
            }

            DB::commit();
            $this->info("Import complete. Success: $successCount, Skipped/Error: $errorCount");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("An error occurred: " . $e->getMessage() . " at line " . $e->getLine());
        }
    }
}
