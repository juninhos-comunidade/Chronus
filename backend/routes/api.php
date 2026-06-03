<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SprintController;
use Illuminate\Broadcasting\Broadcasters\UsePusherChannelConventions;
use Illuminate\Support\Facades\Auth;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/google', [AuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });
});

Route::middleware('auth:sanctum')->prefix('users')->group(function () {
    Route::get('/me', [UserController::class, 'showMe']);
    Route::patch('/me', [UserController::class, 'updateMe']);
    Route::delete('/me', [UserController::class, 'destroyMe']);
});

Route::middleware('auth:sanctum')
    ->prefix('workspaces/{workspaceId}/sprints')
    ->group(function () {
        Route::get('/', [SprintController::class, 'index']);
        Route::post('/', [SprintController::class, 'store']);
        Route::get('/active', [SprintController::class, 'active']);
        Route::get('/{id}', [SprintController::class, 'show']);
        Route::patch('/{id}', [SprintController::class, 'update']);
        Route::post('/{id}/start', [SprintController::class, 'start']);
        Route::post('/{id}/complete', [SprintController::class, 'complete']);
        Route::post('/{id}/cancel', [SprintController::class, 'cancel']);
        Route::get('/{id}/metrics', [SprintController::class, 'metrics']);
    });


