<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    // ── Listar cuentas del usuario autenticado ────────────────────────────────

    public function index(Request $request)
    {
        $accounts = $request->user()
            ->accounts()
            ->get();

        return response()->json($accounts);
    }

    // ── Crear cuenta ──────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:100',
            'icon'     => 'required|string|max:50',
            'color'    => 'required|string|max:7',
            'currency' => 'required|string|size:3',
            'balance'  => 'nullable|numeric|min:0',
            'note'     => 'nullable|string|max:255',
        ]);

        $user = $request->user();

        // Si no tiene ninguna cuenta aún → esta será la principal
        $isPrimary = $user->accounts()->count() === 0;

        // Orden: al final de la lista
        $order = $user->accounts()->max('order') + 1;

        $account = Account::create([
            'user_id'    => $user->id,
            'name'       => $request->name,
            'icon'       => $request->icon,
            'color'      => $request->color,
            'currency'   => $request->currency,
            'balance'    => $request->balance    ?? 0.00,
            'note'       => $request->note       ?? null,
            'is_primary' => $isPrimary,
            'order'      => $order,
        ]);

        return response()->json([
            'message' => 'Cuenta creada.',
            'account' => $account,
        ], 201);
    }

    // ── Ver detalle de una cuenta ─────────────────────────────────────────────

    public function show(Request $request, Account $account)
    {
        // Solo el dueño puede ver su cuenta
        if ($account->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        return response()->json($account);
    }

    // ── Actualizar cuenta ─────────────────────────────────────────────────────

    public function update(Request $request, Account $account)
    {
        if ($account->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $request->validate([
            'name'     => 'nullable|string|max:100',
            'icon'     => 'nullable|string|max:50',
            'color'    => 'nullable|string|max:7',
            'currency' => 'nullable|string|size:3',
            'balance'  => 'nullable|numeric|min:0',
            'note'     => 'nullable|string|max:255',
        ]);

        $updateData = [];

        if ($request->filled('name'))     $updateData['name']     = $request->name;
        if ($request->filled('icon'))     $updateData['icon']     = $request->icon;
        if ($request->filled('color'))    $updateData['color']    = $request->color;
        if ($request->filled('currency')) $updateData['currency'] = $request->currency;
        if ($request->has('note'))        $updateData['note']     = $request->note;
        if ($request->has('balance'))     $updateData['balance']  = $request->balance;

        $account->update($updateData);
        $account->refresh();

        return response()->json([
            'message' => 'Cuenta actualizada.',
            'account' => $account,
        ]);
    }

    // ── Eliminar cuenta ───────────────────────────────────────────────────────

    public function destroy(Request $request, Account $account)
    {
        if ($account->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        // No se puede eliminar la cuenta principal si es la única
        $totalCuentas = $request->user()->accounts()->count();

        if ($account->is_primary && $totalCuentas === 1) {
            return response()->json([
                'message' => 'No puedes eliminar tu única cuenta.',
            ], 422);
        }

        // Si se elimina la cuenta principal, la siguiente pasa a ser principal
        if ($account->is_primary) {
            $siguiente = $request->user()
                ->accounts()
                ->where('id', '!=', $account->id)
                ->orderBy('order')
                ->first();

            if ($siguiente) {
                $siguiente->update(['is_primary' => true]);
            }
        }

        $account->delete();

        return response()->json(['message' => 'Cuenta eliminada.']);
    }

    // ── Marcar como cuenta principal ──────────────────────────────────────────

    public function setPrimary(Request $request, Account $account)
    {
        if ($account->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        // Quitar primary a todas las demás
        $request->user()->accounts()->update(['is_primary' => false]);

        // Marcar esta como primary
        $account->update(['is_primary' => true]);

        return response()->json([
            'message' => 'Cuenta principal actualizada.',
            'account' => $account->fresh(),
        ]);
    }

    // ── Crear cuenta principal automática (llamado desde register) ────────────

    public static function crearCuentaPrincipal(int $userId, string $currency = 'PEN'): Account
    {
        return Account::create([
            'user_id'    => $userId,
            'name'       => 'Principal',
            'icon'       => 'wallet',
            'color'      => '#31138b',
            'currency'   => $currency,
            'balance'    => 0.00,
            'is_primary' => true,
            'order'      => 0,
        ]);
    }
}