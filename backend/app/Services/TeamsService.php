<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TeamsService
{
    public static function send(string , string , string  = '1F6EB0', ?string  = null): bool
    {
         = Setting::getValue('teams_enabled', 'false');
        if ( !== 'true') return false;

         = Setting::getValue('teams_webhook_url');
        if (!) return false;

         = [
            '@type' => 'MessageCard',
            '@context' => 'http://schema.org/extensions',
            'themeColor' => ,
            'title' => ,
            'text' => ,
        ];

        if () {
            ['potentialAction'] = [
                [
                    '@type' => 'OpenUri',
                    'name' => 'Відкрити заявку',
                    'targets' => [['os' => 'default', 'uri' => ]],
                ],
            ];
        }

        try {
             = Http::timeout(10)->post(, );
            return ->successful();
        } catch (\Exception ) {
            Log::error('Teams webhook failed: ' . ->getMessage());
            return false;
        }
    }
}
