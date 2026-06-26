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

// ── Públicas ──────────────────────────────────────────────────────────────────
Route::post('/login',          [AuthController::class, 'login']);
Route::post('/register',       [UserController::class, 'register']);
Route::post('/validar-codigo', [UserController::class, 'validarCodigo']);

Route::get('/testimonios', [TestimonioController::class, 'publico']);
// ── Protegidas ────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout',              [AuthController::class, 'logout']);
    Route::get ('/me',                  [AuthController::class, 'me']);
    Route::post('/onboarding/complete', [UserController::class, 'completeOnboarding']);

    // ── Cuentas (cada usuario gestiona las suyas) ─────────────────────────────
    Route::get   ('/accounts',                    [AccountController::class, 'index']);
    Route::post  ('/accounts',                    [AccountController::class, 'store']);
    Route::get   ('/accounts/{account}',          [AccountController::class, 'show']);
    Route::post  ('/accounts/{account}/update',   [AccountController::class, 'update']);
    Route::delete('/accounts/{account}',          [AccountController::class, 'destroy']);
    Route::post  ('/accounts/{account}/primary',  [AccountController::class, 'setPrimary']);

     // Categorías
    Route::get   ('/categories',              [CategoryController::class, 'index']);
    Route::post  ('/categories',              [CategoryController::class, 'store']);
    Route::post  ('/categories/{category}/update', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}',   [CategoryController::class, 'destroy']);
  Route::get   ('/testimonios/mio',    [TestimonioController::class, 'mio']);
    Route::post  ('/testimonios',        [TestimonioController::class, 'guardar']);
    Route::delete('/testimonios/mio',    [TestimonioController::class, 'eliminarMio']);
    // Transacciones
    Route::get   ('/transactions',            [TransactionController::class, 'index']);
    Route::post  ('/transactions',            [TransactionController::class, 'store']);
    Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy']);
    Route::get   ('/transactions/stats',      [TransactionController::class, 'stats']);
    Route::get('/transactions/history', [TransactionController::class, 'history']);
Route::get('/transactions/compare', [TransactionController::class, 'compare']);
Route::get ('/tickets',                        [TicketController::class, 'index']);
Route::post('/tickets',                        [TicketController::class, 'store']);
Route::get ('/tickets/{ticket}',               [TicketController::class, 'show']);
Route::post('/tickets/{ticket}/responder',     [TicketController::class, 'responder']);
 
// ── Categorías de recordatorios ───────────────────────────────────────────────
Route::get   ('/reminder-categories',                        [ReminderCategoryController::class, 'index']);
Route::post  ('/reminder-categories',                        [ReminderCategoryController::class, 'store']);
Route::post  ('/reminder-categories/{reminderCategory}/update', [ReminderCategoryController::class, 'update']);
Route::delete('/reminder-categories/{reminderCategory}',     [ReminderCategoryController::class, 'destroy']);
 
// ── Pagos habituales ──────────────────────────────────────────────────────────
Route::get   ('/recurring-payments',                          [RecurringPaymentController::class, 'index']);
Route::post  ('/recurring-payments',                          [RecurringPaymentController::class, 'store']);
Route::post  ('/recurring-payments/{recurringPayment}/update',[RecurringPaymentController::class, 'update']);
Route::delete('/recurring-payments/{recurringPayment}',       [RecurringPaymentController::class, 'destroy']);
Route::post  ('/recurring-payments/{recurringPayment}/toggle',[RecurringPaymentController::class, 'toggleStatus']);
Route::post  ('/recurring-payments/{recurringPayment}/mark',  [RecurringPaymentController::class, 'markLog']);
Route::get   ('/recurring-payments/{recurringPayment}/logs',  [RecurringPaymentController::class, 'logs']);
 
// ── Notificaciones pendientes (campana) ───────────────────────────────────────
Route::get   ('/notifications/pending',                       [RecurringPaymentController::class, 'notifications']);
    // ── Solo admin ────────────────────────────────────────────────────────────
    Route::middleware('is_admin')->group(function () {
        Route::get   ('/users/arbol',         [UserController::class, 'arbol']);
        Route::get   ('/users',               [UserController::class, 'index']);
        Route::post  ('/users',               [UserController::class, 'store']);
        Route::post  ('/users/{user}/update', [UserController::class, 'update']);
        Route::delete('/users/{user}',        [UserController::class, 'destroy']);

         Route::get   ('/admin/testimonios',                          [TestimonioController::class, 'adminIndex']);
        Route::post  ('/admin/testimonios/{testimonio}/estado',      [TestimonioController::class, 'cambiarEstado']);
        Route::post  ('/admin/testimonios/{testimonio}/destacado',   [TestimonioController::class, 'toggleDestacado']);
        Route::delete('/admin/testimonios/{testimonio}',             [TestimonioController::class, 'adminEliminar']);

        Route::get ('/admin/tickets',                    [TicketController::class, 'adminIndex']);
    Route::get ('/admin/tickets/{ticket}',           [TicketController::class, 'adminShow']);
    Route::post('/admin/tickets/{ticket}/responder', [TicketController::class, 'adminResponder']);
    Route::post('/admin/tickets/{ticket}/estado',    [TicketController::class, 'cambiarEstado']);
    });
});