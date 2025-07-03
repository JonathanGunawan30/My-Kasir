"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import type { Customer } from "@/types"
import { toast } from "@/hooks/use-toast"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

const MySwal = withReactContent(Swal);

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [paginatedCustomers, setPaginatedCustomers] = useState<Customer[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const [searchTerm, setSearchTerm] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    saldo: 0,
  })

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    {
      key: "saldo",
      label: "Balance",
      render: (value: any) => {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return "Rp 0";
        }

        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(numValue);
      },
    },
    {
      key: "created_at",
      label: "Created At",
      render: (value: any) => {
        if (!value) return "N/A";
        try {
          return new Date(value).toLocaleDateString('id-ID');
        } catch (error) {
          return "Invalid Date";
        }
      },
    },
  ]

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    let currentFilteredCustomers = customers;

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentFilteredCustomers = currentFilteredCustomers.filter(customer =>
          customer.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          customer.phone.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    setFilteredCustomers(currentFilteredCustomers);
    setCurrentPage(1);
  }, [customers, searchTerm]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedCustomers(filteredCustomers.slice(startIndex, endIndex));
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      const response = await api.getCustomers()
      setCustomers(response.data || []) // Store all fetched customers
    } catch (error) {
      console.error("Failed to fetch customers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || formData.name.trim() === "") {
      MySwal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Customer name cannot be empty.",
        zIndex: 9999999,
      });
      return;
    }
    if (!formData.phone || formData.phone.trim() === "") {
      MySwal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Phone number cannot be empty.",
        zIndex: 9999999,
      });
      return;
    }

    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, formData)
        toast({
          title: "Success",
          description: "Customer updated successfully",
          variant: "success",
        })
      } else {
        await api.createCustomer(formData)
        toast({
          title: "Success",
          description: "Customer created successfully",
          variant: "success",
        })
      }
      setIsDialogOpen(false)
      setEditingCustomer(null)
      setFormData({ name: "", phone: "", saldo: 0 })
      fetchCustomers()
    } catch (error: any) {
      console.error("Failed to save customer:", error)
      const errorMessage = error.response?.data?.message || "Failed to save customer. Please check your input."

      setIsDialogOpen(false);
      setTimeout(() => {
        MySwal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          backdrop: true,
          allowOutsideClick: true,
          zIndex: 9999999,
        }).then(() => {
          setIsDialogOpen(true);
        });
      }, 100);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      saldo: customer.saldo ,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (customer: Customer) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: `You are about to delete customer "${customer.name}"? This action cannot be undone.`,
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
        await api.deleteCustomer(customer.id)
        toast({
          title: "Success",
          description: "Customer deleted successfully",
          variant: "success",
        })
        fetchCustomers()
      } catch (error) {
        console.error("Failed to delete customer:", error)
        toast({
          title: "Error",
          description: "Failed to delete customer",
          variant: "destructive",
        })
      }
    }
  }

  const handleAdd = () => {
    setEditingCustomer(null)
    setFormData({ name: "", phone: "", saldo: 0 })
    setIsDialogOpen(true)
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
              className={currentPage === 1 ? "bg-orange-500 hover:bg-orange-600 text-white" : "hover:bg-orange-50 hover:border-orange-300"}
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
              className={currentPage === i ? "bg-orange-500 hover:bg-orange-600 text-white" : "hover:bg-orange-50 hover:border-orange-300"}
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
              className={currentPage === totalPages ? "bg-orange-500 hover:bg-orange-600 text-white" : "hover:bg-orange-50 hover:border-orange-300"}
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
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
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
              data={paginatedCustomers}
              columns={columns}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              title="Customers"
              searchPlaceholder="Search customers by name or phone..."
              isLoading={isLoading}
              onSearchChange={handleSearchChange}
              searchValue={searchTerm}
          />

          {filteredCustomers.length > 0 && <Pagination />}

          <Dialog open={isDialogOpen} onOnpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
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
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                  />
                  <p className="text-xs text-red-500 mt-1">
                    Phone number must be unique.
                  </p>
                </div>
                <div>
                  <Label htmlFor="saldo">Balance</Label>
                  <Input
                      id="saldo"
                      type="number"
                      step="0.01"
                      value={formData.saldo}
                      onChange={(e) => setFormData({ ...formData, saldo: Number.parseFloat(e.target.value) || 0 })}
                      required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    {editingCustomer ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </ProtectedRoute>
  )
}