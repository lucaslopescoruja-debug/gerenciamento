import { supabase } from '@/lib/supabase'
import { currentCompanyId } from '@/contexts/AuthContext'

const MAXIPROD_API_URL = 'https://api.maxiprod.com.br/api/v3'

// Helper to get company maxiprod token
async function getCompanyToken(): Promise<string> {
  if (!currentCompanyId) throw new Error('Empresa não selecionada')

  const { data, error } = await supabase
    .from('companies')
    .select('maxiprod_api_token')
    .eq('id', currentCompanyId)
    .single()

  if (error || !data?.maxiprod_api_token) {
    throw new Error('Token da API Maxiprod não configurado na empresa.')
  }

  return data.maxiprod_api_token
}

export const maxiprodApi = {
  /**
   * Valida se a chave inserida é funcional
   */
  async testConnection() {
    try {
      const token = await getCompanyToken()
      // Faremos um ping genérico (ex: GET /estoques) com limit=1
      const res = await fetch(`${MAXIPROD_API_URL}/estoques?limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      return res.ok
    } catch (e) {
      return false
    }
  },

  /**
   * Sincroniza o estoque atual (Background)
   */
  async syncProductsStock() {
    if (!currentCompanyId) throw new Error('Empresa não selecionada')
    const token = await getCompanyToken()

    try {
      // 1. Fetch current stocks from Maxiprod
      // Maxiprod returns an array of stocks, usually paginated.
      // We will assume a simplified fetch here, but in production this needs pagination handling.
      const res = await fetch(`${MAXIPROD_API_URL}/estoques`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) throw new Error(`Erro Maxiprod: ${res.statusText}`)
      
      const { items } = await res.json()

      // 2. Fetch local products
      const { data: localProducts } = await supabase
        .from('products')
        .select('id, code, external_code')
        .eq('company_id', currentCompanyId)

      if (!localProducts) return 0

      let updatedCount = 0

      // 3. Match and Update
      for (const maxiprodStock of items) {
        // Supondo que Maxiprod mande o código do produto como codigo_item ou similar
        const localProduct = localProducts.find(p => p.external_code === maxiprodStock.codigo_item || p.code === maxiprodStock.codigo_item)
        if (localProduct) {
          const { error } = await supabase
            .from('products')
            .update({ stock: maxiprodStock.quantidade_atual || 0 })
            .eq('id', localProduct.id)
            
          if (!error) updatedCount++
        }
      }

      // Update last sync time
      await supabase
        .from('companies')
        .update({ maxiprod_last_sync: new Date().toISOString() })
        .eq('id', currentCompanyId)

      return updatedCount

    } catch (error: any) {
      console.error('Maxiprod sync error:', error)
      throw new Error(`Falha ao sincronizar: ${error.message}`)
    }
  },

  /**
   * Envia um pedido fechado para o Maxiprod
   */
  async sendSalesOrder(orderId: string) {
    if (!currentCompanyId) throw new Error('Empresa não selecionada')
    const token = await getCompanyToken()

    // 1. Fetch full order with items and customer info
    const { data: order, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(*),
        items:sales_order_items(*, product:products(*))
      `)
      .eq('id', orderId)
      .single()

    if (error || !order) throw new Error('Pedido não encontrado')

    // 2. Build Payload according to Maxiprod structure
    const payload = {
      cliente: {
        cnpj_cpf: order.customer.document,
        razao_social: order.customer.legal_name,
        nome_fantasia: order.customer.fantasy_name
      },
      itens: order.items.map((i: any) => ({
        codigo_item: i.product.external_code || i.product.code,
        quantidade: i.quantity,
        preco_unitario: i.unit_price,
        desconto_percentual: i.discount_percent
      })),
      observacoes: order.notes,
      desconto_total: order.total_discount,
      valor_total: order.net_amount
      // Outros campos obrigatórios de acordo com a doc real
    }

    // 3. Send Request
    const res = await fetch(`${MAXIPROD_API_URL}/pedidos-venda`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.mensagem || `Erro Maxiprod: ${res.statusText}`)
    }

    const maxiprodRes = await res.json()

    // 4. Se quiser, salvar o ID do pedido no Maxiprod dentro do Supabase.

    return maxiprodRes
  },

  /**
   * Verifica se o estoque precisa ser sincronizado baseado num limite de tempo (ex: 10 minutos)
   */
  async autoSyncStockIfNeeded(minutesLimit = 10) {
    if (!currentCompanyId) return
    try {
      const { data } = await supabase
        .from('companies')
        .select('maxiprod_last_sync')
        .eq('id', currentCompanyId)
        .single()
        
      if (!data?.maxiprod_last_sync) {
        await this.syncProductsStock()
        return
      }

      const lastSync = new Date(data.maxiprod_last_sync)
      const now = new Date()
      const diffMinutes = (now.getTime() - lastSync.getTime()) / 1000 / 60

      if (diffMinutes >= minutesLimit) {
        await this.syncProductsStock()
      }
    } catch (e) {
      console.error('Falha no autoSyncStockIfNeeded:', e)
    }
  }
}
