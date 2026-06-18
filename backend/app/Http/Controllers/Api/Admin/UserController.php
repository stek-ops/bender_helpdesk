<?php
namespace App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
class UserController extends Controller
{
    public function index() {
        return response()->json(User::select('id', 'name', 'email', 'role', 'is_active', 'created_at')->orderBy('name')->get());
    }
    public function store(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:user,executor,admin',
        ]);
        $validated['password'] = Hash::make($validated['password']);
        return response()->json(User::create($validated), 201);
    }
    public function update(Request $request, User $user) {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'email' => ['email', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:6',
            'role' => 'in:user,executor,admin',
            'is_active' => 'boolean',
        ]);
        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }
        $user->update($validated);
        return response()->json($user);
    }
    public function destroy(User $user) {
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Cannot delete admin.'], 403);
        }
        $user->delete();
        return response()->json(null, 204);
    }
}
