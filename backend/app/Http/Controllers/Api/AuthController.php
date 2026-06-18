<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Services\LdapService;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            if (LdapService::isConfigured()) {
                $user = LdapService::authenticate($request->email, $request->password);
            }
            if (!$user) {
                throw ValidationException::withMessages([
                    'email' => ['The provided credentials are incorrect.'],
                ]);
            }
        } elseif (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }
        if (!$user->is_active) {
            return response()->json(['message' => 'Account is disabled.'], 403);
        }
        $token = $user->createToken('api-token')->plainTextToken;
        return response()->json(['token' => $token, 'user' => $user]);
    }
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out.']);
    }
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function profile(Request $request)
    {
        $user = $request->user()->load(["tickets", "assignedTickets"]);
        return response()->json([
            "user" => $user,
            "ticket_count" => $user->tickets->count(),
            "assigned_count" => $user->assignedTickets->count(),
            "resolved_count" => $user->assignedTickets->whereIn("status", ["resolved", "closed"])->count(),
            "open_count" => $user->assignedTickets->whereNotIn("status", ["closed", "cancelled"])->count(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            "name" => "sometimes|string|max:255",
            "email" => "sometimes|email|max:255|unique:users,email,$user->id",
            "password" => "sometimes|string|min:6",
        ]);

        if (isset($data["password"])) {
            $data["password"] = bcrypt($data["password"]);
        }

        $user->update($data);
        return response()->json($user);
    }

}
