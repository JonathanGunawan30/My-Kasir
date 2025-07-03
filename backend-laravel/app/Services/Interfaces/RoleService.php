<?php

namespace App\Services\Interfaces;

interface RoleService
{
    public function getRoleById($id);
    public function createRole(array $data);
    public function updateRole( $id, $data);
    public function deleteRole( $id);
    public function attachPermissions( $roleId,  $groups);
    public function detachPermissions( $roleId,  $groups);
    public function searchRoles( $query);
}
