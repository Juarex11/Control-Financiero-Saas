<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'padre_id',
        'codigo_acceso',
        'cargo',
        'telefono',
        'photo',
        'currency',
        'last_login',
        'onboarding_done',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password'        => 'hashed',
        'last_login'      => 'datetime',
        'onboarding_done' => 'boolean',
    ];

    // ── Relaciones ────────────────────────────────────────────────────────────

    public function padre(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'padre_id');
    }

    public function hijos(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class, 'padre_id');
    }

    public function descendientes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hijos()->with('descendientes');
    }

    // ← nueva: todas las cuentas ordenadas
    public function accounts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Account::class)->orderBy('order')->orderBy('created_at');
    }

    // ← nueva: solo la cuenta principal
    public function primaryAccount(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Account::class)->where('is_primary', true);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public static function generarCodigo(): string
    {
        do {
            $codigo = strtoupper(Str::random(8));
        } while (self::where('codigo_acceso', $codigo)->exists());

        return $codigo;
    }

    public function esAdmin(): bool
    {
        return $this->role === 'admin';
    }
}