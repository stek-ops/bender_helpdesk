<?php
namespace App\Policies;
use App\Models\Ticket;
use App\Models\User;
class TicketPolicy
{
    public function view(User $user, Ticket $ticket): bool
    {
        return $user->role === 'admin' || $user->id === $ticket->user_id || $user->id === $ticket->executor_id;
    }
    public function delete(User $user, Ticket $ticket): bool
    {
        return $user->role === 'admin';
    }
}
