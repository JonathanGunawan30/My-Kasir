import { api } from "./api"

export interface User {
    id: number
    name: string
    email: string
    status: string
    role: string
    permissions: string[],
    avatar?: string
}

export interface AuthResponse {
    data: {
        id: number
        name: string
        email: string
        token: string
        status: string
    }
    statusCode: number
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterCredentials {
    name: string
    email: string
    password: string
    password_confirmation: string
}

class AuthService {
    private tokenKey = "X-API-TOKEN"
    private userKey = "X-AUTH-USER"

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        // @ts-ignore
        const response = await api.post<AuthResponse>("/login", credentials, {
            skipAuthRedirect: true,
        })

        if (response.data.token) {
            this.setToken(response.data.token)
            this.setUser({
                id: response.data.id,
                name: response.data.name,
                email: response.data.email,
                status: response.data.status,
                role: response.data.role,
                permissions: response.data.permissions,
                avatar: response.data.avatar,
            })

        }
        localStorage.setItem("X-API-TOKEN", response.data.token);


        return response
    }

    async register(credentials: RegisterCredentials): Promise<AuthResponse> {
        // @ts-ignore
        const response = await api.post<AuthResponse>("/register", credentials)

        if (response.data.token) {
            this.setToken(response.data.token)
            this.setUser({
                id: response.data.id,
                name: response.data.name,
                email: response.data.email,
                status: response.data.status,
                role: response.data.role || "Guest",
                permissions: response.data.permissions || [],
            })

        }

        return response
    }

    logout(): void {
        if (typeof window !== "undefined") {
            localStorage.removeItem(this.tokenKey)
            localStorage.removeItem(this.userKey)
            document.cookie = `${this.tokenKey}=; path=/; max-age=0`
        }
    }

    getToken(): string | null {
        if (typeof window !== "undefined") {
            return localStorage.getItem(this.tokenKey)
        }
        return null
    }

    setToken(token: string): void {
        if (typeof window !== "undefined") {
            localStorage.setItem(this.tokenKey, token)
            document.cookie = `${this.tokenKey}=${token}; path=/; max-age=86400`
        }
    }

    getUser(): User | null {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem(this.userKey)
            return userStr ? JSON.parse(userStr) : null
        }
        return null
    }

    setUser(user: User): void {
        if (typeof window !== "undefined") {
            localStorage.setItem(this.userKey, JSON.stringify(user))
        }
    }

    isAuthenticated(): boolean {
        return !!this.getToken()
    }
}

export const authService = new AuthService()
