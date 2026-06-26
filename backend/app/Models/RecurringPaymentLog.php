<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecurringPaymentLog extends Model
{
    protected $fillable = [
        'recurring_payment_id', 'scheduled_date', 'status', 'actioned_at', 'note',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'actioned_at'    => 'datetime',
    ];

    public function recurringPayment()
    {
        return $this->belongsTo(RecurringPayment::class);
    }
}