<?php
namespace App\Notifications;
use App\Models\Ticket;
use App\Models\Comment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
class NewComment extends Notification
{
    use Queueable;
    public function __construct(public Ticket $ticket, public Comment $comment) {}
    public function via(object $notifiable): array { return ['mail', 'database']; }
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Comment: ' . $this->ticket->title)
            ->line($this->comment->user->name . ' commented on ticket #' . $this->ticket->id)
            ->line($this->comment->content)
            ->action('View Ticket', url('/tickets/' . $this->ticket->id));
    }


    public function toDatabase(object $notifiable): array
    {
        $ticket = $this->ticket;
        $prefix = match (static::class) {
            \App\Notifications\TicketCreated::class => 'Нова заявка',
            \App\Notifications\TicketAssigned::class => 'Призначено заявку',
            \App\Notifications\TicketStatusChanged::class => 'Статус заявки змінено',
            \App\Notifications\NewComment::class => 'Новий коментар',
            default => 'Сповіщення',
        };

        return [
            'ticket_id' => $ticket->id,
            'title' => $ticket->title,
            'prefix' => $prefix,
            'url' => '/tickets/' . $ticket->id,
        ];
    }
}
