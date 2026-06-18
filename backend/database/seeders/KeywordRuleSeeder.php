<?php
namespace Database\Seeders;

use App\Models\KeywordRule;
use Illuminate\Database\Seeder;

class KeywordRuleSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            ['keyword' => 'принтер', 'category_group_id' => 1, 'executor_id' => 10, 'sort' => 1],
            ['keyword' => 'друк', 'category_group_id' => 1, 'executor_id' => 10, 'sort' => 1],
            ['keyword' => 'сканер', 'category_group_id' => 1, 'executor_id' => 10, 'sort' => 2],
            ['keyword' => '1С', 'category_group_id' => 2, 'executor_id' => 9, 'sort' => 3],
            ['keyword' => '1с', 'category_group_id' => 2, 'executor_id' => 9, 'sort' => 3],
            ['keyword' => 'бухгалтер', 'category_group_id' => 2, 'executor_id' => 9, 'sort' => 4],
            ['keyword' => 'створити користувача', 'category_group_id' => 1, 'executor_id' => 11, 'sort' => 5],
            ['keyword' => 'створити обліков', 'category_group_id' => 1, 'executor_id' => 11, 'sort' => 5],
            ['keyword' => 'новий користувач', 'category_group_id' => 1, 'executor_id' => 11, 'sort' => 6],
            ['keyword' => 'пошта', 'category_group_id' => 1, 'executor_id' => 4, 'sort' => 7],
            ['keyword' => 'email', 'category_group_id' => 1, 'executor_id' => 4, 'sort' => 7],
            ['keyword' => 'мережа', 'category_group_id' => 1, 'executor_id' => 2, 'sort' => 8],
            ['keyword' => 'інтернет', 'category_group_id' => 1, 'executor_id' => 2, 'sort' => 8],
            ['keyword' => 'вірус', 'category_group_id' => 1, 'executor_id' => 2, 'sort' => 9],
            ['keyword' => 'сайт', 'category_group_id' => 2, 'executor_id' => 5, 'sort' => 10],
            ['keyword' => 'база даних', 'category_group_id' => 2, 'executor_id' => 5, 'sort' => 11],
            ['keyword' => 'sql', 'category_group_id' => 2, 'executor_id' => 5, 'sort' => 11],
        ];

        foreach ($rules as $rule) {
            KeywordRule::create($rule);
        }

        $this->command->info('Seeded ' . count($rules) . ' keyword rules');
    }
}
