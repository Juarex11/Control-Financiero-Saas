<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class TicketMensaje extends Model
{
    protected $fillable = ['ticket_id', 'user_id', 'mensaje', 'foto'];

    protected $appends = ['foto_url'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function getFotoUrlAttribute(): ?string
    {
        return $this->foto
            ? Storage::disk('public')->url($this->foto)
            : null;
    }
}