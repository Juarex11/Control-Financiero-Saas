<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    // ── Registro público ──────────────────────────────────────────────────────

    public function register(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'email'         => 'required|email|unique:users,email',
            'password'      => 'required|string|min:6|confirmed',
            'codigo_padre'  => 'required|string',
        ]);

        $padre = User::where('codigo_acceso', strtoupper($data['codigo_padre']))->first();

        if (!$padre) {
            return response()->json(['message' => 'Código de acceso inválido.'], 422);
        }

        $user = User::create([
            'name'          => $data['name'],
            'email'         => $data['email'],
            'password'      => Hash::make($data['password']),
            'role'          => 'user',
            'padre_id'      => $padre->id,
            'codigo_acceso' => User::generarCodigo(),
            'currency'      => 'PEN',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Usuario registrado correctamente.',
            'token'   => $token,
            'user'    => [
                'id'            => $user->id,
                'name'          => $user->name,
                'email'         => $user->email,
                'role'          => $user->role,
                'codigo_acceso' => $user->codigo_acceso,
                'padre_id'      => $user->padre_id,
                'currency'      => $user->currency,
            ],
        ], 201);
    }

    // ── Validar código ────────────────────────────────────────────────────────

    public function validarCodigo(Request $request)
    {
        $request->validate(['codigo' => 'required|string']);

        $user = User::where('codigo_acceso', strtoupper($request->codigo))->first();

        if (!$user) {
            return response()->json(['message' => 'Código de invitación inválido.'], 422);
        }

        return response()->json(['message' => 'Código válido.', 'nombre' => $user->name]);
    }

    // ── Listar ────────────────────────────────────────────────────────────────

public function index()
{
    $users = User::with('padre:id,name,email,codigo_acceso')
        ->select('id','name','email','role','cargo','telefono','photo','padre_id','codigo_acceso','currency','last_login','created_at')
        ->get()
        ->map(function ($user) {
            $user->photo_url = $user->photo
                ? asset('storage/' . $user->photo)
                : null;
            return $user;
        });

    return response()->json($users);
}
    // ── Árbol ─────────────────────────────────────────────────────────────────

    public function arbol(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            $users = User::with('descendientes')->whereNull('padre_id')->get();
        } else {
            $users = User::with('descendientes')->where('id', $user->id)->get();
        }

        return response()->json($users);
    }

    // ── Crear ─────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'padre_id' => 'nullable|exists:users,id',
            'cargo'    => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:20',
            'role'     => 'nullable|in:admin,user',
            'photo'    => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('photos', 'public');
        }

        $user = User::create([
            'name'          => $request->name,
            'email'         => $request->email,
            'password'      => Hash::make($request->password),
            'role'          => $request->role     ?? 'user',
            'padre_id'      => $request->padre_id ?? null,
            'cargo'         => $request->cargo    ?? null,
            'telefono'      => $request->telefono ?? null,
            'photo'         => $photoPath,
            'codigo_acceso' => User::generarCodigo(),
            'currency'      => 'PEN',
        ]);

        return response()->json([
            'message'   => 'Usuario creado.',
            'user'      => $user,
            'photo_url' => $photoPath ? asset('storage/' . $photoPath) : null,
        ], 201);
    }

    // ── Actualizar ────────────────────────────────────────────────────────────

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name'     => 'nullable|string|max:100',
            'email'    => 'nullable|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'cargo'    => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:20',
            'padre_id' => 'nullable|exists:users,id',
            'role'     => 'nullable|in:admin,user',
            'photo'    => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $updateData = [];

        if ($request->filled('name'))     $updateData['name']     = $request->name;
        if ($request->filled('email'))    $updateData['email']    = $request->email;
        if ($request->filled('cargo'))    $updateData['cargo']    = $request->cargo;
        if ($request->filled('telefono')) $updateData['telefono'] = $request->telefono;
        if ($request->filled('role'))     $updateData['role']     = $request->role;
        if ($request->filled('password')) $updateData['password'] = Hash::make($request->password);

        // Padre
        if ($request->has('padre_id')) {
            $updateData['padre_id'] = $request->padre_id ?: null;
        }

        // Foto
        if ($request->hasFile('photo')) {
            if ($user->photo && Storage::disk('public')->exists($user->photo)) {
                Storage::disk('public')->delete($user->photo);
            }
            $updateData['photo'] = $request->file('photo')->store('photos', 'public');
        }

        $user->update($updateData);
        $user->refresh();

        return response()->json([
            'message'   => 'Usuario actualizado.',
            'user'      => $user,
            'photo_url' => $user->photo ? asset('storage/' . $user->photo) : null,
        ]);
    }

    // ── Eliminar ──────────────────────────────────────────────────────────────

    public function destroy(User $user)
    {
        if ($user->role === 'admin') {
            return response()->json(['message' => 'No puedes eliminar al admin.'], 403);
        }

        if ($user->photo && Storage::disk('public')->exists($user->photo)) {
            Storage::disk('public')->delete($user->photo);
        }

        $user->delete();
        return response()->json(['message' => 'Usuario eliminado.']);
    }
}