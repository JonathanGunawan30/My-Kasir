<?php

namespace App\Http\Controllers;

use App\Http\Requests\AuthLoginRequest;
use App\Http\Requests\AuthRegisterRequest;
use App\Http\Requests\UserResetPasswordRequest;
use App\Http\Requests\UserSendResetLinkRequest;
use App\Http\Resources\AuthResource;
use App\Http\Resources\RegisterResource;
use App\Services\Interfaces\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register(AuthRegisterRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $this->authService->register($data);
        return (new RegisterResource($user))->additional([
            "statusCode" => 201,
        ])->response()->setStatusCode(201);
    }

    public function login(AuthLoginRequest $request): AuthResource
    {
        $data = $request->validated();

        $user = $this->authService->login($data);
        $user->load('roles', 'permissions');
        return (new AuthResource($user))->additional([
            "statusCode" => 200,
        ]);
    }

    public function sendResetLink(UserSendResetLinkRequest $request): JsonResponse
    {
        $request->validated();

        Password::sendResetLink($request->only('email'));

        return response()->json(['message' => 'Reset password link sent.'], 200);

    }

    public function resetPassword(UserResetPasswordRequest $request): JsonResponse
    {
        $request->validated();

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => 'Password has been reset successfully.'], 200)
            : response()->json(['errors' => ['message' => 'Invalid token or email.']], 400);
    }

}
