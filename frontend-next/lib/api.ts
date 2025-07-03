// src/lib/api.ts

import type { Customer, Product, Category, Order, User, Role, ApiResponse, OrderPayload } from "@/types"

const API_BASE_URL = "http://localhost:8000/api"

export interface RewardTier {
  min_total: number;
  bonus: number;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string | string[] | null;
  created_at: string;
  avatar?: string | null;
}

interface ApiRequestOptions extends RequestInit {
  skipAuthRedirect?: boolean
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private getAuthHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("X-API-TOKEN") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const { skipAuthRedirect, ...fetchOptions } = options

    const isFormData = fetchOptions.body instanceof FormData;

    const headers = {
      ...this.getAuthHeaders(),
      ...fetchOptions.headers,
    };

    if (isFormData) {
      // @ts-ignore
      delete headers['Content-Type'];
    } else {
      // @ts-ignore
      if (!headers['Content-Type']) {
        // @ts-ignore
        headers['Content-Type'] = 'application/json';
      }
      if (fetchOptions.body && typeof fetchOptions.body !== 'string') {
        fetchOptions.body = JSON.stringify(fetchOptions.body);
      }
    }

    const config: RequestInit = {
      headers: headers,
      ...fetchOptions,
    };

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        if (response.status === 401 && typeof window !== "undefined" && !skipAuthRedirect) {
          localStorage.removeItem("X-API-TOKEN")
          localStorage.removeItem("X-AUTH-USER")
          window.location.href = "/auth/login"
          throw new Error("Authentication failed, redirecting to login.")
        }

        let errorMessage = `HTTP error! status: ${response.status}`
        const errorPayload: any = {}

        try {
          const data = await response.json()
          errorPayload.raw = data
          errorPayload.statusCode = response.status

          if (typeof data.message === "string") {
            errorMessage = data.message
          } else if (Array.isArray(data.message)) {
            errorMessage = data.message[0]
          }

          if (data.errors && typeof data.errors === "object") {
            errorPayload.errors = data.errors
            for (const key of Object.keys(data.errors)) {
              if (Array.isArray(data.errors[key]) && typeof data.errors[key][0] === "string") {
                errorMessage = data.errors[key][0]
                break
              }
            }
          }
        } catch (parseErr) {
          console.warn("Failed to parse error JSON", parseErr)
        }

