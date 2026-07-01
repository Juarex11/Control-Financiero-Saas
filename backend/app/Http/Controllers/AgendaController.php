<?php
// app/Http/Controllers/AgendaController.php

namespace App\Http\Controllers;

use App\Models\AgendaEvento;
use App\Models\AgendaContacto;
use App\Models\AgendaNota;
use App\Models\AgendaArchivo;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class AgendaController extends Controller
{
    // ── Helper ────────────────────────────────────────────────────────────────
    private function formatEvento(AgendaEvento $e): array
    {
        return [
            'id'                   => $e->id,
            'tipo'                 => $e->tipo,
            'titulo'               => $e->titulo,
            'descripcion'          => $e->descripcion,
            'lugar'                => $e->lugar,
            'link_reunion'         => $e->link_reunion,
            'fecha_inicio'         => $e->fecha_inicio->toIso8601String(),
            'fecha_fin'            => $e->fecha_fin?->toIso8601String(),
            'todo_el_dia'          => $e->todo_el_dia,
            'zona_horaria'         => $e->zona_horaria,
            'recordatorio_minutos' => $e->recordatorio_minutos,
            'estado'               => $e->estado,
            'motivo_cancelacion'   => $e->motivo_cancelacion,
            'color'                => $e->color,
            'prioridad'            => $e->prioridad,
            'repeticion'           => $e->repeticion,
            'repeticion_hasta'     => $e->repeticion_hasta?->toDateString(),
            'vencido'              => $e->estaVencido(),
            'creador'              => $e->creador->name,
            'contactos'            => $e->contactos,
            'notas'                => $e->notas->map(fn($n) => [
                'id'        => $n->id,
                'contenido' => $n->contenido,
                'privada'   => $n->privada,
                'autor'     => $n->autor->name,
                'created_at'=> $n->created_at->toIso8601String(),
            ]),
            'archivos' => $e->archivos->map(fn($a) => [
                'id'             => $a->id,
                'nombre_original'=> $a->nombre_original,
                'url'            => $a->url(),
                'tipo_mime'      => $a->tipo_mime,
                'tamanio'        => $a->tamanioLegible(),
            ]),
            'created_at' => $e->created_at->toIso8601String(),
        ];
    }

    // ── CRUD Eventos ──────────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = AgendaEvento::with(['creador:id,name', 'contactos', 'notas.autor:id,name', 'archivos'])
            ->where('user_id', $request->user()->id);

        if ($request->filled('tipo'))   $query->where('tipo', $request->tipo);
        if ($request->filled('estado')) $query->where('estado', $request->estado);
        if ($request->filled('desde'))  $query->whereDate('fecha_inicio', '>=', $request->desde);
        if ($request->filled('hasta'))  $query->whereDate('fecha_inicio', '<=', $request->hasta);

        $eventos = $query->orderBy('fecha_inicio')->get()->map(fn($e) => $this->formatEvento($e));

        return response()->json($eventos);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tipo'                 => 'required|in:cita,reunion,evento,recordatorio,tarea',
            'titulo'               => 'required|string|max:255',
            'descripcion'          => 'nullable|string|max:5000',
            'lugar'                => 'nullable|string|max:255',
            'link_reunion'         => 'nullable|url|max:500',
            'fecha_inicio'         => 'required|date',
            'fecha_fin'            => 'nullable|date|after_or_equal:fecha_inicio',
            'todo_el_dia'          => 'boolean',
            'zona_horaria'         => 'nullable|string|max:50',
            'recordatorio_minutos' => 'nullable|integer|in:0,15,30,60,120,1440',
            'estado'               => 'in:pendiente,confirmada,en_proceso,finalizada,cancelada',
            'color'                => 'nullable|string|max:7',
            'prioridad'            => 'in:baja,media,alta',
            'repeticion'           => 'in:ninguna,diaria,semanal,mensual,anual',
            'repeticion_hasta'     => 'nullable|date|after:fecha_inicio',
            // Contactos opcionales
            'contactos'            => 'nullable|array',
            'contactos.*.nombre'   => 'required|string|max:255',
            'contactos.*.email'    => 'nullable|email|max:255',
            'contactos.*.telefono' => 'nullable|string|max:30',
            'contactos.*.empresa'  => 'nullable|string|max:255',
            'contactos.*.cargo'    => 'nullable|string|max:255',
            'contactos.*.rol'      => 'in:cliente,participante,organizador,invitado',
        ]);

        $evento = AgendaEvento::create([
            ...$data,
            'user_id' => $request->user()->id,
        ]);

        if (!empty($data['contactos'])) {
            foreach ($data['contactos'] as $c) {
                $evento->contactos()->create($c);
            }
        }

        $evento->load(['creador:id,name', 'contactos', 'notas.autor:id,name', 'archivos']);

        return response()->json($this->formatEvento($evento), 201);
    }

    public function show(Request $request, AgendaEvento $evento): JsonResponse
    {
        $this->authorize($request->user(), $evento);
        $evento->load(['creador:id,name', 'contactos', 'notas.autor:id,name', 'archivos']);
        return response()->json($this->formatEvento($evento));
    }

    public function update(Request $request, AgendaEvento $evento): JsonResponse
    {
        $this->authorize($request->user(), $evento);

        $data = $request->validate([
            'tipo'                 => 'sometimes|in:cita,reunion,evento,recordatorio,tarea',
            'titulo'               => 'sometimes|required|string|max:255',
            'descripcion'          => 'nullable|string|max:5000',
            'lugar'                => 'nullable|string|max:255',
            'link_reunion'         => 'nullable|url|max:500',
            'fecha_inicio'         => 'sometimes|date',
            'fecha_fin'            => 'nullable|date|after_or_equal:fecha_inicio',
            'todo_el_dia'          => 'boolean',
            'recordatorio_minutos' => 'nullable|integer|in:0,15,30,60,120,1440',
            'estado'               => 'in:pendiente,confirmada,en_proceso,finalizada,cancelada',
            'motivo_cancelacion'   => 'nullable|string|max:1000',
            'color'                => 'nullable|string|max:7',
            'prioridad'            => 'in:baja,media,alta',
            'repeticion'           => 'in:ninguna,diaria,semanal,mensual,anual',
            'repeticion_hasta'     => 'nullable|date',
        ]);

        $evento->update($data);
        $evento->load(['creador:id,name', 'contactos', 'notas.autor:id,name', 'archivos']);

        return response()->json($this->formatEvento($evento));
    }

    public function destroy(Request $request, AgendaEvento $evento): JsonResponse
    {
        $this->authorize($request->user(), $evento);
        $evento->delete();
        return response()->json(['message' => 'Evento eliminado.']);
    }

    // ── Estado rápido ─────────────────────────────────────────────────────────
    public function cambiarEstado(Request $request, AgendaEvento $evento): JsonResponse
    {
        $this->authorize($request->user(), $evento);

        $data = $request->validate([
            'estado'             => 'required|in:pendiente,confirmada,en_proceso,finalizada,cancelada',
           'motivo_cancelacion' => 'nullable|string|max:1000',
        ]);

        $evento->update($data);

        return response()->json([
            'estado'           => $evento->estado,
            'motivo_cancelacion' => $evento->motivo_cancelacion,
        ]);
    }

    // ── Contactos ─────────────────────────────────────────────────────────────
    public function agregarContacto(Request $request, AgendaEvento $evento): JsonResponse
    {
        $this->authorize($request->user(), $evento);

        $data = $request->validate([
            'nombre'       => 'required|string|max:255',
            'email'        => 'nullable|email|max:255',
            'telefono'     => 'nullable|string|max:30',
            'empresa'      => 'nullable|string|max:255',
            'cargo'        => 'nullable|string|max:255',
            'notas'        => 'nullable|string|max:1000',
            'rol'          => 'in:cliente,participante,organizador,invitado',
            'confirmacion' => 'in:pendiente,aceptado,rechazado',
        ]);

        $contacto = $evento->contactos()->create($data);

        return response()->json($contacto, 201);
    }

    public function eliminarContacto(Request $request, AgendaEvento $evento, AgendaContacto $contacto): JsonResponse
    {
        $this->authorize($request->user(), $evento);
        $contacto->delete();
        return response()->json(['message' => 'Contacto eliminado.']);
    }

    // ── Notas ─────────────────────────────────────────────────────────────────
    public function agregarNota(Request $request, AgendaEvento $evento): JsonResponse
    {
        $this->authorize($request->user(), $evento);

        $data = $request->validate([
            'contenido' => 'required|string|max:5000',
            'privada'   => 'boolean',
        ]);

        $nota = $evento->notas()->create([
            ...$data,
            'user_id' => $request->user()->id,
        ]);

        $nota->load('autor:id,name');

        return response()->json([
            'id'        => $nota->id,
            'contenido' => $nota->contenido,
            'privada'   => $nota->privada,
            'autor'     => $nota->autor->name,
            'created_at'=> $nota->created_at->toIso8601String(),
        ], 201);
    }

    public function eliminarNota(Request $request, AgendaEvento $evento, AgendaNota $nota): JsonResponse
    {
        $this->authorize($request->user(), $evento);
        $nota->delete();
        return response()->json(['message' => 'Nota eliminada.']);
    }

    // ── Archivos ──────────────────────────────────────────────────────────────
    public function subirArchivo(Request $request, AgendaEvento $evento): JsonResponse
    {
        $this->authorize($request->user(), $evento);

        $request->validate([
            'archivo' => 'required|file|max:10240|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,webp,zip,txt',
        ]);

        $file = $request->file('archivo');
        $ruta = $file->store('agenda/archivos', 'public');

        $archivo = $evento->archivos()->create([
            'user_id'        => $request->user()->id,
            'nombre_original'=> $file->getClientOriginalName(),
            'ruta'           => $ruta,
            'tipo_mime'      => $file->getMimeType(),
            'tamanio'        => $file->getSize(),
        ]);

        return response()->json([
            'id'             => $archivo->id,
            'nombre_original'=> $archivo->nombre_original,
            'url'            => $archivo->url(),
            'tipo_mime'      => $archivo->tipo_mime,
            'tamanio'        => $archivo->tamanioLegible(),
        ], 201);
    }

    public function eliminarArchivo(Request $request, AgendaEvento $evento, AgendaArchivo $archivo): JsonResponse
    {
        $this->authorize($request->user(), $evento);
        Storage::disk('public')->delete($archivo->ruta);
        $archivo->delete();
        return response()->json(['message' => 'Archivo eliminado.']);
    }

    // ── Vista resumen ─────────────────────────────────────────────────────────
    public function resumen(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        return response()->json([
            'hoy'       => AgendaEvento::where('user_id', $userId)->deHoy()->count(),
            'proximos'  => AgendaEvento::where('user_id', $userId)->proximos(7)->count(),
            'pendientes'=> AgendaEvento::where('user_id', $userId)->porEstado('pendiente')->count(),
            'vencidos'  => AgendaEvento::where('user_id', $userId)
                ->whereNotIn('estado', ['finalizada', 'cancelada'])
                ->where('fecha_inicio', '<', now())
                ->count(),
        ]);
    }

    // ── Helper privado ────────────────────────────────────────────────────────
    private function authorize($user, AgendaEvento $evento): void
    {
        if ($evento->user_id !== $user->id && $user->role !== 'admin') {
            abort(403, 'No autorizado.');
        }
    }
}