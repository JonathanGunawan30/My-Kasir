<?php

namespace App\Http\Controllers;

use App\Http\Requests\AvatarRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\AvatarResource;
use App\Services\Interfaces\ProfileService;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    protected ProfileService $profileService;

    public function __construct(ProfileService $profileService)
    {
        $this->profileService = $profileService;
    }

    public function show(Request $request)
    {
        try {
            $user = $this->profileService->getProfile($request->user()->id);
            return response()->json([
                "data" => $user,
                "message" => "Profile fetched successfully.",
                "statusCode" => 200
            ]);
        } catch (\Throwable $e){
            return response()->json([
                "errors" => [
                    "message" => "Something went wrong",
                ],
                "statusCode" => 500,
            ], 500);
        }
    }

    public function update(UpdateProfileRequest $request)
    {
        try {
            $data = $request->validated();

            $user = $this->profileService->updateProfile($request->user()->id, $data);
            return response()->json([
                "data" => $user,
                "message" => "Profile updated successfully.",
                "statusCode" => 200
            ]);
        } catch (ModelNotFoundException $e){
            return response()->json([
                "errors" => [
                    "message" => "User not found",
                ],
                "statusCode" => 404,
            ], 404);
        }
        catch (\Throwable $e){
            return response()->json([
                "errors" => [
                    "message" => "Something went wrong",
                ],
                "statusCode" => 500,
            ], 500);
        }
    }


    public function changePassword(ChangePasswordRequest $request)
    {
        $data = $request->validated();

        try {
            $this->profileService->changePassword($request->user()->id, [
                'current_password' => $data['current_password'],
                'new_password' => $data['new_password'],
                'confirm_password' => $data['new_password_confirmation'],
            ]);

            return response()->json([
                "data" => [
                    "message" => "Password changed successfully."
                ],
                "statusCode" => 200
            ]);
        } catch (Exception $e) {
            return response()->json([
                "errors" => [
                    "message" => $e->getMessage(),
                ],
                "statusCode" => 400,
            ], 400);
        } catch (\Throwable $e) {
            return response()->json([
                'errors' => [
                    "message" => "Something went wrong",
                ],
                "statusCode" => 500,
            ], 500);
        }
    }

    public function setGravatarAvatar(Request $request)
    {
        try {
            $user = $this->profileService->setGravatarAvatar($request->user()->id);
            return response()->json([
                "data" => $user,
                "message" => "Avatar updated to Gravatar successfully.",
                "statusCode" => 200,
            ]);
        } catch (ModelNotFoundException $e){
            return response()->json([
                "errors" => [
                    "message" => "User not found",
                ],
                "statusCode" => 404,
            ], 404);
        }
        catch (Exception $e) {
            return response()->json([
                "errors" => [
                    "message" => $e->getMessage(),
                ],
                "statusCode" => 500,
            ], 500);
        }
    }

    public function uploadAvatar(AvatarRequest $request)
    {
        $data = $request->validated();

        try {
            $user = $this->profileService->uploadAvatar($request->user()->id, $data['avatar']);

            return (new AvatarResource($user))->additional([
                "message" => "Avatar updated successfully.",
                "statusCode" => 200,
            ]);
        } catch (Exception $e) {
            return response()->json([
                "errors" => [
                    "message" => $e->getMessage(),
                ],
                "statusCode" => 400,
            ], 400);
        } catch (\Throwable $e) {
            return response()->json([
                'errors' => [
                    "message" => "Something went wrong ",
                ],
                "statusCode" => 500,
            ], 500);
        }
    }

}
