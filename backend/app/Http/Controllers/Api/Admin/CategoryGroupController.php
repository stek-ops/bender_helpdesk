<?php
namespace App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Controller;
use App\Models\CategoryGroup;
use Illuminate\Http\Request;
class CategoryGroupController extends Controller
{
    public function index() { return response()->json(CategoryGroup::with('categories')->orderBy('sort')->get()); }
    public function store(Request $request) {
        $validated = $request->validate(['name' => 'required|string|max:255', 'sort' => 'integer|min:0']);
        return response()->json(CategoryGroup::create($validated), 201);
    }
    public function update(Request $request, CategoryGroup $categoryGroup) {
        $categoryGroup->update($request->only(['name', 'sort']));
        return response()->json($categoryGroup);
    }
    public function destroy(CategoryGroup $categoryGroup) {
        $categoryGroup->delete();
        return response()->json(null, 204);
    }
}
