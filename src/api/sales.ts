import { supabase, fetchAllRows } from '@/lib/supabase'
import type { PaymentCondition, CustomerPaymentCondition, SalesOrder, SalesOrderItem } from '@/types/database'

export const salesApi = {
  // ============================================
  // Payment Conditions
  // ============================================
  async getPaymentConditions() {
    
    const { data, error } = await supabase
      .from('payment_conditions')
      .select('*')
      
      .order('name')

    if (error) throw error
    return data as PaymentCondition[]
  },

  async createPaymentCondition(condition: Omit<PaymentCondition, 'id' | 'company_id' | 'created_at' | 'updated_at'>) {
    
    const { data, error } = await supabase
      .from('payment_conditions')
      .insert({ ...condition})
      .select()
      .single()

    if (error) throw error
    return data as PaymentCondition
  },

  async updatePaymentCondition(id: string, condition: Partial<PaymentCondition>) {
    const { data, error } = await supabase
      .from('payment_conditions')
      .update(condition)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as PaymentCondition
  },

  async deletePaymentCondition(id: string) {
    const { error } = await supabase
      .from('payment_conditions')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ============================================
  // Customer Payment Conditions
  // ============================================
  async getCustomerPaymentConditions(customerId: string) {
    const { data, error } = await supabase
      .from('customer_payment_conditions')
      .select('*, payment_condition:payment_conditions(*)')
      .eq('customer_id', customerId)

    if (error) throw error
    return data as CustomerPaymentCondition[]
  },

  async setCustomerPaymentConditions(customerId: string, paymentConditionIds: string[]) {
    // Apaga as atuais
    await supabase
      .from('customer_payment_conditions')
      .delete()
      .eq('customer_id', customerId)

    if (paymentConditionIds.length > 0) {
      const inserts = paymentConditionIds.map(pid => ({
        customer_id: customerId,
        payment_condition_id: pid
      }))
      const { error } = await supabase
        .from('customer_payment_conditions')
        .insert(inserts)
      
      if (error) throw error
    }
  },

  // ============================================
  // Sales Orders
  // ============================================
  async getSalesOrders() {
    
    const query = supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(*),
        sales_rep:sales_reps(*),
        payment_condition:payment_conditions(*),
        price_table:price_tables(*),
        order_group:order_groups(*)
      `)
      .order('created_at', { ascending: false })

    return await fetchAllRows<SalesOrder>(query)
  },

  async getSalesOrder(id: string) {
    const { data, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(*),
        sales_rep:sales_reps(*),
        payment_condition:payment_conditions(*),
        price_table:price_tables(*),
        items:sales_order_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as SalesOrder
  },

  async createSalesOrder(order: Omit<SalesOrder, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'customer' | 'sales_rep' | 'payment_condition' | 'price_table' | 'items'> & { order_number?: number }) {
    
    const { data, error } = await supabase
      .from('sales_orders')
      .insert({ ...order})
      .select()
      .single()

    if (error) throw error
    return data as SalesOrder
  },

  async updateSalesOrder(id: string, order: Partial<SalesOrder>) {
    // Buscar o pedido atual antes de atualizar para verificar mudança de status
    const { data: oldOrder } = await supabase
      .from('sales_orders')
      .select('status')
      .eq('id', id)
      .single()

    const { data, error } = await supabase
      .from('sales_orders')
      .update(order)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Se o pedido foi cancelado (e antes não era), liberar o estoque reservado
    if (order.status === 'Cancelado' && oldOrder?.status !== 'Cancelado') {
      const { data: items } = await supabase
        .from('sales_order_items')
        .select('product_id, quantity')
        .eq('sales_order_id', id)
      
      if (items && items.length > 0) {
        // Usa a productsApi (ou chama rpc direto aqui pra evitar dependência circular se houver)
        for (const item of items) {
          await supabase.rpc('increment_reserved_stock', {
            p_product_id: item.product_id,
            p_delta: -item.quantity
          })
        }
      }
    }

    return data as SalesOrder
  },

  async deleteSalesOrder(id: string) {
    // Delete items first? Supabase probably has cascade delete, but if not we can just delete the order and let it cascade or fail
    const { error } = await supabase
      .from('sales_orders')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  },

  // ============================================
  // Sales Order Items
  // ============================================
  async addSalesOrderItems(items: Omit<SalesOrderItem, 'id' | 'created_at' | 'product'>[]) {
    if (items.length === 0) return []

    const { data, error } = await supabase
      .from('sales_order_items')
      .insert(items)
      .select()

    if (error) throw error

    // Aumentar o estoque reservado para cada item inserido
    for (const item of items) {
      await supabase.rpc('increment_reserved_stock', {
        p_product_id: item.product_id,
        p_delta: item.quantity
      })
    }

    return data as SalesOrderItem[]
  },

  async updateSalesOrderItem(id: string, updates: Partial<SalesOrderItem>) {
    const { data: oldItem } = await supabase
      .from('sales_order_items')
      .select('product_id, quantity')
      .eq('id', id)
      .single()

    const { data, error } = await supabase
      .from('sales_order_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Adjust reserved stock if quantity changed
    if (oldItem && updates.quantity !== undefined && oldItem.quantity !== updates.quantity) {
      const delta = updates.quantity - oldItem.quantity
      await supabase.rpc('increment_reserved_stock', {
        p_product_id: oldItem.product_id,
        p_delta: delta
      })
    }

    return data as SalesOrderItem
  },

  async deleteSalesOrderItem(id: string) {
    const { data: item } = await supabase
      .from('sales_order_items')
      .select('product_id, quantity')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('sales_order_items')
      .delete()
      .eq('id', id)

    if (error) throw error

    if (item) {
      await supabase.rpc('increment_reserved_stock', {
        p_product_id: item.product_id,
        p_delta: -item.quantity
      })
    }

    return true
  },

  // ============================================
  // Order Groups
  // ============================================
  async getOrderGroups() {
    const { data, error } = await supabase
      .from('order_groups')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async createOrderGroup(group: any) {
    const { data, error } = await supabase
      .from('order_groups')
      .insert(group)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateOrderGroup(id: string, group: any) {
    const { data, error } = await supabase
      .from('order_groups')
      .update(group)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteOrderGroup(id: string) {
    const { error } = await supabase
      .from('order_groups')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }
}
