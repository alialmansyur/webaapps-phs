<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            // 1. Deactivate existing questions
            DB::table('mstr_questions')->update(['is_active' => 0]);

            // 2. Add new questions
            $now = Carbon::now();
            $questions = [
                [
                    'code' => 'PHS-201',
                    'indicator' => 'Pengukuran Tekanan Darah',
                    'question_text' => 'Cek tekanan darah minimal 1 kali/tahun',
                    'input_type' => 'RADIO',
                    'min_age' => 15,
                    'max_age' => null,
                    'is_active' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'options' => [
                        ['label' => 'YA', 'value' => 'Y', 'sort_order' => 1],
                        ['label' => 'Tidak', 'value' => 'N', 'sort_order' => 2],
                    ]
                ],
                [
                    'code' => 'PHS-202',
                    'indicator' => 'Pengukuran Gula Darah',
                    'question_text' => 'Cek gula darah minimal 1 kali/tahun',
                    'input_type' => 'RADIO',
                    'min_age' => 15,
                    'max_age' => null,
                    'is_active' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'options' => [
                        ['label' => 'YA', 'value' => 'Y', 'sort_order' => 1],
                        ['label' => 'Tidak', 'value' => 'N', 'sort_order' => 2],
                    ]
                ],
                [
                    'code' => 'PHS-203',
                    'indicator' => null, // No indicator, doesn't affect IKS
                    'question_text' => 'Jika Ya, dimana melakukan cek gula darah?',
                    'input_type' => 'RADIO',
                    'min_age' => 15,
                    'max_age' => null,
                    'is_active' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'options' => [
                        ['label' => 'Mandiri/Sendiri', 'value' => 'MANDIRI', 'sort_order' => 1],
                        ['label' => 'Posyandu/Posbindu', 'value' => 'POSYANDU', 'sort_order' => 2],
                        ['label' => 'Puskesmas', 'value' => 'PUSKESMAS', 'sort_order' => 3],
                        ['label' => 'Fasilitas kesehatan lainnya', 'value' => 'FASKES_LAIN', 'sort_order' => 4],
                        ['label' => 'Sekolah', 'value' => 'SEKOLAH', 'sort_order' => 5],
                    ]
                ],
                [
                    'code' => 'PHS-204',
                    'indicator' => 'Aktivitas Fisik',
                    'question_text' => 'Aktivitas fisik minimal 150 menit/minggu',
                    'input_type' => 'RADIO',
                    'min_age' => 11,
                    'max_age' => null,
                    'is_active' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'options' => [
                        ['label' => 'YA', 'value' => 'Y', 'sort_order' => 1],
                        ['label' => 'Tidak', 'value' => 'N', 'sort_order' => 2],
                    ]
                ],
                [
                    'code' => 'PHS-205',
                    'indicator' => 'Cuci Tangan',
                    'question_text' => 'Cuci tangan sesuai ketentuan',
                    'input_type' => 'RADIO',
                    'min_age' => 10,
                    'max_age' => null,
                    'is_active' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'options' => [
                        ['label' => 'YA', 'value' => 'Y', 'sort_order' => 1],
                        ['label' => 'Tidak', 'value' => 'N', 'sort_order' => 2],
                    ]
                ],
                [
                    'code' => 'PHS-206',
                    'indicator' => 'Konsumsi Buah dan/atau Sayur',
                    'question_text' => 'Konsumsi buah dan sayur minimal 3 porsi/hari',
                    'input_type' => 'RADIO',
                    'min_age' => 5,
                    'max_age' => null,
                    'is_active' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'options' => [
                        ['label' => '> 3 Porsi', 'value' => 'Y', 'sort_order' => 1], // Y = Healthy
                        ['label' => '3 Porsi', 'value' => 'Y', 'sort_order' => 2], // Y = Healthy
                        ['label' => '< 3 Porsi', 'value' => 'N', 'sort_order' => 3], // N = Unhealthy
                    ]
                ],
                [
                    'code' => 'PHS-207',
                    'indicator' => 'Tidak Merokok / Berhenti Merokok',
                    'question_text' => 'Saat ini perokok aktif?',
                    'input_type' => 'RADIO',
                    'min_age' => 10,
                    'max_age' => null,
                    'is_active' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'options' => [
                        ['label' => 'YA', 'value' => 'N', 'sort_order' => 1], // N = Unhealthy
                        ['label' => 'Tidak', 'value' => 'Y', 'sort_order' => 2], // Y = Healthy
                    ]
                ],
                [
                    'code' => 'PHS-208',
                    'indicator' => null, // Doesn't affect IKS
                    'question_text' => 'Pernah merokok?',
                    'input_type' => 'RADIO',
                    'min_age' => 10,
                    'max_age' => null,
                    'is_active' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'options' => [
                        ['label' => 'YA', 'value' => 'YA', 'sort_order' => 1],
                        ['label' => 'Tidak', 'value' => 'TIDAK', 'sort_order' => 2],
                    ]
                ],
            ];

            $newQuestionIds = [];
            foreach ($questions as $qData) {
                $options = $qData['options'];
                unset($qData['options']);
                
                $qId = DB::table('mstr_questions')->insertGetId($qData);
                $newQuestionIds[] = $qId;

                foreach ($options as $opt) {
                    $opt['question_id'] = $qId;
                    $opt['created_at'] = $now;
                    $opt['updated_at'] = $now;
                    DB::table('mstr_question_options')->insert($opt);
                }
            }

            // 3. Update active questionnaire to use new items (add new)
            $activePeriod = DB::table('mstr_periods')->where('is_active', 1)->first();
            if ($activePeriod) {
                $questionnaire = DB::table('mstr_yearly_questionnaires')->where('period_id', $activePeriod->id)->first();
                if ($questionnaire) {
                    // Add new items
                    $sortOrder = DB::table('mstr_yearly_question_items')
                        ->where('yearly_questionnaire_id', $questionnaire->id)
                        ->max('sort_order') + 1;
                    foreach ($newQuestionIds as $qId) {
                        DB::table('mstr_yearly_question_items')->insert([
                            'yearly_questionnaire_id' => $questionnaire->id,
                            'question_id' => $qId,
                            'sort_order' => $sortOrder++,
                            'is_mandatory' => 1,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                    }
                }
            }
        });
    }

    public function down(): void
    {
        DB::transaction(function () {
            // Revert: Set old questions active
            DB::table('mstr_questions')->where('code', 'like', 'PHS-10%')->update(['is_active' => 1]);
            
            // Delete new questions and their options
            $newQuestions = DB::table('mstr_questions')->where('code', 'like', 'PHS-20%')->pluck('id');
            if ($newQuestions->isNotEmpty()) {
                DB::table('mstr_question_options')->whereIn('question_id', $newQuestions)->delete();
                DB::table('mstr_yearly_question_items')->whereIn('question_id', $newQuestions)->delete();
                DB::table('mstr_questions')->whereIn('id', $newQuestions)->delete();
            }
        });
    }
};
