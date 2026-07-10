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

    public function user()     { return $this->belongsTo(User::class); }
    public function account()  { return $this->belongsTo(Account::class); }
    public function category() { return $this->belongsTo(ReminderCategory::class, 'reminder_category_id'); }
    public function logs()     { return $this->hasMany(RecurringPaymentLog::class); }

    // Calcula la siguiente fecha según frecuencia. Null si no aplica (once) o frecuencia inválida.
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

    /**
     * Sincroniza los logs pendientes: genera todo lo que falte desde el último
     * registro hasta hoy (según timezone del usuario), sin necesidad de cron.
     * También actualiza next_reminder_date para reflejar el próximo recordatorio real.
     */
    public function syncPendingLogs(string $tz): void
    {
        if ($this->status !== 'active') {
            return;
        }

        $today = now($tz)->toDateString();

        // ── Caso "Una vez" ──────────────────────────────────────────────────
        if ($this->frequency === 'once') {
            if ($this->logs()->count() === 0) {
                RecurringPaymentLog::create([
                    'recurring_payment_id' => $this->id,
                    'scheduled_date'       => $this->start_date->toDateString(),
                    'status'               => 'pending',
                ]);
            }
            return;
        }

        // ── Caso recurrente ──────────────────────────────────────────────────
        $lastLog  = $this->logs()->orderByDesc('scheduled_date')->first();
        $cursor   = $lastLog
            ? Carbon::parse($lastLog->scheduled_date->toDateString())
            : null;

        if (!$cursor) {
            // No hay ningún log todavía: crear el primero en start_date
            RecurringPaymentLog::create([
                'recurring_payment_id' => $this->id,
                'scheduled_date'       => $this->start_date->toDateString(),
                'status'               => 'pending',
            ]);
            $cursor = Carbon::parse($this->start_date->toDateString());
        }

        // Generar backlog hasta "hoy" (o hasta end_date si se cumple antes)
        $guard = 0;
        while ($guard < 3650) { // límite de seguridad (~10 años)
            $next = self::calcNextDate($cursor->toDateString(), $this->frequency);
            if (!$next) break;

            if ($this->end_date && $next->gt($this->end_date)) {
                // Se acabó el ciclo: pausar
                $this->update(['status' => 'paused']);
                break;
            }

            if ($next->toDateString() > $today) break; // no generar fechas futuras

            RecurringPaymentLog::firstOrCreate(
                [
                    'recurring_payment_id' => $this->id,
                    'scheduled_date'       => $next->toDateString(),
                ],
                ['status' => 'pending']
            );

            $cursor = $next;
            $guard++;
        }

        $this->refresh();
        if ($this->status !== 'active') return; // se pausó arriba

        // Actualizar next_reminder_date para reflejar el estado real:
        // el pendiente más antiguo si existe, o el próximo futuro calculado
        $oldestPending = $this->logs()->where('status', 'pending')->orderBy('scheduled_date')->first();

        if ($oldestPending) {
            $this->update(['next_reminder_date' => $oldestPending->scheduled_date->toDateString()]);
        } else {
            $future = self::calcNextDate($cursor->toDateString(), $this->frequency);
            if ($future && (!$this->end_date || $future->lte($this->end_date))) {
                $this->update(['next_reminder_date' => $future->toDateString()]);
            }
        }
    }
}