<?php
namespace App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
class CategoryController extends Controller
{
    public function index() {
        return response()->json(Category::with('group', 'defaultExecutor')->orderBy('sort')->get());
    }
    public function store(Request $request) {
        $validated = $request->validate([
            'group_id' => 'required|exists:category_groups,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'default_executor_id' => 'nullable|exists:users,id',
            'sort' => 'integer|min:0',
        ]);
        return response()->json(Category::create($validated), 201);
    }
    public function update(Request $request, Category $category) {
        $category->update($request->only(['group_id', 'name', 'description', 'default_executor_id', 'is_active', 'sort']));
        return response()->json($category);
    }
    public function destroy(Category $category) {
        $category->delete();
        return response()->json(null, 204);
    }
}
