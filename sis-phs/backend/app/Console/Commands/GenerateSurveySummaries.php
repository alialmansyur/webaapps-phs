<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Services\SurveySummaryService;

class GenerateSurveySummaries extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'survey:generate-summaries';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfill and generate summary data for all submitted surveys';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting generation of survey summaries...');

        $surveys = DB::table('trx_surveys')
            ->where('status', '!=', 'DRAFT')
            ->pluck('id');

        $total = $surveys->count();
        $this->info("Found {$total} non-DRAFT surveys.");

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        foreach ($surveys as $surveyId) {
            try {
                SurveySummaryService::generateSummaryForSurvey($surveyId);
            } catch (\Exception $e) {
                $this->error("\nFailed to process survey {$surveyId}: " . $e->getMessage());
            }
            $bar->advance();
        }

        $bar->finish();
        $this->info("\nSurvey summaries generated successfully.");
    }
}
