<?php

namespace App\Http\Controllers;

use App\Exceptions\AssignRoleException;
use App\Exceptions\PermissionNotFoundException;
use App\Http\Requests\AttachDetachRoleRequest;
use App\Http\Requests\CreateRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Services\Interfaces\RoleService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    protected $roleService;

    public function __construct(RoleService $roleService)
    {
        $this->roleService = $roleService;
    }
    public function index()
    {
        $roles = Role::with("permissions")->get();

        return response()->json([
            'data' => $roles,
            'message' => 'Roles retrieved successfully',
            'statusCode' => 200
        ]);
    }

    public function store(CreateRoleRequest $request)
    {
        $validated = $request->validated();

        $result = $this->roleService->createRole($validated);

        return response()->json([
            'data' => [
                'role' => $result['role']->name,
                'permissions' => $result['permissions']
            ],
            'message' => 'Role created successfully',
            'statusCode' => 201
        ], 201);
    }

    public function show($id)
    {
        try {
            $role = $this->roleService->getRoleById($id);
            return response()->json([
                'data' => $role,
                'message' => 'Role retrieved successfully',
                'statusCode' => 200
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                "errors" => [
                    "message" => "Role not found"
                ],
                "statusCode" => 404
            ], 404);
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

    public function search(Request $request)
    {
        $query = $request->query('name');

        $roles = $this->roleService->searchRoles($query);

        if ($roles->isEmpty()) {
            return response()->json([
                'errors' => [
                    'message' => 'Roles not found'
                ],
                'statusCode' => 404
            ], 404);
        }

        return response()->json([
            'data' => $roles,
            'message' => 'Roles retrieved successfully.',
            'statusCode' => 200,
        ]);
    }

    public function update(UpdateRoleRequest $request, $id)
    {
        $validated = $request->validated();

        try {
            $role = $this->roleService->updateRole($id, $validated);

            return response()->json([
                'data' => $role,
                'message' => 'Role updated successfully',
                'statusCode' => 200,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'errors' => ['message' => 'Role not found'],
                'statusCode' => 404,
            ], 404);
        }catch (\Throwable $e) {
            return response()->json([
                "errors" => [
                    "message" => "Something went wrong",
                ],
                "statusCode" => 500
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $this->roleService->deleteRole($id);

            return response()->json([
                'data' => [
                    'message' => 'Role deleted successfully',
                ],
                'statusCode' => 200,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'errors' => ['message' => 'Role not found'],
                'statusCode' => 404,
            ], 404);
        } catch (AssignRoleException $e){
            return response()->json([
                'errors' => ['message' => 'Cannot delete role with assigned users.'],
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

    public function attachPermissions(AttachDetachRoleRequest $request, $id)
    {
        $request->validated();

        try {
            $role = $this->roleService->attachPermissions($id, $request->permission_groups);;

            return response()->json([
                'data' => $role,
                'message' => 'Permissions attached successfully',
                'statusCode' => 200,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'errors' => ['message' => 'Role not found'],
                'statusCode' => 404,
            ], 404);
        } catch (InvalidArgumentException|\RuntimeException $e){
            return response()->json([
                'errors' => ['message' => $e->getMessage()],
                'statusCode' => 404,
            ], 404);
        } catch (\Throwable $e) {
            return response()->json([
                "errors" => [
                    "message" => "Something went wrong" . $e->getMessage(),
                ],
                "statusCode" => 500
            ], 500);
        }
    }

    public function detachPermissions(AttachDetachRoleRequest $request, $id)
    {
        $request->validated();

        try {
            $role = $this->roleService->detachPermissions($id, $request->permission_groups);

            return response()->json([
                'data' => $role,
                'message' => 'Permissions detached successfully',
                'statusCode' => 200,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'errors' => ['message' => 'Role not found'],
                'statusCode' => 404,
            ], 404);
        }catch (InvalidArgumentException|\RuntimeException $e){
            return response()->json([
                'errors' => ['message' => $e->getMessage()],
                'statusCode' => 404,
            ], 404);
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

}
