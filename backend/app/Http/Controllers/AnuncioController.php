<?php

namespace App\Http\Controllers;

use App\Models\Anuncio;
use App\Models\Reaccion;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class AnuncioController extends Controller
{
    // Middleware va en las rutas (api.php), no aquí.
    // Laravel 11 eliminó el soporte de middleware() en constructores de controladores.

    // ── Helper ────────────────────────────────────────────────────────────────
    private function formatAnuncio(Anuncio $a, ?int $userId = null): array
    {
        $reacciones = $a->reacciones
            ->groupBy('tipo')
            ->map(fn($g) => $g->count())
            ->toArray();

        $miReaccion = $userId
            ? $a->reacciones->firstWhere('user_id', $userId)?->tipo
            : null;

        $autorFoto = null;
        if ($a->autor->photo) {
            $autorFoto = filter_var($a->autor->photo, FILTER_VALIDATE_URL)
                ? $a->autor->photo
                : URL::to('/storage/' . ltrim($a->autor->photo, '/'));
        }

        $imagenUrl = null;
        if ($a->imagen) {
            $imagenUrl = Storage::disk('public')->exists($a->imagen)
                ? Storage::disk('public')->url($a->imagen)
                : null;
        }

        return [
            'id'              => $a->id,
            'titulo'          => $a->titulo,
            'contenido'       => $a->contenido,
            'imagen'          => $imagenUrl,
            'expira_at'       => $a->expira_at->toIso8601String(),
            'expirado'        => $a->isExpirado(),
            // Anclado = flag activo Y anclado_hasta en el futuro
            'anclado'         => $a->isAncladoActivo(),
            'anclado_hasta'   => $a->anclado_hasta?->toIso8601String(),
            'duracion_anclado'=> $a->duracion_anclado,
            'autor'           => $a->autor->name,
            'autor_foto'      => $autorFoto,
            'reacciones'      => $reacciones,
            'mi_reaccion'     => $miReaccion,
            'created_at'      => $a->created_at->toIso8601String(),
        ];
    }

    // ── PÚBLICO ────────────────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $anuncios = Anuncio::with(['autor:id,name,photo', 'reacciones'])
            ->vigentes()
            ->orderByRaw('(anclado = 1 AND anclado_hasta > NOW()) DESC')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($a) => $this->formatAnuncio($a, $request->user()?->id));

        return response()->json($anuncios);
    }

    public function reaccionar(Request $request, Anuncio $anuncio): JsonResponse
    {
        if ($anuncio->isExpirado()) {
            return response()->json(['message' => 'Este anuncio ya expiró.'], 422);
        }

        $data = $request->validate([
            'tipo' => 'required|string|in:like,corazon,risa,tristeza,asombro,celebracion',
        ]);

        $reaccion = Reaccion::firstOrNew([
            'anuncio_id' => $anuncio->id,
            'user_id'    => $request->user()->id,
        ]);

        if ($reaccion->exists) {
            if ($reaccion->tipo === $data['tipo']) {
                $reaccion->delete();
                $miReaccion = null;
            } else {
                $reaccion->tipo = $data['tipo'];
                $reaccion->save();
                $miReaccion = $data['tipo'];
            }
        } else {
            $reaccion->tipo = $data['tipo'];
            $reaccion->save();
            $miReaccion = $data['tipo'];
        }

        $anuncio->load('reacciones');
        $reacciones = $anuncio->reacciones
            ->groupBy('tipo')
            ->map(fn($g) => $g->count())
            ->toArray();

        return response()->json(['reacciones' => $reacciones, 'mi_reaccion' => $miReaccion]);
    }

    // ── ADMIN ─────────────────────────────────────────────────────────────────
    public function adminIndex(Request $request): JsonResponse
    {
        $anuncios = Anuncio::with(['autor:id,name,photo', 'reacciones'])
            ->orderByRaw('(anclado = 1 AND anclado_hasta > NOW()) DESC')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($a) => $this->formatAnuncio($a, $request->user()->id));

        return response()->json($anuncios);
    }

