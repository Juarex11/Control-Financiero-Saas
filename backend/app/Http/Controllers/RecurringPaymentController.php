<?php

namespace App\Http\Controllers;

use App\Models\RecurringPayment;
use App\Models\RecurringPaymentLog;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RecurringPaymentController extends Controller
{
    // ── Listar ────────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $payments = $request->user()
            ->recurringPayments()
            ->with(['account', 'category'])
            ->orderBy('next_reminder_date')
            ->get();

        return response()->json($payments);
    }

    // ── Crear ─────────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'account_id'           => 'required|integer',
            'reminder_category_id' => 'nullable|integer',
            'type'                 => 'required|in:income,expense',
            'name'                 => 'required|string|max:120',
            'amount'               => 'required|numeric|min:0.01',
            'frequency'            => 'required|in:once,daily,weekly,biweekly,every4weeks,monthly,bimonthly,quarterly,semiannual',
            'start_date'           => 'required|date',
            'end_date'             => 'nullable|date|after:start_date',
            'reminder_time'        => 'nullable|date_format:H:i',
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

        $payment = RecurringPayment::create($data);

        // Crear primer log pendiente
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
            'reminder_time'        => 'nullable|date_format:H:i',
            'reminder_category_id' => 'nullable|integer',
            'label'                => 'nullable|string|max:80',
            'comment'              => 'nullable|string',
            'account_id'           => 'nullable|integer',
        ]);

        $recurringPayment->update(array_filter($data, fn($v) => !is_null($v)));
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

        $recurringPayment->update([
            'status' => $recurringPayment->status === 'active' ? 'paused' : 'active',
        ]);

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
            ->firstOrFail();

        $log->update([
            'status'      => $request->status,
            'actioned_at' => now(),
            'note'        => $request->note,
        ]);

        // Calcular siguiente fecha y crear nuevo log si no es 'once'
        if ($recurringPayment->frequency !== 'once') {
            $next = RecurringPayment::calcNextDate(
                $recurringPayment->next_reminder_date->toDateString(),
                $recurringPayment->frequency
            );

            if ($next && (!$recurringPayment->end_date || $next->lte($recurringPayment->end_date))) {
                $recurringPayment->update(['next_reminder_date' => $next->toDateString()]);
                RecurringPaymentLog::create([
                    'recurring_payment_id' => $recurringPayment->id,
                    'scheduled_date'       => $next->toDateString(),
                    'status'               => 'pending',
                ]);
            } else {
                // Ciclo terminado
                $recurringPayment->update(['status' => 'paused']);
            }
        }

        return response()->json(['message' => 'Actualizado.', 'log' => $log->fresh()]);
    }

    // ── Historial de logs ─────────────────────────────────────────────────────
    public function logs(Request $request, RecurringPayment $recurringPayment)
    {
        abort_if($recurringPayment->user_id !== $request->user()->id, 403);

        $logs = $recurringPayment->logs()
            ->orderByDesc('scheduled_date')
            ->get();

        return response()->json($logs);
    }

    // ── Notificaciones pendientes (campana) ───────────────────────────────────
    public function notifications(Request $request)
    {
        $hoy = now()->toDateString();

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