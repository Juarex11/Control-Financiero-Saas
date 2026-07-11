<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Debt;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DebtController extends Controller
{
    // ── Listar deudas del usuario ─────────────────────────────────────────────
    public function index(Request $request)
    {
        $debts = $request->user()->debts()->orderBy('order')->get();
        return response()->json($debts);
    }

    // ── Crear deuda ────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:100',
            'icon'         => 'nullable|string|max:50',
            'color'        => 'nullable|string|max:7',
            'total_amount' => 'required|numeric|min:0.01',
            'start_date'   => 'nullable|date',
            'due_date'     => 'nullable|date',
            'note'         => 'nullable|string|max:255',
        ]);

        $user  = $request->user();
        $order = $user->debts()->max('order') + 1;

        $debt = Debt::create([
            'user_id'      => $user->id,
            'name'         => $request->name,
            'icon'         => $request->icon  ?? 'credit-card',
            'color'        => $request->color ?? '#31138b',
            'total_amount' => $request->total_amount,
            'paid_amount'  => 0,
            'start_date'   => $request->start_date,
            'due_date'     => $request->due_date,
            'note'         => $request->note,
            'order'        => $order,
        ]);

        return response()->json([
            'message' => 'Deuda creada.',
            'debt'    => $debt,
        ], 201);
    }

    // ── Ver detalle (con historial de pagos) ─────────────────────────────────
    public function show(Request $request, Debt $debt)
    {
        abort_if($debt->user_id !== $request->user()->id, 403);

        $debt->load(['transactions' => fn($q) => $q->orderByDesc('date')->orderByDesc('id')]);

        return response()->json($debt);
    }

    // ── Actualizar deuda ──────────────────────────────────────────────────────
    public function update(Request $request, Debt $debt)
    {
        abort_if($debt->user_id !== $request->user()->id, 403);

        $request->validate([
            'name'         => 'nullable|string|max:100',
            'icon'         => 'nullable|string|max:50',
            'color'        => 'nullable|string|max:7',
            'total_amount' => 'nullable|numeric|min:0.01',
            'start_date'   => 'nullable|date',
            'due_date'     => 'nullable|date',
            'note'         => 'nullable|string|max:255',
        ]);

        $updateData = [];
        if ($request->filled('name'))         $updateData['name']         = $request->name;
        if ($request->filled('icon'))         $updateData['icon']         = $request->icon;
        if ($request->filled('color'))        $updateData['color']        = $request->color;
        if ($request->filled('total_amount')) $updateData['total_amount'] = $request->total_amount;
        if ($request->has('start_date'))      $updateData['start_date']   = $request->start_date;
        if ($request->has('due_date'))        $updateData['due_date']     = $request->due_date;
        if ($request->has('note'))            $updateData['note']         = $request->note;

        $debt->update($updateData);
        $debt->refresh();

        return response()->json([
            'message' => 'Deuda actualizada.',
            'debt'    => $debt,
        ]);
    }

    // ── Eliminar deuda ────────────────────────────────────────────────────────
    public function destroy(Request $request, Debt $debt)
    {
        abort_if($debt->user_id !== $request->user()->id, 403);

        DB::transaction(function () use ($debt) {
            foreach ($debt->transactions as $t) {
                $t->account?->increment('balance', $t->amount);
                $t->delete();
            }
            $debt->delete();
        });

        return response()->json(['message' => 'Deuda eliminada. Los pagos se devolvieron a las cuentas de origen.']);
    }

    // ── Registrar un pago de la deuda ─────────────────────────────────────────
    public function pagar(Request $request, Debt $debt)
    {
        abort_if($debt->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'account_id' => 'required|integer',
            'amount'     => 'required|numeric|min:0.01',
            'date'       => 'required|date',
            'note'       => 'nullable|string|max:255',
        ]);

        $user    = $request->user();
        $account = Account::findOrFail($data['account_id']);
        abort_if($account->user_id !== $user->id, 403);

        if ($account->balance < $data['amount']) {
            return response()->json(['message' => 'Saldo insuficiente en la cuenta seleccionada.'], 422);
        }

        if ($data['amount'] > $debt->remaining) {
            return response()->json(['message' => 'El monto supera lo que falta pagar de la deuda.'], 422);
        }

        $transaction = DB::transaction(function () use ($data, $user, $account, $debt) {
            $account->decrement('balance', $data['amount']);

            $transaction = Transaction::create([
                'user_id'    => $user->id,
                'account_id' => $account->id,
                'debt_id'    => $debt->id,
                'type'       => 'expense',
                'amount'     => $data['amount'],
                'note'       => $data['note'] ?? "Pago de deuda: {$debt->name}",
                'date'       => $data['date'],
            ]);

            $debt->increment('paid_amount', $data['amount']);

            if ($debt->paid_amount >= $debt->total_amount) {
                $debt->update(['status' => 'pagada']);
            }

            return $transaction;
        });

        return response()->json([
            'message'     => 'Pago registrado.',
            'debt'        => $debt->fresh(),
            'transaction' => $transaction->load('category'),
        ], 201);
    }
}