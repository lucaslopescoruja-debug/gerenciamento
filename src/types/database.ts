// ============================================
// Database Types - Estoque Fácil
// ============================================

export type OperationType = 'LOAD' | 'INVENTORY' | 'BLIND_RECEIPT' | 'RECEIPT' | 'RETURN'
export type OperationStatus = 'pending' | 'in_progress' | 'dispatched' | 'completed' | 'cancelled'
export type ItemStatus = 'pending' | 'ok' | 'divergent'
export type UserRole = 'admin' | 'gestor' | 'conferente' | 'motorista' | 'ajudante' | 'vendedor' | 'representante' | 'operador' | 'mecanico' | 'master'

export interface UserPermissions {
  can_view_dashboard: boolean
  can_manage_loads: boolean
  can_do_conference: boolean
  can_manage_products: boolean
  can_manage_users: boolean
  can_do_delivery: boolean
  
  // Novas permissões
  can_use_sales_app?: boolean
  can_manage_sales?: boolean
  can_manage_price_tables?: boolean
  can_manage_payment_conditions?: boolean
  can_manage_customers?: boolean
  can_manage_reps?: boolean
  can_manage_regions?: boolean
  can_manage_integrations?: boolean
  can_manage_equipments?: boolean

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
  plan?: 'bronze' | 'prata' | 'ouro' | 'platina'
  garage_address?: string | null
  garage_cep?: string | null
  garage_street?: string | null
  garage_number?: string | null
  garage_complement?: string | null
  garage_neighborhood?: string | null
  garage_city?: string | null
  garage_state?: string | null
  fantasy_name?: string | null
  phone?: string | null
  email?: string | null
  additional_info?: string | null
  garage_lat?: number | null
  garage_lng?: number | null
  maxiprod_api_token?: string | null
  maxiprod_last_sync?: string | null
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
  auth_user_id?: string
  company_id: string
  is_super_admin?: boolean
  name: string
  username: string
  email?: string
  phone?: string
  avatar_url?: string
  role: UserRole
  active: boolean
  reset_requested?: boolean
  must_change_password?: boolean
  permissions: UserPermissions
  created_at: string
}

export interface Customer {
  id: string
  company_id: string
  active: boolean
  nickname: string | null
  document_type: 'CPF' | 'CNPJ' | null
  document: string | null
  fantasy_name: string | null
  legal_name: string | null
  cep: string | null
  address: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  po_box: string | null
  city: string | null
  state: string | null
  latitude?: number | null
  longitude?: number | null
  phone1: string | null
  phone2: string | null
  phone3: string | null
  phone4: string | null
  email: string | null
  credit_limit: number | null
  price_table_id: string | null
  payment_condition: string | null
  allow_unit_price_change: boolean | null
  region_id: string | null
  sales_rep_id: string | null
  created_at: string
  updated_at: string
  equipments?: CustomerEquipment[]
  sales_rep_obj?: SalesRep | null
  region?: Region | null
  price_table?: PriceTable | null
}

export interface SalesRep {
  id: string
  company_id: string
  active: boolean
  nickname: string | null
  legal_name: string | null
  document: string | null
  phone: string | null
  city: string | null
  state: string | null
  commission_rate: number | null
  created_at: string
  updated_at: string
  sales_rep_regions?: { region: Region }[]
}

export interface Region {
  id: string
  company_id: string
  name: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface PriceTable {
  id: string
  company_id: string
  code: string | null
  name: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface PriceTableItem {
  id: string
  price_table_id: string
  product_id: string
  price: number
  discount_percent: number | null
  max_discount_percent: number | null
  created_at: string
  updated_at: string
  product?: Product // Relation
}

export interface PaymentCondition {
  id: string
  company_id: string
  name: string
  active: boolean
  installments: number
  created_at: string
  updated_at: string
}

export interface CustomerPaymentCondition {
  id: string
  customer_id: string
  payment_condition_id: string
  created_at: string
  payment_condition?: PaymentCondition
}

export interface SalesOrder {
  id: string
  company_id: string
  customer_id: string
  sales_rep_id: string | null
  price_table_id: string | null
  payment_condition_id: string | null
  status: 'Rascunho' | 'Enviado' | 'Faturado' | 'Cancelado'
  total_amount: number
  total_discount: number
  net_amount: number
  notes: string | null
  delivery_date: string | null
  created_at: string
  updated_at: string
  
  customer?: Customer
  sales_rep?: SalesRep
  payment_condition?: PaymentCondition
  price_table?: PriceTable
  items?: SalesOrderItem[]
}

export interface SalesOrderItem {
  id: string
  sales_order_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount_percent: number
  net_price: number
  total_price: number
  created_at: string
  
  product?: Product
}

export interface CustomerEquipment {
  id: string
  customer_id: string
  company_id: string
  description: string
  serial_number: string | null
  delivered_at: string | null
  returned_at: string | null
  status: 'active' | 'returned'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  company_id: string
  code: string
  external_code?: string
  factory_code?: string
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
  extra_info?: string | null
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
  status?: 'pending' | 'in_progress' | 'completed'
  created_at: string
}

export interface PlannedInventoryCount {
  id: string
  inventory_id: string
  area_id: string
  product_code: string
  quantity: number
  extra_info?: string | null
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
  customer_id?: string | null
  name: string
  order_number?: string
  address?: string
  phone?: string
  notes?: string
  latitude?: number | null
  longitude?: number | null
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
  requested_by_name?: string
  created_at: string
}

export interface Equipment {
  id: string
  company_id: string
  patrimony: string
  type: string
  model: string
  size: string | null
  status: 'Teste' | 'Disponível' | 'Em Manutenção' | 'Danificado' | 'No Cliente' | 'Equipamento de Estoque'
  current_customer_id: string | null
  created_at: string
  updated_at: string
  customer?: Customer
}

export interface EquipmentOrder {
  id: string
  os_number: number
  company_id: string
  customer_id: string | null
  equipment_id: string
  delivery_route_id?: string | null
  delivery_sequence?: number
  type: 'entrega' | 'recolha' | 'troca' | 'manutencao'
  status: 'pendente' | 'em_rota' | 'concluido' | 'cancelado'
  driver_id: string | null
  scheduled_date: string | null
  completed_at: string | null
  signature_data: string | null
  term_pdf_url: string | null
  receiver_name: string | null
  receiver_doc: string | null
  notes: string | null
  defect_description: string | null
  solution_description: string | null
  action_taken: string | null
  created_at: string
  updated_at: string
  customer?: Customer
  equipment?: Equipment
  driver?: User
}

export interface Supply {
  id: string
  company_id: string
  name: string
  unit: string
  stock_quantity: number
  created_at: string
  updated_at: string
}

export interface SupplyRequest {
  id: string
  company_id: string
  mechanic_id: string
  supply_id: string
  quantity_requested: number
  status: 'pendente' | 'aprovado' | 'rejeitado'
  notes: string | null
  created_at: string
  updated_at: string
  mechanic?: User
  supply?: Supply
}

export interface EquipmentOrderSupply {
  id: string
  order_id: string
  supply_id: string
  quantity_consumed: number
  created_at: string
  supply?: Supply
}

export interface EquipmentHistory {
  id: string
  company_id: string
  equipment_id: string
  customer_id: string | null
  action: string
  notes: string | null
  created_by: string | null
  created_at: string
  customer?: Customer
  user?: User
  equipment?: Equipment
}
