<?php

namespace App\Services\Implementations;

use App\Models\User;
use App\Services\Interfaces\ProfileService;
use Exception;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileServiceImpl implements ProfileService
{
    public function getProfile(int $userId): User
    {
        return User::with('role')->findOrFail($userId);
    }

    public function updateProfile(int $userId, array $data): User
    {
        $user = User::findOrFail($userId);
        $user->update($data);
        return $user;
    }

    public function changePassword(int $userId, array $data): void
    {
        $user = User::findOrFail($userId);

        if (!Hash::check($data['current_password'], $user->password)) {
            throw new Exception("Current password does not match.", 422);
        }

        if ($data['new_password'] !== $data['confirm_password']) {
            throw new Exception("New passwords do not match.", 422);
        }

        if (strlen($data['new_password']) < 6) {
            throw new Exception("New password must be at least 6 characters.", 422);
        }

        $user->password = Hash::make($data['new_password']);
        $user->save();
    }

    public function setGravatarAvatar(int $userId): User
    {
        $user = User::findOrFail($userId);

        if ($user->avatar && str_contains($user->avatar, 'avatars/')) {
            Storage::disk('public')->delete($user->avatar);
        }

        $emailHash = md5(strtolower(trim($user->email)));
        $gravatarUrl = "https://www.gravatar.com/avatar/{$emailHash}?s=200&d=mp";

        $user->avatar = $gravatarUrl;
        $user->save();

        return $user;
    }

    public function uploadAvatar(int $userId, $file): User
    {
        $user = User::findOrFail($userId);

        if ($user->avatar && !str_contains($user->avatar, 'gravatar.com')) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $file->store('avatars', 'public');
        
        $user->avatar = $path;
        $user->save();

        return $user;
    }


}
