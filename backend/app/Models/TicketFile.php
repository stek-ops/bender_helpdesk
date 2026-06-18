<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketFile extends Model
{
    protected $fillable = ["ticket_id", "original_name", "stored_path", "mime_type", "size"];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }
}
