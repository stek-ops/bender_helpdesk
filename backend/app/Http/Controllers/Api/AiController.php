<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AiController extends Controller
{
    public function ask(Request $request)
    {
        set_time_limit(0);

        $request->validate([
            "message" => "required|string|max:1000",
        ]);

        $question = trim($request->input("message"));
        $cacheKey = "ai_" . md5($question);

        $answer = Cache::remember($cacheKey, 3600, function () use ($question) {
            $context = $this->buildContext();
            $prompt = $context . "

Користувач ставить питання: {$question}

Твоє завдання:
1. Дай максимально корисну та розгорнуту відповідь українською мовою
2. Якщо питання стосується типової IT-проблеми — запропонуй покрокове вирішення
3. Якщо питання не потребує створення заявки (налаштування пошти, принтера, пароль тощо) — дай інструкцію і скажи, що можна зробити самостійно
4. Якщо без заявки не обійтись — поясни чому і запропонуй створити заявку, підказавши категорію
5. Не будь саркастичним, не ображай користувача. Будь доброзичливим i корисним фахiвцем першої лiнiї пiдтримки
6. Якщо питання не стосується IT або helpdesk — ввічливо відмовся
7. Відповідь має бути структурованою: спочатку діагностика, потім кроки, потім висновок";

            $escaped = escapeshellarg($prompt);
            $cmd = "node /var/www/helpdesk/backend/ai/ask.cjs {$escaped}";
            $output = shell_exec($cmd . " 2>/dev/null");

            if (!$output) {
                return "Ай-яй-яй, щось зламалося. Спробуй ще раз або створи заявку.";
            }

            $data = json_decode($output, true);
            $text = $data["answer"] ?? "Нічого не зрозумів. Спробуй ще раз.";
            return strip_tags($text);
        });

        return response()->json(["answer" => $answer]);
    }

    private function buildContext(): string
    {
        $totalTickets = Ticket::count();
        $newTickets = Ticket::where("status", "new")->count();
        $inProgress = Ticket::where("status", "in_progress")->count();
        $openTickets = Ticket::whereNotIn("status", ["closed", "cancelled"])->count();

        $executors = User::where("role", "executor")->where("is_active", true)
            ->withCount(["assignedTickets as open" => fn($q) => $q->whereNotIn("status", ["closed", "cancelled"])])
            ->get()
            ->map(fn($u) => $u->name . " (" . $u->open . " вiдкритих)")
            ->implode(", ");

        $topCategories = Category::withCount("tickets")->orderBy("tickets_count", "desc")->take(5)
            ->get()
            ->map(fn($c) => $c->name . " (" . $c->tickets_count . ")")
            ->implode(", ");

        return "Ти — перша лiнiя технiчної пiдтримки helpdesk-системи. Данi на зараз:\n"
            . "- Всього заявок: {$totalTickets}\n"
            . "- Вiдкрито: {$openTickets} (нових: {$newTickets}, в роботi: {$inProgress})\n"
            . "- Виконавцi: {$executors}\n"
            . "- Популярнi категорiї: {$topCategories}\n\n"
            . "Типовi проблеми, якi можна вирiшити без заявки:\n"
            . "- Не працює пошта → перевiрити логiн/пароль, налаштування SMTP, очистити кеш браузера\n"
            . "- Не друкує принтер → перевiрити чи увiмкнений, чи є папiр, перезавантажити\n"
            . "- Не вiдкривається сайт → очистити кеш DNS (ipconfig /flushdns), перевiрити з'єднання\n"
            . "- Забув пароль → зв'язатися з адмiном для скидання\n"
            . "- Повiльно працює комп'ютер → закрити зайвi програми, перезавантажити\n"
            . "- Проблеми з 1С → перевiрити, чи працює сервер 1С, оновити платформу\n"
            . "- Не працює VPN → перевiрити пiдключення, перезапустити клiєнт\n"
            . "- Потрiбен доступ до папки → звернутися до адмiна з точним шляхом\n"
            . "- Немає звуку → перевiрити динамiки, гучнiсть, драйвери";
    }
}
