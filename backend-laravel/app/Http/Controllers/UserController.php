<?php

namespace App\Http\Controllers;

use App\Exceptions\UserDeleteSelfException;
use App\Exceptions\UserHasOrdersException;
use App\Http\Requests\CreateUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Services\Interfaces\UserService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    protected $userService;
    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    public function store(CreateUserRequest $request)
    {
        try {
            $validated = $request->validated();

            $user = $this->userService->create($validated);

            $user->assignRole($validated['role']);

            return response()->json([
                'data' => $user->load('roles'),
                'message' => 'User created successfully with role and status.',
                'statusCode' => 201
            ], 201);
        } catch (\Throwable $th) {
            return response()->json([
                "errors" => [
                    "message" => "Something went wrong " . $th->getMessage()
                ],
                "statusCode" => 500
            ], 500);
        }
    }

    public function index()
    {
        $users = User::with('roles')->get();

        return response()->json([
            'data' => $users,
            'message' => 'All users retrieved successfully.',
            'statusCode' => 200
        ]);
    }

    public function show($id)
    {
        try {
            $user = $this->userService->getUserById($id);
            $user->load('roles');
            return response()->json([
                'data' => $user,
                'message' => 'User retrieved successfully.',
                'statusCode' => 200
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                "errors" => [
                    "message" => "User not found"
                ],
                "statusCode" => 404
            ], 404);
        }
        catch (\Throwable $e){
            return response()->json([
                "errors" => [
                    "message" => "Something went wrong.",
                ],
                "statusCode" => 500
            ], 500);
        }
    }

    public function search(Request $request)
    {
        $filters = $request->only(['name', 'status', 'role']);

        $users = $this->userService->searchUsers($filters);

        if ($users->isEmpty()) {
            return response()->json([
                'errors' => [
                    'message' => 'User not found.',
                ],
                'statusCode' => 404
            ], 404);
        }

        return response()->json([
            'data' => $users,
            'message' => 'User search result retrieved successfully.',
            'statusCode' => 200
        ]);
    }

    public function update(UpdateUserRequest $request, $id)
    {
        try {
            $request->validated();
            $update = $this->userService->update($request, $id);
            return response()->json([
                'data' => $update,
                'message' => 'User updated successfully.',
                'statusCode' => 200,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'errors' => ['message' => 'User not found.'],
                'statusCode' => 404,
            ], 404);
        } catch (\Exception $e){
            return response()->json([
                "errors" => [
                    "message" => "You cannot change your own status"
                ],
                "statusCode" => 403
            ], 403);
        }
        catch (\Throwable $e) {
            return response()->json([
                "errors" => [
                    "message" => "Something went wrong " . $e->getMessage(),
                ],
                "statusCode" => 500
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $this->userService->harddelete($id);
            return response()->json([
                'data' => [
                    'message' => 'User deleted successfully.'
                ],
                'statusCode' => 200,
            ]);
        } catch (UserDeleteSelfException $e){
            return response()->json([
                'errors' => ['message' => $e->getMessage()],
                'statusCode' => 403,
            ], 403);
        }
        catch (ModelNotFoundException $e) {
            return response()->json([
                'errors' => ['message' => 'User not found.'],
                'statusCode' => 404,
            ], 404);
        } catch (UserHasOrdersException $e){
            return response()->json([
                'errors' => ['message' => $e->getMessage()],
                'statusCode' => 400,
            ], 400);
        }
        catch (\Throwable $e) {
            return response()->json([
                "errors" => [
                    "message" => "Something went wrong",
                ],
                "statusCode" => 500
            ], 500);
        }
    }

    public function current(Request $request)
    {
        try {
            $user = Auth::user();

            return response()->json([
                'data' => $user->load('roles'),
                'message' => 'Current user fetched successfully.',
                'statusCode' => 200,
            ]);
        } catch(\Throwable $e) {
            return response()->json([
                'errors' => [
                    'message' => 'Something went wrong.',
                ],
                "statusCode" => 500
            ], 500);
        }
    }
}
