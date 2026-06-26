<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReminderCategory extends Model
{
    protected $fillable = [
        'user_id', 'name', 'color', 'icon', 'is_default', 'order',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'order'      => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function recurringPayments()
    {
        return $this->hasMany(RecurringPayment::class);
    }
}