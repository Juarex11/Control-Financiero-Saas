<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request; // <-- 👈 Agregado: necesario para la ruta /mi-plan
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\ReminderCategoryController;
use App\Http\Controllers\RecurringPaymentController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\TestimonioController;
use App\Http\Controllers\AnuncioController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AgendaController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\DebtController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\Admin\SubscriptionController;

/*
|--------------------------------------------------------------------------
| Rutas Públicas (sin autenticación)
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [UserController::class, 'register']);
Route::post('/validar-codigo', [UserController::class, 'validarCodigo']);
Route::get('/anuncios', [AnuncioController::class, 'index']);
Route::get('/testimonios', [TestimonioController::class, 'publico']);

/*
|--------------------------------------------------------------------------
| Rutas Protegidas (requieren autenticación con Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // ─── Autenticación y usuario ──────────────────────────────────────────────
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/onboarding/complete', [UserController::class, 'completeOnboarding']);

    // ─── Plan activo del usuario ──────────────────────────────────────────────
    Route::get('/mi-plan', function (Request $request) {
        $sub = $request->user()->activeSubscription()->with('plan.modules', 'plan.prices')->first();
        return response()->json($sub);
    });

    // ─── Perfil de usuario ─────────────────────────────────────────────────────
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'show']);
        Route::post('/update', [ProfileController::class, 'update']);
        Route::post('/photo', [ProfileController::class, 'updatePhoto']);
        Route::delete('/photo', [ProfileController::class, 'deletePhoto']);
        Route::post('/password', [ProfileController::class, 'changePassword']);
    });

    // ─── Cuentas ────────────────────────────────────────────────────────────────
    Route::prefix('accounts')->group(function () {
        Route::get('/', [AccountController::class, 'index']);
        Route::post('/', [AccountController::class, 'store']);
        Route::get('/{account}', [AccountController::class, 'show']);
        Route::post('/{account}/update', [AccountController::class, 'update']);
        Route::delete('/{account}', [AccountController::class, 'destroy']);
        Route::post('/{account}/primary', [AccountController::class, 'setPrimary']);
    });

    // ─── Categorías ────────────────────────────────────────────────────────────
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index']);
        Route::post('/', [CategoryController::class, 'store']);
        Route::post('/{category}/update', [CategoryController::class, 'update']);
        Route::delete('/{category}', [CategoryController::class, 'destroy']);
    });

    // ─── Metas ──────────────────────────────────────────────────────────────────
    Route::prefix('goals')->group(function () {
        Route::get('/', [GoalController::class, 'index']);
        Route::post('/', [GoalController::class, 'store']);
        Route::get('/{goal}', [GoalController::class, 'show']);
        Route::post('/{goal}/update', [GoalController::class, 'update']);
        Route::delete('/{goal}', [GoalController::class, 'destroy']);
        Route::post('/{goal}/abonar', [GoalController::class, 'abonar']);
    });

    // ─── Deudas ─────────────────────────────────────────────────────────────────
    Route::prefix('debts')->group(function () {
        Route::get('/', [DebtController::class, 'index']);
        Route::post('/', [DebtController::class, 'store']);
        Route::get('/{debt}', [DebtController::class, 'show']);
        Route::post('/{debt}/update', [DebtController::class, 'update']);
        Route::delete('/{debt}', [DebtController::class, 'destroy']);
        Route::post('/{debt}/pagar', [DebtController::class, 'pagar']);
    });

    // ─── Transacciones ─────────────────────────────────────────────────────────
    Route::prefix('transactions')->group(function () {
        Route::get('/', [TransactionController::class, 'index']);
        Route::post('/', [TransactionController::class, 'store']);
        Route::delete('/{transaction}', [TransactionController::class, 'destroy']);
        Route::get('/stats', [TransactionController::class, 'stats']);
        Route::get('/history', [TransactionController::class, 'history']);
        Route::get('/compare', [TransactionController::class, 'compare']);
    });

    // ─── Testimonios ───────────────────────────────────────────────────────────
    Route::prefix('testimonios')->group(function () {
        Route::get('/mio', [TestimonioController::class, 'mio']);
        Route::post('/', [TestimonioController::class, 'guardar']);
        Route::delete('/mio', [TestimonioController::class, 'eliminarMio']);
    });

    // ─── Tickets (usuarios) ──────────────────────────────────────────────────
    Route::prefix('tickets')->group(function () {
        Route::get('/', [TicketController::class, 'index']);
        Route::post('/', [TicketController::class, 'store']);
        Route::get('/{ticket}', [TicketController::class, 'show']);
        Route::post('/{ticket}/responder', [TicketController::class, 'responder']);
    });

    // ─── Mi equipo ─────────────────────────────────────────────────────────────
    // ✅ Ahora con middleware que valida el plan (el único módulo con backend real)
    Route::get('/mi-equipo', [UserController::class, 'miEquipo'])
        ->middleware('plan.access:mi-equipo');

    // ─── Categorías de recordatorios ──────────────────────────────────────────
    Route::prefix('reminder-categories')->group(function () {
        Route::get('/', [ReminderCategoryController::class, 'index']);
        Route::post('/', [ReminderCategoryController::class, 'store']);
        Route::post('/{reminderCategory}/update', [ReminderCategoryController::class, 'update']);
        Route::delete('/{reminderCategory}', [ReminderCategoryController::class, 'destroy']);
    });

    // ─── Pagos habituales ─────────────────────────────────────────────────────
    Route::prefix('recurring-payments')->group(function () {
        Route::get('/', [RecurringPaymentController::class, 'index']);
        Route::post('/', [RecurringPaymentController::class, 'store']);
        Route::post('/{recurringPayment}/update', [RecurringPaymentController::class, 'update']);
        Route::delete('/{recurringPayment}', [RecurringPaymentController::class, 'destroy']);
        Route::post('/{recurringPayment}/toggle', [RecurringPaymentController::class, 'toggleStatus']);
        Route::post('/{recurringPayment}/mark', [RecurringPaymentController::class, 'markLog']);
        Route::get('/{recurringPayment}/logs', [RecurringPaymentController::class, 'logs']);
    });

    // ─── Notificaciones pendientes ──────────────────────────────────────────
    Route::get('/notifications/pending', [RecurringPaymentController::class, 'notifications']);

    // ─── Agenda ──────────────────────────────────────────────────────────────
    Route::prefix('agenda')->group(function () {
        Route::get('/resumen', [AgendaController::class, 'resumen']);
        Route::get('/', [AgendaController::class, 'index']);
        Route::post('/', [AgendaController::class, 'store']);
        Route::get('/{evento}', [AgendaController::class, 'show']);
        Route::post('/{evento}/update', [AgendaController::class, 'update']);
        Route::delete('/{evento}', [AgendaController::class, 'destroy']);
        Route::post('/{evento}/estado', [AgendaController::class, 'cambiarEstado']);
        Route::post('/{evento}/contactos', [AgendaController::class, 'agregarContacto']);
        Route::delete('/{evento}/contactos/{contacto}', [AgendaController::class, 'eliminarContacto']);
        Route::post('/{evento}/notas', [AgendaController::class, 'agregarNota']);
        Route::delete('/{evento}/notas/{nota}', [AgendaController::class, 'eliminarNota']);
        Route::post('/{evento}/archivos', [AgendaController::class, 'subirArchivo']);
        Route::delete('/{evento}/archivos/{archivo}', [AgendaController::class, 'eliminarArchivo']);
    });

    // ─── Anuncios (reaccionar) ──────────────────────────────────────────────
    Route::post('/anuncios/{anuncio}/reaccionar', [AnuncioController::class, 'reaccionar']);

    /*
    |--------------------------------------------------------------------------
    | Rutas exclusivas para Administradores
    |--------------------------------------------------------------------------
    */
    Route::middleware('is_admin')->group(function () {

        // ─── Usuarios ──────────────────────────────────────────────────────────
        Route::prefix('users')->group(function () {
            Route::get('/arbol', [UserController::class, 'arbol']);
            Route::get('/', [UserController::class, 'index']);
            Route::post('/', [UserController::class, 'store']);
            Route::post('/{user}/update', [UserController::class, 'update']);
            Route::delete('/{user}', [UserController::class, 'destroy']);
        });

        // ─── Planes y suscripciones (solo admin) ──────────────────────────────
        Route::get('/admin/planes', [PlanController::class, 'index']);
        Route::get('/admin/planes/modulos', [PlanController::class, 'modulosDisponibles']);
        Route::get('/admin/planes/{plan}', [PlanController::class, 'show']);
        Route::post('/admin/planes', [PlanController::class, 'store']);
        Route::post('/admin/planes/{plan}/update', [PlanController::class, 'update']);

        Route::get('/admin/usuarios/{user}/suscripcion', [SubscriptionController::class, 'show']);
        Route::post('/admin/usuarios/{user}/suscripcion', [SubscriptionController::class, 'asignar']);

        // ─── Estadísticas ──────────────────────────────────────────────────────
        Route::get('/admin/stats', [UserController::class, 'stats']);

        // ─── Testimonios (admin) ──────────────────────────────────────────────
        Route::prefix('admin/testimonios')->group(function () {
            Route::get('/', [TestimonioController::class, 'adminIndex']);
            Route::post('/{testimonio}/estado', [TestimonioController::class, 'cambiarEstado']);
            Route::post('/{testimonio}/destacado', [TestimonioController::class, 'toggleDestacado']);
            Route::delete('/{testimonio}', [TestimonioController::class, 'adminEliminar']);
        });

        // ─── Tickets (admin) ──────────────────────────────────────────────────
        Route::prefix('admin/tickets')->group(function () {
            Route::get('/', [TicketController::class, 'adminIndex']);
            Route::get('/{ticket}', [TicketController::class, 'adminShow']);
            Route::post('/{ticket}/responder', [TicketController::class, 'adminResponder']);
            Route::post('/{ticket}/estado', [TicketController::class, 'cambiarEstado']);
        });

        // ─── Anuncios (admin) ──────────────────────────────────────────────────
        Route::prefix('admin/anuncios')->group(function () {
            Route::get('/', [AnuncioController::class, 'adminIndex']);
            Route::post('/', [AnuncioController::class, 'store']);
            Route::post('/{anuncio}/update', [AnuncioController::class, 'update']);
            Route::delete('/{anuncio}', [AnuncioController::class, 'destroy']);
            Route::post('/{anuncio}/toggle-anclado', [AnuncioController::class, 'toggleAnclado']);
            Route::post('/{anuncio}/imagen', [AnuncioController::class, 'subirImagen']);
            Route::delete('/{anuncio}/imagen', [AnuncioController::class, 'eliminarImagen']);
        });
    });
});