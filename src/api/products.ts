import { supabase, fetchAllRows } from '@/lib/supabase'
import type { Product } from '@/types/database'


export const productsApi = {
  async getProducts() {
    
    const query = supabase
      .from('products')
      .select('*')
      .order('description')
      
    const data = await fetchAllRows<Product>(query)
    
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

  async saveProductWithPrices(
    productData: Partial<Product>, 
    prices: { tableId: string, price: number, discount_percent: number }[]
  ) {
    let productId = productData.id;
    let savedProduct: Product;

    if (productId) {
      // Update
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)
        .select()
        .single()
      if (error) throw error
      savedProduct = data as Product
    } else {
      // Insert
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single()
      if (error) throw error
      savedProduct = data as Product
      productId = savedProduct.id
    }

    // Now upsert prices
    for (const p of prices) {
      const { error: priceError } = await supabase
        .from('price_table_items')
        .upsert({
          price_table_id: p.tableId,
          product_id: productId,
          price: p.price,
          discount_percent: p.discount_percent
        }, {
          onConflict: 'price_table_id,product_id'
        })
      if (priceError) throw priceError
    }

    return savedProduct;
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
