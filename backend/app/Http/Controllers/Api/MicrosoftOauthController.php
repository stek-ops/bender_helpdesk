<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class MicrosoftOauthController extends Controller
{
    public function redirect()
    {
        $tenantId = \App\Models\Setting::getValue('microsoft_tenant_id');
        $clientId = \App\Models\Setting::getValue('microsoft_client_id');

        if (!$tenantId || !$clientId) {
            return response()->json(['error' => 'Microsoft 365 авторизація не налаштована'], 400);
        }

        $redirectUri = url('/api/auth/microsoft/callback');
        $url = "https://login.microsoftonline.com/{$tenantId}/oauth2/v2.0/authorize?" . http_build_query([
            'client_id' => $clientId,
            'response_type' => 'code',
            'redirect_uri' => $redirectUri,
            'response_mode' => 'query',
            'scope' => 'openid email profile User.Read',
            'state' => csrf_token(),
        ]);

        return redirect($url);
    }

    public function callback(Request $request)
    {
        $code = $request->query('code');
        if (!$code) {
            return redirect('/login?error=no_code');
        }

        $tenantId = \App\Models\Setting::getValue('microsoft_tenant_id');
        $clientId = \App\Models\Setting::getValue('microsoft_client_id');
        $clientSecret = \App\Models\Setting::getValue('microsoft_client_secret');
        $redirectUri = url('/api/auth/microsoft/callback');

        \Illuminate\Support\Facades\Log::info("MS callback: tenant=$tenantId client_id=$clientId secret=" . (empty($clientSecret) ? "EMPTY" : "SET"));
        $response = Http::asForm()->post("https://login.microsoftonline.com/{$tenantId}/oauth2/v2.0/token", [
            'grant_type' => 'authorization_code',
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'code' => $code,
            'redirect_uri' => $redirectUri,
            'scope' => 'openid email profile User.Read',
        ]);

        if (!$response->successful()) {
            \Illuminate\Support\Facades\Log::error("MS token exchange failed: " . $response->body());
            return redirect('/login?error=token_failed&details=check_logs');
        }

        $tokenData = $response->json();
        $accessToken = $tokenData['access_token'];

        $graphResponse = Http::withToken($accessToken)->get('https://graph.microsoft.com/v1.0/me');
        if (!$graphResponse->successful()) {
            return redirect('/login?error=graph_failed');
        }

        $graphUser = $graphResponse->json();
        $microsoftId = $graphUser['id'];
        $email = $graphUser['mail'] ?? $graphUser['userPrincipalName'];
        $name = $graphUser['displayName'] ?? explode('@', $email)[0];

        $user = User::where('microsoft_id', $microsoftId)->first();

        if (!$user) {
            $user = User::where('email', $email)->first();
            if ($user) {
                $user->update([
                    'microsoft_id' => $microsoftId,
                    'microsoft_token' => $accessToken,
                ]);
            } else {
                $autoCreate = \App\Models\Setting::getValue('microsoft_auto_create', 'true');
                if ($autoCreate !== 'false') {
                    $defaultRole = \App\Models\Setting::getValue('microsoft_default_role', 'user');
                    $user = User::create([
                        'name' => $name,
                        'email' => $email,
                        'password' => Hash::make(Str::random(32)),
                        'microsoft_id' => $microsoftId,
                        'microsoft_token' => $accessToken,
                        'role' => $defaultRole,
                    ]);
                } else {
                    return redirect('/login?error=user_not_found');
                }
            }
        } else {
            $user->update(['microsoft_token' => $accessToken]);
        }

        $token = $user->createToken('microsoft-oauth')->plainTextToken;

        $code = \Illuminate\Support\Str::random(32);
        \Illuminate\Support\Facades\Cache::put('oauth_' . $code, [
            'token' => $token,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'id' => $user->id,
        ], now()->addMinutes(5));
        $frontendUrl = env('APP_FRONTEND_URL', config('app.url'));
        return redirect("{$frontendUrl}/login/microsoft?code={$code}");
    }
}
