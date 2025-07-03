<?php

namespace App\Services\Interfaces;

interface UserService
{
    public function create(array $validated);
    public function getUserById($id);
    public function searchUsers(array $filters);
    public function update( $request, $id);
    public function harddelete($id);
}
