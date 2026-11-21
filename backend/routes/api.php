<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\WalletController;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::post('/register', RegisterController::class);
    Route::post('/login', LoginController::class)->middleware('throttle:login');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', LogoutController::class);
    Route::get('/user', fn (Request $r) => new UserResource($r->user()));
    Route::patch('/wallets/{wallet}/archive', [WalletController::class, 'archive']);
    Route::patch('/categories/{category}/archive', [CategoryController::class, 'archive']);
    Route::apiResource('wallets', WalletController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('budgets', BudgetController::class);
    Route::post('/transactions/{transaction}/restore', [TransactionController::class, 'restore']);
    Route::apiResource('transactions', TransactionController::class);
    Route::post('/transfers/{transfer}/restore', [TransferController::class, 'restore']);
    Route::apiResource('transfers', TransferController::class)->only(['index', 'store', 'show', 'destroy']);
    Route::get('/dashboard', DashboardController::class);
});
