<?php
namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
class User extends Authenticatable
{
    use HasApiTokens, Notifiable;
    protected $fillable = [
        'name', 'email', 'password', 'role', 'is_active', 'ldap_uid', 'microsoft_id', 'microsoft_token'
    ];
    protected $hidden = ['password', 'remember_token'];
    protected function casts(): array {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }
    public function isAdmin(): bool { return $this->role === 'admin'; }
    public function isExecutor(): bool { return $this->role === 'executor'; }
    public function tickets() { return $this->hasMany(Ticket::class); }
    public function assignedTickets() { return $this->hasMany(Ticket::class, 'executor_id'); }
    public function comments() { return $this->hasMany(Comment::class); }
}
