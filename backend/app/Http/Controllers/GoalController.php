<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Goal;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GoalController extends Controller
{
    // ── Listar metas del usuario ──────────────────────────────────────────────
    public function index(Request $request)
    {
        $goals = $request->user()->goals()->orderBy('order')->get();
        return response()->json($goals);
    }

    // ── Crear meta ─────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $request->validate([
            'name'          => 'required|string|max:100',
            'icon'          => 'nullable|string|max:50',
            'color'         => 'nullable|string|max:7',
            'target_amount' => 'required|numeric|min:0.01',
            'deadline'      => 'nullable|date',
            'note'          => 'nullable|string|max:255',
        ]);

        $user  = $request->user();
        $order = $user->goals()->max('order') + 1;

        $goal = Goal::create([
            'user_id'        => $user->id,
            'name'           => $request->name,
            'icon'           => $request->icon  ?? 'target',
            'color'          => $request->color ?? '#31138b',
            'target_amount'  => $request->target_amount,
            'current_amount' => 0,
            'deadline'       => $request->deadline,
            'note'           => $request->note,
            'order'          => $order,
        ]);

        return response()->json([
            'message' => 'Meta creada.',
            'goal'    => $goal,
        ], 201);
    }

    // ── Ver detalle (con historial de abonos) ────────────────────────────────
    public function show(Request $request, Goal $goal)
    {
        abort_if($goal->user_id !== $request->user()->id, 403);

        $goal->load(['transactions' => fn($q) => $q->orderByDesc('date')->orderByDesc('id')]);

        return response()->json($goal);
    }

    // ── Actualizar meta ───────────────────────────────────────────────────────
    public function update(Request $request, Goal $goal)
    {
        abort_if($goal->user_id !== $request->user()->id, 403);

        $request->validate([
            'name'          => 'nullable|string|max:100',
            'icon'          => 'nullable|string|max:50',
            'color'         => 'nullable|string|max:7',
            'target_amount' => 'nullable|numeric|min:0.01',
            'deadline'      => 'nullable|date',
            'note'          => 'nullable|string|max:255',
        ]);

        $updateData = [];
        if ($request->filled('name'))          $updateData['name']          = $request->name;
        if ($request->filled('icon'))          $updateData['icon']          = $request->icon;
        if ($request->filled('color'))         $updateData['color']         = $request->color;
        if ($request->filled('target_amount')) $updateData['target_amount'] = $request->target_amount;
        if ($request->has('deadline'))         $updateData['deadline']      = $request->deadline;
        if ($request->has('note'))             $updateData['note']          = $request->note;

        $goal->update($updateData);
        $goal->refresh();

        return response()->json([
            'message' => 'Meta actualizada.',
            'goal'    => $goal,
        ]);
    }

    // ── Eliminar meta ─────────────────────────────────────────────────────────
    public function destroy(Request $request, Goal $goal)
    {
        abort_if($goal->user_id !== $request->user()->id, 403);

        DB::transaction(function () use ($goal) {
            // Revertir cada abono: devolver el dinero a la cuenta de origen
            foreach ($goal->transactions as $t) {
                $t->account?->increment('balance', $t->amount);
                $t->delete();
            }
            $goal->delete();
        });

        return response()->json(['message' => 'Meta eliminada. Los abonos se devolvieron a las cuentas de origen.']);
    }

    // ── Abonar dinero a la meta ───────────────────────────────────────────────
    public function abonar(Request $request, Goal $goal)
    {
        abort_if($goal->user_id !== $request->user()->id, 403);

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

        $transaction = DB::transaction(function () use ($data, $user, $account, $goal) {
            $account->decrement('balance', $data['amount']);

            $transaction = Transaction::create([
                'user_id'    => $user->id,
                'account_id' => $account->id,
                'goal_id'    => $goal->id,
                'type'       => 'expense',
                'amount'     => $data['amount'],
                'note'       => $data['note'] ?? "Abono a meta: {$goal->name}",
                'date'       => $data['date'],
            ]);

            $goal->increment('current_amount', $data['amount']);

            if ($goal->current_amount >= $goal->target_amount) {
                $goal->update(['status' => 'completada']);
            }

            return $transaction;
        });

        return response()->json([
            'message'     => 'Abono registrado.',
            'goal'        => $goal->fresh(),
            'transaction' => $transaction->load('category'),
        ], 201);
    }
}