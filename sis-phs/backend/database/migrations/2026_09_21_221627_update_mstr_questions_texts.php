<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            $updates = [
                'PHS-201' => [
                    'indicator' => 'Tekanan Darah',
                    'question_text' => 'Apakah anda melakukan cek tekanan darah minimal 1 kali dalam 1 tahun?'
                ],
                'PHS-202' => [
                    'indicator' => 'Gula Darah',
                    'question_text' => 'Apakah anda melakukan cek gula darah minimal 1 kali dalam 1 tahun?'
                ],
                'PHS-203' => [
                    'indicator' => 'Gula Darah',
                    'question_text' => 'Jika Ya, dimana anda melakukan Cek gula darah?'
                ],
                'PHS-204' => [
                    'indicator' => 'Aktivitas Fisik',
                    'question_text' => 'Apakah anda melakukan aktivitas fisik (olahraga) minimal 150 menit per minggu secara terus menerus?'
                ],
                'PHS-205' => [
                    'indicator' => 'Cuci Tangan',
                    'question_text' => 'Apakah anda melakukan cuci tangan dengan menggunakan sabun dan air mengalir atau dengan hand sanitizer saat sebelum menyiapkan makanan/ sebelum dan setelah makan, setiap kali tangan kotor (memegang uang, binatang dan berkebun)/ setelah buang air besar/ setelah menceboki bayi atau anak/ setelah menggunakan pestisida atau insektisida/ sebelum menyusui bayi?'
                ],
                'PHS-206' => [
                    'indicator' => 'Konsumsi Buah dan Sayur',
                    'question_text' => 'Apakah anda mengonsumsi buah dan sayur minimal 3 porsi setiap hari?'
                ],
                'PHS-207' => [
                    'indicator' => 'Perokok Aktif',
                    'question_text' => 'Apakah Saat Ini Anda Perokok Aktif?'
                ],
                'PHS-208' => [
                    'indicator' => 'Riwayat Merokok',
                    'question_text' => 'Apakah anda pernah merokok?'
                ],
            ];

            foreach ($updates as $code => $data) {
                DB::table('mstr_questions')
                    ->where('code', $code)
                    ->update($data);
            }

            // Also update options for Q3 to have spaces after slashes as requested
            // "Mandiri/ Sendiri, Posyandu/ Posbindu, Puskesmas, Fasilitas kesehatan lainnya, Sekolah"
            $q3 = DB::table('mstr_questions')->where('code', 'PHS-203')->first();
            if ($q3) {
                DB::table('mstr_question_options')->where('question_id', $q3->id)->where('value', 'MANDIRI')->update(['label' => 'Mandiri/ Sendiri']);
                DB::table('mstr_question_options')->where('question_id', $q3->id)->where('value', 'POSYANDU')->update(['label' => 'Posyandu/ Posbindu']);
            }
        });
    }

    public function down(): void
    {
        // Not necessary for this specific text change
    }
};
