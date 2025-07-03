export interface Customer {
  id: number
  name: string
  phone: string
  saldo: number
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface User {
  id: number
  name: string
  email: string
  password?: string
  status: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Category {
  id: number
  name: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  category_product_id: number
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Order {
  receipt_number: string
  id: number
  customer_id: number
  user_id: number
  order_date: string
  total: number
  tax_amount: number
  grand_total: number
  discount: number
  payment_method: "qris" | "cash" | "credit_card" | "debit_card"
  status: "pending" | "completed" | "cancelled" | "processing" | string
  customer?: Customer
  user?: User
  details?: OrderDetail[]
  order_details?: OrderDetail[]
}

export interface OrderDetail {
  id: number
  order_id: number
  product_id: number
  quantity: number
  price: number | string
  subtotal: number | string
  product?: Product
  created_at?: string
  updated_at?: string
  deleted_at?: string
}

export interface Role {
  id: number
  name: string
  permissions?: Permission[]
}

export interface Permission {
  id: number
  name: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  status: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface OrderPayload {
  user_id: number
  customer_id: number
  items: OrderItemPayload[]
}

export interface OrderItemPayload {
  product_id: number
  quantity: number
}

export interface ApiOrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  price: number
  subtotal: number
  product: Product
}

export interface RewardTier {
  min_total: number;
  bonus: number;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  avatar?: string;
}