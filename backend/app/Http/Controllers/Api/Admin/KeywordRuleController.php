<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\KeywordRule;
use Illuminate\Http\Request;

class KeywordRuleController extends Controller
{
    public function index()
    {
        return response()->json(
            KeywordRule::with(["categoryGroup", "category", "executor"])
                ->orderBy("sort")
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "keyword" => "required|string|max:255",
            "category_group_id" => "nullable|exists:category_groups,id",
            "category_id" => "nullable|exists:categories,id",
            "executor_id" => "nullable|exists:users,id",
            "sort" => "integer|min:0",
            "is_active" => "boolean",
        ]);
        return response()->json(KeywordRule::create($validated), 201);
    }

    public function update(Request $request, KeywordRule $keywordRule)
    {
        $keywordRule->update(
            $request->only(["keyword", "category_group_id", "category_id", "executor_id", "sort", "is_active"])
        );
        return response()->json($keywordRule);
    }

    public function destroy(KeywordRule $keywordRule)
    {
        $keywordRule->delete();
        return response()->json(null, 204);
    }
}
