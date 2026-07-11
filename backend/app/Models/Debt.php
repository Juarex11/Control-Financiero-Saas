<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Debt extends Model
{
    protected $fillable = [
        'user_id', 'name', 'icon', 'color',
        'total_amount', 'paid_amount', 'start_date', 'due_date',
        'note', 'status', 'order',
    ];

    protected $casts = [
        'total_amount' => 'float',
        'paid_amount'  => 'float',
        'start_date'   => 'date',
        'due_date'     => 'date',
        'order'        => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function getRemainingAttribute(): float
    {
        return max(0, $this->total_amount - $this->paid_amount);
    }

    public function getProgressAttribute(): float
    {
        if ($this->total_amount <= 0) return 0;
        return round(min(100, ($this->paid_amount / $this->total_amount) * 100), 1);
    }
}