<?php
// app/Models/AgendaContacto.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgendaContacto extends Model
{
    protected $table = 'agenda_contactos';

    protected $fillable = [
        'evento_id', 'nombre', 'email', 'telefono',
        'empresa', 'cargo', 'notas', 'user_id', 'rol', 'confirmacion',
    ];

    public function evento(): BelongsTo
    {
        return $this->belongsTo(AgendaEvento::class, 'evento_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}