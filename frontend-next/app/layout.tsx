'use client'

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    const pathName = usePathname()

    useEffect(() => {
        if (
            pathName !== '/' &&
            pathName !== '/auth/login' &&
            pathName !== '/auth/register'
        ) {
            localStorage.setItem('last_page', pathName)
        }
    }, [pathName])

    return (
        <html lang="en">
        <body className={inter.className}>
        <Toaster />
        <AuthProvider>
                {children}
        </AuthProvider>
        </body>
        </html>
    )
}
