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

    if (!order.customer.maxiprod_id) {
       throw new Error(`Cliente ${order.customer.legal_name || order.customer.fantasy_name || 'selecionado'} não possui ID do Maxiprod mapeado. Por favor, execute a Sincronização de IDs no menu Configurações.`);
    }

    const missingItems = order.items.filter((i: any) => !i.product.maxiprod_id);
    if (missingItems.length > 0) {
       throw new Error(`Existem ${missingItems.length} produto(s) sem ID do Maxiprod mapeado. Por favor, execute a Sincronização de IDs no menu Configurações.`);
    }

    const payload = {
      clienteId: order.customer.maxiprod_id,
      operacaoFiscalId: comp.maxiprod_operacao_id || 1,
      moedaId: comp.maxiprod_moeda_id || 1,
      emitirEAguardarAprovacao: false,
      emitirEAprovar: false,
      itensDoPedidoDeVenda: order.items.map((i: any) => ({
        itemId: i.product.maxiprod_id,
        quantidade: i.quantity,
        valorUnitario: i.unit_price,
        unidadeId: comp.maxiprod_unidade_id || 1,
        pagamentoCom: false
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
      const { data: supaProducts } = await supabase.from('products').select('id, code, external_code').eq('company_id', comp.id);
      
      if (supaProducts && supaProducts.length > 0) {
        const codes = Array.from(new Set(
          supaProducts
            .flatMap(p => [p.code, p.external_code])
            .filter(Boolean)
            .map(c => String(c).trim())
        ));

        if (codes.length > 0) {
          const mappedIds = await proxyFetch('/Item/ObterIdsPorCodigos', 'POST', codes);
          
          if (Array.isArray(mappedIds)) {
            for (const item of mappedIds) {
              const codeStr = String(item.valor).trim().toLowerCase();
              const itemId = item.id;
              
              if (codeStr && itemId) {
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
        }
      }
    } catch (e: any) {
      console.error('Erro ao sincronizar IDs de produtos:', e);
      throw new Error(`Erro na sincronização de produtos: ${e.message || e}`);
    }

    // 2. Mapear Clientes
    try {
      const clientesData = await proxyFetch('/Empresa/ListaSimplesMinhasEmpresas?exibirCpfCnpj=true', 'GET');
      const clientesList = Array.isArray(clientesData) ? clientesData : (clientesData.itens || clientesData.Itens || clientesData.data || clientesData.Data || []);
      
      const { data: supaCustomers } = await supabase.from('customers').select('id, document, legal_name, fantasy_name').eq('company_id', comp.id);
      
      if (supaCustomers && supaCustomers.length > 0 && clientesList.length > 0) {
        for (const emp of clientesList) {
          const empId = emp.valor;
          const desc = emp.descricao || '';
          
          if (empId && desc) {
            const cleanDescDigits = desc.replace(/\D/g, '');
            
            const cleanDescName = desc
              .replace(/\(\d+\)/g, '')
              .replace(/\d+/g, '')
              .replace(/[\(\)\-\[\]]/g, '')
              .trim()
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            
            const matched = supaCustomers.find(c => {
              if (c.document && cleanDescDigits.length >= 11) {
                const cleanSupaCnpj = String(c.document).replace(/\D/g, '');
                if (cleanSupaCnpj && cleanDescDigits.includes(cleanSupaCnpj)) {
                  return true;
                }
              }
              
              const supaName = c.legal_name || c.fantasy_name || '';
              if (supaName && cleanDescName) {
                const cleanSupaName = supaName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (cleanSupaName === cleanDescName || cleanSupaName.includes(cleanDescName) || cleanDescName.includes(cleanSupaName)) {
                  return true;
                }
              }
              return false;
            });
            
            if (matched) {
              await supabase.from('customers').update({ maxiprod_id: empId }).eq('id', matched.id);
              syncStats.customers++;
            }
          }
        }
      }
    } catch (e: any) {
      console.error('Erro ao sincronizar IDs de clientes:', e);
      throw new Error(`Erro na sincronização de clientes: ${e.message || e}`);
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
