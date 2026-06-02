<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\UserController;
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



