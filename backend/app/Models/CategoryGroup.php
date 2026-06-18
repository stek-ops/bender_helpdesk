<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class CategoryGroup extends Model
{
    protected $fillable = ['name', 'sort'];
    public function categories() { return $this->hasMany(Category::class, 'group_id'); }
}
