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
      errorMsg = data.data.mensagem || data.data.message || (typeof data.data === 'object' ? JSON.stringify(data.data) : errorMsg);
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
    try {
      await proxyFetch('/Item?limit=1', 'GET');
    } catch (e: any) {
      if (e.message && e.message.includes('Maxiprod.Dominio')) {
        return true; // Se respondeu erro de negócio do C#, é porque conectou com sucesso!
      }
      throw e;
    }
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

    const { data: comp } = await supabase.from('companies').select('*').eq('id', order.company_id).single();
    if (!comp) throw new Error('Configurações da empresa não encontradas');

    // Validações comentadas a pedido do usuário para teste
    // if (!order.customer.maxiprod_id) { ... }
    // const missingItems = order.items.filter((i: any) => !i.product.maxiprod_id);
    // if (missingItems.length > 0) { ... }

    const payload = {
      ClienteId: order.customer.document ? order.customer.document.replace(/\D/g, '') : '', // Testando CNPJ direto
      MoedaId: comp.maxiprod_moeda_id || 1, // Mantido 1 (ou configuração)
      OperacaoFiscalId: 5405, // Testando operação 5405
      Observacoes: order.notes || '',
      DescontoTotal: order.total_discount || 0,
      ValorTotal: order.net_amount,
      ItensDoPedidoDeVenda: order.items.map((i: any) => ({
        ItemId: i.product.external_code || i.product.code, // Testando código interno
        Quantidade: i.quantity,
        ValorUnitario: i.unit_price,
        DescontoPercentual: i.discount_percent || 0,
        UnidadeId: 'UN', // Testando string 'UN' em vez de número
        PagamentoCom: false
      }))
    }

    const maxiprodRes = await proxyFetch('/PedidoDeVenda', 'POST', payload);
    return maxiprodRes;
  },

  async autoSyncStockIfNeeded(minutesLimit = 10) {
    return;
  },

  /**
   * Sincroniza dados pré-definidos (Clientes e Produtos)
   */
  /**
   * Sincronização Leve: Busca apenas os IDs do Maxiprod e salva no Supabase (não altera dados)
   */
  async syncMaxiprodIds() {
    const { data: comp } = await supabase.from('companies').select('id').limit(1).single();
    if (!comp) throw new Error("Empresa não encontrada");

    let syncStats = { products: 0, customers: 0 }

    // 1. Mapear Produtos
    try {
      const itensData = await proxyFetch('/Item?limit=1000', 'GET');
      const itensList = Array.isArray(itensData) ? itensData : (itensData.itens || itensData.Itens || itensData.data || itensData.Data || []);
      
      const { data: supaProducts } = await supabase.from('products').select('id, code, external_code').eq('company_id', comp.id);
      
      if (supaProducts && supaProducts.length > 0) {
        for (const item of itensList) {
          const code = item.CodigoItem || item.codigo || item.Codigo;
          const itemId = item.Id || item.id;
          
          if (code && itemId) {
            const codeStr = String(code).trim().toLowerCase();
            const matched = supaProducts.find(p => 
              (p.code && String(p.code).trim().toLowerCase() === codeStr) || 
              (p.external_code && String(p.external_code).trim().toLowerCase() === codeStr)
            );
            
            if (matched) {
              await supabase.from('products').update({ maxiprod_id: itemId }).eq('id', matched.id);
              syncStats.products++;
            }
          }
        }
      }
    } catch (e) {
      console.error('Erro ao sincronizar IDs de produtos:', e);
    }

    // 2. Mapear Clientes
    try {
      let clientesList: any[] = [];
      try {
        const clientesData = await proxyFetch('/Empresa?limit=1000', 'GET');
        clientesList = Array.isArray(clientesData) ? clientesData : (clientesData.itens || clientesData.Itens || clientesData.data || clientesData.Data || []);
      } catch {
        const clientesDataAlt = await proxyFetch('/Empresa/ListarMinhasEmpresas', 'GET');
        clientesList = Array.isArray(clientesDataAlt) ? clientesDataAlt : (clientesDataAlt.itens || clientesDataAlt.Itens || clientesDataAlt.data || clientesDataAlt.Data || []);
      }
      
      const { data: supaCustomers } = await supabase.from('customers').select('id, document').eq('company_id', comp.id);
      
      if (supaCustomers && supaCustomers.length > 0) {
        for (const emp of clientesList) {
          const cnpj = emp.CnpjCpf || emp.cnpjCpf || emp.Cnpj || emp.cnpj;
          const empId = emp.Id || emp.id;
          
          if (cnpj && empId) {
            const cleanMaxiCnpj = String(cnpj).replace(/\D/g, '');
            const matched = supaCustomers.find(c => {
              if (!c.document) return false;
              const cleanSupaCnpj = String(c.document).replace(/\D/g, '');
              return cleanSupaCnpj === cleanMaxiCnpj;
            });
            
            if (matched) {
              await supabase.from('customers').update({ maxiprod_id: empId }).eq('id', matched.id);
              syncStats.customers++;
            }
          }
        }
      }
    } catch (e) {
      console.error('Erro ao sincronizar IDs de clientes:', e);
    }

    return syncStats;
  },

  async syncAllData() {
    const { data: comp } = await supabase.from('companies').select('id').limit(1).single();
    if (!comp) throw new Error("Empresa não encontrada");

    let syncStats = { products: 0, customers: 0 }

    try {
      // 1. Puxar Produtos (Itens) do Maxiprod via Proxy
      try {
        const itensData = await proxyFetch('/Item?limit=500', 'GET');
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
