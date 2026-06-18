<?php
namespace App\Notifications;
use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
class TicketAssigned extends Notification
{
    use Queueable;
    public function __construct(public Ticket $ticket) {}
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
            ->subject('Заявку призначено #' . $this->ticket->id)
            ->view('emails.ticket-assigned', ['ticket' => $this->ticket]);
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
