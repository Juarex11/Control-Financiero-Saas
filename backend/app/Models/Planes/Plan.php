<?php

namespace App\Models\Planes;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name', 'photo', 'description', 'is_active', 'order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order'     => 'integer',
    ];

    public function prices()
    {
        return $this->hasMany(PlanPrice::class);
    }

    public function modules()
    {
        return $this->hasMany(PlanModule::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    // Cantidad de usuarios suscritos actualmente (activos o en trial)
    public function getSubscribersCountAttribute(): int
    {
        return $this->subscriptions()->whereIn('status', ['trial', 'active'])->count();
    }

    // ¿Este plan desbloquea tal módulo?
    public function hasModule(string $key): bool
    {
        return $this->modules->pluck('module_key')->contains($key);
    }
}