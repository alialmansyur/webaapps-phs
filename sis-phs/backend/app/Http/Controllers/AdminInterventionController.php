<?php

namespace App\Http\Controllers;

use App\Models\Intervention;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminInterventionController extends Controller
{
    public function index(Request $request)
    {
        $query = Intervention::with([
            'survey.respondent.household.village.district',
            'survey.respondent.household.village.faskes',
            'kader'
        ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('topic', 'like', "%{$search}%")
                  ->orWhereHas('survey.respondent', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%")
                         ->orWhereHas('household', function ($q3) use ($search) {
                             $q3->where('head_of_family_name', 'like', "%{$search}%")
                                ->orWhere('no_kk', 'like', "%{$search}%");
                         });
                  });
            });
        }

        if ($districtId = $request->input('districtId')) {
            $query->whereHas('survey.respondent.household.village', function ($q) use ($districtId) {
                $q->where('district_id', $districtId);
            });
        }

        if ($villageId = $request->input('villageId')) {
            $query->whereHas('survey.respondent.household', function ($q) use ($villageId) {
                $q->where('village_id', $villageId);
            });
        }

        // Filtering by faskes/puskesmas is through village
        if ($puskesmasId = $request->input('puskesmasId')) {
            $query->whereHas('survey.respondent.household.village.faskes', function ($q) use ($puskesmasId) {
                $q->where('mstr_faskes.id', $puskesmasId); // Assuming many-to-many or direct relationship. Using mstr_faskes.id based on typical setups.
            });
        }

        if ($kaderId = $request->input('kaderId')) {
            $query->where('kader_id', $kaderId);
        }

        $perPage = $request->input('perPage', 5);
        $interventions = $query->orderBy('next_visit_at', 'asc')->paginate($perPage);

        // Transform data
        $interventions->getCollection()->transform(function ($intervention) {
            $survey = $intervention->survey;
            $respondent = $survey ? $survey->respondent : null;
            $household = $respondent ? $respondent->household : null;
            $village = $household ? $household->village : null;
            $district = $village ? $village->district : null;
            $kader = $intervention->kader;

            // Compute status
            $status = 'PENDING';
            if ($intervention->next_visit_at) {
                if (strtotime($intervention->next_visit_at) < time()) {
                    $status = 'OVERDUE';
                } else {
                    $status = 'SCHEDULED';
                }
            }
            if ($intervention->result && !$intervention->next_visit_at) {
                $status = 'DONE';
            } elseif ($intervention->result) {
                $status = 'ONGOING';
            }

            // Derive priority based on some logic, default to MEDIUM
            $priority = 'MEDIUM';
            if ($status === 'OVERDUE') {
                $priority = 'HIGH';
            }

            return [
                'id' => $intervention->id,
                'surveyId' => $intervention->survey_id,
                'householdHead' => $household->head_of_family_name ?? '-',
                'householdNo' => $household->no_kk ?? '-',
                'districtName' => $district->name ?? '-',
                'villageName' => $village->name ?? '-',
                'puskesmasName' => ($village && $village->faskes && $village->faskes->count() > 0) ? $village->faskes->first()->name : '-',
                'kaderId' => $intervention->kader_id,
                'kaderName' => $kader->name ?? '-',
                'issueSummary' => $intervention->topic ?? '-',
                'priority' => $priority,
                'progressLabel' => $intervention->result ? 'Ada Progress' : 'Belum Ada Progress',
                'status' => $status,
                'nextVisitAt' => $intervention->next_visit_at,
                'lastActionAt' => $intervention->updated_at,
                'notes' => $intervention->result ?? '-',
                'followUp' => $intervention->follow_up ?? '-',
            ];
        });

        return response()->json($interventions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'survey_id' => 'required|uuid|exists:trx_surveys,id',
            'kader_id' => 'required|exists:users,id',
            'topic' => 'required|string',
            'result' => 'nullable|string',
            'follow_up' => 'nullable|string',
            'next_visit_at' => 'nullable|date',
        ]);

        $intervention = Intervention::create([
            'id' => Str::uuid(),
            'survey_id' => $validated['survey_id'],
            'kader_id' => $validated['kader_id'],
            'topic' => $validated['topic'],
            'result' => $validated['result'] ?? '',
            'follow_up' => $validated['follow_up'],
            'next_visit_at' => $validated['next_visit_at'] ? date('Y-m-d H:i:s', strtotime($validated['next_visit_at'])) : null,
        ]);

        return response()->json(['message' => 'Intervensi berhasil dibuat.', 'data' => $intervention], 201);
    }

    public function update(Request $request, $id)
    {
        $intervention = Intervention::findOrFail($id);

        $validated = $request->validate([
            'kader_id' => 'required|exists:users,id',
            'topic' => 'required|string',
            'result' => 'nullable|string',
            'follow_up' => 'nullable|string',
            'next_visit_at' => 'nullable|date',
        ]);

        $intervention->update([
            'kader_id' => $validated['kader_id'],
            'topic' => $validated['topic'],
            'result' => $validated['result'] ?? '',
            'follow_up' => $validated['follow_up'],
            'next_visit_at' => $validated['next_visit_at'] ? date('Y-m-d H:i:s', strtotime($validated['next_visit_at'])) : null,
        ]);

        return response()->json(['message' => 'Intervensi berhasil diperbarui.', 'data' => $intervention]);
    }

    public function destroy($id)
    {
        $intervention = Intervention::findOrFail($id);
        $intervention->delete();

        return response()->json(['message' => 'Intervensi berhasil dihapus.']);
    }
}
