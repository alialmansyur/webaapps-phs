<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reg_provinces', function (Blueprint $table) {
            $table->char('id', 2)->primary();
            $table->string('name', 255);
            $table->timestamps();
        });

        Schema::create('reg_regencies', function (Blueprint $table) {
            $table->char('id', 4)->primary();
            $table->char('province_id', 2);
            $table->string('name', 255);
            $table->timestamps();

            $table->foreign('province_id')->references('id')->on('reg_provinces')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('reg_districts', function (Blueprint $table) {
            $table->char('id', 6)->primary();
            $table->char('regency_id', 4);
            $table->string('name', 255);
            $table->timestamps();

            $table->foreign('regency_id')->references('id')->on('reg_regencies')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('reg_villages', function (Blueprint $table) {
            $table->char('id', 10)->primary();
            $table->char('district_id', 6);
            $table->string('name', 50);
            $table->integer('att1')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('legacy_updated_at')->nullable();
            $table->timestamps();

            $table->foreign('district_id')->references('id')->on('reg_districts')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('mstr_periods', function (Blueprint $table) {
            $table->id();
            $table->year('year')->unique();
            $table->boolean('is_active')->default(false);
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('mstr_questions', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->text('question_text');
            $table->enum('input_type', ['TEXT', 'NUMBER', 'RADIO', 'CHECKBOX']);
            $table->integer('min_age')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('mstr_question_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('mstr_questions')->cascadeOnDelete();
            $table->string('label', 100);
            $table->string('value', 50);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('mstr_yearly_questionnaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('mstr_periods')->cascadeOnDelete();
            $table->string('title');
            $table->timestamps();
        });

        Schema::create('mstr_yearly_question_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('yearly_questionnaire_id')->constrained('mstr_yearly_questionnaires')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('mstr_questions')->cascadeOnDelete();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_mandatory')->default(true);
            $table->timestamps();
        });

        Schema::create('mstr_yearly_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('mstr_periods')->cascadeOnDelete();
            $table->unsignedInteger('target_value');
            $table->timestamps();

            $table->unique('period_id');
        });

        Schema::create('mstr_households', function (Blueprint $table) {
            $table->id();
            $table->string('no_kk', 20)->nullable();
            $table->string('head_of_family_name');
            $table->char('village_id', 10);
            $table->string('rw', 10)->nullable();
            $table->string('rt', 10)->nullable();
            $table->timestamps();

            $table->foreign('village_id')->references('id')->on('reg_villages')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('mstr_respondents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained('mstr_households')->cascadeOnDelete();
            $table->string('nik', 20)->nullable();
            $table->string('name');
            $table->date('birth_date')->nullable();
            $table->enum('gender', ['L', 'P'])->nullable();
            $table->timestamps();
        });

        Schema::create('trx_surveys', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('yearly_questionnaire_id')->constrained('mstr_yearly_questionnaires')->restrictOnDelete();
            $table->foreignId('period_id')->constrained('mstr_periods')->restrictOnDelete();
            $table->foreignId('surveyor_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('respondent_id')->constrained('mstr_respondents')->restrictOnDelete();
            $table->unsignedInteger('age_at_survey');
            $table->enum('status', ['DRAFT', 'SUBMITTED'])->default('DRAFT');
            $table->dateTime('submitted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('trx_survey_answers', function (Blueprint $table) {
            $table->id();
            $table->uuid('survey_id');
            $table->foreignId('yearly_question_item_id')->constrained('mstr_yearly_question_items')->restrictOnDelete();
            $table->text('answer_text')->nullable();
            $table->foreignId('answer_option_id')->nullable()->constrained('mstr_question_options')->nullOnDelete();
            $table->timestamps();

            $table->foreign('survey_id')->references('id')->on('trx_surveys')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trx_survey_answers');
        Schema::dropIfExists('trx_surveys');
        Schema::dropIfExists('mstr_respondents');
        Schema::dropIfExists('mstr_households');
        Schema::dropIfExists('mstr_yearly_targets');
        Schema::dropIfExists('mstr_yearly_question_items');
        Schema::dropIfExists('mstr_yearly_questionnaires');
        Schema::dropIfExists('mstr_question_options');
        Schema::dropIfExists('mstr_questions');
        Schema::dropIfExists('mstr_periods');
        Schema::dropIfExists('reg_villages');
        Schema::dropIfExists('reg_districts');
        Schema::dropIfExists('reg_regencies');
        Schema::dropIfExists('reg_provinces');
    }
};
