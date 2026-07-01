<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Account;
use App\Services\CategorySeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    // ── Registro público ──────────────────────────────────────────────────────

    public function register(Request $request)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|string|min:6|confirmed',
            'codigo_padre' => 'required|string',
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

        Account::create([
            'user_id'    => $user->id,
            'name'       => 'Principal',
            'icon'       => 'wallet',
            'color'      => '#31138b',
            'currency'   => $user->currency,
            'balance'    => 0.00,
            'is_primary' => true,
            'order'      => 0,
        ]);

        // ✅ Categorías default
        CategorySeeder::crearParaUsuario($user->id);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Usuario registrado correctamente.',
            'token'   => $token,
            'user'    => [
                'id'              => $user->id,
                'name'            => $user->name,
                'email'           => $user->email,
                'role'            => $user->role,
                'codigo_acceso'   => $user->codigo_acceso,
                'padre_id'        => $user->padre_id,
                'currency'        => $user->currency,
                'onboarding_done' => $user->onboarding_done,
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
            ->select('id','name','email','role','cargo','telefono','photo','padre_id','codigo_acceso','currency','last_login','onboarding_done','created_at')
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

    // ── Crear (admin) ─────────────────────────────────────────────────────────

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

        Account::create([
            'user_id'    => $user->id,
            'name'       => 'Principal',
            'icon'       => 'wallet',
            'color'      => '#31138b',
            'currency'   => 'PEN',
            'balance'    => 0.00,
            'is_primary' => true,
            'order'      => 0,
        ]);

        // ✅ Categorías default
        CategorySeeder::crearParaUsuario($user->id);

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

        if ($request->has('padre_id')) {
            $updateData['padre_id'] = $request->padre_id ?: null;
        }

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
public function miEquipo(Request $request)
{
    $yo = $request->user();

    // Carga recursiva hasta 4 niveles
    $yo->loadMissing([
        'hijos.hijos.hijos.hijos',
    ]);

    $mapear = function ($user, $nivel) use (&$mapear) {
        if ($nivel > 4) return null;
        return [
            'id'     => $user->id,
            'name'   => $user->name,
            'cargo'  => $user->cargo,
            'photo'  => $user->photo ? asset('storage/' . $user->photo) : null,
            'hijos'  => $nivel < 4
                ? $user->hijos->map(fn($h) => $mapear($h, $nivel + 1))->filter()->values()
                : [],
        ];
    };

    $niveles = [];
    $cola = collect($yo->hijos);
    for ($n = 1; $n <= 4; $n++) {
        $niveles[$n] = $cola->count();
        $cola = $cola->flatMap(fn($u) => $u->hijos ?? collect());
    }

    return response()->json([
        'yo'       => [
            'id'    => $yo->id,
            'name'  => $yo->name,
            'cargo' => $yo->cargo,
            'photo' => $yo->photo ? asset('storage/' . $yo->photo) : null,
        ],
        'arbol'    => $yo->hijos->map(fn($h) => $mapear($h, 1))->values(),
        'resumen'  => $niveles, // { "1": 3, "2": 7, "3": 2, "4": 0 }
        'total'    => array_sum($niveles),
    ]);
}
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

    // ── Completar onboarding ──────────────────────────────────────────────────

public function completeOnboarding(Request $request)
{
    $data = $request->validate([
        'pais'       => 'nullable|string|max:60',
        'timezone'   => 'nullable|string|max:60',
        'actividad'  => 'nullable|string|max:30',
        'metas'      => 'nullable|array',
        'metas.*'    => 'string|max:30',
        'deudas'     => 'nullable|boolean',
        'num_deudas' => 'nullable|string|max:5',
        'finalidad'  => 'nullable|string|max:30',
    ]);

    $user = $request->user();

    $monedasPorPais = [
        'Argentina' => 'ARS', 'Bolivia' => 'BOB', 'Chile' => 'CLP', 'Colombia' => 'COP',
        'Costa Rica' => 'CRC', 'Cuba' => 'CUP', 'Ecuador' => 'USD', 'El Salvador' => 'USD',
        'España' => 'EUR', 'Guatemala' => 'GTQ', 'Honduras' => 'HNL', 'México' => 'MXN',
        'Nicaragua' => 'NIO', 'Panamá' => 'USD', 'Paraguay' => 'PYG', 'Perú' => 'PEN',
        'Puerto Rico' => 'USD', 'República Dominicana' => 'DOP', 'Uruguay' => 'UYU', 'Venezuela' => 'VES',
    ];

    $currency = $monedasPorPais[$data['pais'] ?? ''] ?? 'PEN';

    $user->update([
        'onboarding_done' => true,
        'pais'            => $data['pais']       ?? null,
        'timezone'        => $data['timezone']   ?? null,
        'currency'        => $currency,
        'ob_actividad'    => $data['actividad']  ?? null,
        'ob_metas'        => isset($data['metas']) ? json_encode($data['metas']) : null,
        'ob_deudas'       => $data['deudas']     ?? null,
        'ob_num_deudas'   => $data['num_deudas'] ?? null,
        'ob_finalidad'    => $data['finalidad']  ?? null,
    ]);

    $user->accounts()->where('is_primary', true)->update(['currency' => $currency]);

    return response()->json(['message' => 'Onboarding completado.']);
}
 public function stats(): \Illuminate\Http\JsonResponse
{
    $total    = User::count();
    $admins   = User::where('role', 'admin')->count();
    $usuarios = User::where('role', 'user')->count();
 
    $ahora        = now();
    $nuevosHoy    = User::whereDate('created_at', $ahora->toDateString())->count();
    $nuevosSemana = User::where('created_at', '>=', $ahora->startOfWeek())->count();
    $nuevosMes    = User::where('created_at', '>=', $ahora->copy()->startOfMonth())->count();
 
    // Onboarding completado
    $conOnboarding = User::where('onboarding_done', true)->count();
 
    // Distribución actividad
    $actividades = User::whereNotNull('ob_actividad')
        ->selectRaw('ob_actividad as label, count(*) as total')
        ->groupBy('ob_actividad')
        ->orderByDesc('total')
        ->get();
 
    // Distribución finalidad
    $finalidades = User::whereNotNull('ob_finalidad')
        ->selectRaw('ob_finalidad as label, count(*) as total')
        ->groupBy('ob_finalidad')
        ->orderByDesc('total')
        ->get();
 
    // Distribución deudas
    $conDeudas    = User::where('ob_deudas', true)->count();
    $sinDeudas    = User::where('ob_deudas', false)->count();
 
    // Metas más elegidas (descomponer el JSON)
    $metasRaw = User::whereNotNull('ob_metas')->pluck('ob_metas');
    $metasCount = [];
    foreach ($metasRaw as $json) {
        $arr = is_array($json) ? $json : json_decode($json, true);
        if (!is_array($arr)) continue;
        foreach ($arr as $meta) {
            $metasCount[$meta] = ($metasCount[$meta] ?? 0) + 1;
        }
    }
    arsort($metasCount);
    $metas = collect($metasCount)->map(fn($v, $k) => ['label' => $k, 'total' => $v])->values();
 
    // País
    $paises = User::whereNotNull('pais')
        ->selectRaw('pais as label, count(*) as total')
        ->groupBy('pais')
        ->orderByDesc('total')
        ->limit(10)
        ->get();
 
    // Últimos 7 días de registros
    $porDia = User::selectRaw('DATE(created_at) as dia, count(*) as total')
        ->where('created_at', '>=', now()->subDays(6)->startOfDay())
        ->groupBy('dia')
        ->orderBy('dia')
        ->get();
 
    // Completar días faltantes con 0
    $diasCompletos = collect();
    for ($i = 6; $i >= 0; $i--) {
        $fecha = now()->subDays($i)->format('Y-m-d');
        $found = $porDia->firstWhere('dia', $fecha);
        $diasCompletos->push(['dia' => $fecha, 'total' => $found?->total ?? 0]);
    }
 
    return response()->json([
        'resumen' => [
            'total'          => $total,
            'admins'         => $admins,
            'usuarios'       => $usuarios,
            'nuevos_hoy'     => $nuevosHoy,
            'nuevos_semana'  => $nuevosSemana,
            'nuevos_mes'     => $nuevosMes,
            'con_onboarding' => $conOnboarding,
        ],
        'actividades'  => $actividades,
        'finalidades'  => $finalidades,
        'deudas'       => ['con' => $conDeudas, 'sin' => $sinDeudas],
        'metas'        => $metas,
        'paises'       => $paises,
        'registros'    => $diasCompletos,
    ]);
}
}