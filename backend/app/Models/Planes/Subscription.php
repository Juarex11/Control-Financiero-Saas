<?php

namespace App\Models\Planes;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Subscription extends Model
{
    protected $fillable = [
        'user_id', 'plan_id', 'modalidad', 'starts_at', 'ends_at', 'status',
    ];

    protected $casts = [
        'starts_at' => 'date',
        'ends_at'   => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function getIsVigenteAttribute(): bool
    {
        return in_array($this->status, ['trial', 'active']) && $this->ends_at >= now()->toDateString();
    }
}