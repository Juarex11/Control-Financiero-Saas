<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AccountController;

// ── Públicas ──────────────────────────────────────────────────────────────────
Route::post('/login',          [AuthController::class, 'login']);
Route::post('/register',       [UserController::class, 'register']);
Route::post('/validar-codigo', [UserController::class, 'validarCodigo']);

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

    // ── Solo admin ────────────────────────────────────────────────────────────
    Route::middleware('is_admin')->group(function () {
        Route::get   ('/users/arbol',         [UserController::class, 'arbol']);
        Route::get   ('/users',               [UserController::class, 'index']);
        Route::post  ('/users',               [UserController::class, 'store']);
        Route::post  ('/users/{user}/update', [UserController::class, 'update']);
        Route::delete('/users/{user}',        [UserController::class, 'destroy']);
    });
});