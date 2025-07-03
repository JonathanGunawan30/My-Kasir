"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import type { Product, Category } from "@/types"
import { toast } from "@/hooks/use-toast"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"


const MySwal = withReactContent(Swal);

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([])

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category_product_id: 0,
  })

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    {
      key: "price",
      label: "Price",
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
    { key: "stock", label: "Stock" },
    {
      key: "category_product_id",
      label: "Category",
      render: (value: any) => {
        const category = categories.find(cat => cat.id === value);
        return category ? category.name : "N/A";
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
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    let currentFilteredProducts = products;

    if (selectedCategoryFilter !== "all") {
      const categoryId = parseInt(selectedCategoryFilter);
      currentFilteredProducts = currentFilteredProducts.filter(product => product.category_product_id === categoryId);
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentFilteredProducts = currentFilteredProducts.filter(product =>
          product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          product.description.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    setFilteredProducts(currentFilteredProducts);
    setCurrentPage(1);
  }, [products, selectedCategoryFilter, searchTerm]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedProducts(filteredProducts.slice(startIndex, endIndex))
  }, [filteredProducts, currentPage, itemsPerPage]);


  const renderFilters = () => (
      <Select
          value={selectedCategoryFilter}
          onValueChange={(value) => setSelectedCategoryFilter(value)}
      >
        <SelectTrigger className="w-[180px] border-gray-300 focus:border-orange-500 focus:ring-orange-500">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
          ))}
        </SelectContent>
      </Select>
  )


  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const response = await api.getProducts()
      setProducts(response.data || [])
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories()
      setCategories(response.data || [])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsDialogOpen(false);

    if (!formData.name || formData.name.trim() === "") {
      setTimeout(() => {
        MySwal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Product name cannot be empty.",
          zIndex: 9999999,
        }).then(() => setIsDialogOpen(true));
      }, 100);
      return;
    }
    if (formData.price <= 0) {
      setTimeout(() => {
        MySwal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Product price must be greater than zero.",
          zIndex: 9999999,
        }).then(() => setIsDialogOpen(true));
      }, 100);
      return;
    }
    if (formData.stock < 0) {
      setTimeout(() => {
        MySwal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Product stock cannot be negative.",
          zIndex: 9999999,
        }).then(() => setIsDialogOpen(true));
      }, 100);
      return;
    }
    if (formData.category_product_id === 0) {
      setTimeout(() => {
        MySwal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Please select a category for the product.",
          zIndex: 9999999,
        }).then(() => setIsDialogOpen(true));
      }, 100);
      return;
    }


    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData)
        toast({
          title: "Success",
          description: "Product updated successfully",
          variant: "success",
        })
      } else {
        await api.createProduct(formData)
        toast({
          title: "Success",
          description: "Product created successfully",
          variant: "success",
        })
      }
      setIsDialogOpen(false)
      setEditingProduct(null)
      setFormData({ name: "", description: "", price: 0, stock: 0, category_product_id: 0 })
      fetchProducts()
    } catch (error: any) {
      console.error("Failed to save product:", error)
      const errorMessage = error.response?.data?.message || "Failed to save product. Please check your input."

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

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category_product_id: product.category_product_id,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (product: Product) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: `You are about to delete product "${product.name}"? This action cannot be undone.`,
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
        await api.deleteProduct(product.id)
        toast({
          title: "Success",
          description: "Product deleted successfully",
          variant: "success",
        })
        fetchProducts()
      } catch (error) {
        console.error("Failed to delete product:", error)
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive",
        })
      }
    }
  }

  const handleAdd = () => {
    setEditingProduct(null)
    setFormData({ name: "", description: "", price: 0, stock: 0, category_product_id: 0 })
    setIsDialogOpen(true)
  }

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
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
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
              data={paginatedProducts}
              columns={columns}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              title="Products"
              searchPlaceholder="Search products..."
              isLoading={isLoading}
              renderFilters={renderFilters}
              onSearchChange={setSearchTerm}
          />

          {filteredProducts.length > 0 && <Pagination />}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-md rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                  <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring focus:ring-orange-500 focus:ring-opacity-50"
                  />
                  <p className="text-xs text-red-500 mt-1">
                    Product name must be unique.
                  </p>
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring focus:ring-orange-500 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <Label htmlFor="price" className="text-sm font-medium">Price</Label>
                  <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring focus:ring-orange-500 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <Label htmlFor="stock" className="text-sm font-medium">Stock</Label>
                  <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number.parseInt(e.target.value) || 0 })}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring focus:ring-orange-500 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                  <Select
                      value={formData.category_product_id.toString()}
                      onValueChange={(value) => setFormData({ ...formData, category_product_id: Number.parseInt(value) })}
                  >
                    <SelectTrigger className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring focus:ring-orange-500 focus:ring-opacity-50">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md shadow-lg">
                      {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-md">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white rounded-md">
                    {editingProduct ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

        </div>
      </ProtectedRoute>
  )
}