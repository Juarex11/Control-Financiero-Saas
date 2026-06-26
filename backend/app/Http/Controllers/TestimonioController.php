<?php

namespace App\Http\Controllers;

use App\Models\Testimonio;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class TestimonioController extends Controller
{
    /**
     * Convierte el path relativo de la foto a URL pública completa.
     * Igual que ProfileController::userResponse().
     */
    private function fotoUrl(?string $photo): ?string
    {
        return $photo ? Storage::disk('public')->url($photo) : null;
    }

    // ── PÚBLICO ───────────────────────────────────────────────────────────────

    public function publico(): JsonResponse
    {
        $testimonios = Testimonio::with('user:id,name,photo,cargo')
            ->aprobados()
            ->orderByDesc('destacado')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($t) => [
                'id'            => $t->id,
                'contenido'     => $t->contenido,
                'cargo_empresa' => $t->user->cargo ?? null,
                'estrellas'     => $t->estrellas,
                'destacado'     => $t->destacado,
                'nombre'        => $t->user->name,
                'foto'          => $this->fotoUrl($t->user->photo), // ← URL completa
                'created_at'    => $t->created_at->toDateString(),
            ]);

        return response()->json($testimonios);
    }

    // ── USUARIO AUTENTICADO ───────────────────────────────────────────────────

    public function mio(Request $request): JsonResponse
    {
        $testimonio = Testimonio::where('user_id', $request->user()->id)->first();

        if ($testimonio) {
            $testimonio->cargo_empresa = $request->user()->cargo ?? null;
        }

        return response()->json($testimonio);
    }

    public function guardar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'contenido' => 'required|string|min:10|max:500',
            'estrellas' => 'required|integer|min:1|max:5',
        ]);

        $data['cargo_empresa'] = $request->user()->cargo ?? null;

        $testimonio = Testimonio::where('user_id', $request->user()->id)->first();

        if ($testimonio) {
            $data['estado']    = 'pendiente';
            $data['destacado'] = false;
            $testimonio->update($data);
            $mensaje = 'Testimonio actualizado. Pendiente de aprobación.';
        } else {
            $data['user_id'] = $request->user()->id;
            $data['estado']  = 'pendiente';
            $testimonio = Testimonio::create($data);
            $mensaje = 'Testimonio enviado. Pendiente de aprobación.';
        }

        $testimonio->cargo_empresa = $request->user()->cargo ?? null;

        return response()->json(['message' => $mensaje, 'testimonio' => $testimonio], 201);
    }

    public function eliminarMio(Request $request): JsonResponse
    {
        $testimonio = Testimonio::where('user_id', $request->user()->id)->firstOrFail();
        $testimonio->delete();

        return response()->json(['message' => 'Testimonio eliminado.']);
    }

    // ── ADMIN ─────────────────────────────────────────────────────────────────

    public function adminIndex(Request $request): JsonResponse
    {
        $query = Testimonio::with('user:id,name,email,photo,cargo')
            ->orderByDesc('created_at');

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        return response()->json($query->get()->map(fn($t) => [
            'id'            => $t->id,
            'contenido'     => $t->contenido,
            'cargo_empresa' => $t->user->cargo ?? null,
            'estrellas'     => $t->estrellas,
            'estado'        => $t->estado,
            'destacado'     => $t->destacado,
            'nombre'        => $t->user->name,
            'email'         => $t->user->email,
            'foto'          => $this->fotoUrl($t->user->photo), // ← URL completa
            'created_at'    => $t->created_at->toDateString(),
        ]));
    }

    public function cambiarEstado(Request $request, Testimonio $testimonio): JsonResponse
    {
        $data = $request->validate([
            'estado' => ['required', Rule::in(['aprobado', 'rechazado', 'pendiente'])],
        ]);

        $testimonio->update($data);

        return response()->json(['message' => 'Estado actualizado.', 'testimonio' => $testimonio]);
    }

    public function toggleDestacado(Testimonio $testimonio): JsonResponse
    {
        if ($testimonio->estado !== 'aprobado') {
            return response()->json(['message' => 'Solo se pueden destacar testimonios aprobados.'], 422);
        }

        $testimonio->update(['destacado' => !$testimonio->destacado]);

        return response()->json([
            'message'   => $testimonio->destacado ? 'Testimonio destacado.' : 'Testimonio ya no está destacado.',
            'destacado' => $testimonio->destacado,
        ]);
    }

    public function adminEliminar(Testimonio $testimonio): JsonResponse
    {
        $testimonio->delete();

        return response()->json(['message' => 'Testimonio eliminado.']);
    }
}