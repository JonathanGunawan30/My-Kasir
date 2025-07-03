"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Users, ShoppingCart, Package, FolderOpen, UserCheck, Shield, BarChart3, Menu, X, ChefHat } from "lucide-react"
import { authService } from "@/lib/auth" // pastikan path-nya benar

const baseNavigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: BarChart3, permission: null },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart, permission: "view_orders" },
    { name: "Products", href: "/admin/products", icon: Package, permission: "view_products" },
    { name: "Product Categories", href: "/admin/categories", icon: FolderOpen, permission: "view_categories" },
    { name: "Customers", href: "/admin/customers", icon: Users, permission: "view_customers" },
    { name: "User Management", href: "/admin/users", icon: UserCheck, permission: "view_users" },
    { name: "Role & Permissions", href: "/admin/roles", icon: Shield, permission: "view_roles" },
]

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const [permissions, setPermissions] = useState<string[]>([])

    useEffect(() => {
        const user = authService.getUser()
        setPermissions(user?.permissions || [])
    }, [])

    const navigation = useMemo(() => {
        return baseNavigation.filter(item => !item.permission || permissions.includes(item.permission))
    }, [permissions])

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                        <ChefHat className="h-8 w-8 text-orange-500" />
                        <span className="text-xl font-bold text-gray-900">My Kasir</span>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100",
                                        isActive
                                            ? "bg-orange-50 text-orange-600 border-r-2 border-orange-500"
                                            : "text-gray-700 hover:text-gray-900",
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden" onClick={() => setIsOpen(false)} />
            )}
        </>
    )
}
