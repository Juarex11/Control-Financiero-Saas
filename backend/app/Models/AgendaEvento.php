<?php
// app/Models/AgendaEvento.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class AgendaEvento extends Model
{
    use SoftDeletes;

    protected $table = 'agenda_eventos';

    protected $fillable = [
        'user_id', 'tipo', 'titulo', 'descripcion', 'lugar', 'link_reunion',
        'fecha_inicio', 'fecha_fin', 'todo_el_dia', 'zona_horaria',
        'recordatorio_minutos', 'estado', 'motivo_cancelacion',
        'color', 'prioridad', 'repeticion', 'repeticion_hasta',
    ];

    protected $casts = [
        'fecha_inicio'    => 'datetime',
        'fecha_fin'       => 'datetime',
        'repeticion_hasta'=> 'date',
        'todo_el_dia'     => 'boolean',
    ];

    public function creador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function contactos(): HasMany
    {
        return $this->hasMany(AgendaContacto::class, 'evento_id');
    }

    public function notas(): HasMany
    {
        return $this->hasMany(AgendaNota::class, 'evento_id');
    }

    public function archivos(): HasMany
    {
        return $this->hasMany(AgendaArchivo::class, 'evento_id');
    }

    public function scopeDeHoy($query)
    {
        return $query->whereDate('fecha_inicio', Carbon::today());
    }

    public function scopeProximos($query, int $dias = 7)
    {
        return $query->whereBetween('fecha_inicio', [now(), now()->addDays($dias)]);
    }

    public function scopePorEstado($query, string $estado)
    {
        return $query->where('estado', $estado);
    }

    public function esCita(): bool
    {
        return $this->tipo === 'cita';
    }

    public function estaVencido(): bool
    {
        return $this->fecha_inicio->isPast()
            && !in_array($this->estado, ['finalizada', 'cancelada']);
    }
}