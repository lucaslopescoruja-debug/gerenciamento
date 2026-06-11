import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Plus, Edit2, Trash2, Building2, UploadCloud, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import Papa from 'papaparse'
import { customersApi } from '@/api/customers'
import { regionsApi } from '@/api/regions'
import { priceTablesApi } from '@/api/priceTables'
import { salesRepsApi } from '@/api/salesReps'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/AuthContext'

export default function CustomersList() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'
  const [isImporting, setIsImporting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Advanced Filters State
  const [filters, setFilters] = useState({
    apelido: '',
    apelidoType: 'contains', // contains, startsWith, equals
    razaoSocial: '',
    razaoSocialType: 'contains',
    documento: '',
    documentoType: 'startsWith',
    status: 'Todos', // Todos, Ativos, Inativos
    representante: '',
    regiao: ''
  })

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: regions = [] } = useQuery({ queryKey: ['regions'], queryFn: regionsApi.getRegions })
  const { data: priceTables = [] } = useQuery({ queryKey: ['priceTables'], queryFn: priceTablesApi.getPriceTables })
  const { data: salesReps = [] } = useQuery({ queryKey: ['salesReps'], queryFn: salesRepsApi.getSalesReps })

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getCustomers
  })

  const deleteMutation = useMutation({
    mutationFn: customersApi.deleteCustomer,
    onSuccess: () => {
      toast.success('Cliente removido com sucesso')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (e: any) => {
      toast.error(`Erro ao remover cliente: ${e.message}`)
    }
  })

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir o cliente "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const importMutation = useMutation({
    mutationFn: customersApi.bulkCreateCustomers,
    onSuccess: () => {
      toast.success('Clientes importados com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setIsImporting(false)
    },
    onError: (e: any) => {
      toast.error(`Erro ao importar: ${e.message}`)
      setIsImporting(false)
    }
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const payload = results.data.map((row: any) => {
            const regionName = (row['Região'] || '').trim().toLowerCase()
            const regionId = regions.find(r => (r.name || '').toLowerCase() === regionName)?.id || null

            const priceTableName = (row['Tabela de Preços'] || row['Tabela de preço'] || '').trim().toLowerCase()
            const priceTableId = priceTables.find(t => (t.name || '').toLowerCase() === priceTableName || (t.code || '').toLowerCase() === priceTableName)?.id || null

            const repName = (row['Representante/ vendedor'] || row['Vendedor'] || '').trim().toLowerCase()
            const repId = salesReps.find(s => (s.name || '').toLowerCase() === repName)?.id || null

            return {
              nickname: row['Apelido'] || '',
              fantasy_name: row['Nome fantasia'] || '',
              legal_name: row['Razão social/Nome'] || '',
              document: row['CNPJ/CPF'] || '',
              document_type: ((row['CNPJ/CPF'] || '').length > 14 ? 'CNPJ' : 'CPF') as 'CNPJ' | 'CPF',
              phone1: row['Telefone 1'] || '',
              address: row['Endereço'] || '',
              number: row['Núm.'] || '',
              complement: row['Complemento'] || '',
              neighborhood: row['Bairro'] || '',
              cep: row['CEP'] || '',
              city: row['Município'] || '',
              state: row['UF'] || '',
              region_id: regionId,
              price_table_id: priceTableId,
              sales_rep_id: repId,
              email: row['Email'] || '',
              active: true
            }
          })
          
          if (payload.length === 0) {
            toast.error('O arquivo parece estar vazio ou no formato incorreto.')
            setIsImporting(false)
            return
          }

          importMutation.mutate(payload)
        } catch (e: any) {
          toast.error('Erro ao ler a planilha. Verifique o formato.')
          setIsImporting(false)
        }
      },
      error: (e) => {
        toast.error(`Erro ao processar arquivo: ${e.message}`)
        setIsImporting(false)
      }
    })
  }

  const applyFilter = (value: string, filterValue: string, type: string, isDocument: boolean = false) => {
    if (!filterValue) return true
    
    let v = (value || '').toLowerCase()
    let f = filterValue.toLowerCase()

    if (isDocument) {
      v = v.replace(/[^\d]/g, '')
      f = f.replace(/[^\d]/g, '')
    }

    if (type === 'contains') return v.includes(f)
    if (type === 'startsWith') return v.startsWith(f)
    if (type === 'equals') return v === f
    return true
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Apelido (Nickname or Fantasy Name)
      const matchApelido = applyFilter(c.nickname || c.fantasy_name || '', filters.apelido, filters.apelidoType)
      
      // Razão Social (Legal Name)
      const matchRazao = applyFilter(c.legal_name || '', filters.razaoSocial, filters.razaoSocialType)
      
      // Documento
      const matchDoc = applyFilter(c.document || '', filters.documento, filters.documentoType, true)
      
      // Status
      const matchStatus = filters.status === 'Todos' ? true :
                         filters.status === 'Ativos' ? c.active === true : 
                         filters.status === 'Inativos' ? c.active === false : true
                         
      // Representante
      const matchRep = applyFilter(c.sales_rep_obj?.nickname || '', filters.representante, 'contains')
      
      // Região
      const matchReg = applyFilter(c.region?.name || '', filters.regiao, 'contains')

      return matchApelido && matchRazao && matchDoc && matchStatus && matchRep && matchReg
    })
  }, [customers, filters])

  // Pagination Logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  
  // Ensure current page is valid after filtering
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages)
  }

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredCustomers.slice(start, start + itemsPerPage)
  }, [filteredCustomers, currentPage, itemsPerPage])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedCustomers.map(c => c.id))
      setSelectedIds(allIds)
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) newSet.add(id)
    else newSet.delete(id)
    setSelectedIds(newSet)
  }

  const allSelected = paginatedCustomers.length > 0 && paginatedCustomers.every(c => selectedIds.has(c.id))

  if (!isManager) {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito a gestores e administradores.</div>
  }

  return (
    <div className="space-y-6 slide-in max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Clientes
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie a base de clientes (CRM).</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <label className="cursor-pointer">
            <Button type="button" variant="outline" className="w-full sm:w-auto shadow-sm" disabled={isImporting} onClick={() => document.getElementById('csv-upload')?.click()}>
              <UploadCloud className="mr-2 h-4 w-4" /> 
              {isImporting ? 'Importando...' : 'Importar CSV'}
            </Button>
            <Input 
              id="csv-upload"
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isImporting}
            />
          </label>
          <Link to="/cadastros/clientes/novo" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95">
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* Painel de Filtros */}
      <div className="glass-card overflow-hidden">
        <div 
          className="flex justify-between items-center p-4 border-b border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-primary" />
            Filtros Avançados
          </div>
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        
        {showFilters && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
            
            {/* Apelido */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Apelido</label>
                <div className="flex gap-1">
                  <select 
                    className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    value={filters.apelidoType}
                    onChange={(e) => setFilters(f => ({ ...f, apelidoType: e.target.value }))}
                  >
                    <option value="contains">Contém</option>
                    <option value="startsWith">Inicia com</option>
                    <option value="equals">Igual a</option>
                  </select>
                  <Input 
                    className="flex-1 h-9" 
                    value={filters.apelido}
                    onChange={(e) => setFilters(f => ({ ...f, apelido: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Razão Social */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Razão Social</label>
                <div className="flex gap-1">
                  <select 
                    className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    value={filters.razaoSocialType}
                    onChange={(e) => setFilters(f => ({ ...f, razaoSocialType: e.target.value }))}
                  >
                    <option value="contains">Contém</option>
                    <option value="startsWith">Inicia com</option>
                    <option value="equals">Igual a</option>
                  </select>
                  <Input 
                    className="flex-1 h-9" 
                    value={filters.razaoSocial}
                    onChange={(e) => setFilters(f => ({ ...f, razaoSocial: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* CNPJ/CPF */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium">CNPJ/CPF</label>
                <div className="flex gap-1">
                  <select 
                    className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    value={filters.documentoType}
                    onChange={(e) => setFilters(f => ({ ...f, documentoType: e.target.value }))}
                  >
                    <option value="startsWith">Inicia com</option>
                    <option value="contains">Contém</option>
                    <option value="equals">Igual a</option>
                  </select>
                  <Input 
                    className="flex-1 h-9" 
                    value={filters.documento}
                    onChange={(e) => setFilters(f => ({ ...f, documento: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Cadastro (Status)</label>
              <select 
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={filters.status}
                onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              >
                <option value="Todos">Todos</option>
                <option value="Ativos">Ativos</option>
                <option value="Inativos">Inativos</option>
              </select>
            </div>

            {/* Representante */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Representante</label>
              <Input 
                className="h-9" 
                placeholder="Nome..."
                value={filters.representante}
                onChange={(e) => setFilters(f => ({ ...f, representante: e.target.value }))}
              />
            </div>

            {/* Região */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Região</label>
              <Input 
                className="h-9" 
                placeholder="Bahia, Porto Seguro..."
                value={filters.regiao}
                onChange={(e) => setFilters(f => ({ ...f, regiao: e.target.value }))}
              />
            </div>

            <div className="col-span-full flex justify-end mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setFilters({
                  apelido: '', apelidoType: 'contains',
                  razaoSocial: '', razaoSocialType: 'contains',
                  documento: '', documentoType: 'startsWith',
                  status: 'Todos', representante: '', regiao: ''
                })}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Ferramentas / Paginação Topo */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20 p-2 rounded-lg border border-border/50">
        <div className="text-sm font-medium pl-2">
          {selectedIds.size > 0 && <span className="text-primary">{selectedIds.size} selecionados</span>}
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Exibindo itens {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} de {filteredCustomers.length}
          </span>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
            >
              <span className="sr-only">Primeira</span>
              <span className="text-xs font-bold">|&lt;</span>
            </Button>
            <Button 
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="px-2 font-medium">
              {currentPage} de {totalPages || 1}
            </span>

            <Button 
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}
            >
              <span className="sr-only">Última</span>
              <span className="text-xs font-bold">&gt;|</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Listagem */}
      <div className="glass-card overflow-hidden border border-border/50 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Apelido / Fantasia</th>
                <th className="px-4 py-3 font-medium">Razão Social</th>
                <th className="px-4 py-3 font-medium">CNPJ/CPF</th>
                <th className="px-4 py-3 font-medium">Município/UF</th>
                <th className="px-4 py-3 font-medium">Região</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedCustomers.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nenhum cliente encontrado com os filtros atuais.</td></tr>
              ) : (
                paginatedCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        checked={selectedIds.has(customer.id)}
                        onChange={(e) => handleSelectOne(customer.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        customer.active 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {customer.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{customer.nickname || '-'}</div>
                      <div className="text-xs text-muted-foreground">{customer.fantasy_name || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.legal_name || '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{customer.document || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.city ? `${customer.city}${customer.state ? `/${customer.state}` : ''}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs uppercase">
                      {customer.region?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Link to={`/cadastros/clientes/${customer.id}/editar`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(customer.id, customer.nickname || customer.fantasy_name || '')}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
