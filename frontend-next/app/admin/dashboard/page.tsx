"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { StatsCard } from "@/components/ui/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, ShoppingCart, Package, DollarSign, TrendingUp, Clock, Calendar, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { api } from "@/lib/api"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

export default function Dashboard() {
  const { isLoading: authLoading, isAuthenticated } = useAuth()
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    ordersToday: 0,
    pendingOrders: 0,
    completedOrders: 0,
    lowStockProducts: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [previousStats, setPreviousStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalRevenue: 0,
  })

  const months = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 4 + i)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Pending" },
      processing: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Processing" },
      served: { color: "bg-purple-100 text-purple-800 border-purple-200", label: "Served" },
      paid: { color: "bg-green-100 text-green-800 border-green-200", label: "Paid" },
      completed: { color: "bg-green-100 text-green-800 border-green-200", label: "Completed" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
        <Badge variant="outline" className={`${config.color} text-xs font-medium`}>
          {config.label}
        </Badge>
    )
  }

  const filterDataByDate = (data: any[], month: number, year: number) => {
    return data.filter((item) => {
      const itemDate = new Date(item.order_date || item.created_at)
      return itemDate.getMonth() + 1 === month && itemDate.getFullYear() === year
    })
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.reload()
    }
  }, [authLoading, isAuthenticated])

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        const [ordersRes, customersRes, productsRes] = await Promise.all([
          api.getOrders() as any,
          api.getCustomers() as any,
          api.getProducts() as any,
        ])

        const allOrders = ordersRes.data || []
        const allCustomers = customersRes.data || []
        const allProducts = productsRes.data || []

        const filteredOrders = filterDataByDate(allOrders, selectedMonth, selectedYear)
        const filteredCustomers = filterDataByDate(allCustomers, selectedMonth, selectedYear)

        const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1
        const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear
        const prevOrders = filterDataByDate(allOrders, prevMonth, prevYear)
        const prevCustomers = filterDataByDate(allCustomers, prevMonth, prevYear)

        const today = new Date()
        const todayOrders = allOrders.filter((order: any) => {
          const orderDate = new Date(order.order_date)
          return orderDate.toDateString() === today.toDateString()
        })

        const pendingOrders = filteredOrders.filter((order: any) => order.status === "pending")
        const completedOrders = filteredOrders.filter((order: any) =>
            order.status === "completed" || order.status === "paid"
        )

        const lowStockProducts = allProducts.filter((product: any) => product.stock <= 5)

        const currentRevenue = filteredOrders.reduce((sum: number, order: any) => sum + (Number(order.total) || 0), 0)
        const prevRevenue = prevOrders.reduce((sum: number, order: any) => sum + (Number(order.total) || 0), 0)

        setStats({
          totalOrders: filteredOrders.length,
          totalCustomers: filteredCustomers.length,
          totalProducts: allProducts.length,
          totalRevenue: currentRevenue,
          ordersToday: todayOrders.length,
          pendingOrders: pendingOrders.length,
          completedOrders: completedOrders.length,
          lowStockProducts: lowStockProducts.length,
        })

        setPreviousStats({
          totalOrders: prevOrders.length,
          totalCustomers: prevCustomers.length,
          totalProducts: allProducts.length,
          totalRevenue: prevRevenue,
        })

        // @ts-ignore
        setRecentOrders(filteredOrders.slice(0, 5))
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [selectedMonth, selectedYear])

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    )
  }

  return (
      <ProtectedRoute>
        <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            </div>

            <Card className="lg:w-auto w-full shadow-sm border border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <div className="flex gap-2">
                    <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number(value))}>
                      <SelectTrigger className="w-32 h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                            <SelectItem key={month.value} value={month.value.toString()}>
                              {month.label}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
                      <SelectTrigger className="w-20 h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="relative overflow-hidden border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Pesanan</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
                    <div className="flex items-center mt-2">
                      {calculatePercentageChange(stats.totalOrders, previousStats.totalOrders) >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                          calculatePercentageChange(stats.totalOrders, previousStats.totalOrders) >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                      }`}>
                      {Math.abs(calculatePercentageChange(stats.totalOrders, previousStats.totalOrders))}% dari bulan lalu
                    </span>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Pelanggan</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
                    <div className="flex items-center mt-2">
                      {calculatePercentageChange(stats.totalCustomers, previousStats.totalCustomers) >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                          calculatePercentageChange(stats.totalCustomers, previousStats.totalCustomers) >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                      }`}>
                      {Math.abs(calculatePercentageChange(stats.totalCustomers, previousStats.totalCustomers))}% dari bulan lalu
                    </span>
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Produk</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalProducts}</p>
                    <div className="flex items-center mt-2">
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-green-600">
                      {stats.lowStockProducts > 0 ? `${stats.lowStockProducts} stok menipis` : 'Stok aman'}
                    </span>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-xl">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalRevenue)}</p>
                    <div className="flex items-center mt-2">
                      {calculatePercentageChange(stats.totalRevenue, previousStats.totalRevenue) >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                          calculatePercentageChange(stats.totalRevenue, previousStats.totalRevenue) >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                      }`}>
                      {Math.abs(calculatePercentageChange(stats.totalRevenue, previousStats.totalRevenue))}% dari bulan lalu
                    </span>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-xl">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Pesanan Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Tidak ada pesanan terbaru</p>
                      </div>
                  ) : (
                      recentOrders.map((order: any) => (
                          <div key={order.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center gap-4">
                              <div className="bg-orange-100 p-2 rounded-lg">
                                <ShoppingCart className="h-5 w-5 text-orange-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">Pesanan #{order.receipt_number || order.id}</p>
                                <p className="text-sm text-gray-600">{new Date(order.order_date).toLocaleDateString('id-ID')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-800">{formatCurrency(Number(order.total))}</p>
                              <div className="mt-1">
                                {getStatusBadge(order.status)}
                              </div>
                            </div>
                          </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Statistik Cepat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-700">Pesanan Hari Ini</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{stats.ordersToday}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-500 p-2 rounded-lg">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-700">Pesanan Pending</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500 p-2 rounded-lg">
                        <ShoppingCart className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-700">Pesanan Selesai</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{stats.completedOrders}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-500 p-2 rounded-lg">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-700">Stok Menipis</span>
                    </div>
                    <span className="text-2xl font-bold text-red-600">{stats.lowStockProducts}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
  )
}