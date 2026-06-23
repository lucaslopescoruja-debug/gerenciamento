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
      // Faremos um ping na api de itens (produtos) para validar a chave
      const res = await fetch(`${MAXIPROD_API_URL}/itens?limit=1`, {
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
        cnpj_cpf: order.customer.document || '',
        razao_social: order.customer.legal_name || 'Consumidor',
        nome_fantasia: order.customer.fantasy_name || 'Consumidor'
      },
      itens: order.items.map((i: any) => ({
        codigo_item: i.product.external_code || i.product.code,
        quantidade: i.quantity,
        preco_unitario: i.unit_price,
        desconto_percentual: i.discount_percent || 0
      })),
      observacoes: order.notes || '',
      desconto_total: order.total_discount || 0,
      valor_total: order.net_amount
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
      let errorMsg = `Erro Maxiprod: ${res.statusText}`
      try {
        const errorData = await res.json()
        errorMsg = errorData.mensagem || errorData.message || errorMsg
      } catch (e) {}
      throw new Error(errorMsg)
    }

    const maxiprodRes = await res.json()
    return maxiprodRes
  },

  /**
   * FUTURO: Verifica se o estoque precisa ser sincronizado
   */
  async autoSyncStockIfNeeded(minutesLimit = 10) {
    return;
  },

  /**
   * Sincroniza dados pré-definidos (Clientes e Produtos) do Maxiprod para o Estoque Fácil
   */
  async syncAllData() {
    const token = await getCompanyToken()
    const { data: comp } = await supabase.from('companies').select('id').limit(1).single();
    if (!comp) throw new Error("Empresa não encontrada");

    let syncStats = { products: 0, customers: 0 }

    try {
      // 1. Puxar Produtos (Itens) do Maxiprod
      const resItens = await fetch(`${MAXIPROD_API_URL}/itens?limit=500`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resItens.ok) {
        const itensData = await resItens.json()
        const itensList = Array.isArray(itensData) ? itensData : (itensData.itens || itensData.data || [])
        
        for (const item of itensList) {
          if (item.codigo && item.descricao) {
            // Utilizamos ignoreDuplicates para NÃO sobrescrever os dados locais (como códigos externos e estoque)
            // caso o produto já exista no LS Stock. Assim, apenas novos produtos entram.
            await supabase.from('products').upsert({
              company_id: comp.id,
              code: item.codigo.toString(),
              description: item.descricao,
              price: item.preco_venda || 0,
              stock: item.estoque_atual || 0,
              unit: item.unidade_medida || 'UN',
              active: item.ativo !== false
            }, { onConflict: 'company_id, code', ignoreDuplicates: true })
            syncStats.products++
          }
        }
      }

      // 2. Puxar Clientes (Contatos) do Maxiprod
      const resContatos = await fetch(`${MAXIPROD_API_URL}/contatos?limit=500`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resContatos.ok) {
        const contatosData = await resContatos.json()
        const contatosList = Array.isArray(contatosData) ? contatosData : (contatosData.contatos || contatosData.data || [])

        for (const contato of contatosList) {
          if (contato.cnpj_cpf) {
            // ignoreDuplicates previne que vínculos de vendedores, comodatos e regiões sejam apagados
            await supabase.from('customers').upsert({
              company_id: comp.id,
              document: contato.cnpj_cpf.replace(/\D/g, ''),
              legal_name: contato.razao_social || contato.nome,
              fantasy_name: contato.nome_fantasia || contato.nome,
              active: contato.ativo !== false,
              address: contato.endereco || null,
              address_number: contato.numero || null,
              neighborhood: contato.bairro || null,
              city: contato.cidade || null,
              state: contato.uf || null,
              zip_code: contato.cep ? contato.cep.replace(/\D/g, '') : null
            }, { onConflict: 'company_id, document', ignoreDuplicates: true })
            syncStats.customers++
          }
        }
      }

      // 3. Atualizar Data de Sincronização
      const now = new Date().toISOString()
      await supabase
        .from('companies')
        .update({ maxiprod_last_sync: now })
        .eq('id', comp.id)

      return { success: true, timestamp: now, stats: syncStats }
    } catch (e: any) {
      throw new Error(`Erro na sincronização: ${e.message}`)
    }
  }
}
