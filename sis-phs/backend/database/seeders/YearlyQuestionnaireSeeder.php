<?php

namespace Database\Seeders;

use App\Models\Period;
use App\Models\Question;
use App\Models\YearlyQuestionItem;
use App\Models\YearlyQuestionnaire;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class YearlyQuestionnaireSeeder extends Seeder
{
    public function run(): void
    {
        // Temukan periode aktif
        $activePeriod = Period::where('is_active', true)->first();

        if (!$activePeriod) {
            $this->command->info('Tidak ada periode aktif. Melewati proses seeder YearlyQuestionnaire.');
            return;
        }

        DB::transaction(function () use ($activePeriod) {
            // Periksa apakah sudah ada questionnaire untuk periode ini
            $questionnaire = YearlyQuestionnaire::firstOrCreate(
                ['period_id' => $activePeriod->id],
                ['title' => 'Kuesioner PHS Tahun ' . $activePeriod->year]
            );

            // Jika sudah ada item, maka jangan override agar tidak merusak data yang sudah ada
            if ($questionnaire->items()->count() > 0) {
                $this->command->info('Kuesioner tahunan untuk periode aktif sudah memiliki item.');
                return;
            }

            // Ambil semua mstr_questions yang aktif
            $questions = Question::where('is_active', true)->orderBy('id')->get();

            $sortOrder = 1;
            foreach ($questions as $question) {
                YearlyQuestionItem::create([
                    'yearly_questionnaire_id' => $questionnaire->id,
                    'question_id' => $question->id,
                    'sort_order' => $sortOrder++,
                    'is_mandatory' => true,
                ]);
            }

            $this->command->info('Berhasil mengenerate kuesioner tahunan untuk tahun ' . $activePeriod->year);
        });
    }
}
