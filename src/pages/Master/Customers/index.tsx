import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Plus, Edit2, Trash2, Building2, UploadCloud, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Filter, MapPin, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import Papa from 'papaparse'
import { customersApi } from '@/api/customers'
import { regionsApi } from '@/api/regions'
import { priceTablesApi } from '@/api/priceTables'
import { salesRepsApi } from '@/api/salesReps'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/AuthContext'

export default function CustomersList() {
  const queryClient = useQueryClient()
  const { user, isMaster } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'gestor' || isMaster
  const isManager = canEdit
  const [isImporting, setIsImporting] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [geocodeProgress, setGeocodeProgress] = useState({ current: 0, total: 0 })
  const [showFilters, setShowFilters] = useState(() => {
    return sessionStorage.getItem('customersShowFilters') === 'true'
  })

  const defaultFilters = {
    apelido: '',
    apelidoType: 'contains', // contains, startsWith, equals
    razaoSocial: '',
    razaoSocialType: 'contains',
    documento: '',
    documentoType: 'startsWith',
    status: 'Todos', // Todos, Ativos, Inativos
    coordenadas: 'Todos', // Todos, Com Lat/Lng, Sem Lat/Lng
    representante: [] as string[],
    regiao: [] as string[]
  }

  type FiltersType = typeof defaultFilters

  // Advanced Filters State
  const [filters, setFilters] = useState<FiltersType>(() => {
    const saved = sessionStorage.getItem('customersFilters')
    if (saved) {
      try { 
        return { ...defaultFilters, ...JSON.parse(saved) } 
      } catch (e) {}
    }
    return defaultFilters
  })

  useEffect(() => {
    sessionStorage.setItem('customersFilters', JSON.stringify(filters))
  }, [filters])

  useEffect(() => {
    sessionStorage.setItem('customersShowFilters', showFilters.toString())
  }, [showFilters])

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
    if (window.confirm(`Deseja realmente excluir o cliente "${name}"?. Esta ação não pode ser desfeita.`)) {
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

            const repName = (row['Representante/Vendedor'] || row['Representante/ vendedor'] || row['Vendedor'] || '').trim().toLowerCase()
            const repId = salesReps.find(s => (s.name || '').toLowerCase() === repName)?.id || null

            return {
              nickname: row['Apelido'] || row['Nome fantasia'] || row['Razão social/Nome'] || '',
              fantasy_name: row['Nome fantasia'] || '',
              legal_name: row['Razão social/Nome'] || '',
              document: row['CNPJ_OU_CPF'] || row['CNPJ/CPF'] || '',
              document_type: ((row['CNPJ_OU_CPF'] || row['CNPJ/CPF'] || '').length > 14 ? 'CNPJ' : 'CPF') as 'CNPJ' | 'CPF',
              phone1: row['Fone 1'] || row['Telefone 1'] || '',
              phone2: row['Fone 2'] || row['Telefone 2'] || '',
              address: row['Endereço'] || '',
              number: row['Número'] || row['Núm.'] || '',
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
          }).filter((c: any) => c.nickname || c.legal_name || c.document)
          
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

  const startGeocoding = async () => {
    const customersToGeocode = customers.filter(c => !c.latitude && c.address)
    
    if (customersToGeocode.length === 0) {
      toast.info('Todos os clientes com endereço já possuem coordenadas.')
      return
    }

    if (!window.confirm(`Existem ${customersToGeocode.length} clientes sem coordenadas. O processo fará uma busca lenta (aprox. 1,5s por cliente) para não ser bloqueado. Deseja continuar?`)) {
      return
    }

    setIsGeocoding(true)
    setGeocodeProgress({ current: 0, total: customersToGeocode.length })

    let updatedCount = 0

    for (let i = 0; i < customersToGeocode.length; i++) {
      const c = customersToGeocode[i]
      const fullAddress = `${c.address}, ${c.number || ''}, ${c.neighborhood || ''}, ${c.city || ''} - ${c.state || ''}`.replace(/,\s*,/g, ',').trim()
      
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`, {
          headers: {
            'Accept-Language': 'pt-BR',
            'User-Agent': 'EstoqueFacil/1.0'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat)
            const lng = parseFloat(data[0].lon)
            
            await customersApi.updateCustomer(c.id, { latitude: lat, longitude: lng })
            setGeocodeProgress(prev => ({ ...prev, current: prev.current + 1 }))
            updatedCount++
          }
        }
      } catch (e) {
        console.error('Erro na geocodificação:', e)
      }
      
      // Delay to respect nominatim rate limits (1 req / sec)
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    toast.success(`Processo concluído. ${updatedCount} endereços atualizados com sucesso.`)
    setIsGeocoding(false)
    queryClient.invalidateQueries({ queryKey: ['customers'] })
  }

  const handleFixReps = async () => {
    if (!window.confirm('Deseja corrigir os vendedores conforme a lista fornecida?')) return;
    setIsFixing(true);
    let count = 0;
    try {
      const { default: updates } = await import('@/customer_updates.json');
      for (const item of updates) {
        if (!item.rep) continue;
        const { data: repData } = await supabase.from('sales_reps').select('id').eq('document', item.rep).single();
        if (repData) {
          const { error } = await supabase.from('customers').update({ sales_rep_id: repData.id }).eq('document', item.cnpj);
          if (!error) count++;
        }
      }
      toast.success(`Foram atualizados ${count} clientes!`);
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    } catch (err: any) {
      toast.error('Erro ao atualizar: ' + err.message);
    } finally {
      setIsFixing(false);
    }
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
      // Role-based filtering
      if (!isManager) {
        const repName = c.sales_rep_obj?.nickname || c.sales_rep_obj?.legal_name
        if (repName !== user?.name) return false
      }

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

      // Coordenadas
      const matchCoordenadas = filters.coordenadas === 'Todos' ? true :
                               filters.coordenadas === 'Com Lat/Lng' ? (c.latitude !== null && c.longitude !== null) :
                               filters.coordenadas === 'Sem Lat/Lng' ? (c.latitude === null || c.longitude === null) : true
                         
      // Representante
      const matchRep = filters.representante.length === 0 || 
        (c.sales_rep_id && filters.representante.includes(c.sales_rep_id))
      
      // Região
      const matchReg = filters.regiao.length === 0 || 
        (c.region_id && filters.regiao.includes(c.region_id))

      return matchApelido && matchRazao && matchDoc && matchStatus && matchCoordenadas && matchRep && matchReg
    })
  }, [customers, filters])

  type SortFieldType = 'active' | 'legal_name' | 'fantasy_name' | 'document' | 'city' | 'region_name' | null
  const [sortField, setSortField] = useState<SortFieldType>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const handleSort = (field: SortFieldType) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const renderSortIcon = (field: SortFieldType) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 inline-block opacity-40 hover:opacity-100 transition-opacity" />
    }
    return sortAsc 
      ? <ArrowUp className="ml-1 h-3.5 w-3.5 inline-block text-primary" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5 inline-block text-primary" />
  }

  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers]
    if (!sortField) return sorted

    return sorted.sort((a, b) => {
      let valA: any = ''
      let valB: any = ''
      
      switch (sortField) {
        case 'active': valA = a.active ? 1 : 0; valB = b.active ? 1 : 0; break;
        case 'legal_name': valA = a.legal_name; valB = b.legal_name; break;
        case 'fantasy_name': valA = a.fantasy_name; valB = b.fantasy_name; break;
        case 'document': valA = a.document; valB = b.document; break;
        case 'city': valA = a.city; valB = b.city; break;
        case 'region_name': valA = a.region?.name; valB = b.region?.name; break;
      }

      valA = valA ?? ''
      valB = valB ?? ''

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc
          ? valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'pt-BR', { sensitivity: 'base' })
      }

      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
  }, [filteredCustomers, sortField, sortAsc])

  // Pagination Logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  
  // Ensure current page is valid after filtering
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages)
  }

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sortedCustomers.slice(start, start + itemsPerPage)
  }, [sortedCustomers, currentPage, itemsPerPage])

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

  // Allow sellers to view the page, we will hide action buttons for them.

  // MultiSelect Component
  const MultiSelect = ({ label, options, selectedIds, onChange, placeholder }: any) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOptions = options.filter((opt: any) => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggle = (id: string) => {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onChange(Array.from(next));
    };

    const toggleAll = () => {
      if (selectedIds.length === options.length) {
        onChange([]); // deselect all
      } else {
        onChange(options.map((o: any) => o.id)); // select all
      }
    };
    
    return (
      <div className="relative w-full">
        <div 
          className="h-9 w-full rounded-md border border-input bg-background px-3 flex items-center justify-between text-sm cursor-pointer select-none"
          onClick={() => setOpen(!open)}
        >
          <span className="truncate text-muted-foreground">
            {selectedIds.length === 0 ? placeholder : `${selectedIds.length} selecionado(s)`}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
        {open && (
          <div className="absolute top-full mt-1 w-full bg-background border border-border rounded-md shadow-lg z-50 p-2">
            <div className="mb-2">
              <Input 
                autoFocus
                placeholder="Filtrar..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="max-h-48 overflow-auto space-y-1">
              <label className="flex items-center gap-2 p-1.5 hover:bg-muted/50 cursor-pointer rounded-sm">
                <input 
                  type="checkbox" 
                  className="rounded border-input text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                  checked={selectedIds.length === options.length && options.length > 0} 
                  onChange={toggleAll} 
                />
                <span className="text-xs font-semibold">[Selecionar tudo]</span>
              </label>
              
              {filteredOptions.map((opt: any) => (
                <label key={opt.id} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 cursor-pointer rounded-sm">
                  <input 
                    type="checkbox" 
                    className="rounded border-input text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                    checked={selectedIds.includes(opt.id)} 
                    onChange={() => toggle(opt.id)} 
                  />
                  <span className="text-xs truncate">{opt.label}</span>
                </label>
              ))}
              {filteredOptions.length === 0 && <div className="p-2 text-xs text-muted-foreground text-center">Nenhuma opção encontrada</div>}
            </div>
          </div>
        )}
      </div>
    )
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
          {isManager && (
            <>
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
              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:w-auto shadow-sm" 
                disabled={isGeocoding} 
                onClick={startGeocoding}
                title="Atualizar coordenadas de clientes que estão sem Latitude e Longitude"
              >
                <MapPin className="mr-2 h-4 w-4" /> 
                {isGeocoding ? `Atualizando (${geocodeProgress.current}/${geocodeProgress.total})...` : 'Atualizar Lat. Log.'}
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                className="w-full sm:w-auto shadow-sm" 
                disabled={isFixing} 
                onClick={handleFixReps}
              >
                {isFixing ? 'Corrigindo...' : 'Corrigir Vendedores'}
              </Button>
              <Link to="/cadastros/clientes/novo" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95">
                  <Plus className="mr-2 h-4 w-4" /> Novo Cliente
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Painel de Filtros */}
      <div className="glass-card relative z-50">
        <div 
          className="flex justify-between items-center p-4 border-b border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors rounded-t-xl"
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

            {/* Coordenadas */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Coordenadas (Lat/Lng)</label>
              <select 
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={filters.coordenadas}
                onChange={(e) => setFilters(f => ({ ...f, coordenadas: e.target.value }))}
              >
                <option value="Todos">Todos</option>
                <option value="Com Lat/Lng">Cadastrados</option>
                <option value="Sem Lat/Lng">Não Cadastrados</option>
              </select>
            </div>

            {/* Representante */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Representantes</label>
              <MultiSelect 
                placeholder="Todos"
                options={salesReps.map(r => ({ id: r.id, label: r.nickname || r.name }))}
                selectedIds={filters.representante}
                onChange={(vals: string[]) => setFilters(f => ({ ...f, representante: vals }))}
              />
            </div>

            {/* Região */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Regiões</label>
              <MultiSelect 
                placeholder="Todas"
                options={regions.map(r => ({ id: r.id, label: r.name }))}
                selectedIds={filters.regiao}
                onChange={(vals: string[]) => setFilters(f => ({ ...f, regiao: vals }))}
              />
            </div>

            <div className="col-span-full flex justify-end mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setFilters(defaultFilters)}
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
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('active')}>
                  Status {renderSortIcon('active')}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('legal_name')}>
                  Razão Social {renderSortIcon('legal_name')}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('fantasy_name')}>
                  Nome Fantasia {renderSortIcon('fantasy_name')}
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('document')}>
                  CNPJ/CPF {renderSortIcon('document')}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('city')}>
                  Município/UF {renderSortIcon('city')}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('region_name')}>
                  Região {renderSortIcon('region_name')}
                </th>
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
                    <td className="px-4 py-3 font-medium text-foreground">
                      {customer.legal_name || customer.nickname || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-foreground">{customer.fantasy_name || '-'}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{customer.document || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.city ? `${customer.city}${customer.state ? `/${customer.state}` : ''}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs uppercase">
                      {customer.region?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Link to={`/cadastros/clientes/${customer.id}/editar`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10" title={isManager ? "Editar" : "Visualizar"}>
                            {isManager ? <Edit2 className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                          </Button>
                        </Link>
                        {isManager && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(customer.id, customer.nickname || customer.fantasy_name || '')}
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
