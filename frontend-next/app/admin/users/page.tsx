"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Shield, CheckCircle, XCircle, User } from "lucide-react"
import { api } from "@/lib/api"
import type { User as UserType } from "@/types"
import { toast } from "@/hooks/use-toast"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

const MySwal = withReactContent(Swal.mixin({
  customClass: {
    container: 'z-[9999]',
    popup: 'z-[9999]',
    backdrop: 'z-[9998]'
  },
  zIndex: 9999
}))

interface ExtendedUser extends UserType {
  roles?: {
    id: number
    name: string
    guard_name: string
    created_at: string
    updated_at: string
    pivot: {
      model_type: string
      model_id: number
      role_id: number
    }
  }[]
  avatar?: string | null
}

interface Role {
  id: number
  name: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<ExtendedUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [filteredUsers, setFilteredUsers] = useState<ExtendedUser[]>([])
  const [paginatedUsers, setPaginatedUsers] = useState<ExtendedUser[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null)

  const [currentLoggedInUserId, setCurrentLoggedInUserId] = useState<number | null>(null);

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all")
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    status: "inactive",
    role_id: "No Role",
  })

  const isEditingSelf = editingUser && currentLoggedInUserId === editingUser.id;

  const getRoleColor = (roleName: string) => {
    switch (roleName?.toLowerCase()) {
      case "admin":
      case "admin assistant":
      case "admin updated":
        return "bg-gradient-to-r from-red-500 to-pink-500 text-white border-0"
      case "manager":
        return "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0"
      case "cashier":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0"
    }
  }

  const handleStatusToggle = async (user: ExtendedUser) => {
    if (user.id === currentLoggedInUserId) {
      toast({
        title: "Permission Denied",
        description: "You cannot change your own status.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newStatus = user.status === "active" ? "inactive" : "active"
      await api.updateUser(user.id, { status: newStatus })

      toast({
        title: "Success",
        description: `User ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
        variant: "success",
      })

      fetchUsers()
    } catch (error) {
      console.error("Failed to update user status:", error)
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      })
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    {
      key: "name",
      label: "User Info",
      render: (value: string, user: ExtendedUser) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden relative"> {/* Added relative positioning */}
              {user.avatar ? (
                  <img
                      src={user.avatar}
                      alt={value}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        const fallbackSpan = target.parentElement?.querySelector('.user-initial-fallback');
                        if (fallbackSpan) {
                          fallbackSpan.textContent = value.charAt(0).toUpperCase();
                          (fallbackSpan as HTMLElement).style.display = "flex";
                        }
                      }}
                  />
              ) : null}
              <span
                  className={`user-initial-fallback absolute inset-0 flex items-center justify-center ${user.avatar ? 'hidden' : ''}`}
              >
                  {value.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">{value}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string, user: ExtendedUser) => (
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Switch
                        checked={value === "active"}
                        onCheckedChange={() => handleStatusToggle(user)}
                        disabled={user.id === currentLoggedInUserId}
                        className="data-[state=checked]:bg-green-500"
                    />
                    <Badge
                        variant={value === "active" ? "default" : "secondary"}
                        className={
                          value === "active"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200"
                        }
                    >
                      {value === "active" ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {value}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to {value === "active" ? "deactivate" : "activate"} user</p>
                  {user.id === currentLoggedInUserId && (
                      <p className="text-red-500">You cannot change your own status.</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
      ),
    },
    {
      key: "roles",
      label: "Role",
      render: (value: any, user: ExtendedUser) => {
        const roleName = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0].name : "No Role"

        return (
            <Badge variant="outline" className={getRoleColor(roleName)}>
              <Shield className="w-3 h-3 mr-1" />
              {roleName}
            </Badge>
        )
      },
    },
    {
      key: "created_at",
      label: "Joined",
      render: (value: string) => {
        if (!value) return "N/A"
        try {
          return new Date(value).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        } catch (error) {
          return "Invalid Date"
        }
      },
    },
  ]

  useEffect(() => {
    fetchUsers();
    fetchRoles();

    const getLoggedInUser = async () => {
      try {
        const response = await api.getCurrentUser();
        setCurrentLoggedInUserId(response.data.id);
      } catch (error) {
        console.error("Failed to fetch logged-in user ID:", error);
      }
    };
    getLoggedInUser();
  }, [])

  useEffect(() => {
    let currentFilteredUsers = users

    if (selectedStatusFilter !== "all") {
      currentFilteredUsers = currentFilteredUsers.filter((user) => user.status === selectedStatusFilter)
    }

    if (selectedRoleFilter !== "all") {
      currentFilteredUsers = currentFilteredUsers.filter((user) => {
        const userRole = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0].name : "No Role"
        return selectedRoleFilter === "no-role" ? userRole === "No Role" : userRole === selectedRoleFilter
      })
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      currentFilteredUsers = currentFilteredUsers.filter(
          (user) =>
              user.name.toLowerCase().includes(lowerCaseSearchTerm) ||
              user.email.toLowerCase().includes(lowerCaseSearchTerm),
      )
    }

    setFilteredUsers(currentFilteredUsers)
    setCurrentPage(1)
  }, [users, selectedStatusFilter, selectedRoleFilter, searchTerm])

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedUsers(filteredUsers.slice(startIndex, endIndex))
  }, [filteredUsers, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  const renderFilters = () => (
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedStatusFilter} onValueChange={(value) => setSelectedStatusFilter(value)}>
          <SelectTrigger className="w-[180px] border-gray-300 focus:border-orange-500 focus:ring-orange-500">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Active
              </div>
            </SelectItem>
            <SelectItem value="inactive">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                Inactive
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedRoleFilter} onValueChange={(value) => setSelectedRoleFilter(value)}>
          <SelectTrigger className="w-[180px] border-gray-300 focus:border-orange-500 focus:ring-orange-500">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="no-role">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                No Role
              </div>
            </SelectItem>
            {roles.map((role) => (
                <SelectItem key={role.id} value={role.name}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {role.name}
                  </div>
                </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
  )

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response: any = await api.getUsers()
      setUsers(response.data || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response: any = await api.getRoles()
      setRoles(response.data || [])
    } catch (error) {
      console.error("Failed to fetch roles:", error)
      setRoles([
        { id: 1, name: "Admin" },
        { id: 2, name: "Owner" },
        { id: 3, name: "Cashier" },
      ])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditingSelf && formData.role_id !== (Array.isArray(editingUser?.roles) && editingUser?.roles.length > 0 ? editingUser.roles[0].name : "No Role")) {
      MySwal.fire({
        icon: "error",
        title: "Permission Denied",
        text: "You cannot change your own role.",
      });
      return;
    }

    try {
      const roleNameToSend = formData.role_id === "No Role" ? null : formData.role_id;

      const submitData: Partial<typeof formData> & { role?: string | null } = {
        name: formData.name,
        email: formData.email,
        status: formData.status,
        role: roleNameToSend,
      };

      if (formData.password) {
        submitData.password = formData.password;
      }


      if (editingUser) {
        await api.updateUser(editingUser.id, submitData)
        toast({
          title: "Success",
          description: "User updated successfully",
          variant: "success",
        })
      } else {

        if (!submitData.password) {
          MySwal.fire({
            icon: "error",
            title: "Validation Error",
            text: "Password is required for new users.",
          });
          return;
        }
        await api.createUser(submitData)
        toast({
          title: "Success",
          description: "User created successfully (Status: Inactive - requires admin activation)",
          variant: "success",
        })
      }
      setIsDialogOpen(false)
      setEditingUser(null)
      setFormData({ name: "", email: "", password: "", status: "inactive", role_id: "No Role" })
      fetchUsers()
    } catch (error: any) {
      console.error("Failed to save user:", error)
      const errorMessage = error.response?.data?.message || "Failed to save user. Please check your input."

      setIsDialogOpen(false)

      setTimeout(() => {
        MySwal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          backdrop: true,
          allowOutsideClick: true,
          customClass: {
            container: 'swal-container-high-z',
            popup: 'swal-popup-high-z'
          }
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

  const handleEdit = (user: ExtendedUser) => {
    setEditingUser(user)
    const userRoleName = Array.isArray(user.roles) && user.roles.length > 0
        ? user.roles[0].name
        : "No Role";

    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      status: user.status,
      role_id: userRoleName,
    })
    setIsDialogOpen(true)

  }

  const handleDelete = async (user: ExtendedUser) => {
    if (user.id === currentLoggedInUserId) {
      MySwal.fire({
        icon: "error",
        title: "Permission Denied",
        text: "You cannot delete your own account.",
      });
      return;
    }

    const result = await MySwal.fire({
      title: "Are you sure?",
      text: `You are about to delete user "${user.name}". This action cannot be undone.`,
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
    });

    if (result.isConfirmed) {
      try {
        await api.deleteUser(user.id)
        toast({
          title: "Success",
          description: "User deleted successfully",
          variant: "success",
        })
        fetchUsers()
      } catch (error) {
        console.error("Failed to delete user:", error)
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        })
      }
    }
  }

  const handleAdd = () => {
    setEditingUser(null)
    setFormData({ name: "", email: "", password: "", status: "inactive", role_id: "No Role" })
    setIsDialogOpen(true)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const Pagination = () => {
    const pages = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

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
        </Button>,
    )

    if (startPage > 1) {
      pages.push(
          <Button
              key={1}
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(1)}
              className={
                currentPage === 1
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "hover:bg-orange-50 hover:border-orange-300"
              }
          >
            1
          </Button>,
      )
      if (startPage > 2) {
        pages.push(
            <span key="ellipsis1" className="px-2">
            ...
          </span>,
        )
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
          <Button
              key={i}
              variant={currentPage === i ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(i)}
              className={
                currentPage === i
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "hover:bg-orange-50 hover:border-orange-300"
              }
          >
            {i}
          </Button>,
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
            <span key="ellipsis2" className="px-2">
            ...
          </span>,
        )
      }
      pages.push(
          <Button
              key={totalPages}
              variant={currentPage === totalPages ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              className={
                currentPage === totalPages
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "hover:bg-orange-50 hover:border-orange-300"
              }
          >
            {totalPages}
          </Button>,
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
        </Button>,
    )

    return (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)}{" "}
            of {filteredUsers.length} users
          </div>
          <div className="flex items-center gap-1">{pages}</div>
        </div>
    )
  }

  return (
      <TooltipProvider>
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-0">
            <DataTable
                data={paginatedUsers}
                columns={columns}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                title="Users"
                searchPlaceholder="Search users by name or email..."
                isLoading={isLoading}
                onSearchChange={handleSearchChange}
                searchValue={searchTerm}
                renderFilters={renderFilters}
            />

            {filteredUsers.length > 0 && (
                <div className="px-6 pb-6">
                  <Pagination />
                </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Enter email address"
                />
              </div>

              {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingUser} // Required only for new users
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                        placeholder="Enter password"
                    />
                  </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  Role
                </Label>
                <Select
                    value={formData.role_id}
                    onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                    disabled={isEditingSelf} // Disable if editing self
                >
                  <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No Role">No Role</SelectItem>
                    {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            {role.name}
                          </div>
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEditingSelf && (
                    <p className="text-xs text-gray-500 text-red-500">You cannot change your own role.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
                </Label>
                <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                    disabled={isEditingSelf}
                >
                  <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Inactive
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {isEditingSelf && (
                    <p className="text-xs text-gray-500 text-red-500">You cannot change your own status.</p>
                )}
                {!editingUser && (
                    <p className="text-xs text-gray-500">
                      New users are set to inactive by default and require admin activation
                    </p>
                )}
              </div>

              <DialogFooter className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                    type="submit"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg"
                >
                  {editingUser ? "Update User" : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <style jsx global>{`
          .swal-container-high-z {
            z-index: 9999 !important;
          }

          .swal-popup-high-z {
            z-index: 9999 !important;
          }

          .swal2-container {
            z-index: 9999 !important;
          }

          .swal2-backdrop-show {
            z-index: 9998 !important;
          }
        `}</style>
      </TooltipProvider>
  )
}