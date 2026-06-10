// ============================================
// Database Types - Estoque Fácil
// ============================================

export type OperationType = 'LOAD' | 'INVENTORY' | 'BLIND_RECEIPT' | 'RECEIPT' | 'RETURN'
export type OperationStatus = 'pending' | 'in_progress' | 'dispatched' | 'completed' | 'cancelled'
export type ItemStatus = 'pending' | 'ok' | 'divergent'
export type UserRole = 'admin' | 'gestor' | 'conferente' | 'motorista' | 'ajudante'

export interface UserPermissions {
  can_view_dashboard: boolean
  can_manage_loads: boolean
  can_do_conference: boolean
  can_manage_products: boolean
  can_manage_users: boolean
  can_do_delivery: boolean
  
  // SaaS Master Permissions
  can_manage_saas_finance?: boolean
  can_manage_saas_clients?: boolean
  can_manage_saas_staff?: boolean
}

export interface Company {
  id: string
  slug: string
  name: string
  cnpj?: string
  max_users: number
  active: boolean
  billing_day?: number
  monthly_fee?: number
  plan?: 'bronze' | 'prata' | 'ouro'
  created_at: string
}

export interface CompanyPayment {
  id: string
  company_id: string
  amount: number
  status: 'pendente' | 'pago' | 'atrasado'
  due_date: string
  paid_at?: string
  notes?: string
  created_at: string
}

export interface SaaSPlan {
  id: string
  name: string
  base_price: number
  base_users: number
  extra_user_price: number
  created_at: string
}

export interface SystemNote {
  id: string
  author_id: string
  author_name: string
  content: string
  checked?: boolean
  created_at: string
}

export interface User {
  id: string
  company_id: string
  is_super_admin?: boolean
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
  company_id: string
  code: string
  external_code?: string
  description: string
  group_name?: string
  stock: number
  min_stock_alert?: number
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
  company_id: string
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
  company_id: string
  operation_id: string
  product_id: string
  product_code: string
  description: string
  quantity_expected: number
  quantity_scanned: number
  status: ItemStatus
  system_stock_at_load?: number
  physical_verification?: 'pending' | 'really_zero' | 'found'
  physical_divergence_found?: boolean
  divergence_resolved?: boolean
}

export interface OperationAlert {
  id: string
  company_id: string
  operation_id: string
  product_id?: string
  product_code: string
  description: string
  quantity_expected: number
  quantity_scanned: number
  quantity_missing: number
  resolved: boolean
  created_at: string
  operation?: {
    load_number?: string
    driver_name?: string
  }
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

export interface PlannedInventory {
  id: string
  name: string
  status: 'planning' | 'in_progress' | 'completed'
  company_id: string
  collection_rule: 'any' | 'registered_only' | 'confirm_unknown'
  divergence_rule: 'ignore_uncollected' | 'zero_uncollected'
  created_at: string
  updated_at: string
}

export interface PlannedInventorySector {
  id: string
  inventory_id: string
  name: string
  created_at: string
}

export interface PlannedInventoryArea {
  id: string
  inventory_id: string
  sector_id?: string
  area_number?: number
  name: string
  description?: string
  created_at: string
}

export interface PlannedInventoryCount {
  id: string
  inventory_id: string
  area_id: string
  product_code: string
  quantity: number
  user_name: string
  created_at: string
  updated_at: string
}

export interface DeliveryRoute {
  id: string
  company_id: string
  operation_id: string
  driver_id: string
  helper_id?: string
  title?: string
  scheduled_date?: string
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
}

export interface DeliveryClient {
  id: string
  company_id: string
  delivery_route_id: string
  name: string
  order_number?: string
  address?: string
  phone?: string
  notes?: string
  status: 'pending' | 'waiting' | 'delivered' | 'delivered_with_divergence' | 'canceled' | 'returned'
  signature_data?: string
  receiver_name?: string
  receiver_doc?: string
  return_reason?: string
  signed_at?: string
  delivery_sequence?: number
  created_at: string
}

export interface DeliveryItem {
  id: string
  company_id: string
  delivery_client_id: string
  product_id: string
  product_code: string
  description: string
  quantity_expected: number
  quantity_scanned: number
  status: 'pending' | 'ok' | 'divergent'
  approval_status?: 'approved' | 'pending' | 'rejected'
  returned_to_stock?: boolean
  requested_qty?: number
  return_reason?: string
  created_at: string
}
