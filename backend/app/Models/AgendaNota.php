<?php
// app/Models/AgendaNota.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgendaNota extends Model
{
    protected $table = 'agenda_notas';

    protected $fillable = ['evento_id', 'user_id', 'contenido', 'privada'];

    protected $casts = ['privada' => 'boolean'];

    public function evento(): BelongsTo
    {
        return $this->belongsTo(AgendaEvento::class, 'evento_id');
    }

    public function autor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}