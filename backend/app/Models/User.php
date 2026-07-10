<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;  // ← añadir

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;
use App\Models\Ticket;
use App\Models\ReminderCategory;
class User extends Authenticatable
{
      use HasApiTokens, HasFactory, Notifiable;  // ← añadir HasFactory

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
    'timezone',
    'pais',
    'ob_actividad',   // ← añadir
    'ob_monto',       // ← añadir
    'ob_metas',       // ← añadir
    'ob_deudas',      // ← añadir
    'ob_num_deudas',  // ← añadir
    'ob_finalidad',   // ← añadir
];



    protected $hidden = [
        'password',
        'remember_token',
    ];

 protected $casts = [
    'password'        => 'hashed',
    'last_login'      => 'datetime',
    'onboarding_done' => 'boolean',
    'ob_metas'        => 'array',    // ← añadir
    'ob_deudas'       => 'boolean',  // ← añadir
    'ob_monto'        => 'decimal:2',// ← añadir
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

    public function categories()
{
    return $this->hasMany(Category::class);
}

public function transactions()
{
    return $this->hasMany(Transaction::class);
}

    public function esAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function tickets()
{
    return $this->hasMany(Ticket::class);
}
public function reminderCategories()
{
    return $this->hasMany(ReminderCategory::class);
}
public function testimonio()
{
    return $this->hasOne(Testimonio::class);
}
public function recurringPayments()
{
    return $this->hasMany(RecurringPayment::class);
}
}