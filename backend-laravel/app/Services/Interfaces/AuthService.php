<?php

namespace App\Services\Interfaces;

use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;

interface AuthService
{
    function register(array $data): User;
    function login(array $data): Authenticatable;

}
