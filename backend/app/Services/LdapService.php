<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class LdapService
{
    protected static function config(): array
    {
        return [
            "enabled" => Setting::getValue("ldap_enabled", "false") === "true",
            "host" => Setting::getValue("ldap_host", ""),
            "port" => (int) Setting::getValue("ldap_port", "389"),
            "base_dn" => Setting::getValue("ldap_base_dn", ""),
            "domain" => Setting::getValue("ldap_domain", ""),
            "username" => Setting::getValue("ldap_username", ""),
            "password" => Setting::getValue("ldap_password", ""),
            "auto_create" => Setting::getValue("ldap_auto_create", "true") === "true",
            "default_role" => Setting::getValue("ldap_default_role", "user"),
        ];
    }

    public static function isConfigured(): bool
    {
        $cfg = self::config();
        return $cfg["enabled"] && !empty($cfg["host"]);
    }

    public static function authenticate(string $email, string $password): ?User
    {
        $cfg = self::config();
        if (!$cfg["enabled"] || !$cfg["host"]) return null;

        $domain = $cfg["domain"];
        $username = strstr($email, "@", true) ?: $email;

        try {
            $conn = ldap_connect($cfg["host"], $cfg["port"]);
            if (!$conn) return null;

            ldap_set_option($conn, LDAP_OPT_PROTOCOL_VERSION, 3);
            ldap_set_option($conn, LDAP_OPT_REFERRALS, 0);

            if ($cfg["username"]) {
                if (!@ldap_bind($conn, $cfg["username"], $cfg["password"])) {
                    Log::warning("LDAP service bind failed");
                    return null;
                }
                $userPrincipal = $domain ? $username . "@" . $domain : $username;
                $userBind = @ldap_bind($conn, $userPrincipal, $password);
                if (!$userBind) return null;
            } else {
                $bindUser = $domain ? $username . "@" . $domain : $username;
                if (!@ldap_bind($conn, $bindUser, $password)) return null;
            }

            $searchFilter = "&(objectClass=user)(mail=" . ldap_escape($email, "", LDAP_ESCAPE_FILTER) . ")";
            $search = @ldap_search($conn, $cfg["base_dn"], $searchFilter, ["cn", "mail", "samaccountname", "displayname", "dn"], 0, 1);
            if (!$search) return null;

            $entries = ldap_get_entries($conn, $search);
            if ($entries["count"] === 0) return null;

            $entry = $entries[0];
            $ldapUid = $entry["samaccountname"][0] ?: $entry["cn"][0] ?? $username;
            $displayName = $entry["displayname"][0] ?? $entry["cn"][0] ?? $username;

            ldap_unbind($conn);

            $user = User::where("ldap_uid", $ldapUid)->orWhere("email", $email)->first();

            if (!$user && $cfg["auto_create"]) {
                $user = User::create([
                    "name" => $displayName,
                    "email" => $email,
                    "password" => bcrypt($password),
                    "ldap_uid" => $ldapUid,
                    "role" => $cfg["default_role"],
                    "is_active" => true,
                ]);
                Log::info("LDAP user auto-created: " . $email);
            }

            if ($user && !$user->ldap_uid) {
                $user->update(["ldap_uid" => $ldapUid]);
            }

            if ($user && !$user->is_active) return null;

            return $user;

        } catch (\Exception $e) {
            Log::error("LDAP error: " . $e->getMessage());
            return null;
        }
    }

    public static function testConnection(): array
    {
        $cfg = self::config();
        if (!$cfg["host"]) {
            return ["success" => false, "message" => "Host not configured"];
        }

        try {
            $conn = @ldap_connect($cfg["host"], $cfg["port"]);
            if (!$conn) {
                return ["success" => false, "message" => "Cannot connect"];
            }

            ldap_set_option($conn, LDAP_OPT_PROTOCOL_VERSION, 3);
            ldap_set_option($conn, LDAP_OPT_REFERRALS, 0);

            $bindUser = $cfg["username"] ?: ($cfg["domain"] ? "test@" . $cfg["domain"] : "");
            $bindPass = $cfg["password"] ?: "";

            if (!@ldap_bind($conn, $bindUser, $bindPass)) {
                $err = ldap_error($conn);
                ldap_unbind($conn);
                return ["success" => false, "message" => "Bind failed: " . $err];
            }

            if ($cfg["base_dn"]) {
                @ldap_search($conn, $cfg["base_dn"], "(objectClass=user)", ["cn", "mail"], 0, 5);
            }

            ldap_unbind($conn);
            return ["success" => true, "message" => "Connection successful"];

        } catch (\Exception $e) {
            return ["success" => false, "message" => $e->getMessage()];
        }
    }
}
