<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Anuncio extends Model
{
    protected $fillable = [
        'user_id',
        'titulo',
        'contenido',
        'imagen',
        'duracion_anclado',  // 👈 duración del anclaje (1d, 1w, 1m)
        'anclado_hasta',     // 👈 fecha hasta cuando está anclado
        'expira_at',         // 👈 fecha cuando expira completamente
        'anclado',           // 👈 si está actualmente anclado
    ];

    protected $casts = [
        'anclado_hasta' => 'datetime',
        'expira_at' => 'datetime',
        'anclado'   => 'boolean',
    ];

    // ── Relaciones ──
    public function autor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reacciones(): HasMany
    {
        return $this->hasMany(Reaccion::class);
    }

    // ── Scopes ──
    public function scopeVigentes($query)
    {
        return $query->where('expira_at', '>', Carbon::now());
    }
    
    public function scopeAncladosActivos($query)
    {
        return $query->where('anclado', true)
                     ->where('anclado_hasta', '>', Carbon::now());
    }

    // ── Helpers ──
    
    /**
     * Calcula la fecha hasta cuando estará anclado
     */
  public static function calcularAncladoHasta(string $duracion): Carbon
{
    return match ($duracion) {
        '1d'      => now()->addDay(),
        '1w'      => now()->addWeek(),
        '1m'      => now()->addMonth(),
        'siempre' => now()->addYears(10), // prácticamente para siempre
        default   => now()->addDay(),
    };
}
    
    /**
     * Calcula la fecha de expiración total (ej: 30 días después)
     * Puedes personalizar esta lógica
     */
public static function calcularExpiracion(string $duracionAnclado): Carbon
{
    return match ($duracionAnclado) {
        '1d'      => now()->addDays(30),   // anclado 1 día, visible 30 días
        '1w'      => now()->addDays(60),   // anclado 1 semana, visible 60 días
        '1m'      => now()->addDays(90),   // anclado 1 mes, visible 90 días
        'siempre' => now()->addYears(10),
        default   => now()->addDays(90),
    };
}
    /**
     * Verifica si el anuncio está actualmente anclado
     */
    public function isAncladoActivo(): bool
    {
        return $this->anclado && $this->anclado_hasta && $this->anclado_hasta->isFuture();
    }
    
    /**
     * Verifica si expiró completamente
     */
    public function isExpirado(): bool
    {
        return $this->expira_at->isPast();
    }
}