public function store(Request $request): JsonResponse
{
    $data = $request->validate([
        'titulo'           => 'required|string|max:255',
        'contenido'        => 'nullable|string|max:2000',
        'imagen'           => 'nullable|image|mimes:jpg,jpeg,png,gif,webp|max:4096',
'expira_en' => 'nullable|in:1d,1w,1m',
        'anclado'          => 'boolean',
        'duracion_anclado' => 'nullable|required_if:anclado,true|in:1d,1w,1m,siempre',
    ]);

    $imagenPath = null;
    if ($request->hasFile('imagen')) {
        $imagenPath = $request->file('imagen')->store('anuncios', 'public');
        if (!$imagenPath) {
            return response()->json(['message' => 'Error al subir la imagen'], 500);
        }
    }

    $anclado         = $data['anclado'] ?? false;
    $duracionAnclado = $anclado ? ($data['duracion_anclado'] ?? null) : null;

    // Si el anclaje es "siempre", la visibilidad también es para siempre
 $expiraAt = ($duracionAnclado === 'siempre')
    ? now()->addYears(10)
    : Anuncio::calcularExpiracion($data['expira_en'] ?? '1m');


    $anuncio = Anuncio::create([
        'user_id'          => $request->user()->id,
        'titulo'           => $data['titulo'],
        'contenido'        => $data['contenido'] ?? null,
        'imagen'           => $imagenPath,
        'expira_at'        => $expiraAt,
        'anclado'          => $anclado,
        'duracion_anclado' => $duracionAnclado,
        'anclado_hasta'    => $anclado && $duracionAnclado
            ? Anuncio::calcularAncladoHasta($duracionAnclado)
            : null,
    ]);

    $anuncio->load(['autor:id,name,photo', 'reacciones']);

    return response()->json($this->formatAnuncio($anuncio, $request->user()->id), 201);
}

    public function update(Request $request, Anuncio $anuncio): JsonResponse
    {
        $data = $request->validate([
            'titulo'           => 'sometimes|required|string|max:255',
            'contenido'        => 'nullable|string|max:2000',
            'expira_en'        => 'sometimes|required|in:1d,1w,1m',
            'anclado'          => 'boolean',
'duracion_anclado' => 'nullable|in:1d,1w,1m,siempre',
        ]);

       if (isset($data['expira_en'])) {
    $data['expira_at'] = Anuncio::calcularExpiracion($data['expira_en']);
    unset($data['expira_en']);
} elseif (isset($data['duracion_anclado']) && $data['duracion_anclado'] === 'siempre') {
    $data['expira_at'] = now()->addYears(10);
}

        $anclado = $data['anclado'] ?? $anuncio->anclado;

        if ($anclado && isset($data['duracion_anclado'])) {
            $data['anclado_hasta'] = Anuncio::calcularAncladoHasta($data['duracion_anclado']);
        } elseif (!$anclado) {
            $data['anclado_hasta']    = null;
            $data['duracion_anclado'] = null;
        }

        $anuncio->update($data);
        $anuncio->load(['autor:id,name,photo', 'reacciones']);

        return response()->json($this->formatAnuncio($anuncio, $request->user()->id));
    }

    public function subirImagen(Request $request, Anuncio $anuncio): JsonResponse
    {
        $request->validate(['imagen' => 'required|image|mimes:jpg,jpeg,png,gif,webp|max:4096']);

        if ($anuncio->imagen && Storage::disk('public')->exists($anuncio->imagen)) {
            Storage::disk('public')->delete($anuncio->imagen);
        }

        $path = $request->file('imagen')->store('anuncios', 'public');
        if (!$path) return response()->json(['message' => 'Error al subir la imagen'], 500);

        $anuncio->update(['imagen' => $path]);

        return response()->json([
            'imagen'  => Storage::disk('public')->url($path),
            'message' => 'Imagen actualizada correctamente',
        ]);
    }

    public function eliminarImagen(Anuncio $anuncio): JsonResponse
    {
        if ($anuncio->imagen && Storage::disk('public')->exists($anuncio->imagen)) {
            Storage::disk('public')->delete($anuncio->imagen);
            $anuncio->update(['imagen' => null]);
        }

        return response()->json(['message' => 'Imagen eliminada correctamente.']);
    }

    public function toggleAnclado(Anuncio $anuncio): JsonResponse
    {
        $nuevoEstado = !$anuncio->isAncladoActivo();

        $anuncio->update([
            'anclado'       => $nuevoEstado,
            'anclado_hasta' => $nuevoEstado
                ? Anuncio::calcularAncladoHasta($anuncio->duracion_anclado ?? '1d')
                : null,
        ]);

        return response()->json([
            'anclado' => $nuevoEstado,
            'message' => $nuevoEstado ? 'Anuncio anclado.' : 'Anuncio desanclado.',
        ]);
    }

    public function destroy(Anuncio $anuncio): JsonResponse
    {
        if ($anuncio->imagen && Storage::disk('public')->exists($anuncio->imagen)) {
            Storage::disk('public')->delete($anuncio->imagen);
        }

        $anuncio->delete();

        return response()->json(['message' => 'Anuncio eliminado correctamente.']);
    }
}