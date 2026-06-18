<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use App\Models\Rating;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Ticket extends Model
{
    protected $fillable = [
        'title', 'description', 'status', 'priority', 'category_id',
        'user_id', 'executor_id', 'co_executor_id', 'observer_id', 'reviewer_id', 'assigned_by', 'assigned_at', 'resolved_at', 'due_date'
    ];
    protected function casts(): array {
        return [
            'assigned_at' => 'datetime',
            'resolved_at' => 'datetime',
            'due_date' => 'datetime',
        ];
    }
    public function category() { return $this->belongsTo(Category::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function executor() { return $this->belongsTo(User::class, 'executor_id'); }
    public function assigner() { return $this->belongsTo(User::class, 'assigned_by'); }
    public function comments() { return $this->hasMany(Comment::class); }
    public function files(): HasMany { return $this->hasMany(TicketFile::class); }
    public function logs() { return $this->hasMany(TicketLog::class); }
    public function rating() { return $this->hasOne(Rating::class); }

    public function coExecutor()
    {
        return $this->belongsTo(User::class, 'co_executor_id');
    }

    public function observer()
    {
        return $this->belongsTo(User::class, 'observer_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}