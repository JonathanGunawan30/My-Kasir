<?php

namespace App\Services\Implementations;

use App\Models\User;
use App\Services\Interfaces\AuthService;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Contracts\Auth\Authenticatable;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthServiceImpl implements AuthService
{
    function register(array $data): User
    {
        $data['password'] = Hash::make($data['password']);
        $data['status'] = 'inactive';
        return User::create($data);
    }

    function login(array $data): Authenticatable
    {
        if (!$token = JWTAuth::attempt(['email' => $data['email'], 'password' => $data['password']])) {
            throw new HttpResponseException(response([
                "errors" => [
                    "message" => ["Email or password is wrong"],
                ],
                "statusCode" => 401
            ], 401));
        }

        $user = Auth::user();

        if ($user->status !== 'active') {
            throw new HttpResponseException(response([
                "errors" => [
                    "message" => ["Your account is inactive. Please contact the administrator."]
                ],
                "statusCode" => 403
            ], 403));
        }

        $user->load('roles', 'permissions');
        $user->token = $token;
        return $user;

    }
}
