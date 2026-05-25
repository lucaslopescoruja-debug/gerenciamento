import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/database'
import { currentCompanyId } from '@/contexts/AuthContext'

export const productsApi = {
  async getProducts() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', currentCompanyId)
      .order('description')
    if (error) throw error
    // Ensure codes keep leading zeros by converting to string
    const normalized = (data ?? []).map(p => ({
      ...p,
      code: String(p.code),
      external_code: p.external_code ? String(p.external_code) : null,
    })) as Product[]
    return normalized
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'company_id'>) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('products')
      .insert([{ ...product, company_id: currentCompanyId }])
      .select()
      .single()
    if (error) throw error
    return data as Product
  },

  async addRelatedCode(relatedCode: Omit<any, 'id' | 'created_at'>) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('related_codes')
      .insert([{ ...relatedCode, company_id: currentCompanyId }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getRelatedCodes(productId: string) {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('related_codes')
      .select('*')
      .eq('product_id', productId)
      .eq('company_id', currentCompanyId)
    if (error) throw error
    return data
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .eq('company_id', currentCompanyId)
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
      .eq('company_id', currentCompanyId)
    if (error) throw error
    return true
  },

  async deleteAllProducts() {
    if (!currentCompanyId) throw new Error('No company context')
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('company_id', currentCompanyId)
    if (error) throw error
    return true
  },

  async incrementStockByCode(code: string, qtyToAdd: number) {
    // Preserve leading zeros by treating code as string
    const { data: prods, error: err1 } = await supabase
      .from('products')
      .select('*')
      .or(`code.eq.${code},external_code.eq.${code}`)
      .limit(1)
    if (err1) throw err1
    if (!prods || prods.length === 0) return null
    
    const p = prods[0]
    // Ensure the code fields are strings (leading zeros kept)
    const currentStock = p.stock || 0
    const newStock = currentStock + qtyToAdd
    const { data, error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', p.id)
      .select()
      .single()
    if (error) throw error
    return data as Product
  }
}
