"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import type { Role, Permission } from "@/types"
import { toast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import {ProtectedRoute} from "@/components/auth/ProtectedRoute";
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

const MySwal = withReactContent(Swal);

type GroupedPermissions = {
  [key: string]: Permission[]
}

const PERMISSION_GROUPS: { [key: string]: string[] } = {
  manage_users: ["view_users", "create_user", "edit_user", "delete_user"],
  manage_roles: ["view_roles", "create_role", "edit_role", "delete_role"],
  manage_categories: [
    "view_categories",
    "create_category",
    "edit_category",
    "delete_category",
  ],
  manage_orders: ["view_orders", "create_order", "edit_order", "delete_order"],
  manage_products: [
    "view_products",
    "create_product",
    "edit_product",
    "delete_product",
  ],
  manage_customers: [
    "view_customers",
    "create_customer",
    "edit_customer",
    "delete_customer",
  ],
}
const groupPermissions = (permissions: Permission[]): GroupedPermissions => {
  const grouped: GroupedPermissions = {}
  for (const groupName in PERMISSION_GROUPS) {
    grouped[groupName] = permissions.filter((perm) =>
        PERMISSION_GROUPS[groupName].includes(perm.name)
    )
  }
  return grouped
}

const STATIC_ALL_PERMISSIONS: Permission[] = (() => {
  let idCounter = 1
  const permissions: Permission[] = []
  for (const groupName in PERMISSION_GROUPS) {
    PERMISSION_GROUPS[groupName].forEach((permName) => {
      permissions.push({
        id: idCounter++,
        name: permName,
        guard_name: "web",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    })
  }
  return permissions
})()

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([])
  const [paginatedRoles, setPaginatedRoles] = useState<Role[]>([])

  const [allPermissions] = useState<Permission[]>(STATIC_ALL_PERMISSIONS)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    permission_ids: [] as number[],
  })
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);


  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    {
      key: "permissions",
      label: "Permissions",
      render: (permissions: Permission[]) => {
        if (!permissions || permissions.length === 0) {
          return "No permissions"
        }
        const activeGroups: string[] = []
        for (const groupName in PERMISSION_GROUPS) {
          const hasPermissionInGroup = permissions.some((p) =>
              PERMISSION_GROUPS[groupName].includes(p.name)
          )
          if (hasPermissionInGroup) {
            const readableGroupName = groupName
                .replace(/_/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase())
            activeGroups.push(readableGroupName)
          }
        }
        return activeGroups.length > 0 ? activeGroups.join(", ") : "No permissions"
      },
    },
  ]

  useEffect(() => {
    fetchRoles()
  }, [])

  useEffect(() => {
    let currentFilteredRoles = roles;

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentFilteredRoles = currentFilteredRoles.filter(role =>
          role.name.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    setFilteredRoles(currentFilteredRoles);
    setCurrentPage(1);
  }, [roles, searchTerm]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedRoles(filteredRoles.slice(startIndex, endIndex));
  }, [filteredRoles, currentPage, itemsPerPage]);


  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage)

  const fetchRoles = async () => {
    try {
      setIsLoading(true)
      const rolesResponse = await api.getRoles()
      setRoles(rolesResponse.data || [])
    } catch (error) {
      console.error("Failed to fetch role data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch role data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.permission_ids.length === 0) {
      setIsDialogOpen(false);
      setTimeout(() => {
        MySwal.fire({
          icon: "error",
          title: "Validation Error",
          text: "At least one permission must be selected for the role.",
          backdrop: true,
          allowOutsideClick: true,
          zIndex: 9999999,
        }).then(() => {
          setIsDialogOpen(true);
        });
      }, 100);
      return;
    }

    try {
      const selectedGroupNames: string[] = [];

      for (const groupName in PERMISSION_GROUPS) {
        const permissionsInGroup = allPermissions.filter((perm) =>
            PERMISSION_GROUPS[groupName].includes(perm.name)
        );

        const allPermissionsInGroupSelected = permissionsInGroup.every((perm) =>
            formData.permission_ids.includes(perm.id)
        );

        if (allPermissionsInGroupSelected && permissionsInGroup.length > 0) {
          selectedGroupNames.push(groupName);
        }
      }

      const payload = {
        name: formData.name,
        permission_groups: selectedGroupNames,
      };

      if (editingRole) {
        await api.updateRole(editingRole.id, payload)
        toast({
          title: "Success",
          description: "Role updated successfully",
          variant: "success",
        })
      } else {
        await api.createRole(payload)
        toast({
          title: "Success",
          description: "Role created successfully",
          variant: "success",
        })
      }
      setIsDialogOpen(false)
      setEditingRole(null)
      setFormData({ name: "", permission_ids: [] })
      fetchRoles()
    } catch (error: any) {
      console.error("Failed to save role:", error)
      const errorMessage = error.response?.data?.message || "Failed to save role. Please check your input."


      setIsDialogOpen(false)
      setTimeout(() => {
        MySwal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          backdrop: true,
          allowOutsideClick: true,
          zIndex: 9999999,
        }).then(() => {
          setIsDialogOpen(true)
        })
      }, 100)

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)

    const preselectedGroupIds: number[] = [];

    for (const groupName in PERMISSION_GROUPS) {
      const permissionsInGroup = STATIC_ALL_PERMISSIONS.filter(perm =>
          PERMISSION_GROUPS[groupName].includes(perm.name)
      );

      const hasAllGroupPermissions = permissionsInGroup.length > 0 &&
          permissionsInGroup.every(staticPerm =>
              role.permissions?.some(rolePerm => rolePerm.name === staticPerm.name)
          );

      if (hasAllGroupPermissions) {
        permissionsInGroup.forEach(perm => {
          if (!preselectedGroupIds.includes(perm.id)) {
            preselectedGroupIds.push(perm.id);
          }
        });
      }
    }

    setFormData({
      name: role.name,
      permission_ids: preselectedGroupIds,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (role: Role) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: `You are about to delete role "${role.name}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      reverseButtons: true,
      customClass: {
        popup: 'rounded-lg shadow-xl',
        title: 'text-2xl font-bold text-gray-800',
        htmlContainer: 'text-gray-700',
      },
      buttonsStyling: true,
      zIndex: 9999999,
    });

    if (result.isConfirmed) {
      try {
        await api.deleteRole(role.id)
        toast({
          title: "Success",
          description: "Role deleted successfully",
          variant: "success",
        })
        fetchRoles()
      } catch (error) {
        console.error("Failed to delete role:", error)
        toast({
          title: "Error",
          description: "Failed to delete role",
          variant: "destructive",
        })
      }
    }
  }

  const handleAdd = () => {
    setEditingRole(null)
    setFormData({ name: "", permission_ids: [] })
    setIsDialogOpen(true)
  }

  const handleSelectAllInGroup = (groupName: string, isChecked: boolean) => {
    const permissionsInGroup = allPermissions.filter((perm) =>
        PERMISSION_GROUPS[groupName].includes(perm.name)
    )
    setFormData((prev) => {
      let newPermissionIds = [...prev.permission_ids]
      if (isChecked) {
        permissionsInGroup.forEach((perm) => {
          if (!newPermissionIds.includes(perm.id)) {
            newPermissionIds.push(perm.id)
          }
        })
      } else {
        newPermissionIds = newPermissionIds.filter(
            (id) => !permissionsInGroup.map((p) => p.id).includes(id)
        )
      }
      return { ...prev, permission_ids: newPermissionIds }
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const Pagination = () => {
    const pages = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    pages.push(
        <Button
            key="prev"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="hover:bg-orange-50 hover:border-orange-300"
        >
          Previous
        </Button>
    )

    if (startPage > 1) {
      pages.push(
          <Button
              key={1}
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(1)}
              className={currentPage === 1 ? "bg-orange-500 hover:bg-orange-600" : "hover:bg-orange-50 hover:border-orange-300"}
          >
            1
          </Button>
      )
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="px-2">...</span>)
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
          <Button
              key={i}
              variant={currentPage === i ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(i)}
              className={currentPage === i ? "bg-orange-500 hover:bg-orange-600" : "hover:bg-orange-50 hover:border-orange-300"}
          >
            {i}
          </Button>
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="px-2">...</span>)
      }
      pages.push(
          <Button
              key={totalPages}
              variant={currentPage === totalPages ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              className={currentPage === totalPages ? "bg-orange-500 hover:bg-orange-600" : "hover:bg-orange-50 hover:border-orange-300"}
          >
            {totalPages}
          </Button>
      )
    }

    pages.push(
        <Button
            key="next"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="hover:bg-orange-50 hover:border-orange-300"
        >
          Next
        </Button>
    )

    return (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRoles.length)} of {filteredRoles.length} roles
          </div>
          <div className="flex items-center gap-1">
            {pages}
          </div>
        </div>
    )
  }

  return (
      <ProtectedRoute>
        <div className="space-y-6">
          <DataTable
              data={paginatedRoles}
              columns={columns}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              title="Roles"
              searchPlaceholder="Search roles..."
              isLoading={isLoading}
              onSearchChange={handleSearchChange}
              searchValue={searchTerm}
          />

          {filteredRoles.length > 0 && <Pagination />}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingRole ? "Edit Role" : "Add New Role"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                  />
                </div>

                <div className="space-y-4">
                  <Label>Permissions</Label>
                  {formData.permission_ids.length === 0 && (
                      <p className="text-xs text-red-500">At least one permission must be selected.</p>
                  )}
                  {Object.keys(PERMISSION_GROUPS).map((groupName) => {
                    const permissionsInGroup = allPermissions.filter((perm) =>
                        PERMISSION_GROUPS[groupName].includes(perm.name)
                    )
                    const readableGroupName = groupName
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (char) => char.toUpperCase())
                    const isGroupChecked =
                        permissionsInGroup.length > 0 &&
                        permissionsInGroup.every((perm) =>
                            formData.permission_ids.includes(perm.id)
                        )

                    return (
                        <div key={groupName} className="border p-3 rounded-md">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                                id={`group-${groupName}`}
                                checked={isGroupChecked}
                                onCheckedChange={(checked) =>
                                    handleSelectAllInGroup(groupName, checked as boolean)
                                }
                            />
                            <Label htmlFor={`group-${groupName}`} className="font-semibold cursor-pointer">
                              {readableGroupName}
                            </Label>
                          </div>
                        </div>
                    )
                  })}
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    {editingRole ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </ProtectedRoute>
  )
}