<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class RecurringPayment extends Model
{
    protected $fillable = [
        'user_id', 'account_id', 'reminder_category_id',
        'type', 'name', 'amount', 'currency',
        'frequency', 'start_date', 'end_date',
        'next_reminder_date', 'reminder_time',
        'label', 'comment', 'status',
    ];

    protected $casts = [
        'amount'             => 'float',
        'start_date'         => 'date',
        'end_date'           => 'date',
        'next_reminder_date' => 'date',
    ];

    public function user()         { return $this->belongsTo(User::class); }
    public function account()      { return $this->belongsTo(Account::class); }
    public function category()     { return $this->belongsTo(ReminderCategory::class, 'reminder_category_id'); }
    public function logs()         { return $this->hasMany(RecurringPaymentLog::class); }

    // Calcula la siguiente fecha según frecuencia
    public static function calcNextDate(string $from, string $frequency): ?Carbon
    {
        $date = Carbon::parse($from);
        return match ($frequency) {
            'once'        => null,
            'daily'       => $date->addDay(),
            'weekly'      => $date->addWeek(),
            'biweekly'    => $date->addWeeks(2),
            'every4weeks' => $date->addWeeks(4),
            'monthly'     => $date->addMonth(),
            'bimonthly'   => $date->addMonths(2),
            'quarterly'   => $date->addMonths(3),
            'semiannual'  => $date->addMonths(6),
            default       => null,
        };
    }
}