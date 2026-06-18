@component("emails.layout", ["title" => "Новий коментар #" . $ticket->id])
  <p style="font-size:16px;color:#333;margin:0 0 8px;">Новий коментар у заявці</p>
  <p class="ticket-id">#{{ $ticket->id }} &bull; {{ $comment->created_at->format("d.m.Y H:i") }}</p>
  <h2 style="font-size:18px;color:#1F6EB0;margin:16px 0 8px;">{{ $ticket->title }}</h2>
  <div style="margin:16px 0;padding:16px;background:#F0F5FF;border-radius:8px;border-left:3px solid #1F6EB0;">
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#1F6EB0;">{{ $comment->user?->name ?? "Користувач" }}</p>
    <p style="margin:0;font-size:13px;color:#525C69;line-height:1.5;">{{ Str::limit(strip_tags($comment->content), 500) }}</p>
  </div>
  <div style="text-align:center;"><a href="{{ url("/tickets/" . $ticket->id) }}" class="btn">Відповісти</a></div>
@endcomponent