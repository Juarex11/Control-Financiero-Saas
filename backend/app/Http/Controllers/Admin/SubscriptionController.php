<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Planes\Subscription;
use App\Models\Planes\Plan;
use App\Models\User;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    // ── Ver la suscripción actual de un usuario ──────────────────────────────
    public function show(Request $request, User $user)
    {
        $sub = $user->subscriptions()
            ->with('plan')
            ->latest('ends_at')
            ->first();

        return response()->json($sub);
    }

    // ── Asignar/cambiar el plan de un usuario ────────────────────────────────
    public function asignar(Request $request, User $user)
    {
        $request->validate([
            'plan_id'   => 'required|integer|exists:plans,id',
            'modalidad' => 'required|in:mensual,trimestral,semestral,anual,trial',
        ]);

        $plan = Plan::findOrFail($request->plan_id);

        $duracionDias = match ($request->modalidad) {
            'trial'      => 7,
            'mensual'    => 30,
            'trimestral' => 90,
            'semestral'  => 180,
            'anual'      => 365,
        };

        // Cancela cualquier suscripción activa anterior
        $user->subscriptions()
            ->whereIn('status', ['trial', 'active'])
            ->update(['status' => 'cancelled']);

        $subscription = Subscription::create([
            'user_id'   => $user->id,
            'plan_id'   => $plan->id,
            'modalidad' => $request->modalidad,
            'starts_at' => now()->toDateString(),
            'ends_at'   => now()->addDays($duracionDias)->toDateString(),
            'status'    => $request->modalidad === 'trial' ? 'trial' : 'active',
        ]);

        return response()->json([
            'message'      => 'Plan asignado correctamente.',
            'subscription' => $subscription->load('plan'),
        ], 201);
    }
}