<?php

namespace App\Http\Controllers;

use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    public function index(Request $request)
    {
        $query = Question::withCount('options');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('indicator', 'like', "%{$search}%")
                  ->orWhere('question_text', 'like', "%{$search}%");
            });
        }

        if ($inputType = $request->input('inputType')) {
            $query->where('input_type', $inputType);
        }

        if ($status = $request->input('status')) {
            $isActive = $status === 'active';
            $query->where('is_active', $isActive);
        }

        $perPage = $request->input('perPage', 5);
        $questions = $query->orderBy('code', 'asc')->paginate($perPage);

        return response()->json($questions);
    }

    public function show($id)
    {
        $question = Question::with('options')->findOrFail($id);
        return response()->json($question);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:mstr_questions',
            'indicator' => 'nullable|string|max:255',
            'question_text' => 'required|string',
            'input_type' => 'required|in:TEXT,NUMBER,RADIO,CHECKBOX',
            'min_age' => 'nullable|integer|min:0',
            'max_age' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'options' => 'nullable|array',
            'options.*.label' => 'required|string|max:100',
            'options.*.value' => 'required|string|max:50',
            'options.*.sort_order' => 'nullable|integer',
        ]);

        DB::beginTransaction();
        try {
            $question = Question::create([
                'code' => $validated['code'],
                'indicator' => $validated['indicator'] ?? null,
                'question_text' => $validated['question_text'],
                'input_type' => $validated['input_type'],
                'min_age' => $validated['min_age'] ?? 0,
                'max_age' => $validated['max_age'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            if (!empty($validated['options'])) {
                foreach ($validated['options'] as $index => $opt) {
                    $question->options()->create([
                        'label' => $opt['label'],
                        'value' => $opt['value'],
                        'sort_order' => $opt['sort_order'] ?? $index,
                    ]);
                }
            }

            DB::commit();
            return response()->json($question->load('options'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create question'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $question = Question::findOrFail($id);

        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:mstr_questions,code,' . $question->id,
            'indicator' => 'nullable|string|max:255',
            'question_text' => 'required|string',
            'input_type' => 'required|in:TEXT,NUMBER,RADIO,CHECKBOX',
            'min_age' => 'nullable|integer|min:0',
            'max_age' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'options' => 'nullable|array',
            'options.*.label' => 'required|string|max:100',
            'options.*.value' => 'required|string|max:50',
            'options.*.sort_order' => 'nullable|integer',
        ]);

        DB::beginTransaction();
        try {
            $question->update([
                'code' => $validated['code'],
                'indicator' => $validated['indicator'] ?? null,
                'question_text' => $validated['question_text'],
                'input_type' => $validated['input_type'],
                'min_age' => $validated['min_age'] ?? 0,
                'max_age' => $validated['max_age'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            // Recreate options
            $question->options()->delete();
            if (!empty($validated['options'])) {
                foreach ($validated['options'] as $index => $opt) {
                    $question->options()->create([
                        'label' => $opt['label'],
                        'value' => $opt['value'],
                        'sort_order' => $opt['sort_order'] ?? $index,
                    ]);
                }
            }

            DB::commit();
            return response()->json($question->load('options'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update question'], 500);
        }
    }

    public function destroy($id)
    {
        $question = Question::findOrFail($id);
        $question->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
