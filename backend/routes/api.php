<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// ── Públicas ──────────────────────────────────────────────────────────────────
Route::post('/login',  [AuthController::class, 'login']);

// ── Protegidas ────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get ('/me',     [AuthController::class, 'me']);
});