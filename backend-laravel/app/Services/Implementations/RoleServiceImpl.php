<?php

namespace App\Services\Implementations;

use App\Exceptions\AssignRoleException;
use App\Exceptions\PermissionNotFoundException;
use App\Services\Interfaces\RoleService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleServiceImpl implements RoleService
{

    public function getRoleById($id)
    {
        $role = Role::with("permissions")->find($id);

        if(!$role){
            throw new ModelNotFoundException();
        }

        return $role;
    }

    public function createRole(array $data)
    {
        $groupPermissions = config('permission.groups');
        $selectedPermissions = [];

        foreach ($data['permission_groups'] as $group) {
            $selectedPermissions = array_merge(
                $selectedPermissions,
                $groupPermissions[$group] ?? []
            );
        }

        $role = Role::create(['name' => $data['name'], 'guard_name' => 'api']);

        foreach ($selectedPermissions as $permissionName) {
            Permission::findOrCreate($permissionName);
        }

        $role->syncPermissions($selectedPermissions);

        return [
            'role' => $role,
            'permissions' => $selectedPermissions
        ];
    }

    public function searchRoles( $query)
    {
        return Role::with('permissions')
            ->where('name', 'like', '%' . $query . '%')
            ->get();
    }

    public function updateRole( $id,  $data)
    {
        $role = Role::find($id);

        if (!$role) {
            throw new ModelNotFoundException();
        }

        if (isset($data['name'])) {
            $role->name = $data['name'];
            $role->save();
        }

        if (isset($data['permission_groups'])) {
            $groupPermissions = config('permission.groups', []);
            $selectedPermissions = [];

            foreach ($data['permission_groups'] as $group) {
                $selectedPermissions = array_merge(
                    $selectedPermissions,
                    $groupPermissions[$group] ?? []
                );
            }

            foreach ($selectedPermissions as $permissionName) {
                Permission::findOrCreate($permissionName);
            }

            $role->syncPermissions($selectedPermissions);
        }

        return $role->load('permissions');
    }

    public function deleteRole( $id)
    {
        $role = Role::find($id);

        if (!$role) {
            throw new ModelNotFoundException();
        }

        if($role->users()->exists()){
            throw new AssignRoleException();
        }

        $role->delete();

        return true;
    }

    public function attachPermissions($roleId, $groups)
    {
        $role = Role::find($roleId);
        if (!$role) {
            throw new ModelNotFoundException();
        }

        $groupPermissions = config('permission.groups', []);
        $permissionsToAttach = [];

        foreach ($groups as $group) {
            if (!isset($groupPermissions[$group])) {
                throw new \InvalidArgumentException("Permission group '{$group}' not found.");
            }

            foreach ($groupPermissions[$group] as $permissionName) {
                $permission = Permission::where('name', $permissionName)->first();
                if (!$permission) {
                    throw new \RuntimeException("Permission '{$permissionName}' from group '{$group}' not found in database.");
                }

                $permissionsToAttach[] = $permission->name;
            }
        }

        $role->givePermissionTo($permissionsToAttach);

        return $role->load('permissions');
    }



    public function detachPermissions($roleId, $groups)
    {
        $role = Role::find($roleId);
        if (!$role) {
            throw new ModelNotFoundException();
        }

        $groupPermissions = config('permission.groups', []);
        $permissionsToDetach = [];

        foreach ($groups as $group) {
            if (!isset($groupPermissions[$group])) {
                throw new \InvalidArgumentException("Permission group '{$group}' not found.");
            }

            foreach ($groupPermissions[$group] as $permissionName) {
                $permission = Permission::where('name', $permissionName)->first();
                if (!$permission) {
                    throw new \RuntimeException("Permission '{$permissionName}' from group '{$group}' not found in database.");
                }

                $permissionsToDetach[] = $permission->name;
            }
        }

        $role->revokePermissionTo($permissionsToDetach);

        return $role->load('permissions');
    }



}
