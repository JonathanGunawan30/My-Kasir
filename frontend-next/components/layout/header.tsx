"use client"

import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
  const { user, logout } = useAuth()

  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== "string") {
      return "U";
    }
    return name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
  };

  let userRole: string = "N/A Role";
  if (user?.role) {
    if (Array.isArray(user.role) && user.role.length > 0) {
      userRole = user.role[0].name;
    } else if (typeof user.role === 'string') {
      userRole = user.role;
    }
  }

  return (
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="group flex items-center p-0 rounded-full transition-all duration-200 hover:bg-gray-100 focus:ring-2 focus:ring-orange-200 focus:ring-offset-2"
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      {user?.avatar && <AvatarImage src={user.avatar} alt={user.name || "User Avatar"} />}
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>

                    {user && (
                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-500 transform translate-x-1/4 translate-y-1/4 group-hover:bg-green-600 transition-colors duration-200"></span>
                    )}
                  </div>

                  <span className="hidden md:flex flex-col items-start ml-3 mr-2">
                    <span className="font-semibold text-sm text-gray-800 leading-none">
                    {user?.name || "Guest User"}
                  </span>
                    {user && userRole !== "N/A Role" && (
                        <span className="text-xs text-gray-500 leading-none mt-0.5">
                      {userRole}
                    </span>
                    )}
                </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {user?.name && <p className="font-semibold">{user.name}</p>}
                  {user?.email && <p className="text-sm text-gray-500 truncate">{user.email}</p>}
                  {user && userRole !== "N/A Role" && <p className="text-xs text-gray-600 mt-1">Role: {userRole}</p>}
                  {!user && <p className="text-sm text-gray-500">Not Logged In</p>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 cursor-pointer"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
  );
}