import { supabase } from '@/lib/supabase'

export interface BackupData {
  version: string;
  timestamp: string;
  companyId: string;
  data: {
    companies: any[];
    users: any[];
    regions: any[];
    sales_reps: any[];
    sales_rep_regions: any[];
    price_tables: any[];
    price_table_items: any[];
    payment_conditions: any[];
    products: any[];
    related_codes: any[];
    supplies: any[];
    customers: any[];
    customer_payment_conditions: any[];
    equipments: any[];
  }
}

export const backupApi = {
  async generateBackup(companyId: string): Promise<BackupData> {
    const backup: BackupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      companyId,
      data: {
        companies: [],
        users: [],
        regions: [],
        sales_reps: [],
        sales_rep_regions: [],
        price_tables: [],
        price_table_items: [],
        payment_conditions: [],
        products: [],
        related_codes: [],
        supplies: [],
        customers: [],
        customer_payment_conditions: [],
        equipments: []
      }
    }

    // Funções auxiliares para buscar dados com paginação se necessário, 
    // mas select() já busca até 1000 registros por padrão. Se houver mais, seria necessário paginação.
    // Para simplificar, assumimos que no momento o limite atende, ou podemos forçar um limite alto.
    const fetchAll = async (table: string, filters: Record<string, string> = { company_id: companyId }) => {
      let query = supabase.from(table).select('*').limit(10000)
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value)
      }
      const { data, error } = await query
      if (error) {
        console.error(`Erro ao buscar ${table}:`, error)
        throw error
      }
      return data || []
    }

    // Coleta sequencial
    backup.data.companies = await fetchAll('companies', { id: companyId })
    backup.data.users = await fetchAll('users')
    backup.data.regions = await fetchAll('regions')
    backup.data.sales_reps = await fetchAll('sales_reps')
    
    // As tabelas de relacionamento podem não ter company_id, então precisamos buscar pelo ID dos pais.
    if (backup.data.sales_reps.length > 0) {
      const repIds = backup.data.sales_reps.map(r => r.id)
      const { data: repRegions } = await supabase.from('sales_rep_regions').select('*').in('sales_rep_id', repIds).limit(10000)
      backup.data.sales_rep_regions = repRegions || []
    }

    backup.data.price_tables = await fetchAll('price_tables')
    
    if (backup.data.price_tables.length > 0) {
      const ptIds = backup.data.price_tables.map(p => p.id)
      const { data: ptItems } = await supabase.from('price_table_items').select('*').in('price_table_id', ptIds).limit(10000)
      backup.data.price_table_items = ptItems || []
    }

    backup.data.payment_conditions = await fetchAll('payment_conditions')
    backup.data.products = await fetchAll('products')

    if (backup.data.products.length > 0) {
      const pIds = backup.data.products.map(p => p.id)
      const { data: rCodes } = await supabase.from('related_codes').select('*').in('product_id', pIds).limit(10000)
      backup.data.related_codes = rCodes || []
    }

    backup.data.supplies = await fetchAll('supplies')
    backup.data.customers = await fetchAll('customers')

    if (backup.data.customers.length > 0) {
      const cIds = backup.data.customers.map(c => c.id)
      const { data: cpc } = await supabase.from('customer_payment_conditions').select('*').in('customer_id', cIds).limit(10000)
      backup.data.customer_payment_conditions = cpc || []
    }

    backup.data.equipments = await fetchAll('equipments')

    return backup
  },

  async restoreBackup(companyId: string, backup: BackupData, onProgress?: (msg: string) => void): Promise<void> {
    if (backup.companyId !== companyId) {
      throw new Error('O arquivo de backup pertence a outra empresa.')
    }

    const upsertData = async (table: string, items: any[]) => {
      if (!items || items.length === 0) return
      
      onProgress?.(`Restaurando ${table} (${items.length} registros)...`)
      
      // Upsert pode ter limite de payload. Faremos em lotes de 100.
      const batchSize = 100
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        const { error } = await supabase.from(table).upsert(batch)
        if (error) {
          console.error(`Erro ao restaurar ${table} lote ${i}:`, error)
          throw new Error(`Falha na restauração da tabela ${table}: ${error.message}`)
        }
      }
    }

    // Ordem de restauração respeitando chaves estrangeiras (Foreign Keys)
    try {
      // 1. Entidades Base (Sem FK para outras além de company)
      await upsertData('companies', backup.data.companies)
      await upsertData('users', backup.data.users)
      await upsertData('regions', backup.data.regions)
      await upsertData('payment_conditions', backup.data.payment_conditions)
      await upsertData('products', backup.data.products)
      await upsertData('supplies', backup.data.supplies)

      // 2. Entidades Secundárias
      await upsertData('sales_reps', backup.data.sales_reps)
      await upsertData('related_codes', backup.data.related_codes)
      await upsertData('price_tables', backup.data.price_tables)

      // 3. Entidades Terciárias
      await upsertData('sales_rep_regions', backup.data.sales_rep_regions)
      await upsertData('price_table_items', backup.data.price_table_items)
      
      // 4. Clientes dependem de Regiões, Representantes e Tabelas de Preço
      await upsertData('customers', backup.data.customers)
      
      // 5. Dependem de Clientes
      await upsertData('customer_payment_conditions', backup.data.customer_payment_conditions)
      await upsertData('equipments', backup.data.equipments)

      onProgress?.('Restauração concluída com sucesso!')
    } catch (e: any) {
      throw new Error(e.message || 'Falha durante o processo de restauração.')
    }
  }
}
