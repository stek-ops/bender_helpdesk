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
    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if (!$notifiable instanceof \App\Models\User || $notifiable->notify_email) {
            $channels[] = 'mail';
        }
        return $channels;
    }
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Новий коментар #' . $this->ticket->id)
            ->view('emails.new-comment', ['ticket' => $this->ticket, 'comment' => $this->comment]);
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
