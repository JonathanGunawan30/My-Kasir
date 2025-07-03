<?php

namespace App\Services\Implementations;

use App\Exceptions\UserDeleteSelfException;
use App\Exceptions\UserHasOrdersException;
use App\Models\User;
use App\Services\Interfaces\UserService;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Hash;

class UserServiceImpl implements UserService
{
    public function create(array $validated)
    {
        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status'   => $validated['status'],
        ]);

        if (!empty($validated['role'])) {
            $user->assignRole($validated['role']);
        }

        return $user->load('roles');
    }

    public function getUserById($id)
    {
        $user = User::find($id);

        if(!$user){
            throw new ModelNotFoundException();
        }

        return $user;
    }

    public function searchUsers(array $filters)
    {
        $query = User::with('roles');

        if (!empty($filters['name'])) {
            $query->where('name', 'like', '%' . $filters['name'] . '%');
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['role'])) {
            $query->whereHas('roles', function ($q) use ($filters) {
                $q->where('name', $filters['role']);
            });
        }

        return $query->get();
    }

    public function update($request, $id)
    {
        $user = $this->getUserById($id);

        if (auth()->id() == $id && $request->has('status') && $request->status !== $user->status) {
            throw new \Exception("You cannot change your own status.");
        }

        $user->update($request->only(['name', 'status', 'email', 'password', 'role']));

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
            $user->save();
        }

        if ($request->filled('role')) {
            $user->syncRoles($request->role);
        }

        return $user->load('roles');
    }


    public function harddelete($id)
    {
        if (auth()->id() == $id) {
            throw new UserDeleteSelfException();
        }
        $user = $this->getUserById($id);
        if($user->orders()->exists()){
            throw new UserHasOrdersException();
        }
        $user->syncRoles([]);
        $user->forceDelete();
        return $user->load('roles');
    }
}
