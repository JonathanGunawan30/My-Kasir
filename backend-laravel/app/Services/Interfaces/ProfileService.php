<?php

namespace App\Services\Interfaces;

use App\Models\User;
use Illuminate\Http\UploadedFile;

interface ProfileService
{
    public function getProfile(int $userId): User;
    public function updateProfile(int $userId, array $data): User;
    public function changePassword(int $userId, array $data): void;
    public function setGravatarAvatar(int $userId): User;
    public function uploadAvatar(int $userId, UploadedFile $file): User;
}
