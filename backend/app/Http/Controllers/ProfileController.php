<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    // ── GET /profile ──────────────────────────────────────────────────────────
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json($this->format($user));
    }

    // ── POST /profile/update ──────────────────────────────────────────────────
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name'          => 'sometimes|required|string|max:100',
            'cargo'         => 'nullable|string|max:100',
            'telefono'      => 'nullable|string|max:30',
            'timezone'      => 'nullable|string|max:60',
            'pais'          => 'nullable|string|max:60',
        ]);

        $user->update($data);

        return response()->json($this->format($user->fresh()));
    }

    // ── POST /profile/photo ───────────────────────────────────────────────────
    public function updatePhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpg,jpeg,png,gif,webp|max:4096',
        ]);

        $user = $request->user();

        // Borrar foto anterior si existe y no es URL externa
        if ($user->photo && !filter_var($user->photo, FILTER_VALIDATE_URL)) {
            Storage::disk('public')->delete($user->photo);
        }

        $path = $request->file('photo')->store('avatars', 'public');

        if (!$path) {
            return response()->json(['message' => 'Error al subir la foto'], 500);
        }

        $user->update(['photo' => $path]);

        return response()->json([
            'photo'     => $path,
            'photo_url' => asset('storage/' . $path),
        ]);
    }

    // ── DELETE /profile/photo ─────────────────────────────────────────────────
    public function deletePhoto(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->photo && !filter_var($user->photo, FILTER_VALIDATE_URL)) {
            Storage::disk('public')->delete($user->photo);
        }

        $user->update(['photo' => null]);

        return response()->json(['message' => 'Foto eliminada']);
    }

    // ── POST /profile/password ────────────────────────────────────────────────
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'errors' => ['current_password' => ['La contraseña actual no es correcta']]
            ], 422);
        }

        $user->update(['password' => $request->password]);

        return response()->json(['message' => 'Contraseña actualizada correctamente']);
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private function format($user): array
    {
        return [
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'role'           => $user->role,
            'codigo_acceso'  => $user->codigo_acceso,
            'cargo'          => $user->cargo,
            'telefono'       => $user->telefono,
            'timezone'       => $user->timezone,
            'pais'           => $user->pais,
            'photo'          => $user->photo,
            'photo_url'      => $user->photo
                ? (filter_var($user->photo, FILTER_VALIDATE_URL)
                    ? $user->photo
                    : asset('storage/' . $user->photo))
                : null,
            'currency'       => $user->currency,
            'onboarding_done'=> $user->onboarding_done,
            'last_login'     => $user->last_login,
        ];
    }
}