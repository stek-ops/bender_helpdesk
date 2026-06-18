<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KbArticle;
use Illuminate\Http\Request;

class KbArticleController extends Controller
{
    public function index(Request $request)
    {
        $q = KbArticle::with("user")->where("is_published", true);

        if ($request->category) {
            $q->where("category", $request->category);
        }

        if ($request->search) {
            $s = $request->search;
            $q->where(function ($q) use ($s) {
                $q->where("title", "ilike", "%{$s}%")
                  ->orWhere("content", "ilike", "%{$s}%");
            });
        }

        return response()->json($q->latest()->paginate(20));
    }

    public function show(KbArticle $kbArticle)
    {
        $kbArticle->load("user");
        return response()->json($kbArticle);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            "title" => "required|string|max:255",
            "content" => "required|string",
            "category" => "nullable|string|max:100",
            "is_published" => "boolean",
        ]);

        $data["user_id"] = $request->user()->id;
        $article = KbArticle::create($data);
        $article->load("user");

        return response()->json($article, 201);
    }

    public function update(Request $request, KbArticle $kbArticle)
    {
        $data = $request->validate([
            "title" => "required|string|max:255",
            "content" => "required|string",
            "category" => "nullable|string|max:100",
            "is_published" => "boolean",
        ]);

        $kbArticle->update($data);
        $kbArticle->load("user");

        return response()->json($kbArticle);
    }

    public function destroy(KbArticle $kbArticle)
    {
        $kbArticle->delete();
        return response()->json(null, 204);
    }
}
