<?php
namespace Database\Seeders;
use App\Models\User;
use App\Models\CategoryGroup;
use App\Models\Category;
use App\Models\Ticket;
use App\Models\Comment;
use Illuminate\Database\Seeder;
use Database\Seeders\KeywordRuleSeeder;
use Illuminate\Support\Facades\Hash;
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        \$this->call(KeywordRuleSeeder::class);
        // Admin
        User::create([
            'name' => 'Admin',
            'email' => 'admin@helpdesk.local',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);
        // Executors
        $executors = [];
        foreach (['Іван Системов', 'Петро Багов', 'Олексій Мережев', 'Марія Кодова'] as $i => $name) {
            $executors[] = User::create([
                'name' => $name,
                'email' => 'executor' . ($i+1) . '@helpdesk.local',
                'password' => Hash::make('executor123'),
                'role' => 'executor',
            ]);
        }
        // Users
        foreach (['Андрій Користувач', 'Олена Працівник'] as $name) {
            User::create([
                'name' => $name,
                'email' => strtolower(str_replace(' ', '.', $name)) . '@helpdesk.local',
                'password' => Hash::make('user123'),
                'role' => 'user',
            ]);
        }
        // Groups & Categories
        $sa = CategoryGroup::create(['name' => 'До системних адміністраторів', 'sort' => 1]);
        $dev = CategoryGroup::create(['name' => 'До програмістів', 'sort' => 2]);
        $saCats = [
            ['Не працює мережа', 'Проблеми з доступом до мережі або інтернету', $executors[0]->id],
            ['Не працює комп\'ютер', 'Апаратні проблеми, не вмикається, гальмує', $executors[0]->id],
            ['Проблеми з поштою', 'Не надсилаються/не приходять листи', $executors[2]->id],
            ['Доступ до ресурсів', 'Потрібен доступ до папок, принтерів, VPN', $executors[2]->id],
        ];
        $devCats = [
            ['Помилка в коді', 'Баг або некоректна робота функціоналу', $executors[1]->id],
            ['Новий функціонал', 'Запит на розробку нової можливості', $executors[1]->id],
            ['Проблеми з БД', 'Помилки запитів, втрата даних, міграції', $executors[3]->id],
            ['Інтеграція API', 'Підключення сторонніх сервісів, API', $executors[3]->id],
        ];
        foreach ($saCats as $c) {
            Category::create(['group_id' => $sa->id, 'name' => $c[0], 'description' => $c[1], 'default_executor_id' => $c[2]]);
        }
        foreach ($devCats as $c) {
            Category::create(['group_id' => $dev->id, 'name' => $c[0], 'description' => $c[1], 'default_executor_id' => $c[2]]);
        }
    }
}
