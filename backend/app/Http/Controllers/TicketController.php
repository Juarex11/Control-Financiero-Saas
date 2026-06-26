<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Ticket;
use App\Models\TicketMensaje;

class TicketController extends Controller
{
    // ── Usuario ───────────────────────────────────────────────────────────────

    // Listar tickets del usuario
    public function index(Request $request)
    {
        $tickets = $request->user()->tickets()
            ->withCount('mensajes')
            ->latest()
            ->get();

        return response()->json($tickets);
    }

    // Crear ticket con primer mensaje
    public function store(Request $request)
    {
        $data = $request->validate([
            'asunto'  => 'required|string|max:150',
            'mensaje' => 'required|string|max:2000',
            'foto'    => 'nullable|image|max:4096',
        ]);

        $ticket = Ticket::create([
            'user_id' => $request->user()->id,
            'asunto'  => $data['asunto'],
            'estado'  => 'pendiente',
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('tickets', 'public');
        }

        TicketMensaje::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $request->user()->id,
            'mensaje'   => $data['mensaje'],
            'foto'      => $fotoPath,
        ]);

        return response()->json([
            'message' => 'Ticket creado. Espera mientras lo revisamos.',
            'ticket'  => $ticket->load('mensajes.user'),
        ], 201);
    }

    // Ver ticket con mensajes
    public function show(Request $request, Ticket $ticket)
    {
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        return response()->json($ticket->load('mensajes.user'));
    }

    // Responder en un ticket existente
    public function responder(Request $request, Ticket $ticket)
    {
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($ticket->estado === 'resuelto') {
            return response()->json(['message' => 'Este ticket ya fue resuelto.'], 422);
        }

        $data = $request->validate([
            'mensaje' => 'required|string|max:2000',
            'foto'    => 'nullable|image|max:4096',
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('tickets', 'public');
        }

        $mensaje = TicketMensaje::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $request->user()->id,
            'mensaje'   => $data['mensaje'],
            'foto'      => $fotoPath,
        ]);

        return response()->json([
            'message' => 'Mensaje enviado.',
            'mensaje' => $mensaje->load('user'),
        ], 201);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    // Listar todos los tickets
    public function adminIndex(Request $request)
    {
        $estado  = $request->query('estado');
        $tickets = Ticket::with('user')
            ->withCount('mensajes')
            ->when($estado, fn($q) => $q->where('estado', $estado))
            ->latest()
            ->get();

        return response()->json($tickets);
    }

    // Ver ticket completo (admin)
    public function adminShow(Ticket $ticket)
    {
        return response()->json($ticket->load('mensajes.user', 'user'));
    }

    // Responder ticket (admin)
    public function adminResponder(Request $request, Ticket $ticket)
    {
        $data = $request->validate([
            'mensaje' => 'required|string|max:2000',
            'foto'    => 'nullable|image|max:4096',
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('tickets', 'public');
        }

        $mensaje = TicketMensaje::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $request->user()->id,
            'mensaje'   => $data['mensaje'],
            'foto'      => $fotoPath,
        ]);

        // Cambiar estado a en_revision si estaba pendiente
        if ($ticket->estado === 'pendiente') {
            $ticket->update(['estado' => 'en_revision']);
        }

        return response()->json([
            'message' => 'Respuesta enviada.',
            'mensaje' => $mensaje->load('user'),
        ], 201);
    }

    // Cambiar estado del ticket (admin)
    public function cambiarEstado(Request $request, Ticket $ticket)
    {
        $data = $request->validate([
            'estado' => 'required|in:pendiente,en_revision,resuelto',
        ]);

        $ticket->update(['estado' => $data['estado']]);

        return response()->json([
            'message' => 'Estado actualizado.',
            'ticket'  => $ticket,
        ]);
    }
}