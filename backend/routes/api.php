<?php

use Illuminate\Support\Facades\Route;
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

/*
|--------------------------------------------------------------------------
| Rutas Públicas
|--------------------------------------------------------------------------
*/
Route::post('/login',          [AuthController::class, 'login']);
Route::post('/register',       [UserController::class, 'register']);
Route::post('/validar-codigo', [UserController::class, 'validarCodigo']);
Route::get('/anuncios',        [AnuncioController::class, 'index']);
Route::get('/testimonios',     [TestimonioController::class, 'publico']);

/*
|--------------------------------------------------------------------------
| Rutas Protegidas (requieren autenticación)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // ─── Autenticación y usuario ──────────────────────────────────────────────
    Route::post('/logout',              [AuthController::class, 'logout']);
    Route::get('/me',                   [AuthController::class, 'me']);
    Route::post('/onboarding/complete', [UserController::class, 'completeOnboarding']);

    // ─── Perfil de usuario ─────────────────────────────────────────────────────
    Route::get('/profile',               [ProfileController::class, 'show']);
    Route::post('/profile/update',       [ProfileController::class, 'update']);
    Route::post('/profile/photo',        [ProfileController::class, 'updatePhoto']);
    Route::delete('/profile/photo',      [ProfileController::class, 'deletePhoto']);
    Route::post('/profile/password',     [ProfileController::class, 'changePassword']);

    // ─── Cuentas ────────────────────────────────────────────────────────────────
    Route::get('/accounts',                     [AccountController::class, 'index']);
    Route::post('/accounts',                    [AccountController::class, 'store']);
    Route::get('/accounts/{account}',           [AccountController::class, 'show']);
    Route::post('/accounts/{account}/update',   [AccountController::class, 'update']);
    Route::delete('/accounts/{account}',        [AccountController::class, 'destroy']);
    Route::post('/accounts/{account}/primary',  [AccountController::class, 'setPrimary']);

    // ─── Categorías ────────────────────────────────────────────────────────────
    Route::get('/categories',                         [CategoryController::class, 'index']);
    Route::post('/categories',                        [CategoryController::class, 'store']);
    Route::post('/categories/{category}/update',      [CategoryController::class, 'update']);
    Route::delete('/categories/{category}',           [CategoryController::class, 'destroy']);

    // ─── Testimonios ───────────────────────────────────────────────────────────
    Route::get('/testimonios/mio',       [TestimonioController::class, 'mio']);
    Route::post('/testimonios',          [TestimonioController::class, 'guardar']);
    Route::delete('/testimonios/mio',    [TestimonioController::class, 'eliminarMio']);

    // ─── Transacciones ─────────────────────────────────────────────────────────
    Route::get('/transactions',                [TransactionController::class, 'index']);
    Route::post('/transactions',               [TransactionController::class, 'store']);
    Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy']);
    Route::get('/transactions/stats',          [TransactionController::class, 'stats']);
    Route::get('/transactions/history',        [TransactionController::class, 'history']);
    Route::get('/transactions/compare',        [TransactionController::class, 'compare']);

    // ─── Tickets (usuarios) ──────────────────────────────────────────────────
    Route::get('/tickets',                 [TicketController::class, 'index']);
    Route::post('/tickets',                [TicketController::class, 'store']);
    Route::get('/tickets/{ticket}',        [TicketController::class, 'show']);
    Route::post('/tickets/{ticket}/responder', [TicketController::class, 'responder']);

    // ─── Mi equipo ─────────────────────────────────────────────────────────────
    Route::get('/mi-equipo', [UserController::class, 'miEquipo']);

    // ─── Categorías de recordatorios ──────────────────────────────────────────
    Route::get('/reminder-categories',                             [ReminderCategoryController::class, 'index']);
    Route::post('/reminder-categories',                            [ReminderCategoryController::class, 'store']);
    Route::post('/reminder-categories/{reminderCategory}/update',  [ReminderCategoryController::class, 'update']);
    Route::delete('/reminder-categories/{reminderCategory}',       [ReminderCategoryController::class, 'destroy']);

    // ─── Pagos habituales ─────────────────────────────────────────────────────
    Route::get('/recurring-payments',                               [RecurringPaymentController::class, 'index']);
    Route::post('/recurring-payments',                              [RecurringPaymentController::class, 'store']);
    Route::post('/recurring-payments/{recurringPayment}/update',    [RecurringPaymentController::class, 'update']);
    Route::delete('/recurring-payments/{recurringPayment}',         [RecurringPaymentController::class, 'destroy']);
    Route::post('/recurring-payments/{recurringPayment}/toggle',    [RecurringPaymentController::class, 'toggleStatus']);
    Route::post('/recurring-payments/{recurringPayment}/mark',      [RecurringPaymentController::class, 'markLog']);
    Route::get('/recurring-payments/{recurringPayment}/logs',       [RecurringPaymentController::class, 'logs']);

    // ─── Notificaciones pendientes ──────────────────────────────────────────
    Route::get('/notifications/pending', [RecurringPaymentController::class, 'notifications']);

    // ─── Agenda ──────────────────────────────────────────────────────────────
    Route::prefix('agenda')->group(function () {
        Route::get('/resumen',              [AgendaController::class, 'resumen']);   // antes de {evento}
        Route::get('/',                     [AgendaController::class, 'index']);
        Route::post('/',                    [AgendaController::class, 'store']);
        Route::get('/{evento}',             [AgendaController::class, 'show']);
        Route::post('/{evento}/update',     [AgendaController::class, 'update']);
        Route::delete('/{evento}',          [AgendaController::class, 'destroy']);
        Route::post('/{evento}/estado',     [AgendaController::class, 'cambiarEstado']);
        Route::post('/{evento}/contactos',  [AgendaController::class, 'agregarContacto']);
        Route::delete('/{evento}/contactos/{contacto}', [AgendaController::class, 'eliminarContacto']);
        Route::post('/{evento}/notas',      [AgendaController::class, 'agregarNota']);
        Route::delete('/{evento}/notas/{nota}', [AgendaController::class, 'eliminarNota']);
        Route::post('/{evento}/archivos',   [AgendaController::class, 'subirArchivo']);
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
        Route::get('/users/arbol',         [UserController::class, 'arbol']);
        Route::get('/users',               [UserController::class, 'index']);
        Route::post('/users',              [UserController::class, 'store']);
        Route::post('/users/{user}/update',[UserController::class, 'update']);
        Route::delete('/users/{user}',     [UserController::class, 'destroy']);

        // ─── Estadísticas ──────────────────────────────────────────────────────
        Route::get('/admin/stats', [UserController::class, 'stats']);

        // ─── Testimonios (admin) ──────────────────────────────────────────────
        Route::get('/admin/testimonios',                           [TestimonioController::class, 'adminIndex']);
        Route::post('/admin/testimonios/{testimonio}/estado',      [TestimonioController::class, 'cambiarEstado']);
        Route::post('/admin/testimonios/{testimonio}/destacado',   [TestimonioController::class, 'toggleDestacado']);
        Route::delete('/admin/testimonios/{testimonio}',           [TestimonioController::class, 'adminEliminar']);

        // ─── Tickets (admin) ──────────────────────────────────────────────────
        Route::get('/admin/tickets',                    [TicketController::class, 'adminIndex']);
        Route::get('/admin/tickets/{ticket}',           [TicketController::class, 'adminShow']);
        Route::post('/admin/tickets/{ticket}/responder',[TicketController::class, 'adminResponder']);
        Route::post('/admin/tickets/{ticket}/estado',   [TicketController::class, 'cambiarEstado']);

        // ─── Anuncios (admin) ──────────────────────────────────────────────────
        Route::get('/admin/anuncios',                           [AnuncioController::class, 'adminIndex']);
        Route::post('/admin/anuncios',                          [AnuncioController::class, 'store']);
        Route::post('/admin/anuncios/{anuncio}/update',        [AnuncioController::class, 'update']);
        Route::delete('/admin/anuncios/{anuncio}',             [AnuncioController::class, 'destroy']);
        Route::post('/admin/anuncios/{anuncio}/toggle-anclado',[AnuncioController::class, 'toggleAnclado']);
        Route::post('/admin/anuncios/{anuncio}/imagen',        [AnuncioController::class, 'subirImagen']);
        Route::delete('/admin/anuncios/{anuncio}/imagen',      [AnuncioController::class, 'eliminarImagen']);
    });

});