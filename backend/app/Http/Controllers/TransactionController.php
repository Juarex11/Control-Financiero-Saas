<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    // ── Historial paginado por cuenta ─────────────────────────────────────────
    public function index(Request $request)
    {
        $request->validate([
            'account_id' => 'required|integer',
            'page'       => 'nullable|integer|min:1',
            'per_page'   => 'nullable|integer|min:1|max:100',
        ]);

        $account = Account::findOrFail($request->account_id);
        abort_if($account->user_id !== $request->user()->id, 403);

        $transactions = Transaction::with('category')
            ->where('account_id', $account->id)
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate($request->per_page ?? 20);

        return response()->json($transactions);
    }

    // ── Crear transacción ─────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'account_id'          => 'required|integer',
            'category_id'         => 'nullable|integer',
            'transfer_account_id' => 'nullable|integer|different:account_id',
            'type'                => 'required|in:income,expense,transfer',
            'amount'              => 'required|numeric|min:0.01',
            'note'                => 'nullable|string|max:255',
            'date'                => 'required|date',
        ]);

        $user    = $request->user();
        $account = Account::findOrFail($data['account_id']);
        abort_if($account->user_id !== $user->id, 403);

        DB::transaction(function () use ($data, $user, $account, $request) {
            $data['user_id'] = $user->id;

            $transaction = Transaction::create($data);

            // Actualizar balance de la cuenta origen
            if ($data['type'] === 'income') {
                $account->increment('balance', $data['amount']);
            } elseif ($data['type'] === 'expense') {
                $account->decrement('balance', $data['amount']);
            } elseif ($data['type'] === 'transfer') {
                $destino = Account::findOrFail($data['transfer_account_id']);
                abort_if($destino->user_id !== $user->id, 403);

                $account->decrement('balance', $data['amount']);
                $destino->increment('balance', $data['amount']);
            }

            $this->lastTransaction = $transaction->load('category');
        });

        return response()->json($this->lastTransaction, 201);
    }

    // ── Eliminar transacción (revierte el balance) ────────────────────────────