        console.error("API request failed:", errorMessage, errorPayload)
        const error = new Error(errorMessage)
        Object.assign(error, errorPayload)
        throw error
      }

      return await response.json()
    } catch (error) {
      console.error("API request failed caught by client:", error)
      throw error
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint)
  }

  async post<T>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data,
      ...options,
    })
  }

  async patch<T>(endpoint: string, data: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data,
      ...options,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    })
  }

  async getCustomers(): Promise<ApiResponse<Customer[]>> {
    return this.get<Customer[]>("/customers")
  }

  async getCustomer(id: number): Promise<ApiResponse<Customer>> {
    return this.get<Customer>(`/customers/${id}`)
  }

  async createCustomer(data: Partial<Customer>): Promise<ApiResponse<Customer>> {
    return this.post<Customer>("/customers", data)
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<ApiResponse<Customer>> {
    return this.patch<Customer>(`/customers/${id}`, data)
  }

  async deleteCustomer(id: number): Promise<ApiResponse<void>> {
    return this.delete<void>(`/customers/${id}`)
  }

  async searchCustomers(query: string): Promise<ApiResponse<Customer[]>> {
    return this.get<Customer[]>(`/customers/search?q=${query}`)
  }

  async getProducts(): Promise<ApiResponse<Product[]>> {
    return this.get<Product[]>("/products")
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return this.get<Product>(`/products/${id}`)
  }

  async createProduct(data: Partial<Product>): Promise<ApiResponse<Product>> {
    return this.post<Product>("/products", data)
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<ApiResponse<Product>> {
    return this.patch<Product>(`/products/${id}`, data)
  }

  async deleteProduct(id: number): Promise<ApiResponse<void>> {
    return this.delete<void>(`/products/${id}`)
  }

  async searchProducts(query: string): Promise<ApiResponse<Product[]>> {
    return this.get<Product[]>(`/products/search?q=${query}`)
  }

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.get<Category[]>("/categories")
  }

  async getCategory(id: number): Promise<ApiResponse<Category>> {
    return this.get<Category>(`/categories/${id}`)
  }

  async createCategory(data: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.post<Category>("/categories", data)
  }

  async updateCategory(id: number, data: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.patch<Category>(`/categories/${id}`, data)
  }

  async deleteCategory(id: number): Promise<ApiResponse<void>> {
    return this.delete<void>(`/categories/${id}`)
  }

  async searchCategories(query: string): Promise<ApiResponse<Category[]>> {
    return this.get<Category[]>(`/categories/search?q=${query}`)
  }

  async getOrders(): Promise<ApiResponse<Order[]>> {
    return this.get<Order[]>("/orders")
  }

  async getOrder(id: number): Promise<ApiResponse<Order>> {
    return this.get<Order>(`/orders/${id}`)
  }

  async createOrder(data: OrderPayload): Promise<ApiResponse<Order>> {
    return this.post<Order>("/orders", data)
  }

  async updateOrder(id: number, data: OrderPayload): Promise<ApiResponse<Order>> {
    return this.patch<Order>(`/orders/${id}`, data)
  }

  async deleteOrder(id: number): Promise<ApiResponse<void>> {
    return this.delete<void>(`/orders/${id}`)
  }

  async searchOrders(query: string): Promise<ApiResponse<Order[]>> {
    return this.get<Order[]>(`/orders/search?q=${query}`)
  }

  async updateOrderStatus(orderId: number, status: string): Promise<ApiResponse<Order>> {
    return this.patch<Order>(`/orders/${orderId}/status`, { status })
  }

  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.get<User[]>("/users")
  }

  async getUser(id: number): Promise<ApiResponse<User>> {
    return this.get<User>(`/users/${id}`)
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.get<User>("/users/current")
  }

  async createUser(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.post<User>("/users", data)
  }

  async updateUser(id: number, data: Partial<User>): Promise<ApiResponse<User>> {
    return this.patch<User>(`/users/${id}`, data)
  }

  async deleteUser(id: number): Promise<ApiResponse<void>> {
    return this.delete<void>(`/users/${id}`)
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    return this.get<User[]>(`/users/search?q=${query}`)
  }

  async getRoles(): Promise<ApiResponse<Role[]>> {
    return this.get<Role[]>("/roles")
  }

  async getRole(id: number): Promise<ApiResponse<Role>> {
    return this.get<Role>(`/roles/${id}`)
  }

  async createRole(data: Partial<Role>): Promise<ApiResponse<Role>> {
    return this.post<Role>("/roles", data)
  }

  async updateRole(id: number, data: Partial<Role>): Promise<ApiResponse<Role>> {
    return this.patch<Role>(`/roles/${id}`, data)
  }

  async deleteRole(id: number): Promise<ApiResponse<void>> {
    return this.delete<void>(`/roles/${id}`)
  }

  async searchRoles(query: string): Promise<ApiResponse<Role[]>> {
    return this.get<Role[]>(`/roles/search?q=${query}`)
  }

  async attachPermissions(roleId: number, permissionIds: number[]): Promise<ApiResponse<any>> {
    return this.post<any>(`/roles/${roleId}/attach-permissions`, { permission_ids: permissionIds })
  }

  async detachPermissions(roleId: number, permissionIds: number[]): Promise<ApiResponse<any>> {
    return this.post<any>(`/roles/${roleId}/detach-permissions`, { permission_ids: permissionIds })
  }

  async getRewardTiers(): Promise<ApiResponse<RewardTier[]>> {
    return this.get<RewardTier[]>("/config/rewards");
  }

  async sendPasswordResetLink(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>("/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  async resetPassword(data: { email: string; password: string; password_confirmation: string; token: string }): Promise<
      ApiResponse<{ message: string }>
  > {
    return this.request<{ message: string }>("/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.get<UserProfile>("/profile");
  }

  async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.patch<UserProfile>("/profile", data);
  }

  async changePassword(data: any): Promise<ApiResponse<any>> {
    return this.post<any>("/profile/change-password", data);
  }

  async uploadAvatar(formData: FormData): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>("/profile/upload-avatar", {
      method: "POST",
      body: formData,
    });
  }

  async setGravatarAvatar(): Promise<ApiResponse<UserProfile>> {
    return this.post<UserProfile>("/profile/set-gravatar");
  }
}

export const api = new ApiClient(API_BASE_URL)