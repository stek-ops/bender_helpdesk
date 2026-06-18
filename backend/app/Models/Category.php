<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Category extends Model
{
    protected $fillable = ['group_id', 'name', 'description', 'default_executor_id', 'is_active', 'sort'];
    protected function casts(): array { return ['is_active' => 'boolean']; }
    public function group() { return $this->belongsTo(CategoryGroup::class, 'group_id'); }
    public function defaultExecutor() { return $this->belongsTo(User::class, 'default_executor_id'); }
    public function tickets() { return $this->hasMany(Ticket::class); }
}
