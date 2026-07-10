<?php

namespace App\Http\Controllers;

use App\Helpers\TimezoneHelper;
use App\Models\RecurringPayment;
use App\Models\RecurringPaymentLog;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecurringPaymentController extends Controller
{
    // ── Listar ────────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $user = $request->user();
        $tz   = TimezoneHelper::resolve($user->timezone, $user->pais);

        $payments = $user->recurringPayments()
            ->with(['account', 'category'])
            ->get();

        // Sincronizar cada pago activo (genera backlog pendiente si falta)
        foreach ($payments as $p) {
            if ($p->status === 'active') {
                $p->syncPendingLogs($tz);
            }
        }

        $payments = $user->recurringPayments()
            ->with(['account', 'category'])
            ->withCount(['logs as pending_count' => fn($q) => $q->where('status', 'pending')])
            ->orderBy('next_reminder_date')
            ->get();

        return response()->json($payments);
    }

    // ── Crear ─────────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'account_id'           => 'required|integer|min:1|exists:accounts,id',
            'reminder_category_id' => 'nullable|integer',
            'type'                 => 'required|in:income,expense',
            'name'                 => 'required|string|max:120',
            'amount'               => 'required|numeric|min:0.01',
            'frequency'            => 'required|in:once,daily,weekly,biweekly,every4weeks,monthly,bimonthly,quarterly,semiannual',
            'start_date'           => 'required|date',
            'end_date'             => 'nullable|date|after:start_date',
            'reminder_time'        => 'nullable|date_format:H:i,H:i:s',
            'label'                => 'nullable|string|max:80',
            'comment'              => 'nullable|string',
        ]);

        $user    = $request->user();
        $account = \App\Models\Account::findOrFail($data['account_id']);
        abort_if($account->user_id !== $user->id, 403);

        $data['user_id']            = $user->id;
        $data['currency']           = $account->currency;
        $data['next_reminder_date'] = $data['start_date'];
        $data['reminder_time']      = $data['reminder_time'] ?? '08:00';
        $data['status']             = 'active';

        $payment = RecurringPayment::create($data);

        RecurringPaymentLog::create([
            'recurring_payment_id' => $payment->id,
            'scheduled_date'       => $payment->start_date,
            'status'               => 'pending',
        ]);

        return response()->json($payment->load(['account', 'category']), 201);
    }

    // ── Actualizar ────────────────────────────────────────────────────────────
    public function update(Request $request, RecurringPayment $recurringPayment)
    {
        abort_if($recurringPayment->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'name'                 => 'nullable|string|max:120',
            'amount'               => 'nullable|numeric|min:0.01',
            'frequency'            => 'nullable|in:once,daily,weekly,biweekly,every4weeks,monthly,bimonthly,quarterly,semiannual',
            'start_date'           => 'nullable|date',
            'end_date'             => 'nullable|date',
            'reminder_time'        => 'nullable|date_format:H:i,H:i:s',
            'reminder_category_id' => 'nullable|integer',
            'label'                => 'nullable|string|max:80',
            'comment'              => 'nullable|string',
            'account_id'           => 'nullable|integer|min:1|exists:accounts,id',
        ]);

        if (isset($data['account_id'])) {
            $account = \App\Models\Account::findOrFail($data['account_id']);
            abort_if($account->user_id !== $request->user()->id, 403);
        }

        // Solo se considera "reprogramación" si la fecha REALMENTE cambió
        // respecto a la que ya tenía (no solo porque el campo vino en el body,
        // ya que el formulario del frontend siempre manda start_date aunque no se toque)
        $fechaVieja    = $recurringPayment->start_date->toDateString();
        $fechaNueva    = isset($data['start_date']) ? $data['start_date'] : $fechaVieja;
        $seReprogramo  = $fechaNueva !== $fechaVieja;

        if ($seReprogramo) {
            $data['next_reminder_date'] = $data['start_date'];
            $data['status'] = 'active';

            // Limpiar logs pendientes viejos: ya no aplican con la nueva fecha
            $recurringPayment->logs()->where('status', 'pending')->delete();
        }

        $recurringPayment->update(array_filter($data, fn($v) => !is_null($v)));

        // Si se reprogramó de verdad, asegurar que exista el log pendiente en la nueva fecha
        // (status incluido en la búsqueda para no reutilizar un log viejo ya confirmado)
        if ($seReprogramo) {
            RecurringPaymentLog::firstOrCreate([
                'recurring_payment_id' => $recurringPayment->id,
                'scheduled_date'       => $recurringPayment->start_date->toDateString(),
                'status'               => 'pending',
            ]);
        }

        return response()->json($recurringPayment->fresh()->load(['account', 'category']));
    }

    // ── Eliminar ──────────────────────────────────────────────────────────────
    public function destroy(Request $request, RecurringPayment $recurringPayment)
    {
        abort_if($recurringPayment->user_id !== $request->user()->id, 403);
        $recurringPayment->delete();
        return response()->json(['message' => 'Pago eliminado.']);
    }

    // ── Pausar / Reactivar ────────────────────────────────────────────────────
    public function toggleStatus(Request $request, RecurringPayment $recurringPayment)
    {
        abort_if($recurringPayment->user_id !== $request->user()->id, 403);

        $user = $request->user();
        $tz   = TimezoneHelper::resolve($user->timezone, $user->pais);

        if ($recurringPayment->status === 'active') {
            // Pausar: simple
            $recurringPayment->update(['status' => 'paused']);
        } else {
            // Reactivar: si la fecha de referencia quedó en el pasado, reprogramar a hoy
            $today   = now($tz)->toDateString();
            $refDate = $recurringPayment->next_reminder_date?->toDateString() ?? $today;

            DB::transaction(function () use ($recurringPayment, $today, $refDate) {
                if ($refDate < $today) {
                    $recurringPayment->update([
                        'status'             => 'active',
                        'start_date'         => $today,
                        'next_reminder_date' => $today,
                    ]);
                    // Los pendientes viejos ya no aplican
                    $recurringPayment->logs()->where('status', 'pending')->delete();
                } else {
                    $recurringPayment->update(['status' => 'active']);
                }

                // Asegurar que exista un log pendiente en la fecha vigente
                // (status incluido en la búsqueda para no reutilizar un log viejo ya confirmado)
                RecurringPaymentLog::firstOrCreate([
                    'recurring_payment_id' => $recurringPayment->id,
                    'scheduled_date'       => $recurringPayment->fresh()->next_reminder_date->toDateString(),
                    'status'               => 'pending',
                ]);
            });
        }

        return response()->json($recurringPayment->fresh());
    }

    // ── Marcar pagado / saltado ───────────────────────────────────────────────
    public function markLog(Request $request, RecurringPayment $recurringPayment)
    {
        abort_if($recurringPayment->user_id !== $request->user()->id, 403);

        $request->validate([
            'log_id' => 'required|integer',
            'status' => 'required|in:paid,skipped',
            'note'   => 'nullable|string',
        ]);

        $log = RecurringPaymentLog::where('id', $request->log_id)
            ->where('recurring_payment_id', $recurringPayment->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $user = $request->user();
        $tz   = TimezoneHelper::resolve($user->timezone, $user->pais);

        DB::transaction(function () use ($request, $recurringPayment, $log, $tz) {

            $log->update([
                'status'      => $request->status,
                'actioned_at' => now(),
                'note'        => $request->note,
            ]);

            // Si confirmó "Sí" (pagado) → crear transacción real y afectar saldo
            if ($request->status === 'paid') {

                $categoryId = null;
                if ($recurringPayment->reminder_category_id && $recurringPayment->category) {
                    $reminderCategory = $recurringPayment->category;
                    $categoryId = \App\Models\Category::firstOrCreate(
                        ['user_id' => $recurringPayment->user_id, 'name' => $reminderCategory->name],
                        ['color' => $reminderCategory->color]
                    )->id;
                }

                Transaction::create([
                    'user_id'                  => $recurringPayment->user_id,
                    'account_id'                => $recurringPayment->account_id,
                    'category_id'                => $categoryId,
                    'transfer_account_id'       => null,
                    'type'                        => $recurringPayment->type,
                    'amount'                      => $recurringPayment->amount,
                    'note'                        => $recurringPayment->name,
                    'date'                        => now($tz)->toDateString(),
                    'recurring_payment_log_id'  => $log->id,
                ]);

                $delta = $recurringPayment->type === 'income'
                    ? $recurringPayment->amount
                    : -$recurringPayment->amount;

                $recurringPayment->account()->increment('balance', $delta);
            }

            // Cerrar ciclo o continuar según frecuencia
            if ($recurringPayment->frequency === 'once') {
                $recurringPayment->update(['status' => 'paused']);
            } else {
                // Sincronizar: genera el siguiente pendiente si corresponde
                $recurringPayment->syncPendingLogs($tz);
            }
        });

        return response()->json(['message' => 'Actualizado.', 'log' => $log->fresh()]);
    }

    // ── Historial de logs ─────────────────────────────────────────────────────
    public function logs(Request $request, RecurringPayment $recurringPayment)
    {
        abort_if($recurringPayment->user_id !== $request->user()->id, 403);

        $user = $request->user();
        $tz   = TimezoneHelper::resolve($user->timezone, $user->pais);

        if ($recurringPayment->status === 'active') {
            $recurringPayment->syncPendingLogs($tz);
        }

        $logs = $recurringPayment->logs()
            ->orderByDesc('scheduled_date')
            ->get();

        return response()->json($logs);
    }

    // ── Notificaciones pendientes (campana) ───────────────────────────────────
    public function notifications(Request $request)
    {
        $user = $request->user();
        $tz   = TimezoneHelper::resolve($user->timezone, $user->pais);

        $ahoraUsuario = now($tz);
        $hoy          = $ahoraUsuario->toDateString();

        // Sincronizar todos los pagos activos del usuario antes de listar
        $pagosActivos = $user->recurringPayments()->where('status', 'active')->get();
        foreach ($pagosActivos as $p) {
            $p->syncPendingLogs($tz);
        }

        // Incluye tanto lo ya vencido como lo que vence hoy (sin importar la hora aún)
        $pendientes = RecurringPaymentLog::whereHas('recurringPayment', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id)->where('status', 'active');
            })
            ->where('status', 'pending')
            ->where('scheduled_date', '<=', $hoy)
            ->with('recurringPayment.account')
            ->orderBy('scheduled_date')
            ->get();

        return response()->json($pendientes);
    }
}