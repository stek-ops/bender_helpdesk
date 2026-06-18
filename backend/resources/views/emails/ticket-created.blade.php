@component("emails.layout", ["title" => "Нова заявка #" . $ticket->id])
  <p style="font-size:16px;color:#333;margin:0 0 8px;">Створено нову заявку</p>
  <p class="ticket-id">#{{ $ticket->id }} &bull; {{ $ticket->created_at->format("d.m.Y H:i") }}</p>
  <h2 style="font-size:18px;color:#1F6EB0;margin:16px 0 8px;">{{ $ticket->title }}</h2>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:6px 12px;background:#F5F7F8;font-size:13px;color:#828B95;width:120px;">Категорія</td><td style="padding:6px 12px;font-size:13px;color:#333;">{{ $ticket->category?->name ?? "—" }}</td></tr>
    <tr><td style="padding:6px 12px;background:#F5F7F8;font-size:13px;color:#828B95;">Пріоритет</td><td style="padding:6px 12px;font-size:13px;color:#333;">{{ ucfirst($ticket->priority) }}</td></tr>
    <tr><td style="padding:6px 12px;background:#F5F7F8;font-size:13px;color:#828B95;">Автор</td><td style="padding:6px 12px;font-size:13px;color:#333;">{{ $ticket->user?->name ?? "—" }}</td></tr>
  </table>
  <div style="text-align:center;"><a href="{{ url("/tickets/" . $ticket->id) }}" class="btn">Переглянути заявку</a></div>
@endcomponent