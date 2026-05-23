// ============================================
// Database Types - Estoque Fácil
// ============================================

export type OperationType = 'LOAD' | 'INVENTORY' | 'BLIND_RECEIPT'
export type OperationStatus = 'pending' | 'in_progress' | 'dispatched' | 'completed' | 'cancelled'
export type ItemStatus = 'pending' | 'ok' | 'divergent'
export type UserRole = 'admin' | 'gestor' | 'conferente' | 'motorista'

export interface UserPermissions {
  can_view_dashboard: boolean
  can_manage_loads: boolean
  can_do_conference: boolean
  can_manage_products: boolean
  can_manage_users: boolean
  can_do_delivery: boolean
}

export interface User {
  id: string
  name: string
  username: string
  password_hash: string
  role: UserRole
  active: boolean
  reset_requested?: boolean
  permissions: UserPermissions
  created_at: string
}

export interface Product {
  id: string
  code: string
  external_code?: string
  description: string
  group_name?: string
  stock: number
  batch?: string
  unit_weight?: number
  box_quantity?: number
  created_at: string
}

export interface RelatedCode {
  id: string
  product_id: string
  barcode: string
  multiplier: number // e.g., DUN14 = 12 units
  label: string
}

export interface Operation {
  id: string
  type: OperationType
  status: OperationStatus
  load_number?: string
  client_name?: string
  clients?: string[]
  driver_name?: string
  vehicle_plate?: string
  notes?: string
  created_at: string
  completed_at?: string
  created_by?: string
}

export interface OperationItem {
  id: string
  operation_id: string
  product_id: string
  product_code: string
  description: string
  quantity_expected: number
  quantity_scanned: number
  status: ItemStatus
}

export interface ScanLog {
  id: string
  operation_id: string
  item_id: string
  barcode: string
  quantity: number
  operator_id: string
  scanned_at: string
}

export interface WarehouseSector {
  id: string
  name: string
  areas: WarehouseArea[]
}

export interface WarehouseArea {
  id: string
  sector_id: string
  name: string
}

export interface AdhocCount {
  id: string
  count_number: string
  user_name: string
  status: 'in_progress' | 'completed'
  created_at: string
}

export interface AdhocCountItem {
  id: string
  count_id: string
  product_code: string
  description: string
  group_category?: string
  quantity: number
  created_at: string
  updated_at: string
}

export interface InventoryCount {
  id: string
  count_number: string
  user_name: string
  status: 'in_progress' | 'completed' | 'adjusted'
  authorized_by?: string
  authorized_at?: string
  created_at: string
}

export interface InventoryCountItem {
  id: string
  inventory_id: string
  product_code: string
  description: string
  group_category?: string
  quantity_counted: number
  quantity_system: number
  status: 'ok' | 'divergent' | 'missing' | 'excess'
  created_at: string
  updated_at: string
}

export interface DeliveryRoute {
  id: string
  operation_id: string
  driver_id: string
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
}

export interface DeliveryClient {
  id: string
  delivery_route_id: string
  name: string
  address?: string
  phone?: string
  notes?: string
  status: 'pending' | 'waiting' | 'delivered' | 'delivered_with_divergence' | 'canceled'
  signature_data?: string
  receiver_name?: string
  receiver_doc?: string
  signed_at?: string
  created_at: string
}

export interface DeliveryItem {
  id: string
  delivery_client_id: string
  product_id: string
  product_code: string
  description: string
  quantity_expected: number
  quantity_scanned: number
  status: 'pending' | 'ok' | 'divergent'
  approval_status?: 'approved' | 'pending' | 'rejected'
  requested_qty?: number
  created_at: string
}
