<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KbArticle extends Model
{
    protected $table = "kb_articles";
    protected $fillable = ["user_id", "title", "content", "category", "is_published"];

    protected function casts(): array
    {
        return ["is_published" => "boolean"];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
