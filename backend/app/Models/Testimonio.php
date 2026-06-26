<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Testimonio extends Model
{
    protected $fillable = [
        'user_id',
        'contenido',
        'cargo_empresa',
        'estrellas',
        'estado',
        'destacado',
    ];

    protected $casts = [
        'estrellas' => 'integer',
        'destacado' => 'boolean',
    ];

    // ── Relaciones ────────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeAprobados($query)
    {
        return $query->where('estado', 'aprobado');
    }

    public function scopeDestacados($query)
    {
        return $query->where('destacado', true);
    }
}