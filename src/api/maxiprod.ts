import { supabase } from '@/lib/supabase'

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

// Wrapper to call our own proxy, bypassing browser CORS rules
async function proxyFetch(endpointPath: string, targetMethod: string = 'GET', payload?: any) {
  const token = await getCompanyToken()
  
  const res = await fetch('/api/maxiprod', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpointPath, targetMethod, payload, token })
  });
  
  const data = await res.json();
  
  if (!res.ok || data.isMaxiprodError) {
    // Extrai a mensagem exata do payload de erro do Maxiprod
    let errorMsg = `Erro ${data.status || res.status}: ${data.statusText || res.statusText}`
    if (data.data) {
      errorMsg = data.data.mensagem || data.data.message || errorMsg;
    } else if (data.error) {
      errorMsg = data.error;
      if (data.details) errorMsg += ` - ${data.details}`;
    }
    throw new Error(errorMsg);
  }
  
  return data;
}

export const maxiprodApi = {
  /**
   * Valida se a chave inserida é funcional
   */
  async testConnection() {
    await proxyFetch('/itens?limit=1', 'GET');
    return true;
  },

  async syncProductsStock() {
    console.log('Sincronização de estoque desabilitada por padrão.');
    return 0;
  },

  /**
   * Envia um pedido fechado para o Maxiprod
   */
  async sendSalesOrder(orderId: string) {
    const { data: order, error } = await supabase
      .from('sales_orders')
      .select(`*, customer:customers(*), items:sales_order_items(*, product:products(*))`)
      .eq('id', orderId)
      .single()

    if (error || !order) throw new Error('Pedido não encontrado')

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

    const maxiprodRes = await proxyFetch('/pedidos-venda', 'POST', payload);
    return maxiprodRes;
  },

  async autoSyncStockIfNeeded(minutesLimit = 10) {
    return;
  },

  /**
   * Sincroniza dados pré-definidos (Clientes e Produtos)
   */
  async syncAllData() {
    const { data: comp } = await supabase.from('companies').select('id').limit(1).single();
    if (!comp) throw new Error("Empresa não encontrada");

    let syncStats = { products: 0, customers: 0 }

    try {
      // 1. Puxar Produtos (Itens) do Maxiprod via Proxy
      try {
        const itensData = await proxyFetch('/itens?limit=500', 'GET');
        const itensList = Array.isArray(itensData) ? itensData : (itensData.itens || itensData.data || [])
        
        for (const item of itensList) {
          if (item.codigo && item.descricao) {
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
      } catch (e: any) {
        console.warn("Erro ao puxar itens", e)
        throw new Error(`Itens: ${e.message}`)
      }

      // 2. Puxar Clientes (Contatos) do Maxiprod via Proxy
      try {
        const contatosData = await proxyFetch('/contatos?limit=500', 'GET');
        const contatosList = Array.isArray(contatosData) ? contatosData : (contatosData.contatos || contatosData.data || [])

        for (const contato of contatosList) {
          if (contato.cnpj_cpf) {
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
      } catch (e: any) {
         console.warn("Erro ao puxar contatos", e)
         throw new Error(`Contatos: ${e.message}`)
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
