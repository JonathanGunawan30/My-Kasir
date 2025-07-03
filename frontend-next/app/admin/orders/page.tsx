"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"
import type { Order, Customer, User, Product, OrderPayload, Category } from "@/types"
import { toast } from "@/hooks/use-toast"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import {
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  Search,
  AlertTriangle,
  Printer,
  Eye,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  Coins,
  Ticket,
  Loader2 // Import Loader2 for spinner
} from "lucide-react"
import { ReceiptPrinter } from "@/components/receipt-printer"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { Switch } from "@/components/ui/switch"

interface OrderItem {
  product_id: number
  product: Product
  quantity: number
  price: number
  subtotal: number
}

interface OrderUpdatePayload extends OrderPayload {
  order_date?: string
  status?: string
  payment_method?: "qris" | "cash" | "credit_card" | "debit_card"
  tax_amount?: number;
  grand_total?: number;
  discount?: number;
}

const MySwal = withReactContent(Swal)

const TAX_RATE = 0.11;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [paginatedOrders, setPaginatedOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [searchProduct, setSearchProduct] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [printOrder, setPrintOrder] = useState<Order | null>(null)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // New state for submission loading animation
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [subtotalBeforeTax, setSubtotalBeforeTax] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [useBalanceAsDiscount, setUseBalanceAsDiscount] = useState(false);
  const [selectedCustomerBalance, setSelectedCustomerBalance] = useState<number | null>(null);

  const [rewardTiers, setRewardTiers] = useState<{ min_total: number; bonus: number }[]>([]);
  const [potentialReward, setPotentialReward] = useState(0);

  useEffect(() => {
    const fetchRewardTiers = async () => {
      try {
        const response = await api.getRewardTiers();

        let tiersData = response.data?.data;

        if (!Array.isArray(tiersData)) {
          tiersData = response.data;
        }

        if (Array.isArray(tiersData)) {
          setRewardTiers(tiersData);
        } else {
          console.error("API did not return a valid array for reward tiers. Response:", response);
          setRewardTiers([
            { min_total: 100000, bonus: 5000 },
            { min_total: 500000, bonus: 25000 },
            { min_total: 1000000, bonus: 50000 },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch reward tiers:", error);
        setRewardTiers([
          { min_total: 100000, bonus: 5000 },
          { min_total: 500000, bonus: 25000 },
          { min_total: 1000000, bonus: 50000 },
        ]);
      }
    };
    fetchRewardTiers();
  }, []);

  const calculatePotentialReward = (subtotal: number) => {
    let reward = 0;
    const tiersToIterate = Array.isArray(rewardTiers) ? rewardTiers : [];

    const sortedTiers = [...tiersToIterate].sort((a, b) => b.min_total - a.min_total);

    for (const tier of sortedTiers) {
      if (subtotal >= tier.min_total) {
        reward = tier.bonus;
        break;
      }
    }
    return reward;
  };

  const [formData, setFormData] = useState({
    customer_id: 0,
    user_id: 0,
    order_date: new Date().toISOString().split("T")[0],
    status: "pending",
    payment_method: "cash" as "qris" | "cash" | "credit_card" | "debit_card",
  })

  const orderStatuses = ["pending", "processing", "served", "paid"] as const
  type OrderStatus = (typeof orderStatuses)[number]

  const paymentMethods = [
    {
      value: "cash",
      label: "Cash",
      icon: Banknote,
      color: "bg-green-50 border-green-200 text-green-700",
      hoverColor: "hover:bg-green-100",
    },
    {
      value: "qris",
      label: "QRIS",
      icon: Smartphone,
      color: "bg-blue-50 border-blue-200 text-blue-700",
      hoverColor: "hover:bg-blue-100",
    },
    {
      value: "credit_card",
      label: "Credit Card",
      icon: CreditCard,
      color: "bg-purple-50 border-purple-200 text-purple-700",
      hoverColor: "hover:bg-purple-100",
    },
    {
      value: "debit_card",
      label: "Debit Card",
      icon: CreditCard,
      color: "bg-orange-50 border-orange-200 text-orange-700",
      hoverColor: "hover:bg-orange-100",
    },
  ] as const

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "processing":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "served":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200"
      case "paid":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const columns = [
    {
      key: "receipt_number",
      label: "Receipt No.",
      render: (value: any, row: Order) => row.receipt_number || `Order #${row.id}`,
    },
    {
      key: "customer.name",
      label: "Customer",
      render: (value: any, row: Order) => row.customer?.name || "N/A",
    },
    {
      key: "user.name",
      label: "User",
      render: (value: any, row: Order) => row.user?.name || "N/A",
    },
    {
      key: "order_date",
      label: "Order Date",
      render: (value: any) => {
        if (!value) return "N/A"
        try {
          const date = new Date(value)
          if (isNaN(date.getTime())) {
            return "Invalid Date"
          }
          return date.toLocaleDateString("id-ID")
        } catch (error) {
          return "Invalid Date"
        }
      },
    },
    {
      key: "details",
      label: "Items",
      render: (value: any, row: Order) => {
        const items = row.details || row.order_details || []
        return (
            <div className="space-y-1">
              {items.length > 0 ? (
                  <>
                    <div className="text-sm font-medium">{items.length} item(s)</div>
                    <div className="text-xs text-muted-foreground">
                      {items.slice(0, 2).map((item, index) => (
                          <div key={index}>
                            {item.product?.name || `Product ${item.product_id}`} ({item.quantity}x)
                          </div>
                      ))}
                      {items.length > 2 && <div>+{items.length - 2} more...</div>}
                    </div>
                  </>
              ) : (
                  <span className="text-muted-foreground">No items</span>
              )}
            </div>
        )
      },
    },
    {
      key: "grand_total",
      label: "Grand Total",
      render: (value: any, row: Order) => {
        const numValue = typeof row.grand_total === "string" ? Number.parseFloat(row.grand_total) : Number(row.grand_total)
        if (isNaN(numValue)) {
          return "Rp 0"
        }
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(numValue)
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value: string, row: Order) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto">
                <Badge variant="outline" className={`cursor-pointer ${getStatusBadgeClass(value as OrderStatus)}`}>
                  {value}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {orderStatuses.map((status) => (
                  <DropdownMenuItem key={status} onClick={() => updateOrderStatus(row.id, status)}>
                    <Badge variant="outline" className={getStatusBadgeClass(status)}>
                      {status}
                    </Badge>
                  </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
      ),
    },
  ]

  useEffect(() => {
    fetchOrders()
    fetchCustomers()
    fetchUsers()
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    let currentFilteredOrders = orders

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      currentFilteredOrders = currentFilteredOrders.filter(
          (order) =>
              order.receipt_number?.toLowerCase().includes(lowerCaseSearchTerm) ||
              order.customer?.name.toLowerCase().includes(lowerCaseSearchTerm) ||
              order.user?.name.toLowerCase().includes(lowerCaseSearchTerm) ||
              order.status.toLowerCase().includes(lowerCaseSearchTerm) ||
              order.id.toString().includes(lowerCaseSearchTerm),
      )
    }

    setFilteredOrders(currentFilteredOrders)
    setCurrentPage(1)
  }, [orders, searchTerm])

  const [internalFilteredProducts, setInternalFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    let currentProducts = products;

    if (selectedCategoryFilter !== "all") {
      const categoryId = Number(selectedCategoryFilter);
      currentProducts = currentProducts.filter(product => product.category_product_id === categoryId);
    }

    if (searchProduct) {
      const lowerCaseSearchTerm = searchProduct.toLowerCase();
      currentProducts = currentProducts.filter(product =>
          product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          product.description?.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    setInternalFilteredProducts(currentProducts);
  }, [products, selectedCategoryFilter, searchProduct]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedOrders(filteredOrders.slice(startIndex, endIndex))
  }, [filteredOrders, currentPage, itemsPerPage])

  useEffect(() => {
    const subtotal = calculateTotal();
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const tax = subtotalAfterDiscount * TAX_RATE;
    const total = subtotalAfterDiscount + tax;

    setSubtotalBeforeTax(subtotal);
    setTaxAmount(tax);
    setGrandTotal(total);

    setPotentialReward(calculatePotentialReward(subtotal));

  }, [orderItems, discountAmount]);

  useEffect(() => {
    if (formData.customer_id === 0) {
      setSelectedCustomerBalance(null);
      setUseBalanceAsDiscount(false);
      setDiscountAmount(0);
    } else {
      const customer = customers.find(c => c.id === formData.customer_id);
      if (customer) {
        setSelectedCustomerBalance(customer.saldo);
      }
    }
  }, [formData.customer_id, customers]);

  useEffect(() => {
    if (useBalanceAsDiscount && selectedCustomerBalance !== null) {
      const maxDiscount = Math.min(subtotalBeforeTax, selectedCustomerBalance || 0);
      setDiscountAmount(maxDiscount);
    } else {
      setDiscountAmount(0);
    }
  }, [useBalanceAsDiscount, selectedCustomerBalance, subtotalBeforeTax]);


  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

  const fetchOrders = async () => {
    try {
      const response = await api.getOrders()
      setOrders(response.data || [])
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await api.getCustomers()
      setCustomers(response.data || [])
    } catch (error) {
      console.error("Failed to fetch customers:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers()
      setUsers(response.data || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await api.getProducts()
      setProducts(response.data || [])
    } catch (error) {
      console.error("Failed to fetch products:", error)
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus)
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
        variant: "success",
      })
      fetchOrders()
    } catch (error) {
      console.error("Failed to update order status:", error)
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update order status",
      })
    }
  }

  const handleViewOrder = async (order: Order) => {
    try {
      const response = await api.getOrder(order.id)
      const fullOrder = response.data
      setViewingOrder(fullOrder)
      setIsViewDialogOpen(true)
    } catch (error) {
      console.error("Failed to fetch order details:", error)
      setViewingOrder(order)
      setIsViewDialogOpen(true)
    }
  }

  const handlePrintReceipt = async (order: Order) => {
    try {
      const response = await api.getOrder(order.id)
      const fullOrder = response.data

      setPrintOrder(fullOrder)
      setIsPrintDialogOpen(true)

      toast({
        title: "Receipt Ready",
        description: `Receipt for Order #${fullOrder.receipt_number || fullOrder.id} is ready to print`,
        variant: "success",
      })
    } catch (error) {
      console.error("Failed to fetch order details for printing:", error)
      setPrintOrder(order)
      setIsPrintDialogOpen(true)
    }
  }

  const addProductToOrder = (product: Product) => {
    const productPrice = typeof product.price === "string" ? Number.parseFloat(product.price) : Number(product.price)
    if (isNaN(productPrice)) {
      toast({
        title: "Error",
        description: `Product "${product.name}" has an invalid price`,
        variant: "destructive",
      })
      return
    }

    if (product.stock <= 0) {
      MySwal.fire({
        icon: "warning",
        title: "Out of Stock",
        text: `Product "${product.name}" is out of stock`,
      })
      return
    }

    const existingItem = orderItems.find((item) => item.product_id === product.id)
    const currentQuantity = existingItem ? existingItem.quantity : 0

    if (currentQuantity >= product.stock) {
      MySwal.fire({
        icon: "warning",
        title: "Stock Limit Reached",
        text: `Cannot add more "${product.name}". Only ${product.stock} available in stock`,
      })
      return
    }

    if (existingItem) {
      setOrderItems(
          orderItems.map((item) =>
              item.product_id === product.id
                  ? {
                    ...item,
                    quantity: item.quantity + 1,
                    subtotal: (item.quantity + 1) * item.price,
                  }
                  : item,
          ),
      )
    } else {
      const newItem: OrderItem = {
        product_id: product.id,
        product: product,
        quantity: 1,
        price: productPrice,
        subtotal: productPrice,
      }
      setOrderItems([...orderItems, newItem])
    }
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(orderItems.filter((item) => item.product_id !== productId))
      return
    }

    const product = products.find((p) => p.id === productId)
    if (product && newQuantity > product.stock) {
      MySwal.fire({
        icon: "warning",
        title: "Stock Limit Exceeded",
        text: `Cannot set quantity to ${newQuantity}. Only ${product.stock} available in stock`,
      })
      return
    }

    setOrderItems(
        orderItems.map((item) =>
            item.product_id === productId
                ? {
                  ...item,
                  quantity: newQuantity,
                  subtotal: newQuantity * item.price,
                }
                : item,
        ),
    )
  }

  const removeItem = (productId: number) => {
    setOrderItems(orderItems.filter((item) => item.product_id !== productId))
  }

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.subtotal, 0)
  }

  const finalFilteredProducts = internalFilteredProducts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return;

    if (formData.customer_id === 0) {
      MySwal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please select a customer.",
      })
      return
    }
    if (formData.user_id === 0) {
      MySwal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please select a cashier.",
      })
      return
    }
    if (!formData.order_date) {
      MySwal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please select an order date.",
      })
      return
    }
    if (orderItems.length === 0) {
      MySwal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please add at least one product to the order.",
      })
      return
    }

    if (discountAmount > 0 && formData.customer_id === 0) {
      MySwal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Cannot apply discount without a selected customer.",
      });
      return;
    }
    if (selectedCustomerBalance !== null && discountAmount > selectedCustomerBalance) {
      MySwal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Discount amount cannot exceed customer balance.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const orderPayload: OrderUpdatePayload = {
        user_id: formData.user_id,
        customer_id: formData.customer_id,
        order_date: formData.order_date,
        payment_method: formData.payment_method,
        items: orderItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        status: formData.status,
        total: subtotalBeforeTax,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        discount: discountAmount,
      }

      if (editingOrder) {
        await api.updateOrder(editingOrder.id, orderPayload)
        toast({
          title: "Success",
          description: "Order updated successfully",
          variant: "success",
        })
      } else {
        await api.createOrder(orderPayload as OrderPayload)
        toast({
          title: "Success",
          description: "Order created successfully",
          variant: "success",
        })
      }

      setIsDialogOpen(false)
      setEditingOrder(null)
      resetForm()
      fetchOrders()
      fetchProducts()
    } catch (error: any) {
      console.error("Failed to save order:", error)
      const errorMessage = error.response?.data?.message || "Failed to save order. Please check your input."
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
      })
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleEdit = async (order: Order) => {
    setEditingOrder(order)
    setFormData({
      customer_id: order.customer_id,
      user_id: order.user_id,
      order_date: order.order_date ? new Date(order.order_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      status: order.status,
      payment_method: order.payment_method || "cash",
    });

    const discount = order.discount || 0;
    setDiscountAmount(discount);
    setUseBalanceAsDiscount(discount > 0);

    try {
      const response = await api.getOrder(order.id);
      const fullOrder = response.data;

      const orderDetails = fullOrder.details || fullOrder.order_details || [];
      const fetchedOrderItems: OrderItem[] = orderDetails.map((item: any) => ({
        product_id: item.product_id,
        product: products.find((p) => p.id === item.product_id) || item.product,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      }));
      setOrderItems(fetchedOrderItems);

      const customer = customers.find(c => c.id === order.customer_id);
      if (customer) {
        setSelectedCustomerBalance(customer.saldo);
      }

      toast({
        title: "Edit Mode",
        description: `Editing Order #${order.id}. Loaded ${fetchedOrderItems.length} items.`,
        variant: "success",
      });

    } catch (error) {
      console.error("Failed to fetch full order details for editing:", error);
      MySwal.fire({
        icon: "warning",
        title: "Warning",
        text: "Could not load all order details from the server. Using local data.",
      });
      const orderDetails = order.details || order.order_details || [];
      const fetchedOrderItems: OrderItem[] = orderDetails.map((item: any) => ({
        product_id: item.product_id,
        product: products.find((p) => p.id === item.product_id) || item.product,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      }));
      setOrderItems(fetchedOrderItems);
    }

    setIsDialogOpen(true);
  }
  const handleDelete = async (order: Order) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: `You want to delete order ${order.receipt_number || `Order #${order.id}`}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    })

    if (result.isConfirmed) {
      try {
        await api.deleteOrder(order.id)
        toast({
          title: "Success",
          description: "Order deleted successfully",
          variant: "success",
        })
        fetchOrders()
      } catch (error) {
      }
    }
  }

  const handleAdd = () => {
    setEditingOrder(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numAmount)
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
                currentPage === 1 ? "bg-orange-500 hover:bg-orange-600" : "hover:bg-orange-50 hover:border-orange-300"
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
                currentPage === i ? "bg-orange-500 hover:bg-orange-600" : "hover:bg-orange-50 hover:border-orange-300"
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
                    ? "bg-orange-500 hover:bg-orange-600"
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
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
          </div>
          <div className="flex items-center gap-1">{pages}</div>
        </div>
    )
  }

  const resetForm = () => {
    setFormData({
      customer_id: 0,
      user_id: 0,
      order_date: new Date().toISOString().split("T")[0],
      status: "pending",
      payment_method: "cash",
    })
    setOrderItems([])
    setSearchProduct("")
    setDiscountAmount(0)
    setUseBalanceAsDiscount(false)
    setSelectedCustomerBalance(null)
  }


  return (
      <ProtectedRoute>
        <div className="space-y-6">
          <DataTable
              data={paginatedOrders}
              columns={columns}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              title="Orders"
              searchPlaceholder="Search orders by Receipt No., Customer, Cashier, or Status..."
              isLoading={isLoading}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              customActions={(row: Order) => (
                  <div className="flex gap-1">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewOrder(row)}
                        className="h-8 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintReceipt(row)}
                        className="h-8 px-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
              )}
          />
          {filteredOrders.length > 0 && <Pagination />}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {editingOrder ? `Edit Order #${editingOrder.id}` : "Create New Order"}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[65vh] max-h-[75vh]">
                <div className="lg:col-span-2 space-y-4">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="space-y-1">
                      <Label htmlFor="category-filter" className="text-sm">Filter by Category</Label>
                      <Select
                          value={selectedCategoryFilter}
                          onValueChange={setSelectedCategoryFilter}
                      >
                        <SelectTrigger className="h-9">
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
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="product-search" className="text-sm">Search Product</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="product-search"
                            placeholder="Search products..."
                            value={searchProduct}
                            onChange={(e) => setSearchProduct(e.target.value)}
                            className="pl-10 h-9"
                        />
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="h-[calc(100%-100px)]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-2">
                      {finalFilteredProducts.map((product) => {
                        const isOutOfStock = product.stock <= 0
                        const currentOrderQuantity =
                            orderItems.find((item) => item.product_id === product.id)?.quantity || 0
                        const isMaxQuantity = currentOrderQuantity >= product.stock

                        return (
                            <Card
                                key={product.id}
                                className={`cursor-pointer transition-all ${
                                    isOutOfStock || isMaxQuantity
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:shadow-md hover:scale-[1.02]"
                                }`}
                                onClick={() => !isOutOfStock && !isMaxQuantity && addProductToOrder(product)}
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-sm">{product.name}</h4>
                                      {isOutOfStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
                                    <div className="flex justify-between items-center mt-2">
                                      <span className="font-bold text-orange-600">{formatCurrency(product.price)}</span>
                                      <Badge
                                          variant="outline"
                                          className={`text-xs ${
                                              product.stock <= 5 ? "bg-red-50 text-red-700 border-red-200" : ""
                                          }`}
                                      >
                                        Stock: {product.stock}
                                      </Badge>
                                    </div>
                                    {currentOrderQuantity > 0 && (
                                        <div className="mt-2">
                                          <Badge variant="secondary" className="text-xs">
                                            In Cart: {currentOrderQuantity}
                                          </Badge>
                                        </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-3 flex flex-col">
                  <Card className="flex-shrink-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Order Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="customer" className="text-sm">
                            Customer
                          </Label>
                          <Select
                              value={formData.customer_id.toString()}
                              onValueChange={(value) => setFormData({ ...formData, customer_id: Number.parseInt(value) })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map((customer) => (
                                  <SelectItem key={customer.id} value={customer.id.toString()}>
                                    {customer.name} - {customer.phone}
                                  </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="user" className="text-sm">
                            Cashier
                          </Label>
                          <Select
                              value={formData.user_id.toString()}
                              onValueChange={(value) => setFormData({ ...formData, user_id: Number.parseInt(value) })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select cashier" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.name}
                                  </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="order_date" className="text-sm">
                          Order Date
                        </Label>
                        <Input
                            id="order_date"
                            type="date"
                            value={formData.order_date}
                            onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                            className="h-9"
                            required
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-3 block">Payment Method</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {paymentMethods.map((method) => {
                            const IconComponent = method.icon
                            const isSelected = formData.payment_method === method.value

                            return (
                                <div
                                    key={method.value}
                                    className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all ${method.hoverColor} ${
                                        isSelected
                                            ? `${method.color} border-current shadow-sm ring-2 ring-offset-1 ring-current/20`
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                    onClick={() => setFormData({ ...formData, payment_method: method.value })}
                                >
                                  <div className="flex items-center space-x-2">
                                    <IconComponent className={`h-5 w-5 ${isSelected ? "text-current" : "text-gray-600"}`} />
                                    <div className="flex-1">
                                      <p className={`text-sm font-medium ${isSelected ? "text-current" : "text-gray-900"}`}>
                                        {method.label}
                                      </p>
                                    </div>
                                    {isSelected && (
                                        <div className="flex-shrink-0">
                                          <div className="h-2 w-2 rounded-full bg-current"></div>
                                        </div>
                                    )}
                                  </div>
                                </div>
                            )
                          })}
                        </div>
                      </div>

                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="use-balance" className="flex items-center gap-2">
                            <Coins className="h-4 w-4" />
                            Use Customer Balance
                          </Label>
                          <Switch
                              id="use-balance"
                              checked={useBalanceAsDiscount}
                              onCheckedChange={setUseBalanceAsDiscount}
                              disabled={formData.customer_id === 0 || !selectedCustomerBalance || selectedCustomerBalance <= 0}
                          />
                        </div>
                        {selectedCustomerBalance !== null && (
                            <div className="text-sm text-muted-foreground ml-6">
                              Available Balance: <span className="font-semibold">{formatCurrency(selectedCustomerBalance)}</span>
                            </div>
                        )}
                        {useBalanceAsDiscount && (
                            <div>
                              <Label htmlFor="discount-input" className="text-sm">Discount Amount</Label>
                              <Input
                                  id="discount-input"
                                  type="number"
                                  placeholder="Enter discount amount"
                                  value={discountAmount}
                                  onChange={(e) => {
                                    const value = Number(e.target.value);
                                    const maxDiscount = Math.min(subtotalBeforeTax, selectedCustomerBalance || 0);
                                    if (value < 0) {
                                      setDiscountAmount(0);
                                    } else if (value > maxDiscount) {
                                      setDiscountAmount(maxDiscount);
                                    } else {
                                      setDiscountAmount(value);
                                    }
                                  }}
                                  className="h-9 mt-1"
                                  max={Math.min(subtotalBeforeTax, selectedCustomerBalance || 0)}
                                  min={0}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Max discount: {formatCurrency(Math.min(subtotalBeforeTax, selectedCustomerBalance || 0))}
                              </p>
                            </div>
                        )}
                      </div>

                    </CardContent>
                  </Card>

                  <Card className="flex-1 flex flex-col min-h-0">
                    <CardHeader className="pb-2 flex-shrink-0">
                      <CardTitle className="text-lg">Cart Items</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 min-h-0 p-4">
                      <ScrollArea className="flex-1 min-h-[200px] mb-4">
                        {orderItems.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-center text-muted-foreground">No items added yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3 pr-2">
                              {orderItems.map((item) => (
                                  <div
                                      key={item.product_id}
                                      className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-medium text-sm truncate">{item.product.name}</h5>
                                      <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
                                      <p className="text-xs text-orange-600">
                                        Available: {item.product.stock - item.quantity}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                      <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 w-7 p-0 bg-transparent"
                                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                      <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 w-7 p-0 bg-transparent"
                                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                          disabled={item.quantity >= item.product.stock}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                      <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 bg-transparent"
                                          onClick={() => removeItem(item.product_id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                              ))}
                            </div>
                        )}
                      </ScrollArea>

                      <div className="flex-shrink-0 space-y-3 border-t pt-3">
                        <div className="flex justify-between items-center text-base font-medium">
                          <span>Subtotal:</span>
                          <span className="text-gray-800">{formatCurrency(subtotalBeforeTax)}</span>
                        </div>
                        <div className="flex justify-between items-center text-base font-medium">
                          <span>Discount:</span>
                          <span className="text-red-600">- {formatCurrency(discountAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-base font-medium">
                          <span>Tax (11%):</span>
                          <span className="text-gray-800">{formatCurrency(taxAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold bg-orange-50 p-3 rounded-lg">
                          <span>Grand Total:</span>
                          <span className="text-orange-600">{formatCurrency(grandTotal)}</span>
                        </div>
                        {potentialReward > 0 && formData.customer_id > 0 && (
                            <div className="flex justify-between items-center text-xs text-green-700 bg-green-50 p-2 rounded-lg border border-green-200">
                              <span><Ticket className="h-4 w-4 inline-block mr-1" /> Potential Reward:</span>
                              <span className="font-semibold">{formatCurrency(potentialReward)}</span>
                            </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsDialogOpen(false)}
                              className="flex-1"
                              disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button
                              onClick={handleSubmit}
                              className="flex-1 bg-orange-500 hover:bg-orange-600"
                              disabled={
                                  isSubmitting ||
                                  orderItems.length === 0 ||
                                  formData.customer_id === 0 ||
                                  formData.user_id === 0 ||
                                  !formData.order_date
                              }
                          >
                            {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {editingOrder ? "Updating Order..." : "Creating Order..."}
                                </>
                            ) : (
                                editingOrder ? "Update Order" : "Create Order"
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Order Details - {viewingOrder?.receipt_number}
                </DialogTitle>
              </DialogHeader>

              {viewingOrder && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Customer</Label>
                        <p className="text-sm">{viewingOrder.customer?.name || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Cashier</Label>
                        <p className="text-sm">{viewingOrder.user?.name || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Order Date</Label>
                        <p className="text-sm">{new Date(viewingOrder.order_date).toLocaleString("id-ID")}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <Badge
                            variant="outline"
                            className={getStatusBadgeClass(viewingOrder.status as OrderStatus)}
                        >
                          {viewingOrder.status}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-sm font-medium">Order Items</Label>
                      <div className="mt-2 space-y-2">
                        {(viewingOrder.details || viewingOrder.order_details || []).map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-2 border rounded">
                              <div>
                                <p className="font-medium">{item.product?.name || `Product ${item.product_id}`}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.quantity} x {formatCurrency(item.price)}
                                </p>
                              </div>
                              <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                            </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center text-base font-medium">
                      <span>Subtotal:</span>
                      <span className="text-gray-800">{formatCurrency(viewingOrder.total)}</span>
                    </div>
                    <div className="flex justify-between items-center text-base font-medium">
                      <span>Discount:</span>
                      <span className="text-red-600">- {formatCurrency(viewingOrder.discount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-base font-medium">
                      <span>Tax (11%):</span>
                      <span className="text-gray-800">{formatCurrency(viewingOrder.tax_amount || 0)}</span>
                    </div>

                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Grand Total:</span>
                      <span className="text-orange-600">{formatCurrency(viewingOrder.grand_total || 0)}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="flex-1">
                        Close
                      </Button>
                      <Button
                          onClick={() => {
                            setIsViewDialogOpen(false)
                            handlePrintReceipt(viewingOrder)
                          }}
                          className="flex-1 bg-orange-500 hover:bg-orange-600"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Receipt
                      </Button>
                    </div>
                  </div>
              )}
            </DialogContent>
          </Dialog>

          <ReceiptPrinter
              order={printOrder}
              isOpen={isPrintDialogOpen}
              onClose={() => {
                setIsPrintDialogOpen(false)
                setPrintOrder(null)
              }}
          />
        </div>
      </ProtectedRoute>
  )
}