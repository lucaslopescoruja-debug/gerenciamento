import { supabase } from '@/lib/supabase'
import type { PaymentCondition, CustomerPaymentCondition, SalesOrder, SalesOrderItem } from '@/types/database'
import { currentCompanyId } from '@/contexts/AuthContext'

export const salesApi = {
  // ============================================
  // Payment Conditions
  // ============================================
  async getPaymentConditions() {
    if (!currentCompanyId) return []

    const { data, error } = await supabase
      .from('payment_conditions')
      .select('*')
      .eq('company_id', currentCompanyId)
      .order('name')

    if (error) throw error
    return data as PaymentCondition[]
  },

  async createPaymentCondition(condition: Omit<PaymentCondition, 'id' | 'company_id' | 'created_at' | 'updated_at'>) {
    if (!currentCompanyId) throw new Error('Empresa não selecionada')

    const { data, error } = await supabase
      .from('payment_conditions')
      .insert({ ...condition, company_id: currentCompanyId })
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
    if (!currentCompanyId) return []

    const { data, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(*),
        sales_rep:sales_reps(*),
        payment_condition:payment_conditions(*),
        price_table:price_tables(*)
      `)
      .eq('company_id', currentCompanyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as SalesOrder[]
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

  async createSalesOrder(order: Omit<SalesOrder, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'customer' | 'sales_rep' | 'payment_condition' | 'price_table' | 'items'>) {
    if (!currentCompanyId) throw new Error('Empresa não selecionada')

    const { data, error } = await supabase
      .from('sales_orders')
      .insert({ ...order, company_id: currentCompanyId })
      .select()
      .single()

    if (error) throw error
    return data as SalesOrder
  },

  async updateSalesOrder(id: string, order: Partial<SalesOrder>) {
    const { data, error } = await supabase
      .from('sales_orders')
      .update(order)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as SalesOrder
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
    return data as SalesOrderItem[]
  }
}
