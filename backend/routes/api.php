<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SprintController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskCommentController;
use App\Http\Controllers\TaskHistoryController;
use Illuminate\Support\Facades\Route;

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

Route::middleware('auth:sanctum')
    ->prefix('workspaces/{workspaceId}/tasks')
    ->group(function () {
        Route::get('/', [TaskController::class, 'index']);
        Route::post('/', [TaskController::class, 'store']);
        Route::get('/backlog', [TaskController::class, 'backlog']);
        Route::post('/reorder', [TaskController::class, 'reorder']);
        Route::get('/{id}', [TaskController::class, 'show']);
        Route::patch('/{id}', [TaskController::class, 'update']);
        Route::delete('/{id}', [TaskController::class, 'destroy']);
        Route::patch('/{id}/status', [TaskController::class, 'updateStatus']);
        Route::post('/{id}/block', [TaskController::class, 'block']);
        Route::post('/{id}/unblock', [TaskController::class, 'unblock']);
        Route::post('/{id}/move', [TaskController::class, 'move']);
        Route::get('/{id}/comments', [TaskCommentController::class, 'index']);
        Route::post('/{id}/comments', [TaskCommentController::class, 'store']);
        Route::patch('/{id}/comments/{commentId}', [TaskCommentController::class, 'update']);
        Route::delete('/{id}/comments/{commentId}', [TaskCommentController::class, 'destroy']);
        Route::get('/{id}/history', [TaskHistoryController::class, 'index']);
    });
