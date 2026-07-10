<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // ── Login ─────────────────────────────────────────────────────────────────

    public function login(Request $request)
    {
        $request->validate([
            'identificador' => 'required|string',
            'password'      => 'required|string',
        ]);

        $user = User::where('email', $request->identificador)
                    ->orWhere('codigo_acceso', strtoupper($request->identificador))
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Credenciales incorrectas.'], 401);
        }

        $user->update(['last_login' => now()]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'              => $user->id,
                'name'            => $user->name,
                'email'           => $user->email,
                'role'            => $user->role,
                'codigo_acceso'   => $user->codigo_acceso,
                'cargo'           => $user->cargo,
                'photo'           => $user->photo,
                'photo_url'       => $user->photo ? asset('storage/' . $user->photo) : null,
                'currency'        => $user->currency,
                'pais'            => $user->pais,
                'timezone'        => $user->timezone,
                'padre_id'        => $user->padre_id,
                'last_login'      => $user->last_login,
                'onboarding_done' => $user->onboarding_done,
            ],
        ]);
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada.']);
    }

    // ── Me ────────────────────────────────────────────────────────────────────

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'id'              => $user->id,
            'name'            => $user->name,
            'email'           => $user->email,
            'role'            => $user->role,
            'codigo_acceso'   => $user->codigo_acceso,
            'cargo'           => $user->cargo,
            'photo'           => $user->photo,
            'photo_url'       => $user->photo ? asset('storage/' . $user->photo) : null,
            'currency'        => $user->currency,
            'pais'            => $user->pais,
            'timezone'        => $user->timezone,
            'padre_id'        => $user->padre_id,
            'last_login'      => $user->last_login,
            'onboarding_done' => $user->onboarding_done,
        ]);
    }
}