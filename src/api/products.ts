import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/database'


export const productsApi = {
  async getProducts() {
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      
      .order('description')
    if (error) throw error
    // Ensure codes keep leading zeros by converting to string
    const normalized = (data ?? []).map(p => ({
      ...p,
      code: String(p.code),
      factory_code: p.factory_code ? String(p.factory_code) : null,
      external_code: p.external_code ? String(p.external_code) : null})) as Product[]
    return normalized
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'company_id'>) {
    
    const { data, error } = await supabase
      .from('products')
      .insert([{ ...product}])
      .select()
      .single()
    if (error) throw error
    return data as Product
  },

  async addRelatedCode(relatedCode: Omit<any, 'id' | 'created_at'>) {
    
    const { data, error } = await supabase
      .from('related_codes')
      .insert([{ ...relatedCode}])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getRelatedCodes(productId: string) {
    
    const { data, error } = await supabase
      .from('related_codes')
      .select('*')
      .eq('product_id', productId)
      
    if (error) throw error
    return data
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

  async deleteAllProducts() {
    const { error } = await supabase
      .from('products')
      .delete()
      .not('id', 'is', null)
      
    if (error) throw error
    return true
  },

  async setAllStockTo100() {
    const { error } = await supabase
      .from('products')
      .update({ stock: 100 })
      .not('id', 'is', null)
      
    if (error) throw error
    return true
  },

  async incrementStockByCode(code: string, qtyToAdd: number) {
    const { data, error } = await supabase.rpc('increment_stock_by_code', {
      p_code: code,
      p_delta: qtyToAdd
    });
    if (error) throw error;
    // Retorna um objeto mock só para manter retrocompatibilidade simples, ou o valor real
    return { stock: data } as unknown as Product;
  }
}
