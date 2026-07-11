<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Goal extends Model
{
    protected $fillable = [
        'user_id', 'name', 'icon', 'color',
        'target_amount', 'current_amount', 'deadline',
        'note', 'status', 'order',
    ];

    protected $casts = [
        'target_amount'  => 'float',
        'current_amount' => 'float',
        'deadline'       => 'date',
        'order'          => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function getProgressAttribute(): float
    {
        if ($this->target_amount <= 0) return 0;
        return round(min(100, ($this->current_amount / $this->target_amount) * 100), 1);
    }
}