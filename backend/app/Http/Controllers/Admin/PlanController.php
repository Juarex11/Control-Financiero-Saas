<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Planes\Plan;
use App\Models\Planes\PlanPrice;
use App\Models\Planes\PlanModule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class PlanController extends Controller
{
    // Módulos válidos que un plan puede controlar
    private array $modulosValidos = [
        'mi-equipo', 'membresia', 'comisiones', 'ganancias', 'plan-emprendedor',
    ];

    // ── Listar todos los planes (con precios, módulos y conteo de suscriptores) ──
    public function index()
    {
        $plans = Plan::with(['prices', 'modules'])
            ->withCount(['subscriptions as subscribers_count' => function ($q) {
                $q->whereIn('status', ['trial', 'active']);
            }])
            ->orderBy('order')
            ->get();

        return response()->json($plans);
    }

    // ── Ver detalle de un plan ────────────────────────────────────────────────
    public function show(Plan $plan)
    {
        $plan->load(['prices', 'modules'])
            ->loadCount(['subscriptions as subscribers_count' => function ($q) {
                $q->whereIn('status', ['trial', 'active']);
            }]);

        return response()->json($plan);
    }

    // ── Crear plan ─────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $request->validate([
            'name'                  => 'required|string|max:100',
            'description'           => 'nullable|string|max:500',
            'photo'                 => 'nullable|image|max:2048',
            'prices'                => 'required|array|min:1',
            'prices.*.modalidad'    => 'required|in:mensual,trimestral,semestral,anual',
            'prices.*.price'        => 'required|numeric|min:0',
            'modules'               => 'nullable|array',
            'modules.*'             => 'in:' . implode(',', $this->modulosValidos),
        ]);

        $plan = DB::transaction(function () use ($request) {
            $photoPath = null;
            if ($request->hasFile('photo')) {
                $photoPath = $request->file('photo')->store('plans', 'public');
            }

            $order = Plan::max('order') + 1;

            $plan = Plan::create([
                'name'        => $request->name,
                'description' => $request->description,
                'photo'       => $photoPath,
                'is_active'   => true,
                'order'       => $order,
            ]);

            foreach ($request->prices as $p) {
                PlanPrice::create([
                    'plan_id'   => $plan->id,
                    'modalidad' => $p['modalidad'],
                    'price'     => $p['price'],
                ]);
            }

            foreach ($request->modules ?? [] as $moduleKey) {
                PlanModule::create([
                    'plan_id'    => $plan->id,
                    'module_key' => $moduleKey,
                ]);
            }

            return $plan;
        });

        return response()->json([
            'message' => 'Plan creado.',
            'plan'    => $plan->load(['prices', 'modules']),
        ], 201);
    }

    // ── Actualizar plan (nombre, foto, descripción, precios, módulos) ──────────
    public function update(Request $request, Plan $plan)
    {
        $request->validate([
            'name'                  => 'nullable|string|max:100',
            'description'           => 'nullable|string|max:500',
            'photo'                 => 'nullable|image|max:2048',
            'is_active'             => 'nullable|boolean',
            'prices'                => 'nullable|array|min:1',
            'prices.*.modalidad'    => 'required_with:prices|in:mensual,trimestral,semestral,anual',
            'prices.*.price'        => 'required_with:prices|numeric|min:0',
            'modules'               => 'nullable|array',
            'modules.*'             => 'in:' . implode(',', $this->modulosValidos),
        ]);

        DB::transaction(function () use ($request, $plan) {
            $updateData = [];
            if ($request->filled('name'))        $updateData['name']        = $request->name;
            if ($request->has('description'))     $updateData['description'] = $request->description;
            if ($request->has('is_active'))       $updateData['is_active']   = $request->is_active;

            if ($request->hasFile('photo')) {
                if ($plan->photo) Storage::disk('public')->delete($plan->photo);
                $updateData['photo'] = $request->file('photo')->store('plans', 'public');
            }

            if (!empty($updateData)) $plan->update($updateData);

            // Reemplaza precios si vienen en la petición
            if ($request->has('prices')) {
                $plan->prices()->delete();
                foreach ($request->prices as $p) {
                    PlanPrice::create([
                        'plan_id'   => $plan->id,
                        'modalidad' => $p['modalidad'],
                        'price'     => $p['price'],
                    ]);
                }
            }

            // Reemplaza módulos si vienen en la petición
            if ($request->has('modules')) {
                $plan->modules()->delete();
                foreach ($request->modules as $moduleKey) {
                    PlanModule::create([
                        'plan_id'    => $plan->id,
                        'module_key' => $moduleKey,
                    ]);
                }
            }
        });

        return response()->json([
            'message' => 'Plan actualizado.',
            'plan'    => $plan->fresh()->load(['prices', 'modules']),
        ]);
    }

    // ⚠️ Sin método destroy() — por diseño, los planes no se pueden eliminar.

    // ── Lista de módulos disponibles (para pintar los checkboxes en el frontend) ─
    public function modulosDisponibles()
    {
        return response()->json([
            ['key' => 'mi-equipo',        'label' => 'Mi equipo'],
            ['key' => 'membresia',        'label' => 'Mi membresía'],
            ['key' => 'comisiones',       'label' => 'Comisiones'],
            ['key' => 'ganancias',        'label' => 'Mis ganancias'],
            ['key' => 'plan-emprendedor', 'label' => 'Plan emprendedor'],
        ]);
    }
}