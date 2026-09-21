<?php

use App\Models\Question;
use Illuminate\Support\Facades\DB;

$questions = [
    [
        'code' => 'PHS-101',
        'indicator' => 'Aktivitas Fisik',
        'min_age' => 11,
        'max_age' => null,
        'question_text' => 'Apakah sasaran melakukan aktivitas fisik setiap hari minimal 30 menit atau 150 menit per minggu secara terus-menerus?',
        'input_type' => 'RADIO',
        'options' => [
            ['label' => 'Ya', 'value' => 'Y', 'sort_order' => 1],
            ['label' => 'Tidak', 'value' => 'N', 'sort_order' => 2],
        ]
    ],
    [
        'code' => 'PHS-102',
        'indicator' => 'Cuci Tangan',
        'min_age' => 10,
        'max_age' => null,
        'question_text' => 'Apakah sasaran mencuci tangan menggunakan sabun dan air mengalir atau hand sanitizer pada waktu/kondisi yang dianjurkan?',
        'input_type' => 'RADIO',
        'options' => [
            ['label' => 'Ya', 'value' => 'Y', 'sort_order' => 1],
            ['label' => 'Tidak', 'value' => 'N', 'sort_order' => 2],
        ]
    ],
    [
        'code' => 'PHS-103',
        'indicator' => 'Konsumsi Buah dan/atau Sayur',
        'min_age' => 5,
        'max_age' => null,
        'question_text' => 'Apakah sasaran mengonsumsi buah dan/atau sayur setiap hari?',
        'input_type' => 'RADIO',
        'options' => [
            ['label' => 'Ya', 'value' => 'Y', 'sort_order' => 1],
            ['label' => 'Tidak', 'value' => 'N', 'sort_order' => 2],
        ]
    ],
    [
        'code' => 'PHS-104',
        'indicator' => 'Tidak Merokok / Berhenti Merokok',
        'min_age' => 10,
        'max_age' => null,
        'question_text' => 'Apakah sasaran tidak pernah mencoba merokok atau sudah berhenti merokok sampai saat pengumpulan data?',
        'input_type' => 'RADIO',
        'options' => [
            ['label' => 'Ya', 'value' => 'Y', 'sort_order' => 1],
            ['label' => 'Tidak', 'value' => 'N', 'sort_order' => 2],
        ]
    ],
    [
        'code' => 'PHS-105',
        'indicator' => 'Pengukuran Tekanan Darah',
        'min_age' => 15,
        'max_age' => null,
        'question_text' => 'Apakah sasaran mengukur tekanan darah minimal 1 kali dalam 1 tahun?',
        'input_type' => 'RADIO',
        'options' => [
            ['label' => 'Ya', 'value' => 'Y', 'sort_order' => 1],
            ['label' => 'Tidak', 'value' => 'N', 'sort_order' => 2],
        ]
    ],
    [
        'code' => 'PHS-106',
        'indicator' => 'Pengukuran Gula Darah',
        'min_age' => 15,
        'max_age' => null,
        'question_text' => 'Apakah sasaran mengukur gula darah minimal 1 kali dalam 1 tahun?',
        'input_type' => 'RADIO',
        'options' => [
            ['label' => 'Ya', 'value' => 'Y', 'sort_order' => 1],
            ['label' => 'Tidak', 'value' => 'N', 'sort_order' => 2],
        ]
    ],
];

DB::beginTransaction();
try {
    foreach ($questions as $qData) {
        $options = $qData['options'];
        unset($qData['options']);
        
        $question = Question::updateOrCreate(
            ['code' => $qData['code']],
            $qData
        );
        
        $question->options()->delete();
        foreach ($options as $opt) {
            $question->options()->create($opt);
        }
    }
    DB::commit();
    echo "Successfully seeded " . count($questions) . " questions.\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}
