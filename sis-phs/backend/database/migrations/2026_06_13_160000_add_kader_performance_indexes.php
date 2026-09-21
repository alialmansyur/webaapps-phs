<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->addIndexIfMissing('trx_surveys', 'idx_trx_surveys_user_status_submitted', ['surveyor_user_id', 'status', 'submitted_at']);
        $this->addRawIndexIfMissing('trx_survey_answers', 'idx_trx_survey_answers_survey_answer', 'CREATE INDEX idx_trx_survey_answers_survey_answer ON trx_survey_answers (survey_id, answer_text(10))');
        $this->addIndexIfMissing('trx_interventions', 'idx_trx_interventions_survey', ['survey_id']);
        $this->addIndexIfMissing('trx_interventions', 'idx_trx_interventions_kader_next_visit', ['kader_id', 'next_visit_at']);
        $this->addIndexIfMissing('mstr_households', 'idx_mstr_households_village_rt_rw', ['village_id', 'rt', 'rw']);
        $this->addIndexIfMissing('mstr_households', 'idx_mstr_households_no_kk', ['no_kk']);
        $this->addIndexIfMissing('mstr_respondents', 'idx_mstr_respondents_nik', ['nik']);
    }

    public function down(): void
    {
        $this->dropIndexIfExists('trx_surveys', 'idx_trx_surveys_user_status_submitted');
        $this->dropIndexIfExists('trx_survey_answers', 'idx_trx_survey_answers_survey_answer');
        $this->dropIndexIfExists('trx_interventions', 'idx_trx_interventions_survey');
        $this->dropIndexIfExists('trx_interventions', 'idx_trx_interventions_kader_next_visit');
        $this->dropIndexIfExists('mstr_households', 'idx_mstr_households_village_rt_rw');
        $this->dropIndexIfExists('mstr_households', 'idx_mstr_households_no_kk');
        $this->dropIndexIfExists('mstr_respondents', 'idx_mstr_respondents_nik');
    }

    private function addIndexIfMissing(string $table, string $indexName, array $columns): void
    {
        if ($this->indexExists($table, $indexName)) {
            return;
        }

        Schema::table($table, function (Blueprint $tableBlueprint) use ($columns, $indexName) {
            $tableBlueprint->index($columns, $indexName);
        });
    }

    private function dropIndexIfExists(string $table, string $indexName): void
    {
        if (! $this->indexExists($table, $indexName)) {
            return;
        }

        Schema::table($table, function (Blueprint $tableBlueprint) use ($indexName) {
            $tableBlueprint->dropIndex($indexName);
        });
    }

    private function addRawIndexIfMissing(string $table, string $indexName, string $statement): void
    {
        if ($this->indexExists($table, $indexName)) {
            return;
        }

        DB::statement($statement);
    }

    private function indexExists(string $table, string $indexName): bool
    {
        return DB::table('information_schema.statistics')
            ->where('table_schema', DB::getDatabaseName())
            ->where('table_name', $table)
            ->where('index_name', $indexName)
            ->exists();
    }
};
