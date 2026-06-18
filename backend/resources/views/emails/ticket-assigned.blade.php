@component("emails.layout", ["title" => "Заявку призначено #" . $ticket->id])
  <p style="font-size:16px;color:#333;margin:0 0 8px;">Вас призначено виконавцем заявки</p>
  <p class="ticket-id">#{{ $ticket->id }}</p>
  <h2 style="font-size:18px;color:#1F6EB0;margin:16px 0 8px;">{{ $ticket->title }}</h2>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:6px 12px;background:#F5F7F8;font-size:13px;color:#828B95;width:120px;">Пріоритет</td><td style="padding:6px 12px;font-size:13px;color:#333;">{{ ucfirst($ticket->priority) }}</td></tr>
    <tr><td style="padding:6px 12px;background:#F5F7F8;font-size:13px;color:#828B95;">Автор</td><td style="padding:6px 12px;font-size:13px;color:#333;">{{ $ticket->user?->name ?? "—" }}</td></tr>
    @if($ticket->due_date)<tr><td style="padding:6px 12px;background:#F5F7F8;font-size:13px;color:#828B95;">Термін</td><td style="padding:6px 12px;font-size:13px;color:#333;">{{ $ticket->due_date->format("d.m.Y H:i") }}</td></tr>@endif
  </table>
  <div style="text-align:center;"><a href="{{ url("/tickets/" . $ticket->id) }}" class="btn">Перейти до заявки</a></div>
@endcomponent