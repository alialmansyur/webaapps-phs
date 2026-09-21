<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('summary_surveys')) {
            Schema::create('summary_surveys', function (Blueprint $table) {
                $table->id();
                $table->uuid('survey_id')->unique();
                $table->foreignId('household_id')->constrained('mstr_households')->cascadeOnDelete();
                $table->foreignId('surveyor_user_id')->constrained('users')->cascadeOnDelete();
                $table->char('district_id', 10)->nullable();
                $table->char('puskesmas_id', 10)->nullable();
                $table->char('village_id', 10)->nullable();
                $table->integer('survey_year');
                $table->string('survey_period', 20);
                $table->string('status', 20)->default('DRAFT');
                $table->dateTime('submitted_at')->nullable();
                $table->unsignedInteger('age_at_survey')->default(0);
                $table->decimal('iks_score', 5, 4)->default(0);
                $table->boolean('is_iks_healthy')->default(false);
                $table->boolean('is_iks_unhealthy')->default(false);
                $table->boolean('is_phs_healthy')->default(false);
                $table->timestamps();
                $table->index(['district_id', 'survey_year', 'status']);
                $table->index(['puskesmas_id', 'survey_year', 'status']);
                $table->index(['village_id', 'survey_year', 'status']);
                $table->index(['status', 'submitted_at']);
            });
        }

        if (! Schema::hasTable('summary_survey_indicators')) {
            Schema::create('summary_survey_indicators', function (Blueprint $table) {
                $table->id();
                $table->uuid('survey_id');
                $table->string('indicator_name');
                $table->char('district_id', 10)->nullable();
                $table->char('puskesmas_id', 10)->nullable();
                $table->char('village_id', 10)->nullable();
                $table->integer('survey_year');
                $table->string('survey_period', 20);
                $table->string('status', 20)->default('DRAFT');
                $table->dateTime('submitted_at')->nullable();
                $table->integer('min_age')->default(0);
                $table->boolean('is_applicable')->default(false);
                $table->boolean('is_healthy')->default(false);
                $table->timestamps();
                $table->index(['indicator_name', 'survey_year', 'district_id'], 'idx_ssi_ind_year_district');
                $table->index(['survey_id', 'indicator_name'], 'idx_ssi_survey_ind');
                $table->foreign('survey_id')->references('survey_id')->on('summary_surveys')->cascadeOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('summary_survey_indicators');
        Schema::dropIfExists('summary_surveys');
    }
};
