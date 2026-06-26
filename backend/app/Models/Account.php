<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'icon',
        'color',
        'currency',
        'balance',
        'note',
        'is_primary',
        'order',
    ];

    protected $casts = [
        'balance'    => 'float',
        'is_primary' => 'boolean',
        'order'      => 'integer',
    ];

    // ── Relaciones ────────────────────────────────────────────────────────────

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    // Símbolo de la moneda
    public function getCurrencySymbolAttribute(): string
    {
        return match($this->currency) {
            'PEN' => 'S/',
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'BRL' => 'R$',
            'CLP' => '$',
            'COP' => '$',
            'MXN' => '$',
            'ARS' => '$',
            'BOB' => 'Bs',
            default => $this->currency,
        };
    }
}