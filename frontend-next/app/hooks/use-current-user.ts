"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"

interface CurrentUser {
    id: number
    name: string
    email: string
}

export function useCurrentUser() {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await api.getCurrentUser()
                setCurrentUser(response.data)
            } catch (error) {
                console.error("Failed to fetch current user:", error)
                setCurrentUser(null)
            } finally {
                setIsLoading(false)
            }
        }

        fetchCurrentUser()
    }, [])

    return { currentUser, isLoading }
}
