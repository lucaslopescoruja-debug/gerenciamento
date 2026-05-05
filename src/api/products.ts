import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/database'

export const productsApi = {
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('description')
    if (error) throw error
    return data as Product[]
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single()
    if (error) throw error
    return data as Product
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Product
  },

  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  },

  async incrementStockByCode(code: string, qtyToAdd: number) {
    const { data: prods, error: err1 } = await supabase
      .from('products')
      .select('*')
      .or(`code.eq.${code},external_code.eq.${code}`)
      .limit(1)
    if (err1) throw err1
    if (!prods || prods.length === 0) return null
    
    const p = prods[0]
    const { data, error } = await supabase
      .from('products')
      .update({ stock: (p.stock || 0) + qtyToAdd })
      .eq('id', p.id)
      .select()
      .single()
    if (error) throw error
    return data as Product
  }
}
