<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function getTeams()
    {
        return response()->json([
            "webhook_url" => Setting::getValue("teams_webhook_url", ""),
            "enabled" => Setting::getValue("teams_enabled", "false") === "true",
        ]);
    }

    public function updateTeams(Request $request)
    {
        $data = $request->validate([
            "webhook_url" => "nullable|string|max:500",
            "enabled" => "boolean",
        ]);

        Setting::setValue("teams_webhook_url", $data["webhook_url"] ?? "");
        Setting::setValue("teams_enabled", ($data["enabled"] ?? false) ? "true" : "false");

        return response()->json(["success" => true]);
    }

    public function testTeams()
    {
        $ok = \App\Services\TeamsService::send(
            "\u0422\u0435\u0441\u0442\u043e\u0432\u0435 \u0441\u043f\u043e\u0432\u0456\u0449\u0435\u043d\u043d\u044f",
            "\u042f\u043a\u0449\u043e \u0432\u0438 \u0431\u0430\u0447\u0438\u0442\u0435 \u0446\u0435 \u043f\u043e\u0432\u0456\u0434\u043e\u043c\u043b\u0435\u043d\u043d\u044f, \u0456\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0456\u044f \u0437 Teams \u043f\u0440\u0430\u0446\u044e\u0454 \u043f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u043e.",
            "1F6EB0"
        );

        return response()->json(["success" => $ok]);
    }

    public function getLdap()
    {
        return response()->json([
            "enabled" => Setting::getValue("ldap_enabled", "false") === "true",
            "host" => Setting::getValue("ldap_host", ""),
            "port" => (int) Setting::getValue("ldap_port", "389"),
            "base_dn" => Setting::getValue("ldap_base_dn", ""),
            "domain" => Setting::getValue("ldap_domain", ""),
            "username" => Setting::getValue("ldap_username", ""),
            "password" => "",
            "auto_create" => Setting::getValue("ldap_auto_create", "true") === "true",
            "default_role" => Setting::getValue("ldap_default_role", "user"),
        ]);
    }

    public function updateLdap(Request $request)
    {
        $data = $request->validate([
            "enabled" => "boolean",
            "host" => "nullable|string|max:255",
            "port" => "integer|min:1|max:65535",
            "base_dn" => "nullable|string|max:500",
            "domain" => "nullable|string|max:255",
            "username" => "nullable|string|max:255",
            "password" => "nullable|string|max:500",
            "auto_create" => "boolean",
            "default_role" => "string|in:user,executor",
        ]);

        Setting::setValue("ldap_enabled", ($data["enabled"] ?? false) ? "true" : "false");
        Setting::setValue("ldap_host", $data["host"] ?? "");
        Setting::setValue("ldap_port", (string) ($data["port"] ?? 389));
        Setting::setValue("ldap_base_dn", $data["base_dn"] ?? "");
        Setting::setValue("ldap_domain", $data["domain"] ?? "");
        Setting::setValue("ldap_username", $data["username"] ?? "");
        if (!empty($data["password"])) {
            Setting::setValue("ldap_password", $data["password"]);
        }
        Setting::setValue("ldap_auto_create", ($data["auto_create"] ?? true) ? "true" : "false");
        Setting::setValue("ldap_default_role", $data["default_role"] ?? "user");

        return response()->json(["success" => true]);
    }

    public function testLdap()
    {
        $result = \App\Services\LdapService::testConnection();
        return response()->json($result);
    }

    public function getMicrosoft(Request $request)
    {
        return response()->json([
            'enabled' => Setting::getValue('microsoft_enabled', 'false') === 'true',
            'tenant_id' => Setting::getValue('microsoft_tenant_id', ''),
            'client_id' => Setting::getValue('microsoft_client_id', ''),
            'client_secret' => Setting::getValue('microsoft_client_secret', ''),
            'auto_create' => Setting::getValue('microsoft_auto_create', 'true') === 'true',
            'default_role' => Setting::getValue('microsoft_default_role', 'user'),
        ]);
    }

    public function updateMicrosoft(Request $request)
    {
        $data = $request->validate([
            'enabled' => 'boolean',
            'tenant_id' => 'required_with:enabled|string',
            'client_id' => 'required_with:enabled|string',
            'client_secret' => 'string',
            'auto_create' => 'boolean',
            'default_role' => 'in:user,executor,admin',
        ]);

        Setting::setValue('microsoft_enabled', ($data['enabled'] ?? false) ? 'true' : 'false');
        Setting::setValue('microsoft_tenant_id', $data['tenant_id'] ?? '');
        Setting::setValue('microsoft_client_id', $data['client_id'] ?? '');
        if (!empty($data['client_secret'])) {
            Setting::setValue('microsoft_client_secret', $data['client_secret']);
        }
        Setting::setValue('microsoft_auto_create', ($data['auto_create'] ?? true) ? 'true' : 'false');
        Setting::setValue('microsoft_default_role', $data['default_role'] ?? 'user');

        return response()->json(['success' => true, 'message' => 'Налаштування Microsoft 365 збережено']);
    }

    public function getEmail()
    {
        return response()->json([
            "mailer" => env("MAIL_MAILER", "smtp"),
            "host" => env("MAIL_HOST", ""),
            "port" => (int) env("MAIL_PORT", "587"),
            "encryption" => env("MAIL_ENCRYPTION", "tls"),
            "username" => env("MAIL_USERNAME", ""),
            "password" => "",
            "from_address" => env("MAIL_FROM_ADDRESS", "helpdesk@example.com"),
            "from_name" => env("MAIL_FROM_NAME", "IT Helpdesk"),
        ]);
    }

    public function updateEmail(Request $request)
    {
        $data = $request->validate([
            "mailer" => "string|in:smtp,sendmail,mailgun,ses,postmark,log",
            "host" => "nullable|string|max:255",
            "port" => "integer|min:1|max:65535",
            "encryption" => "nullable|string|in:null,tls,ssl",
            "username" => "nullable|string|max:255",
            "password" => "nullable|string|max:500",
            "from_address" => "nullable|email|max:255",
            "from_name" => "nullable|string|max:255",
        ]);

        $envFile = base_path(".env");
        $env = file_get_contents($envFile);

        $data["host"] = str_replace(["\r", "\n"], "", $data["host"] ?? "");
        $data["username"] = str_replace(["\r", "\n"], "", $data["username"] ?? "");
        $data["from_name"] = str_replace(["\r", "\n"], "", $data["from_name"] ?? "");
        $data["from_address"] = str_replace(["\r", "\n"], "", $data["from_address"] ?? "");
        if (!empty($data["password"])) {
            $data["password"] = str_replace(["\r", "\n"], "", $data["password"]);
        }

        $replacements = [
            "MAIL_MAILER" => $data["mailer"] ?? "smtp",
            "MAIL_HOST" => $data["host"] ?? "",
            "MAIL_PORT" => (string) ($data["port"] ?? "587"),
            "MAIL_ENCRYPTION" => $data["encryption"] ?? "tls",
            "MAIL_USERNAME" => $data["username"] ?? "",
            "MAIL_FROM_ADDRESS" => $data["from_address"] ?? "helpdesk@example.com",
            "MAIL_FROM_NAME" => $data["from_name"] ?? "IT Helpdesk",
        ];

        if (!empty($data["password"])) {
            $replacements["MAIL_PASSWORD"] = $data["password"];
        }

        foreach ($replacements as $key => $value) {
            $escapedKey = preg_quote($key, "/");
            if (preg_match("/^{$escapedKey}=/m", $env)) {
                $env = preg_replace("/^{$escapedKey}=.*/m", "{$key}={$value}", $env);
            } else {
                $env .= "\n{$key}={$value}";
            }
        }

        file_put_contents($envFile, $env);

        return response()->json(["success" => true, "message" => "Email settings saved."]);
    }

    public function testEmail(Request $request)
    {
        try {
            $user = $request->user();
            $latest = \App\Models\Ticket::where("user_id", $user->id)->latest()->first();
            if (!$latest) {
                return response()->json(["success" => false, "error" => "No tickets found for test"]);
            }
            $user->notify(new \App\Notifications\TicketCreated($latest));
            return response()->json(["success" => true]);
        } catch (\Exception $e) {
            return response()->json(["success" => false, "error" => $e->getMessage()]);
        }
    }

}
