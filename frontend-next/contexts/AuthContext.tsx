import React, { createContext, useContext, useEffect, useState } from "react"
import { authService, User } from "@/lib/auth"

interface AuthContextType {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (data: { name: string; email: string; password: string; password_confirmation: string }) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {

        const token = authService.getToken()
        const savedUser = authService.getUser()


        if (token && savedUser) {
            setUser(savedUser)
        }

        setTimeout(()=> {
            setIsLoading(false)
        }, 0);
    }, [])


    const login = async (email: string, password: string) => {

        try {
            const response = await authService.login({ email, password })

            const userData = {
                id: response.data.id,
                name: response.data.name,
                email: response.data.email,
                status: response.data.status,
            }

            setUser(prevUser => {
                return userData
            })

            setTimeout(() => {
                const currentUser = authService.getUser()
            }, 50)

        } catch (error) {
            throw error
        }
    }

    const register = async (data: { name: string; email: string; password: string; password_confirmation: string }) => {
        try {
            const response = await authService.register(data)

            const userData = {
                id: response.data.id,
                name: response.data.name,
                email: response.data.email,
                status: response.data.status,
            }

            setUser(prevUser => {
                return userData
            })

        } catch (error) {
            throw error
        }
    }

    const logout = () => {
        authService.logout()
        setUser(null)
    }

    const contextValue = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error("useAuth must be used within an AuthProvider")
    return context
}