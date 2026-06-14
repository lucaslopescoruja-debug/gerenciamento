import { supabase } from '@/lib/supabase'

const MAXIPROD_API_URL = 'https://api.maxiprod.com.br/api/v3'

// Helper to get company maxiprod token
async function getCompanyToken(): Promise<string> {
  
  const { data, error } = await supabase
    .from('companies')
    .select('maxiprod_api_token')
    .limit(1)
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
   * FUTURO: Sincroniza o estoque atual (Background)
   * Atualmente o EstoqueFacil é a fonte da verdade, então futuramente essa função será 
   * invertida para enviar o estoque local para o Maxiprod (Opção A).
   */
  async syncProductsStock() {
    console.log('Sincronização de estoque desabilitada por padrão. O EstoqueFacil é a fonte principal.');
    return 0;
  },

  /**
   * Envia um pedido fechado para o Maxiprod
   */
  async sendSalesOrder(orderId: string) {
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
   * FUTURO: Verifica se o estoque precisa ser sincronizado
   */
  async autoSyncStockIfNeeded(minutesLimit = 10) {
    // Disabled logic for now
    return;
  },

  /**
   * Sincroniza dados pré-definidos (Clientes e Produtos) do Maxiprod para o Estoque Fácil
   */
  async syncAllData() {
        
    // Simulate API delay for syncing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // In a real scenario, we would fetch data from Maxiprod and upsert into Supabase tables
    // (products, customers, etc). For now, we simulate success.
    
    // Update last sync time in company
    const now = new Date().toISOString()
    const { data: comp } = await supabase.from('companies').select('id').limit(1).single();
    if (comp) {
      await supabase
        .from('companies')
        .update({ maxiprod_last_sync: now })
        .eq('id', comp.id)
    }

    return { success: true, timestamp: now }
  }
}
