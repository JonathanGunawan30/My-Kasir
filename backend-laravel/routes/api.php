<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware("guest")->group(function () {
    Route::post('/login', [\App\Http\Controllers\AuthController::class, 'login']);
    Route::post('/register', [\App\Http\Controllers\AuthController::class, 'register']);
});

Route::post('/forgot-password', [\App\Http\Controllers\AuthController::class, 'sendResetLink']);
Route::post('/reset-password', [\App\Http\Controllers\AuthController::class, 'resetPassword']);

Route::middleware('auth:api')->group(function () {
    Route::get('/me', [\App\Http\Controllers\AuthController::class, 'me']);
    Route::post('/logout', [\App\Http\Controllers\AuthController::class, 'logout']);
    Route::post('/refresh', [\App\Http\Controllers\AuthController::class, 'refresh']);
});


Route::middleware("auth:api")->group(function () {

    Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'show']);
    Route::patch('/profile', [\App\Http\Controllers\ProfileController::class, 'update']);
    Route::post('/profile/change-password', [\App\Http\Controllers\ProfileController::class, 'changePassword']);
    Route::post('/profile/upload-avatar', [\App\Http\Controllers\ProfileController::class, 'uploadAvatar']);
    Route::post('/profile/set-gravatar', [\App\Http\Controllers\ProfileController::class, 'setGravatarAvatar']);

    Route::get('/roles/search', [\App\Http\Controllers\RoleController::class, 'search']);
    Route::get('/roles', [\App\Http\Controllers\RoleController::class, 'index']);
    Route::get('/roles/{id}', [\App\Http\Controllers\RoleController::class, 'show']);
    Route::patch('/roles/{id}', [\App\Http\Controllers\RoleController::class, 'update']);
    Route::delete('/roles/{id}', [\App\Http\Controllers\RoleController::class, 'destroy']);
    Route::post('/roles/{id}/attach-permissions', [\App\Http\Controllers\RoleController::class, 'attachPermissions']);
    Route::post('/roles/{id}/detach-permissions', [\App\Http\Controllers\RoleController::class, 'detachPermissions']);
    Route::post('/roles', [\App\Http\Controllers\RoleController::class, 'store']);

    Route::post("/users", [\App\Http\Controllers\UserController::class, 'store']);
    Route::get('/users', [\App\Http\Controllers\UserController::class, 'index']);
    Route::get('/users/current', [\App\Http\Controllers\UserController::class, 'current']);
    Route::get('/users/search', [\App\Http\Controllers\UserController::class, 'search']);
    Route::patch('/users/{id}', [\App\Http\Controllers\UserController::class, 'update']);
    Route::delete('/users/{id}', [\App\Http\Controllers\UserController::class, 'destroy']);
    Route::get('/users/{id}', [\App\Http\Controllers\UserController::class, 'show']);

    Route::post("/categories", [\App\Http\Controllers\CategoryController::class, 'store']);
    Route::get("/categories", [\App\Http\Controllers\CategoryController::class, 'index']);
    Route::get("/categories/search", [\App\Http\Controllers\CategoryController::class, 'search']);
    Route::patch("/categories/{id}", [\App\Http\Controllers\CategoryController::class, 'update']);
    Route::delete("/categories/{id}", [\App\Http\Controllers\CategoryController::class, 'destroy']);
    Route::get("/categories/{id}", [\App\Http\Controllers\CategoryController::class, 'show']);

    Route::post("/products", [\App\Http\Controllers\ProductController::class, 'store']);
    Route::get("/products", [\App\Http\Controllers\ProductController::class, 'index']);
    Route::get("/products/search", [\App\Http\Controllers\ProductController::class, 'search']);
    Route::patch("/products/{id}", [\App\Http\Controllers\ProductController::class, 'update']);
    Route::delete("/products/{id}", [\App\Http\Controllers\ProductController::class, 'destroy']);
    Route::get("/products/{id}", [\App\Http\Controllers\ProductController::class, 'show']);

    Route::post('/orders', [\App\Http\Controllers\OrderController::class, 'store']);
    Route::get('/orders', [\App\Http\Controllers\OrderController::class, 'index']);
    Route::get('/orders/search', [\App\Http\Controllers\OrderController::class, 'search']);
    Route::patch('/orders/{id}', [\App\Http\Controllers\OrderController::class, 'update']);
    Route::delete('/orders/{id}', [\App\Http\Controllers\OrderController::class, 'destroy']);
    Route::post('/orders/{id}/details', [\App\Http\Controllers\OrderController::class, 'addDetail']);
    Route::delete('/orders/{orderId}/details/{detailId}', [\App\Http\Controllers\OrderController::class, 'removeDetail']);
    Route::get('/orders/{id}', [\App\Http\Controllers\OrderController::class, 'show']);
    Route::patch('/orders/{id}/status', [\App\Http\Controllers\OrderController::class, 'updateStatus']);

    Route::post('/customers', [\App\Http\Controllers\CustomerController::class, 'store']);
    Route::get('/customers', [\App\Http\Controllers\CustomerController::class, 'index']);
    Route::get('/customers/search', [\App\Http\Controllers\CustomerController::class, 'search']);
    Route::patch('/customers/{id}', [\App\Http\Controllers\CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [\App\Http\Controllers\CustomerController::class, 'destroy']);
    Route::get('/customers/{id}', [\App\Http\Controllers\CustomerController::class, 'show']);

    Route::get('/config/rewards', [\App\Http\Controllers\ConfigController::class, 'getRewardTiers']);

});
