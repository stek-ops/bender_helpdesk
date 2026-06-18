<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KeywordRule extends Model
{
    protected $fillable = [
        'keyword',
        'category_group_id',
        'category_id',
        'executor_id',
        'sort',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function categoryGroup()
    {
        return $this->belongsTo(CategoryGroup::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function executor()
    {
        return $this->belongsTo(User::class, 'executor_id');
    }
}