public function destroy(Request $request, Transaction $transaction)
{
    abort_if($transaction->user_id !== $request->user()->id, 403);

    DB::transaction(function () use ($transaction) {
        $account = $transaction->account;

        if ($transaction->type === 'income') {
            $account->decrement('balance', $transaction->amount);
        } elseif ($transaction->type === 'expense') {
            $account->increment('balance', $transaction->amount);
        } elseif ($transaction->type === 'transfer') {
            $account->increment('balance', $transaction->amount);
            $transaction->transferAccount?->decrement('balance', $transaction->amount);
        }

        // Revertir progreso si venía de una Meta
        if ($transaction->goal_id) {
            $transaction->goal?->decrement('current_amount', $transaction->amount);
            $transaction->goal?->update(['status' => 'activa']);
        }

        // Revertir progreso si venía de una Deuda
        if ($transaction->debt_id) {
            $transaction->debt?->decrement('paid_amount', $transaction->amount);
            $transaction->debt?->update(['status' => 'activa']);
        }

        $transaction->delete();
    });

    return response()->json(['message' => 'Transacción eliminada.']);
}

    // ── Stats para el dashboard (donuts) ──────────────────────────────────────
    public function stats(Request $request)
    {
        $request->validate([
            'account_id' => 'required|integer',
            'filtro'     => 'required|in:dia,semana,mes,periodo',
            'dia'        => 'nullable|date',
            'semana_ref' => 'nullable|date',
            'mes'        => 'nullable|integer|min:1|max:12',
            'anio'       => 'nullable|integer|min:2000',
            'desde'      => 'nullable|date',
            'hasta'      => 'nullable|date',
        ]);

        $account = Account::findOrFail($request->account_id);
        abort_if($account->user_id !== $request->user()->id, 403);

        [$desde, $hasta] = $this->resolverRango($request);

      $rows = Transaction::with(['category', 'goal', 'debt'])
    ->where('account_id', $account->id)
            ->whereIn('type', ['income', 'expense'])
            ->whereBetween('date', [$desde, $hasta])
            ->get();

        $gastos   = $this->agruparPorCategoria($rows->where('type', 'expense'));
        $ingresos = $this->agruparPorCategoria($rows->where('type', 'income'));

        return response()->json(compact('gastos', 'ingresos'));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private function resolverRango(Request $request): array
    {
        $hoy = now()->toDateString();

        return match ($request->filtro) {
            'dia' => [
                $request->dia ?? $hoy,
                $request->dia ?? $hoy,
            ],
            'semana' => (function () use ($request) {
                $ref = new \DateTime($request->semana_ref ?? now()->toDateString());
                $dow = (int)$ref->format('N'); // 1=lun … 7=dom
                $lun = (clone $ref)->modify("-" . ($dow - 1) . " days");
                $dom = (clone $lun)->modify('+6 days');
                return [$lun->format('Y-m-d'), $dom->format('Y-m-d')];
            })(),
            'mes' => [
                sprintf('%04d-%02d-01', $request->anio ?? now()->year, $request->mes ?? now()->month),
                sprintf('%04d-%02d-%02d',
                    $request->anio ?? now()->year,
                    $request->mes ?? now()->month,
                    cal_days_in_month(CAL_GREGORIAN, $request->mes ?? now()->month, $request->anio ?? now()->year)
                ),
            ],
            'periodo' => [
                $request->desde ?? $hoy,
                $request->hasta ?? $hoy,
            ],
        };
    }

  private function agruparPorCategoria($transactions): array
{
    return $transactions
        ->groupBy(function ($t) {
            if ($t->category_id) return 'cat_'  . $t->category_id;
            if ($t->goal_id)     return 'goal_' . $t->goal_id;
            if ($t->debt_id)     return 'debt_' . $t->debt_id;
            return 'sin_categoria';
        })
        ->map(function ($group) {
            $t = $group->first();

            if ($t->category) {
                return [
                    'name'  => $t->category->name,
                    'value' => $group->sum('amount'),
                    'color' => $t->category->color ?? '#64748b',
                    'icon'  => $t->category->icon  ?? 'tag',
                ];
            }
            if ($t->goal) {
                return [
                    'name'  => $t->goal->name,
                    'value' => $group->sum('amount'),
                    'color' => $t->goal->color ?? '#31138b',
                    'icon'  => 'target',
                ];
            }
            if ($t->debt) {
                return [
                    'name'  => $t->debt->name,
                    'value' => $group->sum('amount'),
                    'color' => $t->debt->color ?? '#31138b',
                    'icon'  => 'credit-card',
                ];
            }
            return [
                'name'  => 'Sin categoría',
                'value' => $group->sum('amount'),
                'color' => '#64748b',
                'icon'  => 'tag',
            ];
        })
        ->values()
        ->toArray();
}
// Historial paginado con filtros de fecha
// Historial paginado con filtros de fecha
public function history(Request $request)
{
    $request->validate([
        'account_id' => 'required|integer',
        'filtro'     => 'required|in:dia,semana,mes,periodo',
        'dia'        => 'nullable|date',
        'semana_ref' => 'nullable|date',
        'mes'        => 'nullable|integer|min:1|max:12',
        'anio'       => 'nullable|integer',
        'desde'      => 'nullable|date',
        'hasta'      => 'nullable|date',
    ]);

    $account = Account::findOrFail($request->account_id);
    abort_if($account->user_id !== $request->user()->id, 403);

    [$desde, $hasta] = $this->resolverRango($request);

    $timezone = $request->user()->timezone ?? 'America/Costa_Rica';

   $transactions = Transaction::with(['category', 'goal', 'debt'])
    ->where('account_id', $account->id)
        ->whereBetween('date', [$desde, $hasta])
        ->orderByDesc('date')
        ->orderByDesc('id')
        ->get()
        ->each(function ($t) use ($timezone) {
            $t->hora = $this->formatHora($t->created_at, $timezone);
        })
        ->groupBy(fn($t) => $t->date->format('Y-m-d'));

    return response()->json($transactions);
}

// Formatea un timestamp UTC a la hora local del usuario, estilo "3:45 p. m."
private function formatHora($createdAt, string $timezone): string
{
    $local  = $createdAt->copy()->timezone($timezone);
    $hora   = $local->format('g');
    $minuto = $local->format('i');
    $ampm   = $local->format('A') === 'AM' ? 'a. m.' : 'p. m.';

    return "{$hora}:{$minuto} {$ampm}";
}

// Comparativa mes actual vs mes anterior
public function compare(Request $request)
{
    $request->validate([
        'account_id' => 'required|integer',
        'mes'        => 'required|integer|min:1|max:12',
        'anio'       => 'required|integer',
    ]);

    $account = Account::findOrFail($request->account_id);
    abort_if($account->user_id !== $request->user()->id, 403);

    $calcular = function ($mes, $anio) use ($account) {
        $desde = sprintf('%04d-%02d-01', $anio, $mes);
        $hasta = sprintf('%04d-%02d-%02d', $anio, $mes,
            cal_days_in_month(CAL_GREGORIAN, $mes, $anio));

        $rows = Transaction::where('account_id', $account->id)
            ->whereIn('type', ['income','expense'])
            ->whereBetween('date', [$desde, $hasta])
            ->get();

        return [
            'ingresos' => $rows->where('type','income')->sum('amount'),
            'gastos'   => $rows->where('type','expense')->sum('amount'),
            'balance'  => $rows->where('type','income')->sum('amount') - $rows->where('type','expense')->sum('amount'),
        ];
    };

    $mesAnterior = $request->mes - 1 < 1 ? 12 : $request->mes - 1;
    $anioAnterior = $request->mes - 1 < 1 ? $request->anio - 1 : $request->anio;

    return response()->json([
        'actual'   => $calcular($request->mes, $request->anio),
        'anterior' => $calcular($mesAnterior, $anioAnterior),
    ]);
}
    private Transaction $lastTransaction;
}