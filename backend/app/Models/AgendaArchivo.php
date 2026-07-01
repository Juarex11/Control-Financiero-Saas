<?php
// app/Models/AgendaArchivo.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class AgendaArchivo extends Model
{
    protected $table = 'agenda_archivos';

    protected $fillable = [
        'evento_id', 'user_id', 'nombre_original', 'ruta', 'tipo_mime', 'tamanio',
    ];

    public function evento(): BelongsTo
    {
        return $this->belongsTo(AgendaEvento::class, 'evento_id');
    }

    public function url(): string
    {
        return Storage::disk('public')->url($this->ruta);
    }

    public function tamanioLegible(): string
    {
        $kb = $this->tamanio / 1024;
        if ($kb < 1024) return round($kb, 1) . ' KB';
        return round($kb / 1024, 1) . ' MB';
    }
}